/**
 * Admin Data Service - Handles demo dataset and local storage persistence for:
 * Games, Snacks, Gallery, Website Content, Activity Logs, Settings, Analytics.
 */

import { supabase } from './supabase.js';
import { sessionService } from './sessionService.js';

const STORAGE_KEYS = {
  GAMES: 'gforce_demo_admin_games',
  SNACKS: 'gforce_demo_admin_snacks',
  GALLERY: 'gforce_demo_admin_gallery',
  WEBSITE: 'gforce_demo_admin_website_content',
  ACTIVITIES: 'gforce_demo_admin_activities',
  SETTINGS: 'gforce_demo_admin_settings'
};

// Initial Seed Data matching the reference image layout and titles

const INITIAL_GAMES = [
  { id: 'g1', title: 'GTA V', category: 'Story Mode', price: 120, status: 'Active', platform: 'PS5 / PC', isFeatured: true, image: '/images/story/gta-5.webp' },
  { id: 'g2', title: 'Red Dead Redemption 2', category: 'Story Mode', price: 120, status: 'Active', platform: 'PS5', isFeatured: true, image: '/images/story/rdr2.webp' },
  { id: 'g3', title: 'God of War Ragnarök', category: 'Story Mode', price: 120, status: 'Active', platform: 'PS5', isFeatured: true, image: '/images/story/god-of-war-ragnarok.webp' },
  { id: 'g4', title: 'WWE 2K24', category: 'Multiplayer', price: 100, status: 'Active', platform: 'PS5 / PS4', isFeatured: false, image: '/images/coop/wwe2k24.webp' },
  { id: 'g5', title: 'Tekken 8', category: 'Multiplayer', price: 100, status: 'Active', platform: 'PS5', isFeatured: true, image: '/images/coop/tekken8.webp' },
  { id: 'g6', title: 'Forza Horizon 5', category: 'Racing', price: 125, status: 'Active', platform: 'Sim Racing Rig', isFeatured: true, image: '/images/racing/forza-horizon-5.webp' },
  { id: 'g7', title: 'NFS Heat', category: 'Racing', price: 100, status: 'Active', platform: 'Sim Racing Rig', isFeatured: false, image: '/images/racing/nfs-heat.webp' },
  { id: 'g8', title: 'Horizon Forbidden West VR', category: 'VR', price: 150, status: 'Active', platform: 'PS VR2', isFeatured: true, image: '/images/story/ghost-of-tsushima.webp' }
];

const INITIAL_SNACKS = [
  { id: 's1', title: 'Masala Fries', category: 'Snacks', price: 80, stock: 25, status: 'Available', image: '/images/snack-fries.jpg' },
  { id: 's2', title: 'Chicken Popcorn', category: 'Snacks', price: 120, stock: 18, status: 'Available', image: '/images/snack-chicken.jpg' },
  { id: 's3', title: 'Veg Sandwich', category: 'Snacks', price: 60, stock: 20, status: 'Available', image: '/images/snack-sandwich.jpg' },
  { id: 's4', title: 'Cold Coffee', category: 'Drinks', price: 90, stock: 15, status: 'Available', image: '/images/drink-coffee.jpg' },
  { id: 's5', title: 'Energetic Drink', category: 'Drinks', price: 150, stock: 30, status: 'Available', image: '/images/drink-energy.jpg' },
  { id: 's6', title: 'Water Bottle', category: 'Drinks', price: 20, stock: 50, status: 'Available', image: '/images/drink-water.jpg' }
];

const INITIAL_GALLERY = [
  { id: 'img1', title: 'PS5 Main Arena', category: 'Arena', url: '/images/gallery/setup-1.webp' },
  { id: 'img2', title: 'Sim Racing Cockpit', category: 'Simulators', url: '/images/gallery/setup-2.webp' },
  { id: 'img3', title: 'PS VR2 Experience Zone', category: 'VR', url: '/images/gallery/setup-3.webp' },
  { id: 'img4', title: 'VIP Couch Lounge', category: 'VIP Lounge', url: '/images/gallery/setup-4.webp' },
  { id: 'img5', title: 'Retro PS2 Corner', category: 'Consoles', url: '/images/gallery/setup-5.webp' },
  { id: 'img6', title: 'Night Cyber Lounge', category: 'Arena', url: '/images/gallery/setup-6.webp' }
];

