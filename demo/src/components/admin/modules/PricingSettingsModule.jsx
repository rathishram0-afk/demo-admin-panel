import React, { useState, useEffect } from 'react';
import { sessionService } from '../../../services/sessionService';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  Save, 
  Gamepad2, 
  Tv, 
  Sparkles,
  Info,
  History,
  Check,
  Edit3,
  AlertCircle
} from 'lucide-react';

const deviceImages = {
  ps5: "/images/gaming/ps5.webp",
  ps4: "/images/gaming/ps4.webp",
  ps2: "/images/gaming/ps2.webp",
  sim: "/images/gaming/racing-simulator.webp",
  vr: "/images/gaming/psvr2.webp"
};

export default function PricingSettingsModule() {
  const [pricingSettings, setPricingSettings] = useState(null);
  const [pricingMode, setPricingMode] = useState('AUTO');
  const [saveNotice, setSaveNotice] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [historyList, setHistoryList] = useState([
    { id: '#103', updatedBy: 'Admin', type: 'Weekend Pricing', date: 'May 23, 2025 10:30 PM', status: 'Active' },
    { id: '#102', updatedBy: 'Admin', type: 'Weekday Pricing', date: 'May 23, 2025 10:28 PM', status: 'Active' },
    { id: '#101', updatedBy: 'Admin', type: 'Weekend Pricing', date: 'May 20, 2025 04:15 PM', status: 'Active' }
  ]);

  const loadSettings = async () => {
    const data = await sessionService.getPricingSettings();
    setPricingSettings(data);
    setPricingMode(data.pricingMode || 'AUTO');
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (!pricingSettings) {
    return <div className="p-8 text-center text-gray-400 font-cyber">Loading Centralized Pricing Engine...</div>;
  }

  const isWeekendToday = new Date().getDay() === 0 || new Date().getDay() === 6;

  const handlePriceChange = (tier, deviceType, minutes, newPrice) => {
    const cleanStr = newPrice === '' ? '' : newPrice.replace(/[^0-9]/g, '');
    const val = cleanStr === '' ? '' : parseInt(cleanStr, 10);

    setValidationError('');

    setPricingSettings(prev => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        [deviceType]: {
          ...(prev[tier]?.[deviceType] || {}),
          [minutes]: val
        }
      }
    }));
  };

  const handleSave = async () => {
    let isValid = true;
    ['weekday', 'weekend'].forEach(tier => {
      Object.values(pricingSettings[tier] || {}).forEach(deviceRates => {
        Object.values(deviceRates || {}).forEach(priceVal => {
          if (priceVal === '' || priceVal === null || priceVal === undefined || isNaN(Number(priceVal)) || Number(priceVal) <= 0) {
            isValid = false;
          }
        });
      });
    });

    if (!isValid) {
      setValidationError('Please enter a valid price.');
      return;
    }

    setValidationError('');

    const updated = await sessionService.updatePricingSettings({
      ...pricingSettings,
      pricingMode
    });
    setPricingSettings(updated);

    const newEntry = {
      id: `#${Math.floor(104 + Math.random() * 10)}`,
      updatedBy: 'Admin',
      type: pricingMode === 'AUTO' ? (isWeekendToday ? 'Weekend Pricing' : 'Weekday Pricing') : 'Manual Override',
      date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'Active'
    };
    setHistoryList([newEntry, ...historyList.slice(0, 4)]);

    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 3500);
  };

  const handleResetDefaults = async () => {
    if (window.confirm('Restore system default pricing matrix for all devices?')) {
      const def = await sessionService.resetPricingSettings();
      setPricingSettings(def);
      setPricingMode(def.pricingMode);
      setValidationError('');
      setSaveNotice(true);
      setTimeout(() => setSaveNotice(false), 3500);
    }
  };

  const renderPricingTable = (tierKey, title, bannerColor, isWeekday) => {
    const tierData = pricingSettings[tierKey] || {};

    const devices = [
      { key: 'PlayStation 2', label: 'PS2', img: deviceImages.ps2 },
      { key: 'PlayStation 4', label: 'PS4', img: deviceImages.ps4 },
      { key: 'PlayStation 5', label: 'PS5', img: deviceImages.ps5 },
      { key: 'Racing Simulator', label: 'RACING SIMULATOR', img: deviceImages.sim },
      { key: 'PS VR2', label: 'VR2', img: deviceImages.vr }
    ];

    return (
      <div className="glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col justify-between">
        <div className={`p-3 xl:p-3.5 ${bannerColor} border-b border-white/10 flex items-center justify-center gap-2`}>
          <Calendar className="w-4 h-4 text-white" />
          <h3 className="font-cyber text-xs xl:text-sm font-bold text-white tracking-widest uppercase text-center">
            {title}
          </h3>
        </div>

        <div className="p-3 xl:p-4 overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans">
            <thead>
              <tr className="text-[10px] xl:text-[11px] font-cyber text-gray-400 border-b border-white/10 tracking-wider">
                <th className="pb-2.5 px-2">DEVICE / DURATION</th>
                <th className="pb-2.5 px-1.5 text-center">30 MIN</th>
                <th className="pb-2.5 px-1.5 text-center">20 MIN</th>
                <th className="pb-2.5 px-1.5 text-center">40 MIN</th>
                <th className="pb-2.5 px-1.5 text-center">1 HOUR</th>
                <th className="pb-2.5 px-1.5 text-center">1.5 HOURS</th>
                <th className="pb-2.5 px-1.5 text-center">2 HOURS</th>
                <th className="pb-2.5 px-1.5 text-center">3 HOURS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {devices.map((dev) => {
                const rates = tierData[dev.key] || {};

                return (
                  <tr key={dev.key} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-2 font-cyber font-bold text-white flex items-center gap-2.5 min-w-[140px]">
                      <div className="w-9 h-7 bg-black/40 rounded-lg p-0.5 border border-white/10 flex items-center justify-center shrink-0">
                        <img 
                          src={dev.img} 
                          alt={dev.label}
                          onError={(e) => { e.target.onerror = null; e.target.src = deviceImages.ps5; }}
                          className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_6px_rgba(255,255,255,0.2)]" 
                        />
                      </div>
                      <span className="text-xs tracking-wider">{dev.label}</span>
                    </td>

                    <td className="py-3 px-1 text-center font-mono">
                      {dev.key === 'Racing Simulator' || dev.key === 'PlayStation 5' ? (
                        <div className="flex flex-col items-center">
                          <div className="flex items-center text-amber-400 font-bold">
                            <span>₹</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={rates[30] !== undefined && rates[30] !== null ? rates[30] : ''}
                              onChange={(e) => handlePriceChange(tierKey, dev.key, 30, e.target.value)}
                              className="w-12 bg-transparent text-amber-400 font-mono font-bold text-center outline-none border-b border-amber-500/40 focus:border-amber-400"
                            />
                          </div>
                          <span className="text-[9px] text-gray-500 font-sans mt-0.5">(30 MIN)</span>
                        </div>
                      ) : (
                        <span className="text-gray-600 font-bold">-</span>
                      )}
                    </td>

                    <td className="py-3 px-1 text-center font-mono">
                      {dev.key === 'PS VR2' ? (
                        <div className="flex flex-col items-center">
                          <div className="flex items-center text-amber-400 font-bold">
                            <span>₹</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={rates[20] !== undefined && rates[20] !== null ? rates[20] : ''}
                              onChange={(e) => handlePriceChange(tierKey, dev.key, 20, e.target.value)}
                              className="w-12 bg-transparent text-amber-400 font-mono font-bold text-center outline-none border-b border-amber-500/40 focus:border-amber-400"
                            />
                          </div>
                          <span className="text-[9px] text-gray-500 font-sans mt-0.5">(20 MIN)</span>
                        </div>
                      ) : (
                        <span className="text-gray-600 font-bold">-</span>
                      )}
                    </td>

                    <td className="py-3 px-1 text-center font-mono">
                      {dev.key === 'PS VR2' ? (
                        <div className="flex flex-col items-center">
                          <div className="flex items-center text-amber-400 font-bold">
                            <span>₹</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={rates[40] !== undefined && rates[40] !== null ? rates[40] : ''}
                              onChange={(e) => handlePriceChange(tierKey, dev.key, 40, e.target.value)}
                              className="w-12 bg-transparent text-amber-400 font-mono font-bold text-center outline-none border-b border-amber-500/40 focus:border-amber-400"
                            />
                          </div>
                          <span className="text-[9px] text-gray-500 font-sans mt-0.5">(40 MIN)</span>
                        </div>
                      ) : (
                        <span className="text-gray-600 font-bold">-</span>
                      )}
                    </td>

                    <td className="py-3 px-1 text-center font-mono">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center text-amber-400 font-bold">
                          <span>₹</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={rates[60] !== undefined && rates[60] !== null ? rates[60] : ''}
                            onChange={(e) => handlePriceChange(tierKey, dev.key, 60, e.target.value)}
                            className="w-12 bg-transparent text-amber-400 font-mono font-bold text-center outline-none border-b border-amber-500/40 focus:border-amber-400"
                          />
                        </div>
                        {(dev.key === 'Racing Simulator' || dev.key === 'PS VR2') && (
                          <span className="text-[9px] text-gray-500 font-sans mt-0.5">(1 HOUR)</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-1 text-center font-mono">
                      {dev.key === 'Racing Simulator' ? (
                        <div className="flex flex-col items-center">
                          <div className="flex items-center text-amber-400 font-bold">
                            <span>₹</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={rates[90] !== undefined && rates[90] !== null ? rates[90] : ''}
                              onChange={(e) => handlePriceChange(tierKey, dev.key, 90, e.target.value)}
                              className="w-12 bg-transparent text-amber-400 font-mono font-bold text-center outline-none border-b border-amber-500/40 focus:border-amber-400"
                            />
                          </div>
                          <span className="text-[9px] text-gray-500 font-sans mt-0.5">(1.5 HOURS)</span>
                        </div>
                      ) : (
                        <span className="text-gray-600 font-bold">-</span>
                      )}
                    </td>

                    <td className="py-3 px-1 text-center font-mono">
                      {['PlayStation 5', 'PlayStation 4', 'PlayStation 2'].includes(dev.key) ? (
                        <div className="flex flex-col items-center">
                          <div className="flex items-center text-amber-400 font-bold">
                            <span>₹</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={rates[120] !== undefined && rates[120] !== null ? rates[120] : ''}
                              onChange={(e) => handlePriceChange(tierKey, dev.key, 120, e.target.value)}
                              className="w-12 bg-transparent text-amber-400 font-mono font-bold text-center outline-none border-b border-amber-500/40 focus:border-amber-400"
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-600 font-bold">-</span>
                      )}
                    </td>

                    <td className="py-3 px-1 text-center font-mono">
                      {['PlayStation 5', 'PlayStation 4', 'PlayStation 2'].includes(dev.key) ? (
                        <div className="flex flex-col items-center">
                          <div className="flex items-center text-amber-400 font-bold">
                            <span>₹</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={rates[180] !== undefined && rates[180] !== null ? rates[180] : ''}
                              onChange={(e) => handlePriceChange(tierKey, dev.key, 180, e.target.value)}
                              className="w-12 bg-transparent text-amber-400 font-mono font-bold text-center outline-none border-b border-amber-500/40 focus:border-amber-400"
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-600 font-bold">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 font-sans text-gray-100 min-h-0 flex-1 flex flex-col custom-scrollbar overflow-y-auto pr-1">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-1 shrink-0">
        <div>
          <h2 className="font-cyber text-lg xl:text-xl font-bold text-white tracking-wider">
            Pricing Settings
          </h2>
          <p className="text-xs text-gray-400">Centralized Global Gaming Pricing Engine — Master Authority</p>
        </div>

        <div className="flex items-center gap-4">
          <div className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2.5 shadow-md transition-all duration-300 ${
            pricingMode === 'AUTO' 
              ? 'bg-purple-950/60 border-purple-500/50 shadow-[0_0_12px_rgba(147,51,234,0.3)]'
              : 'bg-amber-950/60 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
          }`}>
            {pricingMode === 'AUTO' ? (
              <Calendar className="w-4 h-4 text-emerald-400 animate-pulse" />
            ) : (
              <Edit3 className="w-4 h-4 text-amber-400 animate-pulse" />
            )}
            <div className="flex flex-col">
              <span className={`text-[9px] font-cyber uppercase tracking-wider font-bold ${
                pricingMode === 'AUTO' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                ACTIVE PRICING
              </span>
              <span className="text-xs font-cyber font-bold text-white">
                {pricingMode === 'AUTO' ? (isWeekendToday ? 'Weekend Pricing' : 'Weekday Pricing') : 'Manual Pricing Active'}
              </span>
            </div>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-[#0C091F]/90 border border-white/10 flex items-center gap-4 text-xs font-sans">
            <span className="text-gray-400 text-xs font-medium">Pricing Mode</span>
            
            <label className={`flex items-center gap-1.5 cursor-pointer font-bold transition-all ${
              pricingMode === 'AUTO' ? 'text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'text-gray-400 hover:text-white'
            }`}>
              <input 
                type="radio" 
                name="pricingMode" 
                checked={pricingMode === 'AUTO'}
                onChange={() => setPricingMode('AUTO')}
                className="accent-emerald-500 cursor-pointer" 
              />
              Auto Pricing
            </label>

            <label className={`flex items-center gap-1.5 cursor-pointer font-bold transition-all ${
              pricingMode === 'MANUAL' ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]' : 'text-gray-400 hover:text-white'
            }`}>
              <input 
                type="radio" 
                name="pricingMode" 
                checked={pricingMode === 'MANUAL'}
                onChange={() => setPricingMode('MANUAL')}
                className="accent-amber-500 cursor-pointer" 
              />
              Manual Pricing
            </label>
          </div>
        </div>
      </div>

      {validationError && (
        <div className="p-3 rounded-xl bg-red-950/90 border border-red-500 text-red-200 text-xs font-cyber font-bold flex items-center gap-2 animate-in fade-in duration-200 shadow-lg">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          {validationError}
        </div>
      )}

      {saveNotice && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-cyber font-bold flex items-center gap-2 shadow-lg animate-in fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Global Pricing Engine updated! New prices apply immediately to all FUTURE Walk-in sessions. Running sessions remain locked.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {renderPricingTable('weekday', 'WEEKDAY PRICING (MONDAY - FRIDAY)', 'bg-gradient-to-r from-[#3B0764] to-[#2E1065]', true)}
        {renderPricingTable('weekend', 'WEEKEND PRICING (SATURDAY - SUNDAY)', 'bg-gradient-to-r from-[#831843] to-[#701A75]', false)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-white/10 shadow-xl space-y-3">
          <h3 className="font-cyber text-xs font-bold text-white tracking-wider uppercase border-b border-white/10 pb-2">
            PRICING QUICK INFO
          </h3>

          <div className="space-y-2.5 text-xs text-gray-300 font-sans">
            <div className="flex items-start gap-2">
              <Gamepad2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span><strong>PS2, PS4, PS5:</strong> 1 Hour, 2 Hours, 3 Hours only</span>
            </div>
            <div className="flex items-start gap-2">
              <Tv className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Racing Simulator:</strong> 30 Minutes, 1 Hour, 1.5 Hours only</span>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span><strong>VR2:</strong> 20 Minutes, 40 Minutes, 1 Hour only</span>
            </div>
            <div className="flex items-start gap-2 pt-1 border-t border-white/5 text-gray-400">
              <Calendar className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Pricing automatically changes based on day</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 shadow-xl space-y-3">
          <h3 className="font-cyber text-xs font-bold text-white tracking-wider uppercase border-b border-white/10 pb-2 flex items-center justify-between">
            <span>PRICING MODE INFO</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition-colors ${
              pricingMode === 'AUTO' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
            }`}>
              {pricingMode === 'AUTO' ? 'AUTO PRICING ACTIVE' : 'MANUAL OVERRIDE ACTIVE'}
            </span>
          </h3>

          <div className="space-y-2.5 text-xs font-sans">
            <div 
              onClick={() => setPricingMode('AUTO')}
              className={`p-3.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                pricingMode === 'AUTO' 
                  ? 'bg-gradient-to-r from-emerald-950/60 to-emerald-900/40 border-emerald-500/80 shadow-[0_0_18px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/50'
                  : 'bg-white/5 border-white/5 opacity-60 hover:opacity-100 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-emerald-400">
                <span className="flex items-center gap-2 text-xs font-cyber">
                  <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                    pricingMode === 'AUTO' ? 'border-emerald-400 bg-emerald-400' : 'border-gray-500'
                  }`}>
                    {pricingMode === 'AUTO' && <span className="w-1 h-1 rounded-full bg-slate-950" />}
                  </span>
                  Auto Pricing (Recommended)
                </span>
                {pricingMode === 'AUTO' && (
                  <span className="text-[9px] font-cyber bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40 uppercase">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-300 mt-1.5 leading-relaxed">
                System automatically applies Weekday pricing (Mon-Fri) and Weekend pricing (Sat-Sun) based on today's date.
              </p>
            </div>

            <div 
              onClick={() => setPricingMode('MANUAL')}
              className={`p-3.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                pricingMode === 'MANUAL'
                  ? 'bg-gradient-to-r from-amber-950/60 to-purple-950/40 border-amber-500/80 shadow-[0_0_18px_rgba(245,158,11,0.3)] ring-1 ring-amber-500/50'
                  : 'bg-white/5 border-white/5 opacity-60 hover:opacity-100 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-amber-400">
                <span className="flex items-center gap-2 text-xs font-cyber">
                  <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                    pricingMode === 'MANUAL' ? 'border-amber-400 bg-amber-400' : 'border-gray-500'
                  }`}>
                    {pricingMode === 'MANUAL' && <span className="w-1 h-1 rounded-full bg-slate-950" />}
                  </span>
                  Manual Pricing
                </span>
                {pricingMode === 'MANUAL' && (
                  <span className="text-[9px] font-cyber bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40 uppercase">
                    Manual Override
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-300 mt-1.5 leading-relaxed">
                Admin can set custom price per session. Overrides auto pricing matrix.
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="font-cyber text-xs font-bold text-white tracking-wider uppercase">
              PRICING HISTORY
            </h3>
            <button className="text-[11px] font-sans text-purple-400 hover:text-purple-300 font-medium">View All</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="text-[10px] font-cyber text-gray-500 border-b border-white/10 uppercase">
                  <th className="pb-1.5">ID</th>
                  <th className="pb-1.5">UPDATED BY</th>
                  <th className="pb-1.5">PRICING TYPE</th>
                  <th className="pb-1.5">UPDATED ON</th>
                  <th className="pb-1.5 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300 font-mono">
                {historyList.map((h) => (
                  <tr key={h.id} className="hover:bg-white/5">
                    <td className="py-2 text-purple-300 font-bold">{h.id}</td>
                    <td className="py-2 text-gray-300 font-sans">{h.updatedBy}</td>
                    <td className="py-2 text-gray-300 font-sans">{h.type}</td>
                    <td className="py-2 text-gray-400 text-[10px]">{h.date}</td>
                    <td className="py-2 text-right">
                      <span className="px-2 py-0.5 rounded text-[9px] font-cyber font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/40">
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 shadow-2xl">
        <div className="flex items-center gap-6 text-xs text-gray-400 font-mono">
          <div>Last Updated: <strong className="text-white font-sans">{pricingSettings.lastUpdated || 'May 23, 2025 10:30 PM'}</strong></div>
          <div>Updated By: <strong className="text-white font-sans">{pricingSettings.updatedBy || 'Admin'}</strong></div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={handleResetDefaults}
            className="px-4 py-2.5 rounded-xl border border-purple-500/40 bg-purple-950/30 hover:bg-purple-900/50 text-purple-300 text-xs font-cyber font-bold transition-all cursor-pointer"
          >
            Restore Default Pricing
          </button>
          
          <button
            onClick={loadSettings}
            className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-sans font-medium transition-all cursor-pointer"
          >
            Reset Changes
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-cyber font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all cursor-pointer flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Pricing Changes
          </button>
        </div>
      </div>

    </div>
  );
}
