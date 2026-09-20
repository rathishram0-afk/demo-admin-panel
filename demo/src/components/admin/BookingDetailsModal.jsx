import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Phone, 
  Gamepad2, 
  Calendar, 
  Clock, 
  Tag, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Trash2, 
  Award,
  Sparkles
} from 'lucide-react';
import { openWhatsAppChat } from '../../utils/whatsapp';

export default function BookingDetailsModal({ request, isOpen, onClose, onUpdateStatus, onDeleteBooking }) {
  if (!isOpen || !request) return null;

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
      case 'Completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]';
      case 'Rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
      default:
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
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
          className="relative w-full max-w-lg bg-[#070b14]/95 border border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(0,240,255,0.2)] z-10 overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/40 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-cyber text-lg font-black text-white uppercase tracking-wider">
                  BOOKING DETAILS
                </h3>
                <span className="font-mono text-xs text-cyan-400 font-bold">
                  {request.bookingId}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-900 border border-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Details Content */}
          <div className="space-y-3 font-sans text-xs">
            {/* Customer Info */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-pink-400" /> Customer Name
                </span>
                <span className="font-cyber font-bold text-white text-sm">{request.name}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" /> Mobile Number
                </span>
                <span className="font-mono text-cyan-300 font-bold">{request.phone}</span>
              </div>
            </div>

            {/* Session Info */}
            {(() => {
              const rawZone = request.zone || request.gaming_zone || request.gamingZone || '';
              const match = String(rawZone).match(/^(.*?)(?:\s*\(([\d]+)\s*Players?\))?$/i);
              const cleanZone = match && match[1] ? match[1].trim() : (rawZone || 'PlayStation 5');
              const playersCount = match && match[2] ? parseInt(match[2], 10) : (request.player_count || request.players || 1);

              return (
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Gamepad2 className="w-3.5 h-3.5 text-purple-400" /> Gaming Zone
                    </span>
                    <span className="font-cyber font-semibold text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/30">
                      {cleanZone}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-400" /> Players
                    </span>
                    <span className="font-cyber text-emerald-400 font-bold">
                      {playersCount} {playersCount === 1 ? 'Player' : 'Players'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-yellow-400" /> Booking Type
                    </span>
                    <span className="font-cyber text-pink-400 font-bold">{request.bookingType || request.booking_type || 'Weekday Booking'}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-pink-400" /> Booking Date
                    </span>
                    <span className="font-mono text-white">{request.date || request.booking_date}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" /> Time Slot
                    </span>
                    <span className="font-mono text-white">{request.time || request.booking_time}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-yellow-400" /> Duration
                    </span>
                    <span className="font-mono text-yellow-300 font-bold">{request.hours || request.duration}</span>
                  </div>

                  <div className="flex justify-between items-center border-t border-white/10 pt-2 mt-2">
                    <span className="text-gray-300 font-cyber font-bold">TOTAL PRICE</span>
                    <span className="text-lg font-cyber font-black text-pink-400">₹{request.price || request.total_amount}</span>
                  </div>
                </div>
              );
            })()}

            {/* Status & Created Date */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-cyber block">Current Status</span>
                <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-cyber font-bold border mt-0.5 ${getStatusBadgeClass(request.status)}`}>
                  {(request.status || 'Pending').toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 text-[10px] uppercase font-cyber block">Created Date</span>
                <span className="text-gray-300 font-mono text-[11px]">{request.createdDate} at {request.createdTime}</span>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="pt-2 grid grid-cols-2 gap-2">
              {/* Approve */}
              <button
                onClick={() => { onUpdateStatus(request.bookingId, 'Approved'); onClose(); }}
                className="py-2.5 px-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 font-cyber font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <CheckCircle className="w-4 h-4" /> APPROVE
              </button>

              {/* Complete */}
              <button
                onClick={() => { onUpdateStatus(request.bookingId, 'Completed'); onClose(); }}
                className="py-2.5 px-3 rounded-xl bg-blue-950/80 border border-blue-500/50 hover:border-blue-400 text-blue-300 font-cyber font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Award className="w-4 h-4" /> COMPLETE
              </button>

              {/* Reject */}
              <button
                onClick={() => { onUpdateStatus(request.bookingId, 'Rejected'); onClose(); }}
                className="py-2.5 px-3 rounded-xl bg-red-950/80 border border-red-500/50 hover:border-red-400 text-red-300 font-cyber font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <XCircle className="w-4 h-4" /> REJECT
              </button>

              {/* WhatsApp */}
              <button
                onClick={() => { openWhatsAppChat(request); }}
                className="py-2.5 px-3 rounded-xl bg-emerald-900/60 border border-emerald-400/40 hover:border-emerald-300 text-emerald-200 font-cyber font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <MessageSquare className="w-4 h-4" /> WHATSAPP
              </button>

              {/* Call */}
              <a
                href={`tel:${request.phone}`}
                className="py-2.5 px-3 rounded-xl bg-cyan-950/80 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 font-cyber font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Phone className="w-4 h-4" /> CALL CUSTOMER
              </a>

              {/* Delete */}
              <button
                onClick={() => { onDeleteBooking(request.bookingId); onClose(); }}
                className="py-2.5 px-3 rounded-xl bg-red-950/40 border border-red-500/30 hover:border-red-500 text-red-400 font-cyber font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Trash2 className="w-4 h-4" /> DELETE
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
