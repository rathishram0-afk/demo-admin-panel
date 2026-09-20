import { supabase } from './supabase.js';
import { sessionService } from './sessionService.js';
import { deviceService } from './deviceService.js';

const STORAGE_KEYS = {
  OFFERS: 'gforce_pos_offers_v1'
};

const DEFAULT_OFFERS = [
  {
    id: 'offer-ps5-1hr-bonus',
    offer_name: 'Play 1 Hour Get 30 Minutes Free',
    device: 'PlayStation 5',
    paid_duration: '1 Hour',
    paid_duration_mins: 60,
    bonus_duration: '30 Minutes',
    bonus_duration_mins: 30,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '2026-12-31',
    status: 'Enabled',
    description: 'Pay for 1 Hour on PS5 and get 30 Minutes bonus time for FREE!'
  },
  {
    id: 'offer-ps5-2hr-1hr-free',
    offer_name: 'Play 2 Hours Get 1 Hour Free',
    device: 'PlayStation 5',
    paid_duration: '2 Hours',
    paid_duration_mins: 120,
    bonus_duration: '1 Hour',
    bonus_duration_mins: 60,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '2026-12-31',
    status: 'Enabled',
    description: 'Pay for 2 Hours on PS5 and get 1 Hour bonus time for FREE!'
  }
];

function getStoredOffers() {
  try {
    if (typeof localStorage !== 'undefined') {
      const item = localStorage.getItem(STORAGE_KEYS.OFFERS);
      return item ? JSON.parse(item) : DEFAULT_OFFERS;
    }
  } catch (e) {}
  return DEFAULT_OFFERS;
}

function setStoredOffers(offers) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.OFFERS, JSON.stringify(offers));
    }
  } catch (e) {
    console.error('Error saving offers to localStorage:', e);
  }
}

