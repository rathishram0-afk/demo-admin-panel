import React, { useState, useEffect } from 'react';
import { sessionService } from '../../../services/sessionService';
import { useRealtime } from '../../../context/RealtimeContext';
import { 
  Gamepad2, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Minus, 
  Wrench, 
  ShieldAlert, 
  X,
  Sparkles,
  Info
} from 'lucide-react';

export default function PlayersControllersModule() {
  const [stations, setStations] = useState([]);
  const [metrics, setMetrics] = useState({
    totalControllers: 20,
    controllersInUse: 0,
    availableControllers: 20,
    maintenanceControllers: 0,
    brokenControllers: 0,
    reservedControllers: 0
  });

  // Modal States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [maintModalOpen, setMaintModalOpen] = useState(false);

  const [addQty, setAddQty] = useState(4);
  const [removeQty, setRemoveQty] = useState(1);
  const [maintForm, setMaintForm] = useState({ maintenance: 0, broken: 0, reserved: 0 });
  const [errorMsg, setErrorMsg] = useState('');

  const { devices, activeSessions } = useRealtime();

  const loadData = () => {
    try {
      const st = sessionService.mapStations(devices, activeSessions);
      setStations(Array.isArray(st) ? st : []);
      const ctrl = sessionService.mapControllerMetrics(st);
      setMetrics(ctrl);
    } catch (e) {
      console.error('Failed to load controller data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [devices, activeSessions]);

  const handleConfirmAdd = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await sessionService.addControllers(addQty);
      setAddModalOpen(false);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add controllers.');
    }
  };

  const handleConfirmRemove = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await sessionService.removeControllers(removeQty);
      setRemoveModalOpen(false);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to remove controllers.');
    }
  };

  const handleConfirmMaint = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await sessionService.updateControllerHardwareStatus({
        maintenance: maintForm.maintenance,
        broken: maintForm.broken,
        reserved: maintForm.reserved
      });
      setMaintModalOpen(false);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update hardware status.');
    }
  };

  const openMaintModal = () => {
    setMaintForm({
      maintenance: metrics.maintenanceControllers || 0,
      broken: metrics.brokenControllers || 0,
      reserved: metrics.reservedControllers || 0
    });
    setErrorMsg('');
    setMaintModalOpen(true);
  };

  return (
    <div className="space-y-4 font-sans text-gray-100 min-h-0 flex-1 flex flex-col custom-scrollbar overflow-y-auto pr-1">
      
      {/* HEADER BAR */}
      <div className="glass-panel p-4 xl:p-5 rounded-2xl border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="font-cyber text-base xl:text-lg font-bold text-white tracking-wider flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-purple-400" /> CENTRAL CONTROLLER INVENTORY SYSTEM
          </h2>
          <p className="text-xs text-gray-400">Real-time hardware inventory tracking, player allocations, maintenance logs & purchase records</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setErrorMsg(''); setAddModalOpen(true); }}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-cyber font-bold text-xs uppercase flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" /> Add Controllers
          </button>

          <button
            onClick={() => { setErrorMsg(''); setRemoveModalOpen(true); }}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 font-cyber font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Minus className="w-4 h-4" /> Remove Idle
          </button>

          <button
            onClick={openMaintModal}
            className="px-3.5 py-2 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 font-cyber font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Wrench className="w-4 h-4" /> Maintenance Log
          </button>
        </div>
      </div>

      {/* CONTROLLER INVENTORY STATS PANEL */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Inventory */}
        <div className="glass-panel p-3.5 rounded-2xl border border-purple-500/30 bg-purple-950/20 text-center space-y-1">
          <span className="text-[10px] font-cyber text-gray-400 uppercase tracking-wider block">TOTAL OWNED</span>
          <span className="font-mono text-2xl font-black text-white">{metrics.totalControllers}</span>
          <span className="text-[10px] text-purple-300 font-mono block">Hardware Rigs</span>
        </div>

        {/* Controllers In Use */}
        <div className="glass-panel p-3.5 rounded-2xl border border-blue-500/30 bg-blue-950/20 text-center space-y-1">
          <span className="text-[10px] font-cyber text-gray-400 uppercase tracking-wider block">IN USE</span>
          <span className="font-mono text-2xl font-black text-blue-300">{metrics.controllersInUse}</span>
          <span className="text-[10px] text-blue-400 font-mono block">Allocated to Sessions</span>
        </div>

        {/* Available Controllers */}
        <div className="glass-panel p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 text-center space-y-1">
          <span className="text-[10px] font-cyber text-gray-400 uppercase tracking-wider block">AVAILABLE</span>
          <span className="font-mono text-2xl font-black text-emerald-400">{metrics.availableControllers}</span>
          <span className="text-[10px] text-emerald-300 font-mono block">Ready for Walk-ins</span>
        </div>

        {/* Maintenance */}
        <div className="glass-panel p-3.5 rounded-2xl border border-amber-500/30 bg-amber-950/20 text-center space-y-1">
          <span className="text-[10px] font-cyber text-gray-400 uppercase tracking-wider block">MAINTENANCE</span>
          <span className="font-mono text-2xl font-black text-amber-300">{metrics.maintenanceControllers}</span>
          <span className="text-[10px] text-amber-400 font-mono block">Under Service</span>
        </div>

        {/* Broken */}
        <div className="glass-panel p-3.5 rounded-2xl border border-red-500/30 bg-red-950/20 text-center space-y-1">
          <span className="text-[10px] font-cyber text-gray-400 uppercase tracking-wider block">BROKEN</span>
          <span className="font-mono text-2xl font-black text-red-400">{metrics.brokenControllers}</span>
          <span className="text-[10px] text-red-300 font-mono block">Out of Order</span>
        </div>

        {/* Reserved */}
        <div className="glass-panel p-3.5 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 text-center space-y-1">
          <span className="text-[10px] font-cyber text-gray-400 uppercase tracking-wider block">RESERVED</span>
          <span className="font-mono text-2xl font-black text-cyan-300">{metrics.reservedControllers}</span>
          <span className="text-[10px] text-cyan-400 font-mono block">Held for Bookings</span>
        </div>
      </div>

      {/* STATIONS CONTROLLER ALLOCATION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
        {stations.map(st => {
          const isRunning = st.status === 'RUNNING' || st.status === 'ACTIVE' || st.status === 'ENDING_SOON';
          const isMaintenance = st.status === 'MAINTENANCE';

          return (
            <div 
              key={st.id} 
              className={`glass-panel p-4 rounded-2xl border transition-all space-y-3 shadow-xl ${
                isRunning
                  ? 'border-purple-500/50 bg-purple-950/20 shadow-[0_0_15px_rgba(147,51,234,0.2)]'
                  : isMaintenance
                  ? 'border-red-500/50 bg-red-950/20'
                  : 'border-white/10 hover:border-purple-500/30'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div>
                  <h3 className="font-cyber text-sm font-bold text-white tracking-wider">{st.name}</h3>
                  <span className="text-[10px] font-mono text-gray-400">{st.zone || st.category}</span>
                </div>

                <span className={`px-2.5 py-0.5 rounded text-[9px] font-cyber font-bold uppercase border ${
                  isRunning
                    ? 'bg-purple-950/90 text-purple-300 border-purple-500/50 animate-pulse'
                    : isMaintenance
                    ? 'bg-red-950/90 text-red-300 border-red-500/50'
                    : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                }`}>
                  {st.status}
                </span>
              </div>

              {/* Roster & Session Info */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-gray-400">
                  <span>Customer Name:</span>
                  <span className="text-white font-bold truncate max-w-[120px]">{st.customerName || 'None'}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Players Count:</span>
                  <span className="text-cyan-300 font-bold">{st.playersCount || 0} / {st.maxPlayers || st.controllersTotal || 4} Players</span>
                </div>
              </div>

              {/* Visual Controller Rig Slots */}
              {(() => {
                const zoneStr = `${st.zone || ''} ${st.category || ''} ${st.id || ''}`.toLowerCase();
                const isVR = zoneStr.includes('vr');
                const isSim = zoneStr.includes('sim') || zoneStr.includes('racing');

                return (
                  <div className="p-3 rounded-xl bg-slate-950 border border-white/5 space-y-2">
                    <div className="flex justify-between items-center text-xs font-cyber">
                      <span className="text-gray-400">Controllers Assigned</span>
                      {isVR ? (
                        <span className="text-purple-300 font-bold text-[11px]">🥽 VR Motion Controllers</span>
                      ) : isSim ? (
                        <span className="text-cyan-300 font-bold text-[11px]">🏎 Wheel & Pedals Rig</span>
                      ) : (
                        <span className="text-emerald-400 font-mono font-bold">{st.controllersUsed || 0} / {st.controllersTotal || 4} 🎮</span>
                      )}
                    </div>

                    {isVR ? (
                      <div className="text-[11px] font-mono text-purple-300/80 bg-purple-950/30 p-2 rounded-lg border border-purple-500/20">
                        Dedicated VR Motion Sense controllers (0 PS controllers used).
                      </div>
                    ) : isSim ? (
                      <div className="text-[11px] font-mono text-cyan-300/80 bg-cyan-950/30 p-2 rounded-lg border border-cyan-500/20">
                        Dedicated Steering Wheel & Pedals (0 PS controllers used).
                      </div>
                    ) : (
                      <div className="flex gap-2 text-2xl items-center">
                        {[...Array(st.controllersTotal || 4)].map((_, i) => {
                          const isAssigned = i < (st.controllersUsed || 0);
                          return (
                            <span 
                              key={i} 
                              className={`transition-all duration-300 ${
                                isAssigned 
                                  ? 'text-emerald-400 filter drop-shadow-[0_0_10px_rgba(16,185,129,0.8)] scale-110' 
                                  : 'text-gray-700 opacity-40'
                              }`}
                            >
                              🎮
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          );
        })}
      </div>

      {/* ADD CONTROLLERS MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel bg-[#0C0A1D]/95 border border-purple-500/50 rounded-3xl p-5 relative shadow-2xl space-y-4 font-sans text-gray-100">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-cyber text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" /> Purchase / Add New Controllers
              </h3>
              <button onClick={() => setAddModalOpen(false)} className="p-1 rounded-full hover:bg-white/10 text-gray-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-bold">
                ⚠ {errorMsg}
              </div>
            )}

            <form onSubmit={handleConfirmAdd} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-cyber font-bold text-[10px] uppercase mb-1">
                  QUANTITY TO ADD *
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={addQty}
                  onChange={(e) => setAddQty(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/15 text-white font-mono text-sm outline-none focus:border-purple-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 text-[11px] font-mono">
                Current Total: <strong>{metrics.totalControllers}</strong> $\rightarrow$ New Total: <strong>{metrics.totalControllers + (parseInt(addQty, 10) || 0)}</strong> Rigs
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 font-cyber font-bold text-xs text-white uppercase shadow-md cursor-pointer"
                >
                  Add Controllers
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REMOVE CONTROLLERS MODAL */}
      {removeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel bg-[#0C0A1D]/95 border border-red-500/50 rounded-3xl p-5 relative shadow-2xl space-y-4 font-sans text-gray-100">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-cyber text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Minus className="w-4 h-4 text-red-400" /> Remove Idle Controllers
              </h3>
              <button onClick={() => setRemoveModalOpen(false)} className="p-1 rounded-full hover:bg-white/10 text-gray-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-bold">
                ⚠ {errorMsg}
              </div>
            )}

            <form onSubmit={handleConfirmRemove} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-cyber font-bold text-[10px] uppercase mb-1">
                  QUANTITY TO REMOVE *
                </label>
                <input
                  type="number"
                  min="1"
                  max={metrics.availableControllers || 1}
                  required
                  value={removeQty}
                  onChange={(e) => setRemoveQty(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/15 text-white font-mono text-sm outline-none focus:border-red-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-[11px] font-mono">
                Available Idle Controllers: <strong>{metrics.availableControllers}</strong>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setRemoveModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 font-cyber font-bold text-xs text-white uppercase shadow-md cursor-pointer"
                >
                  Remove Controllers
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HARDWARE MAINTENANCE LOG MODAL */}
      {maintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel bg-[#0C0A1D]/95 border border-amber-500/50 rounded-3xl p-5 relative shadow-2xl space-y-4 font-sans text-gray-100">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-cyber text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" /> Controller Hardware Status
              </h3>
              <button onClick={() => setMaintModalOpen(false)} className="p-1 rounded-full hover:bg-white/10 text-gray-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-bold">
                ⚠ {errorMsg}
              </div>
            )}

            <form onSubmit={handleConfirmMaint} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-amber-300 font-cyber font-bold text-[10px] uppercase mb-1">
                    MAINTENANCE
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maintForm.maintenance}
                    onChange={(e) => setMaintForm({ ...maintForm, maintenance: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-white/15 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-red-300 font-cyber font-bold text-[10px] uppercase mb-1">
                    BROKEN
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maintForm.broken}
                    onChange={(e) => setMaintForm({ ...maintForm, broken: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-white/15 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-cyan-300 font-cyber font-bold text-[10px] uppercase mb-1">
                    RESERVED
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maintForm.reserved}
                    onChange={(e) => setMaintForm({ ...maintForm, reserved: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-white/15 text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setMaintModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 font-cyber font-bold text-xs text-white uppercase shadow-md cursor-pointer"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
