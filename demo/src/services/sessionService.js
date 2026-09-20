import { supabase } from './supabase.js';
import { deviceService } from './deviceService.js';
import { membershipService } from './membershipService.js';
import { sortDevicesByCentralizedOrder } from '../utils/deviceOrder.js';

const STORAGE_KEYS = {
  STATIONS: 'gforce_demo_pos_stations',
  REVENUE: 'gforce_demo_pos_revenue',
  WALKINS: 'gforce_demo_pos_walkins',
  ACTIVITIES: 'gforce_demo_pos_activities',
  SESSION_COUNTER: 'gforce_demo_pos_session_counter',
  NOTIFICATIONS: 'gforce_demo_pos_notifications',
  BOOKINGS: 'gforce_demo_pos_bookings',
  CONTROLLERS: 'gforce_demo_pos_controllers',
  PRICING: 'gforce_demo_pos_pricing',
  SOUND_SETTINGS: 'gforce_demo_pos_sound_settings'
};

let memoryStorageMap = new Map();

function safeStorageGet(key) {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch (e) {}
  return memoryStorageMap.get(key) || null;
}

function safeStorageSet(key, value) {
  memoryStorageMap.set(key, value);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch (e) {}
}

const DEFAULT_CONTROLLER_INVENTORY = {
  totalControllers: 20,
  maintenanceControllers: 0,
  brokenControllers: 0,
  reservedControllers: 0
};

const DEFAULT_PRICING_SETTINGS = {
  pricingMode: 'AUTO',
  weekday: {
    'PlayStation 5': { 30: 60, 60: 100, 120: 180, 180: 280 },
    'PlayStation 4': { 60: 80, 120: 150, 180: 220 },
    'PlayStation 2': { 60: 60, 120: 110, 180: 160 },
    'Racing Simulator': { 30: 100, 60: 180, 120: 250 },
    'PS VR2': { 20: 100, 40: 160, 60: 220 }
  },
  weekend: {
    'PlayStation 5': { 30: 60, 60: 100, 120: 200, 180: 280 },
    'PlayStation 4': { 60: 90, 120: 160, 180: 220 },
    'PlayStation 2': { 60: 70, 120: 120, 180: 160 },
    'Racing Simulator': { 30: 100, 60: 180, 120: 250 },
    'PS VR2': { 20: 100, 40: 160, 60: 220 }
  }
};

const DEFAULT_SOUND_SETTINGS = {
  masterVolume: 80,
  chimesEnabled: true,
  timerAlertsEnabled: true,
  sessionStartSound: true,
  sessionEndSound: true,
  snackAddedSound: true
};

export const DEVICE_DURATIONS = {
  'PlayStation 5': [
    { label: '30 Mins', minutes: 30 },
    { label: '1 Hour', minutes: 60 },
    { label: '2 Hours', minutes: 120 },
    { label: '3 Hours', minutes: 180 }
  ],
  'PlayStation 4': [
    { label: '1 Hour', minutes: 60 },
    { label: '2 Hours', minutes: 120 },
    { label: '3 Hours', minutes: 180 }
  ],
  'PlayStation 2': [
    { label: '1 Hour', minutes: 60 },
    { label: '2 Hours', minutes: 120 },
    { label: '3 Hours', minutes: 180 }
  ],
  'Racing Simulator': [
    { label: '30 Mins', minutes: 30 },
    { label: '1 Hour', minutes: 60 },
    { label: '2 Hours', minutes: 120 }
  ],
  'PS VR2': [
    { label: '20 Mins', minutes: 20 },
    { label: '40 Mins', minutes: 40 },
    { label: '1 Hour', minutes: 60 }
  ]
};

const memoryStorage = {};

function getItem(key, defaultValue) {
  try {
    if (typeof localStorage !== 'undefined') {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    }
    return key in memoryStorage ? JSON.parse(memoryStorage[key]) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function setItem(key, value) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      memoryStorage[key] = JSON.stringify(value);
    }
  } catch (e) {
    console.error(`Error saving ${key}:`, e);
  }
}

function isPlayStationCategory(station) {
  const cat = (station.category || station.zone || station.name || station.id || '').toLowerCase();
  return cat.includes('ps5') || cat.includes('ps4') || cat.includes('ps2') || cat.includes('playstation');
}

function resolveDeviceImage(device) {
  if (device.image_url && device.image_url.trim() !== '' && !device.image_url.includes('ps5-admin.webp')) {
    return device.image_url;
  }
  if (device.image && device.image.trim() !== '' && !device.image.includes('ps5-admin.webp')) {
    return device.image;
  }
  const str = (device.category || device.zone || device.platform || device.device_code || device.id || device.name || '').toLowerCase();
  if (str.includes('ps4') || str.includes('playstation 4')) return '/admin/ps4-admin.webp';
  if (str.includes('ps2') || str.includes('playstation 2')) return '/admin/ps2-admin.webp';
  if (str.includes('sim') || str.includes('racing')) return '/admin/sim1-admin.webp';
  if (str.includes('vr')) return '/admin/vr-admin.webp';
  return '/admin/ps5-admin.webp';
}

