import React, { useState, useEffect } from 'react';
import { Clock, PlusCircle, X, CheckCircle2, AlertCircle, Sparkles, DollarSign } from 'lucide-react';
import { useSiteContext } from '../../../context/SiteContext';
import { sessionService } from '../../../services/sessionService';

export default function ExtendSessionModal({ station, isOpen, onClose, onConfirm }) {
  const { pricing } = useSiteContext();
  const [presetMins, setPresetMins] = useState(30); 
  const [customInput, setCustomInput] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine platform key for duration presets and pricing lookup safely before hooks
  let platformKey = 'PlayStation 5';
  if (station) {
    platformKey = station.zone || station.category || station.device_type || 'PlayStation 5';
    if (station.id?.startsWith('PS5') || platformKey.includes('PS5')) platformKey = 'PlayStation 5';
    else if (station.id?.startsWith('PS4') || platformKey.includes('PS4')) platformKey = 'PlayStation 4';
    else if (station.id?.startsWith('PS2') || platformKey.includes('PS2')) platformKey = 'PlayStation 2';
    else if (station.id?.startsWith('VR') || platformKey.includes('VR')) platformKey = 'PS VR2';
    else if (station.id?.startsWith('SIM') || platformKey.includes('SIM')) platformKey = 'Racing Simulator';
  }

  useEffect(() => {
    if (isOpen) {
      // Determine default selection minutes
      let defaultMins = 30;
      if (platformKey === 'Racing Simulator') defaultMins = 30;
      else if (platformKey === 'PS VR2') defaultMins = 20;
      else defaultMins = 15;

      setPresetMins(defaultMins);
      setCustomInput('');
      setUseCustom(false);
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [isOpen, station, platformKey]);

  if (!isOpen || !station) return null;

  // Determine preset options based on platform
  const isSpecialPlatform = platformKey === 'PS VR2' || platformKey === 'Racing Simulator';
  let presetOptions = [];
  if (platformKey === 'Racing Simulator') {
    presetOptions = [
      { label: '+30 Minutes', mins: 30 },
      { label: '+1 Hour', mins: 60 },
      { label: '+1.5 Hours', mins: 90 }
    ];
  } else if (platformKey === 'PS VR2') {
    presetOptions = [
      { label: '+20 Minutes', mins: 20 },
      { label: '+40 Minutes', mins: 40 },
      { label: '+1 Hour', mins: 60 }
    ];
  } else {
    presetOptions = [
      { label: '+15 Minutes', mins: 15 },
      { label: '+30 Minutes', mins: 30 },
      { label: '+45 Minutes', mins: 45 },
      { label: '+1 Hour', mins: 60 }
    ];
  }

  // Read the current active hourly price directly from the Pricing Settings configuration (60 minutes rate per player)
  let baseHourlyRate = Number(sessionService.getPriceForSessionSync(platformKey, 60));
  if (!baseHourlyRate || baseHourlyRate <= 0) {
    baseHourlyRate = Number(station.hourlyPrice || station.hourly_price || 100);
  }

  // Calculate final effective minutes to extend
  let effectiveMins = 0;
  if (useCustom) {
    const parsed = parseInt(customInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      effectiveMins = parsed;
    }
  } else {
    effectiveMins = presetMins;
  }

  // Calculate pricing preview using exact formula:
  // Single Player Extension = (Current Hourly Price * Extension Minutes) / 60
  // Final Charge = Single Player Extension * Number of Players
  const playersNum = Number(station.playersCount || station.player_count || 1);
  
  const getExtensionCost = (mins) => {
    if (platformKey === 'PS VR2' || platformKey === 'Racing Simulator') {
      return Number(sessionService.getPriceForSessionSync(platformKey, mins)) * playersNum;
    }
    const singlePlayerExtension = (baseHourlyRate * mins) / 60;
    return Math.round(singlePlayerExtension * playersNum);
  };

  const additionalCharge = getExtensionCost(effectiveMins);
  const currentTotal = station.currentAmount || (station.price || 0) + (station.snackTotal || 0);
  const updatedTotal = currentTotal + additionalCharge;

  // Calculate New End Time preview
  const now = Date.now();
  const currentRemainingMs = (station.remainingSeconds || 0) * 1000;
  const newEndTimeMs = now + currentRemainingMs + (effectiveMins * 60 * 1000);
  const newEndTimeStr = new Date(newEndTimeMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Format current remaining time
  const formatTimer = (totalSeconds) => {
    if (!totalSeconds || totalSeconds < 0) return '00:00:00';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleCustomInputChange = (e) => {
    const val = e.target.value;
    // Strictly validate positive integers only
    if (val === '' || /^[1-9]\d*$/.test(val)) {
      setCustomInput(val);
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (useCustom) {
      if (!customInput || parseInt(customInput, 10) <= 0) {
        setErrorMsg('Please enter a valid positive number of minutes (e.g. 15, 20, 35, 75).');
        return;
      }
      if (customInput.includes('.')) {
        setErrorMsg('Decimal values are not allowed. Please enter a whole integer.');
        return;
      }
    }

    if (effectiveMins <= 0) {
      setErrorMsg('Extension duration must be greater than 0 minutes.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(station.id, effectiveMins);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to apply session extension.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-panel bg-[#0C0A1D]/95 border border-purple-500/50 rounded-3xl p-5 sm:p-6 relative shadow-[0_0_50px_rgba(147,51,234,0.35)] space-y-4 font-sans text-gray-100 max-h-[90dvh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-purple-300 shadow-inner">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-cyber text-base font-black text-white uppercase tracking-wider">
                Extend Session
              </h3>
              <p className="text-[11px] text-purple-300 font-mono font-bold">{station.name} ({station.zone})</p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current State Summary Card */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Customer Name:</span>
            <span className="font-cyber font-bold text-white text-xs">{station.customerName || 'Walk-in Player'}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">Current Device:</span>
            <span className="font-mono text-purple-300 font-bold">{station.name}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">Current Remaining Time:</span>
            <span className="font-mono text-cyan-400 font-bold">{formatTimer(station.remainingSeconds)}</span>
          </div>

          <div className="flex justify-between items-center border-t border-white/10 pt-2">
            <span className="text-gray-400">Current Total Amount:</span>
            <span className="font-cyber font-bold text-emerald-400">₹ {currentTotal}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 flex items-center gap-2 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Quick Extension Options */}
          <div>
            <label className="text-[11px] font-cyber text-gray-300 block mb-2 font-bold uppercase tracking-wider">
              QUICK EXTENSION
            </label>

            <div className={`grid gap-2 ${isSpecialPlatform ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
              {presetOptions.map(opt => {
                const isSelected = !useCustom && presetMins === opt.mins;
                const dynamicPrice = getExtensionCost(opt.mins);
                return (
                  <button
                    type="button"
                    key={opt.mins}
                    onClick={() => {
                      setUseCustom(false);
                      setPresetMins(opt.mins);
                      setErrorMsg('');
                    }}
                    className={`py-2.5 px-2 rounded-xl border text-[10px] sm:text-xs font-cyber font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]'
                        : 'bg-[#0F1219] border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className={`font-mono text-[9px] sm:text-[10px] ${isSelected ? 'text-purple-200' : 'text-purple-400/70'}`}>
                      +₹{dynamicPrice}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Extension Section */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useCustom}
                onChange={(e) => {
                  setUseCustom(e.target.checked);
                  setErrorMsg('');
                }}
                className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
              />
              <span className="text-xs font-cyber font-bold text-gray-200 uppercase tracking-wider">
                Enable Custom Minutes
              </span>
            </label>

            {useCustom && (
              <div className="pt-1">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[1-9][0-9]*"
                  value={customInput}
                  onChange={handleCustomInputChange}
                  placeholder="Enter minutes (e.g. 15, 20, 35, 75, 120)"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-purple-500/50 text-white font-mono text-xs outline-none focus:border-purple-400"
                  autoFocus
                />
                <span className="text-[10px] text-gray-400 font-mono mt-1 block">
                  Enter positive whole integer minutes only.
                </span>
              </div>
            )}
          </div>

          {/* Live Preview Card */}
          <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/40 space-y-2 text-xs">
            <h4 className="font-cyber text-[10px] font-bold text-purple-300 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> LIVE PREVIEW
            </h4>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
              <div className="flex justify-between">
                <span className="text-gray-400">Additional Mins:</span>
                <span className="text-purple-300 font-bold">+{effectiveMins} mins</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">New End Time:</span>
                <span className="text-cyan-300 font-bold">{newEndTimeStr}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Extra Charge:</span>
                <span className="text-emerald-400 font-bold">+ ₹ {additionalCharge}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Updated Total:</span>
                <span className="text-white font-cyber font-black text-xs">₹ {updatedTotal}</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-cyber font-bold text-gray-300 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || effectiveMins <= 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-cyber font-bold text-white uppercase tracking-wider shadow-[0_0_20px_rgba(147,51,234,0.5)] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Applying...</span>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" /> Apply Extension
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
