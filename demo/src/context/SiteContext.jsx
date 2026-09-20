import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { pricingService } from '../services/pricingService';
import { gameLibraryService } from '../services/gameLibraryService';
import { cafeMenuService } from '../services/cafeMenuService';
import { 
  PRICING_DATA, 
  GAME_COLLECTIONS, 
  CONTACT_DETAILS, 
  WHY_CHOOSE_US, 
  FAQS,
  MENU_DATA
} from '../data/gamingData';

// Default CMS values built from the current hardcoded UI components
const DEFAULT_CMS = {
  heroTitle: "PLAY. COMPETE. CONQUER.",
  heroSubtitle: "Experience the next generation of gaming in Chennai.",
  heroBanner: "/images/hero/neon-bg.jpg",
  contact: CONTACT_DETAILS,
  whyChooseUs: WHY_CHOOSE_US,
  faqs: FAQS
};

const SiteContext = createContext();

export function SiteProvider({ children }) {
  // --- STATES WITH STATIC FALLBACKS ---
  const [pricing, setPricing] = useState(PRICING_DATA);
  const [cms, setCms] = useState(DEFAULT_CMS);
  const [games, setGames] = useState(GAME_COLLECTIONS);
  const [menu, setMenu] = useState(MENU_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLatestFromSupabase = async () => {
    try {
      const { data, error: dbErr } = await supabase
        .from('website_content')
        .select('*');

      if (dbErr) {
        console.error('[DEBUG] Supabase fetch error:', dbErr.message);
        throw dbErr;
      }

      // 1. Fetch generic content (CMS)
      if (data && data.length > 0) {
        data.forEach(row => {
          if (row.key === 'cms') setCms(row.value);
        });
      }

      // 2. Fetch Structured Pricing
      let loadedPricing = await pricingService.getPricing();
      if (!loadedPricing) {
        loadedPricing = await pricingService.seedPricing();
      }
      setPricing(loadedPricing);

      // 3. Fetch Structured Game Library
      let loadedGames = await gameLibraryService.getGames();
      if (!loadedGames) {
        loadedGames = await gameLibraryService.seedDatabase();
      }
      setGames(loadedGames);

      // 4. Fetch Structured Cafe Menu
      let loadedMenu = await cafeMenuService.getMenuItems();
      if (!loadedMenu) {
        loadedMenu = await cafeMenuService.seedDatabase();
      }
      setMenu(loadedMenu);
    } catch (err) {
      console.error('Failed to load website content from Supabase.', err);
      // Removed all localStorage fallbacks to ensure strict production compliance
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestFromSupabase();
  }, []);

  // --- UPDATE METHODS ---
  // These are called by the Admin Panel to save changes globally.

  const updatePricing = async (newData) => {
    setPricing(newData);
    

    try {
      await pricingService.savePricingBulk(newData);
    } catch (err) {
      console.error('Failed to persist pricing to Supabase:', err);
      throw err;
    }

    // Sync to POS pricing database
    try {
      const posSettings = {
        pricingMode: 'AUTO',
        weekday: {},
        weekend: {}
      };

      const parseRates = (platformList) => {
        const result = {};
        platformList.forEach(plat => {
          const ratesMap = {};
          plat.rates.forEach(r => {
            const priceVal = parseInt(String(r.price).replace(/[^0-9]/g, ''), 10) || 0;
            const hoursLabel = String(r.hours).toUpperCase();
            const mins = hoursLabel.includes('MINUTE') ? parseInt(hoursLabel.split(' ')[0], 10) :
                         hoursLabel.includes('1.5 HOURS') ? 90 :
                         hoursLabel.includes('1 HOUR') ? 60 :
                         hoursLabel.includes('2 HOUR') ? 120 :
                         hoursLabel.includes('3 HOUR') ? 180 :
                         parseFloat(hoursLabel) * 60;
            ratesMap[mins] = priceVal;
          });
          result[plat.platform] = ratesMap;
        });
        return result;
      };

      posSettings.weekday = parseRates(newData.weekdays || []);
      posSettings.weekend = parseRates(newData.weekends || []);

      const { sessionService } = await import('../services/sessionService');
      await sessionService.updatePricingSettings(posSettings);
    } catch (e) {
      console.error('Error syncing Website to POS pricing', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gforce-pricing-updated', { detail: newData }));
    }
  };

  const updateCms = async (newData) => {
    setCms(newData);
    
    try {
      const { error: dbErr } = await supabase
        .from('website_content')
        .upsert({ key: 'cms', value: newData }, { onConflict: 'key' });
      if (dbErr) {
        console.error('[DEBUG] Supabase updateCms error:', dbErr.message);
        throw dbErr;
      }
    } catch (err) {
      console.error('Failed to persist CMS to Supabase:', err);
      throw err;
    }
  };

  const updateGames = async (newData) => {
    // This is preserved only for legacy fallback (local storage), 
    // the UI will now save directly via gameLibraryService
    setGames(newData);
    
  };

  const updateMenu = async (newData) => {
    // This is preserved only for legacy fallback (local storage), 
    // the UI will now save directly via cafeMenuService
    setMenu(newData);
    
  };

  const resetAllToDefault = async () => {
    localStorage.removeItem('gforce_pricing');
    localStorage.removeItem('gforce_cms');
    localStorage.removeItem('gforce_games');
    localStorage.removeItem('gforce_menu');
    setPricing(PRICING_DATA);
    setCms(DEFAULT_CMS);
    setGames(GAME_COLLECTIONS);
    setMenu(MENU_DATA);

    try {
      const { error: dbErr } = await supabase
        .from('website_content')
        .delete()
        .in('key', ['pricing', 'cms', 'games', 'menu']);
      if (dbErr) throw dbErr;
    } catch (err) {
      console.error('[DEBUG] Supabase resetAllToDefault error:', err);
    }
  };

  return (
    <SiteContext.Provider
      value={{
        pricing,
        updatePricing,
        cms,
        updateCms,
        games,
        updateGames,
        menu,
        updateMenu,
        resetAllToDefault,
        loading,
        error,
        refresh: fetchLatestFromSupabase
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

// Custom hook to use the SiteContext easily in any component
export function useSiteContext() {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error("useSiteContext must be used within a SiteProvider");
  }
  return context;
}
