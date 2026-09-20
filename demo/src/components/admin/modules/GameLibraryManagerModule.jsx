import React, { useState, useEffect, useRef } from 'react';
import { useSiteContext } from '../../../context/SiteContext';
import { Save, Gamepad2, Edit3, CheckCircle2, Trash2, Plus, Copy, EyeOff, Eye, ChevronUp, ChevronDown, Upload, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { gameLibraryService } from '../../../services/gameLibraryService';

// Image compression utility to prevent localStorage bloat
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Max dimensions tailored for cover posters
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 600;
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
        // Aggressive compression for localStorage constraints
        resolve(canvas.toDataURL('image/webp', 0.6));
      };
    };
  });
};

export default function GameLibraryManagerModule() {
  const { games, refresh } = useSiteContext();
  const [localGames, setLocalGames] = useState(games);
  const [saveNotice, setSaveNotice] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    // Only set on initial mount or if games change completely from elsewhere
    if (!localGames || Object.keys(localGames).length === 0) {
      setLocalGames(games);
    }
  }, [games]);

  const handleSaveLibrary = async () => {
    // Legacy save button not needed as all operations save immediately, 
    // but we can refresh the state.
    setIsSaving(true);
    await refresh();
    setIsSaving(false);
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 3000);
  };

  const openAddModal = (categoryKey) => {
    setActiveCategory(categoryKey);
    setIsEditing(false);
    setFormData({
      id: `game-${Date.now()}`,
      title: '',
      genre: '',
      platform: 'PS5',
      players: '1 Player',
      description: '',
      image: '',
      featured: false,
      isVisible: true,
      displayOrder: localGames[categoryKey].games.length
    });
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (categoryKey, game) => {
    setActiveCategory(categoryKey);
    setIsEditing(true);
    setFormData({ ...game, isVisible: game.isVisible !== false });
    setImagePreview(game.image);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(null);
    setImagePreview(null);
    setActiveCategory(null);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const compressedBase64 = await compressImage(file);
      setImagePreview(compressedBase64);
      setFormData(prev => ({ ...prev, image: compressedBase64 }));
    }
  };

  const saveModalGame = async () => {
    if (!formData.title || !formData.image) {
      alert("Title and Poster Image are required.");
      return;
    }

    try {
      setIsSaving(true);
      if (isEditing) {
        // ID in new setup is a UUID, fallback handles legacy
        await gameLibraryService.updateGame(formData.id, formData);
      } else {
        await gameLibraryService.createGame(activeCategory, formData);
      }
      
      await refresh();
      closeModal();
      setSaveNotice(true);
      setTimeout(() => setSaveNotice(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save game to Supabase.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicate = async (categoryKey, game) => {
    try {
      setIsSaving(true);
      const newGame = { 
        ...game, 
        title: `${game.title} (Copy)`, 
        displayOrder: localGames[categoryKey].games.length 
      };
      // Create new game by passing it without the original UUID
      await gameLibraryService.createGame(categoryKey, newGame);
      await refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to duplicate game.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (categoryKey, gameId) => {
    setDeleteConfirm({ categoryKey, gameId });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    const { categoryKey, gameId } = deleteConfirm;
    try {
      setIsSaving(true);
      await gameLibraryService.deleteGame(gameId);
      await refresh();
      setDeleteConfirm(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete game.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleVisibility = async (categoryKey, gameId) => {
    const game = localGames[categoryKey].games.find(g => g.id === gameId);
    if (game) {
      try {
        setIsSaving(true);
        await gameLibraryService.updateGame(gameId, { ...game, isVisible: !game.isVisible });
        await refresh();
      } catch (err) {
        console.error(err);
        alert("Failed to toggle visibility.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const moveGame = async (categoryKey, index, direction) => {
    const updated = { ...localGames };
    const gamesArr = [...updated[categoryKey].games];
    if (direction === 'up' && index > 0) {
      [gamesArr[index - 1], gamesArr[index]] = [gamesArr[index], gamesArr[index - 1]];
    } else if (direction === 'down' && index < gamesArr.length - 1) {
      [gamesArr[index], gamesArr[index + 1]] = [gamesArr[index + 1], gamesArr[index]];
    }
    gamesArr.forEach((g, idx) => g.displayOrder = idx);
    
    // Update local immediately for responsive UI
    updated[categoryKey].games = gamesArr;
    setLocalGames(updated);

    // Save orders to Supabase
    try {
      const updates = gamesArr.map(g => ({ id: g.id, displayOrder: g.displayOrder }));
      await gameLibraryService.updateDisplayOrders(updates);
    } catch (err) {
      console.error('Failed to save order to DB', err);
    }
  };

  const renderCollection = (categoryKey) => {
    const collection = localGames[categoryKey];
    return (
      <div key={categoryKey} className="glass-panel p-4 rounded-2xl border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h3 className="font-cyber text-sm sm:text-base font-bold text-white uppercase tracking-wider">
              {collection.title}
            </h3>
            <span className="text-xs font-mono text-purple-400">{collection.badge}</span>
          </div>
          <button
            onClick={() => openAddModal(categoryKey)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-cyber font-bold text-white uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          >
            <Plus className="w-4 h-4" /> Add Game
          </button>
        </div>

        <div className="space-y-3">
          {collection.games.length === 0 && (
            <div className="text-center py-6 text-gray-500 font-sans text-sm">No games in this category. Click Add Game to create one.</div>
          )}
          {collection.games.map((game, index) => (
            <div key={game.id} className={`bg-[#0F1219] p-3 rounded-xl border ${game.isVisible === false ? 'border-gray-800 opacity-50' : 'border-white/10 hover:border-purple-500/50'} flex flex-col md:flex-row gap-4 relative group transition-colors`}>
              
              <div className="flex items-center gap-4 flex-1">
                <img src={game.image} alt={game.title} className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-lg border border-purple-500/20 shrink-0" loading="lazy" decoding="async" />
                
                <div className="flex-1 space-y-1">
                  <h4 className="font-cyber text-sm font-bold text-white uppercase truncate">{game.title}</h4>
                  <div className="flex flex-wrap gap-2 text-[10px] font-cyber uppercase tracking-wider">
                    <span className="text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">{game.genre}</span>
                    <span className="text-pink-400 bg-pink-950/40 px-2 py-0.5 rounded border border-pink-500/30">{game.platform}</span>
                    <span className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">{game.players}</span>
                    {game.featured && <span className="text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">FEATURED</span>}
                  </div>
                  {game.description && <p className="text-[10px] text-gray-400 font-sans line-clamp-2 mt-1 max-w-lg">{game.description}</p>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row md:flex-col items-center justify-end gap-1.5 shrink-0 border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-3">
                <div className="flex gap-1.5 w-full justify-end">
                  <button onClick={() => moveGame(categoryKey, index, 'up')} disabled={index === 0} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-20 cursor-pointer" title="Move Up">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => moveGame(categoryKey, index, 'down')} disabled={index === collection.games.length - 1} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-20 cursor-pointer" title="Move Down">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  <button onClick={() => toggleVisibility(categoryKey, game.id)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-cyber flex items-center gap-1.5 text-gray-300 cursor-pointer" title={game.isVisible === false ? 'Show Game' : 'Hide Game'}>
                    {game.isVisible === false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => handleDuplicate(categoryKey, game)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-cyber flex items-center gap-1.5 text-blue-300 cursor-pointer">
                    <Copy className="w-3.5 h-3.5" /> Duplicate
                  </button>
                  <button onClick={() => openEditModal(categoryKey, game)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-cyber flex items-center gap-1.5 text-emerald-300 cursor-pointer">
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => confirmDelete(categoryKey, game.id)} className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900 border border-red-500/30 rounded-lg text-xs font-cyber flex items-center gap-1.5 text-red-400 cursor-pointer">
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
              <Gamepad2 className="w-5 h-5 text-purple-400" /> Game Library CMS
            </h2>
            <p className="text-xs text-gray-400">Add, edit, reorder, and manage all games shown in the public carousels.</p>
          </div>

          <button
          onClick={handleSaveLibrary}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-cyber font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Syncing...' : 'Sync Live Preview'}
        </button>
        </div>

        {saveNotice && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-cyber font-bold flex items-center gap-2 shadow-lg animate-in fade-in duration-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Game Library Updated Successfully! Frontend sync complete.
          </div>
        )}

        {/* Collections */}
        <div className="space-y-4">
          {Object.keys(localGames).map(key => renderCollection(key))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-[#0C0B18] border border-red-500/50 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-in zoom-in-95 duration-200 max-h-[90dvh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-cyber text-lg font-bold uppercase">Delete Game?</h3>
            </div>
            <p className="text-sm text-gray-300 mb-6">Are you sure you want to permanently delete this game? This will immediately remove it from the frontend carousel upon saving.</p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-xl bg-white/5 text-xs font-cyber hover:bg-white/10 text-white">Cancel</button>
              <button onClick={executeDelete} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-cyber text-white uppercase shadow-[0_0_15px_rgba(220,38,38,0.5)]">Delete Game</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Game Modal */}
      {isModalOpen && formData && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto custom-scrollbar">
          <div className="bg-[#0C0B18] border border-purple-500/40 rounded-3xl w-full max-w-3xl shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col my-auto relative animate-in zoom-in-95 duration-200 max-h-[90dvh]">
            
            <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
              <h3 className="font-cyber text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-purple-400" />
                {isEditing ? 'Edit Game' : 'Add New Game'}
              </h3>
              <button onClick={closeModal} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Poster Upload Column (4 cols) */}
                <div className="md:col-span-4 flex flex-col gap-3">
                  <label className="text-[10px] font-cyber text-cyan-400 uppercase">Game Poster</label>
                  <div 
                    className="relative w-full aspect-[2/3] rounded-xl border-2 border-dashed border-white/20 bg-black/50 hover:bg-white/5 hover:border-purple-500/50 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-xs font-cyber text-white flex items-center gap-1"><Upload className="w-4 h-4"/> Change Poster</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-purple-400 p-4 text-center">
                        <Upload className="w-8 h-8" />
                        <span className="text-xs font-sans">Click to upload poster<br/>(JPEG, PNG, WebP)</span>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                  <p className="text-[9px] text-gray-500 text-center leading-tight">Images are automatically compressed to fit storage limits.</p>
                </div>

                {/* Details Column (8 cols) */}
                <div className="md:col-span-8 space-y-4">
                  <div>
                    <label className="text-[10px] font-cyber text-cyan-400 uppercase">Game Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Ghost of Tsushima"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0F1219] border border-white/10 text-sm text-white outline-none focus:border-purple-400 mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-cyber text-cyan-400 uppercase">Genre</label>
                      <input
                        type="text"
                        value={formData.genre}
                        onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                        placeholder="e.g. Action Adventure"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#0F1219] border border-white/10 text-sm text-white outline-none focus:border-purple-400 mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-cyber text-cyan-400 uppercase">Platform</label>
                      <select
                        value={formData.platform}
                        onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#0F1219] border border-white/10 text-sm text-white outline-none focus:border-purple-400 mt-1 appearance-none"
                      >
                        <option value="PS5">PS5</option>
                        <option value="PS4">PS4</option>
                        <option value="PS2">PS2</option>
                        <option value="PS VR2">PS VR2</option>
                        <option value="Racing Sim">Racing Sim</option>
                        <option value="PS5 / PS4">PS5 / PS4</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-cyber text-cyan-400 uppercase">Players</label>
                      <select
                        value={formData.players}
                        onChange={(e) => setFormData({ ...formData, players: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#0F1219] border border-white/10 text-sm text-white outline-none focus:border-purple-400 mt-1 appearance-none"
                      >
                        <option value="1 Player">1 Player</option>
                        <option value="2 Players">2 Players</option>
                        <option value="1-2 Players">1-2 Players</option>
                        <option value="1-4 Players">1-4 Players</option>
                        <option value="1-8 Players">1-8 Players</option>
                        <option value="Online Multiplayer">Online Multiplayer</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-cyber text-cyan-400 uppercase">Display Order</label>
                      <input
                        type="number"
                        value={formData.displayOrder || 0}
                        onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#0F1219] border border-white/10 text-sm text-white outline-none focus:border-purple-400 mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-cyber text-cyan-400 uppercase">Short Description</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the game..."
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0F1219] border border-white/10 text-sm text-white outline-none focus:border-purple-400 mt-1"
                    />
                  </div>

                  <div className="flex gap-6 mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.isVisible !== false}
                        onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                        className="w-4 h-4 accent-purple-500 bg-black"
                      />
                      <span className="text-xs font-cyber text-white">Visible on Website</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        className="w-4 h-4 accent-pink-500 bg-black"
                      />
                      <span className="text-xs font-cyber text-white">Mark as Featured</span>
                    </label>
                  </div>

                </div>
              </div>
            </div>

            <div className="p-5 border-t border-white/10 flex justify-end gap-3 shrink-0 bg-black/20 rounded-b-3xl">
              <button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-cyber text-xs uppercase cursor-pointer">
                Cancel
              </button>
              <button onClick={saveModalGame} disabled={isSaving} className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-cyber font-bold tracking-wider text-xs uppercase shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center gap-2 transition-colors disabled:opacity-50">
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEditing ? 'Save Changes' : 'Create Game'}
            </button>
        </div>
          </div>
        </div>
      )}

    </div>
  );
}
