import React from 'react';
import { motion } from 'framer-motion';
import { useSiteContext } from '../context/SiteContext';
import { MapPin, Phone, Mail, Clock, ExternalLink, MessageSquare } from 'lucide-react';
import { openGeneralBookingWhatsApp } from '../utils/whatsapp';
import ErrorBoundary from './admin/ErrorBoundary';

export default function Contact() {
  const { cms } = useSiteContext();
  const details = cms.contact || {};

  const handleWhatsAppClick = (e) => {
    e.preventDefault();
    openGeneralBookingWhatsApp("Hi G-FORCE Gaming Hub! I would like to inquire about booking a gaming session.");
  };

  const OFFICIAL_MAPS_SEARCH_URL = "https://www.google.com/maps/search/?api=1&query=G-FORCE+Gaming+Hub+2+Kanniyamman+Kovil+Street+Raghavendra+Nagar+Nesapakkam+Chennai+Tamil+Nadu+600078";
  const OFFICIAL_MAPS_DIR_URL = "https://www.google.com/maps/dir/?api=1&destination=G-FORCE+Gaming+Hub+2+Kanniyamman+Kovil+Street+Raghavendra+Nagar+Nesapakkam+Chennai+Tamil+Nadu+600078";

  const handleOpenGoogleMaps = (e) => {
    e.preventDefault();
    const targetUrl = details.mapUrl || OFFICIAL_MAPS_SEARCH_URL;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleGetDirections = (e) => {
    e.preventDefault();
    const targetUrl = details.directionsUrl || OFFICIAL_MAPS_DIR_URL;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const phoneList = Array.isArray(details.phoneNumbers) && details.phoneNumbers.length > 0
    ? details.phoneNumbers
    : [details.phone || "+91 9344176534"];

  return (
    <ErrorBoundary moduleName="Contact & Location Section">
      <section id="contact" className="py-24 relative bg-[#070A17] overflow-hidden select-none">
        
        {/* Background Ambient Cyber Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-purple-600/10 via-pink-600/15 to-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          
          {/* SECTION HEADER */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-900/50 to-purple-900/50 border border-pink-500/40 text-pink-300 text-xs font-cyber font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(255,0,127,0.3)]">
              <MapPin className="w-3.5 h-3.5 text-pink-400" />
              <span>CONTACT US</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-cyber font-black tracking-wider text-white uppercase leading-tight">
              GET IN TOUCH <span className="text-gradient-pink">WITH US</span>
            </h2>

            <p className="text-sm sm:text-base text-gray-300 font-sans font-medium leading-relaxed">
              We'd love to hear from you. Drop by for a game or reach out directly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* INFO DETAILS GLASS PANEL */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass-panel bg-[#0C0A1D]/85 rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col justify-between text-left shadow-[0_0_30px_rgba(0,0,0,0.5)]"
            >
              <div className="space-y-5">
                
                {/* Location Card */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-pink-500/40 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-pink-400" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-cyber text-xs font-bold text-gray-400 uppercase tracking-widest">
                      LOCATION ADDRESS
                    </h3>
                    <div className="text-sm font-sans font-bold text-white leading-relaxed whitespace-pre-line">
                      {details.address || "G-FORCE Gaming Cafe, Main Road, Velachery, Chennai - 600042"}
                    </div>
                  </div>
                </div>

                {/* Phone & WhatsApp Card */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/40 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-cyber text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                      PHONE & WHATSAPP
                    </h3>
                    <div className="text-sm font-mono text-emerald-300 font-bold flex flex-col gap-1">
                      {phoneList.map((num, i) => (
                        <a key={i} href={`tel:${String(num).replace(/\s+/g, '')}`} className="hover:underline">
                          {num}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Email Card */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/40 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-cyber text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                      EMAIL ADDRESS
                    </h3>
                    <a href={`mailto:${details.email || 'gforcegaminghub@gmail.com'}`} className="text-sm font-mono text-gray-200 hover:text-pink-400 underline">
                      {details.email || 'gforcegaminghub@gmail.com'}
                    </a>
                  </div>
                </div>

                {/* Opening Hours Card */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/40 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-cyber text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                      OPENING HOURS
                    </h3>
                    <div className="text-xs font-sans font-medium text-gray-300 space-y-1">
                      <p>{details.hoursWeekday || 'Mon - Fri: 10:00 AM - 11:00 PM'}</p>
                      <p>{details.hoursWeekend || 'Sat - Sun: 09:30 AM - 11:30 PM'}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* ACTION BUTTONS (PRIMARY, DIRECTIONS & WHATSAPP) */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-white/10">
                {/* Button 1: Open in Google Maps */}
                <button
                  onClick={handleOpenGoogleMaps}
                  className="w-full py-3 px-3 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-white text-[11px] font-cyber font-bold tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-purple-300" />
                  <span>📍 OPEN MAPS</span>
                </button>

                {/* Button 2: Get Directions */}
                <button
                  onClick={handleGetDirections}
                  className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-[11px] font-cyber font-bold tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-pink-200" />
                  <span>🚗 GET DIRECTIONS</span>
                </button>

                {/* Button 3: Chat on WhatsApp */}
                <button
                  onClick={handleWhatsAppClick}
                  className="w-full py-3 px-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 text-[11px] font-cyber font-bold tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                  <span>💬 WHATSAPP</span>
                </button>
              </div>
            </motion.div>

            {/* INTERACTIVE REAL GOOGLE MAP CONTAINER */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass-panel-cyan rounded-2xl p-2 border border-cyan-500/30 flex flex-col relative overflow-hidden min-h-[450px] shadow-[0_0_30px_rgba(0,240,255,0.2)]"
            >
              <div className="relative w-full h-full rounded-xl bg-black overflow-hidden border border-cyan-500/20">
                
                {/* Real Embedded Google Map Iframe */}
                <iframe
                  title="G-FORCE Gaming Hub Google Maps Location"
                  src={details.mapEmbedUrl || "https://maps.google.com/maps?q=G-FORCE%20Gaming%20Hub%2C%202%2C%20Kanniyamman%20Kovil%20Street%2C%20Raghavendra%20Nagar%2C%20Nesapakkam%2C%20Chennai%2C%20Tamil%20Nadu%20600078&t=&z=16&ie=UTF8&iwloc=&output=embed"}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '430px' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full rounded-xl filter contrast-[1.05] brightness-[0.95]"
                />

                {/* Overlay Badge Bar */}
                <div className="absolute top-3 left-3 right-3 p-3 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-between z-10 text-xs">
                  <div className="flex items-center gap-2 text-left">
                    <MapPin className="w-4 h-4 text-pink-400 shrink-0" />
                    <span className="font-cyber font-bold text-white text-[11px] truncate">
                      G-FORCE GAMING HUB — NESAPAKKAM
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={handleOpenGoogleMaps}
                      className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-cyber font-bold cursor-pointer flex items-center gap-1 shadow-md"
                    >
                      <ExternalLink className="w-3 h-3" /> MAP
                    </button>
                    <button
                      onClick={handleGetDirections}
                      className="px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-[10px] font-cyber font-bold cursor-pointer flex items-center gap-1 shadow-md"
                    >
                      <MapPin className="w-3 h-3" /> DIRECTIONS
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>

          </div>

        </div>
      </section>
    </ErrorBoundary>
  );
}
