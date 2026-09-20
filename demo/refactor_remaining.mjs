import fs from 'fs';

const filePath = 'src/services/sessionService.js';
let content = fs.readFileSync(filePath, 'utf8');

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

// 1. addSnackOrderToStation
const newAddSnackOrderToStation = `async addSnackOrderToStation(stationId, expectedSessionId, snackItem) {
    try {
      const { data: activeSession, error: fetchErr } = await supabase
        .from('walkin_sessions')
        .select('*')
        .eq('device_id', stationId)
        .eq('session_status', 'Active')
        .single();
        
      if (fetchErr) throw fetchErr;
      
      const currentOrders = activeSession.snack_orders || [];
      const newOrders = [...currentOrders];
      
      const matched = newOrders.find(o => o.name === snackItem.name);
      if (matched) {
        matched.qty += snackItem.qty;
        matched.subtotal += snackItem.subtotal;
      } else {
        newOrders.push({ ...snackItem });
      }
      
      const newFoodTotal = Number(activeSession.food_total || 0) + Number(snackItem.subtotal);
      const newTotalAmount = Number(activeSession.gaming_charge || 0) + newFoodTotal;

      const { error: updateErr } = await supabase
        .from('walkin_sessions')
        .update({
          snack_orders: newOrders,
          food_total: newFoodTotal,
          total_amount: newTotalAmount
        })
        .eq('id', activeSession.id);
        
      if (updateErr) throw updateErr;

      playChime('generic');
      return await this.getStations();
    } catch(e) {
      console.error("Error adding snack to station:", e);
      throw e;
    }
  },`;

content = replaceMethod(content, 'async addSnackOrderToStation(stationId, expectedSessionId, snackItem) {', 'async getDashboardMetrics() {', newAddSnackOrderToStation);

// 2. togglePauseSession
const newTogglePauseSession = `async togglePauseSession(stationId) {
    console.warn("togglePauseSession is not fully supported in Supabase yet. We recommend modifying the time instead.");
    return await this.getStations();
  },`;

content = replaceMethod(content, 'async togglePauseSession(stationId) {', 'async changeDevice(currentStationId, newStationId) {', newTogglePauseSession);

// 3. changeDevice
const newChangeDevice = `async changeDevice(currentStationId, newStationId) {
    try {
      const { data: activeSession, error: fetchErr } = await supabase
        .from('walkin_sessions')
        .select('*')
        .eq('device_id', currentStationId)
        .eq('session_status', 'Active')
        .single();
        
      if (fetchErr) throw new Error("No active session found on current device");

      const { deviceService } = await import('./deviceService');
      const dbDevices = await deviceService.getDevices();
      const targetNew = dbDevices.find(s => s.device_code === newStationId || s.id === newStationId);
      
      if (!targetNew || targetNew.status !== 'AVAILABLE') {
        throw new Error("Target device is not available.");
      }

      const { error: updateErr } = await supabase
        .from('walkin_sessions')
        .update({
          device_id: newStationId,
          device_name: targetNew.device_name || newStationId,
          device_type: targetNew.zone || targetNew.category
        })
        .eq('id', activeSession.id);
        
      if (updateErr) throw updateErr;
      
      await deviceService.toggleStatus(currentStationId, 'AVAILABLE');
      await deviceService.toggleStatus(newStationId, 'ACTIVE');
      
      this.addActivity('Device Changed', \`Session transferred from \${currentStationId} to \${newStationId}.\`, 'INFO');
      
      return await this.getStations();
    } catch(e) {
      console.error("Error changing device:", e);
      throw e;
    }
  },`;

content = replaceMethod(content, 'async changeDevice(currentStationId, newStationId) {', 'async endSession(stationId) {', newChangeDevice);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Remaining methods refactored successfully.");
