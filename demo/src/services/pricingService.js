import { supabase } from './supabase';
import { PRICING_DATA } from '../data/gamingData';

/**
 * Service to manage pricing settings from the highly structured Supabase SQL table
 * keeping the output nested JSON format identical to what the UI components expect.
 */
const getConsoleImage = (platform, fallback) => {
  const p = String(platform || '').toUpperCase();
  if (p === 'PS2' || p.includes('PS2') || p.includes('PLAYSTATION 2')) return '/images/gaming/ps2.webp';
  if (p === 'PS4' || p.includes('PS4') || p.includes('PLAYSTATION 4')) return '/images/gaming/ps4.webp';
  if (p === 'PS5' || p.includes('PS5') || p.includes('PLAYSTATION 5')) return '/images/gaming/ps5.webp';
  if (p.includes('VR')) return '/images/gaming/psvr2.webp';
  if (p.includes('SIM') || p.includes('RACING')) return '/images/gaming/racing-simulator.webp';
  return fallback || '/images/gaming/ps5.webp';
};

export const pricingService = {

  /**
   * Fetch all pricing from Supabase and map to nested `{ weekdays: [], weekends: [] }` structure
   */
  async getPricing() {
    try {
      const { data, error } = await supabase
        .from('pricing_settings')
        .select('*')
        .order('display_order', { ascending: true })
        .order('id', { ascending: true }); // Secondary sort for stable order

      if (error) {
        console.error('[pricingService] Supabase getPricing error:', error.message);
        throw error;
      }

      if (!data || data.length === 0) {
        return null; // Signals that we need to seed
      }

      // Convert flat rows back to nested JSON
      const nestedPricing = { weekdays: [], weekends: [] };

      // Helper to process rows per category
      const processCategory = (cat) => {
        const mapPlatform = (name) => {
          const n = String(name || '').toUpperCase().trim();
          if (n.includes('PS2') || n.includes('PLAYSTATION 2')) return 'PS2';
          if (n.includes('PS4') || n.includes('PLAYSTATION 4')) return 'PS4';
          if (n.includes('PS5') || n.includes('PLAYSTATION 5')) return 'PS5';
          if (n.includes('VR')) return 'PS VR2';
          if (n.includes('SIM') || n.includes('RACING')) return 'RACING SIMULATOR';
          return n;
        };

        const allowed = ["PS2", "PS4", "PS5", "PS VR2", "RACING SIMULATOR"];
        const catRows = data.filter(r => {
          if (r.category !== cat) return false;
          const mapped = mapPlatform(r.platform);
          return allowed.includes(mapped);
        });
        
        // Group by platform
        const platformMap = new Map();
        catRows.forEach(row => {
          const displayPlatform = mapPlatform(row.platform);
          const platKey = displayPlatform;
          
          if (!platformMap.has(platKey)) {
            platformMap.set(platKey, {
              platform: displayPlatform,
              fullTitle: displayPlatform,
              badge: displayPlatform,
              description: '', 
              image: getConsoleImage(displayPlatform, row.image_url),
              rates: [],
              accent: 'blue',
              _order: row.display_order
            });
          }
          
          const existingRate = platformMap.get(platKey).rates.find(r => 
            String(r.hours).toUpperCase().trim() === String(row.duration).toUpperCase().trim()
          );
          if (!existingRate) {
            platformMap.get(platKey).rates.push({
              hours: row.duration,
              price: row.currency + row.price
            });
          }
        });

        // 1. Sort Rates strictly by duration sequence
        const durationOrder = [
          "20 MINUTES", "30 MINUTES", "40 MINUTES", 
          "1 HOUR", "1.5 HOURS", "2 HOURS", "3 HOURS"
        ];
        
        const platformArray = Array.from(platformMap.values());
        platformArray.forEach(p => {
          p.rates.sort((a, b) => {
            const idxA = durationOrder.indexOf(String(a.hours).toUpperCase().trim());
            const idxB = durationOrder.indexOf(String(b.hours).toUpperCase().trim());
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return 0;
          });
        });

        // 2. Sort Platforms strictly by requested sequence
        const platformOrder = ["PS2", "PS4", "PS5", "PS VR2", "RACING SIMULATOR"];
        
        platformArray.sort((a, b) => {
          const idxA = platformOrder.indexOf(String(a.platform).toUpperCase().trim());
          const idxB = platformOrder.indexOf(String(b.platform).toUpperCase().trim());
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a._order - b._order; // Fallback to DB display_order
        });
        
        return platformArray;
      };

      // Enhance with static metadata (description, accent, fullTitle) to keep UI beautiful
      const enhanceWithStaticData = (reconstructedPlatforms, category) => {
        return reconstructedPlatforms.map(plat => {
          const staticPlat = PRICING_DATA[category]?.find(p => p.platform === plat.platform);
          return {
            ...plat,
            fullTitle: staticPlat?.fullTitle || plat.fullTitle,
            description: staticPlat?.description || plat.description,
            accent: staticPlat?.accent || plat.accent,
            image: getConsoleImage(plat.platform, staticPlat?.image || plat.image)
          };
        });
      };

      nestedPricing.weekdays = enhanceWithStaticData(processCategory('weekdays'), 'weekdays');
      nestedPricing.weekends = enhanceWithStaticData(processCategory('weekends'), 'weekends');

      return nestedPricing;

    } catch (err) {
      console.error('[pricingService] Failed to load pricing from Supabase:', err);
      throw err;
    }
  },

  /**
   * Flattens nested pricing JSON to rows and bulk upserts into Supabase
   */
  async savePricingBulk(nestedData) {
    try {
      const rowsToUpsert = [];

      const mapPlatform = (name) => {
        const n = String(name || '').toUpperCase().trim();
        if (n.includes('PS2') || n.includes('PLAYSTATION 2')) return 'PS2';
        if (n.includes('PS4') || n.includes('PLAYSTATION 4')) return 'PS4';
        if (n.includes('PS5') || n.includes('PLAYSTATION 5')) return 'PS5';
        if (n.includes('VR')) return 'PS VR2';
        if (n.includes('SIM') || n.includes('RACING')) return 'RACING SIMULATOR';
        return n;
      };

      const processTier = (tierData, category) => {
        if (!tierData) return;
        tierData.forEach((device, dIdx) => {
          const displayPlatform = mapPlatform(device.platform);
          device.rates.forEach((rate) => {
            const numPrice = parseInt(String(rate.price).replace(/[^0-9]/g, ''), 10) || 0;
            rowsToUpsert.push({
              category: category,
              platform: displayPlatform,
              plan_name: rate.hours,
              duration: rate.hours,
              price: numPrice,
              currency: '₹',
              display_order: dIdx,
              is_active: true,
              image_url: getConsoleImage(displayPlatform, device.image)
            });
          });
        });
      };

      processTier(nestedData.weekdays, 'weekdays');
      processTier(nestedData.weekends, 'weekends');

      const { error } = await supabase
        .from('pricing_settings')
        .upsert(rowsToUpsert, { onConflict: 'category, platform, plan_name' });

      if (error) {
        console.error('[pricingService] Supabase bulk upsert error:', error.message);
        throw error;
      }

      return true;
    } catch (err) {
      console.error('[pricingService] Failed to persist pricing to Supabase:', err);
      throw err;
    }
  },

  /**
   * Seeds default pricing if the table is empty
   */
  async seedPricing() {
    try {
      const existing = await this.getPricing();
      if (!existing) {
        console.log('[pricingService] No pricing found in Supabase. Seeding defaults...');
        await this.savePricingBulk(PRICING_DATA);
        return PRICING_DATA;
      }
      return existing;
    } catch (err) {
      console.error('[pricingService] Seeding failed:', err);
      throw err;
    }
  }

};
