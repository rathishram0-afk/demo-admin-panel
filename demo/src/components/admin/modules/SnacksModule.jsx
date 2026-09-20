import React, { useState, useEffect } from 'react';
import { adminDataService } from '../../../services/adminDataService';
import { ShoppingBag, Plus, Edit2, Trash2, Search, X } from 'lucide-react';

export default function SnacksModule() {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Snacks',
    price: 80,
    stock: 20,
    status: 'Available'
  });

  const fetchSnacks = async () => {
    const data = await adminDataService.getSnacks();
    setItems(data);
  };

  useEffect(() => {
    fetchSnacks();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ title: '', category: 'Snacks', price: 80, stock: 20, status: 'Available' });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await adminDataService.saveSnack(editingItem ? { ...formData, id: editingItem.id } : formData);
    setModalOpen(false);
    fetchSnacks();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete snack/drink item?')) {
      await adminDataService.deleteSnack(id);
      fetchSnacks();
    }
  };

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-white/10">
        <div>
          <h2 className="font-cyber text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" /> Snacks & Drinks Inventory
          </h2>
          <p className="text-xs text-gray-400">Manage snacks, drinks, stock counts and prices</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-white/15 focus:border-amber-400 text-xs text-white placeholder-gray-500 outline-none transition-all"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-xs font-cyber font-bold text-slate-950 uppercase tracking-wider flex items-center gap-1.5 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Item
          </button>
        </div>
      </div>

      {/* Table matching reference image 8 */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/60 text-[10px] font-cyber text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">ITEM</th>
                <th className="py-3.5 px-4">PRICE</th>
                <th className="py-3.5 px-4">CATEGORY</th>
                <th className="py-3.5 px-4">STOCK</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center text-amber-400">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <span className="font-cyber">{item.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-pink-400 font-bold">₹{item.price}</td>
                  <td className="py-3 px-4 font-mono text-cyan-300">{item.category}</td>
                  <td className="py-3 px-4 font-mono text-gray-300">{item.stock} units</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-cyber font-bold uppercase ${
                      item.status === 'Available'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-red-500/20 text-red-400 border border-red-500/40'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-white/10 hover:border-amber-400 text-gray-300 hover:text-white transition-all"
                        title="Edit Item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-white/10 hover:border-red-500 text-gray-400 hover:text-red-400 transition-all"
                        title="Delete Item"
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

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#120c08] border border-amber-500/40 rounded-2xl p-6 relative shadow-[0_0_40px_rgba(245,158,11,0.25)] space-y-4">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-900 text-gray-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-cyber text-base font-black text-white uppercase tracking-wider">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 pt-2">
              <div>
                <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Item Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Masala Fries"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-amber-400 text-xs text-white outline-none mt-1"
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
                    <option value="Snacks">Snacks</option>
                    <option value="Drinks">Drinks</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white outline-none mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Stock Count</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
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
                    <option value="Available">Available</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
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
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 font-cyber font-bold text-xs text-slate-950 uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
