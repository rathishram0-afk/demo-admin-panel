import React, { useState, useEffect } from 'react';
import { sessionService } from '../../../services/sessionService';
import { useRealtime } from '../../../context/RealtimeContext';
import AddEditDeviceModal from './AddEditDeviceModal';
import { 
  Tv, 
  Plus, 
  Edit2, 
  Trash2, 
  Settings, 
  Check, 
  X, 
  Gamepad2, 
  Users, 
  Wrench, 
  Search,
  Filter,
  Copy,
  AlertTriangle,
  Clock,
  Sparkles
} from 'lucide-react';

const deviceImages = {
  'PlayStation 5': "/admin/ps5-admin.webp",
  'PlayStation 4': "/admin/ps4-admin.webp",
  'PlayStation 2': "/admin/ps2-admin.webp",
  'Racing Simulator': "/admin/sim1-admin.webp",
  'PS VR2': "/admin/vr-admin.webp"
};

const getStationImage = (st) => {
  if (st.image && !st.image.startsWith('/admin')) return st.image;
  if (st.id.startsWith('PS5') || (st.zone && st.zone.includes('5'))) return deviceImages['PlayStation 5'];
  if (st.id.startsWith('PS4') || (st.zone && st.zone.includes('4'))) return deviceImages['PlayStation 4'];
  if (st.id.startsWith('PS2') || (st.zone && st.zone.includes('2'))) return deviceImages['PlayStation 2'];
  if (st.id.startsWith('SIM') || (st.zone && st.zone.includes('Sim'))) return deviceImages['Racing Simulator'];
  if (st.id.startsWith('VR') || (st.zone && st.zone.includes('VR'))) return deviceImages['PS VR2'];
  return st.image || deviceImages['PlayStation 5'];
};

