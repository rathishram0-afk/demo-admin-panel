import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Gamepad2, 
  User, 
  Users,
  Phone, 
  CheckCircle, 
  Sparkles, 
  X, 
  Loader2, 
  ChevronDown, 
  Send, 
  Lock
} from 'lucide-react';
import { openVenueWhatsAppForBooking } from '../utils/whatsapp';
import { bookingService } from '../services/bookingService';
import { useSiteContext } from '../context/SiteContext';

// Duration options per zone
const ZONE_DURATIONS = {
  'PlayStation 2': ['1 Hour', '2 Hours', '3 Hours'],
  'PlayStation 4': ['1 Hour', '2 Hours', '3 Hours'],
  'PlayStation 5': ['30 Minutes', '1 Hour', '2 Hours', '3 Hours'],
  'PS VR2 Virtual Reality': ['20 Minutes', '40 Minutes', '1 Hour'],
  'Racing Simulator': ['30 Minutes', '1 Hour', '1.5 Hours']
};

// Calculate exact price based on Zone, Duration, and Weekday/Weekend status
const calculateBookingPrice = (zone, duration, isWeekend, pricingContext) => {
  const tierKey = isWeekend ? 'weekends' : 'weekdays';
  const platforms = pricingContext?.[tierKey] || [];
  
  const normalizedZone = String(zone).toLowerCase().replace(' virtual reality', '');
  const platform = platforms.find(p => {
    const pName = String(p.platform).toLowerCase();
    return pName === normalizedZone || normalizedZone.includes(pName) || pName.includes(normalizedZone);
  });
  
  if (platform && platform.rates) {
    const normalizedDur = String(duration).toLowerCase();
    const rate = platform.rates.find(r => String(r.hours).toLowerCase() === normalizedDur || (normalizedDur === '30 minutes' && String(r.hours).toLowerCase() === '30 mins'));
    if (rate) {
      const priceVal = parseInt(String(rate.price).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(priceVal)) return priceVal;
    }
  }

  const rates = {
    'PlayStation 2': {
      weekday: { '1 Hour': 60, '2 Hours': 110, '3 Hours': 160 },
      weekend: { '1 Hour': 70, '2 Hours': 120, '3 Hours': 190 }
    },
    'PlayStation 4': {
      weekday: { '1 Hour': 80, '2 Hours': 150, '3 Hours': 220 },
      weekend: { '1 Hour': 90, '2 Hours': 160, '3 Hours': 220 }
    },
    'PlayStation 5': {
      weekday: { '30 Minutes': 60, '1 Hour': 100, '2 Hours': 180, '3 Hours': 280 },
      weekend: { '30 Minutes': 60, '1 Hour': 100, '2 Hours': 200, '3 Hours': 280 }
    },
    'PS VR2 Virtual Reality': {
      weekday: { '20 Minutes': 100, '40 Minutes': 160, '1 Hour': 220 },
      weekend: { '20 Minutes': 100, '40 Minutes': 160, '1 Hour': 220 }
    },
    'Racing Simulator': {
      weekday: { '30 Minutes': 100, '1 Hour': 180, '1.5 Hours': 250 },
      weekend: { '30 Minutes': 100, '1 Hour': 180, '1.5 Hours': 250 }
    }
  };

  const zoneRates = rates[zone] || rates['PlayStation 5'];
  const dayRates = isWeekend ? zoneRates.weekend : zoneRates.weekday;
  return dayRates[duration] || Object.values(dayRates)[0] || 100;
};

// Helper to generate 30-minute interval time slots based on day of week
const getTimeSlotsForDate = (dateStr) => {
  let isWeekend = false;
  if (dateStr) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const day = d.getDay(); // 0 = Sun, 6 = Sat
      if (day === 0 || day === 6) {
        isWeekend = true;
      }
    }
  }

  const startHour = isWeekend ? 10 : 11;
  const endHour = 22; // 10 PM
  const slots = [];

  for (let h = startHour; h <= endHour; h++) {
    const period = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    const hStr = h12 < 10 ? `0${h12}` : `${h12}`;

    slots.push(`${hStr}:00 ${period}`);
    slots.push(`${hStr}:30 ${period}`);
  }

  return slots;
};

