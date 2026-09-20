import fs from 'fs';

const filePath = 'src/services/sessionService.js';
let content = fs.readFileSync(filePath, 'utf8');

// Helper to replace method block safely
function replaceMethod(content, startString, nextMethodStartString, newMethodBody) {
    const startIndex = content.indexOf(startString);
    if (startIndex === -1) {
        console.error("Could not find start:", startString);
        return content;
    }
    const endIndex = content.indexOf(nextMethodStartString, startIndex);
    if (endIndex === -1) {
        console.error("Could not find end:", nextMethodStartString);
        return content;
    }
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);
    return before + newMethodBody + '\n\n  ' + after;
}

// 1. Image Helper Function
const imageHelper = `
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
`;

// Inject helper near top if not present
if (!content.includes('function resolveDeviceImage(')) {
  content = imageHelper + '\n' + content;
}

// 2. findAvailableStation
const newFindAvailableStation = `async findAvailableStation(deviceZone) {
    try {
      const stations = await this.getStations();
      const zoneClean = (deviceZone || '').toLowerCase();
      
      // Filter all stations of this category/zone
      const matchingStations = stations.filter(s => {
        const z = (s.zone || s.category || '').toLowerCase();
        return z === zoneClean || z.includes(zoneClean) || zoneClean.includes(z);
      });

      // Find first AVAILABLE station in order
      const available = matchingStations.find(s => s.status === 'AVAILABLE');

      if (available) {
        return { availableStation: available, error: null };
      }

      let errorMsg = \`No \${deviceZone} Stations Available\`;
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
  },`;

content = replaceMethod(content, 'async findAvailableStation(deviceZone) {', 'async toggleMaintenance(', newFindAvailableStation);

// 3. toggleMaintenance
const newToggleMaintenance = `async toggleMaintenance(stationId) {
    try {
      const stations = await this.getStations();
      const target = stations.find(s => s.id === stationId);

      if (target && (target.status === 'RUNNING' || target.status === 'ACTIVE' || target.status === 'ENDING_SOON')) {
        throw new Error(\`Cannot enable Maintenance on \${stationId} while a session is RUNNING.\`);
      }

      const isNowMaint = target?.status !== 'MAINTENANCE';
      const newStatus = isNowMaint ? 'MAINTENANCE' : 'AVAILABLE';

      const { data: dbDevice } = await supabase
        .from('devices')
        .select('id')
        .or(\`device_code.eq.\${stationId},id.eq.\${stationId}\`)
        .single();

      if (dbDevice) {
        await supabase.from('devices').update({ status: newStatus }).eq('id', dbDevice.id);
      }

      this.addActivity(\`Maintenance Toggled\`, \`\${stationId} is now \${newStatus}\`, 'ALERT');
      this.addNotification(\`Device Maintenance \${isNowMaint ? 'Enabled' : 'Disabled'}\`, \`Station \${stationId} is now \${newStatus === 'MAINTENANCE' ? 'Under Maintenance' : 'Available again'}.\`, 'ALERT');
      return await this.getStations();
    } catch(e) {
      console.error("Error toggling maintenance:", e);
      throw e;
    }
  },`;

content = replaceMethod(content, 'async toggleMaintenance(stationId) {', 'async addDevice(', newToggleMaintenance);

// 4. getStations
const newGetStations = `async getStations() {
    try {
      const { deviceService } = await import('./deviceService');
      const dbDevices = await deviceService.getDevices();
      
      const { data: activeSessions, error } = await supabase
        .from('walkin_sessions')
        .select('*')
        .eq('session_status', 'Active');
        
      if (error) throw error;

      return dbDevices.map(device => {
        const activeSession = activeSessions ? activeSessions.find(s => s.device_id === device.device_code || s.device_id === device.id) : null;
        
        let maxC = 4;
        const cat = (device.category || device.zone || '').toLowerCase();
        if (cat.includes('ps2') || cat.includes('playstation 2')) maxC = 2;
        if (cat.includes('sim') || cat.includes('vr')) maxC = 1;
        
        const deviceImg = resolveDeviceImage(device);

        if (activeSession) {
          return {
            id: device.device_code || device.id,
            dbId: device.id,
            name: device.device_name || device.name || device.device_code,
            zone: device.zone || device.category || 'PlayStation 5',
            category: device.category || device.zone || 'PlayStation 5',
            status: 'RUNNING',
            currentSessionId: activeSession.session_code || activeSession.id,
            customerName: activeSession.customer_name,
            phone: activeSession.mobile_number,
            startTime: new Date(activeSession.start_time).getTime(),
            startTimeStr: new Date(activeSession.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            durationMinutes: activeSession.planned_duration + (activeSession.extended_minutes || 0),
            price: activeSession.total_amount,
            hourlyPrice: activeSession.hourly_price,
            type: 'Walk-in',
            paymentMethod: activeSession.payment_method,
            playersCount: activeSession.player_count,
            controllersUsed: activeSession.player_count,
            controllersTotal: maxC,
            maxPlayers: maxC,
            players: [activeSession.customer_name],
            snackOrders: activeSession.snack_orders || [],
            snackTotal: activeSession.food_total || 0,
            isPaused: false,
            pausedAt: null,
            totalPausedMs: 0,
            bookedDuration: '00:00:00',
            notes: '',
            image: deviceImg,
            pricingSnapshot: activeSession.pricing_snapshot,
            memberDiscountInfo: activeSession.member_discount_info,
            alert5MinTriggered: false,
            alert0MinTriggered: false,
            reservationInfo: null
          };
        }
        
        return {
          id: device.device_code || device.id,
          dbId: device.id,
          name: device.device_name || device.name || device.device_code,
          zone: device.zone || device.category || 'PlayStation 5',
          category: device.category || device.zone || 'PlayStation 5',
          status: device.status || 'AVAILABLE',
          currentSessionId: null,
          customerName: null,
          phone: null,
          startTime: null,
          durationMinutes: 0,
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
          alert5MinTriggered: false,
          alert0MinTriggered: false,
          reservationInfo: null,
          memberDiscountInfo: null
        };
      }).sort((a, b) => {
         const orderA = a.display_order !== undefined ? a.display_order : 999;
         const orderB = b.display_order !== undefined ? b.display_order : 999;
         return orderA - orderB;
      });
    } catch(e) {
      console.error("Error in getStations:", e);
      return [];
    }
  },`;