export default function DevicesModule() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST'); // NEWEST, OLDEST, ALPHABETICAL, RUNNING, AVAILABLE

  // Modals state
  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [selectedDeviceForEdit, setSelectedDeviceForEdit] = useState(null);
  const [deleteConfirmState, setDeleteConfirmState] = useState({ isOpen: false, device: null, error: '' });

  const { devices, activeSessions } = useRealtime();
  const [now, setNow] = useState(Date.now());

  const loadData = async () => {
    try {
      const data = sessionService.mapStations(devices, activeSessions);
      setStations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load stations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [devices, activeSessions, now]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenAdd = () => {
    setSelectedDeviceForEdit(null);
    setAddEditModalOpen(true);
  };

  const handleOpenEdit = (st) => {
    setSelectedDeviceForEdit(st);
    setAddEditModalOpen(true);
  };

  const handleDuplicate = async (st) => {
    try {
      await sessionService.duplicateDevice(st.id);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to duplicate device.');
    }
  };

  const toggleMaintenance = async (stationId) => {
    try {
      await sessionService.toggleMaintenance(stationId);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to toggle maintenance.');
    }
  };

  const handleOpenDelete = (st) => {
    if (st.status === 'RUNNING' || st.status === 'ACTIVE' || st.status === 'ENDING_SOON') {
      setDeleteConfirmState({
        isOpen: true,
        device: st,
        error: 'This device currently has an active session.'
      });
    } else {
      setDeleteConfirmState({
        isOpen: true,
        device: st,
        error: ''
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmState.device) return;
    try {
      await sessionService.deleteDevice(deleteConfirmState.device.id);
      setDeleteConfirmState({ isOpen: false, device: null, error: '' });
      await loadData();
    } catch (err) {
      setDeleteConfirmState(prev => ({ ...prev, error: err.message || 'Failed to delete device.' }));
    }
  };

  const formatTimer = (totalSeconds) => {
    if (!totalSeconds || totalSeconds < 0) return '00:00:00';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Controller Metrics Summary
  const totalControllers = stations.reduce((sum, s) => sum + (s.controllersTotal || 4), 0);
  const activeControllersInUse = stations.reduce((sum, s) => sum + (s.controllersUsed || 0), 0);
  const availableControllers = Math.max(0, totalControllers - activeControllersInUse);

  // Filter & Sort Logic
  const filteredStations = stations.filter(st => {
    const name = st.name || st.id || '';
    const zone = st.zone || st.category || '';
    const query = searchQuery.toLowerCase();

    const matchesSearch = name.toLowerCase().includes(query) || zone.toLowerCase().includes(query);
    if (!matchesSearch) return false;

    if (categoryFilter !== 'ALL' && !zone.toLowerCase().includes(categoryFilter.toLowerCase())) {
      return false;
    }

    if (statusFilter !== 'ALL') {
      if (statusFilter === 'RUNNING' && !(st.status === 'RUNNING' || st.status === 'ACTIVE' || st.status === 'ENDING_SOON')) return false;
      if (statusFilter === 'AVAILABLE' && st.status !== 'AVAILABLE') return false;
      if (statusFilter === 'RESERVED' && st.status !== 'RESERVED') return false;
      if (statusFilter === 'MAINTENANCE' && st.status !== 'MAINTENANCE') return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'NEWEST') return (b.createdAt || 0) - (a.createdAt || 0);
    if (sortBy === 'OLDEST') return (a.createdAt || 0) - (b.createdAt || 0);
    if (sortBy === 'ALPHABETICAL') return a.name.localeCompare(b.name);
    if (sortBy === 'RUNNING') {
      const aRun = a.status === 'RUNNING' || a.status === 'ACTIVE' ? 1 : 0;
      const bRun = b.status === 'RUNNING' || b.status === 'ACTIVE' ? 1 : 0;
      return bRun - aRun;
    }
    if (sortBy === 'AVAILABLE') {
      const aAvail = a.status === 'AVAILABLE' ? 1 : 0;
      const bAvail = b.status === 'AVAILABLE' ? 1 : 0;
      return bAvail - aAvail;
    }
    return 0;
  });

  return (
    <div className="space-y-4 font-sans text-gray-100 min-h-0 flex-1 flex flex-col custom-scrollbar overflow-y-auto pr-1">
      
      {/* HEADER BAR WITH CONTROLLER CHIPS & ADD DEVICE BUTTON */}
      <div className="glass-panel p-4 xl:p-5 rounded-2xl border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="font-cyber text-base xl:text-lg font-bold text-white tracking-wider flex items-center gap-2">
            <Tv className="w-5 h-5 text-purple-400" /> DYNAMIC DEVICE MANAGEMENT SYSTEM
          </h2>
          <p className="text-xs text-gray-400">Configure gaming consoles, simulators, VR stations, controller allocations & hourly pricing</p>
        </div>

        {/* Controller Summary Chips & Add Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-xs font-cyber font-bold flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-purple-400" />
            <span>Total Devices: <strong className="text-white">{stations.length}</strong></span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-blue-950/60 border border-blue-500/40 text-xs font-cyber font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>In Use: <strong className="text-blue-300">{activeControllersInUse}</strong></span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs font-cyber font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Available Rigs: <strong className="text-emerald-300">{availableControllers} / {totalControllers}</strong></span>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-cyber font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Device
          </button>
        </div>
      </div>

      {/* STICKY SEARCH & FILTER CONTROLS BAR */}
      <div className="sticky top-0 z-10 bg-[#0E0B24]/95 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search device name, zone..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-white/15 focus:border-purple-400 text-xs text-white placeholder-gray-500 outline-none transition-all"
          />
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
        </div>

        {/* Filters & Sorting */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-white/15 text-xs text-purple-300 font-cyber font-bold outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="PS5">PlayStation 5</option>
            <option value="PS4">PlayStation 4</option>
            <option value="PS2">PlayStation 2</option>
            <option value="Xbox">Xbox Series X</option>
            <option value="Nintendo">Nintendo Switch</option>
            <option value="VR">PS VR2</option>
            <option value="Simulator">Racing Simulator</option>
            <option value="PC">Gaming PC</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-white/15 text-xs text-emerald-300 font-cyber font-bold outline-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="RUNNING">Running / Occupied</option>
            <option value="RESERVED">Reserved</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-white/15 text-xs text-cyan-300 font-cyber font-bold outline-none cursor-pointer"
          >
            <option value="NEWEST">Sort: Newest</option>
            <option value="OLDEST">Sort: Oldest</option>
            <option value="ALPHABETICAL">Sort: A - Z</option>
            <option value="RUNNING">Sort: Running First</option>
            <option value="AVAILABLE">Sort: Available First</option>
          </select>
        </div>

      </div>

      {/* SCROLLABLE DEVICE GRID (Max Height Scrollable with Smooth Scroll) */}
      <div className="max-h-[calc(100vh-240px)] min-h-[500px] overflow-y-auto custom-scrollbar pr-1">
        {filteredStations.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl border border-white/10 text-center space-y-3">
            <Tv className="w-12 h-12 text-gray-600 mx-auto" />
            <h3 className="font-cyber text-base font-bold text-gray-300 uppercase tracking-wider">No Devices Found</h3>
            <p className="text-xs text-gray-500 font-mono">No gaming devices match your search query or selected filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
            {filteredStations.map((st) => {
              const isMaintenance = st.status === 'MAINTENANCE';
              const isRunning = st.status === 'RUNNING' || st.status === 'ACTIVE' || st.status === 'ENDING_SOON';
              const isReserved = st.status === 'RESERVED';

              return (
                <div 
                  key={st.id}
                  className={`glass-panel p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-3 relative overflow-hidden shadow-xl ${
                    isMaintenance 
                      ? 'border-red-500/50 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                      : isRunning
                      ? 'border-purple-500/50 bg-purple-950/20 shadow-[0_0_15px_rgba(147,51,234,0.2)]'
                      : isReserved
                      ? 'border-amber-500/50 bg-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'border-white/10 hover:border-purple-500/40'
                  }`}
                >
                  {/* Top Card Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-black/40 border border-white/10 p-1 flex items-center justify-center shrink-0">
                        <img 
                          src={getStationImage(st)} 
                          alt={st.name} 
                          className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_6px_rgba(255,255,255,0.2)]" loading="lazy" decoding="async" />
                      </div>
                      <div>
                        <h3 className="font-cyber text-sm font-bold text-white tracking-wider">{st.name}</h3>
                        <span className="text-[10px] font-mono text-gray-400 block">{st.zone || st.category}</span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded text-[9px] font-cyber font-bold uppercase border ${
                      isMaintenance 
                        ? 'bg-red-950/90 text-red-300 border-red-500/50' 
                        : isRunning
                        ? 'bg-purple-950/90 text-purple-300 border-purple-500/50 animate-pulse'
                        : isReserved
                        ? 'bg-amber-950/90 text-amber-300 border-amber-500/50'
                        : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                    }`}>
                      {st.status}
                    </span>
                  </div>

                  {/* Active Running Session Badge */}
                  {isRunning && (
                    <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-xs space-y-1 font-mono">
                      <div className="flex justify-between items-center text-gray-300">
                        <span>Customer:</span>
                        <span className="text-white font-bold truncate max-w-[100px]">{st.customerName || 'Player'}</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-300">
                        <span>Session ID:</span>
                        <span className="text-cyan-300 font-bold">{st.currentSessionId || 'SESSION-001'}</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-300 pt-1 border-t border-purple-500/30">
                        <span>Timer Remaining:</span>
                        <span className="text-amber-400 font-bold">{formatTimer(st.remainingSeconds)}</span>
                      </div>
                    </div>
                  )}

                  {/* Specs & Controllers Capacity */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono py-0.5">
                    <div className="p-2 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                      <span className="text-[9px] text-gray-400 uppercase font-cyber block flex items-center gap-1">
                        <Gamepad2 className="w-3 h-3 text-purple-400" /> Controllers
                      </span>
                      <span className="font-bold text-white text-[11px]">{st.controllersUsed || 0} / {st.controllersTotal || 4} Rigs</span>
                    </div>

                    <div className="p-2 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                      <span className="text-[9px] text-gray-400 uppercase font-cyber block flex items-center gap-1">
                        <Users className="w-3 h-3 text-emerald-400" /> Hourly Rate
                      </span>
                      <span className="font-bold text-emerald-400 font-cyber text-[11px]">₹ {st.hourlyPrice || 100}/hr</span>
                    </div>
                  </div>

                  {/* Device Action Buttons */}
                  <div className="pt-2 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-1 text-[10px] font-cyber font-bold">
                    <button
                      onClick={() => handleOpenEdit(st)}
                      className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      title="Edit Device Specs"
                    >
                      <Edit2 className="w-3 h-3 text-cyan-400" /> Edit
                    </button>

                    <button
                      onClick={() => handleDuplicate(st)}
                      className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      title="Duplicate Device"
                    >
                      <Copy className="w-3 h-3 text-purple-400" /> Copy
                    </button>

                    <button
                      onClick={() => toggleMaintenance(st.id)}
                      className={`py-1.5 rounded-lg border flex items-center justify-center gap-1 cursor-pointer transition-all ${
                        isMaintenance
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900'
                          : 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:bg-amber-900/60'
                      }`}
                      title={isMaintenance ? 'Enable Device' : 'Put Under Maintenance'}
                    >
                      <Wrench className="w-3 h-3" /> Maint
                    </button>

                    <button
                      onClick={() => handleOpenDelete(st)}
                      className="py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      title="Delete Device"
                    >
                      <Trash2 className="w-3 h-3" /> Del
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD / EDIT DEVICE MODAL */}
      <AddEditDeviceModal
        device={selectedDeviceForEdit}
        isOpen={addEditModalOpen}
        onClose={() => setAddEditModalOpen(false)}
        onSaved={loadData}
      />

      {/* DELETE DEVICE CONFIRMATION MODAL */}
      {deleteConfirmState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#18090E] border border-red-500/50 rounded-3xl p-6 relative shadow-[0_0_50px_rgba(239,68,68,0.35)] space-y-4 font-sans text-gray-100 text-center max-h-[90dvh] overflow-y-auto custom-scrollbar">
            <div className="w-12 h-12 rounded-2xl bg-red-950 border border-red-500/50 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-cyber text-base font-black text-white uppercase tracking-wider mb-1">
                Delete Device {deleteConfirmState.device?.name}?
              </h3>
              {deleteConfirmState.error ? (
                <p className="text-xs text-red-400 font-cyber font-bold bg-red-950/80 p-2.5 rounded-xl border border-red-500/50 mt-2">
                  ⚠ {deleteConfirmState.error}
                </p>
              ) : (
                <p className="text-xs text-gray-400 font-sans">
                  Are you sure you want to permanently delete station <strong className="text-white">{deleteConfirmState.device?.name}</strong> ({deleteConfirmState.device?.zone})?
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmState({ isOpen: false, device: null, error: '' })}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 font-cyber font-bold text-xs cursor-pointer"
              >
                {deleteConfirmState.error ? 'Close' : 'Cancel'}
              </button>

              {!deleteConfirmState.error && (
                <button
                  onClick={handleConfirmDelete}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-cyber font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.5)] cursor-pointer"
                >
                  Permanently Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
