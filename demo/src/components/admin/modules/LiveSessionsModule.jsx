import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { sessionService } from '../../../services/sessionService';
import { useRealtime } from '../../../context/RealtimeContext';
import LiveSessionCard from './LiveSessionCard';
import ExtendSessionModal from './ExtendSessionModal';
import SessionEndingAlertModal from './SessionEndingAlertModal';
import { 
  Gamepad2, 
  Clock, 
  Play, 
  Pause, 
  Square, 
  AlertTriangle, 
  User, 
  Phone, 
  PlusCircle, 
  Calendar,
  CheckCircle2,
  Tv,
  UtensilsCrossed,
  Printer,
  X,
  BellRing,
  Shuffle
} from 'lucide-react';

import { deviceImages, getDeviceImage } from '../../../utils/deviceImages';

export default function LiveSessionsModule() {
  const { devices, activeSessions } = useRealtime();
  const [stations, setStations] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    runningSessions: 0,
    availableDevices: 9,
    totalDevices: 9
  });
  
  // Modals state
  const [extendModalStation, setExtendModalStation] = useState(null);
  const [alertModalStation, setAlertModalStation] = useState(null);
  const [endConfirmStation, setEndConfirmStation] = useState(null);
  const [completedBillModal, setCompletedBillModal] = useState(null);
  const [shiftModalStation, setShiftModalStation] = useState(null);
  const [selectedTargetStationId, setSelectedTargetStationId] = useState('');
  const [shiftError, setShiftError] = useState('');
  const [isShifting, setIsShifting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [handledAlertsMap, setHandledAlertsMap] = useState({});
  const [autoOpenedCompletionMap, setAutoOpenedCompletionMap] = useState({});

  const buildBillModalState = (target, isAuto = false) => {
    const stationId = target.id;
    const nowMs = Date.now();
    const startTimeStr = target.startTime ? new Date(target.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
    const endTimeStr = new Date(nowMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const pStatus = String(target.paymentStatus || '').toLowerCase();
    const isPrepaid = target.isPrepaid === true || target.pricingSnapshot?.isPrepaid === true || pStatus === 'prepaid' || pStatus === 'paid';

    const gamingCharge = Number(target.price || target.gaming_charge || 0);
    const foodTotal = Number(target.snackTotal || target.food_total || 0);
    const amountDue = isPrepaid ? foodTotal : (gamingCharge + foodTotal);

    const initMethod = target.paymentMethod || target.pricingSnapshot?.paymentMethod || 'Cash';

    return {
      stationId,
      sessionId: target.sessionId,
      deviceName: target.name || target.id,
      zone: target.zone || target.category,
      customerName: target.customerName || 'Walk-in Player',
      phone: target.phone || '-',
      playersCount: target.playersCount || 1,
      startTime: startTimeStr,
      endTime: endTimeStr,
      purchasedDuration: target.bookedDuration || `${target.durationMinutes} Mins`,
      bookingIdRef: target.bookingIdRef,
      gamingCharge: gamingCharge,
      foodTotal: foodTotal,
      snackOrders: target.snackOrders || [],
      grandTotal: amountDue,
      amountDue: amountDue,
      isPrepaid: isPrepaid,
      initialPaymentMethod: initMethod,
      paymentMethod: isPrepaid && foodTotal === 0 ? initMethod : 'Cash',
      isAutoCompleted: isAuto
    };
  };

  const handleOpenEndConfirm = (target) => {
    setCompletedBillModal(buildBillModalState(target, false));
  };

  useEffect(() => {
    let active = true;
    const fetchMetrics = async () => {
      const m = await sessionService.getDashboardMetrics();
      if (active) setMetrics(m);
    };
    fetchMetrics();
    return () => { active = false; };
  }, [activeSessions]); // Re-fetch only when a session ends/starts
  
  useEffect(() => {
    try {
      const data = sessionService.mapStations(devices, activeSessions);
      setStations(data);

      // Auto-End and 5-Minute Warning Checks
      for (const st of data) {
        if (st.status === 'RUNNING' || st.status === 'ACTIVE' || st.status === 'ENDING_SOON') {
          // Auto End Session when remaining time reaches 00:00:00 - Freeze and prompt
          if (st.remainingSeconds <= 0 && st.startTime) {
            if (!autoOpenedCompletionMap[st.id] && completedBillModal?.stationId !== st.id) {
              const stationId = st.id;
              setCompletedBillModal(buildBillModalState(st, true));
              setAutoOpenedCompletionMap(prev => ({ ...prev, [stationId]: true }));
              setAlertModalStation(null);
              setToastMessage(`⚡ Timer reached 00:00 on ${st.name || stationId}. Please confirm payment.`);
              setTimeout(() => setToastMessage(null), 8000);
            }
            continue; // Continue to next station instead of breaking, timer is frozen at 0
          } 
          // 5-minute warning check
          if (st.remainingSeconds <= 300 && st.remainingSeconds > 0) {
            let alertsTriggered = {};
            try {
              alertsTriggered = JSON.parse(localStorage.getItem('gforce_alerts_5min_triggered') || '{}');
            } catch (e) {
              alertsTriggered = {};
            }

            const alertKey = st.currentSessionId || st.id;
            if (!alertsTriggered[alertKey]) {
              alertsTriggered[alertKey] = true;
              localStorage.setItem('gforce_alerts_5min_triggered', JSON.stringify(alertsTriggered));

              sessionService.addNotification('Session Ending Soon', `${st.name || st.id} session will end in 5 minutes.`, 'ALERT');

              setAlertModalStation(st);
              setToastMessage(`⚠ ${st.name || st.id} session will end in 5 minutes! Leader: ${st.customerName || 'Player'}`);
              setHandledAlertsMap(prev => ({ ...prev, [st.id]: true }));
              setTimeout(() => setToastMessage(null), 6000);
            }
          } else if (st.remainingSeconds > 300) {
            let alertsTriggered = {};
            try {
              alertsTriggered = JSON.parse(localStorage.getItem('gforce_alerts_5min_triggered') || '{}');
            } catch (e) {
              alertsTriggered = {};
            }
            const alertKey = st.currentSessionId || st.id;
            if (alertsTriggered[alertKey]) {
              delete alertsTriggered[alertKey];
              localStorage.setItem('gforce_alerts_5min_triggered', JSON.stringify(alertsTriggered));
            }
            if (handledAlertsMap[st.id]) {
              setHandledAlertsMap(prev => {
                const copy = { ...prev };
                delete copy[st.id];
                return copy;
              });
            }
          }
        }
      }
    } catch (e) {
      console.error('Error processing live sessions:', e);
    }
  }, [devices, activeSessions, now, handledAlertsMap, autoOpenedCompletionMap, completedBillModal]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSeconds) => {
    if (!totalSeconds || totalSeconds < 0) return '00:00:00';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePauseResume = async (stationId, sessionId) => {
    await sessionService.togglePauseSession(stationId, sessionId);
  };

  const handleConfirmExtend = async (stationId, mins) => {
    const targetSessionId = extendModalStation ? extendModalStation.sessionId : null;
    await sessionService.extendSession(stationId, mins, targetSessionId);
    setExtendModalStation(null);
    setAlertModalStation(null);
    setHandledAlertsMap(prev => {
      const copy = { ...prev };
      delete copy[stationId];
      return copy;
    });
    setAutoOpenedCompletionMap(prev => {
      const copy = { ...prev };
      delete copy[stationId];
      return copy;
    });
  };

  const handleConfirmShift = async () => {
    if (!shiftModalStation || !selectedTargetStationId) {
      setShiftError('Please select a destination station.');
      return;
    }
    setShiftError('');
    setIsShifting(true);
    try {
      await sessionService.shiftSession(shiftModalStation.id, selectedTargetStationId, shiftModalStation.sessionId);
      const targetStationObj = stations.find(s => s.id === selectedTargetStationId);
      setToastMessage(`✅ Session shifted successfully from ${shiftModalStation.name || shiftModalStation.id} to ${targetStationObj?.name || selectedTargetStationId}.`);
      setTimeout(() => setToastMessage(null), 6000);
      setShiftModalStation(null);
      setSelectedTargetStationId('');
    } catch (err) {
      setShiftError(err.message || 'Failed to shift session.');
    } finally {
      setIsShifting(false);
    }
  };

  const handleConfirmPaymentSubmit = async () => {
    if (!completedBillModal || !completedBillModal.paymentMethod || completedBillModal.isSubmitting) return;
    const stationId = completedBillModal.stationId;
    const selectedPaymentMethod = completedBillModal.paymentMethod;
    const sessionId = completedBillModal.sessionId;

    const totalBill = completedBillModal.amountDue !== undefined ? completedBillModal.amountDue : completedBillModal.grandTotal;
    const isSplit = selectedPaymentMethod === 'Split' || selectedPaymentMethod === 'Split Payment';

    let splitPayload = null;
    if (isSplit) {
      const cash = Number(completedBillModal.splitBreakdown?.cash || 0);
      const upi = Number(completedBillModal.splitBreakdown?.upi || 0);
      const card = Number(completedBillModal.splitBreakdown?.card || 0);
      const totalPaid = cash + upi + card;
      if (totalPaid !== totalBill) {
        alert(`Split Payment total must equal bill amount of ₹${totalBill}. Currently: ₹${totalPaid}.`);
        return;
      }
      splitPayload = { cash, upi, card };
    }

    setCompletedBillModal(prev => ({ ...prev, isSubmitting: true }));

    try {
      await sessionService.endSession(
        stationId, 
        isSplit ? { paymentMethod: 'Split', splitBreakdown: splitPayload } : selectedPaymentMethod, 
        sessionId, 
        completedBillModal.grandTotal,
        splitPayload
      );
      setCompletedBillModal(null);
      setEndConfirmStation(null);
      setAlertModalStation(null);
      setHandledAlertsMap(prev => {
        const copy = { ...prev };
        delete copy[stationId];
        return copy;
      });
      setAutoOpenedCompletionMap(prev => {
        const copy = { ...prev };
        delete copy[stationId];
        return copy;
      });
    } catch (err) {
      console.error("Error ending session:", err);
      alert("Error ending session: " + err.message);
      setCompletedBillModal(prev => prev ? ({ ...prev, isSubmitting: false }) : null);
    }
  };

  const runningStationsList = stations.filter(s => s.status === 'RUNNING' || s.status === 'ACTIVE' || s.status === 'ENDING_SOON' || s.status === 'SCHEDULED');

  return (
    <div className="space-y-4 font-sans text-gray-100 min-h-0 flex-1 flex flex-col custom-scrollbar overflow-y-auto pr-1 relative">
      
      {/* TOP TOAST NOTIFICATION FOR 5-MIN ALERT */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className="glass-panel bg-amber-950/90 border-2 border-amber-500 text-amber-200 px-4 py-3 rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center gap-3 text-xs font-cyber font-bold">
            <BellRing className="w-5 h-5 text-amber-400 animate-pulse" />
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="p-1 rounded hover:bg-white/10 text-amber-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="glass-panel p-4 xl:p-5 rounded-2xl border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="font-cyber text-base xl:text-lg font-bold text-white tracking-wider flex items-center gap-2">
            <Play className="w-5 h-5 text-purple-400" /> LIVE SESSIONS MANAGEMENT POS
          </h2>
          <p className="text-xs text-gray-400">Real-time gaming timers, custom session extensions, device transfers & F&B billing</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-cyber font-bold flex items-center gap-2 shadow-md">
            <Clock className="w-4 h-4 text-cyan-400 animate-pulse" /> RUNNING: {metrics.runningSessions} / {metrics.totalDevices}
          </div>
        </div>
      </div>

      {/* RUNNING SESSIONS GRID */}
      {runningStationsList.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-white/10 text-center space-y-3">
          <Tv className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="font-cyber text-base font-bold text-gray-300 uppercase tracking-wider">No Active Sessions Running</h3>
          <p className="text-xs text-gray-500 font-mono">Convert an online booking from Booking Management or start a walk-in from POS to monitor live timers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {runningStationsList.map((st) => {
            const isEndingSoon = st.isEndingSoon;
            const isPaused = st.isPaused;
            const isScheduled = st.status === 'SCHEDULED';

            return (
              <LiveSessionCard
                key={st.id}
                st={st}
                isEndingSoon={isEndingSoon}
                isPaused={isPaused}
                isScheduled={isScheduled}
                setAlertModalStation={setAlertModalStation}
                handlePauseResume={handlePauseResume}
                setExtendModalStation={setExtendModalStation}
                handleOpenEndConfirm={handleOpenEndConfirm}
                onOpenShiftModal={(station) => {
                  setShiftModalStation(station);
                  setSelectedTargetStationId('');
                  setShiftError('');
                }}
              />
            );
          })}
        </div>
      )}

      {/* EXTEND SESSION MODAL */}
      <ExtendSessionModal
        station={extendModalStation}
        isOpen={Boolean(extendModalStation)}
        onClose={() => setExtendModalStation(null)}
        onConfirm={handleConfirmExtend}
      />

      {/* SHIFT SESSION MODAL */}
      {shiftModalStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel p-5 rounded-2xl border border-cyan-500/40 shadow-2xl space-y-4 text-left max-h-[90dvh] overflow-y-auto custom-scrollbar">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <h3 className="font-cyber font-bold text-white text-base flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-cyan-400" /> SHIFT SESSION
              </h3>
              <button
                onClick={() => { setShiftModalStation(null); setShiftError(''); }}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {shiftError && (
              <div className="p-3 rounded-xl bg-red-950/90 border border-red-500 text-red-200 text-xs font-cyber font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                {shiftError}
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Current Station:</span>
                <span className="text-white font-bold">{shiftModalStation.name} ({shiftModalStation.zone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Customer:</span>
                <span className="text-purple-300 font-bold">{shiftModalStation.customerName || 'Walk-in Player'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Remaining Time:</span>
                <span className="text-cyan-300 font-mono font-bold">{formatTimer(shiftModalStation.remainingSeconds)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Charged Amount:</span>
                <span className="text-emerald-400 font-mono font-bold">₹ {shiftModalStation.currentAmount || shiftModalStation.price || 0}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-cyber font-bold text-gray-300 uppercase block mb-1.5">
                Select Destination Station:
              </label>
              {(() => {
                const availableCompatibleStations = stations.filter(s =>
                  s.id !== shiftModalStation.id &&
                  s.status === 'AVAILABLE'
                );

                if (availableCompatibleStations.length === 0) {
                  return (
                    <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-mono text-center">
                      No available station for shift.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 gap-2">
                    {availableCompatibleStations.map(st => (
                      <button
                        type="button"
                        key={st.id}
                        onClick={() => {
                          setSelectedTargetStationId(st.id);
                          setShiftError('');
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-cyber font-bold transition-all text-left flex flex-col gap-0.5 cursor-pointer ${
                          selectedTargetStationId === st.id
                            ? 'bg-cyan-900/60 border-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                            : 'bg-[#0F1219] border-white/10 text-gray-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span className="truncate">{st.name}</span>
                        <span className="text-[10px] text-emerald-400 font-mono">AVAILABLE</span>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => { setShiftModalStation(null); setShiftError(''); }}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-xs font-cyber font-bold cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={!selectedTargetStationId || isShifting}
                onClick={handleConfirmShift}
                className={`px-5 py-2 rounded-xl text-xs font-cyber font-bold text-white uppercase tracking-wider transition-all ${
                  !selectedTargetStationId || isShifting
                    ? 'bg-gray-800 text-gray-500 border border-white/10 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer'
                }`}
              >
                {isShifting ? 'SHIFTING...' : 'CONFIRM SHIFT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5-MINUTE SESSION ENDING ALERT POPUP */}
      <SessionEndingAlertModal
        station={alertModalStation}
        isOpen={Boolean(alertModalStation)}
        onClose={() => setAlertModalStation(null)}
        onExtend={handleConfirmExtend}
        onEnd={(id) => {
          const st = stations.find(s => s.id === id);
          if (st) handleOpenEndConfirm(st);
        }}
      />

      {/* END SESSION CONFIRMATION MODAL */}
      {endConfirmStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#120817] border border-red-500/50 rounded-3xl p-6 relative shadow-[0_0_50px_rgba(239,68,68,0.3)] space-y-4 font-sans text-gray-100 text-center max-h-[90dvh] overflow-y-auto custom-scrollbar">
            <div className="w-12 h-12 rounded-2xl bg-red-950 border border-red-500/50 flex items-center justify-center text-red-400 mx-auto">
              <Square className="w-6 h-6 fill-red-400" />
            </div>

            <div>
              <h3 className="font-cyber text-base font-black text-white uppercase tracking-wider mb-1">
                Complete & End Session {endConfirmStation.currentSessionId || endConfirmStation.id}?
              </h3>
              <p className="text-xs text-gray-400 font-sans">
                Station <strong className="text-white">{endConfirmStation.name}</strong> ({endConfirmStation.customerName || 'Player'}) will be set back to <strong className="text-emerald-400">AVAILABLE</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-2 text-xs text-left">
              <div className="flex justify-between">
                <span className="text-gray-400">Customer:</span>
                <span className="text-white font-bold">{endConfirmStation.customerName || 'Walk-in Player'}</span>
              </div>
              {endConfirmStation.bookingIdRef && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Booking Reference:</span>
                  <span className="text-cyan-400 font-mono font-bold">{endConfirmStation.bookingIdRef}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Device:</span>
                <span className="text-purple-300 font-bold">{endConfirmStation.name} ({endConfirmStation.zone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Duration:</span>
                <span className="text-yellow-300 font-mono">{endConfirmStation.bookedDuration || `${endConfirmStation.durationMinutes} mins`}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 font-bold text-sm">
                <span className="text-gray-200">Final Bill Amount:</span>
                <span className="text-emerald-400 font-cyber">₹ {endConfirmStation.currentAmount || 0}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setEndConfirmStation(null)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 font-cyber font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEndSession}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-cyber font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.5)] cursor-pointer"
              >
                Complete Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMBINED BILL FINAL RECEIPT MODAL */}
      {completedBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel bg-[#0C0A1D]/95 border border-purple-500/40 rounded-2xl p-6 relative shadow-[0_0_50px_rgba(147,51,234,0.35)] space-y-4 font-sans text-gray-100 max-h-[90dvh] overflow-y-auto custom-scrollbar">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-cyber font-bold text-emerald-400 uppercase tracking-widest block">
                  ✓ Session Completed Successfully
                </span>
                <h3 className="font-cyber text-base font-bold text-white uppercase tracking-wider">
                  Final Bill: <span className="text-purple-400">{completedBillModal.deviceName || completedBillModal.stationId}</span>
                </h3>
              </div>
              <button onClick={() => setCompletedBillModal(null)} className="p-1 rounded-full hover:bg-white/10 text-gray-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-left">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Customer Name:</span>
                <span className="text-white font-bold">{completedBillModal.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Gaming Device / Zone:</span>
                <span className="text-purple-300 font-bold">{completedBillModal.deviceName || completedBillModal.stationId} ({completedBillModal.zone || 'Console'})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Players Count:</span>
                <span className="text-white font-mono font-bold">{completedBillModal.playersCount || 1} Player(s)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Start Time / End Time:</span>
                <span className="text-cyan-300 font-mono font-bold">{completedBillModal.startTime} → {completedBillModal.endTime}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Purchased Duration:</span>
                <span className="text-amber-300 font-mono font-bold">{completedBillModal.purchasedDuration}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Payment Status:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-cyber font-bold uppercase ${
                  completedBillModal.isPrepaid
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                    : 'bg-purple-950 text-purple-300 border border-purple-500/30'
                }`}>
                  {completedBillModal.isPrepaid ? 'PREPAID' : 'PAY AT CHECKOUT'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Gaming Session Charge:</span>
                <span className="text-white font-mono font-bold">
                  ₹ {completedBillModal.gamingCharge}
                  {completedBillModal.isPrepaid && (
                    <span className="text-emerald-400 text-[10px] font-cyber ml-2 font-bold">(ALREADY PAID)</span>
                  )}
                </span>
              </div>

              {completedBillModal.snackOrders && completedBillModal.snackOrders.length > 0 && (
                <div className="py-2 border-b border-white/5 space-y-1">
                  <span className="text-gray-400 block font-cyber">Food & Beverage Items ({completedBillModal.snackOrders.length}):</span>
                  {completedBillModal.snackOrders.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] font-mono text-gray-300">
                      <span>• {item.productName} × {item.quantity}</span>
                      <span>₹ {item.total}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-cyan-300 pt-1">
                    <span>Subtotal F&B:</span>
                    <span>₹ {completedBillModal.foodTotal}</span>
                  </div>
                </div>
              )}

              {/* AMOUNT DUE / GRAND TOTAL SUMMARY */}
              <div className="flex justify-between py-2 text-base font-black bg-purple-950/60 border border-purple-500/40 px-3 rounded-xl mt-2">
                <span className="text-gray-200">
                  {completedBillModal.isPrepaid ? 'AMOUNT DUE AT CHECKOUT:' : 'GRAND TOTAL BILLED:'}
                </span>
                <span className="text-emerald-400 font-cyber">
                  ₹ {completedBillModal.amountDue !== undefined ? completedBillModal.amountDue : completedBillModal.grandTotal}
                </span>
              </div>

              {completedBillModal.isPrepaid && completedBillModal.amountDue === 0 && (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] text-center font-medium">
                  ✓ Prepaid session charge (₹{completedBillModal.gamingCharge}) was already settled. No additional payment required.
                </div>
              )}

              {completedBillModal.isPrepaid && completedBillModal.amountDue > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[11px] text-center font-medium">
                  Session charge (₹{completedBillModal.gamingCharge}) is ALREADY PAID. Balance due (₹{completedBillModal.amountDue}) is for Cafe Orders.
                </div>
              )}

              {/* PAYMENT METHOD SELECTION SECTION */}
              {(!completedBillModal.isPrepaid || completedBillModal.amountDue > 0) ? (
                <div className="pt-2 border-t border-white/10 space-y-2.5">
                  <label className="text-xs font-cyber font-bold text-gray-300 uppercase tracking-wider block">
                    Payment Method *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['Cash', 'UPI', 'Debit Card', 'Split Payment'].map((method) => {
                      const isSelected = completedBillModal.paymentMethod === method || (method === 'Split Payment' && completedBillModal.paymentMethod === 'Split');
                      return (
                        <label
                          key={method}
                          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-cyber font-bold cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-purple-900/60 border-purple-500 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)]'
                              : 'bg-[#0F1219] border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method}
                            checked={isSelected}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCompletedBillModal(prev => ({ 
                                ...prev, 
                                paymentMethod: val === 'Split Payment' ? 'Split' : val 
                              }));
                            }}
                            className="w-3.5 h-3.5 accent-purple-500 cursor-pointer"
                          />
                          <span className="truncate">{method}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* SPLIT PAYMENT INPUTS & BREAKDOWN */}
                  {(completedBillModal.paymentMethod === 'Split' || completedBillModal.paymentMethod === 'Split Payment') && (() => {
                    const billAmt = Number(completedBillModal.amountDue !== undefined ? completedBillModal.amountDue : completedBillModal.grandTotal) || 0;
                    const cashVal = Number(completedBillModal.splitBreakdown?.cash || 0);
                    const upiVal = Number(completedBillModal.splitBreakdown?.upi || 0);
                    const cardVal = Number(completedBillModal.splitBreakdown?.card || 0);
                    const totalPaid = cashVal + upiVal + cardVal;
                    const remaining = billAmt - totalPaid;

                    return (
                      <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-2.5 animate-in fade-in zoom-in-95 duration-150 text-left">
                        <div className="flex items-center justify-between text-xs border-b border-white/10 pb-1.5">
                          <span className="font-cyber font-bold text-purple-300 uppercase tracking-wider">
                            Split Payment Breakdown
                          </span>
                          <span className="font-mono text-gray-400">
                            Total Bill: <strong className="text-white">₹{billAmt}</strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-cyber text-emerald-400 block mb-1">Cash (₹)</label>
                            <input
                              type="number"
                              min="0"
                              value={completedBillModal.splitBreakdown?.cash ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCompletedBillModal(prev => ({
                                  ...prev,
                                  splitBreakdown: { ...prev.splitBreakdown, cash: val }
                                }));
                              }}
                              placeholder="0"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#0F1219] border border-white/10 focus:border-emerald-500 text-xs font-mono font-bold text-white outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-cyber text-cyan-400 block mb-1">UPI (₹)</label>
                            <input
                              type="number"
                              min="0"
                              value={completedBillModal.splitBreakdown?.upi ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCompletedBillModal(prev => ({
                                  ...prev,
                                  splitBreakdown: { ...prev.splitBreakdown, upi: val }
                                }));
                              }}
                              placeholder="0"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#0F1219] border border-white/10 focus:border-cyan-500 text-xs font-mono font-bold text-white outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-cyber text-blue-400 block mb-1">Debit Card (₹)</label>
                            <input
                              type="number"
                              min="0"
                              value={completedBillModal.splitBreakdown?.card ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCompletedBillModal(prev => ({
                                  ...prev,
                                  splitBreakdown: { ...prev.splitBreakdown, card: val }
                                }));
                              }}
                              placeholder="0"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#0F1219] border border-white/10 focus:border-blue-500 text-xs font-mono font-bold text-white outline-none"
                            />
                          </div>
                        </div>

                        {/* Real-time Status / Validation Footer */}
                        <div className="flex items-center justify-between pt-1 text-[11px] font-mono border-t border-white/5">
                          <span className="text-gray-400">
                            Total Paid: <strong className="text-white">₹{totalPaid}</strong>
                          </span>
                          {remaining === 0 ? (
                            <span className="text-emerald-400 font-cyber font-bold">
                              ✓ Balanced (₹0 Remaining)
                            </span>
                          ) : remaining > 0 ? (
                            <span className="text-amber-400 font-cyber font-bold">
                              ⚠️ Remaining: ₹{remaining}
                            </span>
                          ) : (
                            <span className="text-red-400 font-cyber font-bold">
                              ❌ Overpaid: ₹{Math.abs(remaining)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="py-1.5 px-3 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-gray-300 font-mono">
                  Prepaid Payment Method: <span className="text-emerald-400 font-bold font-cyber">{completedBillModal.initialPaymentMethod || 'Cash'}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-2">
              <button 
                onClick={handleConfirmPaymentSubmit}
                disabled={(() => {
                  if (completedBillModal.isSubmitting) return true;
                  const needsPayment = (!completedBillModal.isPrepaid || completedBillModal.amountDue > 0);
                  if (!needsPayment) return false;
                  if (!completedBillModal.paymentMethod) return true;

                  const isSplit = completedBillModal.paymentMethod === 'Split' || completedBillModal.paymentMethod === 'Split Payment';
                  if (isSplit) {
                    const billAmt = Number(completedBillModal.amountDue !== undefined ? completedBillModal.amountDue : completedBillModal.grandTotal) || 0;
                    const cashVal = Number(completedBillModal.splitBreakdown?.cash || 0);
                    const upiVal = Number(completedBillModal.splitBreakdown?.upi || 0);
                    const cardVal = Number(completedBillModal.splitBreakdown?.card || 0);
                    const totalPaid = cashVal + upiVal + cardVal;
                    return totalPaid !== billAmt;
                  }
                  return false;
                })()}
                className={`flex-1 py-3 rounded-xl text-xs font-cyber font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  (() => {
                    if (completedBillModal.isSubmitting) return 'bg-gray-800 text-gray-500 border border-white/10 cursor-not-allowed opacity-50';
                    const needsPayment = (!completedBillModal.isPrepaid || completedBillModal.amountDue > 0);
                    if (!needsPayment) return 'bg-gradient-to-r from-[#7E22CE] to-[#6B21A8] hover:from-[#9333EA] hover:to-[#7E22CE] text-white shadow-[0_0_20px_rgba(147,51,234,0.5)] cursor-pointer';
                    if (!completedBillModal.paymentMethod) return 'bg-gray-800 text-gray-500 border border-white/10 cursor-not-allowed opacity-50';
                    const isSplit = completedBillModal.paymentMethod === 'Split' || completedBillModal.paymentMethod === 'Split Payment';
                    if (isSplit) {
                      const billAmt = Number(completedBillModal.amountDue !== undefined ? completedBillModal.amountDue : completedBillModal.grandTotal) || 0;
                      const cashVal = Number(completedBillModal.splitBreakdown?.cash || 0);
                      const upiVal = Number(completedBillModal.splitBreakdown?.upi || 0);
                      const cardVal = Number(completedBillModal.splitBreakdown?.card || 0);
                      const totalPaid = cashVal + upiVal + cardVal;
                      if (totalPaid !== billAmt) return 'bg-gray-800 text-gray-500 border border-white/10 cursor-not-allowed opacity-50';
                    }
                    return 'bg-gradient-to-r from-[#7E22CE] to-[#6B21A8] hover:from-[#9333EA] hover:to-[#7E22CE] text-white shadow-[0_0_20px_rgba(147,51,234,0.5)] cursor-pointer';
                  })()
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {completedBillModal.isSubmitting
                  ? 'Saving Payment...'
                  : (completedBillModal.isPrepaid && completedBillModal.amountDue === 0 ? 'Complete & Close Session' : 'Confirm Payment')
                }
              </button>
              <button 
                onClick={() => window.print()} 
                className="py-3 px-4 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-xs font-cyber text-purple-300 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button 
                onClick={() => setCompletedBillModal(null)} 
                className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-sans text-gray-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
