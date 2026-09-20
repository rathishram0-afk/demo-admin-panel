import { supabase } from './supabase.js';
import { sortDevicesByCentralizedOrder } from '../utils/deviceOrder.js';

const INITIAL_DEVICES = [
  { device_code: 'PS5-1', device_name: 'PS5 - 1', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 1, image_url: '/admin/ps5-admin.webp' },
  { device_code: 'PS5-2', device_name: 'PS5 - 2', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 2, image_url: '/admin/ps5-admin.webp' },
  { device_code: 'PS5-3', device_name: 'PS5 - 3', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 3, image_url: '/admin/ps5-admin.webp' },
  { device_code: 'PS5-4', device_name: 'PS5 - 4', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 4, image_url: '/admin/ps5-admin.webp' },
  { device_code: 'PS5-1-EXTRA', device_name: 'PS5 - 1 EXTRA PERSON', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 5, image_url: '/admin/ps5-admin.webp' },
  { device_code: 'PS5-2-EXTRA', device_name: 'PS5 - 2 EXTRA PERSON', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 6, image_url: '/admin/ps5-admin.webp' },
  { device_code: 'PS5-3-EXTRA', device_name: 'PS5 - 3 EXTRA PERSON', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 7, image_url: '/admin/ps5-admin.webp' },
  { device_code: 'PS5-4-EXTRA', device_name: 'PS5 - 4 EXTRA PERSON', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 8, image_url: '/admin/ps5-admin.webp' },
  { device_code: 'PS4-1', device_name: 'PS4 - 1', zone: 'PlayStation 4', category: 'PlayStation 4', platform: 'PlayStation 4', status: 'AVAILABLE', is_active: true, display_order: 9, image_url: '/admin/ps4-admin.webp' },
  { device_code: 'PS4-2', device_name: 'PS4 - 2', zone: 'PlayStation 4', category: 'PlayStation 4', platform: 'PlayStation 4', status: 'AVAILABLE', is_active: true, display_order: 10, image_url: '/admin/ps4-admin.webp' },
  { device_code: 'PS4-3', device_name: 'PS4 - 3', zone: 'PlayStation 4', category: 'PlayStation 4', platform: 'PlayStation 4', status: 'AVAILABLE', is_active: true, display_order: 11, image_url: '/admin/ps4-admin.webp' },
  { device_code: 'PS4-4', device_name: 'PS4 - 4', zone: 'PlayStation 4', category: 'PlayStation 4', platform: 'PlayStation 4', status: 'AVAILABLE', is_active: true, display_order: 12, image_url: '/admin/ps4-admin.webp' },
  { device_code: 'PS2-1', device_name: 'PS2 - 1', zone: 'PlayStation 2', category: 'PlayStation 2', platform: 'PlayStation 2', status: 'AVAILABLE', is_active: true, display_order: 13, image_url: '/admin/ps2-admin.webp' },
  { device_code: 'SIM-1', device_name: 'SIM - 1', zone: 'Racing Simulator', category: 'Racing Simulator', platform: 'Racing Simulator', status: 'AVAILABLE', is_active: true, display_order: 14, image_url: '/admin/sim1-admin.webp' },
  { device_code: 'VR-1', device_name: 'VR - 1', zone: 'PS VR2', category: 'PS VR2', platform: 'PS VR2', status: 'AVAILABLE', is_active: true, display_order: 15, image_url: '/admin/vr-admin.webp' }
];

