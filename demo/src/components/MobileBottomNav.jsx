import React, { useState, useEffect } from 'react';
import { Home, Gamepad2, Tag, Image as ImageIcon, PhoneCall } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileBottomNav() {
  const [activeTab, setActiveTab] = useState('home');
  const [showLabelFor, setShowLabelFor] = useState(null);
  const [timerId, setTimerId] = useState(null);

  // Corrected Tab mappings as per requested user directives
  const tabs = [
    { id: 'home', label: 'Home', href: '#hero', icon: Home },
    { id: 'games', label: 'Games', href: '#games', icon: Gamepad2 },
    { id: 'pricing', label: 'Pricing', href: '#pricing', icon: Tag },
    { id: 'gallery', label: 'Gallery', href: '#gallery', icon: ImageIcon },
    { id: 'contact', label: 'Contact', href: '#contact', icon: PhoneCall },
  ];

  // Auto Scroll Spy - updates active tab based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      // Find all sections
      const sections = tabs.map(tab => ({
        id: tab.id,
        element: document.querySelector(tab.href)
      }));

      // Viewport midpoint offset to determine when a section "becomes active" 
      const viewportMid = window.innerHeight * 0.4;
      let currentActive = 'home';

      // Loop backwards to find the deepest visible section
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          // If the top of the section is above our viewport mid-line, it's active
          if (rect.top <= viewportMid) {
            currentActive = section.id;
            break;
          }
        }
      }

      // Update state only if changed to avoid unnecessary renders
      setActiveTab((prev) => (prev !== currentActive ? currentActive : prev));
    };

    // Use passive listener for performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check (delay slightly to let DOM paint)
    setTimeout(handleScroll, 100);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTabClick = (e, tab) => {
    e.preventDefault(); // Prevent native abrupt jump
    
    setActiveTab(tab.id);
    setShowLabelFor(tab.id);

    // Perform smooth scrolling explicitly
    const targetElement = document.querySelector(tab.href);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Clear existing timer if any
    if (timerId) {
      clearTimeout(timerId);
    }

    // Set timer to hide label after 1.5 seconds (1500ms)
    const newTimer = setTimeout(() => {
      setShowLabelFor(null);
    }, 1500);

    setTimerId(newTimer);
  };

  useEffect(() => {
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [timerId]);

  return (
    <div
      style={{
        bottom: 'calc(18px + env(safe-area-inset-bottom, 0px))',
        height: '58px'
      }}
      className="fixed left-1/2 -translate-x-1/2 z-40 w-[88%] max-w-md rounded-full bg-slate-950/70 backdrop-blur-xl border border-pink-500/25 shadow-[0_0_20px_rgba(255,0,127,0.15),0_0_20px_rgba(0,240,255,0.15)] flex items-center justify-around px-2.5 transition-all duration-300"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const isLabelVisible = showLabelFor === tab.id;

        return (
          <a
            key={tab.id}
            href={tab.href}
            onClick={(e) => handleTabClick(e, tab)}
            className="flex flex-col items-center justify-center h-full flex-1 relative cursor-pointer"
          >
            <motion.div
              whileTap={{ scale: 1.08 }}
              className={`p-1.5 rounded-full transition-all duration-300 flex flex-col items-center justify-center ${
                isActive ? 'text-pink-400 scale-105' : 'text-white/80 hover:text-white'
              }`}
            >
              {/* Active Pink + Cyan Glowing Ring */}
              {isActive && (
                <div className="absolute inset-x-2 inset-y-1 rounded-full border border-cyan-400/30 shadow-[0_0_15px_rgba(255,0,127,0.5),inset_0_0_10px_rgba(0,240,255,0.2)] pointer-events-none" />
              )}

              <Icon
                className={`w-[21px] h-[21px] transition-all duration-300 ${
                  isActive
                    ? 'text-pink-400 filter drop-shadow-[0_0_8px_rgba(255,0,127,0.8)] drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]'
                    : 'opacity-85 filter drop-shadow-[0_0_3px_rgba(255,255,255,0.2)]'
                }`}
              />

              {/* Fading active label (fades in 200ms, auto hides) */}
              <AnimatePresence>
                {isLabelVisible && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 2 }}
                    transition={{ duration: 0.2 }}
                    className="text-[9px] font-cyber font-bold tracking-widest text-cyan-400 uppercase mt-0.5 pointer-events-none"
                  >
                    {tab.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </a>
        );
      })}
    </div>
  );
}
