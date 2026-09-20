import { supabase } from './supabase.js';

class SettingsService {
  constructor() {
    this.cache = new Map();
    this.isCacheValid = false;
  }

  async getAllSettings() {
    if (this.isCacheValid && this.cache.size > 0) {
      return Object.fromEntries(this.cache);
    }

    try {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      
      this.cache.clear();
      data.forEach(item => {
        this.cache.set(item.setting_key, item.setting_value);
      });
      this.isCacheValid = true;
      
      return Object.fromEntries(this.cache);
    } catch (err) {
      console.error("Failed to fetch settings from Supabase:", err);
      return {}; // Fallback empty or default
    }
  }

  async getSetting(key) {
    if (this.isCacheValid && this.cache.has(key)) {
      return this.cache.get(key);
    }

    try {
      const { data, error } = await supabase
        .from('settings')
        .select('setting_value')
        .eq('setting_key', key)
        .limit(1);
        
      if (error) throw error;
      const val = data && data.length > 0 ? data[0].setting_value : {};
      this.cache.set(key, val);
      return val;
    } catch (err) {
      console.warn(`Failed to fetch setting ${key}, returning empty object.`, err);
      return {};
    }
  }

  async updateSetting(key, value) {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert(
          { setting_key: key, setting_value: value },
          { onConflict: 'setting_key' }
        );
        
      if (error) throw error;
      
      // Update cache
      this.cache.set(key, value);
      return true;
    } catch (err) {
      console.error(`Failed to update setting ${key}:`, err);
      return false;
    }
  }

  invalidateCache() {
    this.isCacheValid = false;
    this.cache.clear();
  }
}

export const settingsService = new SettingsService();
