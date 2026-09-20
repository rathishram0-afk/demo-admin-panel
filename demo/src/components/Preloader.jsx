import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LOADING_STEPS = [0, 5, 12, 18, 26, 34, 48, 57, 69, 81, 92, 100];

export default function Preloader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  // Hook to check reduced-motion preferences
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
    }
  }, []);

  useEffect(() => {
    let timer;
    let stepIndex = 0;
    let maxSteps = LOADING_STEPS.length;
    let isLoaded = document.readyState === 'complete';

    const handleLoad = () => {
      isLoaded = true;
    };

    window.addEventListener('load', handleLoad);

    const runNextStep = () => {
      if (stepIndex >= maxSteps) {
        timer = setTimeout(() => {
          setVisible(false);
          if (onComplete) onComplete();
        }, 50); // Reduced from 150ms
        return;
      }

      // If page is fully loaded, accelerate progress instantly
      if (isLoaded) {
        setProgress(100);
        stepIndex = maxSteps;
        timer = setTimeout(runNextStep, 10); // Reduced from 50ms
        return;
      }

      setProgress(LOADING_STEPS[stepIndex]);
      stepIndex++;
      
      // Fast tracking loader (5-10ms per step instead of 30-50ms)
      const nextInterval = Math.floor(Math.random() * 5) + 5;
      timer = setTimeout(runNextStep, nextInterval);
    };

    runNextStep();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('load', handleLoad);
    };
  }, [onComplete]);

  // Synchronized message loading steps
  const getLoadingMessage = (val) => {
    if (val === 100) return 'Welcome to G-FORCE Gaming Hub';
    if (val >= 92) return 'Launching G-FORCE...';
    if (val >= 81) return 'Almost Ready...';
    if (val >= 69) return 'Optimizing Performance...';
    if (val >= 48) return 'Preparing Premium Experience...';
    if (val >= 26) return 'Loading Game Library...';
    return 'Loading Assets...';
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35, ease: "easeInOut" } }}
          className="fixed inset-0 z-[9999] bg-[#05060A] flex flex-col items-center justify-center p-6 select-none overflow-hidden"
          style={{ willChange: 'opacity' }}
        >
          {/* Radial blue/purple glow composite backdrop */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.08)_0%,rgba(168,85,247,0.05)_45%,transparent_75%)]" />

          {/* Particle Stream */}
          <div className="absolute inset-0 opacity-25 pointer-events-none overflow-hidden">
            {!prefersReducedMotion && [...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400 rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -100 - Math.random() * 80],
                  x: [0, (Math.random() - 0.5) * 30],
                  opacity: [0, 0.6, 0]
                }}
                transition={{
                  duration: 2.2 + Math.random() * 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: Math.random() * 1.5
                }}
              />
            ))}
          </div>

          <div className="relative max-w-sm w-full text-center space-y-6 z-10 flex flex-col items-center">
            
            {/* Crisp center G-FORCE logo with soft breath, glow and float */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { 
                opacity: 1, 
                scale: [1, 1.02, 1],
                y: [0, -5, 0]
              }}
              exit={{ scale: 0.9, opacity: 0, transition: { duration: 0.25 } }}
              transition={{
                opacity: { duration: 0.4 },
                scale: { repeat: Infinity, duration: 4, ease: "easeInOut" },
                y: { repeat: Infinity, duration: 4, ease: "easeInOut" }
              }}
              className="flex items-center justify-center"
              style={{ willChange: 'transform, opacity' }}
            >
              <img
                src="/images/logo/gforcehub-logo.jpg"
                alt="G-FORCE Gaming Hub Logo"
                className="w-[150px] sm:w-[180px] md:w-[240px] h-auto object-contain rounded-2xl border border-indigo-500/20 shadow-[0_0_24px_rgba(99,102,241,0.3)]"
                loading="lazy" loading="lazy" decoding="async" />
            </motion.div>

            {/* Status info */}
            <div className="space-y-4 w-full flex flex-col items-center">
              <span className="text-[10px] sm:text-xs font-cyber tracking-widest text-gray-300 font-bold uppercase block min-h-[16px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {getLoadingMessage(progress)}
              </span>

              {/* Progress Bar with neon pink + cyan gradients */}
              <div className="w-44 sm:w-52 h-[4px] bg-slate-950 rounded-full overflow-hidden border border-white/5 relative shadow-[inner_0_1px_3px_rgba(0,0,0,0.9)]">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)] transition-all duration-100 ease-out rounded-full"
                  style={{ 
                    width: `${progress}%`,
                    willChange: 'width'
                  }}
                />
              </div>

              {/* Live Percentage counter */}
              <span className="font-cyber font-black text-xs sm:text-sm tracking-widest text-pink-500 drop-shadow-[0_0_10px_rgba(255,0,127,0.4)]">
                {progress}%
              </span>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