export const deviceService = {
  _isSeedFailing: false,
  _cachedDevices: null,

  async seedDatabase() {
    try {
      if (this._isSeedFailing) return;
      const { data: existing, error: checkError } = await supabase
        .from('devices')
        .select('id')
        .limit(1);
        
      if (checkError) {
        console.warn("Could not check devices table for seeding:", checkError.message || checkError);
        return;
      }

      if (!existing || existing.length === 0) {
        console.log("Seeding initial devices into Supabase...");
        const { error: insertError } = await supabase
          .from('devices')
          .insert(INITIAL_DEVICES);
          
        if (insertError) {
          console.error("Seed insert error:", insertError.message || insertError);
          this._isSeedFailing = true; // Stop spamming if RLS fails
        } else {
          console.log("Devices successfully seeded to Supabase.");
          this._isSeedFailing = false;
        }
      }
    } catch (err) {
      console.error("Failed to seed devices:", err);
      this._isSeedFailing = true;
    }
  },

  async getDevices(forceRefresh = false) {
    if (!forceRefresh && this._cachedDevices) return sortDevicesByCentralizedOrder(this._cachedDevices);
    
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error("Supabase getDevices error:", error.message || error);
        if (!this._isSeedFailing) await this.seedDatabase();
        return sortDevicesByCentralizedOrder(this._cachedDevices || INITIAL_DEVICES);
      }

      if (!data || data.length === 0) {
        if (!this._isSeedFailing) {
          console.log("No devices found in Supabase. Auto-seeding initial devices...");
          await this.seedDatabase();
          const { data: seededData } = await supabase.from('devices').select('*').order('display_order', { ascending: true });
          if (seededData && seededData.length > 0) {
            const sortedSeeded = sortDevicesByCentralizedOrder(seededData);
            this._cachedDevices = sortedSeeded;
            return sortedSeeded;
          }
        }
        return sortDevicesByCentralizedOrder(INITIAL_DEVICES);
      }

      const sortedData = sortDevicesByCentralizedOrder(data);
      this._cachedDevices = sortedData;
      return sortedData;
    } catch (err) {
      console.error("Failed to fetch devices from Supabase:", err);
      return sortDevicesByCentralizedOrder(INITIAL_DEVICES);
    }
  },

  async createDevice(deviceData) {
    try {
      const { data: existingRecords } = await supabase
        .from('devices')
        .select('id')
        .eq('device_code', deviceData.device_code)
        .limit(1);
        
      if (existingRecords && existingRecords.length > 0) {
        throw new Error(`Device code '${deviceData.device_code}' already exists.`);
      }

      const { data, error } = await supabase
        .from('devices')
        .insert([deviceData])
        .select();

      if (error) throw error;
      return data?.[0] || deviceData;
    } catch (err) {
      console.error("Failed to create device:", err);
      throw err;
    }
  },

  async updateDevice(id, updates) {
    try {
      if (updates.device_code) {
        const { data: existingRecords } = await supabase
          .from('devices')
          .select('id')
          .eq('device_code', updates.device_code)
          .neq('id', id)
          .limit(1);
          
        if (existingRecords && existingRecords.length > 0) {
          throw new Error(`Device code '${updates.device_code}' already exists.`);
        }
      }

      const { data, error } = await supabase
        .from('devices')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data?.[0] || updates;
    } catch (err) {
      console.error("Failed to update device:", err);
      throw err;
    }
  },

  async deleteDevice(id) {
    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Failed to delete device:", err);
      throw err;
    }
  },

  async toggleStatus(id, newStatus) {
    try {
      const validStatuses = ['AVAILABLE', 'BUSY', 'RUNNING', 'MAINTENANCE', 'OFFLINE'];
      const statusToSet = validStatuses.includes(newStatus.toUpperCase()) ? newStatus.toUpperCase() : 'AVAILABLE';
      
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      const query = supabase.from('devices').update({ status: statusToSet });
      
      const { data, error } = await (isUuid ? query.eq('id', id) : query.eq('device_code', id)).select();

      if (error) throw error;
      if (this._cachedDevices && Array.isArray(this._cachedDevices)) {
        this._cachedDevices = this._cachedDevices.map(d => {
          if (d.id === id || d.device_code === id) {
            return { ...d, status: statusToSet };
          }
          return d;
        });
      }
      return data;
    } catch (err) {
      console.error("Failed to toggle device status:", err);
      throw err;
    }
  },

  async toggleActive(id, isActive) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      const query = supabase.from('devices').update({ is_active: isActive });
      
      const { data, error } = await (isUuid ? query.eq('id', id) : query.eq('device_code', id)).select();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Failed to toggle device active state:", err);
      throw err;
    }
  },

  async getAvailableDevices() {
    const devices = await this.getDevices();
    return devices.filter(d => d.status === 'AVAILABLE' && d.is_active !== false);
  },

  async getBusyDevices() {
    const devices = await this.getDevices();
    return devices.filter(d => d.status === 'BUSY' || d.status === 'ACTIVE' || d.status === 'RUNNING' || d.status === 'ENDING_SOON');
  },

  async getMaintenanceDevices() {
    const devices = await this.getDevices();
    return devices.filter(d => d.status === 'MAINTENANCE');
  }
};