const INITIAL_WEBSITE_CONTENT = {
  hero: {
    title: 'CHENNAI\'S PREMIER LUXURY CYBERPUNK GAMING LOUNGE',
    subtitle: 'Experience Next-Gen Gaming on PS5, PS VR2 & Simulators',
    ctaText: 'RESERVE SESSION NOW'
  },
  about: {
    title: 'About G-FORCE Gaming Cafe',
    description: 'We offer state-of-the-art gaming stations, high-refresh 4K HDR displays, ergonomic secretlab seating, and premium snacks for non-stop gaming action.'
  },
  pricing: {
    ps5Rate: '₹100 / hr',
    ps4Rate: '₹80 / hr',
    ps2Rate: '₹60 / hr',
    vrRate: '₹100 / 20m',
    racingRate: '₹100 / 30m'
  },
  contact: {
    address: '2, Kanniyamman Kovil Street, Raghavendra Nagar, Nesapakkam, Chennai, Greater Chennai, Tamil Nadu – 600078',
    phone: '+91 9344176534',
    email: 'gforcegaminghub@gmail.com',
    mapsLink: 'https://maps.google.com/?q=2,+Kanniyamman+Kovil+Street,+Raghavendra+Nagar,+Nesapakkam,+Chennai,+Tamil+Nadu+600078'
  },
  hours: {
    weekday: 'Mon - Fri: 10:00 AM - 11:00 PM',
    weekend: 'Sat - Sun: 09:30 AM - 11:30 PM'
  },
  seo: {
    metaTitle: 'G-FORCE Gaming Hub | Premier Cyberpunk Gaming Lounge in Chennai',
    metaDescription: 'Book PS5, PS VR2, PS4, PS2 & Racing Simulators at G-FORCE Gaming Hub in Nesapakkam, Chennai.'
  }
};

const INITIAL_ACTIVITIES = [];

const INITIAL_SETTINGS = {
  cafeName: 'G-FORCE GAMING HUB',
  tagline: 'Level Up Your Experience',
  address: '2, Kanniyamman Kovil Street, Raghavendra Nagar, Nesapakkam, Chennai, Greater Chennai, Tamil Nadu – 600078',
  phone: '+91 9344176534',
  whatsapp: '+91 9344176534',
  email: 'gforcegaminghub@gmail.com',
  googleMapsLink: 'https://maps.google.com/?q=2,+Kanniyamman+Kovil+Street,+Raghavendra+Nagar,+Nesapakkam,+Chennai,+Tamil+Nadu+600078',
  logoUrl: '/images/logo/gforcehub-logo.jpg'
};

function getItem(key, defaultData) {
  try {
    const val = /* TODO: Supabase Replace */ localStorage.getItem(key);
    if (!val) {
      /* TODO: Supabase Replace */ localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(val);
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return defaultData;
  }
}

function setItem(key, data) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (e) {
    console.error(`Error writing ${key} to localStorage:`, e);
  }
}