export default function BookingModal({ isOpen, onClose }) {
  const { pricing } = useSiteContext();
  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    zone: 'PlayStation 5',
    date: todayStr,
    time: '02:30 PM',
    hours: '2 Hours',
    players: '1'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState(null);
  
  // NEW: Live Slot Availability & Conflict Error
  const [slotAvailability, setSlotAvailability] = useState({});
  const [conflictError, setConflictError] = useState('');

  // Determine if selected date is weekend
  const isWeekendBooking = (() => {
    if (!formData.date) return false;
    const parts = formData.date.split('-');
    if (parts.length !== 3) return false;
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const day = d.getDay();
    return day === 0 || day === 6;
  })();

  // Available time slots based on date
  const timeSlots = getTimeSlotsForDate(formData.date);
  
  // Available durations based on zone
  const availableDurations = ZONE_DURATIONS[formData.zone] || ZONE_DURATIONS['PlayStation 5'];

  // Current Total Price: Base Configured Rate x Selected Players
  const basePricePerPlayer = calculateBookingPrice(formData.zone, formData.hours, isWeekendBooking, pricing);
  const totalPrice = basePricePerPlayer * Number(formData.players || 1);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSubmittedBooking(null);
      setIsSubmitting(false);
      setConflictError('');
      const initialDate = new Date().toISOString().split('T')[0];
      setFormData({
        name: '',
        phone: '',
        zone: 'PlayStation 5',
        date: initialDate,
        time: '02:30 PM',
        hours: '2 Hours',
        players: '1'
      });
    }
  }, [isOpen]);

  // Fetch Live Slot Availability whenever Zone or Date changes
  useEffect(() => {
    if (!isOpen) return;
    
    let isMounted = true;
    const fetchAvailability = async () => {
      const avail = await bookingService.getSlotAvailability(formData.zone, formData.date, timeSlots);
      if (isMounted) {
        setSlotAvailability(avail);
        
        // Auto-select first available slot if current is fully booked
        if (avail[formData.time] === 'Fully Booked') {
          const firstAvailable = timeSlots.find(slot => avail[slot] !== 'Fully Booked');
          if (firstAvailable) {
            setFormData(prev => ({ ...prev, time: firstAvailable }));
          }
        }
      }
    };
    fetchAvailability();
    
    return () => { isMounted = false; };
  }, [formData.zone, formData.date, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'zone') {
      const newDurations = ZONE_DURATIONS[value] || ZONE_DURATIONS['PlayStation 5'];
      setFormData(prev => ({
        ...prev,
        zone: value,
        hours: newDurations.includes(prev.hours) ? prev.hours : newDurations[0]
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    const availableSlots = getTimeSlotsForDate(newDate);
    
    setFormData(prev => ({
      ...prev,
      date: newDate,
      time: availableSlots.includes(prev.time) ? prev.time : availableSlots[0]
    }));
    window.getSelection()?.removeAllRanges();
    e.target.blur();
  };

  const handleDateClick = (e) => {
    try { e.target.showPicker(); } catch(err) { e.target.focus(); }
  };

  const isFormValid = 
    formData.name.trim().length >= 2 && 
    formData.phone.trim().length === 10 && 
    formData.zone !== '' && 
    formData.date !== '' && 
    formData.time !== '' && 
    formData.hours !== '' &&
    formData.players !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;
    
    setIsSubmitting(true);
    setConflictError('');

    try {
      // 1. SMART BOOKING CONFLICT DETECTION
      const isConflict = await bookingService.checkConflict(formData.zone, formData.date, formData.time);
      if (isConflict) {
        setConflictError('This time slot is already booked.\nPlease choose another available slot.');
        setIsSubmitting(false);
        return;
      }

      // 2. Process Booking
      const payload = {
        ...formData,
        players: Number(formData.players || 1),
        price: totalPrice,
        bookingType: isWeekendBooking ? 'Weekend Booking' : 'Weekday Booking'
      };
      const createdBooking = await bookingService.createBooking(payload);
      openVenueWhatsAppForBooking(createdBooking);
      setSubmittedBooking(createdBooking);
    } catch (err) {
      console.error('Failed to submit booking:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={onClose}
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full max-w-[480px] rounded-[28px] bg-[#090714]/95 border border-pink-500/40 relative shadow-[0_0_50px_rgba(236,72,153,0.25)] flex flex-col overflow-hidden my-auto max-h-[92vh]"
        >
          {/* Header */}
          <div className="relative pt-5 pb-3.5 px-5 text-center shrink-0 border-b border-white/10">
            {/* Top Right Close X Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-900/80 border border-white/20 hover:border-pink-500 text-gray-300 hover:text-white flex items-center justify-center transition-all duration-300"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 mb-1">
              <Calendar className="w-5 h-5 text-pink-500 filter drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
              <h2 className="text-xl sm:text-2xl font-cyber font-black text-white uppercase tracking-wider">
                BOOK YOUR <span className="text-pink-500">SESSION</span>
              </h2>
            </div>
            
            {/* COMPACT AUTOMATIC BOOKING TYPE BADGE */}
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-cyber font-extrabold uppercase tracking-wider ${
                isWeekendBooking
                  ? 'bg-pink-950/60 border border-pink-500/50 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.3)]'
                  : 'bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
              }`}>
                {isWeekendBooking ? '🟣 Weekend Booking' : '🔵 Weekday Booking'}
              </span>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 relative">
            
            {/* CONFLICT ERROR POPUP OVERLAY */}
            <AnimatePresence>
              {conflictError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                >
                  <div className="bg-[#120a17] border border-red-500/50 rounded-2xl p-6 text-center max-w-[85%] shadow-[0_0_40px_rgba(239,68,68,0.35)]">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500 mx-auto flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                      <X className="w-6 h-6 text-red-400" />
                    </div>
                    <h3 className="font-cyber text-sm font-black text-white uppercase tracking-wider mb-2">
                      SLOT UNAVAILABLE
                    </h3>
                    <p className="text-xs text-red-300 font-sans leading-relaxed whitespace-pre-line mb-5 font-medium">
                      {conflictError}
                    </p>
                    <button
                      type="button"
                      onClick={() => setConflictError('')}
                      className="px-6 py-2.5 rounded-xl bg-red-950/80 border border-red-500 hover:bg-red-900 transition-colors text-[11px] font-cyber tracking-widest text-white uppercase shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                    >
                      TRY ANOTHER SLOT
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {submittedBooking ? (
              <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 rounded-full bg-pink-500/20 border-2 border-pink-500 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(255,0,127,0.6)]">
                  <CheckCircle className="w-8 h-8 text-pink-400" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-cyber text-xl font-black text-white uppercase tracking-wider">
                    REQUEST SUBMITTED!
                  </h3>
                  <p className="text-xs text-cyan-300 font-sans leading-relaxed font-semibold px-2">
                    Booking Request Submitted Successfully.<br/>
                    Our team will contact you shortly to confirm your booking.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/90 border border-purple-500/30 font-mono text-left text-[11px] space-y-2 mt-2">
                  <div className="flex justify-between border-b border-white/10 pb-1.5">
                    <span className="text-gray-400">BOOKING ID:</span>
                    <span className="text-pink-400 font-bold">
                      {submittedBooking.id ? `GF-${submittedBooking.id.toString().substring(0,8).toUpperCase()}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">CUSTOMER NAME:</span>
                    <span className="text-white">{submittedBooking.customer_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">GAMING ZONE:</span>
                    <span className="text-cyan-400">{submittedBooking.gaming_zone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">PLAYERS:</span>
                    <span className="text-emerald-400 font-bold">{submittedBooking.player_count || submittedBooking.players || 1} {Number(submittedBooking.player_count || submittedBooking.players || 1) === 1 ? 'Player' : 'Players'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">BOOKING DATE:</span>
                    <span className="text-white">{submittedBooking.booking_date || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">BOOKING TIME:</span>
                    <span className="text-white">{submittedBooking.booking_time || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">DURATION:</span>
                    <span className="text-white">{submittedBooking.duration || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">PAYMENT STATUS:</span>
                    <span className="text-amber-400">{submittedBooking.payment_status || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">BOOKING STATUS:</span>
                    <span className="text-purple-400">{submittedBooking.booking_status || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-1.5 font-bold">
                    <span className="text-gray-300">TOTAL AMOUNT:</span>
                    <span className="text-pink-400">₹{submittedBooking.total_amount || 'N/A'}</span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="btn-cyber-pink w-full py-3 rounded-xl font-cyber font-black text-xs tracking-widest uppercase mt-4 shadow-[0_0_25px_rgba(236,72,153,0.5)]"
                >
                  CLOSE
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                
                {/* 6 FIELDS - COMPACT 2 COLUMNS GRID */}
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* FULL NAME */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3 h-3 text-pink-400" /> FULL NAME
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Rathish Kumar"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#060812] border border-white/15 focus:border-pink-500 text-xs text-white placeholder-gray-600 outline-none transition-all"
                      required
                    />
                  </div>

                  {/* MOBILE NUMBER */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1">
                      <Phone className="w-3 h-3 text-cyan-400" /> MOBILE NUMBER
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9344176534"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#060812] border border-white/15 focus:border-cyan-400 text-xs text-white placeholder-gray-600 outline-none transition-all font-mono"
                      required
                    />
                  </div>

                  {/* GAMING ZONE */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1">
                      <Gamepad2 className="w-3 h-3 text-purple-400" /> GAMING ZONE
                    </label>
                    <div className="relative">
                      <select
                        name="zone"
                        value={formData.zone}
                        onChange={handleChange}
                        className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-[#060812] border border-white/15 focus:border-purple-500 text-xs text-white outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="PlayStation 2" className="bg-slate-900 text-white">PlayStation 2</option>
                        <option value="PlayStation 4" className="bg-slate-900 text-white">PlayStation 4</option>
                        <option value="PlayStation 5" className="bg-slate-900 text-white">PlayStation 5</option>
                        <option value="PS VR2 Virtual Reality" className="bg-slate-900 text-white">PS VR2 Virtual Reality</option>
                        <option value="Racing Simulator" className="bg-slate-900 text-white">Racing Simulator</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-purple-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* BOOKING DATE */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-pink-400" /> BOOKING DATE
                    </label>
                    <div className="relative" onClick={handleDateClick}>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleDateChange}
                        className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-[#060812] border border-white/15 focus:border-pink-500 text-xs text-white outline-none transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        required
                      />
                      <Calendar className="w-4 h-4 text-pink-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* DURATION */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3 text-yellow-400" /> DURATION
                    </label>
                    <div className="relative">
                      <select
                        name="hours"
                        value={formData.hours}
                        onChange={handleChange}
                        className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-[#060812] border border-white/15 focus:border-yellow-500 text-xs text-white outline-none transition-all appearance-none cursor-pointer"
                      >
                        {availableDurations.map((dur) => (
                          <option key={dur} value={dur} className="bg-slate-900 text-white">
                            {dur}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-yellow-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* TIME SLOT */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" /> TIME SLOT
                    </label>
                    <div className="relative">
                      <select
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-[#060812] border border-white/15 focus:border-cyan-400 text-xs text-white outline-none transition-all appearance-none cursor-pointer"
                        required
                      >
                        {timeSlots.map((slot) => {
                          const status = slotAvailability[slot] || 'Available';
                          let emoji = '🟢';
                          let statusText = '';
                          let disabled = false;
                          
                          if (status === 'Limited') {
                            emoji = '🟡';
                            statusText = ' (Limited)';
                          } else if (status === 'Fully Booked') {
                            emoji = '🔴';
                            statusText = ' (Fully Booked)';
                            disabled = true;
                          }

                          return (
                            <option key={slot} value={slot} disabled={disabled} className="bg-slate-900 text-white">
                              {emoji} {slot}{statusText}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="w-4 h-4 text-cyan-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* PLAYERS DROPDOWN */}
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3 h-3 text-emerald-400" /> PLAYERS
                    </label>
                    <div className="relative">
                      <select
                        name="players"
                        value={formData.players}
                        onChange={handleChange}
                        className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-[#060812] border border-white/15 focus:border-emerald-400 text-xs text-white outline-none transition-all appearance-none cursor-pointer"
                        required
                      >
                        <option value="1" className="bg-slate-900 text-white">1 Player</option>
                        <option value="2" className="bg-slate-900 text-white">2 Players</option>
                        <option value="3" className="bg-slate-900 text-white">3 Players</option>
                        <option value="4" className="bg-slate-900 text-white">4 Players</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-emerald-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                </div>

                {/* COMPACT BOOKING SUMMARY BEFORE SUBMIT */}
                <div className="p-3.5 mt-2 rounded-xl bg-slate-900/40 border border-white/10 space-y-1.5 font-mono text-[10px] text-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">GAMING ZONE:</span>
                    <span className="text-white text-right">{formData.zone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">PLAYERS:</span>
                    <span className="text-emerald-400 font-bold text-right">{formData.players} {Number(formData.players) === 1 ? 'Player' : 'Players'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">BOOKING DATE:</span>
                    <span className="text-white text-right">{formData.date}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">TIME SLOT:</span>
                    <span className="text-white text-right">{formData.time}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">DURATION:</span>
                    <span className="text-white text-right">{formData.hours}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">TYPE:</span>
                    <span className={isWeekendBooking ? "text-pink-400" : "text-cyan-400"}>
                      {isWeekendBooking ? 'Weekend Booking' : 'Weekday Booking'}
                    </span>
                  </div>
                </div>

                {/* COMPACT TOTAL PRICE BAR DIRECTLY ABOVE ACTION BUTTONS */}
                <div className="py-2.5 px-4 rounded-xl bg-purple-950/40 border border-purple-500/40 flex items-center justify-between shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                  <span className="text-xs font-cyber font-bold text-gray-300 uppercase tracking-wider">
                    TOTAL PRICE
                  </span>
                  <div className="text-2xl font-cyber font-black text-pink-400 drop-shadow-[0_0_12px_rgba(255,0,127,0.8)]">
                    ₹ {totalPrice}
                  </div>
                </div>

                {/* ACTION BUTTONS (ALWAYS VISIBLE SIDE BY SIDE) */}
                <div className="grid grid-cols-12 gap-2.5 pt-1">
                  {/* CANCEL BUTTON */}
                  <button
                    type="button"
                    onClick={onClose}
                    className="col-span-4 py-3 rounded-xl bg-slate-900 border border-white/20 hover:border-white/40 text-xs font-cyber font-bold text-gray-300 hover:text-white transition-all duration-300 flex items-center justify-center gap-1.5 uppercase cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> CANCEL
                  </button>

                  {/* SUBMIT BOOKING BUTTON */}
                  <button
                    type="submit"
                    disabled={!isFormValid || isSubmitting}
                    className={`col-span-8 py-3 rounded-xl text-xs font-cyber font-black tracking-widest uppercase flex items-center justify-center gap-2 transition-all duration-300 ${
                      isFormValid && !isSubmitting
                        ? 'btn-cyber-pink shadow-[0_0_25px_rgba(236,72,153,0.6)] cursor-pointer hover:scale-[1.02]'
                        : 'bg-slate-900 border border-white/10 text-gray-500 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        <span>PROCESSING...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-white" />
                        SUBMIT BOOKING
                      </>
                    )}
                  </button>
                </div>

                {/* SECURITY FOOTER NOTE */}
                <div className="text-center pt-0.5">
                  <span className="text-[10px] font-sans text-gray-400 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3 text-pink-400" /> Secure booking with <strong className="text-gray-200">G-FORCE Gaming Hub</strong>
                  </span>
                </div>

              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
