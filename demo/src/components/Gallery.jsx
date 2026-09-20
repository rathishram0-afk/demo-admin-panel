import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronLeft, ChevronRight, X } from 'lucide-react';

const REAL_GALLERY_IMAGES = [
  { id: 1, src: '/images/gallery/real1.png', alt: 'G-FORCE Gaming Hub Real Photo 1' },
  { id: 2, src: '/images/gallery/real2.png', alt: 'G-FORCE Gaming Hub Real Photo 2' },
  { id: 3, src: '/images/gallery/real3.png', alt: 'G-FORCE Gaming Hub Real Photo 3' },
  { id: 4, src: '/images/gallery/real4.png', alt: 'G-FORCE Gaming Hub Real Photo 4' },
  { id: 5, src: '/images/gallery/real5.png', alt: 'G-FORCE Gaming Hub Real Photo 5' },
  { id: 6, src: '/images/gallery/real6.png', alt: 'G-FORCE Gaming Hub Real Photo 6' }
];

export default function Gallery() {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const prevImage = useCallback((e) => {
    if (e) e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev === 0 ? REAL_GALLERY_IMAGES.length - 1 : prev - 1));
  }, [lightboxIndex]);

  const nextImage = useCallback((e) => {
    if (e) e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev === REAL_GALLERY_IMAGES.length - 1 ? 0 : prev + 1));
  }, [lightboxIndex]);

  // Keyboard navigation (ESC, ArrowLeft, ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, prevImage, nextImage]);

  // Mobile Touch Swipe Handling
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) nextImage();
    if (isRightSwipe) prevImage();

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section id="gallery" className="py-24 relative overflow-hidden select-none bg-[#070A17]">
      
      {/* Background Ambient Cyberpunk Glow FX */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-purple-600/15 via-indigo-600/15 to-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* SECTION HEADER */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-500/40 text-purple-300 text-xs font-cyber font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(147,51,234,0.3)]">
            <Camera className="w-3.5 h-3.5 text-purple-400" />
            <span>REAL MOMENTS</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-cyber font-black tracking-wider text-white uppercase leading-tight">
            CAFE GALLERY
          </h2>

          <p className="text-sm sm:text-base text-gray-300 font-sans font-medium leading-relaxed">
            Explore our real gaming café moments.
          </p>
        </div>

        {/* CLEAN 6 REAL PHOTO CARDS GRID (DESKTOP: 3 COLS × 2 ROWS, TABLET: 2 COLS, MOBILE: 1 COL) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {REAL_GALLERY_IMAGES.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              onClick={() => openLightbox(idx)}
              className="glass-panel bg-[#0C0A1D]/80 rounded-2xl p-2 border border-white/10 hover:border-purple-500/60 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(147,51,234,0.4)] transition-all duration-300 group cursor-pointer overflow-hidden"
            >
              {/* Clean Image Container with Uniform Height */}
              <div className="overflow-hidden rounded-xl aspect-[16/10] relative bg-black/40">
                <img
                  src={item.src}
                  alt={item.alt}
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/gaming/ps5.webp';
                  }}
                  className="w-full h-full object-cover object-center rounded-xl transition-transform duration-500 group-hover:scale-105 filter drop-shadow-[0_0_12px_rgba(0,0,0,0.4)]"
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* PREMIUM FULLSCREEN LIGHTBOX MODAL */}
        <AnimatePresence>
          {lightboxIndex !== null && REAL_GALLERY_IMAGES[lightboxIndex] && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeLightbox}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-md"
            >
              {/* Close Button */}
              <button
                onClick={closeLightbox}
                className="absolute top-5 right-5 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/20 shadow-lg"
                title="Close (ESC)"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Previous Image Button */}
              <button
                onClick={prevImage}
                className="absolute left-4 sm:left-8 z-50 p-3 rounded-full bg-white/10 hover:bg-purple-600 text-white transition-all cursor-pointer border border-white/20 shadow-lg hover:scale-110"
                title="Previous Photo (←)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Lightbox Main HD Image */}
              <div 
                onClick={(e) => e.stopPropagation()} 
                className="relative max-w-5xl max-h-[85vh] rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-[0_0_50px_rgba(147,51,234,0.45)] bg-black"
              >
                <img
                  src={REAL_GALLERY_IMAGES[lightboxIndex].src}
                  alt={REAL_GALLERY_IMAGES[lightboxIndex].alt}
                  className="max-w-full max-h-[80vh] object-contain mx-auto rounded-2xl" loading="lazy" decoding="async" />

                {/* Counter Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between font-cyber text-xs px-6">
                  <span className="text-purple-300 font-bold tracking-wider uppercase">
                    G-FORCE Gaming Hub
                  </span>
                  <span className="text-gray-400 font-mono">
                    {lightboxIndex + 1} / {REAL_GALLERY_IMAGES.length}
                  </span>
                </div>
              </div>

              {/* Next Image Button */}
              <button
                onClick={nextImage}
                className="absolute right-4 sm:right-8 z-50 p-3 rounded-full bg-white/10 hover:bg-purple-600 text-white transition-all cursor-pointer border border-white/20 shadow-lg hover:scale-110"
                title="Next Photo (→)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
