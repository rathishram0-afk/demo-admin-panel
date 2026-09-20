import React from 'react';
import { Play, Video, Sparkles } from 'lucide-react';

export default function VideoPlaceholder() {
  return (
    <div className="relative w-full max-w-5xl mx-auto mt-10 rounded-2xl overflow-hidden glass-panel-glow border-2 border-pink-500/50 shadow-[0_0_50px_rgba(255,0,127,0.3)] group transition-all duration-500 hover:border-cyan-400 hover:shadow-[0_0_60px_rgba(0,240,255,0.4)]">
      {/* 16:9 Aspect Ratio Container */}
      <div className="relative w-full aspect-video bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-900 flex flex-col items-center justify-center p-6 text-center">
        {/* Subtle Cyber Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-950/20 via-transparent to-black opacity-80" />
        <div className="scanline opacity-70" />

        {/* Outer Glowing Pulsing Ring */}
        <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-pink-500 to-cyan-400 p-[2px] shadow-[0_0_30px_rgba(255,0,127,0.6)] animate-pulse mb-5 group-hover:scale-110 transition-transform duration-300">
          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center pl-1">
            <Play className="w-10 h-10 text-pink-400 fill-pink-400/30 group-hover:text-cyan-400 group-hover:fill-cyan-400/30 transition-colors" />
          </div>
        </div>

        {/* Text Details */}
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-cyber text-xs font-mono">
            <Video className="w-3.5 h-3.5 text-pink-400" />
            <span>CINEMATIC 16:9 VIDEO CONTAINER</span>
          </div>

          <h3 className="font-cyber text-lg sm:text-2xl font-bold text-white tracking-wide">
            INSERT CINEMATIC GAMING VIDEO HERE
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto font-raj">
            Embed your YouTube / MP4 gameplay reel or 4K cafe tour video. Glowing responsive frame pre-configured.
          </p>
        </div>

        {/* Tech Overlay Corners */}
        <div className="absolute top-4 left-4 font-mono text-[11px] text-pink-500/70 tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
          VIDEO_FEED // 4K_HDR 60FPS
        </div>
        <div className="absolute bottom-4 right-4 font-mono text-[10px] text-cyan-400/70 tracking-widest">
          STATUS: READY_FOR_EMBED
        </div>
      </div>
    </div>
  );
}
