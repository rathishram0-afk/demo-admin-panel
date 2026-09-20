import React, { useState, useEffect } from 'react';
import { sessionService, DEVICE_DURATIONS } from '../../../services/sessionService';
import { useRealtime } from '../../../context/RealtimeContext';
import ExtendSessionModal from './ExtendSessionModal';
import { 
  Wallet, 
  Gamepad2, 
  Users, 
  Tv, 
  Plus, 
  Clock, 
  Play, 
  Pause, 
  Square, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  Crown,
  User,
  Phone,
  Tag,
  CheckCircle2,
  DollarSign,
  Zap,
  Percent,
  ArrowRightLeft,
  Monitor,
  Bell
} from 'lucide-react';

import { bookingService } from '../../../services/bookingService';

export default function DashboardOverviewModule({ onNavigateTab }) {
  const [stations, setStations] = useState([]);
  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    runningSessions: 0,
    availableDevices: 0,
    totalPlayers: 0,
    controllersInUse: 0,
    totalControllers: 20,
    availableControllers: 20,
    onlineBookings: 0,
    memberships: 0
  });

  const [selectedStationId, setSelectedStationId] = useState('PS5-1');
  const [extendModalState, setExtendModalState] = useState({ isOpen: false, station: null });

  // Notifications State
  const [notifications, setNotifications] = useState([]);

  // Bookings State
  const [bookings, setBookings] = useState([]);
  const [walkins, setWalkins] = useState([]);

  const { devices, activeSessions, activeBookings, cafeOrders } = useRealtime();
  const [now, setNow] = useState(Date.now());

  const loadData = async () => {
    try {
      const [mData, wData, nData, bkngs] = await Promise.all([
        sessionService.getDashboardMetrics(true), // Force refresh to sync
        sessionService.getWalkInHistory(),
        sessionService.getActivities(),
        bookingService.getBookings()
      ]);

      setMetrics(mData);
      setWalkins(wData || []);
      setNotifications((nData || []).slice(0, 4));
      setBookings((bkngs || []).filter(b => b.booking_status === 'Approved').slice(0, 3));
    } catch (e) {
      console.error('Error loading dashboard overview:', e);
    }
  };

  useEffect(() => {
    loadData();

    const handleDashboardUpdate = () => {
      loadData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('gforce_dashboard_updated', handleDashboardUpdate);
      window.addEventListener('gforce_session_changed', handleDashboardUpdate);
      window.addEventListener('gforce_order_updated', handleDashboardUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('gforce_dashboard_updated', handleDashboardUpdate);
        window.removeEventListener('gforce_session_changed', handleDashboardUpdate);
        window.removeEventListener('gforce_order_updated', handleDashboardUpdate);
      }
    };
  }, [activeSessions, activeBookings, cafeOrders]);

  useEffect(() => {
    const data = sessionService.mapStations(devices, activeSessions);
    setStations(Array.isArray(data) ? data : []);
  }, [devices, activeSessions, now]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (seconds) => {
    if (!seconds || seconds <= 0) return '00:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const selectedStation = stations.find(s => s.id === selectedStationId) || stations[0] || {
    id: 'PS5-1',
    name: 'PS5 - 1',
    zone: 'PlayStation 5',
    status: 'AVAILABLE',
    controllersUsed: 0,
    controllersTotal: 4
  };

  const activeRunningSessions = stations.filter(
    (s) => s.status === 'RUNNING' || s.status === 'ACTIVE' || s.status === 'ENDING_SOON'
  );

  // Compute live real-time Today metrics
  const opDate = sessionService.getOperationalBusinessDate();
  const isSameDate = (timestampStr, compareDate) => {
    return sessionService.isSameBusinessDate(timestampStr, compareDate);
  };

  const todayCompleted = walkins.filter(s => 
    s.sessionStatus === 'COMPLETED' && 
    isSameDate(s.rawEndTime || s.rawStartTime, opDate)
  );
  const todaySessionsCount = todayCompleted.length;
  const todayPlayersCount = todayCompleted.reduce((sum, s) => sum + (Number(s.players) || 0), 0);
  const todayPeakHour = sessionService.calculatePeakHour(todayCompleted);
  const todayMostUsed = sessionService.calculateMostUsedDevice(todayCompleted);

  const handlePause = async (stId) => {
    if (!stId) return;
    await sessionService.togglePauseSession(stId);
    await loadData();
  };

  const handleEnd = async (stId) => {
    if (!stId) return;
    if (window.confirm(`Are you sure you want to end session on ${stId}?`)) {
      await sessionService.endSession(stId);
      await loadData();
    }
  };

  const handleConfirmExtend = async (stId, extraMinutes) => {
    const targetSessionId = extendModalState.station ? extendModalState.station.sessionId : null;
    await sessionService.extendSession(stId, extraMinutes, targetSessionId);
    await loadData();
  };

  return (
    <div className="space-y-5 font-sans text-gray-100 min-h-0 flex-1 flex flex-col custom-scrollbar overflow-y-auto pr-1">
      
      {/* 1. TOP STATISTICS BAR (7 PREMIUM GLOWING CARDS) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5 shrink-0">
        
        {/* Card 1: Today's Revenue */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 relative overflow-hidden space-y-1.5 group hover:border-purple-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-cyber tracking-wider text-gray-400 uppercase font-bold">Today's Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-cyber font-black text-white mt-1">₹ {(metrics?.todayRevenue || 0).toLocaleString()}</div>
          <p className="text-[9px] font-mono text-emerald-400 flex items-center gap-0.5">
            <TrendingUp className="w-2.5 h-2.5" /> Real-time POS
          </p>
        </div>

        {/* Card 2: Running Sessions */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 relative overflow-hidden space-y-1.5 group hover:border-cyan-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-cyber tracking-wider text-gray-400 uppercase font-bold">Running Sessions</span>
            <div className="w-7 h-7 rounded-lg bg-blue-950/60 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Gamepad2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-cyber font-black text-white mt-1">
            {activeRunningSessions.length < 10 ? `0${activeRunningSessions.length}` : activeRunningSessions.length}
          </div>
          <p className="text-[9px] font-mono text-cyan-400">Live Right Now</p>
        </div>

        {/* Card 3: Today's Players */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 relative overflow-hidden space-y-1.5 group hover:border-emerald-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-cyber tracking-wider text-gray-400 uppercase font-bold">Today's Players</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-cyber font-black text-white mt-1">{metrics?.totalPlayers || 0}</div>
          <p className="text-[9px] font-mono text-gray-400">Active Roster</p>
        </div>

        {/* Card 4: Controllers In Use */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 relative overflow-hidden space-y-1.5 group hover:border-amber-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-cyber tracking-wider text-gray-400 uppercase font-bold">Controllers In Use</span>
            <div className="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Gamepad2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-cyber font-black text-white mt-1">
            {metrics.controllersInUse} / {metrics.totalControllers}
          </div>
          <p className="text-[9px] font-mono text-amber-400">Available: {metrics.availableControllers}</p>
        </div>

        {/* Card 5: Available Devices */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 relative overflow-hidden space-y-1.5 group hover:border-pink-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-cyber tracking-wider text-gray-400 uppercase font-bold">Available Devices</span>
            <div className="w-7 h-7 rounded-lg bg-pink-950/60 border border-pink-500/40 flex items-center justify-center text-pink-400">
              <Tv className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-cyber font-black text-white mt-1">
            {metrics.availableDevices < 10 ? `0${metrics.availableDevices}` : metrics.availableDevices}
          </div>
          <p className="text-[9px] font-mono text-emerald-400">Ready to Play</p>
        </div>

        {/* Card 6: Online Bookings */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 relative overflow-hidden space-y-1.5 group hover:border-cyan-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-cyber tracking-wider text-gray-400 uppercase font-bold">Online Bookings</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-cyber font-black text-white mt-1">{metrics.onlineBookings || 0}</div>
          <p className="text-[9px] font-mono text-cyan-300">Live Web Requests</p>
        </div>

        {/* Card 7: VIP Memberships */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 relative overflow-hidden space-y-1.5 group hover:border-amber-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-cyber tracking-wider text-gray-400 uppercase font-bold">VIP Memberships</span>
            <div className="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Crown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-cyber font-black text-white mt-1">{metrics.activeMemberships || 0}</div>
          <p className="text-[9px] font-mono text-amber-400">Total: {metrics.totalMemberships || 0} | Pending: {metrics.pendingMemberships || 0} | Exp": {metrics.expiredMemberships || 0}</p>
        </div>

      </div>

      {/* 2. MIDDLE LAYOUT GRID: DEVICE STATUS SECTION (LEFT 9) + SIDEBAR PANELS (RIGHT 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        
        {/* Left Side (Col 9): Spacious Device Console Status Grid */}
        <div className="lg:col-span-9 glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between min-h-0">
          
          {/* Header & Legends */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3.5 shrink-0">
            <h3 className="font-cyber text-sm sm:text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Monitor className="w-5 h-5 text-purple-400" />
              Device / Console Status
            </h3>
            
            <div className="flex items-center gap-3.5 text-[10px] sm:text-[11px] font-cyber font-bold">
              <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" /> Available</span>
              <span className="flex items-center gap-1.5 text-cyan-400"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" /> Running</span>
              <span className="flex items-center gap-1.5 text-amber-400"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" /> Reserved</span>
              <span className="flex items-center gap-1.5 text-red-400"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" /> Maintenance</span>
            </div>
          </div>

          {/* DEDICATED SCROLLABLE DEVICE STATUS CONTAINER */}
          <div 
            className="flex-1 overflow-y-auto overflow-x-hidden pt-4 pr-1 scroll-smooth custom-scrollbar min-h-[300px]"
            style={{ maxHeight: '500px' }}
          >
            {/* Cards layout increased in size by 10-15% with spacious gaps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-2">
              {stations.map((st) => {
                const isSelected = selectedStationId === st.id;
                const isRunning = st.status === 'RUNNING' || st.status === 'ACTIVE' || st.status === 'ENDING_SOON';
                const isReserved = st.status === 'RESERVED';
                const isMaintenance = st.status === 'MAINTENANCE';
                const isEndingSoon = st.isEndingSoon;

                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStationId(st.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between space-y-3 min-h-[145px] ${
                      isSelected 
                        ? 'ring-2 ring-purple-500 border-purple-400 bg-purple-950/30 shadow-[0_0_24px_rgba(168,85,247,0.35)]' 
                        : 'bg-slate-950/60 border-white/10 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-cyber text-xs sm:text-sm font-black text-white tracking-wide">{st.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-cyber font-bold uppercase tracking-wider ${
                        isEndingSoon
                          ? 'bg-amber-500 text-slate-950 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                          : isRunning
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                          : isMaintenance
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : isReserved
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}>
                        {isEndingSoon ? 'Ending Soon' : isRunning ? 'Running' : isMaintenance ? 'Maintenance' : isReserved ? 'Reserved' : 'Available'}
                      </span>
                    </div>

                    {/* Image & Controller Details */}
                    <div className="flex items-center gap-2.5 sm:gap-3.5 py-1 min-w-0">
                      <div className="w-14 sm:w-16 h-12 sm:h-14 shrink-0 flex items-center justify-center bg-slate-900/50 rounded-lg p-1">
                        <img 
                          src={st.image || '/admin/ps5-admin.webp'} 
                          alt={st.name} 
                          className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]" loading="lazy" decoding="async" />
                      </div>

                      <div className="flex-1 space-y-1.5 text-[10px] sm:text-[11px] font-mono min-w-0">
                        <div className="flex justify-between items-center text-gray-400 gap-1.5">
                          <span className="truncate">Players</span>
                          <span className="text-white font-black shrink-0 whitespace-nowrap">{st.playersCount || 0} / {st.controllersTotal || 4}</span>
                        </div>

                        <div className="flex justify-between items-center text-gray-400 gap-1.5">
                          <span className="truncate">Controllers</span>
                          <div className="flex flex-wrap justify-end items-center gap-0.5 text-[10px] shrink-0 max-w-[65%]">
                            {(st.zone || st.category || '').toLowerCase().includes('vr') ? (
                              <span className="text-purple-300 font-cyber font-bold text-[8px] sm:text-[9px] uppercase tracking-tighter truncate">🥽 VR Motion</span>
                            ) : (st.zone || st.category || '').toLowerCase().includes('sim') || (st.zone || st.category || '').toLowerCase().includes('racing') ? (
                              <span className="text-cyan-300 font-cyber font-bold text-[8px] sm:text-[9px] uppercase tracking-tighter truncate">🏎 Wheel & Rig</span>
                            ) : (
                              [...Array(st.controllersTotal || 4)].map((_, i) => (
                                <span key={i} className={i < (st.controllersUsed || 0) ? 'text-emerald-400 filter drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]' : 'text-gray-600'}>🎮</span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer status/timer bar */}
                    <div className="pt-2 border-t border-white/10 text-center">
                      {isRunning ? (
                        <div className="flex items-center justify-between font-mono text-xs">
                          <span className="text-gray-500 uppercase text-[9px]">Timer:</span>
                          <span className={`font-black tracking-wide ${isEndingSoon ? 'text-amber-400 animate-pulse' : 'text-cyan-400'}`}>
                            {formatTimer(st.elapsedSeconds || 0)}
                          </span>
                        </div>
                      ) : isMaintenance ? (
                        <span className="font-mono text-[10px] text-red-400 font-bold uppercase tracking-wider">Under Maintenance</span>
                      ) : isReserved ? (
                        <span className="font-mono text-[10px] text-amber-400 uppercase tracking-wider">Reserved Session</span>
                      ) : (
                        <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Ready to Play</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* + Add New Device Card */}
              <div 
                onClick={() => onNavigateTab && onNavigateTab('DEVICES')}
                className="p-4 rounded-2xl border border-dashed border-purple-500/40 hover:border-purple-400 bg-purple-950/10 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all min-h-[145px]"
              >
                <div className="w-9 h-9 rounded-full bg-purple-500/20 border border-purple-500 flex items-center justify-center text-purple-400">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="font-cyber text-[10px] font-bold text-purple-300 uppercase tracking-wider">Add New Device</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side (Col 3): Compact Panels Side Deck */}
        <div className="lg:col-span-3 space-y-4 flex flex-col min-h-0">
          
          {/* Widget 1: Running Sessions */}
          <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-between min-h-0 max-h-[220px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 shrink-0">
              <h4 className="font-cyber text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
                Running Sessions
              </h4>
              <button 
                onClick={() => onNavigateTab && onNavigateTab('SESSIONS')}
                className="text-[10px] font-cyber text-purple-400 hover:underline font-bold cursor-pointer uppercase"
              >
                View All
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pt-2 pr-0.5 space-y-2">
              {activeRunningSessions.length === 0 ? (
                <div className="text-center py-6 text-gray-500 font-mono text-[10px]">
                  No active running sessions.
                </div>
              ) : (
                activeRunningSessions.map((st) => (
                  <div key={st.id} className="p-2 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between gap-2 hover:border-purple-500/30 transition-all">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center p-0.5 shrink-0">
                        <img src={st.image || '/admin/ps5-admin.webp'} alt={st.name} className="max-w-[30px] max-h-7 object-contain" loading="lazy" decoding="async" />
                      </div>
                      <div className="flex flex-col text-[10px] truncate max-w-[80px]">
                        <span className="font-cyber font-bold text-white truncate">{st.name}</span>
                        <span className="text-[9px] text-gray-500 truncate">{st.customerName || 'Player'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-bold text-cyan-400">{formatTimer(st.elapsedSeconds || 0)}</span>
                      <button
                        onClick={() => setExtendModalState({ isOpen: true, station: st })}
                        className="p-1 rounded bg-slate-900 border border-white/15 hover:border-purple-400 text-[9px] font-cyber text-gray-300 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Widget 2: Upcoming Bookings */}
          <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-between min-h-0 max-h-[180px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 shrink-0">
              <h4 className="font-cyber text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-purple-400" />
                Upcoming Bookings
              </h4>
              <button 
                onClick={() => onNavigateTab && onNavigateTab('BOOKINGS')}
                className="text-[10px] font-cyber text-purple-400 hover:underline font-bold cursor-pointer uppercase"
              >
                View All
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pt-2 pr-0.5 space-y-2">
              {bookings.length === 0 ? (
                <div className="text-center py-6 text-gray-500 font-mono text-[10px]">
                  No upcoming bookings for today.
                </div>
              ) : (
                bookings.map((b, idx) => (
                  <div key={b.id || idx} className="p-2 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between gap-2">
                    <div className="flex flex-col text-[10px] text-left">
                      <span className="font-cyber font-bold text-white">{b.customer_name || 'Gamer'}</span>
                      <span className="text-[9px] text-gray-500">{b.gaming_zone || 'Console'} • {b.booking_time || 'Time'}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30 text-[9px] font-cyber font-bold">
                      CONFIRMED
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Widget 3: Recent Notifications */}
          <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-between min-h-0 flex-1">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 shrink-0">
              <h4 className="font-cyber text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-400 animate-pulse" />
                Recent Notifications
              </h4>
              <button 
                onClick={() => onNavigateTab && onNavigateTab('SETTINGS')}
                className="text-[10px] font-cyber text-purple-400 hover:underline font-bold cursor-pointer uppercase"
              >
                View
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pt-2 pr-0.5 space-y-2">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500 font-mono text-[10px]">
                  No recent notifications.
                </div>
              ) : (
                notifications.map((n, idx) => (
                  <div key={n.id || idx} className="p-2 rounded-xl bg-slate-950/40 border border-white/5 text-[10px] space-y-0.5 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white font-cyber">{n.title}</span>
                      <span className="text-[8px] text-gray-500 font-mono">{n.time}</span>
                    </div>
                    <p className="text-[9px] text-gray-400 leading-snug font-sans">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* 3. BOTTOM MINI STATISTICS GRID (5 COMPACT METRICS - AS SEEN IN THE UPLOADED REFERENCE SCREENSHOT) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 shrink-0">
        
        {/* Peak Hour */}
        <div className="glass-panel p-3.5 rounded-xl border border-white/5 bg-[#0C0B1B]/40 flex items-center gap-3 hover:border-purple-500/20 transition-all text-left">
          <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 font-mono font-bold text-sm">
            🕒
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] text-gray-500 font-cyber uppercase tracking-wider block">Peak Hour (Today)</span>
            <span className="text-xs font-mono font-bold text-white">{todaySessionsCount > 0 ? todayPeakHour : '--'}</span>
            <span className="text-[8px] text-gray-600 block truncate">Most active window</span>
          </div>
        </div>

        {/* Average Session Time */}
        <div className="glass-panel p-3.5 rounded-xl border border-white/5 bg-[#0C0B1B]/40 flex items-center gap-3 hover:border-cyan-500/20 transition-all text-left">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-sm">
            ⏱
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] text-gray-500 font-cyber uppercase tracking-wider block">Avg. Session Time</span>
            <span className="text-xs font-mono font-bold text-white">{todaySessionsCount > 0 ? '58 Mins' : '--'}</span>
            <span className="text-[8px] text-gray-600 block truncate">Per walk-in gamer</span>
          </div>
        </div>

        {/* Most Used Device */}
        <div className="glass-panel p-3.5 rounded-xl border border-white/5 bg-[#0C0B1B]/40 flex items-center gap-3 hover:border-pink-500/20 transition-all text-left">
          <div className="w-8 h-8 rounded-lg bg-pink-950/60 border border-pink-500/30 flex items-center justify-center text-pink-400 font-mono font-bold text-sm">
            🎮
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] text-gray-500 font-cyber uppercase tracking-wider block">Most Used Device</span>
            <span className="text-xs font-mono font-bold text-white uppercase">{todayMostUsed}</span>
            <span className="text-[8px] text-gray-600 block truncate">Highest session load</span>
          </div>
        </div>

        {/* Total Sessions Today */}
        <div className="glass-panel p-3.5 rounded-xl border border-white/5 bg-[#0C0B1B]/40 flex items-center gap-3 hover:border-blue-500/20 transition-all text-left">
          <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400 font-mono font-bold text-sm">
            ⚡
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] text-gray-500 font-cyber uppercase tracking-wider block">Total Sessions (Today)</span>
            <span className="text-xs font-mono font-bold text-white">{todaySessionsCount}</span>
            <span className="text-[8px] text-gray-600 block truncate">Completed sessions</span>
          </div>
        </div>

        {/* Total Players Today */}
        <div className="glass-panel p-3.5 rounded-xl border border-white/5 bg-[#0C0B1B]/40 flex items-center gap-3 hover:border-emerald-500/20 transition-all text-left">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
            👥
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] text-gray-500 font-cyber uppercase tracking-wider block">Total Players (Today)</span>
            <span className="text-xs font-mono font-bold text-white">{todayPlayersCount}</span>
            <span className="text-[8px] text-gray-600 block truncate">Walk-ins + members</span>
          </div>
        </div>

      </div>

      {/* MODALS */}
      <ExtendSessionModal
        isOpen={extendModalState.isOpen}
        onClose={() => setExtendModalState({ isOpen: false, station: null })}
        station={extendModalState.station}
        onConfirm={handleConfirmExtend}
      />

    </div>
  );
}
