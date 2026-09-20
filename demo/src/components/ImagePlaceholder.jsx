import React from 'react';
import { Image, Upload, Sparkles } from 'lucide-react';

export default function ImagePlaceholder({
  label = "IMAGE PLACEHOLDER",
  aspectRatio = "aspect-video",
  accent = "pink",
  className = ""
}) {
  const borderStyle = accent === "cyan" 
    ? "border-cyan-500/40 group-hover:border-cyan-400 group-hover:shadow-[0_0_20px_rgba(0,240,255,0.35)]" 
    : "border-pink-500/40 group-hover:border-pink-400 group-hover:shadow-[0_0_20px_rgba(255,0,127,0.35)]";

  const glowBg = accent === "cyan"
    ? "bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-purple-950/40"
    : "bg-gradient-to-br from-pink-950/40 via-slate-900/90 to-cyan-950/40";

  const textColor = accent === "cyan" ? "text-cyan-400" : "text-pink-400";

  return (
    <div
      className={`relative w-full ${aspectRatio} rounded-xl border ${borderStyle} ${glowBg} overflow-hidden flex flex-col items-center justify-center transition-all duration-300 group ${className}`}
    >
      {/* Corner Cyber Crosshairs */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-white/30" />
      <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-white/30" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-white/30" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-white/30" />

      {/* Cyber Scanline overlay */}
      <div className="scanline" />

      {/* Center Icon & Label */}
      <div className="relative z-10 flex flex-col items-center justify-center p-4 text-center">
        <div className={`w-12 h-12 rounded-full ${accent === 'cyan' ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-pink-500/10 border-pink-500/30'} border flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
          <Image className={`w-6 h-6 ${textColor}`} />
        </div>

        <span className="font-cyber text-xs tracking-wider font-semibold text-gray-200 uppercase mb-1">
          {label}
        </span>
        <span className="text-[10px] text-gray-400 font-mono tracking-tight flex items-center gap-1">
          <Upload className="w-3 h-3 text-gray-500" /> Replace Image Manually
        </span>
      </div>

      {/* Subtle tech watermark badge */}
      <div className="absolute bottom-2 right-3 font-mono text-[9px] text-gray-600 tracking-widest uppercase">
        G-FORCE // MEDIA SLOT
      </div>
    </div>
  );
}
