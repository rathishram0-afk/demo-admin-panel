import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MEMBERSHIP_TIERS } from '../data/gamingData';
import ErrorBoundary from './admin/ErrorBoundary';
import { Crown, Check, Flame } from 'lucide-react';
import MembershipModal from './membership/MembershipModal';

import { MEMBERSHIP_PLANS } from '../config/membershipConfig';

export default function Membership() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(MEMBERSHIP_PLANS.threeMonth.name);

  const getFormattedPlanName = (tier) => {
    if (!tier) return MEMBERSHIP_PLANS.threeMonth.name;
    if (tier.id === 'monthly') return MEMBERSHIP_PLANS.monthly.name;
    return MEMBERSHIP_PLANS.threeMonth.name;
  };

  const handleOpenModal = (planName) => {
    setSelectedPlan(planName);
    setModalOpen(true);
  };

  const tiersList = MEMBERSHIP_TIERS || [];

  return (
    <ErrorBoundary moduleName="Membership Section">
      <section id="membership" className="py-20 relative bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full badge-cyber text-xs mb-3">
              <Crown className="w-3.5 h-3.5 text-yellow-400" />
              <span>MEMBERSHIP PLANS</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-cyber font-black tracking-tight text-white uppercase">
              BECOME A <span className="text-gradient-cyber">MEMBER</span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-gray-400 font-raj font-semibold">
              Choose your preferred gaming plan and unlock exclusive benefits & discounts.
            </p>
          </div>

          {/* 2 Tier Cards Grid (Monthly vs Three Month) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
            {tiersList.map((tier, idx) => (
              <motion.div
                key={tier?.id || idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className={`glass-panel rounded-3xl p-8 border relative flex flex-col justify-between transition-all duration-300 ${tier?.accent || ''} ${
                  tier?.isPopular ? 'scale-105 z-10' : 'hover:scale-102'
                }`}
              >
                {/* Badge */}
                {tier?.badgeText && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full btn-cyber-pink text-[10px] tracking-widest uppercase flex items-center gap-1 shadow-[0_0_20px_rgba(255,0,127,0.8)] font-cyber font-bold">
                    <Flame className="w-3 h-3 text-yellow-300" /> {tier.badgeText}
                  </div>
                )}

                <div>
                  {/* Header info */}
                  <h3 className="font-cyber font-extrabold text-xl sm:text-2xl tracking-wider text-white mb-2">
                    {tier?.name}
                  </h3>

                  <div className="mb-6 pb-6 border-b border-white/10 space-y-1">
                    <div className="font-cyber text-4xl sm:text-5xl font-black text-white">
                      {tier?.price}
                    </div>
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-widest block">
                      {tier?.validity}
                    </span>
                  </div>

                  {/* Perks Checklist */}
                  <div className="space-y-3 mb-8">
                    {(tier?.perks || []).map((perk, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-3 text-xs sm:text-sm text-gray-300 font-raj font-semibold text-left">
                        <div className="w-4 h-4 rounded-full bg-pink-500/20 border border-pink-500/50 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 text-pink-400" />
                        </div>
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button opens MembershipModal */}
                <button
                  onClick={() => handleOpenModal(getFormattedPlanName(tier))}
                  className={`w-full py-3.5 rounded-xl text-xs font-cyber tracking-widest text-center font-bold block transition-all duration-300 cursor-pointer ${
                    tier?.isPopular
                      ? 'btn-cyber-pink shadow-[0_0_25px_rgba(255,0,127,0.7)]'
                      : 'btn-cyber-outline text-white hover:text-white'
                  }`}
                >
                  {tier?.buttonText || 'SELECT PLAN'}
                </button>
              </motion.div>
            ))}
          </div>

        </div>

        {/* Modal for Membership Purchase */}
        <MembershipModal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          defaultPlan={selectedPlan} 
        />
      </section>
    </ErrorBoundary>
  );
}
