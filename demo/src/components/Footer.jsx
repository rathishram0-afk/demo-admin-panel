import React, { useState } from 'react';
import { ArrowUp, Globe, Share2, Video, MessageSquare, Send, Mail, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteContext } from '../context/SiteContext';

export default function Footer() {
  const { cms } = useSiteContext();
  const details = cms.contact || {};
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim().length > 4) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-slate-950 border-t border-white/10 pt-16 pb-28 md:pb-12 text-gray-400 font-raj">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10 text-left">
          
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo/gforcehub-logo.jpg"
                alt="G-FORCE Gaming Hub Logo"
                className="h-10 w-auto object-contain rounded-lg border border-indigo-500/10" loading="lazy" decoding="async" />
              <div className="flex flex-col">
                <span className="font-cyber font-extrabold text-base tracking-wider text-white flex flex-col leading-none">
                  <span>G-FORCE</span>
                  <span className="text-gradient-pink text-xs font-semibold mt-0.5">Gaming Hub</span>
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-gray-400 font-medium">
              Chennai's premier luxury cyberpunk gaming lounge. Featuring PlayStation 5, VR2, PS4, PS2 Retro & Racing Simulators.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 hover:border-pink-500 flex items-center justify-center text-gray-400 hover:text-pink-400 transition-colors" title="Instagram">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 hover:border-cyan-400 flex items-center justify-center text-gray-400 hover:text-cyan-400 transition-colors" title="YouTube">
                <Video className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 hover:border-purple-500 flex items-center justify-center text-gray-400 hover:text-purple-400 transition-colors" title="Discord">
                <MessageSquare className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 hover:border-pink-500 flex items-center justify-center text-gray-400 hover:text-pink-400 transition-colors" title="Social Share">
                <Share2 className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-cyber text-xs font-bold text-white tracking-widest uppercase mb-4">
              QUICK LINKS
            </h3>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li><a href="#hero" className="hover:text-pink-400 transition-colors">Home</a></li>
              <li><a href="#why-choose-us" className="hover:text-pink-400 transition-colors font-sans">Why Choose Us</a></li>
              <li><a href="#games" className="hover:text-pink-400 transition-colors">Featured Games</a></li>
              <li><a href="#pricing" className="hover:text-pink-400 transition-colors">Pricing & Rates</a></li>
              <li><a href="#membership" className="hover:text-pink-400 transition-colors">VIP Membership</a></li>
              <li><a href="#booking" className="hover:text-pink-400 transition-colors">Book a Session</a></li>
              <li className="pt-1">
                <Link
                  to="/admin/login"
                  className="text-cyan-400 hover:text-white font-cyber flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Admin Panel
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details & Hours */}
          <div>
            <h3 className="font-cyber text-xs font-bold text-white tracking-widest uppercase mb-4">
              LOCATION & CONTACT
            </h3>
            <div className="space-y-3 text-xs font-semibold">
              <p className="text-white font-cyber font-bold text-sm tracking-wider">
                {details.businessName || "G-FORCE GAMING HUB"}
              </p>
              <p className="text-gray-400 font-normal leading-relaxed">
                {details.address || "2, Kanniyamman Kovil Street, Raghavendra Nagar, Nesapakkam, Chennai, Tamil Nadu – 600078"}
              </p>
              <div className="flex flex-col gap-1.5 pt-1">
                <a 
                  href={`https://wa.me/919344176534`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-mono text-emerald-400 font-bold hover:underline flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  +91 9344176534
                </a>
                <a 
                  href={`mailto:${details.email || 'gforcegaminghub@gmail.com'}`}
                  className="font-mono text-cyan-400 font-bold hover:underline flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  {details.email || 'gforcegaminghub@gmail.com'}
                </a>
                <div className="flex items-center gap-3 pt-1">
                  <a 
                    href={details.mapUrl || "https://www.google.com/maps/search/?api=1&query=G-FORCE+Gaming+Hub+2+Kanniyamman+Kovil+Street+Raghavendra+Nagar+Nesapakkam+Chennai+Tamil+Nadu+600078"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-pink-400 hover:text-pink-300 font-cyber text-[11px] font-bold tracking-wider flex items-center gap-1"
                  >
                    📍 Open Maps
                  </a>
                  <a 
                    href={details.directionsUrl || "https://www.google.com/maps/dir/?api=1&destination=G-FORCE+Gaming+Hub+2+Kanniyamman+Kovil+Street+Raghavendra+Nagar+Nesapakkam+Chennai+Tamil+Nadu+600078"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 font-cyber text-[11px] font-bold tracking-wider flex items-center gap-1"
                  >
                    🚗 Directions
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Luxury Newsletter Form */}
          <div>
            <h3 className="font-cyber text-xs font-bold text-white tracking-widest uppercase mb-4">
              NEWSLETTER SIGNUP
            </h3>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Subscribe to get exclusive tournament invites, priority bookings & weekly cash prize updates.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter cyber email"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/15 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-xs text-white placeholder-gray-500 outline-none transition-all pl-10"
                />
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
              </div>
              <button
                type="submit"
                className="btn-cyber-pink w-full py-2.5 rounded-xl text-xs font-cyber tracking-widest uppercase flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,0,127,0.4)]"
              >
                <span>SUBSCRIBE</span>
                <Send className="w-3.5 h-3.5" />
              </button>
              {subscribed && (
                <p className="text-[10px] text-cyan-400 font-mono tracking-tight text-center animate-pulse">
                  SYSTEM READY // EMAIL LOGGED
                </p>
              )}
            </form>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-gray-500">
          <p>© {new Date().getFullYear()} G-FORCE GAMING CAFE (CHENNAI). ALL RIGHTS RESERVED.</p>
          
          <button
            onClick={scrollToTop}
            className="px-4 py-2 rounded-lg bg-slate-900 border border-white/10 hover:border-pink-500 text-gray-300 hover:text-white flex items-center gap-2 transition-all"
          >
            <span>BACK TO TOP</span>
            <ArrowUp className="w-3.5 h-3.5 text-pink-400" />
          </button>
        </div>

      </div>
    </footer>
  );
}
