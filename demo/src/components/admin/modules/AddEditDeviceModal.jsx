import React, { useState, useEffect, useRef } from 'react';
import { Tv, X, Plus, Edit2, AlertCircle, Gamepad2, Users, DollarSign, Image, Upload } from 'lucide-react';
import { sessionService } from '../../../services/sessionService';

const PRESET_IMAGES = [
  { label: 'PS5 Official', url: '/admin/ps5-admin.webp' },
  { label: 'PS4 Official', url: '/admin/ps4-admin.webp' },
  { label: 'PS2 Retro', url: '/admin/ps2-admin.webp' },
  { label: 'Racing Sim Rig', url: '/admin/sim1-admin.webp' },
  { label: 'PS VR2 Headset', url: '/admin/vr-admin.webp' }
];

// Helper to compress custom image uploads via Canvas-to-WebP
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/webp', 0.6));
      };
    };
  });
};

export default function AddEditDeviceModal({ device, isOpen, onClose, onSaved }) {
  const isEdit = Boolean(device);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    zone: 'PlayStation 5',
    status: 'AVAILABLE',
    maxPlayers: 4,
    controllersTotal: 4,
    hourlyPrice: 100,
    image: '/admin/ps5-admin.webp',
    notes: ''
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setIsSubmitting(false);
      if (device) {
        setForm({
          name: device.name || device.id || '',
          zone: device.zone || device.category || 'PlayStation 5',
          status: device.status || 'AVAILABLE',
          maxPlayers: device.maxPlayers || device.controllersTotal || 4,
          controllersTotal: device.controllersTotal || 4,
          hourlyPrice: device.hourlyPrice !== undefined ? device.hourlyPrice : 100,
          image: device.image || '/admin/ps5-admin.webp',
          notes: device.notes || ''
        });
      } else {
        setForm({
          name: '',
          zone: 'PlayStation 5',
          status: 'AVAILABLE',
          maxPlayers: 4,
          controllersTotal: 4,
          hourlyPrice: 100,
          image: '/admin/ps5-admin.webp',
          notes: ''
        });
      }
    }
  }, [isOpen, device]);

  if (!isOpen) return null;

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setForm(prev => ({ ...prev, image: compressed }));
      } catch (err) {
        setErrorMsg('Failed to process uploaded image.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const rawName = form.name.trim();
    if (!rawName) {
      setErrorMsg('Device Name cannot be empty.');
      return;
    }

    const price = Number(form.hourlyPrice);
    if (isNaN(price) || price < 0) {
      setErrorMsg('Please enter a valid non-negative hourly price.');
      return;
    }

    const maxP = parseInt(form.maxPlayers, 10);
    if (isNaN(maxP) || maxP <= 0) {
      setErrorMsg('Maximum players must be at least 1.');
      return;
    }

    const ctrl = parseInt(form.controllersTotal, 10);
    if (isNaN(ctrl) || ctrl <= 0) {
      setErrorMsg('Controller count must be at least 1.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await sessionService.updateDevice(device.id, {
          name: rawName,
          zone: form.zone,
          category: form.zone,
          status: form.status,
          maxPlayers: maxP,
          controllersTotal: ctrl,
          hourlyPrice: price,
          image: form.image,
          notes: form.notes
        });
      } else {
        await sessionService.addDevice({
          name: rawName,
          zone: form.zone,
          category: form.zone,
          status: form.status,
          maxPlayers: maxP,
          controllersTotal: ctrl,
          hourlyPrice: price,
          image: form.image,
          notes: form.notes
        });
      }

      if (onSaved) await onSaved();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save device.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-panel bg-[#0C0A1D]/95 border border-purple-500/50 rounded-3xl p-5 sm:p-6 relative shadow-[0_0_50px_rgba(147,51,234,0.35)] space-y-4 font-sans text-gray-100 my-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-purple-300 shadow-inner">
              {isEdit ? <Edit2 className="w-5 h-5 text-purple-400" /> : <Plus className="w-5 h-5 text-purple-400" />}
            </div>
            <div>
              <h3 className="font-cyber text-base font-black text-white uppercase tracking-wider">
                {isEdit ? `Edit Device Specs: ${device.name}` : 'Add New Gaming Device'}
              </h3>
              <p className="text-[11px] text-purple-300 font-mono">Dynamic ERP Gaming Station Configuration</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 flex items-center gap-2 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          {/* Row 1: Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-cyber font-bold text-[10px] uppercase mb-1">
                DEVICE NAME *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. PS5-5, Xbox-1, SIM-2"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/15 focus:border-purple-400 text-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-cyber font-bold text-[10px] uppercase mb-1">
                DEVICE CATEGORY *
              </label>
              <select
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/15 focus:border-purple-400 text-white outline-none font-cyber font-bold cursor-pointer"
              >
                <option value="PlayStation 5">PlayStation 5</option>
                <option value="PlayStation 4">PlayStation 4</option>
                <option value="PlayStation 2">PlayStation 2</option>
                <option value="Xbox Series X">Xbox Series X</option>
                <option value="Nintendo Switch">Nintendo Switch</option>
                <option value="PS VR2">PS VR2</option>
                <option value="Racing Simulator">Racing Simulator</option>
                <option value="Gaming PC">Gaming PC</option>
                <option value="Custom Zone">Custom Zone</option>
              </select>
            </div>
          </div>

          {/* Row 2: Status & Hourly Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-cyber font-bold text-[10px] uppercase mb-1">
                STATUS
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/15 text-white outline-none cursor-pointer"
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="RESERVED">RESERVED</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 font-cyber font-bold text-[10px] uppercase mb-1">
                HOURLY PRICE (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="10"
                required
                value={form.hourlyPrice}
                onChange={(e) => setForm({ ...form, hourlyPrice: e.target.value })}
                placeholder="100"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/15 focus:border-purple-400 text-white outline-none font-mono"
              />
            </div>
          </div>

          {/* Row 3: Max Players & Controller Count */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-cyber font-bold text-[10px] uppercase mb-1">
                MAX PLAYERS
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={form.maxPlayers}
                onChange={(e) => setForm({ ...form, maxPlayers: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/15 text-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-cyber font-bold text-[10px] uppercase mb-1">
                CONTROLLER RIGS
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={form.controllersTotal}
                onChange={(e) => setForm({ ...form, controllersTotal: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/15 text-white outline-none font-mono"
              />
            </div>
          </div>

          {/* Image Selection & Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-gray-300 font-cyber font-bold text-[10px] uppercase">
                DEVICE IMAGE
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] font-cyber text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3 h-3" /> Upload Custom Image
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {PRESET_IMAGES.map((img) => (
                <button
                  type="button"
                  key={img.url}
                  onClick={() => setForm({ ...form, image: img.url })}
                  className={`p-1.5 rounded-xl border text-[10px] font-cyber flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    form.image === img.url
                      ? 'bg-purple-950/80 border-purple-400 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                      : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <img src={img.url} alt={img.label} className="w-8 h-8 object-contain" loading="lazy" decoding="async" />
                  <span className="truncate w-full text-center">{img.label}</span>
                </button>
              ))}
            </div>

            {/* Preview of custom image if not preset */}
            {form.image && !PRESET_IMAGES.some(p => p.url === form.image) && (
              <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/40 flex items-center gap-3">
                <img src={form.image} alt="Custom device preview" className="w-10 h-10 object-contain rounded" loading="lazy" decoding="async" />
                <span className="text-[10px] text-purple-300 font-mono truncate">Custom Image Uploaded</span>
              </div>
            )}
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-gray-300 font-cyber font-bold text-[10px] uppercase mb-1">
              OPTIONAL NOTES
            </label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Station near window, DualSense Edge controller attached..."
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/15 text-white outline-none font-sans"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-cyber font-bold text-gray-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-cyber font-bold text-white uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Saving Device...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Save Device
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
