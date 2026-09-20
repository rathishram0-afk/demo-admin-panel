import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@gforcehub.com');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await login(email || 'admin@gforcehub.com', password || 'demo123');
      if (res.success) {
        const origin = location.state?.from?.pathname || '/admin/dashboard';
        navigate(origin, { replace: true });
      } else {
        setErrorMsg(res.message || 'Invalid login credentials.');
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-4 py-8 relative overflow-x-hidden overflow-y-auto">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md bg-[#070b14]/95 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(0,240,255,0.25)] z-10 overflow-hidden"
      >
        {/* Neon Top Bar */}
        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 absolute top-0 left-0" />

        {/* Header */}
        <div className="text-center space-y-2 mb-6 pt-2 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] mb-2">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="font-cyber text-2xl font-black text-white uppercase tracking-wider">
            ADMIN LOGIN
          </h2>
          <p className="text-xs text-gray-400 font-sans">
            Enter secure credentials to access control panel
          </p>
        </div>

        {/* Error Message Alert */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-sans flex items-center gap-2 overflow-hidden"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-cyber font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-cyan-400" /> EMAIL
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Admin Email"
                className="w-full px-3.5 py-3 rounded-xl bg-[#060812] border border-white/15 focus:border-cyan-400 text-xs text-white placeholder-gray-600 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-cyber font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-pink-400" /> PASSWORD
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
                className="w-full pl-3.5 pr-10 py-3 rounded-xl bg-[#060812] border border-white/15 focus:border-pink-500 text-xs text-white placeholder-gray-600 outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit & Back Action Buttons */}
          <div className="pt-3 space-y-2.5">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 hover:from-cyan-400 hover:via-purple-500 hover:to-pink-400 text-xs font-cyber font-black tracking-widest text-white uppercase shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <span>LOGGING IN...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> LOGIN TO DASHBOARD
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-3 rounded-xl bg-slate-900 border border-white/10 hover:border-white/30 text-xs font-cyber font-bold text-gray-400 hover:text-white transition-all flex items-center justify-center gap-2 uppercase cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> BACK TO WEBSITE
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
