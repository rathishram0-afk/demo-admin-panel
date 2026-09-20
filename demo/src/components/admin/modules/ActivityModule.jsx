import React, { useState, useEffect } from 'react';
import { adminDataService } from '../../../services/adminDataService';
import { Clock, CheckCircle2, Gamepad2, Award, Globe, Image, ShieldAlert, Sparkles, Filter } from 'lucide-react';

export default function ActivityModule() {
  const [activities, setActivities] = useState([]);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    async function loadData() {
      const data = await adminDataService.getActivities();
      setActivities(data);
    }
    loadData();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'BOOKING_APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'GAME_ADDED':
      case 'GAME_UPDATED':
        return <Gamepad2 className="w-4 h-4 text-purple-400" />;
      case 'MEMBERSHIP_APPROVED':
        return <Award className="w-4 h-4 text-amber-400" />;
      case 'WEBSITE_UPDATED':
        return <Globe className="w-4 h-4 text-cyan-400" />;
      case 'GALLERY_UPDATED':
        return <Image className="w-4 h-4 text-pink-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
    }
  };

  const filteredActivities = activities.filter(act => {
    if (filterType === 'ALL') return true;
    if (filterType === 'BOOKINGS') return act.type.includes('BOOKING');
    if (filterType === 'MEMBERS') return act.type.includes('MEMBERSHIP');
    if (filterType === 'GAMES') return act.type.includes('GAME');
    if (filterType === 'CONTENT') return act.type.includes('WEBSITE') || act.type.includes('GALLERY');
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-white/10">
        <div>
          <h2 className="font-cyber text-lg font-black text-white uppercase tracking-wider">
            Activity Timeline
          </h2>
          <p className="text-xs text-gray-400">Complete audit log of system events and administrative actions</p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-pink-400" />
          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'BOOKINGS', 'MEMBERS', 'GAMES', 'CONTENT'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterType(cat)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-cyber font-bold uppercase transition-all ${
                  filterType === cat
                    ? 'bg-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                    : 'bg-slate-900 border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline List */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 relative">
        
        <div className="absolute left-9 top-8 bottom-8 w-0.5 bg-gradient-to-b from-pink-500 via-purple-500 to-cyan-500/20" />

        <div className="space-y-6 relative z-10">
          {filteredActivities.map((act) => (
            <div key={act.id} className="flex items-start gap-4 group">
              <div className="w-8 h-8 rounded-full bg-slate-950 border border-white/20 flex items-center justify-center shrink-0 group-hover:border-pink-500 group-hover:scale-110 transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                {getIcon(act.type)}
              </div>

              <div className="flex-1 glass-panel p-4 rounded-xl border border-white/5 hover:border-pink-500/30 transition-all space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-cyber font-bold text-xs text-white uppercase tracking-wider">
                    {act.title}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" /> {act.time}
                  </span>
                </div>
                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  {act.detail}
                </p>
                <div className="text-[9px] font-mono text-gray-500 pt-1">
                  DATE: {act.date}
                </div>
              </div>
            </div>
          ))}

          {filteredActivities.length === 0 && (
            <div className="text-center py-10 text-gray-500 text-xs font-mono">
              NO ACTIVITY LOGS FOUND FOR THIS FILTER.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
