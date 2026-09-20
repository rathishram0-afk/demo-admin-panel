import React, { useState, useEffect } from 'react';
import { offerService } from '../../../services/offerService';
import { sessionService, DEVICE_DURATIONS } from '../../../services/sessionService';
import { useRealtime } from '../../../context/RealtimeContext';
import { 
  Gift, 
  Zap, 
  Search, 
  CheckCircle2, 
  Clock, 
  User, 
  Phone, 
  Plus, 
  Edit3, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  Gamepad2, 
  Tv, 
  Check, 
  X,
  Play,
  Tag,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export default function OffersModule({ onNavigateTab }) {
  const [offers, setOffers] = useState([]);
  const [stations, setStations] = useState([]);
  const [pricingSettings, setPricingSettings] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);

  // Offer Creation / Editing Form State
  const [offerForm, setOfferForm] = useState({
    offer_name: 'Play 1 Hour Get 30 Minutes Free',
    device: 'PlayStation 5',
    paid_duration: '1 Hour',
    paid_duration_mins: 60,
    status: 'Enabled',
    description: 'Pay for 1 hour on PS5 and get 30 minutes bonus time for FREE!'
  });

  const getCurrent12HourTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const amPm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const hour = String(hours).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    return { hour, minute, amPm };
  };

  const [manualStartForm, setManualStartForm] = useState(() => ({
    enabled: false,
    ...getCurrent12HourTime()
  }));

  // Launch Offer Session Form State
  const [sessionForm, setSessionForm] = useState({
    selectedOfferId: '',
    groupLeader: '',
    mobile: '',
    device: 'PlayStation 5',
    consoleId: 'PS5-1',
    numPlayers: 1,
    paidDurationLabel: '1 Hour',
    paidDurationMinutes: 60,
    paymentStatus: 'Pay at Checkout',
    paymentMethod: 'Cash',
    splitBreakdown: { cash: '', upi: '', card: '' },
    isManualAmountEnabled: false,
    manualAmount: '',
    notes: ''
  });

  const { devices, activeSessions } = useRealtime();

  const loadInitialData = async () => {
    try {
      const [offList, pSettings] = await Promise.all([
        offerService.getOffers(),
        sessionService.getPricingSettings()
      ]);
      setOffers(offList || []);
      setPricingSettings(pSettings);

      if (offList && offList.length > 0) {
        const defaultOff = offList.find(o => o.status === 'Enabled') || offList[0];
        setSessionForm(prev => ({
          ...prev,
          selectedOfferId: defaultOff.id,
          device: defaultOff.device || 'PlayStation 5'
        }));
      }
    } catch (e) {
      console.error('Error loading OffersModule data:', e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const data = sessionService.mapStations(devices, activeSessions);
    setStations(data || []);
  }, [devices, activeSessions]);

  // Selected Offer details
  const selectedOffer = offers.find(o => o.id === sessionForm.selectedOfferId) || offers[0];

  // Device & station handling
  const handleDeviceChange = async (deviceType) => {
    const { availableStation, error } = await sessionService.findAvailableStation(deviceType);
    let consoleId = availableStation ? availableStation.id : (deviceType === 'PlayStation 5' ? 'PS5-1' : deviceType === 'Racing Simulator' ? 'SIM-1' : 'VR-1');

    if (error) setValidationError(error);
    else setValidationError('');

    const isSinglePlayer = deviceType === 'Racing Simulator' || deviceType === 'PS VR2' || consoleId === 'SIM-1' || consoleId.startsWith('VR');
    const numPlayers = isSinglePlayer ? 1 : (sessionForm.numPlayers || 1);

    setSessionForm(prev => ({
      ...prev,
      device: deviceType,
      consoleId,
      numPlayers
    }));
  };

  const handleConsoleChange = (consoleId) => {
    const selectedStation = stations.find(s => s.id === consoleId);
    const deviceType = selectedStation ? selectedStation.zone : sessionForm.device;

    if (selectedStation && selectedStation.status !== 'AVAILABLE') {
      setValidationError(`${selectedStation.name} is currently occupied.`);
    } else {
      setValidationError('');
    }

    const isSinglePlayer = deviceType === 'Racing Simulator' || deviceType === 'PS VR2' || consoleId === 'SIM-1' || consoleId.startsWith('VR');
    const numPlayers = isSinglePlayer ? 1 : (sessionForm.numPlayers || 1);

    setSessionForm(prev => ({
      ...prev,
      consoleId,
      device: deviceType,
      numPlayers
    }));
  };

  // Calculations for Launch Portal
  const paidMins = Number(sessionForm.paidDurationMinutes) || Number(selectedOffer?.paid_duration_mins) || 60;

  // Bonus Mins Calculation — Must come STRICTLY from active selection/offer
  const bonusMins = (() => {
    if (paidMins === 120) return 60; // 2 Hours paid -> 1 Hour FREE bonus (Total = 180 Mins / 3 Hours)
    if (paidMins === 60) return 30;  // 1 Hour paid -> 30 Mins FREE bonus (Total = 90 Mins / 1.5 Hours)
    if (paidMins === 30) return 0;   // 30 Mins paid -> 0 bonus

    if (selectedOffer?.bonus_duration_mins !== undefined && selectedOffer?.bonus_duration_mins !== null) {
      return Number(selectedOffer.bonus_duration_mins);
    }
    return 30;
  })();

  const finalDurationMinutes = paidMins + bonusMins;

  const finalDurationLabel = (() => {
    const hrs = Math.floor(finalDurationMinutes / 60);
    const mins = finalDurationMinutes % 60;
    let parts = [];
    if (hrs > 0) parts.push(`${hrs} Hour${hrs > 1 ? 's' : ''}`);
    if (mins > 0) parts.push(`${mins} Mins`);
    return parts.join(' ') || `${finalDurationMinutes} Mins`;
  })();

  const currentPricePerPlayer = sessionService.getPriceForSessionSync(sessionForm.device, paidMins, pricingSettings);
  const calculatedPaidAmount = Math.round((sessionForm.numPlayers || 1) * currentPricePerPlayer);
  
  const totalPaidAmount = (sessionForm.isManualAmountEnabled && sessionForm.manualAmount !== '' && !isNaN(Number(sessionForm.manualAmount)))
    ? Number(sessionForm.manualAmount)
    : calculatedPaidAmount;

  const isSelectedStationAvailable = stations.find(s => s.id === sessionForm.consoleId)?.status === 'AVAILABLE';

  const isRacingSim = sessionForm.device === 'Racing Simulator' || sessionForm.consoleId === 'SIM-1';
  const isVr = sessionForm.device === 'PS VR2' || sessionForm.consoleId.startsWith('VR');
  const maxAllowedPlayers = (isRacingSim || isVr) ? 1 : 4;

  // Launch Offer Session Handler
  const handleLaunchOfferSession = async (e) => {
    e.preventDefault();

    if (!sessionForm.groupLeader || sessionForm.groupLeader.trim() === '') {
      setValidationError('Please enter a Customer / Group Leader Name before launching session.');
      return;
    }

    const targetStation = stations.find(s => s.id === sessionForm.consoleId);
    if (targetStation && targetStation.status !== 'AVAILABLE') {
      setValidationError(`${targetStation.name} is currently occupied.`);
      return;
    }

    let calculatedManualStartTime = null;
    if (manualStartForm.enabled) {
      if (!manualStartForm.hour || !manualStartForm.minute || !manualStartForm.amPm) {
        setValidationError('Please select a valid Manual Start Time (Hour, Minute, and AM/PM).');
        return;
      }
      const now = new Date();
      let h = parseInt(manualStartForm.hour, 10);
      if (isNaN(h) || h < 1 || h > 12) {
        setValidationError('Please enter a valid Manual Start Time Hour (01 to 12).');
        return;
      }
      let m = parseInt(manualStartForm.minute, 10);
      if (isNaN(m) || m < 0 || m > 59) {
        setValidationError('Please enter a valid Manual Start Time Minute (00 to 59).');
        return;
      }
      if (manualStartForm.amPm === 'PM' && h < 12) h += 12;
      if (manualStartForm.amPm === 'AM' && h === 12) h = 0;
      const manualDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
      calculatedManualStartTime = manualDate.toISOString();
    }

    const isPrepaid = sessionForm.paymentStatus === 'Prepaid';
    const isSplit = isPrepaid && (sessionForm.paymentMethod === 'Split' || sessionForm.paymentMethod === 'Split Payment');
    let splitBreakdownPayload = null;

    if (isSplit) {
      const cashVal = Number(sessionForm.splitBreakdown?.cash || 0);
      const upiVal = Number(sessionForm.splitBreakdown?.upi || 0);
      const cardVal = Number(sessionForm.splitBreakdown?.card || 0);
      const totalPaid = cashVal + upiVal + cardVal;
      if (totalPaid !== totalPaidAmount) {
        setValidationError(`Split payment amounts must equal total bill of ₹${totalPaidAmount}. Currently paid: ₹${totalPaid}.`);
        return;
      }
      splitBreakdownPayload = { cash: cashVal, upi: upiVal, card: cardVal };
    }

    setValidationError('');

    try {
      await offerService.startOfferSession({
        offerName: selectedOffer?.offer_name || 'Play Offer',
        stationId: sessionForm.consoleId,
        customerName: sessionForm.groupLeader,
        phone: sessionForm.mobile || '',
        numPlayers: sessionForm.numPlayers || 1,
        paidDurationMinutes: paidMins,
        bonusDurationMinutes: bonusMins,
        deviceType: sessionForm.device,
        paymentStatus: sessionForm.paymentStatus || 'Pay at Checkout',
        paymentMethod: isPrepaid ? (isSplit ? 'Split' : sessionForm.paymentMethod) : null,
        splitBreakdown: splitBreakdownPayload,
        notes: sessionForm.notes || '',
        manualAmount: sessionForm.isManualAmountEnabled ? totalPaidAmount : null,
        manualStartTime: calculatedManualStartTime
      });

      setSuccessNotice(`Offer session launched on ${sessionForm.consoleId} for ${finalDurationLabel}! Paid Amount ₹${totalPaidAmount}`);
      setTimeout(() => setSuccessNotice(''), 4000);

      // Reset launch form
      setSessionForm(prev => ({
        ...prev,
        groupLeader: '',
        mobile: '',
        numPlayers: 1,
        paymentStatus: 'Pay at Checkout',
        paymentMethod: 'Cash',
        splitBreakdown: { cash: '', upi: '', card: '' },
        notes: ''
      }));

      if (onNavigateTab) {
        onNavigateTab('SESSIONS');
      }
    } catch (err) {
      setValidationError(err.message || 'Failed to launch offer session.');
    }
  };

  // Offer Admin Actions
  const handleToggleStatus = async (id) => {
    const updatedList = await offerService.toggleOfferStatus(id);
    setOffers(updatedList);
  };

  const handleDeleteOffer = async (id) => {
    if (window.confirm('Delete this promotional offer?')) {
      const updatedList = await offerService.deleteOffer(id);
      setOffers(updatedList);
    }
  };

  const handleSaveOfferForm = async (e) => {
    e.preventDefault();
    if (!offerForm.offer_name.trim()) {
      alert('Please enter an Offer Name.');
      return;
    }

    if (editingOffer) {
      const updatedList = await offerService.updateOffer(editingOffer.id, offerForm);
      setOffers(updatedList);
    } else {
      await offerService.createOffer(offerForm);
      const updatedList = await offerService.getOffers();
      setOffers(updatedList);
    }

    setShowCreateModal(false);
    setEditingOffer(null);
  };

  return (
    <div className="space-y-4 font-sans text-gray-100 min-h-0 flex-1 flex flex-col custom-scrollbar overflow-y-auto pr-1">
      
      {/* MODULE HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-1 shrink-0">
        <div>
          <h2 className="font-cyber text-lg xl:text-xl font-bold text-white tracking-wider flex items-center gap-2">
            <Gift className="w-6 h-6 text-pink-400 animate-pulse" /> Offer Management & Promotion Center
          </h2>
          <p className="text-xs text-gray-400">Independent Offer Module — Launch Promotional Sessions with FREE Bonus Time</p>
        </div>

        <button
          onClick={() => {
            setEditingOffer(null);
            setOfferForm({
              offer_name: 'Play 1 Hour Get 30 Minutes Free',
              device: 'PlayStation 5',
              paid_duration: '1 Hour',
              paid_duration_mins: 60,
              status: 'Enabled',
              description: 'Pay for 1 hour on PS5 and get 30 minutes bonus time for FREE!'
            });
            setShowCreateModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-cyber text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(236,72,153,0.4)] flex items-center gap-2 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" /> Create New Offer
        </button>
      </div>

      {validationError && (
        <div className="p-3 rounded-xl bg-red-950/90 border border-red-500 text-red-200 text-xs font-cyber font-bold flex items-center gap-2 animate-in fade-in duration-200 shadow-lg">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          {validationError}
        </div>
      )}

      {successNotice && (
        <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-cyber font-bold flex items-center gap-2 shadow-lg animate-in fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {successNotice}
        </div>
      )}

      {/* SECTION 1: PROMOTIONAL OFFERS MATRIX */}
      <div className="glass-panel p-4 xl:p-5 rounded-2xl border border-white/10 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="font-cyber text-sm xl:text-base font-bold text-white tracking-wider flex items-center gap-2 uppercase">
              <Tag className="w-4 h-4 text-purple-400" /> Active Promotional Packages
            </h3>
            <p className="text-xs text-gray-400">Configure promotional rules & bonus durations across gaming consoles</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {offers.map(off => {
            const isEnabled = off.status === 'Enabled';
            return (
              <div 
                key={off.id}
                className={`p-4 rounded-2xl border transition-all duration-300 relative space-y-3 ${
                  isEnabled 
                    ? 'bg-slate-950/80 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                    : 'bg-black/40 border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-cyber font-bold uppercase tracking-wider text-pink-400 bg-pink-950/50 px-2 py-0.5 rounded border border-pink-500/30">
                      {off.device || 'PlayStation 5'}
                    </span>
                    <h4 className="font-cyber font-bold text-white text-sm mt-1.5">{off.offer_name}</h4>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(off.id)}
                    className={`p-1 rounded-lg transition-colors cursor-pointer ${
                      isEnabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-gray-500 hover:text-gray-400'
                    }`}
                    title={isEnabled ? 'Click to Disable Offer' : 'Click to Enable Offer'}
                  >
                    {isEnabled ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between items-center text-gray-300">
                    <span>PAID DURATION:</span>
                    <span className="text-white font-bold">{off.paid_duration || '1 Hour'}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-400 font-bold">
                    <span>BONUS TIME:</span>
                    <span className="bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      +{off.bonus_duration || '30 Minutes'} FREE
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 leading-snug line-clamp-2">{off.description}</p>

                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                  <span className={`text-[10px] font-cyber font-bold uppercase ${isEnabled ? 'text-emerald-400' : 'text-gray-500'}`}>
                    Status: {off.status}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingOffer(off);
                        setOfferForm(off);
                        setShowCreateModal(true);
                      }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-300 hover:text-white transition-colors cursor-pointer"
                      title="Edit Offer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteOffer(off.id)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-red-950/60 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete Offer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* COMPACT MANUAL START TIME BOX ALIGNED WITH PROMOTIONAL PACKAGES */}
          <div 
            className={`p-4 rounded-2xl border transition-all duration-300 relative space-y-3 flex flex-col justify-between ${
              manualStartForm.enabled 
                ? 'bg-amber-950/40 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                : 'bg-slate-950/80 border-white/10'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-cyber font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40 flex items-center gap-1 w-fit">
                  <Clock className="w-3 h-3" /> SESSION TIMER SETUP
                </span>
                <h4 className="font-cyber font-bold text-white text-sm mt-1.5 flex items-center gap-1.5">
                  MANUAL START TIME
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setManualStartForm(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`px-3 py-1 rounded-xl border text-xs font-cyber font-bold transition-all cursor-pointer ${
                  manualStartForm.enabled
                    ? 'bg-amber-500 text-black border-amber-400 font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                    : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                }`}
              >
                {manualStartForm.enabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-gray-400 text-[11px] font-cyber">START TIME:</span>
                <div className="flex items-center gap-1">
                  <select
                    value={manualStartForm.hour}
                    disabled={!manualStartForm.enabled}
                    onChange={(e) => setManualStartForm(prev => ({ ...prev, hour: e.target.value }))}
                    className={`bg-black/60 border rounded px-1.5 py-1 text-xs font-mono font-bold outline-none cursor-pointer text-center ${
                      manualStartForm.enabled ? 'border-amber-500/60 text-amber-300' : 'border-white/10 text-gray-500 opacity-60'
                    }`}
                  >
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="text-gray-500 font-bold">:</span>
                  <select
                    value={manualStartForm.minute}
                    disabled={!manualStartForm.enabled}
                    onChange={(e) => setManualStartForm(prev => ({ ...prev, minute: e.target.value }))}
                    className={`bg-black/60 border rounded px-1.5 py-1 text-xs font-mono font-bold outline-none cursor-pointer text-center ${
                      manualStartForm.enabled ? 'border-amber-500/60 text-amber-300' : 'border-white/10 text-gray-500 opacity-60'
                    }`}
                  >
                    {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={manualStartForm.amPm}
                    disabled={!manualStartForm.enabled}
                    onChange={(e) => setManualStartForm(prev => ({ ...prev, amPm: e.target.value }))}
                    className={`bg-black/60 border rounded px-1.5 py-1 text-xs font-mono font-bold outline-none cursor-pointer text-center ml-0.5 ${
                      manualStartForm.enabled ? 'border-amber-500/60 text-amber-300' : 'border-white/10 text-gray-500 opacity-60'
                    }`}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>

            <p className="text-[11px] leading-snug">
              {manualStartForm.enabled ? (
                <span className="text-amber-300 font-medium flex items-center gap-1">
                  ⚡ Manual Start Active: Session starts at {manualStartForm.hour}:{manualStartForm.minute} {manualStartForm.amPm}
                </span>
              ) : (
                <span className="text-gray-400 font-normal">
                  ⏱️ Normal System Time: Session starts at real time when Launched
                </span>
              )}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <span className={`text-[10px] font-cyber font-bold uppercase ${manualStartForm.enabled ? 'text-amber-400' : 'text-gray-500'}`}>
                Status: {manualStartForm.enabled ? 'Manual Start Enabled' : 'Real Time'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: LAUNCH OFFER SESSION PORTAL */}
      <div className="glass-panel p-4 xl:p-5 rounded-2xl border border-white/10 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
          <div>
            <h3 className="font-cyber text-base font-bold text-white tracking-wider flex items-center gap-2">
              <Zap className="w-5 h-5 text-pink-400" /> Launch Offer Session Portal
            </h3>
            <p className="text-xs text-gray-400">Launch sessions directly using active offer packages — Bonus time applied ONLY here</p>
          </div>

          <span className="px-3 py-1 rounded-xl bg-purple-950/80 border border-purple-500/60 text-purple-300 text-xs font-cyber font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)] self-end sm:self-auto">
            🎁 OFFER MODE ACTIVE
          </span>
        </div>

        <form onSubmit={handleLaunchOfferSession} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1">Select Offer Package</label>
              <select
                value={sessionForm.selectedOfferId}
                onChange={(e) => {
                  const offId = e.target.value;
                  const found = offers.find(o => o.id === offId);
                  const offPaidMins = Number(found?.paid_duration_mins) || (offId.includes('2hr') ? 120 : 60);
                  const offLabel = found?.paid_duration || (offPaidMins === 120 ? '2 Hours (Get 1H Free)' : '1 Hour');
                  setSessionForm(prev => ({
                    ...prev,
                    selectedOfferId: offId,
                    device: found ? (found.device || prev.device) : prev.device,
                    paidDurationMinutes: offPaidMins,
                    paidDurationLabel: offLabel
                  }));
                }}
                className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-pink-500/30 focus:border-pink-500 text-xs text-white outline-none cursor-pointer font-medium"
              >
                {offers.map(o => (
                  <option key={o.id} value={o.id} disabled={o.status !== 'Enabled'}>
                    {o.offer_name} ({o.device}) — {o.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1">Group Leader Name *</label>
              <input
                type="text"
                value={sessionForm.groupLeader}
                onChange={(e) => {
                  setValidationError('');
                  setSessionForm({ ...sessionForm, groupLeader: e.target.value });
                }}
                placeholder="Enter customer name"
                className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 focus:border-purple-500 text-xs text-white outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1">Mobile Number (Optional)</label>
              <input
                type="text"
                value={sessionForm.mobile}
                onChange={(e) => setSessionForm({ ...sessionForm, mobile: e.target.value })}
                placeholder="+91 9344176534"
                className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 focus:border-purple-500 text-xs text-white outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1">Assigned Station Console</label>
              <select
                value={sessionForm.consoleId}
                onChange={(e) => handleConsoleChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 focus:border-purple-500 text-xs text-white outline-none cursor-pointer font-medium"
              >
                {stations.map(s => {
                  const isNotAvailable = s.status !== 'AVAILABLE';
                  let statusLabel = s.status;
                  if (s.status === 'RUNNING' || s.status === 'ACTIVE' || s.status === 'ENDING_SOON') statusLabel = 'Already Running';
                  else if (s.status === 'MAINTENANCE') statusLabel = 'Under Maintenance';

                  return (
                    <option key={s.id} value={s.id} disabled={isNotAvailable}>
                      {s.name} ({s.zone}) — {statusLabel}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* PLAYER CAPACITY BUTTONS */}
            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1">
                Number of Players <span className="text-[10px] text-purple-400 font-mono">(Max {maxAllowedPlayers})</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(num => {
                  const isDisabled = num > maxAllowedPlayers;
                  return (
                    <button
                      type="button"
                      key={num}
                      disabled={isDisabled}
                      onClick={() => !isDisabled && setSessionForm(prev => ({ ...prev, numPlayers: num }))}
                      className={`flex-1 py-2 rounded-xl border text-xs font-cyber font-bold transition-all ${
                        isDisabled
                          ? 'bg-black/40 border-white/5 text-gray-600 cursor-not-allowed opacity-40'
                          : sessionForm.numPlayers === num
                          ? 'bg-purple-900/60 border-purple-500 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)] cursor-pointer'
                          : 'bg-[#0F1219] border-white/10 text-gray-400 hover:text-white cursor-pointer'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DURATION SELECTION & MANUAL AMOUNT CONTROLS */}
            <div className="space-y-3">
              {/* MANUAL AMOUNT OPTION */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-cyber font-bold text-emerald-300 flex items-center gap-1.5 cursor-pointer">
                    <Tag className="w-3.5 h-3.5 text-emerald-400" />
                    MANUAL AMOUNT
                  </label>
                  <button
                    type="button"
                    onClick={() => setSessionForm(prev => ({ ...prev, isManualAmountEnabled: !prev.isManualAmountEnabled }))}
                    className={`text-[10px] font-cyber font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
                      sessionForm.isManualAmountEnabled
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {sessionForm.isManualAmountEnabled ? 'ENABLED ON' : 'ENABLE MANUAL AMOUNT'}
                  </button>
                </div>

                {sessionForm.isManualAmountEnabled ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-emerald-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={sessionForm.manualAmount}
                      onChange={(e) => setSessionForm({ ...sessionForm, manualAmount: e.target.value })}
                      placeholder="Enter custom amount (e.g. 200, 500)"
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[#0F1219] border border-emerald-500/50 text-xs font-mono font-bold text-white outline-none"
                    />
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400">Auto pricing from Pricing Settings configuration</p>
                )}
              </div>

              {/* DURATION BUTTONS */}
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">
                  Select Paid Duration <span className="text-[10px] text-pink-400 font-mono">(Customer Pays)</span>
                </label>
                <div className="flex gap-2">
                  {[
                    { label: '30 Mins', mins: 30 },
                    { label: '1 Hour', mins: 60 },
                    { label: '2 Hours (Get 1H Free)', mins: 120 },
                    { label: '3 Hours', mins: 180 }
                  ].map(dur => (
                    <button
                      type="button"
                      key={dur.mins}
                      onClick={() => {
                        const matchingOffer = offers.find(o => Number(o.paid_duration_mins) === dur.mins && o.status === 'Enabled');
                        setSessionForm(prev => ({
                          ...prev,
                          paidDurationLabel: dur.label,
                          paidDurationMinutes: dur.mins,
                          selectedOfferId: matchingOffer ? matchingOffer.id : prev.selectedOfferId
                        }));
                      }}
                      className={`flex-1 py-2 px-1 rounded-xl border text-xs font-cyber font-bold transition-all cursor-pointer truncate ${
                        sessionForm.paidDurationMinutes === dur.mins
                          ? 'bg-pink-900/60 border-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                          : 'bg-[#0F1219] border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* PAYMENT STATUS & CONDITIONAL PAYMENT METHOD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-xl bg-[#090C19] border border-pink-500/20">
            <div>
              <label className="text-xs font-cyber font-bold text-gray-300 block mb-1">
                Payment Status *
              </label>
              <div className="flex gap-2">
                {['Pay at Checkout', 'Prepaid'].map(statusOpt => {
                  const isSelected = sessionForm.paymentStatus === statusOpt;
                  return (
                    <button
                      type="button"
                      key={statusOpt}
                      onClick={() => setSessionForm(prev => ({ ...prev, paymentStatus: statusOpt }))}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-cyber font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-900/60 border-purple-500 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)]'
                          : 'bg-[#0F1219] border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {statusOpt === 'Pay at Checkout' ? '🧾 Paid Checkout' : '💳 Prepaid'}
                    </button>
                  );
                })}
              </div>
            </div>

            {sessionForm.paymentStatus === 'Prepaid' && (
              <div className="animate-in fade-in zoom-in-95 duration-200 space-y-2">
                <label className="text-xs font-cyber font-bold text-gray-300 block mb-1">
                  Payment Method *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Cash', 'UPI', 'Debit Card', 'Split Payment'].map(methodOpt => {
                    const isSelected = sessionForm.paymentMethod === methodOpt || (methodOpt === 'Split Payment' && sessionForm.paymentMethod === 'Split');
                    return (
                      <button
                        type="button"
                        key={methodOpt}
                        onClick={() => setSessionForm(prev => ({ 
                          ...prev, 
                          paymentMethod: methodOpt === 'Split Payment' ? 'Split' : methodOpt 
                        }))}
                        className={`py-2 px-2 rounded-xl border text-[11px] font-cyber font-bold transition-all cursor-pointer truncate ${
                          isSelected
                            ? 'bg-emerald-900/60 border-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                            : 'bg-[#0F1219] border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        {methodOpt}
                      </button>
                    );
                  })}
                </div>

                {/* SPLIT PAYMENT INPUTS & BREAKDOWN */}
                {(sessionForm.paymentMethod === 'Split' || sessionForm.paymentMethod === 'Split Payment') && (() => {
                  const billAmt = Number(totalPaidAmount) || 0;
                  const cashVal = Number(sessionForm.splitBreakdown?.cash || 0);
                  const upiVal = Number(sessionForm.splitBreakdown?.upi || 0);
                  const cardVal = Number(sessionForm.splitBreakdown?.card || 0);
                  const totalPaid = cashVal + upiVal + cardVal;
                  const remaining = billAmt - totalPaid;

                  return (
                    <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between text-xs border-b border-white/10 pb-1.5">
                        <span className="font-cyber font-bold text-purple-300 uppercase tracking-wider">
                          Prepaid Split Breakdown
                        </span>
                        <span className="font-mono text-gray-400">
                          Total Bill: <strong className="text-white">₹{billAmt}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-cyber text-emerald-400 block mb-1">Cash (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={sessionForm.splitBreakdown?.cash ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSessionForm(prev => ({
                                ...prev,
                                splitBreakdown: { ...prev.splitBreakdown, cash: val }
                              }));
                            }}
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0F1219] border border-white/10 focus:border-emerald-500 text-xs font-mono font-bold text-white outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-cyber text-cyan-400 block mb-1">UPI (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={sessionForm.splitBreakdown?.upi ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSessionForm(prev => ({
                                ...prev,
                                splitBreakdown: { ...prev.splitBreakdown, upi: val }
                              }));
                            }}
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0F1219] border border-white/10 focus:border-cyan-500 text-xs font-mono font-bold text-white outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-cyber text-blue-400 block mb-1">Debit Card (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={sessionForm.splitBreakdown?.card ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSessionForm(prev => ({
                                ...prev,
                                splitBreakdown: { ...prev.splitBreakdown, card: val }
                              }));
                            }}
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0F1219] border border-white/10 focus:border-blue-500 text-xs font-mono font-bold text-white outline-none"
                          />
                        </div>
                      </div>

                      {/* Real-time Status / Validation Footer */}
                      <div className="flex items-center justify-between pt-1 text-[11px] font-mono border-t border-white/5">
                        <span className="text-gray-400">
                          Total Paid: <strong className="text-white">₹{totalPaid}</strong>
                        </span>
                        {remaining === 0 ? (
                          <span className="text-emerald-400 font-cyber font-bold">
                            ✓ Balanced (₹0 Remaining)
                          </span>
                        ) : remaining > 0 ? (
                          <span className="text-amber-400 font-cyber font-bold">
                            ⚠️ Remaining: ₹{remaining}
                          </span>
                        ) : (
                          <span className="text-red-400 font-cyber font-bold">
                            ❌ Overpaid: ₹{Math.abs(remaining)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* OFFER SUMMARY WIDGET */}
          <div className="p-3.5 rounded-xl bg-[#090C19] border border-pink-500/30 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs font-sans shadow-[0_0_15px_rgba(236,72,153,0.1)]">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-cyber block">Applied Offer</span>
              <span className="font-cyber font-bold text-pink-300 truncate block">{selectedOffer?.offer_name || 'Standard Offer'}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-cyber block">PAID DURATION</span>
              <span className="font-mono text-purple-300 font-bold">{paidMins} Mins × {sessionForm.numPlayers} Rigs</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-cyber block">BONUS TIME FREE</span>
              <span className="font-mono text-emerald-400 font-bold">
                {bonusMins > 0 ? `+${bonusMins} Mins FREE` : 'None (30 Min Rate)'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-cyber block">TOTAL PLAY TIME</span>
              <span className="font-mono text-cyan-300 font-extrabold">{finalDurationLabel}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-cyber block">CHARGE / PAID AMOUNT</span>
              <span className="font-mono text-base font-extrabold text-emerald-400">
                ₹ {totalPaidAmount} {sessionForm.isManualAmountEnabled && <span className="text-[9px] font-sans font-normal text-emerald-300">(Manual)</span>}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="text-xs text-gray-400 font-mono">
              Station Availability: <strong className={isSelectedStationAvailable ? 'text-emerald-400' : 'text-red-400'}>
                {isSelectedStationAvailable ? 'AVAILABLE' : 'OCCUPIED / BUSY'}
              </strong>
            </div>

            <button
              type="submit"
              disabled={(() => {
                if (!isSelectedStationAvailable) return true;
                const isPrepaid = sessionForm.paymentStatus === 'Prepaid';
                const isSplit = isPrepaid && (sessionForm.paymentMethod === 'Split' || sessionForm.paymentMethod === 'Split Payment');
                if (isSplit) {
                  const billAmt = Number(totalPaidAmount) || 0;
                  const cashVal = Number(sessionForm.splitBreakdown?.cash || 0);
                  const upiVal = Number(sessionForm.splitBreakdown?.upi || 0);
                  const cardVal = Number(sessionForm.splitBreakdown?.card || 0);
                  return (cashVal + upiVal + cardVal) !== billAmt;
                }
                return false;
              })()}
              className={`px-6 py-2.5 rounded-xl text-xs font-cyber font-bold text-white uppercase tracking-wider transition-all flex items-center gap-2 ${
                (!isSelectedStationAvailable || (() => {
                  const isPrepaid = sessionForm.paymentStatus === 'Prepaid';
                  const isSplit = isPrepaid && (sessionForm.paymentMethod === 'Split' || sessionForm.paymentMethod === 'Split Payment');
                  if (isSplit) {
                    const billAmt = Number(totalPaidAmount) || 0;
                    const cashVal = Number(sessionForm.splitBreakdown?.cash || 0);
                    const upiVal = Number(sessionForm.splitBreakdown?.upi || 0);
                    const cardVal = Number(sessionForm.splitBreakdown?.card || 0);
                    return (cashVal + upiVal + cardVal) !== billAmt;
                  }
                  return false;
                })())
                  ? 'bg-gray-800 text-gray-500 border border-white/10 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-[0_0_15px_rgba(236,72,153,0.4)] cursor-pointer'
              }`}
            >
              <Play className="w-4 h-4" /> Launch Offer Session
            </button>
          </div>
        </form>
      </div>

      {/* CREATE / EDIT OFFER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel p-5 rounded-2xl border border-pink-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-cyber font-bold text-white text-base flex items-center gap-2">
                <Gift className="w-5 h-5 text-pink-400" />
                {editingOffer ? 'Edit Promotional Offer' : 'Create New Promotional Offer'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingOffer(null);
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOfferForm} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 font-medium block mb-1">Offer Name *</label>
                <input
                  type="text"
                  value={offerForm.offer_name}
                  onChange={(e) => setOfferForm({ ...offerForm, offer_name: e.target.value })}
                  placeholder="e.g. Play 1 Hour Get 30 Minutes Free"
                  className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-white outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-gray-400 font-medium block mb-1">Target Device Platform</label>
                <select
                  value={offerForm.device}
                  onChange={(e) => setOfferForm({ ...offerForm, device: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-white outline-none cursor-pointer"
                >
                  <option value="PlayStation 5">PlayStation 5</option>
                  <option value="PlayStation 4">PlayStation 4</option>
                  <option value="Racing Simulator">Racing Simulator</option>
                  <option value="PS VR2">PS VR2</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 font-medium block mb-1">Booked Paid Duration</label>
                  <select
                    value={offerForm.paid_duration}
                    onChange={(e) => {
                      const val = e.target.value;
                      const mins = val === '30 Minutes' ? 30 : val === '1 Hour' ? 60 : val === '2 Hours' ? 120 : 180;
                      setOfferForm({ ...offerForm, paid_duration: val, paid_duration_mins: mins });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-white outline-none cursor-pointer"
                  >
                    <option value="1 Hour">1 Hour (60 mins)</option>
                    <option value="2 Hours">2 Hours (120 mins)</option>
                    <option value="3 Hours">3 Hours (180 mins)</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 font-medium block mb-1">FREE Bonus Time</label>
                  <div className="px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 font-mono font-bold text-emerald-300">
                    +30 Minutes FREE
                  </div>
                </div>
              </div>

              <div>
                <label className="text-gray-400 font-medium block mb-1">Offer Description</label>
                <textarea
                  value={offerForm.description}
                  onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                  rows="2"
                  className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-white outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingOffer(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 font-cyber font-bold text-white uppercase shadow-md hover:from-pink-500 hover:to-purple-500"
                >
                  {editingOffer ? 'Update Offer' : 'Save Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
