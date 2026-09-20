import fs from 'fs';

const filePath = 'src/services/sessionService.js';
let content = fs.readFileSync(filePath, 'utf8');

// Helper to replace a method completely
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

// 1. getDashboardMetrics
const newDashboardMetrics = `async getDashboardMetrics() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: walkins, error: wError } = await supabase.from('walkin_sessions').select('*');
      const { data: orders, error: oError } = await supabase.from('cafe_orders').select('*');
        
      if (wError) throw wError;
      if (oError) throw oError;

      let revenue = 0;
      let activeSessions = 0;
      let completedSessions = 0;

      walkins.forEach(w => {
        if (w.session_status === 'Active') {
          activeSessions++;
        }
        const wDate = w.session_date || (w.created_at ? w.created_at.split('T')[0] : '');
        if (w.session_status === 'Completed' && wDate === today) {
          completedSessions++;
          revenue += Number(w.total_amount || 0);
        }
      });

      orders.forEach(o => {
        const oDate = o.created_at ? o.created_at.split('T')[0] : '';
        if (o.status === 'Completed' && oDate === today) {
          revenue += Number(o.total_amount || 0);
        }
      });

      return {
        revenue,
        activePlayers: activeSessions,
        completedSessions,
        foodOrders: orders.length
      };
    } catch (e) {
      console.error("Supabase getDashboardMetrics Error:", e);
      return { revenue: 0, activePlayers: 0, completedSessions: 0, foodOrders: 0 };
    }
  },`;
content = replaceMethod(content, 'async getDashboardMetrics() {', 'async startWalkInSession({', newDashboardMetrics);