export const adminDataService = {
  // --- GAMES ---
  async getGames() {
    return getItem(STORAGE_KEYS.GAMES, INITIAL_GAMES);
  },
  async saveGame(gameData) {
    const games = getItem(STORAGE_KEYS.GAMES, INITIAL_GAMES);
    let updated;
    if (gameData.id) {
      updated = games.map(g => g.id === gameData.id ? { ...g, ...gameData } : g);
    } else {
      const newGame = { ...gameData, id: 'g_' + Date.now() };
      updated = [newGame, ...games];
    }
    setItem(STORAGE_KEYS.GAMES, updated);
    this.addActivity('GAME_UPDATED', gameData.id ? 'Game Updated' : 'Game Added', `Game "${gameData.title}" saved`);
    return updated;
  },
  async deleteGame(id) {
    const games = getItem(STORAGE_KEYS.GAMES, INITIAL_GAMES);
    const updated = games.filter(g => g.id !== id);
    setItem(STORAGE_KEYS.GAMES, updated);
    this.addActivity('GAME_DELETED', 'Game Removed', `Game ID ${id} deleted`);
    return updated;
  },

  // --- SNACKS ---
  async getSnacks() {
    return getItem(STORAGE_KEYS.SNACKS, INITIAL_SNACKS);
  },
  async saveSnack(itemData) {
    const items = getItem(STORAGE_KEYS.SNACKS, INITIAL_SNACKS);
    let updated;
    if (itemData.id) {
      updated = items.map(s => s.id === itemData.id ? { ...s, ...itemData } : s);
    } else {
      const newItem = { ...itemData, id: 's_' + Date.now() };
      updated = [newItem, ...items];
    }
    setItem(STORAGE_KEYS.SNACKS, updated);
    this.addActivity('SNACK_UPDATED', 'Snack Inventory Updated', `Item "${itemData.title}" saved`);
    return updated;
  },
  async deleteSnack(id) {
    const items = getItem(STORAGE_KEYS.SNACKS, INITIAL_SNACKS);
    const updated = items.filter(s => s.id !== id);
    setItem(STORAGE_KEYS.SNACKS, updated);
    return updated;
  },

  // --- GALLERY ---
  async getGallery() {
    return getItem(STORAGE_KEYS.GALLERY, INITIAL_GALLERY);
  },
  async addGalleryImage(imgData) {
    const images = getItem(STORAGE_KEYS.GALLERY, INITIAL_GALLERY);
    const newImg = { ...imgData, id: 'img_' + Date.now() };
    const updated = [newImg, ...images];
    setItem(STORAGE_KEYS.GALLERY, updated);
    this.addActivity('GALLERY_UPDATED', 'Gallery Updated', `Uploaded "${imgData.title}"`);
    return updated;
  },
  async deleteGalleryImage(id) {
    const images = getItem(STORAGE_KEYS.GALLERY, INITIAL_GALLERY);
    const updated = images.filter(img => img.id !== id);
    setItem(STORAGE_KEYS.GALLERY, updated);
    return updated;
  },

  // --- WEBSITE CONTENT ---
  async getWebsiteContent() {
    return getItem(STORAGE_KEYS.WEBSITE, INITIAL_WEBSITE_CONTENT);
  },
  async updateWebsiteContent(section, data) {
    const current = getItem(STORAGE_KEYS.WEBSITE, INITIAL_WEBSITE_CONTENT);
    const updated = { ...current, [section]: { ...current[section], ...data } };
    setItem(STORAGE_KEYS.WEBSITE, updated);
    this.addActivity('WEBSITE_UPDATED', 'Website Content Updated', `Updated section: ${section}`);
    return updated;
  },

  // --- ACTIVITIES ---
  async getActivities() {
    return getItem(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
  },
  async addActivity(type, title, detail) {
    const activities = getItem(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
    const now = new Date();
    const newAct = {
      id: 'act_' + Date.now(),
      type,
      title,
      detail,
      time: 'Just now',
      date: now.toISOString().split('T')[0]
    };
    const updated = [newAct, ...activities];
    setItem(STORAGE_KEYS.ACTIVITIES, updated);
    return updated;
  },

  // --- SETTINGS ---
  async getSettings() {
    const { settingsService } = await import('./settingsService');
    const settings = await settingsService.getSetting('business_information');
    
    // Fallback if settings are completely empty
    if (!settings || Object.keys(settings).length === 0) {
       return INITIAL_SETTINGS;
    }
    return settings;
  },

  async updateSettings(newSettings) {
    const { settingsService } = await import('./settingsService');
    await settingsService.updateSetting('business_information', newSettings);
    this.addActivity('SETTINGS_UPDATED', 'Settings Updated', 'Cafe general settings saved');
    return newSettings;
  },

  // --- RESET SYSTEM DATA ---
  async resetAllData() {
    try {
      // Define all transactional tables that must be wiped clean for a fresh start.
      const tablesToClear = [
        'walkin_sessions', 
        'cafe_orders', 
        'cafe_daily_archives',
        'bookings', 
        'activity_logs'
      ];

      // Delete transactional data from Supabase DB explicitly checking for errors
      for (const table of tablesToClear) {
        const { error } = await supabase.from(table).delete().not('id', 'is', null);
        if (error) {
          // Note: If table doesn't exist, we skip rather than fail the entire reset.
          const msg = error.message?.toLowerCase() || '';
          if (!msg.includes('does not exist') && !msg.includes('could not find the table')) {
            throw new Error(`Failed to clear table ${table}: ${error.message}`);
          }
        }
      }

      try {
        const { cafeArchiveService } = await import('./cafeArchiveService.js');
        if (cafeArchiveService && cafeArchiveService.clearArchives) {
          cafeArchiveService.clearArchives();
        }
      } catch (e) {}

      if (typeof localStorage !== 'undefined') {
        // Reset active station indicators in localStorage (keeping the devices list intact)
        const stations = JSON.parse(localStorage.getItem('gforce_pos_stations_v6') || '[]');
        const clearedStations = stations.map(s => ({
          ...s,
          status: 'AVAILABLE',
          currentSessionId: null,
          bookingIdRef: null,
          customerName: null,
          phone: null,
          startTime: null,
          durationMinutes: 0,
          price: 0,
          currentAmount: 0,
          type: null,
          paymentMethod: null,
          playersCount: 0,
          controllersUsed: 0,
          players: [],
          snackOrders: [],
          snackTotal: 0,
          isPaused: false,
          pausedAt: null,
          totalPausedMs: 0,
          bookedDuration: '00:00:00',
          notes: '',
          alert5MinTriggered: false,
          alert0MinTriggered: false,
          pricingSnapshot: null,
          memberDiscountInfo: null,
          sessionCode: null
        }));
        localStorage.setItem('gforce_pos_stations_v6', JSON.stringify(clearedStations));

        // Clear legacy local storage caches & revenue keys
        localStorage.removeItem('gforce_walkin_sessions');
        localStorage.removeItem('gforce_cafe_orders_v2');
        localStorage.removeItem('gforce_historical_reports_prod');
        localStorage.removeItem('gforce_cafe_daily_archives_prod');
        localStorage.removeItem('gforce_pos_revenue_prod');
        localStorage.removeItem('gforce_pos_revenue_v6');
        localStorage.setItem('gforce_business_day_state', 'OPEN');
        localStorage.setItem('gforce_operational_date', sessionService.getBusinessDate(new Date()));
      }
      
      // Restore the generated demo dataset so reset lands on a populated
      // panel rather than a set of empty screens.
      if (typeof supabase.reseedDemoData === 'function') {
        supabase.reseedDemoData();
      }

      // Seed a fresh activity
      const now = new Date();
      const resetActivity = [{
        id: 'act_' + Date.now(),
        type: 'SYSTEM_RESET',
        title: 'ERP Reset',
        detail: 'Transactional data cleared and demo dataset restored',
        time: 'Just now',
        date: now.toISOString().split('T')[0]
      }];
      setItem(STORAGE_KEYS.ACTIVITIES, resetActivity);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gforce_dashboard_updated'));
        window.dispatchEvent(new CustomEvent('gforce_session_changed', { detail: { eventType: 'RESEED' } }));
        window.dispatchEvent(new CustomEvent('gforce_order_updated', { detail: { eventType: 'RESEED' } }));
      }

      return true;
    } catch (e) {
      console.error('Error executing Reset All Data:', e);
      throw e;
    }
  }
};
