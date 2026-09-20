import React, { useState, useEffect } from 'react';
import { Menu, X, Flame, ChevronRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar({ onOpenBooking }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'HOME', href: '#hero' },
    { name: 'ABOUT US', href: '#why-choose-us' },
    { name: 'GAMES', href: '#games' },
    { name: 'PRICING', href: '#pricing' },
    { name: 'MEMBERSHIPS', href: '#membership' },
    { name: 'GALLERY', href: '#gallery' },
    { name: 'CONTACT', href: '#contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/85 backdrop-blur-xl border-b border-pink-500/20 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.8)]'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Logo & Branding matching specifications */}
        <a href="#hero" className="flex items-center gap-3 group select-none">
          <img
            src="/images/logo/gforcehub-logo.jpg"
            alt="G-FORCE Gaming Hub Logo"
            className="h-[40px] md:h-[44px] lg:h-[48px] w-auto object-contain rounded-lg transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.6)] border border-indigo-500/10 cursor-pointer"
            loading="lazy" loading="lazy" decoding="async" />
          <div className="flex flex-col justify-center leading-none text-left">
            <span className="font-cyber font-extrabold text-sm sm:text-base md:text-lg tracking-wider text-white">
              G-FORCE
            </span>
            <span className="text-gradient-pink text-[9px] sm:text-[10px] md:text-xs font-bold tracking-widest uppercase font-sans mt-0.5">
              GAMING HUB
            </span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-xs font-cyber tracking-widest text-gray-300 hover:text-pink-400 transition-colors uppercase relative group py-1"
            >
              {link.name}
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-pink-500 to-cyan-400 group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </nav>

        {/* Desktop Call To Action & Admin Button */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/admin/login"
            className="px-3.5 py-2 rounded-lg bg-slate-900/90 border border-cyan-500/40 hover:border-cyan-400 text-[11px] font-cyber font-bold tracking-widest text-cyan-300 hover:text-white flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(0,240,255,0.2)] cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>ADMIN PANEL</span>
          </Link>

          <button
            onClick={onOpenBooking}
            className="btn-cyber-pink px-5 py-2.5 rounded-lg text-xs tracking-wider flex items-center gap-2 group cursor-pointer"
          >
            <Flame className="w-4 h-4 text-yellow-300 group-hover:rotate-12 transition-transform" />
            BOOK NOW
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg bg-slate-900 border border-pink-500/30 text-pink-400 hover:text-white"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-pink-500/30 px-6 py-6 space-y-4 animate-in slide-in-from-top duration-300">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-cyber text-gray-200 hover:text-pink-400 py-2 border-b border-white/5 flex items-center justify-between"
            >
              <span>{link.name}</span>
              <ChevronRight className="w-4 h-4 text-pink-500" />
            </a>
          ))}
          <Link
            to="/admin/login"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full py-2.5 rounded-lg bg-slate-900 border border-cyan-500/40 text-cyan-300 text-xs font-cyber font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>ADMIN PANEL</span>
          </Link>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenBooking && onOpenBooking();
            }}
            className="btn-cyber-pink w-full py-3 rounded-lg text-center text-xs tracking-wider font-bold block mt-2 cursor-pointer"
          >
            RESERVE SESSION NOW
          </button>
        </div>
      )}
    </header>
  );
}
