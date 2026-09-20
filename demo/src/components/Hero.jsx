import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Compass, Star, MessageCircle } from 'lucide-react';
import { useSiteContext } from '../context/SiteContext';

export default function Hero({ onOpenBooking }) {
  const { cms } = useSiteContext();
  const videoRef = React.useRef(null);
  const [isVideoReady, setIsVideoReady] = React.useState(false);
  const whatsappUrl = `https://wa.me/${cms.contact.whatsapp}?text=Hi%20G-Force%20Gaming%20Hub!%20I%20want%20to%20book%20a%20gaming%20session.`;

  const handleVideoReady = React.useCallback(() => {
    setIsVideoReady(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  React.useEffect(() => {
    const v = videoRef.current;
    if (v) {
      if (v.readyState >= 2 || v.currentTime > 0) {
        setIsVideoReady(true);
      }
      v.play().catch(() => {});
    }
  }, []);

  return (
    <section id="hero" className="relative pt-16 pb-6 sm:pt-24 sm:pb-12 overflow-hidden flex flex-col justify-center min-h-[90vh] lg:min-h-screen">
      {/* Ambient Neon Glow Backdrops */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-tr from-pink-600/15 to-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 w-full flex flex-col items-center">
        
        {/* Softly pulsing neon pill badge close to top */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full badge-cyber mb-3 shadow-[0_0_15px_rgba(255,0,127,0.25)] animate-[pulse_3s_infinite] scale-90 sm:scale-100"
        >
          <span className="text-[10px] tracking-widest font-cyber font-bold text-gray-200">
            ⭐ CHENNAI'S BEST GAMING CAFE
          </span>
        </motion.div>

        {/* Main Headline - Fully Editable */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-cyber font-black tracking-tighter uppercase leading-none max-w-4xl mx-auto"
        >
          <span className="bg-gradient-to-r from-white via-cyan-400 to-pink-500 bg-clip-text text-transparent filter drop-shadow-[0_0_12px_rgba(255,0,127,0.5)]">
            {cms.heroTitle}
          </span>
        </motion.h1>

        {/* Subtitle - Fully Editable */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-4 text-xs sm:text-sm md:text-base text-gray-300 max-w-xl mx-auto font-raj font-bold tracking-wide uppercase"
        >
          {cms.heroSubtitle}
        </motion.p>

        {/* Side-by-side Action Buttons with equal width */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-4 grid grid-cols-2 gap-3 w-full max-w-xs sm:max-w-md mx-auto sm:flex sm:flex-row sm:justify-center sm:gap-4"
        >
          <button
            onClick={onOpenBooking}
            className="btn-cyber-pink px-4 py-3 rounded-xl text-[10px] sm:text-xs tracking-widest flex items-center justify-center gap-1.5 group w-full sm:w-40"
          >
            <Flame className="w-3.5 h-3.5 text-yellow-300 group-hover:scale-125 transition-transform" />
            BOOK NOW
          </button>
          <a
            href="#pricing"
            className="btn-cyber-outline px-4 py-3 rounded-xl text-[10px] sm:text-xs tracking-widest flex items-center justify-center gap-1.5 w-full sm:w-40"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            EXPLORE ZONES
          </a>
        </motion.div>

        {/* Height-reduced Video Showcase Card matching Midgard proportions */}
        <div className="relative w-full max-w-5xl mx-auto mt-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="rounded-2xl overflow-hidden glass-panel-glow border border-pink-500/30 shadow-[0_0_30px_rgba(255,0,127,0.2)] group transition-all duration-500 hover:border-cyan-400 hover:shadow-[0_0_40px_rgba(0,240,255,0.3)] bg-[#07070b]"
          >
            <video
              ref={videoRef}
              src="/videos/heroo-video.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onLoadedData={handleVideoReady}
              onCanPlay={handleVideoReady}
              onPlaying={handleVideoReady}
              style={{ backgroundColor: '#07070b' }}
              className={`w-full h-[220px] sm:h-[320px] md:h-[410px] lg:h-[430px] object-cover rounded-2xl transition-opacity duration-300 ${
                isVideoReady ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </motion.div>
        </div>

      </div>
    </section>
  );
}
