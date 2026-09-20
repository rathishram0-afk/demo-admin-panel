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

const newGetWalkInHistory = `async getWalkInHistory() {
    try {
      const { data, error } = await supabase
        .from('walkin_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(d => ({
        id: d.id,
        sessionId: d.session_code || d.id,
        stationId: d.device_id,
        leaderName: d.customer_name,
        phone: d.mobile_number,
        device: d.device_id,
        players: d.player_count,
        startTime: new Date(d.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTime: d.actual_end_time ? new Date(d.actual_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
        duration: (d.planned_duration + (d.extended_minutes || 0)) + ' mins',
        pricePerPlayer: d.hourly_price,
        gamingCharge: d.gaming_charge,
        originalGamingAmount: d.original_gaming_amount,
        discountAmount: d.discount_amount,
        foodTotal: d.food_total,
        totalAmount: d.total_amount,
        paymentStatus: d.payment_status || 'PAID',
        sessionStatus: d.session_status === 'Active' ? 'RUNNING' : 'COMPLETED',
        date: new Date(d.start_time).toLocaleDateString(),
        snackOrders: d.snack_orders || [],
        pricingSnapshot: d.pricing_snapshot,
        memberDiscountInfo: d.member_discount_info
      }));
    } catch(e) {
      console.error("Error fetching walk-in history:", e);
      return [];
    }
  },`;

content = replaceMethod(content, 'async getWalkInHistory() {', 'async deleteWalkInRecord(id) {', newGetWalkInHistory);

const newDeleteWalkInRecord = `async deleteWalkInRecord(id) {
    try {
      const { error } = await supabase.from('walkin_sessions').delete().eq('id', id);
      if (error) throw error;
      this.addActivity(\`Session Deleted\`, \`Removed session from history\`, 'ALERT');
      return await this.getWalkInHistory();
    } catch(e) {
      console.error("Error deleting walk-in:", e);
      throw e;
    }
  },`;

content = replaceMethod(content, 'async deleteWalkInRecord(id) {', 'async getActivities() {', newDeleteWalkInRecord);

const newGetActivities = `async getActivities() {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('time', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data.map(a => ({
        ...a,
        time: new Date(a.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
    } catch(e) {
      console.error("Error fetching activities:", e);
      return [];
    }
  },`;

content = replaceMethod(content, 'async getActivities() {', 'async addActivity(', newGetActivities);

const newAddActivity = `async addActivity(title, subtitle, type = 'INFO') {
    try {
      await supabase.from('activity_logs').insert([{
        title,
        message: subtitle,
        type
      }]);
      return await this.getActivities();
    } catch(e) {
      console.error("Error adding activity:", e);
    }
  },`;

content = replaceMethod(content, 'async addActivity(title, subtitle, type = \'INFO\') {', 'async getNotifications() {', newAddActivity);

fs.writeFileSync(filePath, content, 'utf8');
console.log("History and Activities refactored successfully.");
