import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Star, User } from 'lucide-react';

const REAL_REVIEWS = [
  {
    name: "Charles Arokiyaraj",
    time: "2 weeks ago",
    rating: 5,
    text: "The place has a great gaming vibe with comfortable seating and a clean environment. The staff are very kind, friendly, and helpful. Overall, it was a very good experience."
  },
  {
    name: "Dinesh Kumar",
    time: "3 weeks ago",
    rating: 5,
    text: "Nice game shop and excellent friendly staffs and atmosphere also very good."
  },
  {
    name: "SURIYA",
    time: "3 weeks ago",
    rating: 5,
    text: "Atmosphere, Cleanliness, Staff, Comfort. Fantastic place to hang out! The entire venue has a great mood with excellent ambient lighting and a clean modern setup. The seating is incredibly comfortable for long gaming sessions."
  },
  {
    name: "Abhi pikachu1306",
    time: "1 month ago",
    rating: 5,
    text: "Best place to hang out with friends."
  },
  {
    name: "Yaseen Kutty",
    time: "5 months ago",
    rating: 5,
    text: "Best gaming spot and affordable cost to play overall."
  },
  {
    name: "Sai Vishwa",
    time: "5 months ago",
    rating: 5,
    text: "Nice place and experience are good worth."
  },
  {
    name: "Ramakrishnan K",
    time: "4 months ago",
    rating: 5,
    text: "Best gaming hub in overall KK Nagar surroundings. Best service, best ambience and best price."
  },
  {
    name: "Sai Nikhil",
    time: "3 months ago",
    rating: 4,
    text: "Good experience, but less space."
  },
  {
    name: "Anbu Arasan",
    time: "2 months ago",
    rating: 5,
    text: "Best gaming hub in KK Nagar and affordable price for worth."
  },
  {
    name: "Suganya Suganya",
    time: "2 months ago",
    rating: 5,
    text: "Super galaty."
  },
  {
    name: "Anand Swaminathan",
    time: "3 weeks ago",
    rating: 5,
    text: "Nice hub."
  },
  {
    name: "Santhosh Kumar S",
    time: "5 months ago",
    rating: 5,
    text: "Super."
  },
  {
    name: "Rajmohan R",
    time: "5 days ago",
    rating: 5,
    text: "Very good place for having fun."
  },
  {
    name: "Shyam Kumar",
    time: "1 week ago",
    rating: 5,
    text: "Best gaming hub near Virugambakkam. All PS5 and PS4 available for playing with good ambience."
  },
  {
    name: "Ajaybalaji",
    time: "3 weeks ago",
    rating: 5,
    text: "Good vibe and good cooperation from the owners. Do visit with friends."
  }
];

export default function Reviews() {
  // Duplicate array once for seamless 100% infinite marquee loop
  const marqueeItems = [...REAL_REVIEWS, ...REAL_REVIEWS];

  return (
    <section id="reviews" className="py-24 relative bg-[#070A17] overflow-hidden select-none">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-pink-600/10 via-purple-600/15 to-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-900/50 to-purple-900/50 border border-pink-500/40 text-pink-300 text-xs font-cyber font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(255,0,127,0.3)]">
            <MessageSquare className="w-3.5 h-3.5 text-pink-400" />
            <span>PLAYER REVIEWS</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-cyber font-black tracking-wider text-white uppercase leading-tight">
            FEEDBACK FROM <span className="text-gradient-pink">THE ARENA</span>
          </h2>

          <p className="text-sm sm:text-base text-gray-300 font-sans font-medium leading-relaxed">
            See what Chennai's real gaming community has to say about G-FORCE Gaming Hub.
          </p>
        </div>

        {/* INFINITE HORIZONTAL MARQUEE CAROUSEL */}
        <div className="w-full overflow-hidden custom-scrollbar py-4 relative group">
          
          {/* Side Fading Edges Gradient Overlay */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#070A17] to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#070A17] to-transparent z-20 pointer-events-none" />

          {/* Marquee Track Container */}
          <div className="animate-marquee-continuous flex gap-6">
            {marqueeItems.map((review, idx) => (
              <div
                key={idx}
                className="w-[300px] sm:w-[360px] shrink-0 glass-panel bg-[#0C0A1D]/85 border border-white/10 hover:border-purple-500/60 rounded-2xl p-6 shadow-[0_0_20px_rgba(0,0,0,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.35)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-4"
              >
                {/* Gold Rating Stars */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                            : 'text-gray-600 fill-gray-700'
                        }`}
                      />
                    ))}
                  </div>

                  <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                    {review.time}
                  </span>
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-gray-200 font-sans leading-relaxed italic line-clamp-4">
                  "{review.text}"
                </p>

                {/* Reviewer Details */}
                <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 flex items-center justify-center shadow-md shrink-0">
                    <div className="w-full h-full bg-[#070A17] rounded-[10px] flex items-center justify-center">
                      <User className="w-4 h-4 text-purple-400" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-cyber text-xs font-bold text-white tracking-wide">
                      {review.name}
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Verified Gamer
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
