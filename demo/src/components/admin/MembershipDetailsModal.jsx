import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Calendar, Crown, Check, Ban, MessageSquare } from 'lucide-react';
import { openWhatsAppChat } from '../../utils/whatsapp';

export default function MembershipDetailsModal({ request, isOpen, onClose, onUpdateStatus }) {
  if (!isOpen || !request) return null;

  const customerName = request.full_name || '';
  const mobileNumber = request.mobile_number || request.mobileNumber || request.phone || '';
  const membershipPlan = request.membership_plan || request.membershipPlan || request.planName || '';
  const requestId = request.id || request.requestId || '';
  const status = request.status || 'Pending';

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Approved':
      case 'Active':
        return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400';
      case 'Rejected':
        return 'bg-red-500/20 border-red-500/50 text-red-400';
      default:
        return 'bg-amber-500/20 border-amber-500/50 text-amber-400';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-lg bg-[#090d19]/95 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,240,255,0.25)] z-10 overflow-hidden my-8 text-left"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-900 border border-white/10 hover:border-cyan-400 text-gray-400 hover:text-white flex items-center justify-center transition-colors z-20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-cyan-400 font-bold">{requestId}</span>
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-cyber font-bold border ${getStatusBadge(status)}`}>
                  {status.toUpperCase()}
                </span>
              </div>
              <h3 className="font-cyber text-lg font-black text-white uppercase tracking-wider mt-0.5">
                MEMBERSHIP REQUEST DETAILS
              </h3>
            </div>
          </div>

          {/* Detailed Fields Grid */}
          <div className="space-y-4 text-xs font-sans">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-gray-400">
                <User className="w-4 h-4 text-pink-400" />
                <span className="font-cyber text-white font-bold">{customerName}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Phone className="w-4 h-4 text-cyan-400" />
                <a href={`tel:${mobileNumber}`} className="hover:underline font-mono text-cyan-300">{mobileNumber}</a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5">
                <div className="text-[10px] text-gray-400 font-cyber">MEMBERSHIP PLAN</div>
                <div className="font-cyber font-bold text-purple-300 mt-0.5">{membershipPlan}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5">
                <div className="text-[10px] text-gray-400 font-cyber">START DATE</div>
                <div className="font-mono font-bold text-cyan-300 mt-0.5">{request.startDate || request.preferredStartDate || '-'}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5">
              <div className="text-[10px] text-gray-400 font-cyber">CREATED DATE & TIME</div>
              <div className="font-mono text-gray-300 mt-0.5">{request.createdAt ? new Date(request.createdAt).toLocaleString() : '-'}</div>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {status === 'Pending' && (
                <>
                  <button
                    onClick={() => {
                      onUpdateStatus(requestId, 'Active');
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-cyber font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>

                  <button
                    onClick={() => {
                      onUpdateStatus(requestId, 'Rejected');
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-500/40 text-red-300 hover:text-white text-xs font-cyber font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" /> Reject
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => openWhatsAppChat(mobileNumber, `Hello ${customerName}, regarding your membership request ${requestId} at G-FORCE Gaming Cafe.`)}
              className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 hover:text-white text-xs font-cyber font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
