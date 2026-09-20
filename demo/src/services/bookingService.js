import { supabase } from './supabase.js';

export const bookingService = {
  // Fetch all bookings
  async getBookings() {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase getBookings Error:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Error fetching bookings:', err);
      return [];
    }
  },

  // Submit a new booking request
  async createBooking(bookingData) {
    try {
      const numP = Number(bookingData.players || 1);
      const zoneFormatted = `${bookingData.zone} (${numP} ${numP === 1 ? 'Player' : 'Players'})`;

      const newBooking = {
        customer_name: bookingData.name.trim(),
        mobile_number: bookingData.phone.trim(),
        gaming_zone: zoneFormatted,
        booking_date: bookingData.date,
        booking_time: bookingData.time,
        duration: bookingData.hours,
        total_amount: bookingData.price || 100,
        payment_method: null,
        payment_status: 'Unpaid',
        booking_status: 'Pending'
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert([newBooking])
        .select();

      if (error) {
        console.error('Supabase createBooking Error:', error);
        throw error;
      }

      const created = {
        ...(data?.[0] || newBooking),
        player_count: numP,
        players: numP,
        booking_type: bookingData.bookingType || 'Weekday Booking'
      };

      try {
        const { sessionService } = await import('./sessionService');
        await sessionService.addNotification('Booking Created', `New booking created for ${created.customer_name} (${numP} ${numP === 1 ? 'Player' : 'Players'}) on ${created.booking_date} at ${created.booking_time}.`, 'SUCCESS');
      } catch (notifErr) {
        console.error('Failed to trigger notification for booking creation:', notifErr);
      }

      return created;
    } catch (err) {
      console.error('Failed to create booking in Supabase:', err);
      throw err;
    }
  },

  // Update status (Pending, Approved, Rejected, Completed)
  async updateStatus(bookingId, newStatus) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ booking_status: newStatus })
        .eq('id', bookingId)
        .select();

      if (error) {
        console.error('Supabase updateStatus Error:', error);
        throw error;
      }
      
      if (newStatus === 'Cancelled' || newStatus === 'Rejected') {
        try {
          const { sessionService } = await import('./sessionService');
          await sessionService.addNotification('Booking Cancelled', `Booking for slot ${bookingId} was status updated to ${newStatus}.`, 'ALERT');
        } catch (notifErr) {
          console.error('Failed to trigger notification for booking cancellation:', notifErr);
        }
      }

      // Return fresh list for UI update
      return this.getBookings();
    } catch (err) {
      console.error('Failed to update booking status:', err);
      return this.getBookings();
    }
  },

  // Delete a booking record
  async deleteBooking(bookingId) {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) {
        console.error('Supabase deleteBooking Error:', error);
        throw error;
      }
      
      return this.getBookings();
    } catch (err) {
      console.error('Failed to delete booking:', err);
      return this.getBookings();
    }
  },

  // Check live availability for a specific zone and date
  async getSlotAvailability(zone, date, timeSlots) {
    try {
      const { data: activeBookings, error } = await supabase
        .from('bookings')
        .select('booking_time')
        .eq('booking_date', date)
        .eq('gaming_zone', zone)
        .not('booking_status', 'in', '("Rejected","Cancelled")');

      if (error) {
        console.error('Supabase getSlotAvailability Error:', error);
        // Fallback: assume all available if error
        const availability = {};
        timeSlots.forEach(slot => { availability[slot] = 'Available'; });
        return availability;
      }

      const MAX_CAPACITY = 2; // Assuming 2 units per zone
      const availability = {};

      timeSlots.forEach(slot => {
        const overlappingBookings = activeBookings.filter(b => b.booking_time === slot);
        const bookedCount = overlappingBookings.length;

        if (bookedCount === 0) {
          availability[slot] = 'Available';
        } else if (bookedCount < MAX_CAPACITY) {
          availability[slot] = 'Limited';
        } else {
          availability[slot] = 'Fully Booked';
        }
      });

      return availability;
    } catch (err) {
      console.error('Failed to get slot availability:', err);
      const availability = {};
      timeSlots.forEach(slot => { availability[slot] = 'Available'; });
      return availability;
    }
  },

  // Check if a specific new booking conflicts before submit
  async checkConflict(zone, date, time) {
    const availability = await this.getSlotAvailability(zone, date, [time]);
    return availability[time] === 'Fully Booked';
  }
};
