import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  X, 
  User, 
  Phone, 
  Calendar, 
  Clock, 
  Tv, 
  CreditCard, 
  ShieldCheck, 
  AlertCircle,
  FileText,
  Sparkles
} from 'lucide-react';
import { sessionService } from '../../services/sessionService';

export default function ConvertBookingModal({ booking, isOpen, onClose, onSessionStarted }) {
  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState('');
  const [operator, setOperator] = useState('Super Admin');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && booking) {
      setErrorMsg('');
      setLoading(false);
      setNotes(`Converted from Online Booking ${booking.bookingId || booking.id}`);
      
      // Fetch stations to suggest correct device
      sessionService.getStations().then(data => {
        setStations(data);
        
        // Auto-suggest device based on booking zone
        const zone = booking.zone || booking.device || 'PlayStation 5';
        let suggestedId = '';

        if (zone.includes('5') || zone.includes('PS5')) {
          const avail = data.find(s => s.id.startsWith('PS5') && s.status === 'AVAILABLE');
          suggestedId = avail ? avail.id : 'PS5-1';
        } else if (zone.includes('4') || zone.includes('PS4')) {
          suggestedId = 'PS4-1';
        } else if (zone.includes('2') || zone.includes('PS2')) {
          suggestedId = 'PS2-1';
        } else if (zone.includes('Simulator') || zone.includes('Racing') || zone.includes('SIM')) {
          suggestedId = 'SIM-1';
        } else if (zone.includes('VR') || zone.includes('Virtual')) {
          const avail = data.find(s => s.id.startsWith('VR') && s.status === 'AVAILABLE');
          suggestedId = avail ? avail.id : 'VR-1';
        } else {
          const avail = data.find(s => s.status === 'AVAILABLE');
          suggestedId = avail ? avail.id : 'PS5-1';
        }

        setSelectedStationId(suggestedId);
      });
    }
  }, [isOpen, booking]);

  if (!isOpen || !booking) return null;

  const handleStartLiveSession = async (e) => {
    e.preventDefault();
    if (!selectedStationId) {
      setErrorMsg('Please select a device to assign.');
      return;
    }

    const target = stations.find(s => s.id === selectedStationId);
    if (target && target.status !== 'AVAILABLE') {
      setErrorMsg(`Device ${selectedStationId} is currently ${target.status}. Please select an AVAILABLE device.`);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await sessionService.convertBookingToSession({
        bookingId: booking.bookingId || booking.id,
        stationId: selectedStationId,
        operator,
        notes
      });

      if (onSessionStarted) {
        await onSessionStarted(res);
      }
      onClose();
    } catch (err) {
      console.error('Failed to convert booking to session:', err);
      setErrorMsg(err.message || 'Failed to start live session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-[#0a071d]/95 border border-purple-500/50 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(168,85,247,0.3)] z-10 overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-300 shadow-inner">
                <Play className="w-5 h-5 fill-purple-300" />
              </div>
              <div>
                <h3 className="font-cyber text-base font-black text-white uppercase tracking-wider">
                  Convert Booking to Live Session
                </h3>
                <span className="font-mono text-xs text-purple-400 font-bold">
                  {booking.bookingId || booking.id}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-900 border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Booking Summary Grid */}
          <form onSubmit={handleStartLiveSession} className="space-y-3.5 font-sans text-xs">
            
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 flex items-center gap-2 text-xs font-semibold animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Customer & Session Info Summary Card */}
            {(() => {
              const rawZone = booking.zone || booking.gaming_zone || booking.device || 'PlayStation 5';
              const match = String(rawZone).match(/^(.*?)(?:\s*\(([\d]+)\s*Players?\))?$/i);
              const cleanZone = match && match[1] ? match[1].trim() : rawZone;
              const playersCount = match && match[2] ? parseInt(match[2], 10) : (booking.player_count || booking.players || 1);

              return (
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-pink-400" /> Customer Name
                    </span>
                    <span className="font-cyber font-bold text-white text-xs">{booking.name || booking.customerName || booking.customer_name}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-cyan-400" /> Mobile Number
                    </span>
                    <span className="font-mono text-cyan-300 font-bold">{booking.phone || booking.mobileNumber || booking.mobile_number || '-'}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" /> Booking Date
                    </span>
                    <span className="font-mono text-gray-200">{booking.date || booking.booking_date || '-'}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-yellow-400" /> Booking Time & Duration
                    </span>
                    <span className="font-mono text-yellow-300 font-bold">{booking.time || booking.booking_time} ({booking.hours || booking.duration || '1 Hour'})</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Tv className="w-3.5 h-3.5 text-blue-400" /> Gaming Zone
                    </span>
                    <span className="font-cyber font-bold text-blue-300">{cleanZone}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-400" /> Players
                    </span>
                    <span className="font-cyber font-bold text-emerald-400">
                      {playersCount} {playersCount === 1 ? 'Player' : 'Players'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-t border-white/10 pt-2 mt-1">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Payment Status & Price
                    </span>
                    <span className="font-cyber font-black text-emerald-400 text-sm">
                      ₹{booking.price || booking.total_amount || 100} <span className="text-[10px] text-emerald-300/80">({booking.paymentMode || booking.payment_status || 'Unpaid'})</span>
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Assign Device Dropdown */}
            <div>
              <label className="block text-gray-300 font-cyber font-bold text-[11px] uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>ASSIGN DEVICE *</span>
                <span className="text-[9px] text-purple-300 font-mono font-normal">Auto-suggested for {booking.zone}</span>
              </label>

              <select
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-purple-500/40 text-white font-mono text-xs focus:border-purple-400 outline-none"
              >
                <option value="">-- Select Station --</option>
                {stations.map((st) => {
                  const isAvail = st.status === 'AVAILABLE';
                  return (
                    <option 
                      key={st.id} 
                      value={st.id} 
                      disabled={!isAvail}
                    >
                      {st.name} ({st.zone}) — {st.status} {isAvail ? '✓' : '✖'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Operator & Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 font-cyber font-bold text-[10px] uppercase mb-1">OPERATOR</label>
                <input
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-white/15 text-white outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-cyber font-bold text-[10px] uppercase mb-1">NOTES</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="w-full p-2 rounded-xl bg-slate-950 border border-white/15 text-white outline-none font-sans text-xs"
                />
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="pt-3 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-cyber font-bold text-xs cursor-pointer transition-all"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || !selectedStationId}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-cyber font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.5)] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="animate-pulse">Starting Live Session...</span>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" /> Start Live Session
                  </>
                )}
              </button>
            </div>

          </form>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