function playChime(type = 'generic') {
  if (typeof window === 'undefined') return;
  try {
    const settings = getItem(STORAGE_KEYS.SOUND_SETTINGS, DEFAULT_SOUND_SETTINGS);
    if (!settings.chimesEnabled) return;

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    const volumeLevel = (settings.masterVolume || 80) / 100;

    if (type === '5min') {
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(volumeLevel * 0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    } else if (type === '0min') {
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      gain.gain.setValueAtTime(volumeLevel * 0.6, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
    } else {
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      gain.gain.setValueAtTime(volumeLevel * 0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    }

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.8);
  } catch (e) {
    console.log('Audio chime prevented:', e);
  }
}

function getNextSessionId() {
  const curSeq = Number(getItem(STORAGE_KEYS.SESSION_COUNTER, 5)) || 5;
  const nextSeq = curSeq + 1;
  setItem(STORAGE_KEYS.SESSION_COUNTER, nextSeq);
  return `SES-${String(nextSeq).padStart(3, '0')}`;
}

export const sessionService = {
  calculatePeakHour(completedSessions, maxAllowedTime = new Date()) {
    if (!completedSessions || completedSessions.length === 0) return '--';
    const hourCounts = {};
    const hourRevenue = {};
    const now = maxAllowedTime;
    completedSessions.forEach(s => {
      const startTs = s.rawStartTime || s.startTime || s.start_time || s.createdAt;
      if (!startTs) return;
      const d = new Date(startTs);
      if (isNaN(d.getTime())) return;
      if (d > now) return;
      const h = d.getHours();
      hourCounts[h] = (hourCounts[h] || 0) + 1;
      hourRevenue[h] = (hourRevenue[h] || 0) + Number(s.totalAmount || s.total_amount || s.gamingCharge || 0);
    });
    const keys = Object.keys(hourCounts);
    if (keys.length === 0) return '--';
    let bestHour = -1;
    let maxCount = 0;
    let maxRev = -1;
    Object.entries(hourCounts).forEach(([hStr, count]) => {
      const h = parseInt(hStr, 10);
      const rev = hourRevenue[h] || 0;
      if (count > maxCount || (count === maxCount && rev > maxRev)) {
        maxCount = count;
        maxRev = rev;
        bestHour = h;
      }
    });
    if (bestHour < 0) return '--';
    const startH = bestHour % 12 || 12;
    const startAmPm = bestHour >= 12 ? 'PM' : 'AM';
    const endHourVal = (bestHour + 2) % 24;
    const endH = endHourVal % 12 || 12;
    const endAmPm = endHourVal >= 12 ? 'PM' : 'AM';
    return `${startH} ${startAmPm} - ${endH} ${endAmPm}`;
  },

  calculateMostUsedDevice(completedSessions) {
    if (!completedSessions || completedSessions.length === 0) return '--';
    const deviceCounts = {};
    completedSessions.forEach(s => {
      const devRaw = String(s.device || s.device_name || s.stationId || '').toUpperCase();
      let platform = 'Console';
      if (devRaw.includes('PS2')) platform = 'PS2';
      else if (devRaw.includes('PS4')) platform = 'PS4';
      else if (devRaw.includes('PS5')) platform = 'PS5';
      else if (devRaw.includes('VR') || devRaw.includes('PSVR')) platform = 'PSVR2';
      else if (devRaw.includes('SIM') || devRaw.includes('RACING') || devRaw.includes('WHEEL')) platform = 'Racing Simulator';
      else if (s.device || s.device_name) platform = s.device || s.device_name;
      deviceCounts[platform] = (deviceCounts[platform] || 0) + 1;
    });
    let mostUsed = '--';
    let maxCount = 0;
    Object.entries(deviceCounts).forEach(([dev, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostUsed = dev;
      }
    });
    return mostUsed;
  },

  mapStations(dbDevices, activeSessions) {
    const sessionsList = activeSessions || [];
    return (dbDevices || []).map(device => {
      const activeSession = sessionsList.find(s => 
        String(s.device_id) === String(device.device_code) || 
        String(s.device_id) === String(device.id) ||
        String(s.device_name) === String(device.device_name) ||
        String(s.device_name) === String(device.name) ||
        String(s.device_name) === String(device.device_code)
      );
      
      let maxC = 4;
      const cat = (device.category || device.zone || '').toLowerCase();
      if (cat.includes('ps2') || cat.includes('playstation 2')) maxC = 2;
      if (cat.includes('sim') || cat.includes('vr')) maxC = 1;
      
      const deviceImg = resolveDeviceImage(device);

      if (activeSession) {
        const now = Date.now();
        const startMs = new Date(activeSession.start_time).getTime();
        const isPausedSession = String(activeSession.session_status || '').toLowerCase() === 'paused';
        const isScheduled = startMs > now;
        const totalPlannedMins = Number(activeSession.planned_duration || 60) + Number(activeSession.extended_minutes || 0);

        let elapsedSecs = 0;
        let remainingSecs = 0;
        let isEndingSoon = false;
        let timeUntilStartSecs = 0;

        if (isScheduled) {
          timeUntilStartSecs = Math.max(0, Math.floor((startMs - now) / 1000));
        } else {
          elapsedSecs = Math.max(0, Math.floor((now - startMs) / 1000));
          if (isPausedSession && activeSession.expected_end_time) {
            const pauseStartMs = new Date(activeSession.expected_end_time).getTime();
            elapsedSecs = Math.max(0, Math.floor((pauseStartMs - startMs) / 1000));
          }
          remainingSecs = Math.max(0, (totalPlannedMins * 60) - elapsedSecs);
          isEndingSoon = remainingSecs <= 900 && remainingSecs > 0;
        }

        const pStatus = String(activeSession.payment_status || '').toLowerCase();
        const isPrepaidSession = activeSession.pricing_snapshot?.isPrepaid === true || pStatus === 'prepaid' || pStatus === 'paid';

        return {
          id: device.device_code || device.id,
          dbId: device.id,
          name: device.device_name || device.name || device.device_code,
          zone: device.zone || device.category || 'PlayStation 5',
          category: device.category || device.zone || 'PlayStation 5',
          status: isScheduled ? 'SCHEDULED' : 'RUNNING',
          currentSessionId: activeSession.session_code || activeSession.id,
          sessionId: activeSession.id,
          customerName: activeSession.customer_name,
          phone: activeSession.mobile_number,
          startTime: startMs,
          startTimeStr: new Date(activeSession.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          durationMinutes: totalPlannedMins,
          elapsedSeconds: elapsedSecs,
          remainingSeconds: remainingSecs,
          timeUntilStartSecs: timeUntilStartSecs,
          isEndingSoon: isEndingSoon,
          price: activeSession.gaming_charge || 0,
          currentAmount: activeSession.total_amount || 0,
          hourlyPrice: activeSession.hourly_price,
          type: 'Walk-in',
          paymentMethod: activeSession.payment_method,
          paymentStatus: isPrepaidSession ? 'PREPAID' : 'PAY_AT_CHECKOUT',
          isPrepaid: isPrepaidSession,
          playersCount: activeSession.player_count,
          controllersUsed: activeSession.player_count,
          controllersTotal: maxC,
          maxPlayers: maxC,
          players: [activeSession.customer_name],
          snackOrders: activeSession.snack_orders || [],
          snackTotal: activeSession.food_total || 0,
          isPaused: isPausedSession,
          pausedAt: isPausedSession ? activeSession.expected_end_time : null,
          totalPausedMs: 0,
          bookedDuration: '00:00:00',
          notes: '',
          image: deviceImg,
          pricingSnapshot: activeSession.pricing_snapshot,
          memberDiscountInfo: activeSession.member_discount_info,
          alert5MinTriggered: isEndingSoon,
          alert0MinTriggered: remainingSecs === 0,
          reservationInfo: null
        };
      }
        let fallbackStatus = device.status || 'AVAILABLE';
        if (['BUSY', 'RUNNING', 'ACTIVE', 'ENDING_SOON'].includes(String(fallbackStatus).toUpperCase())) {
          fallbackStatus = 'AVAILABLE';
          if (device.id) {
            deviceService.toggleStatus(device.id, 'AVAILABLE').catch(() => {});
          }
        }

        return {
          id: device.device_code || device.id,
          dbId: device.id,
          name: device.device_name || device.name || device.device_code,
          zone: device.zone || device.category || 'PlayStation 5',
          category: device.category || device.zone || 'PlayStation 5',
          status: fallbackStatus,
          currentSessionId: null,
          customerName: null,
          phone: null,
          startTime: null,
          durationMinutes: 0,
          elapsedSeconds: 0,
          remainingSeconds: 0,
          isEndingSoon: false,
          price: 0,
          hourlyPrice: 100,
          type: null,
          paymentMethod: null,
          playersCount: 0,
          controllersUsed: 0,
          controllersTotal: maxC,
          maxPlayers: maxC,
          players: [],
          snackOrders: [],
          snackTotal: 0,
          isPaused: false,
          pausedAt: null,
          totalPausedMs: 0,
          bookedDuration: '00:00:00',
          notes: '',
          image: deviceImg,
          pricingSnapshot: null,
          memberDiscountInfo: null,
          alert5MinTriggered: false,
          alert0MinTriggered: false,
        };
      });
      return sortDevicesByCentralizedOrder(mapped);
  },

  _cachedActiveSessions: null,
  _syncQueue: Promise.resolve(),
  _isSyncing: false,

  async _enqueueSync(task) {
    const promise = this._syncQueue.then(async () => {
      this._isSyncing = true;
      try {
        await task();
      } catch (err) {
        console.error("Background sync error:", err);
      } finally {
        this._isSyncing = false;
      }
    });
    this._syncQueue = promise.catch(() => {});
    return promise;
  },

  async waitForPendingSyncs() {
    if (this._isSyncing) return;
    await this._syncQueue;
  },

  async _getActiveSessionForStation(stationId, targetStation, explicitSessionId = null) {
    if (explicitSessionId) {
      if (this._cachedActiveSessions) {
        const found = this._cachedActiveSessions.find(s => s.id === explicitSessionId || s.session_code === explicitSessionId);
        if (found) return found;
      }
      await this.waitForPendingSyncs();
      const { data: sessions, error: fetchErr } = await supabase
        .from('walkin_sessions')
        .select('*')
        .eq('id', explicitSessionId)
        .limit(1);
      if (fetchErr) throw fetchErr;
      if (!sessions || sessions.length === 0) throw new Error(`No active session found with ID ${explicitSessionId}.`);
      return sessions[0];
    }

    const norm = (str) => String(str || '').toLowerCase().replace(/\s+/g, '');
    if (this._cachedActiveSessions) {
      const found = this._cachedActiveSessions.find(s =>
        (s.device_id === targetStation.id ||
         norm(s.device_id) === norm(targetStation.device_code) ||
         norm(s.device_name) === norm(targetStation.device_code) ||
         norm(s.device_name) === norm(targetStation.device_name) ||
         norm(s.device_id) === norm(stationId)) &&
        ['Active', 'Paused', 'active', 'paused', 'ACTIVE', 'PAUSED'].includes(s.session_status)
      );
      if (found) return found;
    }
    await this.waitForPendingSyncs();
    const cleanCode = String(targetStation.device_code || stationId).trim();
    const cleanName = String(targetStation.device_name || cleanCode).trim();
    const { data: sessions, error: fetchErr } = await supabase
      .from('walkin_sessions')
      .select('*')
      .or(`device_id.eq.${targetStation.id},device_id.eq.${cleanCode},device_name.ilike.%${cleanCode}%,device_name.ilike.%${cleanName}%`)
      .in('session_status', ['Active', 'Paused', 'active', 'paused', 'ACTIVE', 'PAUSED'])
      .limit(1);
    if (fetchErr) throw fetchErr;
    if (!sessions || sessions.length === 0) throw new Error(`No active session found for ${stationId}.`);
    return sessions[0];
  },

  async getStations(forceRefresh = false) {
    try {
      const dbDevices = await deviceService.getDevices(forceRefresh);
      if (!forceRefresh && this._cachedActiveSessions) {
        return this.mapStations(dbDevices, this._cachedActiveSessions);
      }

      await this.waitForPendingSyncs();

      const { data: activeSessions, error } = await supabase
        .from('walkin_sessions')
        .select('*')
        .in('session_status', ['Active', 'Paused', 'active', 'paused', 'ACTIVE', 'PAUSED']);
        
      if (error) console.error("Error fetching walkin_sessions in getStations:", error);
      
      this._cachedActiveSessions = activeSessions || [];
      return this.mapStations(dbDevices, this._cachedActiveSessions);
    } catch(e) {
      console.error(e);
      return [];
    }
  },

  async findAvailableStation(deviceZone) {
    try {
      const stations = await this.getStations();
      const zoneClean = (deviceZone || '').toLowerCase();
      
      const matchingStations = stations.filter(s => {
        const z = (s.zone || s.category || '').toLowerCase();
        return z === zoneClean || z.includes(zoneClean) || zoneClean.includes(z);
      });

      const available = matchingStations.find(s => s.status === 'AVAILABLE');

      if (available) {
        return { availableStation: available, error: null };
      }

      let errorMsg = `No ${deviceZone} Stations Available`;
      if (zoneClean.includes('racing') || zoneClean.includes('sim')) errorMsg = 'Racing Simulator currently occupied or in maintenance.';
      else if (zoneClean.includes('vr')) errorMsg = 'All VR Stations are Occupied or in maintenance.';
      else if (zoneClean.includes('5') || zoneClean.includes('ps5')) errorMsg = 'No PlayStation 5 Stations Available.';
      else if (zoneClean.includes('4') || zoneClean.includes('ps4')) errorMsg = 'PS4 Station Currently Occupied.';
      else if (zoneClean.includes('2') || zoneClean.includes('ps2')) errorMsg = 'PS2 Station Currently Occupied.';

      return { availableStation: null, error: errorMsg };
    } catch(e) {
      console.error("Error finding available station:", e);
      return { availableStation: null, error: 'Error checking station availability.' };
    }
  },

  async toggleMaintenance(stationId) {
    try {
      const stations = await this.getStations();
      const target = stations.find(s => s.id === stationId);

      if (target && (target.status === 'RUNNING' || target.status === 'ACTIVE' || target.status === 'ENDING_SOON')) {
        throw new Error(`Cannot enable Maintenance on ${stationId} while a session is RUNNING.`);
      }

      const isNowMaint = target?.status !== 'MAINTENANCE';
      const newStatus = isNowMaint ? 'MAINTENANCE' : 'AVAILABLE';

      await deviceService.toggleStatus(stationId, newStatus);

      this.addActivity(`Maintenance Toggled`, `${stationId} is now ${newStatus}`, 'ALERT');
      this.addNotification(`Device Maintenance ${isNowMaint ? 'Enabled' : 'Disabled'}`, `Station ${stationId} is now ${newStatus === 'MAINTENANCE' ? 'Under Maintenance' : 'Available again'}.`, 'ALERT');
      return await this.getStations();
    } catch(e) {
      console.error("Error toggling maintenance:", e);
      throw e;
    }
  },

  async addDevice(formData) {
    try {
      const rawName = (formData.name || formData.deviceName || formData.device_name || '').trim();
      if (!rawName) throw new Error('Device Name cannot be empty.');

      const zone = formData.zone || formData.category || 'PlayStation 5';
      const code = formData.device_code || formData.id || rawName;

      let localImg = formData.image || formData.image_url || '';
      if (!localImg) {
        localImg = resolveDeviceImage({ category: zone, device_code: code });
      }

      await deviceService.createDevice({
        device_code: code,
        device_name: rawName,
        zone: zone,
        category: zone,
        platform: zone,
        status: formData.status || 'AVAILABLE',
        image_url: localImg,
        is_active: true
      });

      this.addActivity('New Device Added', `Station ${rawName} (${zone}) created`, 'START');
      this.addNotification('Device Added', `Station ${rawName} (${zone}) was added.`, 'SUCCESS');
      return await this.getStations();
    } catch(e) {
      console.error("Error adding device:", e);
      throw e;
    }
  },

  async updateDevice(stationId, updatedFields) {
    try {
      const dbDevices = await deviceService.getDevices();
      const target = dbDevices.find(s => s.device_code === stationId || s.id === stationId);
      if (!target) throw new Error(`Device ${stationId} not found.`);

      const payload = {};
      if (updatedFields.name || updatedFields.device_name) payload.device_name = updatedFields.name || updatedFields.device_name;
      if (updatedFields.zone || updatedFields.category) {
        payload.zone = updatedFields.zone || updatedFields.category;
        payload.category = updatedFields.zone || updatedFields.category;
        payload.platform = updatedFields.zone || updatedFields.category;
      }
      if (updatedFields.status) payload.status = updatedFields.status;
      if (updatedFields.image || updatedFields.image_url) payload.image_url = updatedFields.image || updatedFields.image_url;

      await deviceService.updateDevice(target.id, payload);

      this.addActivity('Device Updated', `Station ${stationId} updated`, 'INFO');
      return await this.getStations();
    } catch(e) {
      console.error("Error updating device:", e);
      throw e;
    }
  },

  async deleteDevice(stationId) {
    try {
      const dbDevices = await deviceService.getDevices();
      const target = dbDevices.find(s => s.device_code === stationId || s.id === stationId);
      if (!target) throw new Error(`Device ${stationId} not found.`);

      if (target.status === 'RUNNING' || target.status === 'ACTIVE' || target.status === 'BUSY') {
        throw new Error('This device currently has an active session.');
      }

      await deviceService.deleteDevice(target.id);

      this.addActivity('Device Deleted', `Station ${target.device_name || stationId} removed`, 'ALERT');
      this.addNotification('Device Deleted', `Station ${target.device_name || stationId} was deleted.`, 'ALERT');
      return await this.getStations();
    } catch(e) {
      console.error("Error deleting device:", e);
      throw e;
    }
  },

  async duplicateDevice(stationId) {
    try {
      const stations = await this.getStations();
      const target = stations.find(s => s.id === stationId);
      if (!target) throw new Error(`Device ${stationId} not found.`);

      let baseName = target.name || stationId;
      let nextNum = 2;
      let newName = `${baseName}-COPY`;

      const match = baseName.match(/^(.*?)[-\s]?(\d+)$/);
      if (match) {
        const prefix = match[1];
        const num = parseInt(match[2], 10);
        nextNum = num + 1;
        newName = `${prefix}-${nextNum}`;
        while (stations.some(s => s.id.toLowerCase() === newName.toLowerCase())) {
          nextNum++;
          newName = `${prefix}-${nextNum}`;
        }
      }

      return await this.addDevice({
        device_code: newName,
        device_name: newName,
        zone: target.zone,
        category: target.category,
        status: 'AVAILABLE',
        image: target.image
      });
    } catch(e) {
      console.error("Error duplicating device:", e);
      throw e;
    }
  },

  getBusinessDate(dateObj = new Date()) {
    if (!dateObj) return null;
    if (typeof dateObj === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateObj.trim())) {
      return dateObj.trim();
    }
    try {
      const d = typeof dateObj === 'string' ? new Date(dateObj) : dateObj;
      if (isNaN(d.getTime())) return null;

      // Extract Year, Month, Day in Indian Standard Time (Asia/Kolkata, UTC+05:30)
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const parts = formatter.formatToParts(d);
      let year = 2026, month = 1, day = 1;
      parts.forEach(p => {
        if (p.type === 'year') year = parseInt(p.value, 10);
        if (p.type === 'month') month = parseInt(p.value, 10);
        if (p.type === 'day') day = parseInt(p.value, 10);
      });

      const pad = n => String(n).padStart(2, '0');
      return `${year}-${pad(month)}-${pad(day)}`;
    } catch (e) {
      const d = new Date(dateObj);
      if (isNaN(d.getTime())) return null;
      const pad = n => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
  },

  /**
   * Retrieves the active IST operational business date (00:00:00 IST Midnight boundary).
   */
  getOperationalBusinessDate(now = new Date()) {
    const currentBizDate = this.getBusinessDate(now);
    safeStorageSet('gforce_operational_date', currentBizDate);
    return currentBizDate;
  },

  isSameBusinessDate(dateA, dateB) {
    if (!dateA || !dateB) return false;
    return this.getBusinessDate(dateA) === this.getBusinessDate(dateB);
  },

  /**
   * Helper to compute all calendar dates strictly between startDateStr and endDateStr (inclusive of start, exclusive of end)
   */
  _getDatesBetween(startDateStr, endDateStr) {
    const dates = [];
    try {
      if (!startDateStr || !endDateStr || startDateStr >= endDateStr) return dates;
      const startParts = startDateStr.split('-');
      let cur = new Date(Date.UTC(parseInt(startParts[0], 10), parseInt(startParts[1], 10) - 1, parseInt(startParts[2], 10)));
      const endParts = endDateStr.split('-');
      const end = new Date(Date.UTC(parseInt(endParts[0], 10), parseInt(endParts[1], 10) - 1, parseInt(endParts[2], 10)));
      
      const pad = n => String(n).padStart(2, '0');
      while (cur < end) {
        dates.push(`${cur.getUTCFullYear()}-${pad(cur.getUTCMonth() + 1)}-${pad(cur.getUTCDate())}`);
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    } catch (e) {
      console.error("Error computing dates between:", e);
    }
    return dates;
  },

  /**
   * Archives a specific completed business day report safely and verifies storage.
   */
  async archiveDailyReportIfClosed(customOpDate = null) {
    try {
      const now = new Date();
      const currentBizDate = this.getBusinessDate(now);
      const opDate = customOpDate || safeStorageGet('gforce_operational_date') || currentBizDate;

      // If opDate is currently active business day and no explicit customOpDate passed, it's still running
      if (opDate === currentBizDate && !customOpDate) {
        return true;
      }

      let reports = [];
      try {
        reports = JSON.parse(safeStorageGet('gforce_historical_reports_prod') || '[]');
      } catch (e) {
        reports = [];
      }

      // PREVENT DUPLICATES: Only ONE report per business day should be created
      if (reports.some(r => r.rawDate === opDate)) {
        safeStorageSet('gforce_last_archived_date', opDate);
        return true;
      }

      const summary = await this.getTodaySummary(opDate);
      const dayCompletedSessions = summary.todayCompletedSessions;
      const dayCafeOrders = summary.todayCafeOrders;
      const sessionRevenue = summary.sessionRevenue;
      const cafeRevenue = summary.cafeRevenue;
      const totalRevenue = summary.totalRevenue;
      const totalSessions = summary.totalSessions;
      const totalPlayers = summary.totalPlayers;
      const paymentBreakdown = summary.paymentBreakdown;

      const totalDurationMins = dayCompletedSessions.reduce((sum, w) => {
        const dur = parseInt(String(w.duration || w.planned_duration || 60), 10);
        return sum + (isNaN(dur) ? 60 : dur);
      }, 0);
      const avgSessionMins = totalSessions > 0 ? Math.round(totalDurationMins / totalSessions) : 0;

      const peakHour = this.calculatePeakHour(dayCompletedSessions);
      const mostUsedDevice = this.calculateMostUsedDevice(dayCompletedSessions);
      const controllerUsage = dayCompletedSessions.reduce((sum, w) => sum + (Number(w.players || w.player_count) || 1), 0);

      const deviceUsage = {};
      dayCompletedSessions.forEach(s => {
        const dev = s.device || s.device_name || s.stationId || 'Console';
        deviceUsage[dev] = (deviceUsage[dev] || 0) + 1;
      });

      const cafeItemCounts = {};
      dayCafeOrders.forEach(o => {
        const items = o.items || o.snackOrders || [];
        if (Array.isArray(items)) {
          items.forEach(item => {
            const name = item.productName || item.name || 'Item';
            const qty = Number(item.quantity || item.qty || 1);
            cafeItemCounts[name] = (cafeItemCounts[name] || 0) + qty;
          });
        }
      });
      let bestSeller = 'None';
      let maxItemCount = 0;
      Object.entries(cafeItemCounts).forEach(([name, qty]) => {
        if (qty > maxItemCount) {
          maxItemCount = qty;
          bestSeller = name;
        }
      });

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const parts = opDate.split('-');
      const formattedDateStr = `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;

      const newReport = {
        id: `rep_${opDate}`,
        rawDate: opDate,
        dateStr: formattedDateStr,
        revenue: totalRevenue,
        sessionRevenue,
        cafeSales: cafeRevenue,
        completedSessions: totalSessions,
        players: totalPlayers,
        avgSessionMins,
        peakHour,
        mostUsedDevice,
        paymentBreakdown,
        controllerUsage,
        deviceUsage,
        bestSeller,
        bookings: totalSessions,
        sessions: dayCompletedSessions,
        cafeOrders: dayCafeOrders,
        archivedAt: new Date().toISOString()
      };

      // STEP 1: Archive Cafe Orders in dedicated Cafe Archive Service
      const { cafeArchiveService } = await import('./cafeArchiveService.js');
      const cafeArchiveSuccess = await cafeArchiveService.archiveDailyCafeReport(opDate, dayCafeOrders);
      if (!cafeArchiveSuccess) {
        console.warn(`Cafe archive returned false for operational date: ${opDate}`);
      }

      // STEP 2: Save completed business day data to historical storage
      const updatedReports = [newReport, ...reports.filter(r => r.rawDate !== opDate)];
      safeStorageSet('gforce_historical_reports_prod', JSON.stringify(updatedReports));
      safeStorageSet('gforce_last_archived_date', opDate);

      // STEP 3: VERIFY SAVE SUCCESS
      const savedCheck = safeStorageGet('gforce_historical_reports_prod');
      if (!savedCheck) {
        throw new Error('Save verification failed: historical reports missing after write');
      }
      const verifiedList = JSON.parse(savedCheck);
      const isSaved = verifiedList.some(r => r.rawDate === opDate);
      if (!isSaved) {
        throw new Error(`Save verification failed: Report for ${opDate} not found in historical storage`);
      }

      return true;
    } catch (err) {
      console.error('Failed to snapshot and archive daily report:', err);
      return false;
    }
  },

  /**
   * Authoritative 12:00:00 PM NOON IST Daily Rollover Manager.
   * Finalizes previous business days, verifies archival, and cleanly initializes the NEW business day.
   */
  async checkAndPerformDailyAutoReset() {
    try {
      const now = new Date();
      const currentBizDate = this.getBusinessDate(now);
      const storedOpDate = safeStorageGet('gforce_operational_date');

      // If no operational date is stored yet, initialize it directly to currentBizDate
      if (!storedOpDate) {
        safeStorageSet('gforce_operational_date', currentBizDate);
        safeStorageSet('gforce_business_day_state', 'OPEN');
        return true;
      }

      // If already on the current active business date, ensure OPEN state and exit (IDEMPOTENT)
      if (storedOpDate === currentBizDate) {
        safeStorageSet('gforce_business_day_state', 'OPEN');
        return true;
      }

      // If stored operational date is in the past, perform safe rollover sequence
      if (storedOpDate < currentBizDate) {
        const datesToArchive = this._getDatesBetween(storedOpDate, currentBizDate);
        
        // Finalize and archive each past business day sequentially
        for (const d of datesToArchive) {
          const success = await this.archiveDailyReportIfClosed(d);
          if (!success) {
            console.error(`Archival check failed for ${d}. Rollover will retry on next cycle.`);
            return false;
          }
        }

        // STEP 4 & 5: ADVANCE TO NEW BUSINESS DAY AND INITIALIZE FRESH DASHBOARD
        safeStorageSet('gforce_operational_date', currentBizDate);
        safeStorageSet('gforce_business_day_state', 'OPEN');

        // Invalidate active session caches so new day begins with 0 completed counters
        this._cachedCompletedSessions = null;
        this._cachedOrders = null;
        this._cachedWalkInHistory = null;
        this._cachedActiveSessions = null;

        // Broadcast sync events to all connected UI tabs and modules
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('gforce_dashboard_updated'));
          window.dispatchEvent(new CustomEvent('gforce_session_changed'));
          window.dispatchEvent(new CustomEvent('gforce_order_updated'));
        }

        return true;
      }
    } catch (e) {
      console.error('Error performing automatic 12:00 PM daily reset:', e);
      return false;
    }
  },

  resolvePaymentMethod(item) {
    if (!item) return 'Cash';
    if (typeof item === 'string') {
      const raw = item.trim().toLowerCase();
      if (raw === 'cash') return 'Cash';
      if (raw === 'upi' || raw === 'gpay' || raw === 'gpay / cash' || raw === 'gpay / upi') return 'UPI';
      if (raw === 'debit card' || raw === 'debit/credit card' || raw === 'debit' || raw === 'credit card' || raw === 'credit' || raw === 'card') return 'Debit Card';
      if (raw === 'split' || raw === 'split payment' || raw === 'split_payment') return 'Split';
      return item;
    }
    if (item.pricing_snapshot && typeof item.pricing_snapshot === 'object' && item.pricing_snapshot.paymentMethod) {
      return this.resolvePaymentMethod(item.pricing_snapshot.paymentMethod);
    }
    if (item.pricingSnapshot && typeof item.pricingSnapshot === 'object' && item.pricingSnapshot.paymentMethod) {
      return this.resolvePaymentMethod(item.pricingSnapshot.paymentMethod);
    }
    if (item.payment_method) return this.resolvePaymentMethod(item.payment_method);
    if (item.paymentMethod) return this.resolvePaymentMethod(item.paymentMethod);
    return 'Cash';
  },

  extractPaymentBreakdown(item, defaultAmount = 0) {
    if (!item) return { Cash: defaultAmount, UPI: 0, 'Debit Card': 0 };

    const snapshot = (typeof item.pricing_snapshot === 'object' && item.pricing_snapshot)
      ? item.pricing_snapshot
      : (typeof item.pricingSnapshot === 'object' && item.pricingSnapshot) ? item.pricingSnapshot : {};

    const splitInfo = snapshot.splitBreakdown || item.splitBreakdown || item.split_breakdown;
    const method = this.resolvePaymentMethod(item);

    if (method === 'Split' || splitInfo) {
      const cash = Number(splitInfo?.cash ?? snapshot.cashAmount ?? item.cash_amount ?? 0);
      const upi = Number(splitInfo?.upi ?? snapshot.upiAmount ?? item.upi_amount ?? 0);
      const card = Number(splitInfo?.card ?? splitInfo?.debitCard ?? snapshot.cardAmount ?? snapshot.debitCardAmount ?? item.card_amount ?? 0);
      const sum = cash + upi + card;
      if (sum > 0) {
        return { Cash: cash, UPI: upi, 'Debit Card': card };
      }
    }

    if (method === 'UPI') return { Cash: 0, UPI: defaultAmount, 'Debit Card': 0 };
    if (method === 'Debit Card' || method === 'Card' || method === 'Credit Card') return { Cash: 0, UPI: 0, 'Debit Card': defaultAmount };
    return { Cash: defaultAmount, UPI: 0, 'Debit Card': 0 };
  },

  getSessionBusinessDate(w) {
    if (!w) return null;
    const pStatus = String(w.payment_status || '').toLowerCase();
    const sStatus = String(w.session_status || '').toLowerCase();
    const isPrepaid = w.pricing_snapshot?.isPrepaid === true || pStatus === 'prepaid' || (pStatus === 'paid' && sStatus !== 'completed');
    const payTs = isPrepaid ? (w.start_time || w.created_at) : (w.actual_end_time || w.end_time || w.created_at);
    if (!payTs) return w.session_date || null;
    return this.getBusinessDate(payTs) || w.session_date || null;
  },

  async getHistoricalReports() {
    try {
      const now = new Date();
      const currentOpDate = safeStorageGet('gforce_operational_date') || this.getBusinessDate(now);

      // Fetch all walkin sessions and paid cafe orders directly from Supabase
      const [
        { data: walkinsData, error: walkinErr },
        { data: ordersData, error: orderErr }
      ] = await Promise.all([
        supabase.from('walkin_sessions').select('*'),
        supabase.from('cafe_orders').select('*').in('status', ['Completed', 'completed', 'COMPLETED', 'Collected', 'collected', 'COLLECTED'])
      ]);

      if (walkinErr) console.error("Error fetching completed walkins from Supabase:", walkinErr);
      if (orderErr) console.error("Error fetching cafe orders from Supabase:", orderErr);

      const walkins = walkinsData || [];
      const cafeOrders = ordersData || [];

      // Group records by business date
      const dateGroups = {};

      walkins.forEach(w => {
        if (!w) return;
        const pStatus = String(w.payment_status || '').toLowerCase();
        const sStatus = String(w.session_status || '').toLowerCase();
        const isPaid = pStatus === 'paid' || pStatus === 'prepaid' || sStatus === 'completed';

        if (isPaid) {
          const rawDate = this.getSessionBusinessDate(w);
          if (!rawDate) return;

          if (!dateGroups[rawDate]) {
            dateGroups[rawDate] = { sessions: [], cafeOrders: [] };
          }
          dateGroups[rawDate].sessions.push(w);
        }
      });

      cafeOrders.forEach(o => {
        const rawTs = o.created_at || o.createdAt || o.timestamp || o.date;
        if (!rawTs) return;
        const rawDate = this.getBusinessDate(rawTs);
        if (!rawDate) return;

        if (!dateGroups[rawDate]) {
          dateGroups[rawDate] = { sessions: [], cafeOrders: [] };
        }
        dateGroups[rawDate].cafeOrders.push(o);
      });

      // Merge localArchived for legacy fallback if available
      let localArchived = [];
      try {
        localArchived = JSON.parse(localStorage.getItem('gforce_historical_reports_prod') || '[]');
      } catch (e) {}

      const reportsMap = new Map();

      Object.entries(dateGroups).forEach(([rawDate, group]) => {
        const dayCompletedSessions = group.sessions;
        const dayCafeOrders = group.cafeOrders;

        const sessionRevenue = dayCompletedSessions.reduce((sum, w) => {
          const pStatus = String(w.payment_status || '').toLowerCase();
          const sStatus = String(w.session_status || '').toLowerCase();
          const isPrepaid = w.pricing_snapshot?.isPrepaid === true || pStatus === 'prepaid' || (pStatus === 'paid' && sStatus !== 'completed');
          const gamingChargeOnly = Number(w.gaming_charge ?? w.original_gaming_amount ?? (Number(w.total_amount || 0) - Number(w.food_total || 0)) ?? w.total_amount ?? 0);
          return sum + ((sStatus === 'completed' || isPrepaid) ? gamingChargeOnly : 0);
        }, 0);
        const cafeRevenue = dayCafeOrders.reduce((sum, o) => sum + (Number(o.total_amount || o.total) || 0), 0);
        const totalRevenue = sessionRevenue + cafeRevenue;
        const totalSessions = dayCompletedSessions.length;
        const totalPlayers = dayCompletedSessions.reduce((sum, w) => sum + (Number(w.player_count || w.players) || 1), 0);

        const totalDurationMins = dayCompletedSessions.reduce((sum, w) => {
          const dur = parseInt(String(w.planned_duration || w.duration || 60), 10);
          return sum + (isNaN(dur) ? 60 : dur);
        }, 0);
        const avgSessionMins = totalSessions > 0 ? Math.round(totalDurationMins / totalSessions) : 0;

        const peakHour = this.calculatePeakHour(dayCompletedSessions);
        const mostUsedDevice = this.calculateMostUsedDevice(dayCompletedSessions);
        const controllerUsage = dayCompletedSessions.reduce((sum, w) => sum + (Number(w.player_count || w.players) || 1), 0);

        const deviceUsage = {};
        dayCompletedSessions.forEach(s => {
          const dev = s.device_name || s.device || s.device_id || 'Console';
          deviceUsage[dev] = (deviceUsage[dev] || 0) + 1;
        });

        const cafeItemCounts = {};
        dayCafeOrders.forEach(o => {
          const items = o.items || o.snackOrders || [];
          if (Array.isArray(items)) {
            items.forEach(item => {
              const name = item.productName || item.name || 'Item';
              const qty = Number(item.quantity || item.qty || 1);
              cafeItemCounts[name] = (cafeItemCounts[name] || 0) + qty;
            });
          }
        });
        let bestSeller = 'None';
        let maxItemCount = 0;
        Object.entries(cafeItemCounts).forEach(([name, qty]) => {
          if (qty > maxItemCount) {
            maxItemCount = qty;
            bestSeller = name;
          }
        });

        const paymentBreakdown = { Cash: 0, UPI: 0, 'Debit Card': 0 };
        dayCompletedSessions.forEach(w => {
          const pStatus = String(w.payment_status || '').toLowerCase();
          const sStatus = String(w.session_status || '').toLowerCase();
          const isPrepaid = w.pricing_snapshot?.isPrepaid === true || pStatus === 'prepaid' || (pStatus === 'paid' && sStatus !== 'completed');
          const gamingChargeOnly = Number(w.gaming_charge ?? w.original_gaming_amount ?? (Number(w.total_amount || 0) - Number(w.food_total || 0)) ?? w.total_amount ?? 0);
          const recognized = (sStatus === 'completed' || isPrepaid) ? gamingChargeOnly : 0;
          const breakdown = this.extractPaymentBreakdown(w, recognized);
          paymentBreakdown.Cash += (Number(breakdown.Cash) || 0);
          paymentBreakdown.UPI += (Number(breakdown.UPI) || 0);
          paymentBreakdown['Debit Card'] += (Number(breakdown['Debit Card']) || 0);
        });

        dayCafeOrders.forEach(o => {
          const amt = Number(o.total_amount || o.total || 0);
          const breakdown = this.extractPaymentBreakdown(o, amt);
          paymentBreakdown.Cash += (Number(breakdown.Cash) || 0);
          paymentBreakdown.UPI += (Number(breakdown.UPI) || 0);
          paymentBreakdown['Debit Card'] += (Number(breakdown['Debit Card']) || 0);
        });

        // RECONCILIATION AUDIT CHECK (Requirement 7)
        const breakdownSum = Object.values(paymentBreakdown).reduce((s, val) => s + (Number(val) || 0), 0);
        if (breakdownSum !== totalRevenue) {
          console.warn(`[RECONCILIATION MISMATCH] Business Date ${rawDate}: Revenue = ₹${totalRevenue}, BreakdownSum = ₹${breakdownSum}. Adjusting unallocated ₹${totalRevenue - breakdownSum} to Cash bucket.`);
          paymentBreakdown.Cash += (totalRevenue - breakdownSum);
        }

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const parts = rawDate.split('-');
        const formattedDateStr = `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;

        reportsMap.set(rawDate, {
          id: `rep_${rawDate}`,
          rawDate,
          dateStr: formattedDateStr,
          revenue: totalRevenue,
          sessionRevenue,
          cafeSales: cafeRevenue,
          completedSessions: totalSessions,
          players: totalPlayers,
          avgSessionMins,
          peakHour,
          mostUsedDevice,
          paymentBreakdown,
          controllerUsage,
          deviceUsage,
          bestSeller,
          bookings: totalSessions,
          sessions: dayCompletedSessions,
          cafeOrders: dayCafeOrders,
          archivedAt: new Date().toISOString()
        });
      });

      if (Array.isArray(localArchived)) {
        localArchived.forEach(rep => {
          if (rep && rep.rawDate && !reportsMap.has(rep.rawDate) && rep.rawDate !== currentOpDate) {
            reportsMap.set(rep.rawDate, rep);
          }
        });
      }

      const result = Array.from(reportsMap.values()).sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
      return result;
    } catch (err) {
      console.error("Error generating historical reports from Supabase:", err);
      try {
        return JSON.parse(localStorage.getItem('gforce_historical_reports_prod') || '[]');
      } catch (e) {
        return [];
      }
    }
  },

  async getTodaySummary(customOpDate = null) {
    const opDate = customOpDate || this.getOperationalBusinessDate(new Date());

    // Fetch all walkin sessions and paid cafe orders directly from Supabase DB
    const [
      { data: walkinsData, error: wErr },
      { data: ordersData, error: oErr }
    ] = await Promise.all([
      supabase
        .from('walkin_sessions')
        .select('*'),
      supabase
        .from('cafe_orders')
        .select('*')
        .in('status', ['Completed', 'completed', 'COMPLETED', 'Collected', 'collected', 'COLLECTED'])
    ]);

    if (wErr) console.error("Error fetching walkins in getTodaySummary:", wErr);
    if (oErr) console.error("Error fetching cafe orders in getTodaySummary:", oErr);

    const walkins = walkinsData || [];
    const allCafeOrders = ordersData || [];

    const uniqueWalkinsMap = new Map();
    walkins.forEach(w => {
      if (!w) return;
      const key = w.id || w.session_code;
      if (!key) return;

      const pStatus = String(w.payment_status || '').toLowerCase();
      const sStatus = String(w.session_status || '').toLowerCase();
      const isPaid = pStatus === 'paid' || pStatus === 'prepaid' || sStatus === 'completed';

      if (isPaid) {
        const busDate = this.getSessionBusinessDate(w);
        if (busDate === opDate) {
          if (!uniqueWalkinsMap.has(key)) {
            const devName = w.device_name || w.device_id || 'Console';
            const normPayment = this.resolvePaymentMethod(w);
            const isPrepaid = w.pricing_snapshot?.isPrepaid === true || pStatus === 'prepaid' || (pStatus === 'paid' && sStatus !== 'completed');
            
            // Base gaming charge strictly (excluding pending food total)
            const gamingChargeOnly = Number(w.gaming_charge || w.original_gaming_amount || (Number(w.total_amount || 0) - Number(w.food_total || 0)) || 0);
            
            // Gaming revenue recognized if session is Completed OR if session was Prepaid
            const recognizedGamingRevenue = (sStatus === 'completed' || isPrepaid) ? gamingChargeOnly : 0;

            uniqueWalkinsMap.set(key, {
              ...w,
              id: w.id,
              sessionId: w.session_code || w.id,
              stationId: w.device_id,
              leaderName: w.customer_name,
              phone: w.mobile_number,
              device: devName,
              players: w.player_count || 1,
              gamingChargeOnly,
              recognizedGamingRevenue,
              totalAmount: gamingChargeOnly,
              paymentMethod: normPayment,
              payment_method: normPayment,
              paymentStatus: isPrepaid ? 'PREPAID' : 'PAID',
              sessionStatus: sStatus === 'completed' ? 'COMPLETED' : 'RUNNING',
              rawStartTime: w.start_time,
              rawEndTime: w.actual_end_time || w.end_time || w.created_at
            });
          }
        }
      }
    });
    const todayCompletedSessions = Array.from(uniqueWalkinsMap.values());

    const uniqueCafeOrdersMap = new Map();
    allCafeOrders.forEach(o => {
      if (!o) return;
      const key = o.id || o.order_id || o.orderId;
      if (!key) return;
      const ts = o.created_at || o.createdAt || o.timestamp || o.date;
      if (ts && this.getBusinessDate(ts) === opDate) {
        if (!uniqueCafeOrdersMap.has(key)) {
          uniqueCafeOrdersMap.set(key, o);
        }
      }
    });
    const todayPaidCafeOrders = Array.from(uniqueCafeOrdersMap.values());

    const sessionRevenue = todayCompletedSessions.reduce((sum, w) => sum + Number(w.recognizedGamingRevenue || 0), 0);
    const cafeRevenue = todayPaidCafeOrders.reduce((sum, o) => sum + Number(o.total || o.total_amount || 0), 0);
    const totalRevenue = sessionRevenue + cafeRevenue;

    const totalSessions = todayCompletedSessions.length;
    const totalPlayers = todayCompletedSessions.reduce((sum, w) => sum + (Number(w.players || w.player_count) || 1), 0);

    const paymentBreakdown = { Cash: 0, UPI: 0, 'Debit Card': 0 };
    todayCompletedSessions.forEach(w => {
      const charge = Number(w.recognizedGamingRevenue || 0);
      const breakdown = this.extractPaymentBreakdown(w, charge);
      paymentBreakdown.Cash += (Number(breakdown.Cash) || 0);
      paymentBreakdown.UPI += (Number(breakdown.UPI) || 0);
      paymentBreakdown['Debit Card'] += (Number(breakdown['Debit Card']) || 0);
    });
    todayPaidCafeOrders.forEach(o => {
      const charge = Number(o.total || o.total_amount || 0);
      const breakdown = this.extractPaymentBreakdown(o, charge);
      paymentBreakdown.Cash += (Number(breakdown.Cash) || 0);
      paymentBreakdown.UPI += (Number(breakdown.UPI) || 0);
      paymentBreakdown['Debit Card'] += (Number(breakdown['Debit Card']) || 0);
    });

    // RECONCILIATION AUDIT CHECK (Requirement 7)
    const breakdownSum = Object.values(paymentBreakdown).reduce((s, val) => s + (Number(val) || 0), 0);
    if (breakdownSum !== totalRevenue) {
      console.warn(`[RECONCILIATION MISMATCH TODAY] OpDate ${opDate}: Revenue = ₹${totalRevenue}, BreakdownSum = ₹${breakdownSum}. Adjusting unallocated ₹${totalRevenue - breakdownSum} to Cash bucket.`);
      paymentBreakdown.Cash += (totalRevenue - breakdownSum);
    }

    return {
      opDate,
      todayCompletedSessions,
      todayCafeOrders: todayPaidCafeOrders,
      todayPaidCafeOrders,
      sessionRevenue,
      cafeRevenue,
      totalRevenue,
      totalSessions,
      totalPlayers,
      paymentBreakdown
    };
  },

  async getDashboardMetrics(forceRefresh = false) {
    try {
      const now = new Date();
      const currentOpDate = this.getOperationalBusinessDate(now);

      // Always derive Today's Revenue directly from persistent database records of the active operational date!
      const summary = await this.getTodaySummary(currentOpDate);
      const todayRevenue = summary.totalRevenue;

      const activeStatuses = ['active', 'paused', 'running', 'ending_soon', 'scheduled'];

      if (forceRefresh || !this._cachedActiveSessions || !this._cachedCompletedSessions || !this._cachedOrders || !this._cachedDevices) {
        await this.waitForPendingSyncs();
        const { data: walkins } = await supabase.from('walkin_sessions').select('*');
        const { data: orders } = await supabase.from('cafe_orders').select('*');
        const devices = await deviceService.getDevices();

        const walkinsList = walkins || [];
        this._cachedActiveSessions = walkinsList.filter(w => activeStatuses.includes(String(w.session_status || '').toLowerCase()));
        this._cachedCompletedSessions = walkinsList.filter(w => String(w.session_status || '').toLowerCase() === 'completed');
        this._cachedOrders = orders || [];
        this._cachedDevices = devices || [];
      }

      let totalPlayers = 0;
      let runningCount = 0;

      const activeList = this._cachedActiveSessions || [];
      const devicesList = this._cachedDevices || [];

      activeList.forEach(w => {
        if (String(w.session_status || '').toLowerCase() !== 'scheduled') {
          totalPlayers += Number(w.player_count || 0);
          runningCount++;
        }
      });

      const todayCompletedList = summary.todayCompletedSessions;

      let onlineBookings = 0;
      try {
        const { bookingService } = await import('./bookingService');
        const bList = await bookingService.getBookings();
        onlineBookings = (bList || []).filter(b => b.booking_status === 'Pending' || b.booking_status === 'Approved').length;
      } catch (bErr) {}

      // Fetch membership metrics
      let activeMemberships = 0;
      let totalMemberships = 0;
      let pendingMemberships = 0;
      let expiredMemberships = 0;
      try {
        const mMetrics = await membershipService.getMembershipMetrics();
        activeMemberships = mMetrics.activeMemberships || 0;
        totalMemberships = mMetrics.totalMemberships || 0;
        pendingMemberships = mMetrics.pendingMemberships || 0;
        expiredMemberships = mMetrics.expiredMemberships || 0;
      } catch (mErr) {}

      const activeDevicesCount = runningCount;
      const ctrlMetrics = await this.getControllerMetrics();

      const todaySessions = todayCompletedList.length;
      const todayCompletedPlayers = todayCompletedList.reduce((sum, w) => sum + (Number(w.players || w.player_count) || 0), 0);

      return {
        todayRevenue,
        runningSessions: activeDevicesCount,
        availableDevices: Math.max(0, devicesList.length - activeDevicesCount),
        totalPlayers: totalPlayers,
        todayPlayers: todayCompletedPlayers,
        controllersInUse: ctrlMetrics.controllersInUse,
        totalControllers: ctrlMetrics.totalControllers,
        availableControllers: ctrlMetrics.availableControllers,
        todaySessions: todaySessions,
        completedSessions: (this._cachedCompletedSessions || []).length,
        onlineBookings,
        activeMemberships,
        totalMemberships,
        pendingMemberships,
        expiredMemberships,
        paymentBreakdown: summary.paymentBreakdown,
        todayCompleted: summary.todayCompletedSessions
      };
    } catch (e) {
      console.error("Supabase getDashboardMetrics Error:", e);
      return { todayRevenue: 0, runningSessions: 0, availableDevices: 0, todayPlayers: 0, controllersInUse: 0, totalControllers: 20, availableControllers: 20, todaySessions: 0, completedSessions: 0, onlineBookings: 0, activeMemberships: 0 };
    }
  },

  async convertBookingToSession({ bookingId, stationId, operator, notes }) {
    try {
      const { bookingService } = await import('./bookingService');
      const bookings = await bookingService.getBookings();
      const booking = bookings.find(b => b.id === bookingId || b.bookingId === bookingId);
      
      if (!booking) throw new Error('Booking not found.');

      // Update booking status
      await bookingService.updateStatus(booking.id, 'Completed');

      // Start the walk-in session
      let numPlayers = 1;
      if (booking.player_count || booking.players) {
        numPlayers = Number(booking.player_count || booking.players);
      } else if (booking.gaming_zone) {
        const match = String(booking.gaming_zone).match(/\(([\d]+)\s*Players?\)/i);
        if (match && match[1]) {
          numPlayers = parseInt(match[1], 10);
        } else if (booking.gaming_zone.includes('Multiplayer')) {
          numPlayers = 2;
        }
      }

      const parseDurMins = (dur) => {
        if (typeof dur === 'number' && !isNaN(dur)) return dur;
        if (!dur) return 60;
        const lower = String(dur).toLowerCase();
        if (lower.includes('20 min')) return 20;
        if (lower.includes('30 min')) return 30;
        if (lower.includes('40 min')) return 40;
        if (lower.includes('1.5 hour')) return 90;
        if (lower.includes('1 hour')) return 60;
        if (lower.includes('2 hour')) return 120;
        if (lower.includes('3 hour')) return 180;
        const parsed = parseInt(dur, 10);
        return isNaN(parsed) ? 60 : (parsed <= 5 ? parsed * 60 : parsed);
      };
      const durationMinutes = parseDurMins(booking.duration);
      
      return await this.startWalkInSession({
        stationId,
        customerName: booking.customer_name,
        phone: booking.mobile_number,
        numPlayers: numPlayers,
        durationMinutes: durationMinutes,
        estimatedTotal: booking.total_amount,
        notes: notes || `Converted from Online Booking ${bookingId}`,
        paymentMethod: 'Cash'
      });
    } catch (e) {
      console.error('Error converting booking to session:', e);
      throw e;
    }
  },

  async startWalkInSession({ 
    stationId, 
    customerName, 
    phone, 
    numPlayers, 
    durationMinutes, 
    hourlyPrice, 
    estimatedTotal, 
    notes, 
    paymentStatus = 'Prepaid', 
    paymentMethod = null, 
    splitBreakdown = null,
    manualStartTime, 
    isManualMode = false 
  }) {
    try {
      const dbDevices = await deviceService.getDevices();
      const targetStation = dbDevices.find(s => s.device_code === stationId || s.id === stationId);
      
      if (targetStation && (targetStation.status === 'BUSY' || targetStation.status === 'RUNNING' || targetStation.status === 'MAINTENANCE')) {
        throw new Error(`${targetStation.device_name || stationId} is currently not available.`);
      }

      const deviceZone = targetStation?.zone || targetStation?.category || 'PlayStation 5';
      const durMins = Number(durationMinutes) || 60;
      const { pricePerPlayer: dynamicPrice, isWeekend, tierName } = await this.getPriceForSession(deviceZone, durMins);
      const pricePerPlayer = hourlyPrice ? Number(hourlyPrice) : dynamicPrice;
      const playersNum = Number(numPlayers) || 1;
      const originalGamingAmount = (estimatedTotal !== undefined && estimatedTotal !== null && estimatedTotal !== '')
        ? Number(estimatedTotal)
        : Math.round(pricePerPlayer * playersNum);

      let discountPercent = 0;
      let discountAmount = 0;
      let totalAmount = originalGamingAmount;
      let memberDiscountInfo = null;

      try {
        const memberCheck = await membershipService.checkMemberDiscount(phone || customerName);
        if (memberCheck.hasDiscount) {
          discountPercent = memberCheck.discountPercent || 20;
          discountAmount = Math.round(originalGamingAmount * (discountPercent / 100));
          totalAmount = originalGamingAmount - discountAmount;
          memberDiscountInfo = {
            isMember: true, discountPercent, originalGamingAmount, discountAmount,
            memberPlan: memberCheck.planName, memberName: memberCheck.memberName
          };
        } else if (memberCheck.isMonthly) {
          memberDiscountInfo = {
            isMonthly: true, remainingHours: memberCheck.remainingHours,
            memberPlan: memberCheck.planName, memberName: memberCheck.memberName
          };
        }
      } catch (mErr) {
        console.warn("Member check skipped:", mErr);
      }

      const newSessionCode = getNextSessionId();
      const isPrepaid = paymentStatus === 'Prepaid';
      const dbPaymentStatus = isPrepaid ? 'Paid' : 'Pending';

      let rawMethod = 'Cash';
      let parsedSplitBreakdown = splitBreakdown;
      if (paymentMethod && typeof paymentMethod === 'object') {
        rawMethod = this.resolvePaymentMethod(paymentMethod.paymentMethod || paymentMethod.method || 'Cash');
        if (paymentMethod.splitBreakdown) parsedSplitBreakdown = paymentMethod.splitBreakdown;
      } else {
        rawMethod = paymentMethod ? this.resolvePaymentMethod(paymentMethod) : 'Cash';
      }

      const isSplit = rawMethod === 'Split';
      let dbPaymentMethod = null;
      if (isPrepaid) {
        if (isSplit) {
          dbPaymentMethod = 'Split';
        } else if (rawMethod === 'Debit Card' || rawMethod === 'Credit Card' || rawMethod === 'Card') {
          dbPaymentMethod = 'Card';
        } else {
          dbPaymentMethod = rawMethod;
        }
      }

      const baseSnapshot = isManualMode 
        ? { pricingMode: 'MANUAL', manualAmount: originalGamingAmount, hourlyPrice: originalGamingAmount, pricePerPlayer: originalGamingAmount, durationMinutes: durMins, tierName, isWeekend, isPrepaid, paymentStatus: isPrepaid ? 'Prepaid' : 'Pay at Checkout' }
        : { hourlyPrice: pricePerPlayer, pricePerPlayer, durationMinutes: durMins, tierName, isWeekend, isPrepaid, paymentStatus: isPrepaid ? 'Prepaid' : 'Pay at Checkout' };

      const pricingSnapshot = {
        ...baseSnapshot,
        paymentMethod: isSplit ? 'Split' : rawMethod,
        splitBreakdown: isSplit && parsedSplitBreakdown ? {
          cash: Number(parsedSplitBreakdown.cash || 0),
          upi: Number(parsedSplitBreakdown.upi || 0),
          card: Number(parsedSplitBreakdown.card || parsedSplitBreakdown.debitCard || 0)
        } : null,
        cashAmount: isSplit && parsedSplitBreakdown ? Number(parsedSplitBreakdown.cash || 0) : null,
        upiAmount: isSplit && parsedSplitBreakdown ? Number(parsedSplitBreakdown.upi || 0) : null,
        cardAmount: isSplit && parsedSplitBreakdown ? Number(parsedSplitBreakdown.card || parsedSplitBreakdown.debitCard || 0) : null
      };

      const nowIso = manualStartTime ? manualStartTime : new Date().toISOString();
      const isFuture = manualStartTime && (new Date(manualStartTime).getTime() > new Date().getTime());
      const sessionStatus = 'Active'; // Always Active to bypass Postgres check constraint, UI determines "Scheduled" by start_time > now

      const { data, error } = await supabase.from('walkin_sessions').insert([{
        session_code: newSessionCode,
        customer_name: customerName || 'Walk-in Player',
        mobile_number: phone || '-',
        device_id: targetStation ? (targetStation.device_code || targetStation.id) : stationId,
        device_name: targetStation?.device_name || targetStation?.name || stationId,
        device_type: deviceZone,
        player_count: playersNum,
        planned_duration: durMins,
        hourly_price: pricePerPlayer,
        total_amount: totalAmount,
        gaming_charge: totalAmount,
        payment_status: dbPaymentStatus,
        payment_method: dbPaymentMethod,
        session_status: sessionStatus,
        pricing_snapshot: pricingSnapshot,
        member_discount_info: memberDiscountInfo,
        start_time: nowIso,
        created_at: nowIso
      }]).select();

      if (error) {
        console.error("Error inserting walk-in session:", error);
        throw error;
      }

      const dbRecord = data[0];

      if (!this._cachedActiveSessions) this._cachedActiveSessions = [];
      this._cachedActiveSessions = [dbRecord, ...this._cachedActiveSessions];

      if (targetStation && !isFuture) {
        targetStation.status = 'RUNNING';
        deviceService.toggleStatus(stationId, 'RUNNING').catch(() => {});
      }

      playChime('generic');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gforce_session_changed', {
          detail: { eventType: 'INSERT', new: dbRecord }
        }));
      }

      this.addActivity(`Session ${newSessionCode} ${isFuture ? 'Scheduled' : 'Started'}`, `Station ${stationId} ${isFuture ? 'scheduled' : 'started'} (Billed ₹${totalAmount})`, 'START').catch(() => {});
      
      if (!isFuture) {
        this.addNotification('Session Started', `Session ${newSessionCode} started for ${customerName || 'Walk-in Player'} on ${targetStation?.device_name || stationId}.`, 'SUCCESS');
      } else {
        this.addNotification('Session Scheduled', `Session ${newSessionCode} scheduled for ${customerName || 'Walk-in Player'} on ${targetStation?.device_name || stationId}.`, 'INFO');
      }

      return this.getStations();
    } catch(e) {
      console.error("Error starting walk-in session:", e);
      throw e;
    }
  },

  async endSession(stationId, paymentMethod = 'Cash', explicitSessionId = null, finalBillAmount = null, splitBreakdown = null) {
    try {
      let actualPaymentMethod = 'Cash';
      let parsedSplitBreakdown = splitBreakdown;
      if (paymentMethod && typeof paymentMethod === 'object') {
        actualPaymentMethod = paymentMethod.paymentMethod || paymentMethod.method || 'Cash';
        if (paymentMethod.sessionId || paymentMethod.sessionCode) explicitSessionId = paymentMethod.sessionId || paymentMethod.sessionCode;
        if (paymentMethod.finalBillAmount !== undefined && paymentMethod.finalBillAmount !== null) finalBillAmount = paymentMethod.finalBillAmount;
        if (paymentMethod.splitBreakdown) parsedSplitBreakdown = paymentMethod.splitBreakdown;
      } else {
        actualPaymentMethod = paymentMethod || 'Cash';
      }

      const dbDevices = await deviceService.getDevices();
      const targetStation = dbDevices.find(s => s.device_code === stationId || s.id === stationId);
      if (!targetStation) throw new Error(`Device ${stationId} not found.`);

      const activeSession = await this._getActiveSessionForStation(stationId, targetStation, explicitSessionId);
      
      const safePaymentMethod = this.resolvePaymentMethod(actualPaymentMethod);
      const isSplit = safePaymentMethod === 'Split';

      const finalAmt = finalBillAmount !== null ? Number(finalBillAmount) : Number(activeSession.total_amount || activeSession.gaming_charge || 0);

      if (this._cachedActiveSessions) {
        this._cachedActiveSessions = this._cachedActiveSessions.filter(s => s.id !== activeSession.id && s.session_code !== activeSession.session_code);
      }
      targetStation.status = 'AVAILABLE';

      const nowIso = new Date().toISOString();
      const currentSnapshot = (typeof activeSession.pricing_snapshot === 'object' && activeSession.pricing_snapshot) ? activeSession.pricing_snapshot : {};
      const updatedSnapshot = {
        ...currentSnapshot,
        paymentMethod: isSplit ? 'Split' : safePaymentMethod,
        splitBreakdown: isSplit && parsedSplitBreakdown ? {
          cash: Number(parsedSplitBreakdown.cash || 0),
          upi: Number(parsedSplitBreakdown.upi || 0),
          card: Number(parsedSplitBreakdown.card || parsedSplitBreakdown.debitCard || 0)
        } : (isSplit ? currentSnapshot.splitBreakdown : null),
        cashAmount: isSplit && parsedSplitBreakdown ? Number(parsedSplitBreakdown.cash || 0) : currentSnapshot.cashAmount,
        upiAmount: isSplit && parsedSplitBreakdown ? Number(parsedSplitBreakdown.upi || 0) : currentSnapshot.upiAmount,
        cardAmount: isSplit && parsedSplitBreakdown ? Number(parsedSplitBreakdown.card || parsedSplitBreakdown.debitCard || 0) : currentSnapshot.cardAmount
      };

      let dbPaymentMethod = 'Cash';
      if (isSplit) {
        dbPaymentMethod = 'Split';
      } else if (safePaymentMethod === 'Debit Card' || safePaymentMethod === 'Credit Card') {
        dbPaymentMethod = 'Card';
      } else {
        dbPaymentMethod = safePaymentMethod;
      }

      const completedRecord = {
        ...activeSession,
        session_status: 'Completed',
        actual_end_time: nowIso,
        end_time: nowIso,
        payment_status: 'Paid',
        paymentMethod: safePaymentMethod,
        payment_method: dbPaymentMethod,
        pricing_snapshot: updatedSnapshot,
        total_amount: finalAmt,
        session_date: this.getOperationalBusinessDate()
      };

      if (!this._cachedCompletedSessions) {
        this._cachedCompletedSessions = [];
      }
      this._cachedCompletedSessions.unshift(completedRecord);

      if (this._cachedWalkInHistory) {
        this._cachedWalkInHistory = [
          {
            id: completedRecord.id,
            sessionId: completedRecord.session_code || completedRecord.id,
            stationId: targetStation.device_code || stationId,
            leaderName: completedRecord.customer_name || 'Walk-in Player',
            phone: completedRecord.mobile_number || '-',
            device: targetStation.device_name || targetStation.name || stationId,
            zone: targetStation.category || targetStation.zone,
            status: 'COMPLETED',
            sessionStatus: 'COMPLETED',
            paymentStatus: 'Paid',
            paymentMethod: safePaymentMethod,
            players: completedRecord.player_count || 1,
            price: Number(completedRecord.hourly_price || 0),
            totalAmount: finalAmt,
            startTime: completedRecord.start_time || nowIso,
            endTime: nowIso,
            duration: `${completedRecord.planned_duration || 60} Mins`,
            snackTotal: Number(completedRecord.food_total || 0),
            snackOrders: completedRecord.snack_orders || [],
            createdAt: nowIso
          },
          ...this._cachedWalkInHistory.filter(w => w.id !== completedRecord.id && w.sessionId !== completedRecord.session_code)
        ];
      }

      if (activeSession.member_discount_info && activeSession.member_discount_info.isMonthly) {
        const playedHours = (activeSession.planned_duration + (activeSession.extended_minutes || 0)) / 60;
        await membershipService.deductMonthlyHours(activeSession.mobile_number || activeSession.customer_name, playedHours).catch(err => console.error(err));
      }

      const targetId = activeSession.id;
      const updatePayload = {
        session_status: 'Completed',
        actual_end_time: nowIso,
        payment_status: 'Paid',
        payment_method: dbPaymentMethod,
        pricing_snapshot: updatedSnapshot,
        total_amount: finalAmt
      };

      await supabase
        .from('walkin_sessions')
        .update(updatePayload)
        .eq('id', targetId);

      // Settle attached pending cafe orders for this session in Supabase cafe_orders table
      const sessCode = activeSession.session_code || activeSession.id;
      await supabase
        .from('cafe_orders')
        .update({
          status: 'Collected',
          payment_status: 'Paid',
          payment_method: dbPaymentMethod,
          revenue_counted: true
        })
        .or(`session_id.eq.${activeSession.id},session_id.eq.${sessCode}`);

      await Promise.all([
        deviceService.toggleStatus(stationId, 'AVAILABLE').catch(() => {}),
        this.addActivity(`Session Ended`, `Station ${stationId} Session Completed. Total Bill ₹${finalAmt}`, 'END').catch(() => {})
      ]);

      playChime('generic');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gforce_session_changed', {
          detail: { eventType: 'DELETE', old: { id: activeSession.id } }
        }));
        window.dispatchEvent(new CustomEvent('gforce_dashboard_updated', {
          detail: { eventType: 'SESSION_COMPLETED', session: completedRecord }
        }));
      }

      this.addNotification('Session Completed', `Station ${stationId} session completed. Total bill ₹${completedRecord.total_amount}.`, 'SUCCESS');

      return this.getStations();
    } catch(e) {
      console.error("Error ending session:", e);
      throw e;
    }
  },

  async extendSession(stationId, extraMinutes, explicitSessionId = null) {
    try {
      const dbDevices = await deviceService.getDevices();
      const targetStation = dbDevices.find(s => s.device_code === stationId || s.id === stationId);
      if (!targetStation) throw new Error(`Device ${stationId} not found.`);

      const activeSession = await this._getActiveSessionForStation(stationId, targetStation, explicitSessionId);

      const extraMinsNum = Number(extraMinutes) || 0;
      if (extraMinsNum <= 0) throw new Error('Extension duration must be greater than 0 minutes.');

      const newExtendedMinutes = Number(activeSession.extended_minutes || 0) + extraMinsNum;
      const deviceZone = activeSession.device_type || targetStation.zone || targetStation.category || 'PlayStation 5';

      let resolvedPlatform = deviceZone;
      if (stationId.startsWith('VR') || resolvedPlatform.includes('VR') || resolvedPlatform.includes('PS VR2')) {
        resolvedPlatform = 'PS VR2';
      } else if (stationId.startsWith('SIM') || resolvedPlatform.includes('SIM') || resolvedPlatform.includes('Racing Simulator')) {
        resolvedPlatform = 'Racing Simulator';
      }

      const playersCount = Number(activeSession.player_count) || 1;
      let extensionCharge = 0;
      let hourlyPrice = 100;

      if (resolvedPlatform === 'PS VR2' || resolvedPlatform === 'Racing Simulator') {
        const baseRate = Number(this.getPriceForSessionSync(resolvedPlatform, extraMinsNum));
        extensionCharge = baseRate * playersCount;
        hourlyPrice = Number(this.getPriceForSessionSync(resolvedPlatform, 60)) || (resolvedPlatform === 'PS VR2' ? 220 : 180);
      } else {
        // Always read the current active hourly price directly from the Pricing Settings configuration (for 60 minutes)
        // Never double the extension charge, never multiply by players twice
        hourlyPrice = Number(this.getPriceForSessionSync(deviceZone, 60));
        if (!hourlyPrice || hourlyPrice <= 0) {
          hourlyPrice = Number(activeSession.hourly_price || activeSession.pricing_snapshot?.hourlyPrice || 100);
        }
        // Formula: Single Player Extension = (Current Hourly Price * Extension Minutes) / 60
        // Final Charge = Single Player Extension * Number of Players
        const singlePlayerExtension = (hourlyPrice * extraMinsNum) / 60;
        extensionCharge = Math.round(singlePlayerExtension * playersCount);
      }
      
      // Apply member discount if present on session
      if (activeSession.member_discount_info && activeSession.member_discount_info.discountPercent) {
        const discountAmt = Math.round(extensionCharge * (activeSession.member_discount_info.discountPercent / 100));
        extensionCharge = extensionCharge - discountAmt;
      }

      const prevExtensionAmount = Number(activeSession.extension_amount || activeSession.pricing_snapshot?.extension_amount || 0);
      const newExtensionAmount = prevExtensionAmount + extensionCharge;
      
      const foodTotal = Number(activeSession.food_total || 0);
      
      let baseGamingAmount = 0;
      if (activeSession.gaming_charge !== undefined && activeSession.gaming_charge !== null) {
        baseGamingAmount = Number(activeSession.gaming_charge);
      } else {
        baseGamingAmount = Number(activeSession.total_amount || 0) - foodTotal;
      }

      const originalAmount = Number(
        activeSession.original_amount ?? 
        activeSession.pricing_snapshot?.original_amount ?? 
        activeSession.pricing_snapshot?.originalGamingAmount ?? 
        (baseGamingAmount - prevExtensionAmount)
      );

      const newGamingCharge = originalAmount + newExtensionAmount;
      const newTotalAmount = newGamingCharge + foodTotal;

      const updatedSnapshot = {
        ...(activeSession.pricing_snapshot || {}),
        extension_amount: newExtensionAmount,
        original_amount: originalAmount
      };

      const updatedSession = {
        ...activeSession,
        hourly_price: hourlyPrice,
        original_amount: originalAmount,
        extended_minutes: newExtendedMinutes,
        extension_amount: newExtensionAmount,
        gaming_charge: newGamingCharge,
        total_amount: newTotalAmount,
        pricing_snapshot: updatedSnapshot
      };

      if (this._cachedActiveSessions) {
        this._cachedActiveSessions = this._cachedActiveSessions.map(s => 
          s.id === activeSession.id ? updatedSession : s
        );
      }

      playChime('generic');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gforce_session_changed', {
          detail: { 
            eventType: 'UPDATE', 
            new: updatedSession
          }
        }));
      }

      const targetId = (this._cachedActiveSessions && this._cachedActiveSessions.find(s => s.session_code === activeSession.session_code)?.id) || activeSession.id;
      const { error: updateError } = await supabase
        .from('walkin_sessions')
        .update({
          extended_minutes: newExtendedMinutes,
          gaming_charge: newGamingCharge,
          total_amount: newTotalAmount,
          pricing_snapshot: updatedSnapshot
        })
        .eq('id', targetId);

      if (updateError) {
        console.error("Supabase update error:", updateError);
        throw new Error("Failed to persist extension: " + updateError.message);
      }

      this.addNotification('Session Extended', `Station ${stationId} extended by ${extraMinutes} minutes.`, 'INFO');

      return this.getStations();
    } catch(e) {
      console.error("Error extending session:", e);
      throw e;
    }
  },

  async togglePauseSession(stationId, explicitSessionId = null) {
    try {
      const dbDevices = await deviceService.getDevices();
      const targetStation = dbDevices.find(s => s.device_code === stationId || s.id === stationId);
      if (!targetStation) throw new Error(`Device ${stationId} not found.`);

      const activeSession = await this._getActiveSessionForStation(stationId, targetStation, explicitSessionId);
      const isCurrentlyPaused = String(activeSession.session_status || '').toLowerCase() === 'paused';
      
      let updatedStatus = 'Paused';
      let updatedStartTime = activeSession.start_time;
      let updatedExpectedEndTime = activeSession.expected_end_time;
      let deviceStatus = 'BUSY';

      if (!isCurrentlyPaused) {
        updatedStatus = 'Paused';
        updatedExpectedEndTime = new Date().toISOString();
        deviceStatus = 'BUSY';
      } else {
        updatedStatus = 'Active';
        let newStartTime = new Date(activeSession.start_time).getTime();
        if (activeSession.expected_end_time) {
          const pauseStartMs = new Date(activeSession.expected_end_time).getTime();
          const pausedDurationMs = Math.max(0, Date.now() - pauseStartMs);
          newStartTime += pausedDurationMs;
        }
        updatedStartTime = new Date(newStartTime).toISOString();
        updatedExpectedEndTime = null;
        deviceStatus = 'RUNNING';
      }

      const updatedSession = {
        ...activeSession,
        session_status: updatedStatus,
        start_time: updatedStartTime,
        expected_end_time: updatedExpectedEndTime
      };

      if (this._cachedActiveSessions) {
        this._cachedActiveSessions = this._cachedActiveSessions.map(s =>
          s.id === activeSession.id ? updatedSession : s
        );
      }
      targetStation.status = deviceStatus;

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gforce_session_changed', {
          detail: { 
            eventType: 'UPDATE', 
            new: updatedSession
          }
        }));
      }

      this._enqueueSync(async () => {
        const targetId = (this._cachedActiveSessions && this._cachedActiveSessions.find(s => s.session_code === activeSession.session_code)?.id) || activeSession.id;
        await Promise.all([
          supabase
            .from('walkin_sessions')
            .update({
              session_status: updatedStatus,
              expected_end_time: updatedExpectedEndTime,
              start_time: updatedStartTime
            })
            .eq('id', targetId),
          deviceService.toggleStatus(stationId, deviceStatus).catch(() => {}),
          this.addActivity(`Session ${updatedStatus === 'Paused' ? 'Paused' : 'Resumed'}`, `Station ${stationId} session ${updatedStatus.toLowerCase()}.`, updatedStatus === 'Paused' ? 'PAUSE' : 'RESUME')
        ]);
      });

      return this.getStations();
    } catch (e) {
      console.error("Error toggling pause:", e);
      throw e;
    }
  },

  async shiftSession(currentStationId, targetStationId, explicitSessionId = null) {
    try {
      const dbDevices = await deviceService.getDevices(true);
      const oldStation = dbDevices.find(s => s.device_code === currentStationId || s.id === currentStationId);
      const newStation = dbDevices.find(s => s.device_code === targetStationId || s.id === targetStationId);

      if (!oldStation) throw new Error(`Source station ${currentStationId} not found.`);
      if (!newStation) throw new Error(`Destination station ${targetStationId} not found.`);

      // RACE CONDITION GUARD: Re-verify target station is currently AVAILABLE
      if (newStation.status === 'RUNNING' || newStation.status === 'BUSY' || newStation.status === 'MAINTENANCE') {
        throw new Error(`Station ${newStation.device_name || targetStationId} is no longer available.`);
      }

      // Fetch active session from old station
      const activeSession = await this._getActiveSessionForStation(currentStationId, oldStation, explicitSessionId);
      if (!activeSession) throw new Error(`No active session found on ${currentStationId}.`);

      const nowIso = new Date().toISOString();
      const currentSnapshot = (typeof activeSession.pricing_snapshot === 'object' && activeSession.pricing_snapshot) ? activeSession.pricing_snapshot : {};
      const shiftHistory = Array.isArray(currentSnapshot.shift_history) ? currentSnapshot.shift_history : [];
      shiftHistory.push({
        from_device: oldStation.device_code || currentStationId,
        to_device: newStation.device_code || targetStationId,
        shifted_at: nowIso
      });

      const updatedSnapshot = {
        ...currentSnapshot,
        shifted_from_device: oldStation.device_code || currentStationId,
        shifted_to_device: newStation.device_code || targetStationId,
        shifted_at: nowIso,
        shift_history: shiftHistory
      };

      const newDeviceCode = newStation.device_code || newStation.id;
      const newDeviceName = newStation.device_name || newStation.name || newDeviceCode;
      const newDeviceType = newStation.zone || newStation.category || activeSession.device_type;

      // UPDATE existing session in Supabase (DO NOT CREATE NEW RECORD, PRESERVE ALL BILLING & TIMER DETAILS)
      const { data: updatedData, error: updateErr } = await supabase
        .from('walkin_sessions')
        .update({
          device_id: newDeviceCode,
          device_name: newDeviceName,
          device_type: newDeviceType,
          pricing_snapshot: updatedSnapshot
        })
        .eq('id', activeSession.id)
        .select();

      if (updateErr) {
        console.error("Error shifting session in Supabase:", updateErr);
        throw updateErr;
      }

      const updatedRecord = (updatedData && updatedData.length > 0)
        ? updatedData[0]
        : { ...activeSession, device_id: newDeviceCode, device_name: newDeviceName, device_type: newDeviceType, pricing_snapshot: updatedSnapshot };

      // Update cached active sessions array
      if (this._cachedActiveSessions) {
        this._cachedActiveSessions = this._cachedActiveSessions.map(s => s.id === activeSession.id ? updatedRecord : s);
      }

      // DEVICE STATUS HANDOVER: Old station becomes AVAILABLE, New station becomes RUNNING
      oldStation.status = 'AVAILABLE';
      newStation.status = 'RUNNING';

      await Promise.all([
        deviceService.toggleStatus(currentStationId, 'AVAILABLE').catch(() => {}),
        deviceService.toggleStatus(targetStationId, 'RUNNING').catch(() => {})
      ]);

      playChime('generic');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gforce_session_changed', {
          detail: { eventType: 'UPDATE', new: updatedRecord, old: activeSession }
        }));
      }

      this.addActivity('Session Shifted', `Session ${activeSession.session_code || activeSession.id} shifted from ${currentStationId} to ${targetStationId}`, 'INFO').catch(() => {});
      this.addNotification('Session Shifted', `Session shifted successfully from ${oldStation.device_name || currentStationId} to ${newStation.device_name || targetStationId}.`, 'SUCCESS');

      return this.getStations(true);
    } catch(e) {
      console.error("Error shifting session:", e);
      throw e;
    }
  },

  async addSnackOrderToStation(stationId, expectedSessionIdOrItem, possibleSnackItem) {
    try {
      let snackItem = possibleSnackItem;
      if (!snackItem && expectedSessionIdOrItem && typeof expectedSessionIdOrItem === 'object') {
        snackItem = expectedSessionIdOrItem;
      }

      const dbDevices = await deviceService.getDevices();
      const targetStation = dbDevices.find(s => s.device_code === stationId || s.id === stationId);
      if (!targetStation) throw new Error(`Device ${stationId} not found.`);

      let explicitSessionId = null;
      if (typeof expectedSessionIdOrItem === 'string') {
        explicitSessionId = expectedSessionIdOrItem;
      }

      const activeSession = await this._getActiveSessionForStation(stationId, targetStation, explicitSessionId);

      const currentOrders = activeSession.snack_orders || [];
      const newOrders = [...currentOrders];
      
      const itemName = snackItem.productName || snackItem.name || snackItem.product_name || 'Café Item';
      const itemQty = Math.max(1, Number(snackItem.quantity || snackItem.qty || 1));
      const itemPrice = Number(snackItem.price || (snackItem.total ? snackItem.total / itemQty : 20));
      const itemTotal = Number(snackItem.total || snackItem.subtotal || itemPrice * itemQty);
      
      newOrders.push({
        ...snackItem,
        productName: itemName,
        name: itemName,
        quantity: itemQty,
        qty: itemQty,
        price: itemPrice,
        total: itemTotal,
        subtotal: itemTotal
      });
      
      const baseGamingAmount = Number(
        activeSession.gaming_charge || 
        activeSession.estimated_total || 
        (Number(activeSession.total_amount || 0) - Number(activeSession.food_total || 0)) || 
        0
      );
      const newFoodTotal = Number(activeSession.food_total || 0) + itemTotal;
      const newTotalAmount = baseGamingAmount + newFoodTotal;

      const updatedSession = {
        ...activeSession,
        snack_orders: newOrders,
        food_total: newFoodTotal,
        total_amount: newTotalAmount
      };

      if (this._cachedActiveSessions) {
        this._cachedActiveSessions = this._cachedActiveSessions.map(s => 
          s.id === activeSession.id ? updatedSession : s
        );
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gforce_session_changed', {
          detail: { 
            eventType: 'UPDATE', 
            new: updatedSession
          }
        }));
      }

      playChime('generic');

      const targetId = (this._cachedActiveSessions && this._cachedActiveSessions.find(s => s.session_code === activeSession.session_code)?.id) || activeSession.id;
      await supabase
        .from('walkin_sessions')
        .update({
          snack_orders: newOrders,
          food_total: newFoodTotal,
          total_amount: newTotalAmount
        })
        .eq('id', targetId);

      return this.getStations();
    } catch(e) {
      console.error("Error adding snack to station:", e);
      throw e;
    }
  },

  async getWalkInHistory() {
    try {
      await this.waitForPendingSyncs();
      const { data, error } = await supabase
        .from('walkin_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      const dbDevices = await deviceService.getDevices();

      const uniqueRows = new Map();
      (data || []).forEach(d => {
        if (d && d.id && !uniqueRows.has(d.id)) {
          uniqueRows.set(d.id, d);
        }
      });

      return Array.from(uniqueRows.values()).map(d => {
        const dev = dbDevices.find(s => s.id === d.device_id || s.device_code === d.device_id);
        const isCompleted = String(d.session_status || '').toLowerCase() === 'completed';
        const normPayment = isCompleted ? this.resolvePaymentMethod(d) : 'Pending';
        return {
          id: d.id,
          sessionId: d.session_code || d.id,
          stationId: dev ? dev.device_code : d.device_id,
          leaderName: d.customer_name,
          phone: d.mobile_number,
          device: dev ? dev.device_name : (d.device_name || d.device_id),
          players: d.player_count,
          startTime: new Date(d.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          endTime: d.actual_end_time ? new Date(d.actual_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
          duration: (d.planned_duration + (d.extended_minutes || 0)) + ' mins',
          pricePerPlayer: d.hourly_price,
          gamingCharge: d.gaming_charge,
          originalGamingAmount: d.original_gaming_amount || d.member_discount_info?.originalGamingAmount || 0,
          discountAmount: d.discount_amount || d.member_discount_info?.discountAmount || 0,
          foodTotal: d.food_total,
          totalAmount: Number(d.total_amount || d.gaming_charge || 0),
          paymentMethod: normPayment,
          payment_method: normPayment,
          paymentStatus: d.payment_status || 'PAID',
          sessionStatus: d.session_status === 'Completed' ? 'COMPLETED' : (d.session_status === 'Active' ? 'RUNNING' : (d.session_status || '').toUpperCase()),
          date: new Date(d.start_time).toLocaleDateString(),
          snackOrders: d.snack_orders || [],
          pricingSnapshot: d.pricing_snapshot,
          memberDiscountInfo: d.member_discount_info,
          rawStartTime: d.start_time,
          rawEndTime: d.actual_end_time || d.end_time || d.created_at
        };
      });
    } catch(e) {
      console.error("Error fetching walk-in history:", e);
      return [];
    }
  },

  async deleteWalkInRecord(id) {
    try {
      await this.waitForPendingSyncs();
      if (this._cachedActiveSessions) {
        this._cachedActiveSessions = this._cachedActiveSessions.filter(s => s.id !== id);
      }
      const { data: record } = await supabase.from('walkin_sessions').select('*').eq('id', id).single();
      const { error } = await supabase.from('walkin_sessions').delete().eq('id', id);
      if (error) throw error;
      if (record && (record.device_id || record.device_name)) {
        await deviceService.toggleStatus(record.device_id || record.device_name, 'AVAILABLE').catch(() => {});
      }
      this.addActivity(`Session Deleted`, `Removed session from history`, 'ALERT');
      return await this.getWalkInHistory();
    } catch(e) {
      console.error("Error deleting walk-in:", e);
      throw e;
    }
  },

  async getActivities() {
    try {
      await this.waitForPendingSyncs();
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('time', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []).map(a => ({
        ...a,
        time: new Date(a.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
    } catch(e) {
      console.error("Error fetching activities:", e);
      return [];
    }
  },

  async addActivity(title, subtitle, type = 'INFO') {
    try {
      await supabase.from('activity_logs').insert([{
        title,
        message: subtitle,
        type
      }]);
    } catch(e) {
      console.error("Error adding activity:", e);
    }
  },

  async getNotifications() {
    const raw = getItem(STORAGE_KEYS.NOTIFICATIONS, []);
    return raw;
  },

  async addNotification(title, message, type = 'INFO') {
    const raw = getItem(STORAGE_KEYS.NOTIFICATIONS, []);
    const now = Date.now();
    // Prevent duplicate notifications in the last 10 seconds
    const isDuplicate = raw.some(item => 
      item.title === title && 
      item.message === message && 
      item.type === type && 
      (now - item.timestamp) < 10000
    );
    if (isDuplicate) return;

    const newNotif = { 
      id: 'notif_' + now + '_' + Math.random().toString(36).substr(2, 9), 
      title, 
      message, 
      type, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
      timestamp: now, 
      read: false 
    };
    const updated = [newNotif, ...raw].slice(0, 50);
    setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gforce_notifications_updated', { detail: updated }));
    }
  },

  async markAllNotificationsRead() {
    const raw = getItem(STORAGE_KEYS.NOTIFICATIONS, []);
    const updated = raw.map(item => ({ ...item, read: true }));
    setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gforce_notifications_updated', { detail: updated }));
    }
    return updated;
  },

  async markNotificationRead(id) {
    const raw = getItem(STORAGE_KEYS.NOTIFICATIONS, []);
    const updated = raw.map(item => item.id === id ? { ...item, read: true } : item);
    setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gforce_notifications_updated', { detail: updated }));
    }
    return updated;
  },

  async dismissNotification(id) {
    const raw = getItem(STORAGE_KEYS.NOTIFICATIONS, []);
    const updated = raw.filter(item => item.id !== id);
    setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gforce_notifications_updated', { detail: updated }));
    }
    return updated;
  },

  async clearAllNotifications() {
    setItem(STORAGE_KEYS.NOTIFICATIONS, []);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gforce_notifications_updated', { detail: [] }));
    }
    return [];
  },

  async getControllerMetrics() {
    const inv = getItem(STORAGE_KEYS.CONTROLLERS, DEFAULT_CONTROLLER_INVENTORY);
    const stations = await this.getStations();
    
    let controllersInUse = 0;
    stations.forEach(s => {
      const statusClean = String(s.status || '').toUpperCase();
      if (statusClean === 'RUNNING' || statusClean === 'ACTIVE' || statusClean === 'ENDING_SOON' || statusClean === 'PAUSED') {
        if (isPlayStationCategory(s)) {
          controllersInUse += (s.controllersUsed || 0);
        }
      }
    });

    const maintenance = Number(inv.maintenanceControllers) || 0;
    const broken = Number(inv.brokenControllers) || 0;
    const reserved = Number(inv.reservedControllers) || 0;
    const total = Number(inv.totalControllers) || 20;

    const availableControllers = Math.max(0, total - controllersInUse - maintenance - broken - reserved);

    return {
      totalControllers: total,
      controllersInUse,
      availableControllers,
      maintenanceControllers: maintenance,
      brokenControllers: broken,
      reservedControllers: reserved,
      usableControllers: Math.max(0, total - maintenance - broken)
    };
  },

  mapControllerMetrics(stations = []) {
    const inv = getItem(STORAGE_KEYS.CONTROLLERS, DEFAULT_CONTROLLER_INVENTORY);
    let controllersInUse = 0;
    stations.forEach(s => {
      const statusClean = String(s.status || '').toUpperCase();
      if (statusClean === 'RUNNING' || statusClean === 'ACTIVE' || statusClean === 'ENDING_SOON' || statusClean === 'PAUSED') {
        if (isPlayStationCategory(s)) {
          controllersInUse += (s.controllersUsed || 0);
        }
      }
    });

    const maintenance = Number(inv.maintenanceControllers) || 0;
    const broken = Number(inv.brokenControllers) || 0;
    const reserved = Number(inv.reservedControllers) || 0;
    const total = Number(inv.totalControllers) || 20;

    const availableControllers = Math.max(0, total - controllersInUse - maintenance - broken - reserved);

    return {
      totalControllers: total,
      controllersInUse,
      availableControllers,
      maintenanceControllers: maintenance,
      brokenControllers: broken,
      reservedControllers: reserved,
      usableControllers: Math.max(0, total - maintenance - broken)
    };
  },

  async addControllers(quantity) {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      throw new Error('Please enter a valid positive number of controllers to add.');
    }

    const inv = getItem(STORAGE_KEYS.CONTROLLERS, DEFAULT_CONTROLLER_INVENTORY);
    const newTotal = (inv.totalControllers || 20) + qty;
    const updated = { ...inv, totalControllers: newTotal };
    setItem(STORAGE_KEYS.CONTROLLERS, updated);
    this.addActivity('Controllers Added', `Added ${qty} new controllers to hardware inventory. Total: ${newTotal}`, 'SUCCESS');
    return updated;
  },

  async updateControllerHardwareStatus(maintenance, broken, reserved) {
    const inv = getItem(STORAGE_KEYS.CONTROLLERS, DEFAULT_CONTROLLER_INVENTORY);
    const m = Math.max(0, parseInt(maintenance, 10) || 0);
    const b = Math.max(0, parseInt(broken, 10) || 0);
    const r = Math.max(0, parseInt(reserved, 10) || 0);

    const updated = {
      ...inv,
      maintenanceControllers: m,
      brokenControllers: b,
      reservedControllers: r
    };

    setItem(STORAGE_KEYS.CONTROLLERS, updated);
    this.addActivity('Controller Hardware Status Updated', `Maintenance: ${m}, Broken: ${b}, Reserved: ${r}`, 'INFO');
    return updated;
  },

  async getSoundSettings() {
    const { settingsService } = await import('./settingsService');
    const settings = await settingsService.getSetting('audio_alerts');
    if (!settings || Object.keys(settings).length === 0) {
      return DEFAULT_SOUND_SETTINGS;
    }
    return settings;
  },

  async updateSoundSettings(newSettings) {
    const { settingsService } = await import('./settingsService');
    const current = await this.getSoundSettings();
    const updated = { ...current, ...newSettings };
    await settingsService.updateSetting('audio_alerts', updated);
    return updated;
  },

  async testSoundChime(type = '5min') {
    playChime(type);
  },

  async getPricingSettings() {
    const saved = getItem(STORAGE_KEYS.PRICING, DEFAULT_PRICING_SETTINGS);
    if (saved) {
      if (!saved.weekday) saved.weekday = {};
      if (!saved.weekday['PlayStation 5']) saved.weekday['PlayStation 5'] = {};
      if (saved.weekday['PlayStation 5'][30] === undefined) {
        saved.weekday['PlayStation 5'][30] = 60;
      }
      if (!saved.weekend) saved.weekend = {};
      if (!saved.weekend['PlayStation 5']) saved.weekend['PlayStation 5'] = {};
      if (saved.weekend['PlayStation 5'][30] === undefined) {
        saved.weekend['PlayStation 5'][30] = 60;
      }
    }
    return saved;
  },

  async updatePricingSettings(newSettings) {
    const current = getItem(STORAGE_KEYS.PRICING, DEFAULT_PRICING_SETTINGS);
    const updated = {
      ...current,
      ...newSettings,
      lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      history: [
        { date: new Date().toLocaleDateString(), action: 'Pricing Settings Updated', updatedBy: 'Admin' },
        ...(current.history || []).slice(0, 9)
      ]
    };
    setItem(STORAGE_KEYS.PRICING, updated);
    this.addActivity('Pricing Updated', `Global Gaming Pricing Matrix updated by Admin`, 'ALERT');
    this.addNotification('Pricing Updated', 'Global Gaming Pricing Matrix updated by Admin.', 'INFO');

    // Sync to Supabase pricing_settings table for Website & Bookings
    try {
      const weekdays = [];
      const weekends = [];

      const mapRates = (deviceRates) => {
        return Object.entries(deviceRates || {}).map(([mins, val]) => {
          const hoursLabel = Number(mins) < 60 ? `${mins} MINUTES` : 
                             Number(mins) === 60 ? '1 HOUR' :
                             Number(mins) === 90 ? '1.5 HOURS' :
                             Number(mins) === 120 ? '2 HOURS' :
                             Number(mins) === 180 ? '3 HOURS' : `${Number(mins)/60} HOURS`;
          return {
            hours: hoursLabel,
            price: `₹${val}`
          };
        });
      };

      const deviceImages = {
        'PlayStation 5': "/images/gaming/ps5.webp",
        'PlayStation 4': "/images/gaming/ps4.webp",
        'PlayStation 2': "/images/gaming/ps2.webp",
        'Racing Simulator': "/images/gaming/racing-simulator.webp",
        'PS VR2': "/images/gaming/psvr2.webp"
      };

      if (newSettings.weekday) {
        Object.entries(newSettings.weekday).forEach(([device, rates]) => {
          weekdays.push({
            platform: device,
            image: deviceImages[device] || '',
            rates: mapRates(rates)
          });
        });
      }

      if (newSettings.weekend) {
        Object.entries(newSettings.weekend).forEach(([device, rates]) => {
          weekends.push({
            platform: device,
            image: deviceImages[device] || '',
            rates: mapRates(rates)
          });
        });
      }

      const { pricingService } = await import('./pricingService');
      await pricingService.savePricingBulk({ weekdays, weekends });
    } catch (e) {
      console.error('[sessionService] Error syncing pricing to Supabase:', e);
    }

    return updated;
  },

  async resetPricingSettings() {
    setItem(STORAGE_KEYS.PRICING, DEFAULT_PRICING_SETTINGS);
    this.addActivity('Pricing Reset', `Restored default pricing matrix for all devices`, 'ALERT');
    this.addNotification('Pricing Reset', 'Restored default pricing matrix for all devices.', 'INFO');
    return DEFAULT_PRICING_SETTINGS;
  },

  async getPriceForSession(deviceZone, durationMinutes) {
    const settings = getItem(STORAGE_KEYS.PRICING, DEFAULT_PRICING_SETTINGS);
    const pricePerPlayer = this.getPriceForSessionSync(deviceZone, durationMinutes, settings);
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return {
      pricePerPlayer: Number(pricePerPlayer),
      isWeekend,
      tierName: isWeekend ? 'Weekend Rate' : 'Weekday Rate',
      pricingMode: settings.pricingMode || 'AUTO'
    };
  },

  getPriceForSessionSync(deviceZone, durationMinutes, settings) {
    const pSettings = settings || getItem(STORAGE_KEYS.PRICING, DEFAULT_PRICING_SETTINGS);
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const tierKey = isWeekend ? 'weekend' : 'weekday';

    const durMins = Number(durationMinutes) || 60;
    const deviceMap = pSettings[tierKey]?.[deviceZone] || {};
    let pricePerPlayer = deviceMap[durMins];

    if (!pricePerPlayer) {
      if (deviceZone === 'PlayStation 5') pricePerPlayer = durMins === 30 ? 60 : durMins === 60 ? 100 : durMins === 120 ? (isWeekend ? 200 : 180) : 280;
      else if (deviceZone === 'PlayStation 4') pricePerPlayer = durMins === 60 ? (isWeekend ? 90 : 80) : durMins === 120 ? (isWeekend ? 160 : 150) : 220;
      else if (deviceZone === 'PlayStation 2') pricePerPlayer = durMins === 60 ? (isWeekend ? 70 : 60) : durMins === 120 ? (isWeekend ? 120 : 110) : 160;
      else if (deviceZone === 'Racing Simulator') pricePerPlayer = durMins === 30 ? 100 : durMins === 60 ? 180 : 250;
      else if (deviceZone === 'PS VR2') pricePerPlayer = durMins === 20 ? 100 : durMins === 40 ? 160 : 220;
      else pricePerPlayer = 100;
    }

    return pricePerPlayer;
  },

  async autoStartScheduledSession(sessionId) {
    try {
      // Always fetch from source of truth rather than relying on unreliable caches
      const { data: session, error } = await supabase
        .from('walkin_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
        
      if (error || !session) return;

      // Sync to Supabase directly
      this._enqueueSync(async () => {
        const { error: walkinErr } = await supabase
          .from('walkin_sessions')
          .update({ session_status: 'Active' })
          .eq('id', sessionId);
          
        if (walkinErr) throw walkinErr;

        if (session.device_id) {
          await deviceService.toggleStatus(session.device_id, 'RUNNING');
        }
      });

      // Best effort cache update to prevent double-firing before Supabase realtime pushes the event
      if (this._cachedActiveSessions) {
        const sessionIndex = this._cachedActiveSessions.findIndex(s => s.id === sessionId);
        if (sessionIndex !== -1) {
          this._cachedActiveSessions[sessionIndex].session_status = 'Active';
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('gforce_session_changed', {
              detail: { eventType: 'UPDATE', new: this._cachedActiveSessions[sessionIndex] }
            }));
          }
        }
      }

      playChime('generic');
    } catch (e) {
      console.error('Error auto-starting scheduled session:', e);
    }
  }
};