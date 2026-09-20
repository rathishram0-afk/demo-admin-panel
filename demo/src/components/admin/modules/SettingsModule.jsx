import React, { useState, useEffect } from 'react';
import { settingsService } from '../../../services/settingsService';
import { MobileCard, MobileCardList, MobileCardRow, MobileCardActions } from '../shared/MobileCard';
import { sessionService } from '../../../services/sessionService';
import { useSiteContext } from '../../../context/SiteContext';
import { Settings, Save, Shield, Key, Building, Clock, Check, Volume2, VolumeX, BellRing, Play, Palette, Sliders, HardDrive, Download, Upload, RefreshCw, Plus, Trash2, Edit2, UserPlus, FileDown, FileUp } from 'lucide-react';
import { supabase } from '../../../services/supabase';

export default function SettingsModule() {
  const { cms, updateCms } = useSiteContext();
  const [activeTab, setActiveTab] = useState('BUSINESS');
  
  // State for all settings groups
  const [businessInfo, setBusinessInfo] = useState({});
  const [businessHours, setBusinessHours] = useState({ workingDays: [], holidayList: [] });
  const [soundSettings, setSoundSettings] = useState({});
  const [branding, setBranding] = useState({});
  const [preferences, setPreferences] = useState({});
  const [security, setSecurity] = useState({});
  const [adminPrefs, setAdminPrefs] = useState({ admins: [] });

  const [passwordData, setPasswordData] = useState({ currentPass: '', newPass: '', confirmPass: '' });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    const allSettings = await settingsService.getAllSettings();
    setBusinessInfo(allSettings['business_information'] || {});
    setBusinessHours(allSettings['business_hours'] || { workingDays: [], holidayList: [] });
    setSoundSettings(allSettings['audio_alerts'] || {});
    setBranding(allSettings['branding'] || {});
    setPreferences(allSettings['preferences'] || {});
    setSecurity(allSettings['security'] || {});
    setAdminPrefs(allSettings['admin_preferences'] || { admins: [] });
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveGroup = async (key, data) => {
    try {
      await settingsService.updateSetting(key, data);
      
      if (key === 'business_information' && updateCms && cms) {
        updateCms({
          ...cms,
          contact: {
            ...cms.contact,
            email: data.email || 'gforcegaminghub@gmail.com',
            phone: data.phone || '+91 9344176534',
            whatsapp: data.whatsapp || '+91 9344176534',
            address: data.address
          }
        });
      }
      if (key === 'audio_alerts') {
        await sessionService.updateSoundSettings(data);
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      setErrorMsg('');
    } catch(err) {
      setErrorMsg('Failed to save settings: ' + err.message);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleBusinessSave = (e) => { e.preventDefault(); handleSaveGroup('business_information', businessInfo); };
  const handleHoursSave = (e) => { e.preventDefault(); handleSaveGroup('business_hours', businessHours); };
  const handleBrandingSave = (e) => { e.preventDefault(); handleSaveGroup('branding', branding); };
  const handlePreferencesSave = (e) => { e.preventDefault(); handleSaveGroup('preferences', preferences); };
  const handleSecuritySave = (e) => { e.preventDefault(); handleSaveGroup('security', security); };

  const handleSoundToggle = async (key) => {
    const updated = { ...soundSettings, [key]: !soundSettings[key] };
    setSoundSettings(updated);
    handleSaveGroup('audio_alerts', updated);
  };

  const handleVolumeChange = async (val) => {
    const updated = { ...soundSettings, volume: parseInt(val) || 0 };
    setSoundSettings(updated);
    handleSaveGroup('audio_alerts', updated);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPass !== passwordData.confirmPass) {
      setErrorMsg('New passwords do not match!');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPass
      });
      if (error) throw error;
      
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      setPasswordData({ currentPass: '', newPass: '', confirmPass: '' });
    } catch(err) {
      setErrorMsg('Failed to update password. You may need to log in again.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const exportSettings = async () => {
    const all = await settingsService.getAllSettings();
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gforce-settings-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetToDefault = async () => {
    if(window.confirm("Are you sure you want to reset all settings to defaults? This action cannot be undone.")) {
      setErrorMsg('Reset functionality requires Database admin execution.');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const navItems = [
    { key: 'BUSINESS', label: 'Business Information', icon: Building },
    { key: 'HOURS', label: 'Business Hours', icon: Clock },
    { key: 'SOUNDS', label: 'Audio & Sound Alerts', icon: Volume2 },
    { key: 'BRANDING', label: 'Branding & UI', icon: Palette },
    { key: 'PREFERENCES', label: 'Preferences', icon: Sliders },
    { key: 'PASSWORD', label: 'Change Password', icon: Key },
    { key: 'ADMINS', label: 'Admin Management', icon: Shield },
    { key: 'SECURITY', label: 'Security & Auth', icon: Shield },
    { key: 'BACKUP', label: 'Backup & Restore', icon: HardDrive }
  ];

  if (loading) return <div className="text-white p-10 font-cyber">Loading Configuration Engine...</div>;

  return (
    <div className="space-y-6 text-gray-100 font-sans pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-white/10">
        <div>
          <h2 className="font-cyber text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" /> Settings & Configuration
          </h2>
          <p className="text-xs text-gray-400">Centralized database-backed configuration for G-FORCE ERP</p>
        </div>

        {savedSuccess && (
          <span className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-cyber font-bold animate-pulse flex items-center gap-1.5">
            <Check className="w-4 h-4" /> Successfully Saved!
          </span>
        )}
        {errorMsg && (
          <span className="px-3 py-1.5 rounded-xl bg-red-950/80 border border-red-500 text-red-300 text-xs font-cyber font-bold flex items-center gap-1.5">
            {errorMsg}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sub-Nav */}
        <div className="lg:col-span-3 glass-panel p-4 rounded-2xl border border-white/10 space-y-2 h-fit sticky top-24">
          <span className="text-[10px] font-cyber text-gray-500 uppercase tracking-wider font-bold px-3">
            Configuration Nodes
          </span>
          <div className="space-y-1 pt-1">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-cyber flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                    activeTab === item.key
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black shadow-[0_0_12px_rgba(236,72,153,0.3)]'
                      : 'text-gray-400 font-bold hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-9 glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
          
          {/* BUSINESS INFO TAB */}
          {activeTab === 'BUSINESS' && (
            <form onSubmit={handleBusinessSave} className="space-y-5 animate-fade-in">
              <h3 className="font-cyber text-sm font-black text-white uppercase tracking-wider border-b border-white/10 pb-3">
                Business Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Business Name</label>
                  <input type="text" value={businessInfo.cafeName || ''} onChange={e => setBusinessInfo({...businessInfo, cafeName: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-pink-500 text-xs text-white outline-none mt-1" required />
                </div>
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Tagline</label>
                  <input type="text" value={businessInfo.tagline || ''} onChange={e => setBusinessInfo({...businessInfo, tagline: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-pink-500 text-xs text-white outline-none mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Owner Name</label>
                  <input type="text" value={businessInfo.ownerName || ''} onChange={e => setBusinessInfo({...businessInfo, ownerName: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-pink-500 text-xs text-white outline-none mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">GST Number (Optional)</label>
                  <input type="text" value={businessInfo.gstNumber || ''} onChange={e => setBusinessInfo({...businessInfo, gstNumber: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-pink-500 text-xs text-white outline-none mt-1 font-mono" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Full Address</label>
                <input type="text" value={businessInfo.address || ''} onChange={e => setBusinessInfo({...businessInfo, address: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-pink-500 text-xs text-white outline-none mt-1" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Google Maps URL</label>
                  <input type="url" value={businessInfo.googleMapsLink || ''} onChange={e => setBusinessInfo({...businessInfo, googleMapsLink: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-pink-500 text-xs text-white outline-none mt-1 text-cyan-400" />
                </div>
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Website URL</label>
                  <input type="url" value={businessInfo.websiteUrl || ''} onChange={e => setBusinessInfo({...businessInfo, websiteUrl: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-pink-500 text-xs text-white outline-none mt-1 text-cyan-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Mobile Number</label>
                  <input type="text" value={businessInfo.phone || ''} onChange={e => setBusinessInfo({...businessInfo, phone: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-pink-500 text-xs text-white outline-none mt-1 font-mono" />
                </div>
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">WhatsApp Number</label>
                  <input type="text" value={businessInfo.whatsapp || ''} onChange={e => setBusinessInfo({...businessInfo, whatsapp: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-pink-500 text-xs text-white outline-none mt-1 font-mono" />
                </div>
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Business Email</label>
                  <input type="email" value={businessInfo.email || ''} onChange={e => setBusinessInfo({...businessInfo, email: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-pink-500 text-xs text-white outline-none mt-1 font-mono" />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-xs font-cyber font-bold text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] flex items-center gap-2 cursor-pointer transition-all">
                  <Save className="w-4 h-4" /> Save Business Info
                </button>
              </div>
            </form>
          )}

          {/* BUSINESS HOURS TAB */}
          {activeTab === 'HOURS' && (
            <form onSubmit={handleHoursSave} className="space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <h3 className="font-cyber text-sm font-black text-white uppercase tracking-wider">
                  Operating Hours & Schedules
                </h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={businessHours.isClosedToday || false} onChange={e => setBusinessHours({...businessHours, isClosedToday: e.target.checked})} className="accent-red-500 w-4 h-4" />
                  <span className="text-xs font-cyber font-bold text-red-400">Emergency Close (Overrides Website)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/50 border border-white/10">
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase mb-2 block">Opening Time</label>
                  <input type="time" value={businessHours.openingTime || ''} onChange={e => setBusinessHours({...businessHours, openingTime: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 focus:border-pink-500 text-sm text-white font-mono outline-none" required />
                </div>
                <div className="p-4 rounded-xl bg-slate-950/50 border border-white/10">
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase mb-2 block">Closing Time</label>
                  <input type="time" value={businessHours.closingTime || ''} onChange={e => setBusinessHours({...businessHours, closingTime: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 focus:border-pink-500 text-sm text-white font-mono outline-none" required />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase mb-2 block">Working Days</label>
                <div className="flex flex-wrap gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                    const isSelected = businessHours.workingDays?.includes(day);
                    return (
                      <button 
                        key={day} 
                        type="button"
                        onClick={() => {
                          const newDays = isSelected 
                            ? businessHours.workingDays.filter(d => d !== day) 
                            : [...(businessHours.workingDays || []), day];
                          setBusinessHours({...businessHours, workingDays: newDays});
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-cyber font-bold transition-colors cursor-pointer ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-800 text-gray-400 border border-white/10 hover:bg-slate-700'}`}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase mb-2 block">Special Holiday Notes (Displayed on Website)</label>
                <textarea rows="3" value={businessHours.specialHolidayNotes || ''} onChange={e => setBusinessHours({...businessHours, specialHolidayNotes: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-pink-500 text-xs text-white outline-none mt-1" placeholder="e.g., Closed on Diwali, or altered hours for New Year..."></textarea>
              </div>

              <div className="pt-2 flex justify-end">
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 text-xs font-cyber font-bold text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] flex items-center gap-2 cursor-pointer">
                  <Save className="w-4 h-4" /> Save Schedule
                </button>
              </div>
            </form>
          )}

          {/* SOUNDS TAB */}
          {activeTab === 'SOUNDS' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <h3 className="font-cyber text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-purple-400" /> Audio Engine Configuration
                </h3>
                <button onClick={() => handleSoundToggle('quietMode')} className={`px-3 py-1.5 rounded-xl border text-xs font-cyber font-bold flex items-center gap-1.5 transition-all cursor-pointer ${soundSettings.quietMode ? 'bg-amber-950/80 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
                  {soundSettings.quietMode ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  {soundSettings.quietMode ? 'Quiet Mode ON' : 'Quiet Mode OFF'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-between">
                  <div><span className="font-cyber text-xs font-bold text-white block">Master Web Audio</span><span className="text-[10px] text-gray-400">Enable POS sounds</span></div>
                  <button type="button" onClick={() => handleSoundToggle('enableSound')} className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${soundSettings.enableSound ? 'bg-purple-600' : 'bg-gray-800'}`}>
                    <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${soundSettings.enableSound ? 'left-5.5' : 'left-1'}`} />
                  </button>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-white/10 space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-cyber font-bold text-white"><span>Master Volume</span><span className="font-mono text-purple-400">{soundSettings.volume || 70}%</span></div>
                  <input type="range" min="0" max="100" value={soundSettings.volume || 70} onChange={e => handleVolumeChange(e.target.value)} disabled={!soundSettings.enableSound || soundSettings.quietMode} className="w-full accent-purple-500 cursor-pointer disabled:opacity-30" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { key: 'enable5MinAlert', label: '5-Min Warning', color: 'amber' },
                  { key: 'enable2MinAlert', label: '2-Min Urgent', color: 'red' },
                  { key: 'enableCompleteAlert', label: 'Session Complete', color: 'emerald' },
                  { key: 'newBookingSound', label: 'New Online Booking', color: 'blue' },
                  { key: 'cafeOrderReceived', label: 'Cafe Order Received', color: 'orange' },
                  { key: 'paymentSuccess', label: 'Payment Success', color: 'green' }
                ].map(alert => (
                  <div key={alert.key} className="p-3 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between">
                    <span className={`font-cyber text-xs font-bold text-${alert.color}-400`}>{alert.label}</span>
                    <button type="button" onClick={() => handleSoundToggle(alert.key)} className={`w-10 h-5 rounded-full relative cursor-pointer ${soundSettings[alert.key] ? `bg-${alert.color}-600` : 'bg-gray-800'}`}>
                      <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${soundSettings[alert.key] ? 'left-5.5' : 'left-1'}`} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30">
                <h4 className="font-cyber text-xs font-bold text-white uppercase mb-3 flex items-center gap-1.5"><Play className="w-3.5 h-3.5 text-purple-400"/> Chime Tester</h4>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => sessionService.testSoundChime('5min')} className="px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/50 text-amber-300 text-xs font-cyber font-bold cursor-pointer">Test 5-Min</button>
                  <button type="button" onClick={() => sessionService.testSoundChime('2min')} className="px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-cyber font-bold cursor-pointer">Test 2-Min</button>
                  <button type="button" onClick={() => sessionService.testSoundChime('complete')} className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-cyber font-bold cursor-pointer">Test Complete</button>
                </div>
              </div>
            </div>
          )}

          {/* BRANDING TAB */}
          {activeTab === 'BRANDING' && (
            <form onSubmit={handleBrandingSave} className="space-y-5 animate-fade-in">
              <h3 className="font-cyber text-sm font-black text-white uppercase tracking-wider border-b border-white/10 pb-3">Branding & Assets</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">ERP Title</label>
                  <input type="text" value={branding.erpTitle || ''} onChange={e => setBranding({...branding, erpTitle: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-pink-500 text-xs text-white outline-none mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Footer Text</label>
                  <input type="text" value={branding.footerText || ''} onChange={e => setBranding({...branding, footerText: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-pink-500 text-xs text-white outline-none mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Primary Accent Color</label>
                  <div className="flex gap-2 mt-1">
                    <input type="color" value={branding.primaryAccent || '#ec4899'} onChange={e => setBranding({...branding, primaryAccent: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                    <input type="text" value={branding.primaryAccent || '#ec4899'} onChange={e => setBranding({...branding, primaryAccent: e.target.value})} className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/15 text-xs text-white font-mono" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Secondary Accent</label>
                  <div className="flex gap-2 mt-1">
                    <input type="color" value={branding.secondaryAccent || '#9333ea'} onChange={e => setBranding({...branding, secondaryAccent: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                    <input type="text" value={branding.secondaryAccent || '#9333ea'} onChange={e => setBranding({...branding, secondaryAccent: e.target.value})} className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/15 text-xs text-white font-mono" />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-xs font-cyber font-bold text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] flex items-center gap-2">
                  <Save className="w-4 h-4" /> Apply Branding
                </button>
              </div>
            </form>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === 'PREFERENCES' && (
            <form onSubmit={handlePreferencesSave} className="space-y-5 animate-fade-in">
              <h3 className="font-cyber text-sm font-black text-white uppercase tracking-wider border-b border-white/10 pb-3">System Preferences</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Theme</label>
                  <select value={preferences.theme || 'Dark Mode'} onChange={e => setPreferences({...preferences, theme: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white outline-none mt-1">
                    <option>Dark Mode</option>
                    <option>Light Mode</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Currency</label>
                  <select value={preferences.currency || 'INR'} onChange={e => setPreferences({...preferences, currency: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white outline-none mt-1">
                    <option value="INR">₹ INR</option>
                    <option value="USD">$ USD</option>
                    <option value="EUR">€ EUR</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Time Zone</label>
                  <select value={preferences.timeZone || 'Asia/Kolkata'} onChange={e => setPreferences({...preferences, timeZone: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white outline-none mt-1">
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Auto Refresh Interval</label>
                  <select value={preferences.autoRefreshInterval || '30'} onChange={e => setPreferences({...preferences, autoRefreshInterval: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white outline-none mt-1">
                    <option value="15">15 Seconds</option>
                    <option value="30">30 Seconds</option>
                    <option value="60">60 Seconds</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Language</label>
                  <select value={preferences.language || 'English'} onChange={e => setPreferences({...preferences, language: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white outline-none mt-1">
                    <option value="English">English</option>
                    <option value="Tamil">Tamil</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-xs font-cyber font-bold text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Preferences
                </button>
              </div>
            </form>
          )}

          {/* ADMIN MANAGEMENT TAB */}
          {activeTab === 'ADMINS' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <h3 className="font-cyber text-sm font-black text-white uppercase tracking-wider">Admin Management</h3>
                <button className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 text-xs font-cyber font-bold flex items-center gap-2 hover:bg-cyan-500/30 transition-all">
                  <UserPlus className="w-4 h-4" /> Add Admin
                </button>
              </div>
              {/* Mobile card list — the sub-md stand-in for the admin table */}
              <MobileCardList>
                {(adminPrefs.admins || []).map((admin, i) => (
                  <MobileCard
                    key={i}
                    title={admin.name}
                    subtitle={admin.email}
                    accent={admin.role === 'Super Admin' ? 'purple' : 'cyan'}
                    badge={
                      <span className={`px-2 py-1 rounded-md text-[10px] font-cyber font-bold ${admin.role === 'Super Admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {admin.role}
                      </span>
                    }
                    footer={
                      <MobileCardActions>
                        <button className="p-2 rounded-lg bg-slate-800 text-gray-400 hover:text-white transition-colors flex items-center justify-center">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-2 rounded-lg bg-red-950/50 text-red-400 hover:bg-red-900/80 transition-colors flex items-center justify-center">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </MobileCardActions>
                    }
                  >
                    <MobileCardRow label="Status" value={admin.status} className="text-emerald-400 font-bold" />
                  </MobileCard>
                ))}
              </MobileCardList>

              <div className="hidden md:block overflow-x-auto rounded-xl border border-white/10 bg-slate-900/50">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-950/50 text-[10px] font-cyber text-gray-400 uppercase">
                      <th className="p-3 font-bold">Name</th>
                      <th className="p-3 font-bold">Email</th>
                      <th className="p-3 font-bold">Role</th>
                      <th className="p-3 font-bold">Status</th>
                      <th className="p-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {(adminPrefs.admins || []).map((admin, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-3 text-white font-bold">{admin.name}</td>
                        <td className="p-3 text-gray-400 font-mono">{admin.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-cyber font-bold ${admin.role === 'Super Admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {admin.role}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-emerald-400 font-bold">{admin.status}</span>
                        </td>
                        <td className="p-3 flex justify-end gap-2">
                          <button className="p-1.5 rounded-lg bg-slate-800 text-gray-400 hover:text-white transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button className="p-1.5 rounded-lg bg-red-950/50 text-red-400 hover:bg-red-900/80 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-gray-500 text-center font-mono">* Proper User Auth implementation via Supabase Auth is required to fully enforce these roles via RLS.</p>
            </div>
          )}

          {/* PASSWORD TAB */}
          {activeTab === 'PASSWORD' && (
            <form onSubmit={handleChangePassword} className="space-y-5 animate-fade-in">
              <h3 className="font-cyber text-sm font-black text-white uppercase tracking-wider border-b border-white/10 pb-3 flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" /> Change Active Admin Password
              </h3>
              <p className="text-xs text-gray-400">Updates the Supabase Auth password for the currently logged-in user.</p>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">New Password</label>
                  <input type="password" value={passwordData.newPass} onChange={e => setPasswordData({...passwordData, newPass: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-pink-500 text-xs text-white outline-none mt-1" required />
                </div>
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Confirm New Password</label>
                  <input type="password" value={passwordData.confirmPass} onChange={e => setPasswordData({...passwordData, confirmPass: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-pink-500 text-xs text-white outline-none mt-1" required />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-xs font-cyber font-bold text-white uppercase shadow-[0_0_15px_rgba(225,29,72,0.4)] cursor-pointer hover:scale-105 transition-transform">
                  Update Password Securely
                </button>
              </div>
            </form>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'SECURITY' && (
            <form onSubmit={handleSecuritySave} className="space-y-5 animate-fade-in">
              <h3 className="font-cyber text-sm font-black text-white uppercase tracking-wider border-b border-white/10 pb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" /> Global Security Policies
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Session Timeout (Minutes)</label>
                  <input type="number" value={security.sessionTimeout || 60} onChange={e => setSecurity({...security, sessionTimeout: Number(e.target.value)})} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-pink-500 text-xs text-white outline-none mt-1 font-mono" />
                </div>
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Failed Login Limit</label>
                  <input type="number" value={security.failedLoginLimit || 5} onChange={e => setSecurity({...security, failedLoginLimit: Number(e.target.value)})} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-pink-500 text-xs text-white outline-none mt-1 font-mono" />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={security.autoLogout ?? true} onChange={e => setSecurity({...security, autoLogout: e.target.checked})} className="accent-pink-500 w-4 h-4" />
                  <span className="text-xs font-cyber font-bold text-gray-300">Enable Auto Logout on Inactivity</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={security.twoFactorAuth ?? false} onChange={e => setSecurity({...security, twoFactorAuth: e.target.checked})} className="accent-pink-500 w-4 h-4" />
                  <span className="text-xs font-cyber font-bold text-gray-300">Require 2FA for Admins (Future)</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end">
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-xs font-cyber font-bold text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Security Policies
                </button>
              </div>
            </form>
          )}

          {/* BACKUP & RESTORE TAB */}
          {activeTab === 'BACKUP' && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="font-cyber text-sm font-black text-white uppercase tracking-wider border-b border-white/10 pb-3 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-orange-400" /> Backup & Restore
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900/50 border border-white/10 flex flex-col gap-3">
                  <div>
                    <h4 className="font-cyber text-xs font-bold text-white">Export Configuration</h4>
                    <p className="text-[10px] text-gray-400">Download a JSON backup of all ERP settings.</p>
                  </div>
                  <button onClick={exportSettings} className="mt-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-cyber font-bold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer">
                    <FileDown className="w-4 h-4" /> Export JSON
                  </button>
                </div>
                
                <div className="p-5 rounded-2xl bg-slate-900/50 border border-white/10 flex flex-col gap-3">
                  <div>
                    <h4 className="font-cyber text-xs font-bold text-white">Import Configuration</h4>
                    <p className="text-[10px] text-gray-400">Restore ERP settings from a JSON backup file.</p>
                  </div>
                  <button className="mt-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-cyber font-bold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer opacity-50">
                    <FileUp className="w-4 h-4" /> Import (WIP)
                  </button>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl border border-red-500/30 bg-red-950/20">
                <h4 className="font-cyber text-xs font-bold text-red-400 mb-1">Danger Zone</h4>
                <p className="text-[10px] text-gray-400 mb-3">Reset all configurations to system defaults.</p>
                <button onClick={resetToDefault} className="px-4 py-2 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600/40 border border-red-500/50 text-xs font-cyber font-bold transition-colors cursor-pointer">
                  Factory Reset Settings
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