content = replaceMethod(content, 'async getStations() {', 'async addDevice(', newGetStations);

// 5. addDevice, updateDevice, deleteDevice, duplicateDevice
const newDeviceCRUD = `async addDevice(formData) {
    try {
      const rawName = (formData.name || formData.deviceName || formData.device_name || '').trim();
      if (!rawName) throw new Error('Device Name cannot be empty.');

      const zone = formData.zone || formData.category || 'PlayStation 5';
      const code = formData.device_code || formData.id || rawName;

      let localImg = formData.image || formData.image_url || '';
      if (!localImg) {
        localImg = resolveDeviceImage({ category: zone, device_code: code });
      }

      const { data, error } = await supabase.from('devices').insert([{
        device_code: code,
        device_name: rawName,
        zone: zone,
        category: zone,
        status: formData.status || 'AVAILABLE',
        image_url: localImg,
        is_active: true
      }]).select().single();

      if (error) throw error;

      this.addActivity('New Device Added', \`Station \${rawName} (\${zone}) created\`, 'START');
      this.addNotification('Device Created', \`Station \${rawName} (\${zone}) was added.\`, 'SUCCESS');
      return await this.getStations();
    } catch(e) {
      console.error("Error adding device:", e);
      throw e;
    }
  },

  async updateDevice(stationId, updatedFields) {
    try {
      const { data: target } = await supabase
        .from('devices')
        .select('id')
        .or(\`device_code.eq.\${stationId},id.eq.\${stationId}\`)
        .single();

      if (!target) throw new Error(\`Device \${stationId} not found.\`);

      const payload = {};
      if (updatedFields.name || updatedFields.device_name) payload.device_name = updatedFields.name || updatedFields.device_name;
      if (updatedFields.zone || updatedFields.category) {
        payload.zone = updatedFields.zone || updatedFields.category;
        payload.category = updatedFields.zone || updatedFields.category;
      }
      if (updatedFields.status) payload.status = updatedFields.status;
      if (updatedFields.image || updatedFields.image_url) payload.image_url = updatedFields.image || updatedFields.image_url;

      const { error } = await supabase.from('devices').update(payload).eq('id', target.id);
      if (error) throw error;

      this.addActivity('Device Updated', \`Station \${stationId} updated\`, 'INFO');
      return await this.getStations();
    } catch(e) {
      console.error("Error updating device:", e);
      throw e;
    }
  },

  async deleteDevice(stationId) {
    try {
      const { data: target } = await supabase
        .from('devices')
        .select('*')
        .or(\`device_code.eq.\${stationId},id.eq.\${stationId}\`)
        .single();

      if (!target) throw new Error(\`Device \${stationId} not found.\`);

      if (target.status === 'RUNNING' || target.status === 'ACTIVE' || target.status === 'BUSY') {
        throw new Error('This device currently has an active session.');
      }

      const { error } = await supabase.from('devices').delete().eq('id', target.id);
      if (error) throw error;

      this.addActivity('Device Deleted', \`Station \${target.device_name || stationId} removed\`, 'ALERT');
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
      if (!target) throw new Error(\`Device \${stationId} not found.\`);

      let baseName = target.name || stationId;
      let nextNum = 2;
      let newName = \`\${baseName}-COPY\`;

      const match = baseName.match(/^(.*?)[-\\s]?(\\d+)$/);
      if (match) {
        const prefix = match[1];
        const num = parseInt(match[2], 10);
        nextNum = num + 1;
        newName = \`\${prefix}-\${nextNum}\`;
        while (stations.some(s => s.id.toLowerCase() === newName.toLowerCase())) {
          nextNum++;
          newName = \`\${prefix}-\${nextNum}\`;
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
  },`;

content = replaceMethod(content, 'async addDevice(formData) {', 'async getDashboardMetrics() {', newDeviceCRUD);

fs.writeFileSync(filePath, content, 'utf8');
console.log("SessionService refactored successfully.");
