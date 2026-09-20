import React, { useState, useEffect, useRef } from 'react';
import { useSiteContext } from '../../../context/SiteContext';
import { cafeMenuService } from '../../../services/cafeMenuService';
import { Save, UtensilsCrossed, Edit3, CheckCircle2, Trash2, Plus, Copy, EyeOff, Eye, ChevronUp, ChevronDown, Upload, X, AlertTriangle, Coffee } from 'lucide-react';

// Image compression utility
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
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

export default function CafeMenuManagerModule() {
  const { menu, updateMenu } = useSiteContext();
  const [localMenu, setLocalMenu] = useState(menu);
  const [saveNotice, setSaveNotice] = useState(false);
  const fileInputRef = useRef(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalCategory, setOriginalCategory] = useState(null);
  const [formData, setFormData] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (menu) {
      setLocalMenu(menu);
    }
  }, [menu]);

  const refreshMenu = async () => {
    setIsRefreshing(true);
    try {
      const refreshedData = await cafeMenuService.getMenuItems();
      if (refreshedData) {
        updateMenu(refreshedData); // Update context
      }
    } catch (err) {
      console.error("Failed to refresh menu:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    refreshMenu();
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 3000);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setOriginalCategory(null);
    setFormData({
      id: `item-${Date.now()}`,
      name: '',
      category: 'drinks', 
      price: '₹0',
      numericPrice: 0,
      size: '',
      badge: '',
      image: '',
      status: 'AVAILABLE',
      featured: false,
      isVisible: true
    });
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (categoryKey, item) => {
    setIsEditing(true);
    setOriginalCategory(categoryKey);
    setFormData({ 
      ...item, 
      category: categoryKey, 
      isVisible: item.isVisible !== false 
    });
    setImagePreview(item.image);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(null);
    setImagePreview(null);
    setOriginalCategory(null);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const compressedBase64 = await compressImage(file);
      setImagePreview(compressedBase64);
      setFormData(prev => ({ ...prev, image: compressedBase64 }));
    }
  };

  const saveModalItem = async () => {
    if (!formData.name || !formData.image) {
      alert("Item Name and Image are required.");
      return;
    }

    try {
      if (isEditing) {
        // If it's a new ID (UUID), we can just update it
        // Wait, if it's editing an old non-UUID item, this might fail unless we migrated it
        // Assuming migration has assigned UUIDs to all
        await cafeMenuService.updateMenuItem(formData.id, formData);
      } else {
        await cafeMenuService.createMenuItem(formData);
      }
      
      await refreshMenu();
      closeModal();
      
      setSaveNotice(true);
      setTimeout(() => setSaveNotice(false), 3000);
    } catch (err) {
      console.error("Failed to save item:", err);
      alert("Failed to save item to database. Check console for details.");
    }
  };

  const handleDuplicate = async (categoryKey, item) => {
    const newItem = { 
      ...item, 
      name: `${item.name} (Copy)`
    };
    try {
      await cafeMenuService.createMenuItem(newItem);
      await refreshMenu();
    } catch (err) {
      console.error("Failed to duplicate item:", err);
    }
  };

  const confirmDelete = (categoryKey, itemId) => {
    setDeleteConfirm({ categoryKey, itemId });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    const { itemId } = deleteConfirm;
    try {
      await cafeMenuService.deleteMenuItem(itemId);
      await refreshMenu();
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Failed to delete item:", err);
      alert("Failed to delete item.");
    }
  };

  const toggleVisibility = async (categoryKey, itemId) => {
    const item = localMenu[categoryKey].find(i => i.id === itemId);
    if (item) {
      try {
        const updatedItem = { ...item, isVisible: item.isVisible === false ? true : false };
        await cafeMenuService.updateMenuItem(itemId, updatedItem);
        await refreshMenu();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const toggleAvailability = async (categoryKey, itemId) => {
    const item = localMenu[categoryKey].find(i => i.id === itemId);
    if (item) {
      try {
        const updatedItem = { ...item, status: item.status === 'AVAILABLE' ? 'SOLD_OUT' : 'AVAILABLE' };
        await cafeMenuService.updateMenuItem(itemId, updatedItem);
        await refreshMenu();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const toggleFeatured = async (categoryKey, itemId) => {
    const item = localMenu[categoryKey].find(i => i.id === itemId);
    if (item) {
      try {
        const updatedItem = { ...item, featured: !item.featured };
        await cafeMenuService.updateMenuItem(itemId, updatedItem);
        await refreshMenu();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const renderCategory = (categoryKey, title) => {
    const items = localMenu[categoryKey] || [];
    return (
      <div key={categoryKey} className="glass-panel p-4 rounded-2xl border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="font-cyber text-sm sm:text-base font-bold text-white uppercase tracking-wider">
            {title}
          </h3>
          <span className="text-xs font-mono text-amber-400">{items.length} Items</span>
        </div>

        <div className="space-y-3">
          {items.length === 0 && (
            <div className="text-center py-6 text-gray-500 font-sans text-sm">No items in this category.</div>
          )}
          {items.map((item, index) => (
            <div key={item.id} className={`bg-[#0F1219] p-3 rounded-xl border ${item.isVisible === false ? 'border-gray-800 opacity-50' : 'border-white/10 hover:border-amber-500/50'} flex flex-col md:flex-row gap-4 relative group transition-colors`}>
              
              <div className="flex items-center gap-4 flex-1">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-black/40 flex items-center justify-center p-1 border border-amber-500/20 shrink-0">
                  <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain drop-shadow-md" loading="lazy" decoding="async" />
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-cyber text-sm font-bold text-white uppercase truncate">{item.name}</h4>
                    <span className="font-mono text-xs font-bold text-amber-400">{item.price}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-cyber uppercase tracking-wider">
                    {item.status === 'AVAILABLE' 
                      ? <span className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">AVAILABLE</span>
                      : <span className="text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-500/30">SOLD OUT</span>
                    }
                    {item.featured && <span className="text-pink-400 bg-pink-950/40 px-2 py-0.5 rounded border border-pink-500/30">FEATURED</span>}
                    {item.size && <span className="text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">{item.size}</span>}
                  </div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex flex-row md:flex-col items-center justify-end gap-1.5 shrink-0 border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-3">
                <div className="flex gap-1.5 flex-wrap justify-end">
                  <button onClick={() => toggleAvailability(categoryKey, item.id)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-cyber flex items-center gap-1.5 text-gray-300 cursor-pointer" title="Toggle Availability">
                    <Coffee className="w-3.5 h-3.5" /> {item.status === 'AVAILABLE' ? 'Mark Out of Stock' : 'Mark Available'}
                  </button>
                  <button onClick={() => toggleFeatured(categoryKey, item.id)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-cyber flex items-center gap-1.5 text-pink-300 cursor-pointer" title="Toggle Featured">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {item.featured ? 'Unfeature' : 'Feature'}
                  </button>
                  <button onClick={() => openEditModal(categoryKey, item)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-cyber flex items-center gap-1.5 text-emerald-300 cursor-pointer">
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => confirmDelete(categoryKey, item.id)} className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900 border border-red-500/30 rounded-lg text-xs font-cyber flex items-center gap-1.5 text-red-400 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative font-sans text-gray-100 min-h-0 flex-1 flex flex-col h-full">
      <div className="space-y-4 custom-scrollbar overflow-y-auto pr-1 pb-20">
        
        {/* Header */}
        <div className="glass-panel p-4 xl:p-5 rounded-2xl border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="font-cyber text-base xl:text-lg font-bold text-white tracking-wider flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-amber-400" /> Cafe Menu CMS
            </h2>
            <p className="text-xs text-gray-400">Add, edit, reorder, and manage all cafe items shown on the public website.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={openAddModal}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-cyber font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-cyber font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Save className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> {isRefreshing ? 'Syncing...' : 'Sync Live Preview'}
            </button>
          </div>
        </div>

        {saveNotice && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-cyber font-bold flex items-center gap-2 shadow-lg animate-in fade-in duration-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Cafe Menu Updated Successfully! Frontend sync complete.
          </div>
        )}

        {/* Categories */}
        <div className="space-y-4">
          {renderCategory('drinks', 'Cold Drinks')}
          {renderCategory('shakes', 'Thick Shakes')}
          {renderCategory('snacks', 'Snacks & Chips')}
          {renderCategory('waffles', 'Waffles')}
          {renderCategory('fries_momos', 'Fries & Momos')}
          {renderCategory('burger_sandwich', 'Burger & Sandwich')}
          {Object.keys(localMenu || {}).map(key => {
            const knownKeys = ['drinks', 'shakes', 'snacks', 'waffles', 'fries_momos', 'burger_sandwich'];
            if (knownKeys.includes(key) || key.includes(' ')) return null;
            const title = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return renderCategory(key, title);
          })}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0C0B18] border border-red-500/50 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-cyber text-lg font-bold uppercase">Delete Item?</h3>
            </div>
            <p className="text-sm text-gray-300 mb-6">Are you sure you want to permanently delete this item? This will immediately remove it from the frontend menu upon saving.</p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-xl bg-white/5 text-xs font-cyber hover:bg-white/10 text-white">Cancel</button>
              <button onClick={executeDelete} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-cyber text-white uppercase shadow-[0_0_15px_rgba(220,38,38,0.5)]">Delete Item</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {isModalOpen && formData && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto custom-scrollbar">
          <div className="bg-[#0C0B18] border border-amber-500/40 rounded-3xl w-full max-w-3xl shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col my-auto relative animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
              <h3 className="font-cyber text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Coffee className="w-5 h-5 text-amber-400" />
                {isEditing ? 'Edit Menu Item' : 'Add Menu Item'}
              </h3>
              <button onClick={closeModal} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Image Upload Column (4 cols) */}
                <div className="md:col-span-4 flex flex-col gap-3">
                  <label className="text-[10px] font-cyber text-cyan-400 uppercase">Product Image</label>
                  <div 
                    className="relative w-full aspect-square rounded-xl border-2 border-dashed border-white/20 bg-black/50 hover:bg-white/5 hover:border-amber-500/50 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-2" loading="lazy" decoding="async" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-xs font-cyber text-white flex items-center gap-1"><Upload className="w-4 h-4"/> Change Image</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-amber-400 p-4 text-center">
                        <Upload className="w-8 h-8" />
                        <span className="text-xs font-sans">Upload Image<br/>(JPEG, PNG, WebP)</span>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                  <p className="text-[9px] text-gray-500 text-center leading-tight">Images are automatically compressed and optimized.</p>
                </div>

                {/* Details Column (8 cols) */}
                <div className="md:col-span-8 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-cyber text-cyan-400 uppercase">Product Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Sprite"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#0F1219] border border-white/10 text-sm text-white outline-none focus:border-amber-400 mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-cyber text-cyan-400 uppercase">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#0F1219] border border-white/10 text-sm text-white outline-none focus:border-amber-400 mt-1 appearance-none"
                      >
                        <option value="drinks">Cold Drinks</option>
                        <option value="shakes">Thick Shakes</option>
                        <option value="snacks">Snacks & Chips</option>
                        <option value="waffles">Waffles</option>
                        <option value="fries_momos">Fries & Momos</option>
                        <option value="burger_sandwich">Burger & Sandwich</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-cyber text-cyan-400 uppercase">Price (₹)</label>
                      <input
                        type="number"
                        value={formData.numericPrice}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          numericPrice: parseInt(e.target.value) || 0,
                          price: `₹${parseInt(e.target.value) || 0}`
                        })}
                        placeholder="e.g. 50"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#0F1219] border border-white/10 text-sm font-mono text-amber-400 outline-none focus:border-amber-400 mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-cyber text-cyan-400 uppercase">Availability</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#0F1219] border border-white/10 text-sm text-white outline-none focus:border-amber-400 mt-1 appearance-none"
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="SOLD_OUT">SOLD OUT</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-cyber text-cyan-400 uppercase">Size/Variant (Optional)</label>
                      <input
                        type="text"
                        value={formData.size}
                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                        placeholder="e.g. 400ml"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#0F1219] border border-white/10 text-sm text-white outline-none focus:border-amber-400 mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-cyber text-cyan-400 uppercase">Custom Badge (Optional)</label>
                      <input
                        type="text"
                        value={formData.badge}
                        onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                        placeholder="e.g. NEW, BESTSELLER"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#0F1219] border border-white/10 text-sm text-white outline-none focus:border-amber-400 mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex gap-6 mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        className="w-4 h-4 accent-pink-500 bg-black"
                      />
                      <span className="text-xs font-cyber text-white">Featured Item</span>
                    </label>
                  </div>

                </div>
              </div>
            </div>

            <div className="p-5 border-t border-white/10 flex justify-end gap-3 shrink-0 bg-black/20 rounded-b-3xl">
              <button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-cyber text-xs uppercase cursor-pointer">
                Cancel
              </button>
              <button onClick={saveModalItem} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-cyber text-xs uppercase font-bold tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer">
                Save Item
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
