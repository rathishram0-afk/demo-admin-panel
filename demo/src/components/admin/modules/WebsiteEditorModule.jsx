import React, { useState, useEffect } from 'react';
import { useSiteContext } from '../../../context/SiteContext';
import { 
  Globe, 
  Layout, 
  Info, 
  DollarSign, 
  Phone, 
  Gift, 
  Image as ImageIcon, 
  Share2, 
  Search, 
  Edit3, 
  X, 
  Check, 
  Save, 
  Upload, 
  Trash2, 
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  Send,
  MapPin,
  Clock
} from 'lucide-react';

export default function WebsiteEditorModule() {
  const { cms, updateCms } = useSiteContext();
  const [activeSection, setActiveSection] = useState('hero'); // 'hero', 'about', 'devices', 'gallery', 'contact', 'social', 'seo'
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop', 'tablet', 'mobile'
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Local state for editing before publishing
  const [cmsData, setCmsData] = useState(cms || {
    heroTitle: "PLAY. COMPETE. CONQUER.",
    heroSubtitle: "Experience the next generation of gaming.",
    heroBanner: "/images/hero/neon-bg.jpg",
    contact: {
      phone: "+91 9344176534",
      whatsapp: "+919344176534",
      address: "2, Kanniyamman Kovil Street, Raghavendra Nagar, Nesapakkam, Chennai, Greater Chennai, Tamil Nadu – 600078",
      businessHours: "Mon-Sun: 10:00 AM - 11:00 PM"
    }
  });

  // Sync if context updates from elsewhere
  useEffect(() => {
    if (cms) setCmsData(cms);
  }, [cms]);

  const handleSaveDraft = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handlePublish = () => {
    updateCms(cmsData);
    setPublishSuccess(true);
    setTimeout(() => setPublishSuccess(false), 3000);
  };

  const handleAddGalleryImage = () => {
    const newImg = {
      id: Date.now(),
      title: 'New Gallery Image',
      url: '/admin/ps5-admin.webp'
    };
    setCmsData(prev => ({
      ...prev,
      gallery: [...prev.gallery, newImg]
    }));
  };

  const handleDeleteGalleryImage = (id) => {
    setCmsData(prev => ({
      ...prev,
      gallery: prev.gallery.filter(g => g.id !== id)
    }));
  };

  return (
    <div className="space-y-4 font-sans text-gray-100 min-h-0 flex-1 flex flex-col custom-scrollbar overflow-y-auto pr-1">
      
      {/* CMS HEADER & ACTION BAR */}
      <div className="glass-panel p-4 xl:p-5 rounded-2xl border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="font-cyber text-base xl:text-lg font-bold text-white tracking-wider flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" /> Website Editor (Lightweight CMS)
          </h2>
          <p className="text-xs text-gray-400">Edit hero banners, gallery, contact info, social links & SEO metadata with live website preview</p>
        </div>

        {/* Live Preview Mode Switcher & Publish Buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#070A17] p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                previewDevice === 'desktop' ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40' : 'text-gray-400 hover:text-white'
              }`}
              title="Desktop View"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewDevice('tablet')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                previewDevice === 'tablet' ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40' : 'text-gray-400 hover:text-white'
              }`}
              title="Tablet View"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                previewDevice === 'mobile' ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40' : 'text-gray-400 hover:text-white'
              }`}
              title="Mobile View"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleSaveDraft}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-sans text-gray-300 font-medium transition-colors cursor-pointer"
          >
            Save Draft
          </button>

          <button
            onClick={handlePublish}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-cyber font-bold text-white uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" /> Publish Website
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-cyber font-bold flex items-center gap-2 animate-in fade-in duration-300">
          <Check className="w-4 h-4 text-emerald-400" /> Draft saved successfully!
        </div>
      )}

      {publishSuccess && (
        <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-cyber font-bold flex items-center gap-2 animate-in fade-in duration-300">
          <Send className="w-4 h-4 text-cyan-400" /> Website published successfully! Changes are live on customer landing page.
        </div>
      )}

      {/* CMS SECTION NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto custom-scrollbar">
        {[
          { id: 'hero', label: 'Hero Banner', icon: Layout },
          { id: 'contact', label: 'Contact & Venue', icon: Phone }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-cyber font-bold tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                isActive 
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]' 
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TWO-COLUMN EDITING & LIVE PREVIEW GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        
        {/* EDITING PANEL (7 COLS) */}
        <div className="lg:col-span-7 glass-panel p-4 xl:p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
          
          {/* HERO BANNER SECTION */}
          {activeSection === 'hero' && (
            <div className="space-y-3">
              <h3 className="font-cyber text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">
                Hero Banner Settings
              </h3>
              
              <div>
                <label className="text-[10px] font-cyber text-cyan-400 uppercase">Hero Tagline Title</label>
                <input
                  type="text"
                  value={cmsData.heroTitle || ''}
                  onChange={(e) => setCmsData({ ...cmsData, heroTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-white outline-none focus:border-cyan-400 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-cyber text-cyan-400 uppercase">Hero Subtitle</label>
                <textarea
                  rows={3}
                  value={cmsData.heroSubtitle || ''}
                  onChange={(e) => setCmsData({ ...cmsData, heroSubtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-white outline-none focus:border-cyan-400 mt-1"
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-[10px] font-cyber text-cyan-400 uppercase">Background Image URL</label>
                  <input
                    type="text"
                    value={cmsData.heroBanner || ''}
                    onChange={(e) => setCmsData({ ...cmsData, heroBanner: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-white outline-none focus:border-cyan-400 mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ABOUT SECTION */}
          {activeSection === 'about' && (
            <div className="space-y-3">
              <h3 className="font-cyber text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">
                About Us Section
              </h3>

              <div>
                <label className="text-[10px] font-cyber text-cyan-400 uppercase">Section Title</label>
                <input
                  type="text"
                  value={cmsData.about.title}
                  onChange={(e) => setCmsData({ ...cmsData, about: { ...cmsData.about, title: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-white outline-none focus:border-cyan-400 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-cyber text-cyan-400 uppercase">Description Text</label>
                <textarea
                  rows={4}
                  value={cmsData.about.description}
                  onChange={(e) => setCmsData({ ...cmsData, about: { ...cmsData.about, description: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-white outline-none focus:border-cyan-400 mt-1"
                />
              </div>
            </div>
          )}

          {/* MERGED GALLERY MANAGER */}
          {activeSection === 'gallery' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                <h3 className="font-cyber text-sm font-bold text-white uppercase tracking-wider">
                  Gallery Manager
                </h3>
                <button
                  onClick={handleAddGalleryImage}
                  className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-cyber font-bold text-white flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> Add Image
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {cmsData.gallery.map((img) => (
                  <div key={img.id} className="p-2.5 rounded-xl bg-[#0F1219] border border-white/10 space-y-2 relative group">
                    <img src={img.url} alt={img.title} className="w-full h-24 object-cover rounded-lg" loading="lazy" decoding="async" />
                    <input
                      type="text"
                      value={img.title}
                      onChange={(e) => {
                        const updated = cmsData.gallery.map(g => g.id === img.id ? { ...g, title: e.target.value } : g);
                        setCmsData({ ...cmsData, gallery: updated });
                      }}
                      className="w-full px-2 py-1 rounded bg-black/50 text-[11px] font-mono text-gray-200 border border-white/10"
                    />
                    <button
                      onClick={() => handleDeleteGalleryImage(img.id)}
                      className="absolute top-4 right-4 p-1.5 rounded-lg bg-red-950/80 text-red-300 hover:bg-red-900 border border-red-500/40 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONTACT & VENUE */}
          {activeSection === 'contact' && (
            <div className="space-y-3">
              <h3 className="font-cyber text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">
                Contact & Location Details
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-cyber text-cyan-400 uppercase">Phone Number</label>
                  <input
                    type="text"
                    value={cmsData.contact?.phone || ''}
                    onChange={(e) => setCmsData({ ...cmsData, contact: { ...cmsData.contact, phone: e.target.value } })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-white outline-none focus:border-cyan-400 mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-cyber text-cyan-400 uppercase">WhatsApp Number</label>
                  <input
                    type="text"
                    value={cmsData.contact?.whatsapp || ''}
                    onChange={(e) => setCmsData({ ...cmsData, contact: { ...cmsData.contact, whatsapp: e.target.value } })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-white outline-none focus:border-cyan-400 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-cyber text-cyan-400 uppercase">Venue Address</label>
                <textarea
                  rows={2}
                  value={cmsData.contact?.address || ''}
                  onChange={(e) => setCmsData({ ...cmsData, contact: { ...cmsData.contact, address: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-white outline-none focus:border-cyan-400 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-cyber text-cyan-400 uppercase">Business Hours Weekday</label>
                <input
                  type="text"
                  value={cmsData.contact?.hoursWeekday || ''}
                  onChange={(e) => setCmsData({ ...cmsData, contact: { ...cmsData.contact, hoursWeekday: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-white outline-none focus:border-cyan-400 mt-1"
                />
              </div>
              
              <div>
                <label className="text-[10px] font-cyber text-cyan-400 uppercase">Business Hours Weekend</label>
                <input
                  type="text"
                  value={cmsData.contact?.hoursWeekend || ''}
                  onChange={(e) => setCmsData({ ...cmsData, contact: { ...cmsData.contact, hoursWeekend: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-white outline-none focus:border-cyan-400 mt-1"
                />
              </div>
            </div>
          )}

          {/* SOCIAL LINKS */}
          {activeSection === 'social' && (
            <div className="space-y-3">
              <h3 className="font-cyber text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">
                Social Media Handles
              </h3>

              <div>
                <label className="text-[10px] font-cyber text-cyan-400 uppercase">Instagram URL</label>
                <input
                  type="text"
                  value={cmsData.social.instagram}
                  onChange={(e) => setCmsData({ ...cmsData, social: { ...cmsData.social, instagram: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-white outline-none focus:border-cyan-400 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-cyber text-cyan-400 uppercase">Facebook URL</label>
                <input
                  type="text"
                  value={cmsData.social.facebook}
                  onChange={(e) => setCmsData({ ...cmsData, social: { ...cmsData.social, facebook: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-white outline-none focus:border-cyan-400 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-cyber text-cyan-400 uppercase">YouTube Channel URL</label>
                <input
                  type="text"
                  value={cmsData.social.youtube}
                  onChange={(e) => setCmsData({ ...cmsData, social: { ...cmsData.social, youtube: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-white outline-none focus:border-cyan-400 mt-1"
                />
              </div>
            </div>
          )}

          {/* SEO SETTINGS */}
          {activeSection === 'seo' && (
            <div className="space-y-3">
              <h3 className="font-cyber text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">
                SEO Search Engine Optimization
              </h3>

              <div>
                <label className="text-[10px] font-cyber text-cyan-400 uppercase">Website Meta Title</label>
                <input
                  type="text"
                  value={cmsData.seo.siteTitle}
                  onChange={(e) => setCmsData({ ...cmsData, seo: { ...cmsData.seo, siteTitle: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-white outline-none focus:border-cyan-400 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-cyber text-cyan-400 uppercase">Google Search Description</label>
                <textarea
                  rows={3}
                  value={cmsData.seo.metaDescription}
                  onChange={(e) => setCmsData({ ...cmsData, seo: { ...cmsData.seo, metaDescription: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-white outline-none focus:border-cyan-400 mt-1"
                />
              </div>
            </div>
          )}

        </div>

        {/* LIVE WEBSITE PREVIEW PANEL (5 COLS) */}
        <div className="lg:col-span-5 glass-panel p-4 rounded-2xl border border-white/10 shadow-xl flex flex-col space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
            <span className="font-cyber text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-cyan-400" /> Live Website Preview
            </span>
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/40 uppercase">
              {previewDevice} Mode
            </span>
          </div>

          {/* Interactive Simulated Preview Box */}
          <div className={`mx-auto w-full transition-all duration-300 overflow-hidden rounded-xl border border-cyan-500/30 bg-[#070A17] p-4 space-y-4 shadow-[0_0_25px_rgba(6,182,212,0.15)] ${
            previewDevice === 'mobile' ? 'max-w-[320px]' : previewDevice === 'tablet' ? 'max-w-[480px]' : 'max-w-full'
          }`}>
            
            {/* Simulated Hero Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950 to-indigo-950 border border-purple-500/40 space-y-2 relative overflow-hidden">
              <div className="absolute inset-0 opacity-30 bg-cover bg-center" style={{ backgroundImage: `url(${cmsData.heroBanner})`}}></div>
              <div className="relative z-10">
                <span className="text-[9px] font-cyber text-cyan-400 uppercase tracking-widest block font-bold">G-FORCE GAMING HUB</span>
                <h4 className="font-cyber text-sm font-bold text-white uppercase leading-tight">{cmsData.heroTitle}</h4>
                <p className="text-[11px] text-gray-300 font-sans leading-relaxed">{cmsData.heroSubtitle}</p>
                <button className="px-3 py-1.5 rounded-lg bg-pink-600 text-white text-[10px] font-cyber font-bold uppercase tracking-wider mt-2">
                  BOOK STATION NOW
                </button>
              </div>
            </div>

            {/* Simulated Contact Footer */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/5 space-y-1 text-[10px] font-mono text-gray-400">
              <div className="flex items-center gap-1.5 text-gray-300">
                <MapPin className="w-3 h-3 text-purple-400" />
                <span>{cmsData.contact?.address}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-300">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>{cmsData.contact?.hoursWeekday}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-300">
                <Phone className="w-3 h-3 text-cyan-400" />
                <span>{cmsData.contact?.phone}</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
