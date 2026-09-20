import React, { useState, useEffect } from 'react';
import { adminDataService } from '../../../services/adminDataService';
import { Search, Plus, Edit2, Trash2, Star, Gamepad2, Check, X } from 'lucide-react';

export default function GameModule() {
  const [games, setGames] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Story Mode',
    platform: 'PS5',
    price: 100,
    status: 'Active',
    isFeatured: false,
    image: '/images/story/gta-5.webp'
  });

  const fetchGames = async () => {
    const data = await adminDataService.getGames();
    setGames(data);
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const handleOpenAdd = () => {
    setEditingGame(null);
    setFormData({
      title: '',
      category: 'Story Mode',
      platform: 'PS5',
      price: 100,
      status: 'Active',
      isFeatured: false,
      image: '/images/story/gta-5.webp'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (game) => {
    setEditingGame(game);
    setFormData(game);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await adminDataService.saveGame(editingGame ? { ...formData, id: editingGame.id } : formData);
    setModalOpen(false);
    fetchGames();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this game from library?')) {
      await adminDataService.deleteGame(id);
      fetchGames();
    }
  };

  const toggleFeatured = async (game) => {
    await adminDataService.saveGame({ ...game, isFeatured: !game.isFeatured });
    fetchGames();
  };

  const filteredGames = games.filter(g =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.platform.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-white/10">
        <div>
          <h2 className="font-cyber text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-purple-400" /> Game Management
          </h2>
          <p className="text-xs text-gray-400">Add, edit or remove games from your library catalog</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search games..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-white/15 focus:border-purple-500 text-xs text-white placeholder-gray-500 outline-none transition-all"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-xs font-cyber font-bold text-white uppercase tracking-wider flex items-center gap-1.5 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Game
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/60 text-[10px] font-cyber text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">GAME</th>
                <th className="py-3.5 px-4">CATEGORY</th>
                <th className="py-3.5 px-4">PLATFORM</th>
                <th className="py-3.5 px-4">PRICE / HR</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredGames.map((game) => (
                <tr key={game.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-900 border border-white/10 overflow-hidden shrink-0">
                        <img src={game.image} alt={game.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      </div>
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1.5 font-cyber">
                          {game.title}
                          {game.isFeatured && (
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          )}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">{game.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-sans text-gray-300">{game.category}</td>
                  <td className="py-3 px-4 font-mono text-cyan-400">{game.platform}</td>
                  <td className="py-3 px-4 font-mono text-pink-400 font-bold">₹{game.price}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-cyber font-bold uppercase ${
                      game.status === 'Active'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-red-500/20 text-red-400 border border-red-500/40'
                    }`}>
                      {game.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => toggleFeatured(game)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          game.isFeatured
                            ? 'bg-amber-950/60 border-amber-500/50 text-amber-400'
                            : 'bg-slate-900 border-white/10 text-gray-500 hover:text-white'
                        }`}
                        title="Toggle Featured"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenEdit(game)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-white/10 hover:border-purple-400 text-gray-300 hover:text-white transition-all"
                        title="Edit Game"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(game.id)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-white/10 hover:border-red-500 text-gray-400 hover:text-red-400 transition-all"
                        title="Delete Game"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Game Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0e0a1a] border border-purple-500/40 rounded-2xl p-6 relative shadow-[0_0_40px_rgba(168,85,247,0.25)] space-y-4">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-900 text-gray-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-cyber text-base font-black text-white uppercase tracking-wider">
              {editingGame ? 'Edit Game' : 'Add New Game'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 pt-2">
              <div>
                <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Game Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Tekken 8"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-purple-500 text-xs text-white outline-none mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white outline-none mt-1"
                  >
                    <option value="Story Mode">Story Mode</option>
                    <option value="Multiplayer">Multiplayer</option>
                    <option value="Racing">Racing</option>
                    <option value="VR">VR</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Platform</label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white outline-none mt-1"
                  >
                    <option value="PS5">PS5</option>
                    <option value="PS4">PS4</option>
                    <option value="PS2">PS2</option>
                    <option value="PS VR2">PS VR2</option>
                    <option value="Sim Racing Rig">Sim Racing Rig</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Hourly Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white outline-none mt-1 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white outline-none mt-1"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Cover Image Path</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="/images/story/gta-5.webp"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white outline-none mt-1 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs font-cyber text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 font-cyber font-bold text-xs text-white uppercase tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                >
                  Save Game
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
