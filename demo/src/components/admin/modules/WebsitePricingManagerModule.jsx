import React, { useState, useEffect } from 'react';
import { useSiteContext } from '../../../context/SiteContext';
import { Save, Calendar, Clock, Edit3, CheckCircle2, AlertTriangle } from 'lucide-react';

const getConsoleImage = (platform, fallback) => {
  const p = String(platform || '').toUpperCase();
  if (p === 'PS2' || p.includes('PS2') || p.includes('PLAYSTATION 2')) return '/images/gaming/ps2.webp';
  if (p === 'PS4' || p.includes('PS4') || p.includes('PLAYSTATION 4')) return '/images/gaming/ps4.webp';
  if (p === 'PS5' || p.includes('PS5') || p.includes('PLAYSTATION 5')) return '/images/gaming/ps5.webp';
  if (p.includes('VR')) return '/images/gaming/psvr2.webp';
  if (p.includes('SIM') || p.includes('RACING')) return '/images/gaming/racing-simulator.webp';
  return fallback || '/images/gaming/ps5.webp';
};

export default function WebsitePricingManagerModule() {
  const { pricing, updatePricing } = useSiteContext();
  const [localPricing, setLocalPricing] = useState(pricing);
  const [saveNotice, setSaveNotice] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync if context changes externally
  useEffect(() => {
    setLocalPricing(pricing);
  }, [pricing]);

  const handlePriceChange = (tier, platformIndex, rateIndex, newPrice) => {
    const updated = { ...localPricing };
    updated[tier][platformIndex].rates[rateIndex].price = `₹${newPrice.replace(/[^0-9]/g, '')}`;
    setLocalPricing(updated);
  };

  const handleSave = async () => {
    setErrorNotice(null);
    setSaveNotice(false);

    // Validate Pricing
    for (const tier of ['weekdays', 'weekends']) {
      if (!localPricing[tier]) {
        setErrorNotice(`Missing category: ${tier}`);
        return;
      }
      for (const device of localPricing[tier]) {
        if (!device.platform || device.platform.trim() === '') {
          setErrorNotice('Platform name cannot be empty.');
          return;
        }
        for (const rate of device.rates) {
          const numValue = parseInt(rate.price.replace(/[^0-9]/g, ''), 10);
          if (isNaN(numValue) || numValue < 0) {
            setErrorNotice(`Invalid negative price for ${device.platform} (${rate.hours})`);
            return;
          }
        }
      }
    }

    try {
      setIsSaving(true);
      await updatePricing(localPricing);
      setSaveNotice(true);
      setTimeout(() => setSaveNotice(false), 3000);
    } catch (err) {
      console.error('Failed to update pricing:', err);
      setErrorNotice(err.message || 'Failed to update pricing in Supabase.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderTier = (tierName, tierKey, bannerColor) => {
    return (
      <div className="glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        <div className={`p-3 ${bannerColor} border-b border-white/10 flex items-center justify-center gap-2`}>
          <Calendar className="w-4 h-4 text-white" />
          <h3 className="font-cyber text-sm font-bold text-white tracking-widest uppercase text-center">
            {tierName}
          </h3>
        </div>

        <div className="p-4 space-y-4">
          {localPricing[tierKey].map((device, devIdx) => (
            <div key={device.platform} className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-3 w-full sm:w-1/3">
                <img src={getConsoleImage(device.platform, device.image)} alt={device.platform} className="w-12 h-10 object-contain drop-shadow-[0_0_6px_rgba(255,255,255,0.2)]" loading="lazy" decoding="async" />
                <span className="font-cyber font-bold text-white text-sm tracking-wider">{device.platform}</span>
              </div>
              
              <div className="flex-1 w-full grid grid-cols-3 gap-2">
                {device.rates.map((rate, rateIdx) => {
                  const numValue = rate.price.replace(/[^0-9]/g, '');
                  return (
                    <div key={rateIdx} className="flex flex-col items-center justify-center">
                      <div className="flex items-center text-amber-400 font-bold bg-[#070A17] border border-white/10 rounded-lg px-2 py-1 focus-within:border-amber-500/50">
                        <span className="text-sm">₹</span>
                        <input
                          type="text"
                          value={numValue}
                          onChange={(e) => handlePriceChange(tierKey, devIdx, rateIdx, e.target.value)}
                          className="w-12 bg-transparent text-amber-400 font-mono font-bold text-center outline-none text-sm"
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 font-sans mt-1 uppercase font-bold tracking-wider">{rate.hours}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 font-sans text-gray-100 min-h-0 flex-1 flex flex-col custom-scrollbar overflow-y-auto pr-1">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-1 shrink-0">
        <div>
          <h2 className="font-cyber text-lg xl:text-xl font-bold text-white tracking-wider flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-purple-400" /> Website Pricing Manager
          </h2>
          <p className="text-xs text-gray-400">Live syncs with the frontend website pricing page instantly.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-cyber font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Pricing Changes'}
        </button>
      </div>

      {saveNotice && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-cyber font-bold flex items-center gap-2 shadow-lg animate-in fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Website Pricing updated! Changes are live on the public landing page instantly.
        </div>
      )}

      {errorNotice && (
        <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-cyber font-bold flex items-center gap-2 shadow-lg animate-in fade-in duration-300">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          {errorNotice}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {renderTier('Weekday Pricing', 'weekdays', 'bg-gradient-to-r from-[#3B0764] to-[#2E1065]')}
        {renderTier('Weekend Pricing', 'weekends', 'bg-gradient-to-r from-[#831843] to-[#701A75]')}
      </div>
    </div>
  );
}
