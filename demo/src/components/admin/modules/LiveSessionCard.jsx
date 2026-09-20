import React from 'react';
import { Calendar, AlertTriangle, Play, Pause, PlusCircle, Square, UtensilsCrossed, Shuffle } from 'lucide-react';
import { getDeviceImage } from '../../../utils/deviceImages';

// Format seconds into HH:MM:SS
const formatTimer = (totalSeconds) => {
  if (totalSeconds < 0) totalSeconds = 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const LiveSessionCard = ({
  st,
  isEndingSoon,
  isPaused,
  isScheduled,
  setAlertModalStation,
  handlePauseResume,
  setExtendModalStation,
  handleOpenEndConfirm,
  onOpenShiftModal,
  onDeleteSnackOrder
}) => {
  const isPrepaidSession = st.isPrepaid === true || String(st.paymentStatus || '').toUpperCase() === 'PREPAID' || st.pricingSnapshot?.isPrepaid === true;
  const gamingChargeDisplay = Number(st.price || st.gamingCharge || 0);
  const cafeTotalDisplay = Number(st.snackTotal || 0);
  const displayedGrandTotal = isPrepaidSession
    ? cafeTotalDisplay
    : (gamingChargeDisplay + cafeTotalDisplay);

  return (
    <div 
      className={`glass-panel p-4 xl:p-5 rounded-2xl border transition-all relative flex flex-col justify-between space-y-4 shadow-xl ${
        isScheduled
          ? 'border-blue-500/40 bg-blue-950/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
          : isEndingSoon
          ? 'border-amber-500/80 bg-amber-950/30 shadow-[0_0_30px_rgba(245,158,11,0.35)] animate-pulse'
          : isPaused
          ? 'border-amber-500/40 bg-amber-950/10'
          : 'border-purple-500/40 bg-[#0C0A1D]/80 shadow-[0_0_20px_rgba(147,51,234,0.15)]'
      }`}
    >
      {/* Top Bar: Station Name, Session ID & Booking Ref */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-cyber text-base xl:text-lg font-bold text-white tracking-wider block">{st.name}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40">
              {st.currentSessionId || 'SESSION-001'}
            </span>
            {st.bookingIdRef && (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-500/40">
                {st.bookingIdRef}
              </span>
            )}
          </div>
          <span className="text-[11px] text-gray-400 font-mono">{st.zone}</span>
        </div>

        <button
          onClick={() => {
            if (isEndingSoon && !isScheduled) setAlertModalStation(st);
          }}
          className={`px-3 py-1 rounded-lg text-xs font-cyber tracking-wider font-bold border flex items-center gap-1.5 cursor-pointer ${
            isScheduled
              ? 'bg-blue-950/90 text-blue-300 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
              : isEndingSoon
              ? 'bg-amber-950/90 text-amber-300 border-amber-500 animate-bounce shadow-[0_0_10px_rgba(245,158,11,0.5)]'
              : isPaused
              ? 'bg-amber-950/50 text-amber-300 border-amber-500/40'
              : 'bg-blue-950/60 text-blue-400 border-blue-500/40'
          }`}
        >
          {isScheduled && <Calendar className="w-3.5 h-3.5 text-blue-400" />}
          {isEndingSoon && !isScheduled && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
          {isScheduled ? 'Scheduled' : isEndingSoon ? 'Ending Soon' : isPaused ? 'Paused' : 'Running'}
        </button>
      </div>

      {/* Device Image & Info */}
      <div className="flex items-center gap-4 py-1">
        <div className="w-24 h-20 xl:w-28 xl:h-22 shrink-0 flex items-center justify-center bg-black/30 rounded-xl p-1 border border-white/5">
          <img 
            src={getDeviceImage(st.id)} 
            alt={st.name} 
            loading="lazy"
            decoding="async"
            className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]" 
          />
        </div>

        <div className="flex-1 space-y-1.5 text-xs text-left">
          <div className="flex justify-between items-center text-gray-400">
            <span>Customer</span>
            <span className="text-white font-bold truncate max-w-[110px]">{st.customerName || 'Walk-in'}</span>
          </div>
          <div className="flex justify-between items-center text-gray-400">
            <span>Type</span>
            <span className="text-purple-300 font-mono font-bold text-[10px]">{st.type || 'Booking'}</span>
          </div>
          <div className="flex justify-between items-center text-gray-400">
            <span>Players</span>
            <span className="text-white font-mono">{st.playersCount || 1} / {st.controllersTotal || 4}</span>
          </div>
          <div className="flex justify-between items-center text-gray-400">
            <span>Start Time</span>
            <span className="text-gray-300 font-mono">{st.startTimeStr || '11:00 PM'}</span>
          </div>
        </div>
      </div>

      {/* Large Real-Time Timer Section */}
      <div className="p-3 rounded-xl bg-[#070913]/90 border border-white/10 flex items-center justify-between gap-3">
        {isScheduled ? (
          <div className="flex flex-col text-left w-full">
            <span className="text-[10px] uppercase font-cyber text-gray-400 tracking-widest">Starts In</span>
            <span className="font-mono text-xl xl:text-2xl font-bold text-blue-400 tracking-tight">
              {formatTimer(st.timeUntilStartSecs)}
            </span>
          </div>
        ) : (
          <>
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase font-cyber text-gray-400 tracking-widest">Elapsed Time</span>
              <span className="font-mono text-xl xl:text-2xl font-bold text-white tracking-tight">
                {formatTimer(st.elapsedSeconds)}
              </span>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-cyber text-gray-400 tracking-widest">Remaining</span>
              <span className={`font-mono text-base xl:text-lg font-bold ${isEndingSoon ? 'text-amber-400 animate-pulse' : 'text-cyan-400'}`}>
                {formatTimer(st.remainingSeconds)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* FINANCIAL METRICS & ATTACHED CAFÉ ORDERS */}
      <div className="space-y-2 font-sans p-2.5 rounded-xl bg-white/5 border border-white/5 text-left">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-gray-400 block text-[10px]">Gaming</span>
            <div className="flex items-center gap-1 flex-wrap">
              <span className="font-mono text-sm font-bold text-white">₹ {gamingChargeDisplay}</span>
              {isPrepaidSession && (
                <span className="text-[9px] font-cyber font-bold text-emerald-400 bg-emerald-950/80 px-1 py-0.2 rounded border border-emerald-500/40">
                  (PREPAID)
                </span>
              )}
            </div>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px]">Café F&B</span>
            <span className="font-mono text-sm font-bold text-cyan-300">₹ {cafeTotalDisplay}</span>
          </div>
          <div className="text-right">
            <span className="text-gray-400 block text-[10px]">Grand Total</span>
            <span className="font-mono text-sm font-bold text-emerald-400">₹ {displayedGrandTotal}</span>
          </div>
        </div>

        {/* Attached Café Items List */}
        {st.snackOrders && st.snackOrders.length > 0 && (
          <div className="pt-2 border-t border-white/10 space-y-1">
            <span className="text-[10px] font-cyber text-purple-300 font-bold flex items-center gap-1">
              <UtensilsCrossed className="w-3 h-3 text-purple-400" /> Attached Café Orders ({st.snackOrders.length})
            </span>
            <div className="space-y-1 max-h-20 overflow-y-auto custom-scrollbar text-[11px] font-mono">
              {st.snackOrders.map((ord, i) => (
                <div key={i} className="flex justify-between items-center bg-black/40 px-2 py-1 rounded border border-white/5">
                  <span className="text-gray-200 truncate">{ord.productName} × {ord.quantity}</span>
                  <span className="text-emerald-400 font-bold shrink-0">₹{ord.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PERFECTLY ALIGNED 4 SESSION CARD BUTTONS */}
      <div className="grid grid-cols-4 gap-1.5 pt-1">
        
        {/* Button 1: Pause / Resume */}
        <button
          onClick={() => { if (!isScheduled) handlePauseResume(st.id, st.sessionId) }}
          disabled={isScheduled}
          className={`py-2 px-1.5 rounded-xl border text-[10px] sm:text-xs font-cyber font-bold transition-all flex items-center justify-center gap-1 shadow-md ${
            isScheduled ? 'opacity-50 cursor-not-allowed bg-black/30 border-white/5 text-gray-500' :
            isPaused
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900 cursor-pointer'
              : 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/80 cursor-pointer'
          }`}
        >
          {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
          <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
        </button>

        {/* Button 2: EXTEND SESSION */}
        <button
          onClick={() => { if (!isScheduled) setExtendModalStation(st) }}
          disabled={isScheduled}
          className={`py-2 px-1.5 rounded-xl border text-[10px] sm:text-xs font-cyber font-bold transition-all flex items-center justify-center gap-1 shadow-md ${
            isScheduled 
              ? 'opacity-50 cursor-not-allowed bg-black/30 border-white/5 text-gray-500' 
              : 'bg-purple-950/80 border-purple-500/50 hover:bg-purple-900 text-purple-200 cursor-pointer'
          }`}
        >
          <PlusCircle className="w-3 h-3 text-current" />
          <span className="hidden sm:inline">Extend</span>
        </button>

        {/* Button 3: SHIFT SESSION */}
        <button
          onClick={() => { if (!isScheduled && onOpenShiftModal) onOpenShiftModal(st); }}
          disabled={isScheduled}
          className={`py-2 px-1.5 rounded-xl border text-[10px] sm:text-xs font-cyber font-bold transition-all flex items-center justify-center gap-1 shadow-md ${
            isScheduled 
              ? 'opacity-50 cursor-not-allowed bg-black/30 border-white/5 text-gray-500' 
              : 'bg-cyan-950/80 border-cyan-500/50 hover:bg-cyan-900 text-cyan-200 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.2)]'
          }`}
          title="Shift Session to Another Available Station"
        >
          <Shuffle className="w-3 h-3 text-cyan-400" />
          <span className="hidden sm:inline">Shift</span>
        </button>

        {/* Button 4: End Session */}
        <button
          onClick={() => { if (!isScheduled) handleOpenEndConfirm(st) }}
          disabled={isScheduled}
          className={`py-2 px-1.5 rounded-xl border text-[10px] sm:text-xs font-cyber font-bold transition-all flex items-center justify-center gap-1 shadow-md ${
            isScheduled 
              ? 'opacity-50 cursor-not-allowed bg-black/30 border-white/5 text-gray-500' 
              : 'bg-red-950/80 border-red-500/50 hover:bg-red-900 text-red-200 cursor-pointer'
          }`}
        >
          <Square className="w-3 h-3 fill-current text-current" />
          <span className="hidden sm:inline">End</span>
        </button>
      </div>

    </div>
  );
};

// Use React.memo with a deep comparison for the specific fields that change rapidly
export default React.memo(LiveSessionCard, (prevProps, nextProps) => {
  return (
    prevProps.st.id === nextProps.st.id &&
    prevProps.st.currentSessionId === nextProps.st.currentSessionId &&
    prevProps.isEndingSoon === nextProps.isEndingSoon &&
    prevProps.isPaused === nextProps.isPaused &&
    prevProps.isScheduled === nextProps.isScheduled &&
    prevProps.st.timerLeft === nextProps.st.timerLeft &&
    prevProps.st.playersCount === nextProps.st.playersCount &&
    prevProps.st.timeUntilStartSecs === nextProps.st.timeUntilStartSecs &&
    prevProps.st.elapsedSeconds === nextProps.st.elapsedSeconds &&
    prevProps.st.remainingSeconds === nextProps.st.remainingSeconds &&
    prevProps.st.status === nextProps.st.status &&
    prevProps.st.currentAmount === nextProps.st.currentAmount &&
    prevProps.st.snackTotal === nextProps.st.snackTotal &&
    (prevProps.st.snackOrders || []).length === (nextProps.st.snackOrders || []).length
  );
});
