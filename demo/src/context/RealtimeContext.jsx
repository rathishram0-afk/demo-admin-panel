import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { deviceService } from '../services/deviceService';
import { sessionService } from '../services/sessionService';

const RealtimeContext = createContext();

export const useRealtime = () => useContext(RealtimeContext);

export const RealtimeProvider = ({ children }) => {
  const [activeSessions, setActiveSessions] = useState([]);
  const [devices, setDevices] = useState([]);
  const [cafeOrders, setCafeOrders] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        devicesData,
        sessionsRes,
        ordersRes,
        bookingsRes
      ] = await Promise.all([
        deviceService.getDevices(),
        supabase.from('walkin_sessions').select('*').in('session_status', ['Active', 'Paused', 'Scheduled', 'active', 'paused', 'scheduled', 'ACTIVE', 'PAUSED', 'SCHEDULED']),
        supabase.from('cafe_orders').select('*').in('status', ['Pending', 'Preparing', 'Ready']),
        supabase.from('bookings').select('*').in('booking_status', ['Confirmed', 'Playing'])
      ]);

      setDevices(devicesData || []);
      setActiveSessions(sessionsRes.data || []);
      setCafeOrders(ordersRes.data || []);
      setActiveBookings(bookingsRes.data || []);
      
    } catch (err) {
      console.error("Error fetching initial realtime data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const activeSessionsRef = useRef([]);
  const devicesRef = useRef([]);

  // Keep refs up to date
  useEffect(() => {
    activeSessionsRef.current = activeSessions;
    devicesRef.current = devices;
  }, [activeSessions, devices]);

  // Global Scheduled Session Auto-Starter & 12:00 PM Daily Auto-Reset Trigger
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      const sessions = activeSessionsRef.current;
      const allDevices = devicesRef.current;
      if (sessions && allDevices) {
        sessions.forEach(session => {
          if (String(session.session_status || '').toLowerCase() === 'active' && session.start_time && session.created_at) {
            const startMs = new Date(session.start_time).getTime();
            const createdMs = new Date(session.created_at).getTime();
            
            // Identify if it was manually scheduled (start time is meaningfully after creation time)
            if (startMs > createdMs + 5000) {
              if (startMs <= now) {
                const device = allDevices.find(d => d.id === session.device_id || d.device_code === session.device_id);
                // Only trigger if device hasn't been set to RUNNING yet, and we haven't already marked it locally
                if (device && String(device.status || '').toUpperCase() !== 'RUNNING' && !session._isStarting) {
                  session._isStarting = true;
                  sessionService.autoStartScheduledSession(session.id);
                }
              }
            }
          }
        });
      }

      // Check for 12:00 PM Daily Auto Reset
      sessionService.checkAndPerformDailyAutoReset().catch(() => {});
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    fetchInitialData();

    const handleLocalSessionChange = (e) => {
      const payload = e.detail;
      if (!payload) return;
      if (payload.eventType === 'INSERT' && payload.new) {
        setActiveSessions(prev => {
          const exists = prev.some(s => s.id === payload.new.id || s.session_code === payload.new.session_code);
          if (exists) return prev.map(s => (s.id === payload.new.id || s.session_code === payload.new.session_code) ? payload.new : s);
          return [...prev, payload.new];
        });
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        setActiveSessions(prev => {
          const statusClean = String(payload.new.session_status || '').toLowerCase().trim();
          const isRelevant = statusClean === 'active' || statusClean === 'paused' || statusClean === 'scheduled';
          const exists = prev.some(s => s.id === payload.new.id || s.session_code === payload.new.session_code);
          if (isRelevant && exists) return prev.map(s => (s.id === payload.new.id || s.session_code === payload.new.session_code) ? payload.new : s);
          if (isRelevant && !exists) return [...prev, payload.new];
          if (!isRelevant && exists) return prev.filter(s => s.id !== payload.new.id && s.session_code !== payload.new.session_code);
          return prev;
        });
      } else if (payload.eventType === 'DELETE' && payload.old) {
        setActiveSessions(prev => prev.filter(s => s.id !== payload.old.id));
      }
    };

    const handleDataReset = () => {
      // Re-fetch everything, which will be empty arrays after reset
      fetchInitialData();
    };

    window.addEventListener('gforce_session_changed', handleLocalSessionChange);
    window.addEventListener('gforce_data_reset', handleDataReset);

    const walkinSub = supabase
      .channel('public:walkin_sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'walkin_sessions' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const statusClean = String(payload.new.session_status || '').toLowerCase().trim();
          if (statusClean === 'active' || statusClean === 'paused' || statusClean === 'scheduled') {
            setActiveSessions(prev => {
              if (prev.some(s => s.id === payload.new.id || s.session_code === payload.new.session_code)) return prev;
              return [...prev, payload.new];
            });
          }
        } else if (payload.eventType === 'UPDATE') {
          setActiveSessions(prev => {
            const statusClean = String(payload.new.session_status || '').toLowerCase().trim();
            const isRelevant = statusClean === 'active' || statusClean === 'paused' || statusClean === 'scheduled';
            const exists = prev.some(s => s.id === payload.new.id || s.session_code === payload.new.session_code);
            
            if (isRelevant && exists) {
              return prev.map(s => (s.id === payload.new.id || s.session_code === payload.new.session_code) ? payload.new : s);
            } else if (isRelevant && !exists) {
              return [...prev, payload.new];
            } else if (!isRelevant && exists) {
              return prev.filter(s => s.id !== payload.new.id && s.session_code !== payload.new.session_code);
            }
            return prev;
          });
        } else if (payload.eventType === 'DELETE') {
          setActiveSessions(prev => prev.filter(s => s.id !== payload.old.id));
        }
      })
      .subscribe();

    const devicesSub = supabase
      .channel('public:devices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setDevices(prev => prev.map(d => d.id === payload.new.id ? payload.new : d));
        }
      })
      .subscribe();
      
    const ordersSub = supabase
      .channel('public:cafe_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cafe_orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          if (['Pending', 'Preparing', 'Ready'].includes(payload.new.status)) {
             setCafeOrders(prev => [...prev, payload.new]);
          }
        } else if (payload.eventType === 'UPDATE') {
          setCafeOrders(prev => {
             const isRelevant = ['Pending', 'Preparing', 'Ready'].includes(payload.new.status);
             const exists = prev.some(o => o.id === payload.new.id);
             if (isRelevant && exists) return prev.map(o => o.id === payload.new.id ? payload.new : o);
             if (isRelevant && !exists) return [...prev, payload.new];
             if (!isRelevant && exists) return prev.filter(o => o.id !== payload.new.id);
             return prev;
          });
        } else if (payload.eventType === 'DELETE') {
          setCafeOrders(prev => prev.filter(o => o.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      window.removeEventListener('gforce_session_changed', handleLocalSessionChange);
      window.removeEventListener('gforce_data_reset', handleDataReset);
      supabase.removeChannel(walkinSub);
      supabase.removeChannel(devicesSub);
      supabase.removeChannel(ordersSub);
    };
  }, [fetchInitialData]);
  
  const value = useMemo(() => ({
    activeSessions,
    devices,
    cafeOrders,
    activeBookings,
    isLoading,
    refreshData: fetchInitialData
  }), [activeSessions, devices, cafeOrders, activeBookings, isLoading, fetchInitialData]);

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};
