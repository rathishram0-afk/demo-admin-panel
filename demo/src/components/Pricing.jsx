import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteContext } from '../context/SiteContext';
import ErrorBoundary from './admin/ErrorBoundary';
import { Clock, Flame, Shield, Wifi, Coffee, Gamepad2, Tv } from 'lucide-react';

const getConsoleImage = (platform, fallback) => {
  const p = String(platform || '').toUpperCase();
  if (p === 'PS2' || p === 'PLAYSTATION 2') return '/images/gaming/ps2.webp';
  if (p === 'PS4' || p === 'PLAYSTATION 4') return '/images/gaming/ps4.webp';
  if (p === 'PS5' || p === 'PLAYSTATION 5') return '/images/gaming/ps5.webp';
  if (p === 'PS VR2' || p === 'PSVR2' || p === 'VR2' || p === 'VR') return '/images/gaming/psvr2.webp';
  if (p === 'RACING SIMULATOR' || p === 'SIMULATOR' || p === 'SIM') return '/images/gaming/racing-simulator.webp';
  return fallback || '/images/gaming/ps5.webp';
};

const getDisplayRates = (item, tab) => {
  const rates = item?.rates || [];
  const pName = String(item?.platform || '').toUpperCase();
  if (tab === 'WEEKDAYS' && (pName === 'RACING SIMULATOR' || pName.includes('RACING SIMULATOR') || pName === 'SIMULATOR')) {
    const seen = new Set();
    return rates.filter(r => {
      const key = String(r?.hours || '').trim().toUpperCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  return rates;
};

export default function Pricing({ onOpenBooking }) {
  const { pricing } = useSiteContext();
  const [activeTab, setActiveTab] = useState('WEEKDAYS');

  const bottomFeatures = [
    {
      title: "HIGH-END SETUP",
      subtitle: "Premium Consoles",
      icon: Tv,
      color: "text-purple-400 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
    },
    {
      title: "TOP GAMES",
      subtitle: "1000+ Titles",
      icon: Gamepad2,
      color: "text-pink-400 border-pink-500/40 shadow-[0_0_15px_rgba(255,0,127,0.3)]"
    },
    {
      title: "VIP ZONES",
      subtitle: "Private & Comfortable",
      icon: Shield,
      color: "text-cyan-400 border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
    },
    {
      title: "FAST INTERNET",
      subtitle: "Lag-Free Gaming",
      icon: Wifi,
      color: "text-blue-400 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
    },
    {
      title: "SNACKS & DRINKS",
      subtitle: "Fuel Your Game",
      icon: Coffee,
      color: "text-amber-400 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
    }
  ];

  const weekdaysList = pricing?.weekdays || [];
  const weekendsList = pricing?.weekends || [];

  return (
    <ErrorBoundary moduleName="Pricing & Rates Section">
      <section id="pricing" className="py-20 relative overflow-hidden bg-[#04060a]">
        {/* Ambient Cyber Backdrops */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          
          {/* Top 2-Tab Segmented Control matching spec */}
          <div className="text-center flex flex-col items-center justify-center">
            <div className="inline-flex p-1.5 rounded-full bg-slate-950/90 border border-white/15 shadow-[0_0_30px_rgba(255,0,127,0.25)] relative backdrop-blur-xl">
              <button
                onClick={() => setActiveTab('WEEKDAYS')}
                className={`px-8 py-3 rounded-full text-xs font-cyber font-extrabold tracking-widest transition-all duration-300 relative z-20 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'WEEKDAYS' ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {activeTab === 'WEEKDAYS' && (
                  <motion.span
                    layoutId="activePricingTab"
                    className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full -z-10 shadow-[0_0_20px_rgba(255,0,127,0.8)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
                WEEKDAYS
              </button>

              <button
                onClick={() => setActiveTab('WEEKENDS')}
                className={`px-8 py-3 rounded-full text-xs font-cyber font-extrabold tracking-widest transition-all duration-300 relative z-20 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'WEEKENDS' ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {activeTab === 'WEEKENDS' && (
                  <motion.span
                    layoutId="activePricingTab"
                    className="absolute inset-0 bg-gradient-to-r from-amber-500 via-pink-600 to-purple-600 rounded-full -z-10 shadow-[0_0_20px_rgba(245,158,11,0.8)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Flame className="w-4 h-4 text-yellow-300 animate-pulse" />
                WEEKENDS
              </button>
            </div>
          </div>

          {/* Tab Content Display - Only ONE active section visible */}
          <AnimatePresence mode="wait">
            {activeTab === 'WEEKDAYS' && (
              <motion.div
                key="weekdays-section"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="space-y-6"
              >
                {/* Header Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-blue-500/20 pb-4">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-cyber font-black tracking-tight text-cyan-400 uppercase flex items-center gap-2">
                      WEEKDAYS
                    </h2>
                    <p className="text-xs font-cyber font-bold tracking-widest text-gray-400 uppercase mt-1">
                      STANDARD PRICING
                    </p>
                  </div>

                  {/* Right Side Panel - Hourly Rates */}
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-blue-500/40 shadow-[0_0_15px_rgba(0,180,255,0.2)]">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-400/30 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="font-cyber text-xs font-bold text-white tracking-wider">HOURLY RATES</h4>
                      <p className="text-[10px] text-gray-400 font-sans">Choose your game, pick your zone and jump into the action!</p>
                    </div>
                  </div>
                </div>

                {/* 5 Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-stretch">
                  {weekdaysList.map((item, idx) => (
                    <motion.div
                      key={`weekday-${item?.platform || idx}`}
                      whileHover={{ y: -6, scale: 1.02 }}
                      transition={{ duration: 0.25 }}
                      className="rounded-2xl p-4 bg-[#070c18]/90 border border-blue-500/40 hover:border-cyan-400 shadow-[0_0_20px_rgba(0,180,255,0.15)] hover:shadow-[0_0_30px_rgba(0,240,255,0.35)] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden text-left"
                    >
                      {/* Top Badges Row */}
                      <div className="flex items-center justify-between mb-3 z-10">
                        <span className="bg-indigo-600/90 text-white font-cyber text-[10px] font-extrabold px-2.5 py-0.5 rounded-md tracking-wider shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                          {item?.badge}
                        </span>
                        <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40 tracking-wider font-bold">
                          ACTIVE
                        </span>
                      </div>

                      {/* Console Image Frame */}
                      <div className="relative mb-3 rounded-xl overflow-hidden aspect-[4/3] bg-slate-950/80 flex items-center justify-center border border-blue-500/20 group-hover:border-cyan-400/40 transition-colors">
                        <div className="absolute w-28 h-28 rounded-full bg-gradient-to-tr from-purple-600/40 to-cyan-400/30 blur-md pointer-events-none" />
                        <img
                          src={getConsoleImage(item?.platform, item?.image)}
                          alt={item?.fullTitle || 'Console'}
                          loading="lazy"
                          className="w-full h-full object-contain relative z-10 transition-transform duration-500 group-hover:scale-105" decoding="async" />
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-gray-300 font-sans leading-snug mb-4 min-h-[40px] text-left">
                        {item?.description}
                      </p>

                      {/* Pricing List */}
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        {getDisplayRates(item, 'WEEKDAYS').map((rate, rIdx) => (
                          <div key={rIdx} className="flex items-center justify-between py-1 px-2 rounded bg-slate-950/60 border border-white/5">
                            <div className="flex items-center gap-1.5 text-[11px] font-cyber text-gray-300">
                              <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span>{rate?.hours}</span>
                            </div>
                            <span className="font-cyber font-black text-cyan-400 text-sm">
                              {rate?.price}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={onOpenBooking}
                        className="mt-4 w-full py-2.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 border border-blue-500/40 hover:border-cyan-400 text-center font-cyber text-[11px] font-extrabold tracking-widest text-cyan-300 hover:text-white uppercase transition-all duration-300 block cursor-pointer"
                      >
                        BOOK NOW
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'WEEKENDS' && (
              <motion.div
                key="weekends-section"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="space-y-6"
              >
                {/* Header Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-cyber font-black tracking-tight text-pink-500 uppercase flex items-center gap-2">
                      WEEKENDS 🔥
                    </h2>
                    <p className="text-xs font-cyber font-bold tracking-widest text-amber-400 uppercase mt-1">
                      WEEKEND SPECIAL PRICING
                    </p>
                  </div>

                  {/* Right Side Panel - Hourly Rates */}
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-cyber text-xs font-bold text-white tracking-wider">HOURLY RATES</h4>
                      <p className="text-[10px] text-gray-400 font-sans">Choose your game, pick your zone and jump into the action!</p>
                    </div>
                  </div>
                </div>

                {/* 5 Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-stretch">
                  {weekendsList.map((item, idx) => (
                    <motion.div
                      key={`weekend-${item?.platform || idx}`}
                      whileHover={{ y: -6, scale: 1.02 }}
                      transition={{ duration: 0.25 }}
                      className="rounded-2xl p-4 bg-[#0e0a05]/95 border-2 border-amber-500/70 hover:border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden text-left"
                    >
                      {/* Top Badges Row */}
                      <div className="flex items-center justify-between mb-3 z-10">
                        <span className="bg-gradient-to-r from-red-600 to-amber-500 text-white font-cyber text-[9px] font-extrabold px-2 py-0.5 rounded-md tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.6)] flex items-center gap-1">
                          <Flame className="w-3 h-3 text-yellow-300" /> WEEKEND SPECIAL
                        </span>
                        <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40 tracking-wider font-bold">
                          ACTIVE
                        </span>
                      </div>

                      {/* Console Image Frame */}
                      <div className="relative mb-3 rounded-xl overflow-hidden aspect-[4/3] bg-slate-950/80 flex items-center justify-center border border-amber-500/20 group-hover:border-amber-400/40 transition-colors">
                        <div className="absolute w-28 h-28 rounded-full bg-gradient-to-tr from-pink-600/40 to-amber-500/40 blur-md pointer-events-none animate-pulse" />
                        <img
                          src={getConsoleImage(item?.platform, item?.image)}
                          alt={item?.fullTitle || 'Console'}
                          loading="lazy"
                          className="w-full h-full object-contain relative z-10 transition-transform duration-500 group-hover:scale-105" decoding="async" />
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-gray-300 font-sans leading-snug mb-4 min-h-[40px] text-left">
                        {item?.description}
                      </p>

                      {/* Pricing List */}
                      <div className="space-y-2 pt-2 border-t border-amber-500/20">
                        {(item?.rates || []).map((rate, rIdx) => (
                          <div key={rIdx} className="flex items-center justify-between py-1 px-2 rounded bg-slate-950/60 border border-amber-500/10">
                            <div className="flex items-center gap-1.5 text-[11px] font-cyber text-gray-300">
                              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>{rate?.hours}</span>
                            </div>
                            <span className="font-cyber font-black text-pink-400 text-sm">
                              {rate?.price}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={onOpenBooking}
                        className="mt-4 w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-center font-cyber text-[11px] font-extrabold tracking-widest text-white uppercase shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all duration-300 block cursor-pointer"
                      >
                        BOOK NOW
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* BOTTOM FEATURES STRIP */}
          <div className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {bottomFeatures.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl bg-slate-950/80 border ${feat.color} backdrop-blur-xl flex items-center gap-3 transition-transform duration-300 hover:scale-105`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-cyber text-xs font-bold text-white tracking-wider">{feat.title}</h4>
                      <p className="text-[10px] text-gray-400 font-sans">{feat.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </section>
    </ErrorBoundary>
  );
}
