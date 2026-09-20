import React, { useState, useEffect } from 'react';
import { adminDataService } from '../../../services/adminDataService';
import { Image, Upload, Trash2, Eye, Filter, Plus, X } from 'lucide-react';

export default function GalleryModule() {
  const [images, setImages] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const [newImage, setNewImage] = useState({
    title: '',
    category: 'Arena',
    url: '/images/gallery/setup-1.webp'
  });

  const fetchGallery = async () => {
    const data = await adminDataService.getGallery();
    setImages(data);
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!newImage.title || !newImage.url) return;
    await adminDataService.addGalleryImage(newImage);
    setUploadModalOpen(false);
    setNewImage({ title: '', category: 'Arena', url: '/images/gallery/setup-1.webp' });
    fetchGallery();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete image from gallery?')) {
      await adminDataService.deleteGalleryImage(id);
      fetchGallery();
    }
  };

  const categories = ['ALL', 'Arena', 'Consoles', 'Simulators', 'VR', 'VIP Lounge'];

  const filteredImages = images.filter(img => 
    activeCategory === 'ALL' ? true : img.category === activeCategory
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-white/10">
        <div>
          <h2 className="font-cyber text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Image className="w-5 h-5 text-pink-400" /> Gallery Manager
          </h2>
          <p className="text-xs text-gray-400">Upload, organize and manage venue showcase photos</p>
        </div>

        <button
          onClick={() => setUploadModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-xs font-cyber font-bold text-white uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(236,72,153,0.4)] cursor-pointer"
        >
          <Upload className="w-4 h-4" /> Upload Images
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-xl text-xs font-cyber font-bold uppercase transition-all ${
              activeCategory === cat
                ? 'bg-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                : 'bg-slate-900 border border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Gallery Grid matching reference image 7 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredImages.map((img) => (
          <div 
            key={img.id}
            className="group relative rounded-2xl bg-slate-900 border border-white/10 overflow-hidden aspect-video shadow-lg hover:border-pink-500/50 transition-all"
          >
            <img 
              src={img.url} 
              alt={img.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

            {/* Top Badge */}
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-950/80 border border-white/20 text-[9px] font-cyber text-cyan-400 uppercase">
              {img.category}
            </span>

            {/* Bottom Actions */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="font-cyber text-xs font-bold text-white truncate max-w-[70%]">
                {img.title}
              </span>

              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setPreviewImage(img)}
                  className="p-1.5 rounded-lg bg-slate-900/90 border border-white/20 hover:border-pink-500 text-gray-300 hover:text-white"
                  title="Preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(img.id)}
                  className="p-1.5 rounded-lg bg-slate-900/90 border border-white/20 hover:border-red-500 text-gray-300 hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0c0818] border border-pink-500/40 rounded-2xl p-6 relative shadow-[0_0_40px_rgba(236,72,153,0.25)] space-y-4">
            <button
              onClick={() => setUploadModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-900 text-gray-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-cyber text-base font-black text-white uppercase tracking-wider">
              Upload Gallery Image
            </h3>

            <form onSubmit={handleUploadSubmit} className="space-y-3 pt-2">
              <div>
                <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Image Title</label>
                <input
                  type="text"
                  required
                  value={newImage.title}
                  onChange={(e) => setNewImage({ ...newImage, title: e.target.value })}
                  placeholder="e.g. PS5 Arena Night View"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-pink-500 text-xs text-white outline-none mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Category</label>
                <select
                  value={newImage.category}
                  onChange={(e) => setNewImage({ ...newImage, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white outline-none mt-1"
                >
                  <option value="Arena">Arena</option>
                  <option value="Consoles">Consoles</option>
                  <option value="Simulators">Simulators</option>
                  <option value="VR">VR</option>
                  <option value="VIP Lounge">VIP Lounge</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-cyber font-bold text-gray-300 uppercase">Image URL / Path</label>
                <input
                  type="text"
                  required
                  value={newImage.url}
                  onChange={(e) => setNewImage({ ...newImage, url: e.target.value })}
                  placeholder="/images/gallery/setup-1.webp"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-pink-500 text-xs text-white outline-none mt-1 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs font-cyber text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-400 font-cyber font-bold text-xs text-white uppercase tracking-wider shadow-[0_0_15px_rgba(236,72,153,0.4)]"
                >
                  Save Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg" onClick={() => setPreviewImage(null)}>
          <div className="max-w-2xl max-h-[85vh] rounded-2xl border border-pink-500/50 overflow-hidden relative shadow-2xl">
            <img src={previewImage.url} alt={previewImage.title} className="w-full h-full object-contain" loading="lazy" decoding="async" />
            <div className="absolute bottom-0 inset-x-0 p-4 bg-black/80 font-cyber text-white flex justify-between">
              <span>{previewImage.title}</span>
              <span className="text-pink-400">{previewImage.category}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
