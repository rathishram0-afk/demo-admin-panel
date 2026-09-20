import React, { useState, useEffect } from 'react';
import { adminDataService } from '../../../services/adminDataService';
import { Globe, Layout, Info, DollarSign, Phone, Gift, Image, Share2, Search, Edit3, X, Check } from 'lucide-react';

export default function WebsiteContentModule() {
  const [content, setContent] = useState({});
  const [activeModalSection, setActiveModalSection] = useState(null);
  const [formData, setFormData] = useState({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchContent = async () => {
    const data = await adminDataService.getWebsiteContent();
    setContent(data);
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const openEdit = (sectionKey) => {
    setActiveModalSection(sectionKey);
    setFormData(content[sectionKey] || {});
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const updated = await adminDataService.updateWebsiteContent(activeModalSection, formData);
    setContent(updated);
    setActiveModalSection(null);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const sectionCards = [
    { key: 'hero', title: 'Hero Banner', desc: 'Update main header tagline & call to action text.', icon: Layout, color: 'text-pink-400' },
    { key: 'about', title: 'About Us', desc: 'Update cafe overview description & highlight features.', icon: Info, color: 'text-cyan-400' },
    { key: 'pricing', title: 'Pricing & Rates', desc: 'Update hourly rates for PS5, VR, PS4 & Simulators.', icon: DollarSign, color: 'text-emerald-400' },
    { key: 'contact', title: 'Contact Details', desc: 'Update phone numbers, email address & venue location.', icon: Phone, color: 'text-purple-400' },
    { key: 'hours', title: 'Business Hours', desc: 'Update weekday and weekend opening/closing times.', icon: Gift, color: 'text-amber-400' },
    { key: 'seo', title: 'SEO Meta Data', desc: 'Update Google search title tags & meta descriptions.', icon: Search, color: 'text-blue-400' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-white/10">
        <div>
          <h2 className="font-cyber text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" /> Website Content CMS
          </h2>
          <p className="text-xs text-gray-400">Update content and text shown on the public landing page</p>
        </div>

        {savedSuccess && (
          <span className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-cyber font-bold animate-pulse flex items-center gap-1.5">
            <Check className="w-4 h-4" /> Content Saved Successfully!
          </span>
        )}
      </div>

      {/* Grid of Content Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sectionCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key} className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-cyan-500/40 transition-all space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <h3 className="font-cyber text-base font-bold text-white uppercase tracking-wider">
                  {card.title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  {card.desc}
                </p>
              </div>

              <button
                onClick={() => openEdit(card.key)}
                className="w-full py-2 rounded-xl bg-slate-900 border border-white/15 hover:border-cyan-400 text-xs font-cyber font-bold text-cyan-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Section
              </button>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {activeModalSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#080c19] border border-cyan-500/40 rounded-2xl p-6 relative shadow-[0_0_40px_rgba(0,240,255,0.25)] space-y-4">
            <button
              onClick={() => setActiveModalSection(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-900 text-gray-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-cyber text-base font-black text-white uppercase tracking-wider">
              Edit {sectionCards.find(c => c.key === activeModalSection)?.title}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 pt-2">
              {Object.keys(formData).map((fieldKey) => (
                <div key={fieldKey}>
                  <label className="text-[10px] font-cyber font-bold text-cyan-400 uppercase tracking-wider">
                    {fieldKey.replace(/([A-Z])/g, ' $1')}
                  </label>
                  {fieldKey.toLowerCase().includes('description') || fieldKey.toLowerCase().includes('address') ? (
                    <textarea
                      rows={3}
                      value={formData[fieldKey]}
                      onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-cyan-400 text-xs text-white outline-none mt-1"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData[fieldKey]}
                      onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-cyan-400 text-xs text-white outline-none mt-1"
                    />
                  )}
                </div>
              ))}

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModalSection(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs font-cyber text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-cyber font-bold text-xs text-white uppercase tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
