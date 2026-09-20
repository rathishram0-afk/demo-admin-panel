import React from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Cpu, Sparkles, Flame, ShieldCheck } from 'lucide-react';
import { WHY_CHOOSE_US } from '../data/gamingData';

export default function WhyChooseUs() {
  const getFeatureIcon = (name) => {
    switch (name) {
      case 'Gamepad2': return Gamepad2;
      case 'Cpu': return Cpu;
      case 'Sparkles': return Sparkles;
      case 'Flame': return Flame;
      default: return Gamepad2;
    }
  };

  return (
    <section id="why-choose-us" className="py-20 relative bg-slate-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full badge-cyan text-xs mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>FEATURES</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-cyber font-black tracking-tight text-white uppercase">
            WHY CHOOSE <span className="text-gradient-cyan">G-FORCE?</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-400 font-raj font-semibold">
            We deliver the ultimate gaming environment with luxury amenities in Chennai.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {WHY_CHOOSE_US.map((item, idx) => {
            const Icon = getFeatureIcon(item.icon);
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="glass-panel-cyan rounded-2xl p-6 border border-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(0,240,255,0.3)] transition-all duration-300 flex flex-col items-center text-center group"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-cyan-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon className={`w-7 h-7 ${item.color}`} />
                </div>
                <h3 className="font-cyber text-sm sm:text-base font-bold text-white mb-2 tracking-wider group-hover:text-cyan-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 font-raj font-medium leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
