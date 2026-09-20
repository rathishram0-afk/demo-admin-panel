import React, { useState, useEffect } from 'react';
import { bookingService } from '../../../services/bookingService';
import { sessionService } from '../../../services/sessionService';
import { useRealtime } from '../../../context/RealtimeContext';
import BookingDetailsModal from '../BookingDetailsModal';
import ConvertBookingModal from '../ConvertBookingModal';
import { 
  Search, 
  Eye, 
  Trash2, 
  MessageSquare, 
  Play, 
  Calendar, 
  Clock, 
  RefreshCw, 
  Check, 
  X, 
  Filter,
  CheckCircle2
} from 'lucide-react';
import { openWhatsAppChat } from '../../../utils/whatsapp';

export default function BookingModule() {
  const { activeBookings, activeSessions } = useRealtime();
  const [onlineBookings, setOnlineBookings] = useState([]);
  const [walkIns, setWalkIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabFilter, setTabFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [convertModalBooking, setConvertModalBooking] = useState(null);
  const [rescheduleBookingId, setRescheduleBookingId] = useState(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState('');

  const fetchData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [bData, wData] = await Promise.all([
        bookingService.getBookings(),
        sessionService.getWalkInHistory()
      ]);
      setOnlineBookings(Array.isArray(bData) ? bData : []);
      setWalkIns(Array.isArray(wData) ? wData : []);
    } catch (e) {
      console.error('Failed to load bookings:', e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, []);

  useEffect(() => {
    fetchData(false);
  }, [activeBookings, activeSessions]);

  const allMergedRecords = [
    ...onlineBookings.map(b => ({ 
      ...b, 
      recordType: 'ONLINE', 
      displayType: '🔵 Online Web',
      
    })),
    ...walkIns.map(w => ({
      id: w.id || w.sessionId,
      customer_name: w.leaderName || w.name,
      mobile_number: w.phone,
      gaming_zone: `${w.stationId || w.device} (${w.zone || 'Walk-in'})`,
      booking_date: w.date || new Date().toLocaleDateString(),
      booking_time: w.startTime || 'Live Walk-in',
      duration: w.duration || `${w.durationMinutes || 60} mins`,
      total_amount: w.totalAmount || w.price,
      booking_status: w.sessionStatus || w.status || 'Active',
      recordType: 'WALKIN',
      displayType: '🟢 Walk-in POS'
    }))
  ];

  const handleUpdateStatus = async (id, newStatus) => {
    const updated = await bookingService.updateStatus(id, newStatus);
    setOnlineBookings(updated);
    fetchData();
  };

  const handleOpenConvertModal = (booking) => {
    if (booking.booking_status === 'Converted' || booking.booking_status === 'Running' || booking.booking_status === 'Completed') {
      alert(`Booking ${booking.id} has already been converted.`);
      return;
    }
    if (booking.booking_status !== 'Approved' && booking.booking_status !== 'Active') {
      alert(`Booking ${booking.id} must be Approved before converting to a live session.`);
      return;
    }
    setConvertModalBooking(booking);
  };

  const handleSessionStarted = async () => {
    await fetchData();
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!newRescheduleDate || !rescheduleBookingId) return;
    const updated = onlineBookings.map(b => (b.id === rescheduleBookingId) ? { ...b, booking_date: newRescheduleDate } : b);
    setOnlineBookings(updated);
    setRescheduleBookingId(null);
  };

  const filteredRecords = allMergedRecords.filter(b => {
    const name = b.customer_name || b.customerName || '';
    const phone = b.mobile_number || b.mobileNumber || '';
    const id = b.id || b.id || '';
    const zone = b.gaming_zone || b.membershipPlan || '';
    const query = searchQuery.toLowerCase();

    const matchesSearch = 
      name.toLowerCase().includes(query) ||
      phone.includes(query) ||
      id.toLowerCase().includes(query) ||
      zone.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (tabFilter === 'ALL') return true;
    if (tabFilter === 'ONLINE') return b.recordType === 'ONLINE';
    if (tabFilter === 'WALKIN') return b.recordType === 'WALKIN';
    if (tabFilter === 'PENDING') return b.booking_status === 'Pending';
    if (tabFilter === 'APPROVED') return b.booking_status === 'Approved' || b.booking_status === 'Active';
    if (tabFilter === 'CONVERTED') return b.booking_status === 'Converted' || b.booking_status === 'Running';
    if (tabFilter === 'COMPLETED') return b.booking_status === 'Completed';
    if (tabFilter === 'REJECTED') return b.booking_status === 'Rejected';
    return true;
  });

  return (
    <div className="space-y-4 text-gray-100 font-sans select-none overflow-x-hidden min-w-0">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
        <div>
          <h1 className="font-cyber text-xl sm:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-400" /> BOOKING MANAGEMENT
          </h1>
          <p className="text-xs text-gray-400 font-sans mt-0.5">
            Approve online customer bookings and convert them into live running sessions with real-time timers
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, phone, ID..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-purple-400 text-xs text-white placeholder-gray-500 outline-none transition-all"
          />
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Filter Tabs Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none bg-[#0E0B24]/90 p-2 rounded-2xl border border-white/10">
        {[
          { id: 'ALL', label: 'All Bookings' },
          { id: 'ONLINE', label: 'Online Web' },
          { id: 'WALKIN', label: 'Walk-in POS' },
          { id: 'PENDING', label: 'Pending' },
          { id: 'APPROVED', label: 'Approved' },
          { id: 'CONVERTED', label: 'Converted' },
          { id: 'COMPLETED', label: 'Completed' },
          { id: 'REJECTED', label: 'Rejected' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setTabFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl font-cyber text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              tabFilter === tab.id
                ? 'text-white bg-purple-950/80 border border-purple-500/50 shadow-[0_0_12px_rgba(147,51,234,0.4)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-[#09071B]/90">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/70 text-[10px] font-cyber text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">TYPE</th>
                <th className="py-3 px-4">BOOKING ID & NAME</th>
                <th className="py-3 px-4">PHONE</th>
                <th className="py-3 px-4">DATE & TIME</th>
                <th className="py-3 px-4">GAMING ZONE</th>
                <th className="py-3 px-4">PRICE</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs font-sans">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400 font-cyber text-xs">
                    No Bookings Found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((b, idx) => {
                  const isApproved = b.booking_status === 'Approved' || b.booking_status === 'Active';
                  const isPending = b.booking_status === 'Pending';
                  const isConverted = b.booking_status === 'Converted' || b.booking_status === 'Running';
                  const isCompleted = b.booking_status === 'Completed';
                  const isRejected = b.booking_status === 'Rejected';

                  return (
                    <tr key={b.id || idx} className="hover:bg-purple-950/20 transition-colors">
                      {/* Type Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-cyber font-bold uppercase border ${
                          b.recordType === 'ONLINE' ? 'bg-purple-950/70 border-purple-500/50 text-purple-300' : 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                        }`}>
                          {b.displayType}
                        </span>
                      </td>

                      {/* Name & ID */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-xs">{b.customer_name}</span>
                          <span className="text-[10px] font-mono text-cyan-400">{b.id}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-gray-300 text-xs">
                        {b.mobile_number || '-'}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-gray-300 text-xs">
                        <div className="flex flex-col">
                          <span>{b.booking_date}</span>
                          <span className="text-[10px] text-cyan-300 font-bold">{b.booking_time} ({b.duration || '1 hr'})</span>
                        </div>
                      </td>

                      {/* Gaming Zone */}
                      <td className="py-3 px-4 whitespace-nowrap font-cyber text-purple-300 font-bold">
                        {b.gaming_zone}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 whitespace-nowrap font-cyber font-bold text-emerald-400">
                        ₹{b.total_amount || 100}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-cyber font-bold uppercase ${
                          isApproved
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/50'
                            : isConverted
                            ? 'bg-purple-950 text-purple-300 border border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                            : isCompleted
                            ? 'bg-blue-950 text-blue-300 border border-blue-500/50'
                            : isRejected
                            ? 'bg-red-950 text-red-400 border border-red-500/50'
                            : 'bg-amber-950 text-amber-400 border border-amber-500/50 animate-pulse'
                        }`}>
                          {b.booking_status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* Approve Button (For Pending Online Bookings) */}
                          {b.recordType === 'ONLINE' && isPending && (
                            <button
                              onClick={() => handleUpdateStatus(b.id, 'Approved')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-400 text-[10px] font-cyber font-bold flex items-center gap-1 cursor-pointer transition-all"
                              title="Approve Booking"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                          )}

                          {/* Convert to Session Button */}
                          {b.recordType === 'ONLINE' && (
                            <button
                              onClick={() => handleOpenConvertModal(b)}
                              disabled={!isApproved}
                              className={`px-3 py-1 rounded-lg font-cyber text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                isApproved
                                  ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                                  : isConverted
                                  ? 'bg-purple-950/60 border border-purple-500/30 text-purple-400 opacity-60 cursor-not-allowed'
                                  : 'bg-white/5 border border-white/10 text-gray-500 opacity-50 cursor-not-allowed'
                              }`}
                              title={
                                isApproved 
                                  ? "Convert this booking into a live running session" 
                                  : isConverted 
                                  ? "Already Converted" 
                                  : "Approve booking first"
                              }
                            >
                              <Play className="w-3 h-3 fill-current" />
                              {isConverted ? 'Converted ✓' : 'Convert to Session'}
                            </button>
                          )}

                          {/* Reschedule Button */}
                          {b.recordType === 'ONLINE' && !isConverted && !isCompleted && (
                            <button
                              onClick={() => { setRescheduleBookingId(b.id); setNewRescheduleDate(b.booking_date); }}
                              className="px-2 py-1 rounded-lg bg-slate-900 border border-white/15 text-[10px] font-cyber text-cyan-300 hover:text-white cursor-pointer"
                            >
                              Reschedule
                            </button>
                          )}

                          {/* View Details */}
                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
                            title="View Booking Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Convert to Session Modal */}
      {convertModalBooking && (
        <ConvertBookingModal
          booking={convertModalBooking}
          isOpen={Boolean(convertModalBooking)}
          onClose={() => setConvertModalBooking(null)}
          onSessionStarted={handleSessionStarted}
        />
      )}

      {/* Reschedule Modal */}
      {rescheduleBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f091c] border border-purple-500/40 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-cyber text-sm font-bold text-white uppercase">Reschedule Booking {rescheduleBookingId}</h3>
            <form onSubmit={handleRescheduleSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-cyber text-gray-400 uppercase">New Booking Date</label>
                <input
                  type="date"
                  required
                  value={newRescheduleDate}
                  onChange={(e) => setNewRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white outline-none mt-1 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleBookingId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-xs font-cyber text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 text-xs font-cyber font-bold text-white uppercase"
                >
                  Save Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          request={selectedBooking}
          isOpen={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

    </div>
  );
}
