import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Lenis from '@studio-freight/lenis';
import Preloader from './components/Preloader';
import MouseGlow from './components/MouseGlow';
import ParticleBackground from './components/ParticleBackground';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import WhyChooseUs from './components/WhyChooseUs';
import Pricing from './components/Pricing';
import Membership from './components/Membership';
import FeaturedGames from './components/FeaturedGames';
import GamingCafeMenu from './components/GamingCafeMenu';
import Gallery from './components/Gallery';
import Reviews from './components/Reviews';
import Contact from './components/Contact';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import MobileBottomNav from './components/MobileBottomNav';
import ProtectedRoute from './components/admin/ProtectedRoute';
import ErrorBoundary from './components/admin/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { lazyWithRetry } from './utils/lazyWithRetry';

// Lazy load modules that are heavy or only accessed when modal/admin triggers
const BookingModal = lazyWithRetry(() => import('./components/BookingModal'));
const AdminLogin = lazyWithRetry(() => import('./components/admin/AdminLogin'));
const AdminDashboard = lazyWithRetry(() => import('./components/admin/AdminDashboard'));

function MainWebsite({ initialBookingOpen = false }) {
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(initialBookingOpen);

  useEffect(() => {
    let lenis;
    let animationFrameId;

    try {
      // Safe Initialize Lenis Inertial Smooth Scrolling
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        smoothTouch: false,
      });

      function raf(time) {
        if (lenis) {
          lenis.raf(time);
          animationFrameId = requestAnimationFrame(raf);
        }
      }

      animationFrameId = requestAnimationFrame(raf);
    } catch (e) {
      console.warn('Lenis smooth scrolling initialization warning:', e);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (lenis) {
        try {
          lenis.destroy();
        } catch (e) {
          // ignore cleanup warning
        }
      }
    };
  }, []);

  return (
    <ErrorBoundary moduleName="Public Main Website Shell">
      <Preloader onComplete={() => setLoading(false)} />

      {/* Website Shell renders cleanly underneath the preloader overlay, avoiding any black-screen delays */}
      <div className="min-h-screen bg-[#07070b] text-gray-100 selection:bg-pink-500 selection:text-white relative font-sans opacity-100">
        <MouseGlow />
        <ParticleBackground />

        <Navbar onOpenBooking={() => setBookingOpen(true)} />

        <main className="relative z-10">
          <Hero onOpenBooking={() => setBookingOpen(true)} />
          <WhyChooseUs />
          <Pricing onOpenBooking={() => setBookingOpen(true)} />
          <Membership />
          <FeaturedGames onOpenBooking={() => setBookingOpen(true)} />
          <GamingCafeMenu />
          <Gallery />
          <Reviews />
          <Contact />
          <FAQ />
        </main>

        <Footer />
        <WhatsAppButton />
        <MobileBottomNav />

        {bookingOpen && (
          <Suspense fallback={null}>
            <BookingModal 
              isOpen={bookingOpen}
              onClose={() => setBookingOpen(false)}
            />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ErrorBoundary moduleName="G-FORCE Application Root">
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={
            <div className="min-h-screen bg-[#07070b] flex flex-col items-center justify-center gap-2">
              <div className="w-16 h-1 bg-gradient-to-r from-pink-500 to-cyan-400 rounded-full animate-pulse shadow-[0_0_12px_rgba(236,72,153,0.5)]" />
              <span className="text-[10px] font-cyber tracking-widest text-purple-300 font-bold uppercase">LOADING MODULE</span>
            </div>
          }>
            <Routes>
              {/* Main Entry & Admin Routes — Opens Directly Into Admin Panel */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <ErrorBoundary moduleName="Admin Dashboard Core">
                      <AdminDashboard />
                    </ErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <ErrorBoundary moduleName="Admin Dashboard Core">
                      <AdminDashboard />
                    </ErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute>
                    <ErrorBoundary moduleName="Admin Dashboard Core">
                      <AdminDashboard />
                    </ErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin Login Route for Demo Demonstration */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Public Website Preview Routes */}
              <Route path="/website" element={<MainWebsite />} />
              <Route path="/website/about" element={<MainWebsite />} />
              <Route path="/website/games" element={<MainWebsite />} />
              <Route path="/website/pricing" element={<MainWebsite />} />
              <Route path="/website/membership" element={<MainWebsite />} />
              <Route path="/website/gallery" element={<MainWebsite />} />
              <Route path="/website/contact" element={<MainWebsite />} />
              <Route path="/website/booking" element={<MainWebsite initialBookingOpen={true} />} />
              
              {/* Fallback Catch-all Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
