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

const newGetDashboardMetrics = `async getDashboardMetrics() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: walkins, error: wError } = await supabase.from('walkin_sessions').select('*');
      const { data: orders, error: oError } = await supabase.from('cafe_orders').select('*');
      const { deviceService } = await import('./deviceService');
      const devices = await deviceService.getDevices();
        
      if (wError) throw wError;
      if (oError) throw oError;

      let todayRevenue = 0;
      let totalPlayers = 0;
      let controllersInUse = 0;
      let totalControllers = 0;

      // Calculate total configured controllers
      devices.forEach(d => {
        let maxC = 4;
        if (d.category === 'PlayStation 2') maxC = 2;
        if (d.category === 'Racing Simulator' || d.category === 'PS VR2') maxC = 1;
        totalControllers += maxC;
      });

      walkins.forEach(w => {
        if (w.session_status === 'Active') {
          totalPlayers += Number(w.player_count || 0);
          controllersInUse += Number(w.player_count || 0); // 1 controller per player
        }
        
        const wDate = w.session_date || (w.created_at ? w.created_at.split('T')[0] : '');
        if (w.session_status === 'Completed' && wDate === today) {
          todayRevenue += Number(w.total_amount || 0);
        }
      });

      orders.forEach(o => {
        const oDate = o.created_at ? o.created_at.split('T')[0] : '';
        if (o.status === 'Completed' && oDate === today) {
          todayRevenue += Number(o.total_amount || 0);
        }
      });

      return {
        todayRevenue,
        runningSessions: walkins.filter(w => w.session_status === 'Active').length,
        availableDevices: devices.length - walkins.filter(w => w.session_status === 'Active').length,
        totalPlayers,
        controllersInUse,
        totalControllers: totalControllers || 20,
        availableControllers: (totalControllers || 20) - controllersInUse,
        onlineBookings: 0,
        memberships: 0
      };
    } catch (e) {
      console.error("Supabase getDashboardMetrics Error:", e);
      return { todayRevenue: 0, runningSessions: 0, availableDevices: 0, totalPlayers: 0, controllersInUse: 0, totalControllers: 20, availableControllers: 20, onlineBookings: 0, memberships: 0 };
    }
  },`;

// Check what the next method actually is
content = replaceMethod(content, 'async getDashboardMetrics() {', 'async startWalkInSession(', newGetDashboardMetrics);

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
        
        let maxC = 4;
        if (device.category === 'PlayStation 2') maxC = 2;
        if (device.category === 'Racing Simulator' || device.category === 'PS VR2') maxC = 1;
        
        if (activeSession) {
          return {
            id: device.device_code || device.id,
            name: device.device_name || device.name,
            zone: device.zone || device.category,
            category: device.category,
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
            image: device.image_url || '/admin/ps5-admin.webp',
            pricingSnapshot: activeSession.pricing_snapshot,
            memberDiscountInfo: activeSession.member_discount_info,
            alert5MinTriggered: false,
            alert0MinTriggered: false,
            reservationInfo: null
          };
        }
        
        return {
          id: device.device_code || device.id,
          name: device.device_name || device.name,
          zone: device.zone || device.category,
          category: device.category,
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
          image: device.image_url || '/admin/ps5-admin.webp',
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

fs.writeFileSync(filePath, content, 'utf8');
console.log("Dashboard restoring refactored successfully.");
