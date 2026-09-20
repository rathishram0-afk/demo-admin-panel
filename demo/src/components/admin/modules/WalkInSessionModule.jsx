import React, { useState, useEffect } from 'react';
import { sessionService, DEVICE_DURATIONS } from '../../../services/sessionService';
import { useRealtime } from '../../../context/RealtimeContext';
import { 
  Zap, 
  Search, 
  Filter, 
  Printer, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  Clock, 
  User, 
  Phone, 
  DollarSign, 
  X,
  ChevronLeft,
  ChevronRight,
  Tv,
  Gamepad2,
  Sparkles,
  AlertCircle,
  Sliders,
  Check,
  Calendar
} from 'lucide-react';

export default function WalkInSessionModule({ onNavigateTab }) {
  const [stations, setStations] = useState([]);
  const [history, setHistory] = useState([]);
  const [pricingSettings, setPricingSettings] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [tierInfo, setTierInfo] = useState({
    isWeekend: false,
    tierName: 'WEEKDAY PRICING',
    dayName: '',
    dateStr: '',
    timeStr: ''
  });

  const [walkInForm, setWalkInForm] = useState({
    groupLeader: '',
    mobile: '',
    device: 'PlayStation 5',
    consoleId: 'PS5-1',
    numPlayers: 1,
    durationLabel: '1 Hour',
    durationMinutes: 60,
    paymentStatus: 'Pay at Checkout',
    paymentMethod: 'Cash',
    splitBreakdown: { cash: '', upi: '', card: '' },
    notes: '',
    manualStartEnabled: false,
    manualHour: '12',
    manualMinute: '00',
    manualAmPm: 'PM',
    isManualRate: false,
    manualAmount: '120'
  });

  const isManualPricingMode = walkInForm.isManualRate;

  // SINGLE SOURCE OF TRUTH: Price calculation
  const currentHourlyPrice = sessionService.getPriceForSessionSync(walkInForm.device, walkInForm.durationMinutes, pricingSettings);
  const estimatedTotal = isManualPricingMode
    ? (walkInForm.manualAmount !== '' && !isNaN(Number(walkInForm.manualAmount)) ? Number(walkInForm.manualAmount) : 0)
    : Math.round((walkInForm.numPlayers || 1) * currentHourlyPrice);

  // Live Header Date & Time (Independent of form state)
  useEffect(() => {
    const updateHeaderTime = () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      setTierInfo({
        isWeekend,
        tierName: isWeekend ? 'WEEKEND PRICING' : 'WEEKDAY PRICING',
        dayName: now.toLocaleDateString('en-US', { weekday: 'long' }),
        dateStr: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        timeStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    };
    updateHeaderTime();
    const timer = setInterval(updateHeaderTime, 10000);
    return () => clearInterval(timer);
  }, []);

  const { devices, activeSessions } = useRealtime();

  const loadData = async () => {
    try {
      const [hist, pSettings] = await Promise.all([
        sessionService.getWalkInHistory(),
        sessionService.getPricingSettings()
      ]);
      setHistory(hist || []);
      setPricingSettings(pSettings);
    } catch (e) {
      console.error('Error loading WalkinSession data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (pricingSettings) {
      setWalkInForm(prev => ({
        ...prev,
        isManualRate: pricingSettings.pricingMode === 'MANUAL'
      }));
    }
  }, [pricingSettings]);

  useEffect(() => {
    const data = sessionService.mapStations(devices, activeSessions);
    setStations(data || []);
  }, [devices, activeSessions]);

  useEffect(() => {
    const handlePricingUpdated = () => {
      loadData();
    };

    window.addEventListener('gforce-pricing-updated', handlePricingUpdated);
    return () => {
      window.removeEventListener('gforce-pricing-updated', handlePricingUpdated);
    };
  }, []);

  // AUTO STATION ASSIGNMENT & DEVICE CAPACITY RULES
  const handleDeviceTypeChange = async (deviceType) => {
    // Auto Station Assignment
    const { availableStation, error } = await sessionService.findAvailableStation(deviceType);
    let consoleId = availableStation ? availableStation.id : (deviceType === 'PlayStation 5' ? 'PS5-1' : deviceType === 'Racing Simulator' ? 'SIM-1' : 'VR-1');

    if (error) {
      setValidationError(error);
    } else {
      setValidationError('');
    }

    const isSinglePlayer = deviceType === 'Racing Simulator' || deviceType === 'PS VR2' || consoleId === 'SIM-1' || consoleId.startsWith('VR');
    const numPlayers = isSinglePlayer ? 1 : (walkInForm.numPlayers || 1);

    setWalkInForm(prev => ({
      ...prev,
      device: deviceType,
      consoleId,
      numPlayers
    }));
  };

  // Station Dropdown Select Handler
  const handleConsoleChange = (consoleId) => {
    const selectedStation = stations.find(s => s.id === consoleId);
    const deviceType = selectedStation ? selectedStation.zone : walkInForm.device;

    if (selectedStation && selectedStation.status !== 'AVAILABLE') {
      let err = `${selectedStation.name} is currently occupied.`;
      if (selectedStation.zone === 'Racing Simulator') err = 'Racing Simulator currently occupied.';
      else if (selectedStation.zone === 'PS VR2') err = 'All VR Stations are Occupied.';
      setValidationError(err);
    } else {
      setValidationError('');
    }

    const isSinglePlayer = deviceType === 'Racing Simulator' || deviceType === 'PS VR2' || consoleId === 'SIM-1' || consoleId.startsWith('VR');
    const numPlayers = isSinglePlayer ? 1 : (walkInForm.numPlayers || 1);

    setWalkInForm(prev => ({
      ...prev,
      consoleId,
      device: deviceType,
      numPlayers
    }));
  };

  const handleDurationSelect = (durObj) => {
    setWalkInForm(prev => ({
      ...prev,
      durationLabel: durObj.label,
      durationMinutes: durObj.minutes
    }));
  };

  const handleStartSessionSubmit = async (e) => {
    e.preventDefault();

    if (!walkInForm.groupLeader || walkInForm.groupLeader.trim() === '') {
      setValidationError('Please enter a Group Leader Name before starting session.');
      return;
    }

    let parsedManualStartTime = null;
    if (walkInForm.manualStartEnabled) {
      const now = new Date();
      let hours = parseInt(walkInForm.manualHour, 10);
      if (walkInForm.manualAmPm === 'PM' && hours < 12) hours += 12;
      if (walkInForm.manualAmPm === 'AM' && hours === 12) hours = 0;
      
      const manualDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, parseInt(walkInForm.manualMinute, 10), 0, 0);
      parsedManualStartTime = manualDate.toISOString();
    }

    const targetStation = stations.find(s => s.id === walkInForm.consoleId);
    if (targetStation && targetStation.status !== 'AVAILABLE') {
      let err = `${targetStation.name} is currently occupied.`;
      if (targetStation.zone === 'Racing Simulator') err = 'Racing Simulator currently occupied.';
      else if (targetStation.zone === 'PS VR2') err = 'All VR Stations are Occupied.';
      setValidationError(err);
      return;
    }

    const isSinglePlayer = walkInForm.device === 'Racing Simulator' || walkInForm.device === 'PS VR2' || walkInForm.consoleId === 'SIM-1' || walkInForm.consoleId.startsWith('VR');
    if (isSinglePlayer && walkInForm.numPlayers > 1) {
      setValidationError('This gaming device supports only one player.');
      return;
    }

    const isPrepaid = walkInForm.paymentStatus === 'Prepaid';
    const isSplit = isPrepaid && (walkInForm.paymentMethod === 'Split' || walkInForm.paymentMethod === 'Split Payment');
    let splitBreakdownPayload = null;

    if (isSplit) {
      const cashVal = Number(walkInForm.splitBreakdown?.cash || 0);
      const upiVal = Number(walkInForm.splitBreakdown?.upi || 0);
      const cardVal = Number(walkInForm.splitBreakdown?.card || 0);
      const totalPaid = cashVal + upiVal + cardVal;
      if (totalPaid !== estimatedTotal) {
        setValidationError(`Split payment amounts must equal total bill of ₹${estimatedTotal}. Currently paid: ₹${totalPaid}.`);
        return;
      }
      splitBreakdownPayload = { cash: cashVal, upi: upiVal, card: cardVal };
    }

    setValidationError('');

    try {
      sessionService.startWalkInSession({
        stationId: walkInForm.consoleId,
        customerName: walkInForm.groupLeader,
        phone: walkInForm.mobile || '',
        numPlayers: walkInForm.numPlayers || 1,
        durationMinutes: walkInForm.durationMinutes || 60,
        hourlyPrice: isManualPricingMode ? estimatedTotal : currentHourlyPrice,
        estimatedTotal: estimatedTotal,
        notes: walkInForm.notes || '',
        paymentStatus: walkInForm.paymentStatus,
        paymentMethod: isPrepaid ? (isSplit ? 'Split' : (walkInForm.paymentMethod || 'Cash')) : null,
        splitBreakdown: splitBreakdownPayload,
        manualStartTime: parsedManualStartTime,
        isManualMode: isManualPricingMode
      }).then(() => {
        loadData();
      });

      handleResetForm();

      if (onNavigateTab) {
        onNavigateTab('SESSIONS');
      }
    } catch (err) {
      setValidationError(err.message || 'Failed to start session.');
    }
  };

  const handleResetForm = () => {
    setValidationError('');
    setWalkInForm({
      groupLeader: '',
      mobile: '',
      device: 'PlayStation 5',
      consoleId: 'PS5-1',
      numPlayers: 1,
      durationLabel: '1 Hour',
      durationMinutes: 60,
      paymentStatus: 'Pay at Checkout',
      paymentMethod: 'Cash',
      splitBreakdown: { cash: '', upi: '', card: '' },
      notes: '',
      manualStartEnabled: false,
      manualHour: '12',
      manualMinute: '00',
      manualAmPm: 'PM',
      isManualRate: false,
      manualAmount: '120'
    });
  };

  const handleToggleManualMode = () => {
    setWalkInForm(prev => {
      const nextManual = !prev.isManualRate;
      return {
        ...prev,
        isManualRate: nextManual,
        manualAmount: nextManual ? (estimatedTotal > 0 ? String(estimatedTotal) : '120') : ''
      };
    });
  };

  const handleDeleteHistory = async (id) => {
    if (window.confirm('Delete this walk-in session record?')) {
      await sessionService.deleteWalkInRecord(id);
      await loadData();
    }
  };

  const handleToggleManualStart = () => {
    setWalkInForm(prev => {
      if (!prev.manualStartEnabled) {
        const now = new Date();
        let h = now.getHours();
        const m = now.getMinutes();
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        
        return {
          ...prev,
          manualStartEnabled: true,
          manualHour: h.toString(),
          manualMinute: m.toString().padStart(2, '0'),
          manualAmPm: ampm
        };
      }
      return { ...prev, manualStartEnabled: false };
    });
  };

  const availableDurations = DEVICE_DURATIONS[walkInForm.device] || DEVICE_DURATIONS['PlayStation 5'];
  const isRacingSim = walkInForm.device === 'Racing Simulator' || walkInForm.consoleId === 'SIM-1' || walkInForm.device.toLowerCase().includes('sim');
  const isVr = walkInForm.device === 'PS VR2' || walkInForm.consoleId.startsWith('VR') || walkInForm.device.toLowerCase().includes('vr');
  const isSinglePlayerDevice = isRacingSim || isVr;
  const maxAllowedPlayers = isSinglePlayerDevice ? 1 : 4;
  const singlePlayerTooltip = isRacingSim ? "Racing Simulator supports only 1 player." : isVr ? "PS VR2 supports only 1 player." : "This gaming device supports only one player.";

  const filteredHistory = history.filter(item => {
    const matchesSearch = 
      (item.leaderName && item.leaderName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.id && item.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.device && item.device.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'ALL' || item.sessionStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const pageSize = 5;
  const totalPages = Math.ceil(filteredHistory.length / pageSize) || 1;
  const paginatedHistory = filteredHistory.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isSelectedStationAvailable = stations.find(s => s.id === walkInForm.consoleId)?.status === 'AVAILABLE';

  const isScheduled = (() => {
    if (!walkInForm.manualStartEnabled) return false;
    const now = new Date();
    let hours = parseInt(walkInForm.manualHour, 10);
    if (walkInForm.manualAmPm === 'PM' && hours < 12) hours += 12;
    if (walkInForm.manualAmPm === 'AM' && hours === 12) hours = 0;
    const manualDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, parseInt(walkInForm.manualMinute, 10), 0, 0);
    return manualDate > now;
  })();
  
  const scheduledTimeStr = isScheduled ? `${walkInForm.manualHour}:${walkInForm.manualMinute} ${walkInForm.manualAmPm}` : '';

  return (
    <div className="space-y-4 font-sans text-gray-100 min-h-0 flex-1 flex flex-col custom-scrollbar overflow-y-auto pr-1">
      
      {/* SECTION 1: CREATE NEW WALK-IN SESSION FORM */}
      <div className="glass-panel p-4 xl:p-5 rounded-2xl border border-white/10 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
          <div>
            <h2 className="font-cyber text-base xl:text-lg font-bold text-white tracking-wider flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" /> Create New Walk-in Session
            </h2>
            <p className="text-xs text-gray-400">Automatic Station Assignment & Day-Based Pricing</p>
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {tierInfo.dayName && (
              <div className="flex items-center gap-4 text-right font-mono text-xs text-gray-300">
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest text-left">Current Time</span>
                  <div>
                    <span className="font-bold text-white font-cyber">{tierInfo.dayName}</span>
                    <span className="text-gray-400">, {tierInfo.dateStr}</span>
                    <span className="text-cyan-400 font-bold ml-1">{tierInfo.timeStr}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 border-l border-white/10 pl-4">
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest">Manual Start</span>
                    <button 
                      type="button"
                      onClick={handleToggleManualStart}
                      className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold transition-colors w-min ${
                        walkInForm.manualStartEnabled 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                          : 'bg-gray-800 text-gray-400 border border-gray-600'
                      }`}
                    >
                      {walkInForm.manualStartEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  
                  {walkInForm.manualStartEnabled && (
                    <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                      <select 
                        value={walkInForm.manualHour}
                        onChange={(e) => setWalkInForm({...walkInForm, manualHour: e.target.value})}
                        className="bg-black/50 border border-white/20 rounded px-1.5 py-0.5 text-amber-300 font-bold text-xs outline-none cursor-pointer text-center"
                      >
                        {Array.from({length: 12}, (_, i) => i + 1).map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <span className="text-gray-500 font-bold">:</span>
                      <select 
                        value={walkInForm.manualMinute}
                        onChange={(e) => setWalkInForm({...walkInForm, manualMinute: e.target.value})}
                        className="bg-black/50 border border-white/20 rounded px-1.5 py-0.5 text-amber-300 font-bold text-xs outline-none cursor-pointer text-center"
                      >
                        {Array.from({length: 60}, (_, i) => i.toString().padStart(2, '0')).map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select 
                        value={walkInForm.manualAmPm}
                        onChange={(e) => setWalkInForm({...walkInForm, manualAmPm: e.target.value})}
                        className="bg-black/50 border border-white/20 rounded px-1.5 py-0.5 text-amber-300 font-bold text-xs outline-none cursor-pointer text-center ml-0.5"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
            <span className={`px-3 py-1 rounded-xl border text-xs font-cyber font-bold flex items-center gap-1.5 shadow-md ${
              tierInfo.isWeekend 
                ? 'bg-purple-950/80 border-purple-500/60 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                : 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            }`}>
              {tierInfo.isWeekend ? '🟣 WEEKEND PRICING' : '🟢 WEEKDAY PRICING'}
            </span>
          </div>
        </div>

        {validationError && (
          <div className="p-3 rounded-xl bg-red-950/90 border border-red-500 text-red-200 text-xs font-cyber font-bold flex items-center gap-2 animate-in fade-in duration-200 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            {validationError}
          </div>
        )}
        
        {isScheduled && !validationError && (
          <div className="p-3 rounded-xl bg-blue-950/90 border border-blue-500 text-blue-200 text-xs font-cyber font-bold flex items-center gap-2 animate-in fade-in duration-200 shadow-[0_0_15px_rgba(59,130,246,0.4)]">
            <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/40 mr-1 uppercase text-[10px]">Scheduled</span>
            Starts at {scheduledTimeStr}
          </div>
        )}

        <form onSubmit={handleStartSessionSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1">Group Leader Name *</label>
              <input
                type="text"
                value={walkInForm.groupLeader}
                onChange={(e) => {
                  setValidationError('');
                  setWalkInForm({ ...walkInForm, groupLeader: e.target.value });
                }}
                placeholder="Enter leader name"
                className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 focus:border-[#9333EA] text-xs text-white outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1">Mobile Number (Optional)</label>
              <input
                type="text"
                value={walkInForm.mobile}
                onChange={(e) => setWalkInForm({ ...walkInForm, mobile: e.target.value })}
                placeholder="+91 9344176534"
                className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 focus:border-[#9333EA] text-xs text-white outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1">Select Gaming Device</label>
              <select
                value={walkInForm.device}
                onChange={(e) => handleDeviceTypeChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 focus:border-[#9333EA] text-xs text-white outline-none appearance-none cursor-pointer font-medium"
              >
                {Array.from(new Set(stations.map(s => s.zone || s.category))).filter(Boolean).map(zoneName => {
                  const matching = stations.filter(s => (s.zone || s.category) === zoneName);
                  const names = matching.map(s => s.name).join(', ');
                  return (
                    <option key={zoneName} value={zoneName}>
                      {zoneName} ({names})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1">Assigned Station Console</label>
              <select
                value={walkInForm.consoleId}
                onChange={(e) => handleConsoleChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 focus:border-[#9333EA] text-xs text-white outline-none appearance-none cursor-pointer font-medium"
              >
                {stations.map(s => {
                  const isNotAvailable = s.status !== 'AVAILABLE';
                  let statusLabel = s.status;
                  if (s.status === 'RUNNING' || s.status === 'ACTIVE' || s.status === 'ENDING_SOON') statusLabel = 'Already Running';
                  else if (s.status === 'MAINTENANCE') statusLabel = 'Under Maintenance';
                  else if (s.status === 'RESERVED') statusLabel = 'Reserved';

                  return (
                    <option key={s.id} value={s.id} disabled={isNotAvailable}>
                      {s.name} ({s.zone}) — {statusLabel}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* PAYMENT STATUS & CONDITIONAL PAYMENT METHOD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-xl bg-[#090C19] border border-purple-500/20">
            <div>
              <label className="text-xs font-cyber font-bold text-gray-300 block mb-1">
                Payment Status *
              </label>
              <div className="flex gap-2">
                {['Pay at Checkout', 'Prepaid'].map(statusOpt => {
                  const isSelected = walkInForm.paymentStatus === statusOpt;
                  return (
                    <button
                      type="button"
                      key={statusOpt}
                      onClick={() => setWalkInForm(prev => ({ ...prev, paymentStatus: statusOpt }))}
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

            {walkInForm.paymentStatus === 'Prepaid' && (
              <div className="animate-in fade-in zoom-in-95 duration-200 space-y-2">
                <label className="text-xs font-cyber font-bold text-gray-300 block mb-1">
                  Payment Method *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Cash', 'UPI', 'Debit Card', 'Split Payment'].map(methodOpt => {
                    const isSelected = walkInForm.paymentMethod === methodOpt || (methodOpt === 'Split Payment' && walkInForm.paymentMethod === 'Split');
                    return (
                      <button
                        type="button"
                        key={methodOpt}
                        onClick={() => setWalkInForm(prev => ({ 
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
                {(walkInForm.paymentMethod === 'Split' || walkInForm.paymentMethod === 'Split Payment') && (() => {
                  const billAmt = Number(estimatedTotal) || 0;
                  const cashVal = Number(walkInForm.splitBreakdown?.cash || 0);
                  const upiVal = Number(walkInForm.splitBreakdown?.upi || 0);
                  const cardVal = Number(walkInForm.splitBreakdown?.card || 0);
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
                            value={walkInForm.splitBreakdown?.cash ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWalkInForm(prev => ({
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
                            value={walkInForm.splitBreakdown?.upi ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWalkInForm(prev => ({
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
                            value={walkInForm.splitBreakdown?.card ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWalkInForm(prev => ({
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* DYNAMIC PLAYER CAPACITY BUTTONS */}
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
                      title={isDisabled ? singlePlayerTooltip : `Select ${num} Player(s)`}
                      onClick={() => {
                        if (!isDisabled) {
                          setWalkInForm(prev => ({ ...prev, numPlayers: num }));
                        }
                      }}
                      className={`flex-1 py-2 rounded-xl border text-xs font-cyber font-bold transition-all ${
                        isDisabled
                          ? 'bg-black/40 border-white/5 text-gray-600 cursor-not-allowed opacity-40'
                          : walkInForm.numPlayers === num
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

            {/* DYNAMIC DURATION BUTTONS LOADED FROM DEVICE MAPPING */}
            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1">
                Duration <span className="text-[10px] text-purple-400 font-mono">({walkInForm.device})</span>
              </label>
              <div className="flex gap-2">
                {availableDurations.map((dur) => (
                  <button
                    type="button"
                    key={dur.minutes}
                    onClick={() => handleDurationSelect(dur)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-cyber font-bold transition-all cursor-pointer ${
                      walkInForm.durationMinutes === dur.minutes
                        ? 'bg-purple-900/60 border-purple-500 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)]'
                        : 'bg-[#0F1219] border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>

            {/* PRICE / MANUAL AMOUNT DISPLAY & TOGGLE */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-gray-400">
                  {isManualPricingMode ? 'Manual Final Amount (₹)' : 'Price Per Player (₹)'}
                </label>
                <button
                  type="button"
                  onClick={handleToggleManualMode}
                  className={`text-[10px] font-cyber font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
                    isManualPricingMode
                      ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                      : 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  }`}
                >
                  {isManualPricingMode ? '✏️ Manual Rate (ON)' : '⚡ Auto Rate (ON)'}
                </button>
              </div>

              {isManualPricingMode ? (
                <div className="w-full px-3 py-1.5 rounded-xl border border-amber-500/50 bg-[#0F1219] text-xs font-mono font-bold text-amber-300 flex items-center justify-between shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                  <div className="flex items-center gap-1 w-full">
                    <span className="text-amber-400 font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={walkInForm.manualAmount}
                      onChange={(e) => setWalkInForm({ ...walkInForm, manualAmount: e.target.value })}
                      placeholder="Enter final amount"
                      className="w-full bg-transparent text-amber-300 font-mono font-bold text-sm outline-none"
                    />
                  </div>
                  <span className="text-[9px] text-amber-400/80 font-sans font-normal shrink-0 ml-1">Manual Bill</span>
                </div>
              ) : (
                <div className="w-full px-3 py-2 rounded-xl border border-purple-500/40 bg-[#0F1219] text-xs font-mono font-bold text-amber-300 flex items-center justify-between shadow-[0_0_10px_rgba(147,51,234,0.2)]">
                  <span>₹ {currentHourlyPrice}</span>
                  <span className="text-[10px] text-gray-500 font-sans font-normal">Pricing Settings</span>
                </div>
              )}
            </div>
          </div>

          {/* LIVE SUMMARY WIDGET BOX */}
          <div className="p-3.5 rounded-xl bg-[#090C19] border border-white/10 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-sans">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-cyber block">Selected Console</span>
              <span className="font-cyber font-bold text-white tracking-wide">{walkInForm.device} ({walkInForm.consoleId})</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-cyber block">Duration & Rigs</span>
              <span className="font-mono text-purple-300 font-bold">{walkInForm.durationLabel} × {walkInForm.numPlayers} Rigs</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-cyber block">Rate Mode</span>
              <span className="font-mono text-amber-300 font-bold">
                {isManualPricingMode ? (
                  <span className="text-amber-400 font-cyber">✏️ Manual Rate</span>
                ) : (
                  <>₹ {currentHourlyPrice} <span className="text-[9px] text-emerald-400 font-normal">(Pricing Settings)</span></>
                )}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-cyber block">
                {isManualPricingMode ? 'Manual Final Bill' : 'Estimated Total'}
              </span>
              <span className="font-mono text-base font-extrabold text-emerald-400">₹ {estimatedTotal}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="text-xs text-gray-400 font-mono">
              Station Availability: <strong className={isSelectedStationAvailable ? 'text-emerald-400' : 'text-red-400'}>
                {isSelectedStationAvailable ? 'AVAILABLE' : 'OCCUPIED / BUSY'}
              </strong>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-sans text-gray-300 font-medium transition-colors cursor-pointer"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={(() => {
                  if (!isSelectedStationAvailable) return true;
                  const isPrepaid = walkInForm.paymentStatus === 'Prepaid';
                  const isSplit = isPrepaid && (walkInForm.paymentMethod === 'Split' || walkInForm.paymentMethod === 'Split Payment');
                  if (isSplit) {
                    const billAmt = Number(estimatedTotal) || 0;
                    const cashVal = Number(walkInForm.splitBreakdown?.cash || 0);
                    const upiVal = Number(walkInForm.splitBreakdown?.upi || 0);
                    const cardVal = Number(walkInForm.splitBreakdown?.card || 0);
                    return (cashVal + upiVal + cardVal) !== billAmt;
                  }
                  return false;
                })()}
                className={`px-6 py-2.5 rounded-xl text-xs font-cyber font-bold text-white uppercase tracking-wider transition-all ${
                  (!isSelectedStationAvailable || (() => {
                    const isPrepaid = walkInForm.paymentStatus === 'Prepaid';
                    const isSplit = isPrepaid && (walkInForm.paymentMethod === 'Split' || walkInForm.paymentMethod === 'Split Payment');
                    if (isSplit) {
                      const billAmt = Number(estimatedTotal) || 0;
                      const cashVal = Number(walkInForm.splitBreakdown?.cash || 0);
                      const upiVal = Number(walkInForm.splitBreakdown?.upi || 0);
                      const cardVal = Number(walkInForm.splitBreakdown?.card || 0);
                      return (cashVal + upiVal + cardVal) !== billAmt;
                    }
                    return false;
                  })())
                    ? 'bg-gray-800 text-gray-500 border border-white/10 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-[#7E22CE] to-[#6B21A8] hover:from-[#9333EA] hover:to-[#7E22CE] shadow-[0_0_15px_rgba(147,51,234,0.4)] cursor-pointer'
                }`}
              >
                Start Session
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* SECTION 2: TODAY'S WALK-IN SESSIONS HISTORY TABLE */}
      <div className="glass-panel p-4 xl:p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h3 className="font-cyber text-base font-bold text-white uppercase tracking-wider">
              Today's Walk-in Sessions History
            </h3>
            <p className="text-xs text-gray-400">Complete audit log of today's completed and active walk-in registrations</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-white outline-none focus:border-purple-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="py-1.5 px-3 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-gray-300 outline-none focus:border-purple-500"
            >
              <option value="ALL">All Status</option>
              <option value="RUNNING">Active / Running</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 font-cyber text-[11px] uppercase tracking-wider bg-white/[0.02]">
                <th className="py-2.5 px-3">Session ID</th>
                <th className="py-2.5 px-3">Group Leader</th>
                <th className="py-2.5 px-3">Device</th>
                <th className="py-2.5 px-3">Players</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Rate / Plr</th>
                <th className="py-2.5 px-3">Total Billed</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3">Start Time</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedHistory.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-8 text-center text-gray-500 font-mono text-xs">
                    No walk-in sessions recorded for today.
                  </td>
                </tr>
              ) : (
                paginatedHistory.map((row) => (
                  <tr key={row.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-mono text-purple-300 font-bold">{row.id}</td>
                    <td className="py-3 px-3 font-medium">{row.leaderName}</td>
                    <td className="py-3 px-3 font-mono text-gray-300">{row.device}</td>
                    <td className="py-3 px-3 font-mono">{row.players}</td>
                    <td className="py-3 px-3 font-mono">{row.duration}</td>
                    <td className="py-3 px-3 font-mono text-amber-300">₹ {row.pricePerPlayer || 100}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">₹ {row.totalAmount}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-cyber font-bold border ${
                        row.paymentMethod === 'UPI'
                          ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                          : row.paymentMethod === 'Debit Card'
                          ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                          : row.paymentMethod === 'Credit Card'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                          : (row.paymentMethod === 'Split' || row.paymentMethod === 'Split Payment')
                          ? 'bg-fuchsia-950/60 text-fuchsia-300 border-fuchsia-500/40 shadow-[0_0_10px_rgba(217,70,239,0.3)]'
                          : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                      }`}>
                        {(row.paymentMethod === 'Split' || row.paymentMethod === 'Split Payment') ? 'Split Payment' : (row.paymentMethod || 'Cash')}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-400">{row.startTime}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-cyber font-bold border ${
                        row.sessionStatus === 'RUNNING'
                          ? 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                          : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {row.sessionStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => setViewInvoice(row)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setViewInvoice(row)}
                          className="p-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 transition-colors cursor-pointer"
                          title="Print Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteHistory(row.id)}
                          className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-gray-400">
            <span>Showing Page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg bg-white/5 disabled:opacity-30 hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 rounded-lg bg-white/5 disabled:opacity-30 hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* VIEW / PRINT INVOICE MODAL */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm glass-panel bg-[#0C0A1D]/95 border border-purple-500/40 rounded-2xl p-5 relative shadow-[0_0_50px_rgba(147,51,234,0.3)] space-y-4 font-sans text-gray-100">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-cyber text-sm font-bold text-white uppercase tracking-wider">
                Session Receipt: <span className="text-purple-400">{viewInvoice.id}</span>
              </h3>
              <button onClick={() => setViewInvoice(null)} className="p-1 rounded-full hover:bg-white/10 text-gray-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-sans">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Group Leader:</span>
                <span className="text-white font-bold">{viewInvoice.leaderName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Device Assigned:</span>
                <span className="text-purple-300 font-mono font-bold">{viewInvoice.device}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Players Count:</span>
                <span className="text-white font-mono">{viewInvoice.players}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Duration:</span>
                <span className="text-white font-mono">{viewInvoice.duration}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Price / Player:</span>
                <span className="text-amber-300 font-mono">₹ {viewInvoice.pricePerPlayer || 100}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Start / End Time:</span>
                <span className="text-gray-300 font-mono">{viewInvoice.startTime} - {viewInvoice.endTime}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Payment Method:</span>
                <span className="text-purple-300 font-bold">
                  {(viewInvoice.paymentMethod === 'Split' || viewInvoice.paymentMethod === 'Split Payment') ? 'Split Payment' : (viewInvoice.paymentMethod || 'Cash')}
                </span>
              </div>
              {(viewInvoice.paymentMethod === 'Split' || viewInvoice.paymentMethod === 'Split Payment' || viewInvoice.splitBreakdown || viewInvoice.pricing_snapshot?.splitBreakdown) && (() => {
                const split = viewInvoice.splitBreakdown || viewInvoice.pricing_snapshot?.splitBreakdown || {};
                const c = Number(split.cash ?? viewInvoice.cash_amount ?? viewInvoice.pricing_snapshot?.cashAmount ?? 0);
                const u = Number(split.upi ?? viewInvoice.upi_amount ?? viewInvoice.pricing_snapshot?.upiAmount ?? 0);
                const d = Number(split.card ?? split.debitCard ?? viewInvoice.card_amount ?? viewInvoice.pricing_snapshot?.cardAmount ?? 0);
                return (
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono space-y-1">
                    <span className="text-[10px] uppercase font-cyber text-purple-300 block">Split Details:</span>
                    <div className="flex justify-between text-emerald-400"><span>Cash:</span><span>₹{c}</span></div>
                    <div className="flex justify-between text-cyan-400"><span>UPI:</span><span>₹{u}</span></div>
                    <div className="flex justify-between text-blue-400"><span>Debit Card:</span><span>₹{d}</span></div>
                  </div>
                );
              })()}
              <div className="flex justify-between py-1.5 text-sm font-bold bg-white/5 px-2 rounded-lg mt-2">
                <span className="text-gray-300">Total Billed:</span>
                <span className="text-emerald-400 font-mono">₹ {viewInvoice.totalAmount}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button 
                onClick={() => window.print()} 
                className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-cyber font-bold text-white uppercase flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Invoice
              </button>
              <button 
                onClick={() => setViewInvoice(null)} 
                className="py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-sans text-gray-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
