/**
 * Single Reusable WhatsApp Utility for G-FORCE Gaming Hub
 * Official Business WhatsApp Number: +91 9344176534
 */
export const OFFICIAL_BUSINESS_WHATSAPP = '919344176534';
export const DISPLAY_WHATSAPP_NUMBER = '+91 9344176534';

/**
 * Builds a valid wa.me URL
 */
export function buildWhatsAppUrl(phoneNumber = OFFICIAL_BUSINESS_WHATSAPP, message = '') {
  const cleanPhone = (phoneNumber || OFFICIAL_BUSINESS_WHATSAPP).replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedText}`;
}

/**
 * Opens general WhatsApp chat with default inquiry message
 */
export function openGeneralBookingWhatsApp(customMessage) {
  const defaultMessage = "Hello G-FORCE Gaming Hub,\nI would like to know more about your gaming sessions and bookings.";
  const url = buildWhatsAppUrl(OFFICIAL_BUSINESS_WHATSAPP, customMessage || defaultMessage);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Opens venue WhatsApp chat upon customer membership form submission
 */
export function openVenueWhatsAppForSubmission(membership) {
  const message = `Hello G-FORCE Gaming Hub,
I would like to enquire about membership!

Membership ID: ${membership.id ? `GF-${membership.id.toString().substring(0,8).toUpperCase()}` : 'N/A'}
Customer Name: ${membership.full_name || membership.customerName || 'N/A'}
Mobile Number: ${membership.mobile_number || membership.mobileNumber || 'N/A'}
Membership Plan: ${membership.membership_plan || membership.membershipPlan || 'Monthly / 3-Month'}
Preferred Start Date: ${membership.preferred_start_date || membership.preferredStartDate || 'Today'}
Duration: ${membership.duration || 'N/A'}
Price: ₹${membership.price || 'N/A'}`;

  const url = buildWhatsAppUrl(OFFICIAL_BUSINESS_WHATSAPP, message);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Opens venue WhatsApp chat upon customer booking form submission
 */
export function openVenueWhatsAppForBooking(booking) {
  const message = `Hello G-FORCE Gaming Hub,
I would like to book a gaming session!

Customer Name: ${booking.customer_name || 'N/A'}
Mobile Number: ${booking.mobile_number || 'N/A'}
Gaming Zone: ${booking.gaming_zone || 'N/A'}
Booking Date: ${booking.booking_date || 'N/A'}
Time Slot: ${booking.booking_time || 'N/A'}
Duration: ${booking.duration || '1 Hour'}
Membership: ${booking.membership || 'None'}
Booking ID: ${booking.id || 'N/A'}
Total Price: ₹${booking.total_amount || 0}`;

  const url = buildWhatsAppUrl(OFFICIAL_BUSINESS_WHATSAPP, message);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Opens venue WhatsApp chat for Cafe Order
 */
export function openVenueWhatsAppForCafeOrder({ itemName, quantity, price, customerName }) {
  const message = `Hello G-FORCE Gaming Hub,
I would like to place a cafe order!

Item Name: ${itemName}
Quantity: ${quantity || 1}
Total Price: ${price}
Customer Name: ${customerName || 'Guest Gamer'}`;

  const url = buildWhatsAppUrl(OFFICIAL_BUSINESS_WHATSAPP, message);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Admin triggers WhatsApp chat directly to the customer for Membership or Booking
 */
export function openWhatsAppChat(req) {
  const isBooking = Boolean(req.id || req.gaming_zone || req.bookingId || req.zone);
  const mobile = req.mobile_number || req.phone || req.mobileNumber;
  const name = req.customer_name || req.name || req.customerName || 'Customer';
  const bookingId = req.id || req.bookingId;
  const zone = req.gaming_zone || req.zone;
  const date = req.booking_date || req.date;
  const time = req.booking_time || req.time;
  const status = req.booking_status || req.status;

  let message = '';

  if (isBooking) {
    if (status === 'Approved') {
      message = `Hello ${name},\n\nYour booking at G-FORCE Gaming Hub has been approved.\n\nBooking ID: ${bookingId}\nGaming Zone: ${zone}\nDate: ${date}\nTime: ${time}\n\nThank you.`;
    } else {
      message = `Hello ${name},\n\nRegarding your booking (${bookingId}) for ${zone} at G-FORCE Gaming Hub on ${date} at ${time}.\n\nStatus: ${status || 'Pending'}\n\nThank you.`;
    }
  } else {
    if (req.status === 'Approved') {
      message = `Hello ${name}! 🎉 Great news! Your membership request (${req.requestId}) for ${req.membershipPlan} at G-FORCE Gaming Hub has been APPROVED! We look forward to welcoming you to the arena.`;
    } else {
      message = `Hello ${name},\n\nRegarding your membership request (${req.requestId}) for ${req.membershipPlan} at G-FORCE Gaming Hub.\n\nStatus: ${req.status || 'Pending'}\n\nThank you.`;
    }
  }

  const url = buildWhatsAppUrl(mobile, message);
  window.open(url, '_blank', 'noopener,noreferrer');
}
