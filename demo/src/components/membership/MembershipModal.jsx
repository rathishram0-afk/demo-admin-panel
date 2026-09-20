import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MembershipForm from './MembershipForm';
import { X, Crown } from 'lucide-react';
import { getMembershipPlanByName } from '../../config/membershipConfig';

export default function MembershipModal({ isOpen, onClose, defaultPlan, onSuccess }) {
  if (!isOpen) return null;

  const planInfo = getMembershipPlanByName(defaultPlan);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Dark backdrop blur overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Modal Window Container (90-95% mobile width, max-h-90vh scrollable) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-[92%] sm:w-full max-w-2xl bg-[#090d19]/95 border border-pink-500/40 rounded-3xl p-5 sm:p-8 shadow-[0_0_50px_rgba(255,0,127,0.3)] z-10 overflow-y-auto max-h-[90vh] my-auto"
        >
          {/* Top Neon Ambient Backdrops */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-900 border border-white/10 hover:border-pink-500 text-gray-400 hover:text-white flex items-center justify-center transition-colors z-20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6 text-left border-b border-white/10 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/40 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="font-cyber text-xl sm:text-2xl font-black text-white tracking-wider uppercase">
                {planInfo.name} ₹{planInfo.price}
              </h2>
              <p className="text-xs text-gray-400 font-sans">
                Fill out your details to join G-FORCE Gaming Cafe
              </p>
            </div>
          </div>

          {/* Form Content */}
          <MembershipForm
            defaultPlan={defaultPlan}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
