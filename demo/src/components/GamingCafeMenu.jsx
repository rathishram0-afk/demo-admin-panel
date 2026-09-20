import React, { useState, useRef, Suspense, lazy } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { lazyWithRetry } from '../utils/lazyWithRetry';

const OrderAtCounterModal = lazyWithRetry(() => import('./OrderAtCounterModal'));
import { 
  Coffee, 
  Sparkles, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Flame,
  Zap,
  ShoppingBag,
  Gift,
  ShieldCheck,
  Gamepad2,
  Clock,
  Snowflake
} from 'lucide-react';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { useSiteContext } from '../context/SiteContext';

import { normalizeCategoryKey } from '../services/cafeMenuService';

const BASE_CATEGORIES = [
  { id: 'drinks', label: 'Cold Drinks', icon: '🥤' },
  { id: 'shakes', label: 'Thick Shakes', icon: '🥛' },
  { id: 'snacks', label: 'Snacks & Chips', icon: '🍟' },
  { id: 'waffles', label: 'Waffles', icon: '🧇' },
  { id: 'fries_momos', label: 'Fries & Momos', icon: '🍟' },
  { id: 'burger_sandwich', label: 'Burger & Sandwich', icon: '🍔' }
];

export default function GamingCafeMenu() {
  const { menu } = useSiteContext();
  const [activeTab, setActiveTab] = useState('drinks');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  // Build dynamic category list merging BASE_CATEGORIES and any custom category keys in menu
  const dynamicCategoryKeys = Object.keys(menu || {}).filter(k => {
    const isBase = BASE_CATEGORIES.some(b => b.id === k);
    return !isBase && !k.includes(' ') && Array.isArray(menu[k]) && menu[k].length > 0;
  });

  const categories = [
    ...BASE_CATEGORIES,
    ...dynamicCategoryKeys.map(k => ({
      id: k,
      label: k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      icon: '🍕'
    }))
  ];

  const normActiveKey = normalizeCategoryKey(activeTab);
  const rawItems = menu[activeTab] || menu[normActiveKey] || [];
  const currentItems = (rawItems || [])
    .filter(item => item.isVisible !== false)
    .sort((a, b) => {
      if (a.featured === b.featured) return 0;
      return a.featured ? -1 : 1;
    });

  return (
    <section id="cafe-menu" className="py-20 relative bg-[#05060C] overflow-hidden text-gray-100 font-sans">
      
      {/* Background Neon Ambient Glows & Grid */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
        
        {/* SECTION HEADER MATCHING MOCKUP 1:1 */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 text-left">
            <span className="text-[11px] font-cyber font-bold tracking-[0.25em] text-pink-400 uppercase block">
              REFUEL. RECHARGE. RETURN TO VICTORY
            </span>

            <h2 className="font-cyber text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-wider uppercase flex items-center gap-3">
              GAMING CAFE <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">MENU</span>
            </h2>

            <p className="text-gray-400 text-xs sm:text-sm font-sans max-w-xl">
              Power up your gameplay with our premium drinks, thick shakes & delicious snacks.
            </p>
          </div>

          {/* Decorative Controller Outline Graphic */}
          <div className="hidden md:flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <Gamepad2 className="w-10 h-10 text-purple-400/80 animate-pulse" />
            <div className="text-left text-xs">
              <span className="font-cyber font-bold text-cyan-300 block">GAME CAFE STATION</span>
              <span className="text-gray-400">Order directly at counter</span>
            </div>
          </div>
        </div>

        {/* CATEGORY TABS (GLASS PILL TABS MATCHING MOCKUP) */}
        <div className="flex justify-center overflow-x-auto custom-scrollbar max-w-full pb-2">
          <div className="inline-flex p-1.5 rounded-2xl bg-[#0F121E]/80 border border-white/10 backdrop-blur-md gap-2 flex-wrap justify-center">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-cyber font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  activeTab === cat.id
                    ? 'bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white shadow-[0_0_20px_rgba(147,51,234,0.5)] border border-purple-400/60 scale-105'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CAROUSEL CONTAINER (3 CARDS SIDE-BY-SIDE ON DESKTOP MATCHING MOCKUP) */}
        <div className="relative group/carousel px-2 sm:px-10">
          
          {/* Previous Arrow Button */}
          <button
            ref={prevRef}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[#0F1225]/90 border border-purple-500/50 hover:bg-purple-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.5)] transition-all cursor-pointer hover:scale-110 active:scale-95"
            aria-label="Previous Item"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Next Arrow Button */}
          <button
            ref={nextRef}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[#0F1225]/90 border border-purple-500/50 hover:bg-purple-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.5)] transition-all cursor-pointer hover:scale-110 active:scale-95"
            aria-label="Next Item"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Swiper Component */}
          <Swiper
            key={activeTab}
            modules={[Autoplay, Pagination, Navigation]}
            spaceBetween={24}
            slidesPerView={1}
            loop={true}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
            }}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 3, // Exactly 3 Cards Desktop Layout matching mockup 1:1
                spaceBetween: 28,
              },
            }}
            className="pb-14 pt-4"
          >
            {currentItems.map((item) => (
              <SwiperSlide key={item.id} className="h-auto">
                {/* GLASS PRODUCT CARD (70% HERO IMAGE PROPORTIONS) */}
                <div className={`glass-panel group relative rounded-3xl border bg-[#0A0D1A]/90 backdrop-blur-xl p-5 transition-all duration-500 flex flex-col justify-between h-full transform hover:-translate-y-2 ${
                  item.featured 
                    ? 'border-pink-500/60 shadow-[0_0_30px_rgba(236,72,153,0.2)] hover:border-pink-400 hover:shadow-[0_0_45px_rgba(236,72,153,0.4)]' 
                    : 'border-white/10 hover:border-purple-500/80 hover:shadow-[0_0_35px_rgba(147,51,234,0.4)]'
                }`}>
                  
                  {/* TOP BADGES BAR */}
                  <div className="flex items-center justify-between z-10 mb-2">
                    <div>
                      {item.badge && (
                        <span className="px-3 py-1 rounded-xl bg-purple-950/80 border border-purple-500/50 text-purple-300 text-[10px] font-cyber font-bold uppercase tracking-wider shadow-md">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    {item.status === 'SOLD_OUT' ? (
                      <span className="px-3 py-1 rounded-xl bg-red-950/80 border border-red-500/50 text-red-400 text-[10px] font-cyber font-bold flex items-center gap-1.5 shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> OUT OF STOCK
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-[10px] font-cyber font-bold flex items-center gap-1.5 shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> AVAILABLE
                      </span>
                    )}
                  </div>

                  {/* HERO PRODUCT IMAGE (OCCUPIES ALMOST 70% OF THE CARD AS SPECIFIED) */}
                  <div className="relative h-64 sm:h-72 w-full flex items-center justify-center py-4 my-2 overflow-hidden rounded-2xl bg-gradient-to-b from-black/40 to-purple-950/20 border border-white/5 group-hover:border-purple-500/40 transition-all">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-auto object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-[0_15px_25px_rgba(0,0,0,0.9)]"
                      loading="lazy" decoding="async" />
                  </div>

                  {/* PRODUCT DETAILS & PRICING */}
                  <div className="space-y-3 mt-3 text-left">
                    <div>
                      <h3 className="font-cyber text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                        {item.name}
                      </h3>
                      <span className="text-xs font-mono text-gray-400 block mt-0.5">
                        {item.size}
                      </span>
                    </div>

                    <div className="flex items-end justify-between pt-2 border-t border-white/10">
                      <div>
                        <div className="font-mono text-2xl font-black text-amber-300 tracking-wide">
                          {item.price}
                        </div>
                      </div>

                      {/* LARGE ORDER BUTTON */}
                      {item.status === 'SOLD_OUT' ? (
                        <button 
                          disabled
                          className="px-4 py-2.5 rounded-xl bg-gray-900 border border-white/10 text-gray-500 font-cyber text-xs font-bold flex items-center gap-2 cursor-not-allowed"
                        >
                          Out of Stock
                        </button>
                      ) : (
                        <button 
                          onClick={() => setSelectedProduct(item)}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-cyber text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(147,51,234,0.4)] transition-all cursor-pointer"
                        >
                          <ShoppingBag className="w-4 h-4" /> Order at Counter
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* BOTTOM FEATURE STRIP MATCHING MOCKUP 1:1 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#090B16] border border-white/10 backdrop-blur-md grid grid-cols-2 md:grid-cols-4 gap-4 text-left font-sans">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-400 shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-cyber text-xs font-bold text-white uppercase tracking-wider">FRESH & PREMIUM</h4>
              <p className="text-[11px] text-gray-400 font-mono">Best Quality Products</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-cyber text-xs font-bold text-white uppercase tracking-wider">HYGIENIC & SAFE</h4>
              <p className="text-[11px] text-gray-400 font-mono">100% Clean & Safe</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pink-950/60 border border-pink-500/30 text-pink-400 shrink-0">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-cyber text-xs font-bold text-white uppercase tracking-wider">GAMER APPROVED</h4>
              <p className="text-[11px] text-gray-400 font-mono">Loved by Gamers</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-cyber text-xs font-bold text-white uppercase tracking-wider">QUICK SERVICE</h4>
              <p className="text-[11px] text-gray-400 font-mono">Order at Counter</p>
            </div>
          </div>
        </div>

      </div>

      {/* ORDER AT COUNTER POPUP MODAL */}
      {selectedProduct && (
        <Suspense fallback={null}>
          <OrderAtCounterModal
            product={selectedProduct}
            isOpen={!!selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        </Suspense>
      )}
    </section>
  );
}