// 2. getStations
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
        const activeSession = activeSessions.find(s => s.device_id === device.device_code || s.device_id === device.id);
        
        if (activeSession) {
          return {
            ...device,
            id: device.device_code || device.id,
            name: device.device_name || device.name,
            status: 'RUNNING',
            currentSessionId: activeSession.session_code || activeSession.id,
            customerName: activeSession.customer_name,
            phone: activeSession.mobile_number,
            startTime: new Date(activeSession.start_time).getTime(),
            startTimeStr: new Date(activeSession.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            durationMinutes: activeSession.planned_duration + (activeSession.extended_minutes || 0),
            hourlyPrice: activeSession.hourly_price,
            price: activeSession.total_amount,
            currentAmount: activeSession.total_amount,
            type: 'Walk-in',
            paymentMethod: activeSession.payment_method,
            playersCount: activeSession.player_count,
            players: [activeSession.customer_name],
            snackOrders: activeSession.snack_orders || [],
            snackTotal: activeSession.food_total || 0,
            isPaused: false,
            pricingSnapshot: activeSession.pricing_snapshot,
            memberDiscountInfo: activeSession.member_discount_info,
            image: device.image_url || '/admin/ps5-admin.webp'
          };
        }
        
        return {
          ...device,
          id: device.device_code || device.id,
          name: device.device_name || device.name,
          image: device.image_url || '/admin/ps5-admin.webp',
          status: device.status || 'AVAILABLE',
          currentSessionId: null
        };
      }).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    } catch(e) {
      console.error("Error in getStations:", e);
      return [];
    }
  },`;
content = replaceMethod(content, 'async getStations() {', 'async addDevice(', newGetStations);

// 3. startWalkInSession
const newStartWalkInSession = `async startWalkInSession({ stationId, customerName, phone, numPlayers, durationMinutes, hourlyPrice, estimatedTotal, notes, paymentMethod }) {
    try {
      const { deviceService } = await import('./deviceService');
      const dbDevices = await deviceService.getDevices();
      const targetStation = dbDevices.find(s => s.device_code === stationId || s.id === stationId);
      
      if (targetStation && targetStation.status !== 'AVAILABLE') {
        throw new Error(\`\${targetStation.device_name} is currently \${targetStation.status}.\`);
      }

      const deviceZone = targetStation?.zone || 'PlayStation 5';
      const durMins = Number(durationMinutes) || 60;
      const { pricePerPlayer: dynamicPrice, isWeekend, tierName } = await this.getPriceForSession(deviceZone, durMins);
      const pricePerPlayer = hourlyPrice ? Number(hourlyPrice) : dynamicPrice;
      const playersNum = Number(numPlayers) || 1;
      const originalGamingAmount = estimatedTotal ? Number(estimatedTotal) : Math.round(pricePerPlayer * playersNum);

      const memberCheck = await membershipService.checkMemberDiscount(phone || customerName);
      let discountPercent = 0;
      let discountAmount = 0;
      let totalAmount = originalGamingAmount;
      let memberDiscountInfo = null;

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

      const newSessionCode = getNextSessionId();
      const pricingSnapshot = { hourlyPrice: pricePerPlayer, pricePerPlayer, durationMinutes: durMins, tierName, isWeekend };

      const { data, error } = await supabase.from('walkin_sessions').insert([{
        session_code: newSessionCode,
        customer_name: customerName || 'Walk-in Player',
        mobile_number: phone || '-',
        device_id: stationId,
        device_name: targetStation?.device_name || stationId,
        device_type: deviceZone,
        player_count: playersNum,
        planned_duration: durMins,
        hourly_price: pricePerPlayer,
        total_amount: totalAmount,
        gaming_charge: totalAmount,
        original_gaming_amount: originalGamingAmount,
        discount_amount: discountAmount,
        payment_method: paymentMethod || 'Cash',
        session_status: 'Active',
        pricing_snapshot: pricingSnapshot,
        member_discount_info: memberDiscountInfo
      }]).select().single();

      if (error) throw error;

      await deviceService.toggleStatus(stationId, 'ACTIVE');
      this.addActivity(\`Session \${newSessionCode} Started\`, \`Station \${stationId} started (Billed ₹\${totalAmount})\`, 'START');
      playChime('generic');
      
      return await this.getStations();
    } catch(e) {
      console.error("Error starting walk-in session:", e);
      throw e;
    }
  },`;
content = replaceMethod(content, 'async startWalkInSession({', 'async convertBookingToSession({', newStartWalkInSession);

// 4. endSession
const newEndSession = `async endSession(stationId) {
    try {
      const { data: activeSession, error: fetchErr } = await supabase
        .from('walkin_sessions')
        .select('*')
        .eq('device_id', stationId)
        .eq('session_status', 'Active')
        .single();
        
      if (fetchErr) throw fetchErr;
      
      if (activeSession.member_discount_info && activeSession.member_discount_info.isMonthly) {
        const playedHours = (activeSession.planned_duration + (activeSession.extended_minutes || 0)) / 60;
        await membershipService.deductMonthlyHours(activeSession.mobile_number || activeSession.customer_name, playedHours);
      }
      
      const { error: updateErr } = await supabase
        .from('walkin_sessions')
        .update({
          session_status: 'Completed',
          actual_end_time: new Date().toISOString(),
          payment_status: 'Paid'
        })
        .eq('id', activeSession.id);
        
      if (updateErr) throw updateErr;
      
      const { deviceService } = await import('./deviceService');
      await deviceService.toggleStatus(stationId, 'AVAILABLE');
      
      this.addActivity(\`Session Ended\`, \`Station \${stationId} Session Completed. Total Bill ₹\${activeSession.total_amount}\`, 'END');
      playChime('generic');
      
      return await this.getStations();
    } catch(e) {
      console.error("Error ending session:", e);
      throw e;
    }
  },`;
content = replaceMethod(content, 'async endSession(stationId) {', 'async getWalkInHistory() {', newEndSession);

// 5. extendSession
const newExtendSession = `async extendSession(stationId, extraMinutes) {
    try {
      const { data: activeSession, error: fetchErr } = await supabase
        .from('walkin_sessions')
        .select('*')
        .eq('device_id', stationId)
        .eq('session_status', 'Active')
        .single();
        
      if (fetchErr) throw fetchErr;

      const newExtended = (activeSession.extended_minutes || 0) + extraMinutes;
      const { pricePerPlayer: extraPrice } = await this.getPriceForSession(activeSession.device_type, extraMinutes);
      
      let extraCharge = extraPrice * activeSession.player_count;
      
      if (activeSession.member_discount_info && activeSession.member_discount_info.discountPercent) {
        extraCharge = extraCharge - Math.round(extraCharge * (activeSession.member_discount_info.discountPercent / 100));
      }
      
      const newTotal = Number(activeSession.gaming_charge || 0) + extraCharge;

      const { error: updateErr } = await supabase
        .from('walkin_sessions')
        .update({
          extended_minutes: newExtended,
          gaming_charge: newTotal,
          total_amount: newTotal + Number(activeSession.food_total || 0)
        })
        .eq('id', activeSession.id);
        
      if (updateErr) throw updateErr;

      playChime('generic');
      return await this.getStations();
    } catch(e) {
      console.error("Error extending session:", e);
      throw e;
    }
  },`;
content = replaceMethod(content, 'async extendSession(stationId, extraMinutes) {', 'async togglePauseSession(stationId) {', newExtendSession);


// Write file
fs.writeFileSync(filePath, content, 'utf8');
console.log("Refactored successfully.");
