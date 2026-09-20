import React from 'react';
import { openGeneralBookingWhatsApp } from '../utils/whatsapp';

export default function WhatsAppButton() {
  const handleClick = (e) => {
    e.preventDefault();
    openGeneralBookingWhatsApp("Hello G-FORCE Gaming Hub,\nI would like to know more about your gaming sessions and bookings.");
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Chat on WhatsApp"
      style={{
        bottom: 'calc(95px + env(safe-area-inset-bottom, 0px))',
      }}
      className="fixed right-[20px] z-50 w-[56px] h-[56px] rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(37,211,102,0.30)] hover:scale-[1.06] active:scale-[1.06] hover:shadow-[0_8px_30px_rgba(37,211,102,0.50)] transition-all duration-250 ease-out group cursor-pointer"
    >
      {/* Low-intensity breathing glow animation every 3 seconds */}
      <div className="absolute inset-0 rounded-full bg-[#25D366] animate-[pulse_3s_infinite] opacity-30 pointer-events-none" />

      {/* Official Meta WhatsApp Logo SVG (26px x 26px, centered) */}
      <svg
        viewBox="0 0 24 24"
        className="w-[26px] h-[26px] fill-white relative z-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M19.05 4.91A9.816 9.816 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01zm-7.01 15.24c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.32A8.191 8.191 0 0 1 3.86 11.9c0-4.51 3.67-8.18 8.18-8.18 2.18 0 4.24.85 5.78 2.39 1.54 1.54 2.39 3.6 2.39 5.78 0 4.52-3.67 8.19-8.17 8.19zm4.49-6.14c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.98-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2.01-1.24-.74-.66-1.24-1.47-1.39-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.75.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.17-.48-.3z" />
      </svg>
    </button>
  );
}