export const offerService = {
  async getOffers() {
    try {
      const { data, error } = await supabase.from('offers').select('*');
      if (!error && data && data.length > 0) {
        setStoredOffers(data);
        return data;
      }
    } catch (e) {
      console.warn('Supabase offers fetch fallback to localStorage:', e);
    }
    return getStoredOffers();
  },

  async createOffer(offerData) {
    const newOffer = {
      id: `offer-${Date.now()}`,
      offer_name: offerData.offer_name || 'Special Gaming Offer',
      device: offerData.device || 'PlayStation 5',
      paid_duration: offerData.paid_duration || '1 Hour',
      paid_duration_mins: Number(offerData.paid_duration_mins || 60),
      bonus_duration: '30 Minutes',
      bonus_duration_mins: 30,
      start_date: offerData.start_date || new Date().toISOString().split('T')[0],
      end_date: offerData.end_date || '2026-12-31',
      status: offerData.status || 'Enabled',
      description: offerData.description || 'Special gaming bonus offer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const currentOffers = getStoredOffers();
    const updated = [newOffer, ...currentOffers];
    setStoredOffers(updated);

    try {
      await supabase.from('offers').insert([newOffer]).catch(() => {});
    } catch (e) {}

    try {
      await sessionService.addNotification(
        'Offer Created',
        `New Offer "${newOffer.offer_name}" created for ${newOffer.device}.`,
        'SUCCESS'
      );
    } catch (nErr) {}

    return newOffer;
  },

  async updateOffer(id, updatedFields) {
    const currentOffers = getStoredOffers();
    const updated = currentOffers.map(o => {
      if (o.id === id) {
        return {
          ...o,
          ...updatedFields,
          updated_at: new Date().toISOString()
        };
      }
      return o;
    });
    setStoredOffers(updated);

    try {
      await supabase.from('offers').update(updatedFields).eq('id', id).catch(() => {});
    } catch (e) {}

    return updated;
  },

  async toggleOfferStatus(id) {
    const currentOffers = getStoredOffers();
    let nextStatus = 'Enabled';
    const updated = currentOffers.map(o => {
      if (o.id === id) {
        nextStatus = o.status === 'Enabled' ? 'Disabled' : 'Enabled';
        return {
          ...o,
          status: nextStatus,
          updated_at: new Date().toISOString()
        };
      }
      return o;
    });
    setStoredOffers(updated);

    try {
      await supabase.from('offers').update({ status: nextStatus }).eq('id', id).catch(() => {});
    } catch (e) {}

    return updated;
  },

  async deleteOffer(id) {
    const currentOffers = getStoredOffers();
    const updated = currentOffers.filter(o => o.id !== id);
    setStoredOffers(updated);

    try {
      await supabase.from('offers').delete().eq('id', id).catch(() => {});
    } catch (e) {}

    return updated;
  },

  async startOfferSession({
    offerName,
    stationId,
    customerName,
    phone,
    numPlayers,
    paidDurationMinutes,
    bonusDurationMinutes,
    deviceType = 'PlayStation 5',
    paymentStatus = 'Pay at Checkout',
    paymentMethod = null,
    splitBreakdown = null,
    notes = '',
    manualAmount = null,
    manualStartTime = null
  }) {
    const paidMins = Number(paidDurationMinutes) || 60;
    
    // Deterministic Bonus Rule:
    // 120 mins paid (2 Hours) -> strictly 60 mins bonus (3 Hours Total)
    // 60 mins paid (1 Hour) -> strictly 30 mins bonus (1.5 Hours Total)
    // 30 mins paid -> 0 mins bonus (30 Mins Total)
    let bonusMins = 30;
    if (paidMins === 120) {
      bonusMins = 60;
    } else if (paidMins === 60) {
      bonusMins = 30;
    } else if (paidMins === 30) {
      bonusMins = 0;
    } else if (bonusDurationMinutes !== undefined && bonusDurationMinutes !== null) {
      bonusMins = Number(bonusDurationMinutes);
    }
    
    const finalDurationMinutes = paidMins + bonusMins;

    // Calculate or use Manual Amount
    let paidAmount = 0;
    if (manualAmount !== null && manualAmount !== undefined && manualAmount !== '' && !isNaN(Number(manualAmount))) {
      paidAmount = Number(manualAmount);
    } else {
      // Fetch pricing strictly from Pricing Settings for the paid duration ONLY
      const pricingSettings = await sessionService.getPricingSettings();
      const pricePerPlayer = sessionService.getPriceForSessionSync(deviceType, paidMins, pricingSettings);
      const playersNum = Number(numPlayers) || 1;
      paidAmount = Math.round(pricePerPlayer * playersNum);
    }

    const pricePerPlayer = (Number(numPlayers) || 1) > 0 ? Math.round(paidAmount / (Number(numPlayers) || 1)) : paidAmount;

    const offerNotes = `[OFFER: ${offerName || 'Play Offer'}] ${notes}`.trim();

    // Launch session using sessionService.startWalkInSession
    // planned_duration receives finalDurationMinutes (e.g. 180 mins)
    // estimatedTotal receives paidAmount (e.g. ₹200), customer pays ONLY for paid duration
    const result = await sessionService.startWalkInSession({
      stationId,
      customerName: customerName || 'Offer Customer',
      phone: phone || '-',
      numPlayers: Number(numPlayers) || 1,
      durationMinutes: finalDurationMinutes,
      hourlyPrice: pricePerPlayer,
      estimatedTotal: paidAmount,
      originalGamingAmount: paidAmount,
      paymentStatus: paymentStatus || 'Pay at Checkout',
      paymentMethod: paymentMethod || 'Cash',
      splitBreakdown: splitBreakdown || null,
      notes: offerNotes,
      manualStartTime: manualStartTime || null,
      isManualMode: true // Lock total amount strictly to paidAmount
    });

    try {
      await sessionService.addActivity(
        'Offer Session Launched',
        `Station ${stationId} started with Offer "${offerName}" (${finalDurationMinutes} mins, Paid ₹${paidAmount})`,
        'START'
      );
    } catch (e) {}

    return result;
  }
};
