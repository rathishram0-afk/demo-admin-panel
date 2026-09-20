import React, { useEffect, useRef } from 'react';

export default function MouseGlow() {
  const glowRef = useRef(null);

  useEffect(() => {
    const glowEl = glowRef.current;
    if (!glowEl) return;

    const handleMouseMove = (e) => {
      glowEl.style.setProperty('--mouse-x', `${e.clientX}px`);
      glowEl.style.setProperty('--mouse-y', `${e.clientY}px`);
      glowEl.style.opacity = '0.6';
    };

    const handleMouseLeave = () => {
      glowEl.style.opacity = '0';
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.body.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed inset-0 z-30 opacity-0 transition-opacity duration-300 hidden lg:block"
      style={{
        background: `radial-gradient(400px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(255, 0, 127, 0.08), rgba(0, 240, 255, 0.05), transparent 80%)`,
      }}
    />
  );
}
