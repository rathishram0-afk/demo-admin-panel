import React from 'react';
import { AlertTriangle, Clock, Gamepad2, DollarSign, X, Check, ArrowRight } from 'lucide-react';

export default function SessionEndingAlertModal({ station, isOpen, onClose, onExtend, onEnd }) {
  if (!isOpen || !station) return null;

  const formatTimer = (totalSeconds) => {
    if (!totalSeconds || totalSeconds < 0) return '00:00:00';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn font-sans">
      <div className="w-full max-w-md glass-panel bg-[#0C0A1D]/95 border-2 border-amber-500/80 rounded-2xl p-6 relative shadow-[0_0_50px_rgba(245,158,11,0.35)] space-y-5 text-gray-100 max-h-[90dvh] overflow-y-auto custom-scrollbar">
        
        {/* TOP ALERT HEADER */}
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/60 flex items-center justify-center text-amber-400 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-cyber text-base font-bold text-amber-400 uppercase tracking-wider">
                ⚠ Session Ending Soon
              </h3>
              <span className="text-[10px] font-mono text-gray-400">
                5 Minutes Remaining Alert Triggered
              </span>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SESSION METRICS CARD */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs">
          <div className="space-y-1 text-left">
            <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-cyber">Gaming Device</span>
            <div className="font-cyber font-bold text-white text-sm flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-purple-400" /> {station.name || station.id}
            </div>
          </div>

          <div className="space-y-1 text-left">
            <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-cyber">Leader Name</span>
            <div className="font-bold text-white text-sm truncate">
              {station.customerName || 'Walk-in Player'}
            </div>
          </div>

          <div className="space-y-1 text-left pt-2 border-t border-white/10">
            <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-cyber">Remaining Time</span>
            <div className="font-mono font-bold text-amber-400 text-sm animate-pulse flex items-center gap-1">
              <Clock className="w-4 h-4 text-amber-400" /> {formatTimer(station.remainingSeconds)}
            </div>
          </div>

          <div className="space-y-1 text-left pt-2 border-t border-white/10">
            <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-cyber">Estimated Bill</span>
            <div className="font-mono font-bold text-emerald-400 text-sm flex items-center gap-0.5">
              ₹ {station.currentAmount || station.price || 0}
            </div>
          </div>
        </div>

        {/* QUICK EXTEND & END ACTION BUTTONS */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-cyber text-gray-400 uppercase tracking-wider block text-left">
            Quick Actions
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => onExtend(station.id, 30)}
              className="py-3 px-3 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 font-cyber font-bold text-xs text-purple-200 uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-1.5"
            >
              +30 Minutes
            </button>

            <button
              onClick={() => onExtend(station.id, 60)}
              className="py-3 px-3 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 font-cyber font-bold text-xs text-indigo-200 uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-1.5"
            >
              +1 Hour
            </button>
          </div>

          <button
            onClick={() => onEnd(station.id)}
            className="w-full py-3 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 font-cyber font-bold text-xs text-red-200 uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2"
          >
            End Session & Checkout
          </button>
        </div>

        {/* FOOTER CLOSE */}
        <div className="pt-2 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-sans text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            Close Alert
          </button>
        </div>

      </div>
    </div>
  );
}
