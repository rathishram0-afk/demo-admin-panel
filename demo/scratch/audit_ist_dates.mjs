import { supabase } from '../src/services/supabase.js';

async function auditIstDates() {
  console.log("=================================================");
  console.log("AUDITING WALKIN & CAFE TIMESTAMPS IN ASIA/KOLKATA TIMEZONE");
  console.log("=================================================");

  const { data: walkins } = await supabase.from('walkin_sessions').select('*');
  const { data: cafe } = await supabase.from('cafe_orders').select('*');

  function getIstDate(ts) {
    if (!ts) return null;
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return null;
      // Convert to IST YYYY-MM-DD
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return formatter.format(d);
    } catch(e) {
      return null;
    }
  }

  const walkinsByIst = {};
  walkins.forEach(w => {
    const pStatus = String(w.payment_status || '').toLowerCase();
    const sStatus = String(w.session_status || '').toLowerCase();
    const isPrepaid = w.pricing_snapshot?.isPrepaid === true || pStatus === 'prepaid' || (pStatus === 'paid' && sStatus !== 'completed');
    const payTs = isPrepaid ? (w.start_time || w.created_at) : (w.actual_end_time || w.end_time || w.created_at);
    
    const istDate = getIstDate(payTs) || w.session_date;
    if (!walkinsByIst[istDate]) walkinsByIst[istDate] = [];
    walkinsByIst[istDate].push(w);
  });

  const cafeByIst = {};
  cafe.forEach(c => {
    const ts = c.created_at || c.timestamp || c.date;
    const istDate = getIstDate(ts);
    if (!cafeByIst[istDate]) cafeByIst[istDate] = [];
    cafeByIst[istDate].push(c);
  });

  const dates = Array.from(new Set([...Object.keys(walkinsByIst), ...Object.keys(cafeByIst)])).sort().reverse();

  dates.forEach(d => {
    const dayW = walkinsByIst[d] || [];
    const dayC = cafeByIst[d] || [];

    const paidW = dayW.filter(w => {
      const pStatus = String(w.payment_status || '').toLowerCase();
      const sStatus = String(w.session_status || '').toLowerCase();
      return pStatus === 'paid' || pStatus === 'prepaid' || sStatus === 'completed';
    });

    const paidC = dayC.filter(c => {
      const pStatus = String(c.payment_status || '').toLowerCase();
      const status = String(c.status || '').toLowerCase();
      return pStatus === 'paid' || status === 'completed' || status === 'collected';
    });

    let gamingRev = 0;
    let cashGaming = 0;
    let upiGaming = 0;
    let cardGaming = 0;

    paidW.forEach(w => {
      const pStatus = String(w.payment_status || '').toLowerCase();
      const sStatus = String(w.session_status || '').toLowerCase();
      const isPrepaid = w.pricing_snapshot?.isPrepaid === true || pStatus === 'prepaid' || (pStatus === 'paid' && sStatus !== 'completed');
      
      const gCharge = Number(w.gaming_charge || w.original_gaming_amount || (Number(w.total_amount || 0) - Number(w.food_total || 0)) || 0);
      const isRecognized = (sStatus === 'completed' || isPrepaid);
      
      if (isRecognized) {
        gamingRev += gCharge;
        const method = String(w.payment_method || w.pricing_snapshot?.paymentMethod || 'Cash').toLowerCase();
        if (method === 'upi' || method === 'gpay') upiGaming += gCharge;
        else if (method.includes('card')) cardGaming += gCharge;
        else cashGaming += gCharge;
      }
    });

    let cafeRev = 0;
    let cashCafe = 0;
    let upiCafe = 0;
    let cardCafe = 0;

    paidC.forEach(c => {
      const amt = Number(c.total_amount || c.total || 0);
      cafeRev += amt;
      const method = String(c.payment_method || 'Cash').toLowerCase();
      if (method === 'upi' || method === 'gpay') upiCafe += amt;
      else if (method.includes('card')) cardCafe += amt;
      else cashCafe += amt;
    });

    const totalRev = gamingRev + cafeRev;
    const totalCash = cashGaming + cashCafe;
    const totalUpi = upiGaming + upiCafe;
    const totalCard = cardGaming + cardCafe;

    console.log(`\n================ IST DATE: ${d} ================`);
    console.log(`  Paid Walkins Count: ${paidW.length}`);
    console.log(`  Paid Cafe Orders Count: ${paidC.length}`);
    console.log(`  Recognized Gaming Revenue: ₹${gamingRev}`);
    console.log(`  Paid Cafe Revenue: ₹${cafeRev}`);
    console.log(`  TOTAL REVENUE: ₹${totalRev}`);
    console.log(`  PAYMENT BREAKDOWN: Cash ₹${totalCash} | UPI ₹${totalUpi} | Debit Card ₹${totalCard} (Sum = ₹${totalCash + totalUpi + totalCard})`);
  });
}

auditIstDates();
