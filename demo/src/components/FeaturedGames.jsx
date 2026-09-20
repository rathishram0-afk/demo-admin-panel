import React, { useRef, useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Autoplay, Navigation, Mousewheel, Pagination, Keyboard } from 'swiper/modules';
import { useSiteContext } from '../context/SiteContext';
import ErrorBoundary from './admin/ErrorBoundary';
import { 
  Gamepad2, 
  Tv, 
  Trophy, 
  Sparkles, 
  Users, 
  Flame, 
  Glasses, 
  ChevronLeft, 
  ChevronRight,
  Bookmark,
  Shield,
  Wifi,
  Coffee
} from 'lucide-react';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Reusable Cinematic Game Card
const GameCoverCard = React.memo(function GameCoverCard({ game, collectionTitle, isActive, glowColor }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={`relative w-full h-full rounded-[20px] overflow-hidden transition-all duration-500 bg-[#0C0B18]/45 backdrop-blur-md border border-white/10 flex flex-col justify-between select-none ${
        isActive 
          ? 'border-purple-500/50 shadow-[0_0_25px_var(--glow-color)]' 
          : 'opacity-80'
      }`}
      style={{ 
        '--glow-color': glowColor || 'rgba(168,85,247,0.4)',
        willChange: 'transform, opacity, filter',
        transform: 'translate3d(0,0,0)' // GPU Hardware Acceleration trigger
      }}
    >
      {/* Glossy reflection shimmer sweep */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer z-30 pointer-events-none" />

      {/* Loading Skeleton */}
      <div 
        className={`absolute inset-0 rounded-[20px] bg-slate-950/95 flex flex-col items-center justify-center gap-2 transition-opacity duration-500 ${
          loaded ? 'opacity-0 pointer-events-none' : 'opacity-100 z-10'
        }`}
      >
        <Gamepad2 className="w-8 h-8 text-purple-500/20 animate-pulse" />
      </div>

      {/* HD Game Cover Poster (Crystal clear uncompressed 4K with Async decoding) */}
      <img
        src={game?.image || '/images/gaming/ps5.webp'}
        alt={`${game?.title || 'Game'} Poster`}
        loading={game?.isPriority ? "eager" : "lazy"}
        fetchPriority={game?.isPriority ? "high" : "auto"}
        decoding={game?.isPriority ? "sync" : "async"}
        onLoad={() => setLoaded(true)}
        onError={(e) => { 
          e.target.src = '/images/gaming/ps5.webp'; 
          setLoaded(true);
        }}
        className={`w-full h-full object-cover object-center rounded-[20px] transition-transform duration-700 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          imageRendering: 'auto',
          transform: 'translate3d(0,0,0)' 
        }}
      />

      {/* Top Badges */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20">
        <span className="px-2.5 py-0.5 rounded-lg bg-slate-950/80 border border-purple-500/30 text-[9px] font-cyber font-bold text-purple-300 backdrop-blur-md uppercase tracking-wider">
          {game?.platform || 'PS5'}
        </span>
        <span className="px-2.5 py-0.5 rounded-lg bg-slate-950/80 border border-pink-500/30 text-[9px] font-cyber font-bold text-pink-300 backdrop-blur-md uppercase tracking-wider">
          {game?.players || '1 Player'}
        </span>
      </div>

      {/* Info Block overlay */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-4 pt-10 z-20 space-y-0.5 text-left rounded-b-[20px]">
        <h4 className="font-cyber text-xs sm:text-sm font-black text-white tracking-wide uppercase line-clamp-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          {game?.title || 'Game Title'}
        </h4>
        <p className="text-[9px] font-cyber font-bold text-purple-300 tracking-wider uppercase truncate">
          {game?.genre || collectionTitle}
        </p>
      </div>
    </div>
  );
});

// Category Row Component (Title ABOVE its Carousel)
const CategoryCoverFlow = React.memo(function CategoryCoverFlow({ categoryId, collection, idx, windowWidth }) {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const swiperRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (swiperRef.current && swiperRef.current.swiper) {
              const sw = swiperRef.current.swiper;
              sw.slideNext(500);
              if (sw.autoplay) {
                sw.autoplay.start();
              }
            }
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 } // Trigger as soon as 10% of the carousel is visible
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!collection || !Array.isArray(collection.games) || collection.games.length === 0) {
    return null;
  }

  const getSectionIcon = (id) => {
    switch (id) {
      case 'story-mode': return Gamepad2;
      case 'multiplayer': return Users;
      case 'racing-sim': return Flame;
      case 'vr-experience': return Glasses;
      default: return Gamepad2;
    }
  };

  const SectionIcon = getSectionIcon(categoryId);
  
  // Filter out hidden games and sort by displayOrder
  const rawGamesList = collection.games
    .filter(g => g.isVisible !== false)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Duplicate slides to at least 20 items to prevent Swiper loop mode warnings
  let displayList = [...rawGamesList];
  if (rawGamesList.length > 0 && rawGamesList.length < 20) {
    const multiplier = Math.ceil(20 / rawGamesList.length);
    displayList = [];
    for (let i = 0; i < multiplier; i++) {
      displayList.push(...rawGamesList);
    }
  }

  // Pre-flag critical visible images for EVERY category to optimize loading speeds
  const len = displayList.length;
  displayList = displayList.map((g, i) => ({
    ...g,
    isPriority: i === 0 || i === 1 || i === 2 || i === len - 1 || i === len - 2
  }));

  const glowColor = idx % 2 === 0 ? 'rgba(236,72,153,0.5)' : 'rgba(6,182,212,0.5)';
  const textAcc = idx % 2 === 0 ? 'text-pink-400' : 'text-cyan-400';
  const borderAcc = idx % 2 === 0 ? 'border-pink-500/40' : 'border-cyan-500/40';

  // Responsive coverflow effect variables based on resize hook
  const stretchVal = windowWidth < 640 ? -24 : windowWidth < 1024 ? -42 : -62;
  const depthVal = windowWidth < 640 ? 100 : windowWidth < 1024 ? 140 : 180;
  const rotateVal = windowWidth < 640 ? 10 : windowWidth < 1024 ? 14 : 16;

  return (
    <div ref={containerRef} className="w-full py-8 border-b border-white/10 last:border-0 relative space-y-5">
      
      {/* Category Header - Title ABOVE the carousel */}
      <div className={`flex flex-col text-left border-l-4 ${borderAcc} pl-4 space-y-0.5 ml-2`}>
        <h3 className="font-cyber text-lg sm:text-xl font-black text-white uppercase tracking-wider leading-none flex items-center gap-2">
          <SectionIcon className={`w-5.5 h-5.5 shrink-0 ${textAcc}`} />
          <span>{collection.title || 'GAME COLLECTION'}</span>
        </h3>
        <span className="text-xs font-cyber font-bold text-gray-400 tracking-wider">
          {rawGamesList.length} Games
        </span>
      </div>

      {/* Large Cinematic Carousel below title */}
      <div className="relative w-full px-4 sm:px-8 md:px-12 min-w-0 flex items-center justify-center games-carousel-container select-none z-0">
        
        {/* Glowing Navigation Arrows */}
        <button
          ref={prevRef}
          aria-label="Previous Slide"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-slate-950/90 border border-white/10 hover:border-purple-500 text-gray-400 hover:text-white flex items-center justify-center transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.8)] hover:shadow-[0_0_20px_rgba(168,85,247,0.35)] backdrop-blur-md cursor-pointer"
        >
          <ChevronLeft className="w-5.5 h-5.5" />
        </button>

        <button
          ref={nextRef}
          aria-label="Next Slide"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-[#05060A]/90 border border-white/10 hover:border-purple-500 text-gray-400 hover:text-white flex items-center justify-center transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.8)] hover:shadow-[0_0_20px_rgba(168,85,247,0.35)] backdrop-blur-md cursor-pointer"
        >
          <ChevronRight className="w-5.5 h-5.5" />
        </button>

        {/* Cinematic Slider viewport */}
        <div className="w-full overflow-visible py-4">
          <Swiper
            ref={swiperRef}
            modules={[EffectCoverflow, Autoplay, Navigation, Mousewheel, Pagination, Keyboard]}
            effect="coverflow"
            slidesPerView="auto"
            centeredSlides={true}
            loop={true}
            grabCursor={true}
            speed={500} // Fast slide transition to snap center
            watchSlidesProgress={true} // Calculate progress for smooth rendering and no flickering
            touchReleaseOnEdges={true}
            allowTouchMove={true}
            mousewheel={{ forceToAxis: true }}
            keyboard={{ enabled: true, onlyInViewport: true }}
            autoplay={{
              delay: 1800, // 1.8 second hold on center card before fast slide to next
              disableOnInteraction: false, // Don't stop autoplay on drag/swipe
              pauseOnMouseEnter: true, // Pause when user hovers to read details
              waitForTransition: true
            }}
            lazyPreloadPrevNext={5} // Preload upcoming images to prevent blank spaces
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true
            }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
            }}
            onInit={(swiper) => {
              // Re-bind navigation refs on mount to ensure buttons work on first render
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
              swiper.navigation.init();
              swiper.navigation.update();
              // Force autoplay to start immediately
              if (swiper.autoplay) {
                swiper.autoplay.start();
              }
            }}
            onTouchEnd={(swiper) => {
              // Guarantee autoplay resumes after manual swipe
              setTimeout(() => {
                if (swiper && swiper.autoplay) {
                  swiper.autoplay.start();
                }
              }, 800);
            }}
            coverflowEffect={{
              rotate: rotateVal,
              stretch: stretchVal,
              depth: depthVal,
              modifier: 1,
              slideShadows: false
            }}
            className="w-full !overflow-visible snap-swiper"
          >
            {displayList.map((game, gIdx) => (
              <SwiperSlide 
                key={`${game?.id || 'game'}-${gIdx}`} 
                className="games-swiper-slide flex justify-center items-center"
              >
                {({ isActive }) => (
                  <div className="swiper-card-hover-wrapper w-full h-full relative group">
                    <GameCoverCard 
                      game={game} 
                      collectionTitle={collection.title} 
                      isActive={isActive}
                      glowColor={glowColor}
                    />
                  </div>
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

    </div>
  );
});

export default function FeaturedGames() {
  const { games } = useSiteContext();

  const bottomFeatures = [
    { title: "HIGH-END SETUP", subtitle: "Premium Consoles", icon: Tv, color: "text-purple-400 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]" },
    { title: "TOP GAMES", subtitle: "1000+ Titles", icon: Gamepad2, color: "text-pink-400 border-pink-500/40 shadow-[0_0_15px_rgba(255,0,127,0.3)]" },
    { title: "VIP ZONES", subtitle: "Private & Comfortable", icon: Shield, color: "text-cyan-400 border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.3)]" },
    { title: "FAST INTERNET", subtitle: "Lag-Free Gaming", icon: Wifi, color: "text-blue-400 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.3)]" },
    { title: "SNACKS & DRINKS", subtitle: "Fuel Your Game", icon: Coffee, color: "text-amber-400 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]" }
  ];

  // Window resize observer hook
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    let timeoutId = null;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 150);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <ErrorBoundary moduleName="Featured Games Showcase">
      <section id="games" className="py-20 relative overflow-hidden bg-[#04060a]">
        
        {/* Dynamic Styles block for pixel-perfect card scaling & animations */}
        <style dangerouslySetInnerHTML={{__html: `
          .games-carousel-container .swiper {
            overflow: visible !important;
          }
          /* Card sizing and base transforms with GPU support */
          .games-swiper-slide {
            width: 320px !important;
            height: 470px !important;
            transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
            will-change: transform, opacity, filter;
            transform: translate3d(0, 0, 0);
          }
          
          /* Active Center Slide: Highlighted, scale(1.15) for dominant spotlight size */
          .games-swiper-slide.swiper-slide-active {
            z-index: 20;
          }
          .games-swiper-slide.swiper-slide-active .swiper-card-hover-wrapper {
            transform: scale(1.15) translate3d(0, 0, 0) !important;
            opacity: 1 !important;
            filter: brightness(1.15) contrast(1.05) blur(0) !important;
            animation: floatUpDown 5s ease-in-out infinite;
          }

          /* Neighboring Slides (Immediate left and right) */
          .games-swiper-slide.swiper-slide-prev,
          .games-swiper-slide.swiper-slide-next {
            z-index: 10;
          }
          .games-swiper-slide.swiper-slide-prev .swiper-card-hover-wrapper,
          .games-swiper-slide.swiper-slide-next .swiper-card-hover-wrapper {
            transform: scale(0.92) translate3d(0, 0, 0) !important;
            opacity: 0.82 !important;
            filter: brightness(0.8) blur(0.5px) !important;
          }

          /* Far-out Slides */
          .games-swiper-slide:not(.swiper-slide-active):not(.swiper-slide-prev):not(.swiper-slide-next) {
            z-index: 5;
          }
          .games-swiper-slide:not(.swiper-slide-active):not(.swiper-slide-prev):not(.swiper-slide-next) .swiper-card-hover-wrapper {
            transform: scale(0.82) translate3d(0, 0, 0) !important;
            opacity: 0.45 !important;
            filter: brightness(0.45) blur(1.5px) !important;
          }

          /* Hover Scale & Lift transitions on inner wrappers to avoid Swiper inline conflicts */
          .swiper-card-hover-wrapper {
            width: 100%;
            height: 100%;
            transition: transform 0.5s cubic-bezier(0.25, 1, 0.25, 1), box-shadow 0.5s ease;
            transform: translate3d(0, 0, 0);
          }
          .swiper-card-hover-wrapper:hover {
            transform: translateY(-12px) scale(1.04) translate3d(0, 0, 0) !important;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
            z-index: 50 !important;
          }

          /* Floating effect keyframes */
          @keyframes floatUpDown {
            0%, 100% {
              transform: scale(1.15) translateY(0) translate3d(0, 0, 0);
            }
            50% {
              transform: scale(1.15) translateY(-6px) translate3d(0, 0, 0);
            }
          }

          /* Custom navigation dots */
          .games-carousel-container .swiper-pagination {
            bottom: -15px !important;
          }
          .games-carousel-container .swiper-pagination-bullet {
            background: rgba(255, 255, 255, 0.2) !important;
            opacity: 1;
            transition: all 0.3s ease;
          }
          .games-carousel-container .swiper-pagination-bullet-active {
            background: #a855f7 !important;
            box-shadow: 0 0 10px #a855f7;
            width: 18px;
            border-radius: 4px;
          }

          /* Laptop scale matching (1366px screen size) */
          @media (max-width: 1366px) {
            .games-swiper-slide {
              width: 280px !important;
              height: 410px !important;
            }
            @keyframes floatUpDown {
              0%, 100% {
                transform: scale(1.15) translateY(0) translate3d(0, 0, 0);
              }
              50% {
                transform: scale(1.15) translateY(-5px) translate3d(0, 0, 0);
              }
            }
          }
          
          /* Tablet scale matching */
          @media (max-width: 1024px) {
            .games-swiper-slide {
              width: 250px !important;
              height: 370px !important;
            }
          }

          /* Mobile scale matching */
          @media (max-width: 640px) {
            .games-swiper-slide {
              width: 200px !important;
              height: 300px !important;
            }
          }
        `}} />

        {/* Ambient background glow grids */}
        <div className="absolute top-1/4 left-1/3 w-[700px] h-[700px] bg-purple-600/5 rounded-full blur-[180px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-[700px] h-[700px] bg-cyan-600/5 rounded-full blur-[180px] pointer-events-none" />

        {/* Full-width container (Max 1700px content box) */}
        <div className="max-w-[1700px] mx-auto px-6 md:px-12 relative z-10 space-y-16">

          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="flex items-center justify-center gap-3">
              <Gamepad2 className="w-6 h-6 text-purple-400 animate-pulse" />
              <h2 className="text-3xl sm:text-5xl font-cyber font-black tracking-tight text-white uppercase leading-none">
                G-FORCE <span className="text-gradient-cyber">LIBRARY</span>
              </h2>
              <Gamepad2 className="w-6 h-6 text-pink-400 animate-pulse" />
            </div>
            <p className="text-sm sm:text-base text-gray-300 font-sans font-bold tracking-wide">
              EPIC GAMES. ENDLESS FUN. UNFORGETTABLE EXPERIENCE.
            </p>
          </div>

          {/* 4 Category Rows */}
          <div className="space-y-6">
            {games.storyMode && (
              <CategoryCoverFlow categoryId="storyMode" collection={games.storyMode} idx={0} windowWidth={windowWidth} />
            )}
            {games.multiplayer && (
              <CategoryCoverFlow categoryId="multiplayer" collection={games.multiplayer} idx={1} windowWidth={windowWidth} />
            )}
            {games.racingSim && (
              <CategoryCoverFlow categoryId="racingSim" collection={games.racingSim} idx={2} windowWidth={windowWidth} />
            )}
            {games.vrExperience && (
              <CategoryCoverFlow categoryId="vrExperience" collection={games.vrExperience} idx={3} windowWidth={windowWidth} />
            )}
          </div>

          {/* Bottom Features Strip */}
          <div className="pt-12 border-t border-white/10">
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
