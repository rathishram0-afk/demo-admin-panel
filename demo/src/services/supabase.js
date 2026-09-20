/**
 * STANDALONE DEMO-ONLY SUPABASE EMULATOR
 * Zero external connections, zero production network calls.
 * All demo mutations and operations are stored safely in client-side localStorage.
 */

import { GAMES_DATA, MENU_DATA, PRICING_DATA } from '../data/gamingData.js';

const DEMO_STORAGE_PREFIX = 'gforce_demo_table_';

const INITIAL_DEVICES = [
  { id: 'dev-ps5-1', device_code: 'PS5-1', device_name: 'PS5 - 1', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 1, image_url: '/admin/ps5-admin.webp' },
  { id: 'dev-ps5-2', device_code: 'PS5-2', device_name: 'PS5 - 2', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 2, image_url: '/admin/ps5-admin.webp' },
  { id: 'dev-ps5-3', device_code: 'PS5-3', device_name: 'PS5 - 3', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 3, image_url: '/admin/ps5-admin.webp' },
  { id: 'dev-ps5-4', device_code: 'PS5-4', device_name: 'PS5 - 4', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 4, image_url: '/admin/ps5-admin.webp' },
  { id: 'dev-ps5-1-extra', device_code: 'PS5-1-EXTRA', device_name: 'PS5 - 1 EXTRA PERSON', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 5, image_url: '/admin/ps5-admin.webp' },
  { id: 'dev-ps5-2-extra', device_code: 'PS5-2-EXTRA', device_name: 'PS5 - 2 EXTRA PERSON', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 6, image_url: '/admin/ps5-admin.webp' },
  { id: 'dev-ps5-3-extra', device_code: 'PS5-3-EXTRA', device_name: 'PS5 - 3 EXTRA PERSON', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 7, image_url: '/admin/ps5-admin.webp' },
  { id: 'dev-ps5-4-extra', device_code: 'PS5-4-EXTRA', device_name: 'PS5 - 4 EXTRA PERSON', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 8, image_url: '/admin/ps5-admin.webp' },
  { id: 'dev-ps4-1', device_code: 'PS4-1', device_name: 'PS4 - 1', zone: 'PlayStation 4', category: 'PlayStation 4', platform: 'PlayStation 4', status: 'AVAILABLE', is_active: true, display_order: 9, image_url: '/admin/ps4-admin.webp' },
  { id: 'dev-ps4-2', device_code: 'PS4-2', device_name: 'PS4 - 2', zone: 'PlayStation 4', category: 'PlayStation 4', platform: 'PlayStation 4', status: 'AVAILABLE', is_active: true, display_order: 10, image_url: '/admin/ps4-admin.webp' },
  { id: 'dev-ps4-3', device_code: 'PS4-3', device_name: 'PS4 - 3', zone: 'PlayStation 4', category: 'PlayStation 4', platform: 'PlayStation 4', status: 'AVAILABLE', is_active: true, display_order: 11, image_url: '/admin/ps4-admin.webp' },
  { id: 'dev-ps4-4', device_code: 'PS4-4', device_name: 'PS4 - 4', zone: 'PlayStation 4', category: 'PlayStation 4', platform: 'PlayStation 4', status: 'AVAILABLE', is_active: true, display_order: 12, image_url: '/admin/ps4-admin.webp' },
  { id: 'dev-ps2-1', device_code: 'PS2-1', device_name: 'PS2 - 1', zone: 'PlayStation 2', category: 'PlayStation 2', platform: 'PlayStation 2', status: 'AVAILABLE', is_active: true, display_order: 13, image_url: '/admin/ps2-admin.webp' },
  { id: 'dev-sim-1', device_code: 'SIM-1', device_name: 'SIM - 1', zone: 'Racing Simulator', category: 'Racing Simulator', platform: 'Racing Simulator', status: 'AVAILABLE', is_active: true, display_order: 14, image_url: '/admin/sim1-admin.webp' },
  { id: 'dev-vr-1', device_code: 'VR-1', device_name: 'VR - 1', zone: 'PS VR2', category: 'PS VR2', platform: 'PS VR2', status: 'AVAILABLE', is_active: true, display_order: 15, image_url: '/admin/vr-admin.webp' }
];

function getInitialMenuRows() {
  const rows = [];
  let order = 1;
  const categories = Object.keys(MENU_DATA || {});
  categories.forEach(cat => {
    const items = MENU_DATA[cat] || [];
    items.forEach(item => {
      rows.push({
        id: item.id || `menu-${order}`,
        name: item.name,
        category: item.category || cat,
        description: item.tagline || '',
        price: item.numericPrice || parseFloat(String(item.price || '0').replace(/[^0-9.]/g, '')) || 0,
        image_url: item.image,
        is_available: item.status !== 'OUT_OF_STOCK',
        is_featured: !!item.badge,
        display_order: order++,
        created_at: new Date().toISOString()
      });
    });
  });
  return rows;
}

function getInitialGameRows() {
  const rows = [];
  let order = 1;
  (GAMES_DATA || []).forEach(g => {
    let cat = 'storyMode';
    const c = String(g.category || '').toLowerCase();
    if (c.includes('multiplayer') || c.includes('co-op')) cat = 'multiplayer';
    else if (c.includes('racing') || c.includes('sim')) cat = 'racingSim';
    else if (c.includes('vr')) cat = 'vrExperience';

    rows.push({
      id: g.id || `game-${order}`,
      title: g.title,
      category: cat,
      genre: g.genre || '',
      platform: g.platform || '',
      players: g.players || '1 Player',
      description: g.description || '',
      cover_image: g.image || '',
      featured: true,
      is_available: true,
      display_order: order++,
      created_at: new Date().toISOString()
    });
  });
  return rows;
}

function getInitialPricingRows() {
  const rows = [];
  let order = 1;
  const addCategory = (list, catName) => {
    (list || []).forEach(plat => {
      (plat.rates || []).forEach(r => {
        rows.push({
          id: `price-${order}`,
          category: catName,
          platform: plat.platform,
          duration: r.hours,
          currency: '₹',
          price: parseFloat(String(r.price).replace(/[^0-9.]/g, '')) || 0,
          image_url: plat.image,
          display_order: order++,
          created_at: new Date().toISOString()
        });
      });
    });
  };
  addCategory(PRICING_DATA?.weekdays, 'weekdays');
  addCategory(PRICING_DATA?.weekends, 'weekends');
  return rows;
}

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

const INITIAL_SETTINGS = [
  {
    id: 'st-general',
    setting_key: 'general',
    setting_value: {
      cafeName: 'G-FORCE GAMING HUB',
      tagline: 'Level Up Your Experience',
      address: '2, Kanniyamman Kovil Street, Raghavendra Nagar, Nesapakkam, Chennai, Greater Chennai, Tamil Nadu – 600078',
      phone: '+91 9344176534',
      whatsapp: '+91 9344176534',
      email: 'gforcegaminghub@gmail.com',
      googleMapsLink: 'https://maps.google.com/?q=2,+Kanniyamman+Kovil+Street,+Raghavendra+Nagar,+Nesapakkam,+Chennai,+Tamil+Nadu+600078',
      logoUrl: '/images/logo/gforcehub-logo.jpg'
    }
  }
];

const INITIAL_WEBSITE_CONTENT = [
  {
    id: 'cms-root',
    content_key: 'main',
    hero: {
      title: "CHENNAI'S PREMIER LUXURY CYBERPUNK GAMING LOUNGE",
      subtitle: 'Experience Next-Gen Gaming on PS5, PS VR2 & Simulators',
      ctaText: 'RESERVE SESSION NOW'
    },
    about: {
      title: 'About G-FORCE Gaming Cafe',
      description: 'We offer state-of-the-art gaming stations, high-refresh 4K HDR displays, ergonomic secretlab seating, and premium snacks for non-stop gaming action.'
    },
    pricing: {
      ps5Rate: '₹100 / hr',
      ps4Rate: '₹80 / hr',
      ps2Rate: '₹60 / hr',
      vrRate: '₹100 / 20m',
      racingRate: '₹100 / 30m'
    },
    contact: {
      address: '2, Kanniyamman Kovil Street, Raghavendra Nagar, Nesapakkam, Chennai, Greater Chennai, Tamil Nadu – 600078',
      phone: '+91 9344176534',
      email: 'gforcegaminghub@gmail.com',
      mapsLink: 'https://maps.google.com/?q=2,+Kanniyamman+Kovil+Street,+Raghavendra+Nagar,+Nesapakkam,+Chennai,+Tamil+Nadu+600078'
    },
    hours: {
      weekday: 'Mon - Fri: 10:00 AM - 11:00 PM',
      weekend: 'Sat - Sun: 09:30 AM - 11:30 PM'
    },
    seo: {
      metaTitle: 'G-FORCE Gaming Hub | Premier Cyberpunk Gaming Lounge in Chennai',
      metaDescription: 'Book PS5, PS VR2, PS4, PS2 & Racing Simulators at G-FORCE Gaming Hub in Nesapakkam, Chennai.'
    }
  }
];

class LocalDatabase {
  constructor() {
    this.memoryTables = new Map();
    this.subscribers = new Set();
    this.initDefaultTables();
  }

  initDefaultTables() {
    // Transactional tables start 100% clean
    this.ensureTable('walkin_sessions', () => []);
    this.ensureTable('cafe_orders', () => []);
    this.ensureTable('cafe_daily_archives', () => []);
    this.ensureTable('memberships', () => []);
    this.ensureTable('bookings', () => []);
    this.ensureTable('activity_logs', () => []);

    // Configuration / asset tables populated for demonstration
    this.ensureTable('devices', () => INITIAL_DEVICES);
    this.ensureTable('cafe_menu', getInitialMenuRows);
    this.ensureTable('game_library', getInitialGameRows);
    this.ensureTable('pricing_settings', getInitialPricingRows);
    this.ensureTable('offers', () => DEFAULT_OFFERS);
    this.ensureTable('settings', () => INITIAL_SETTINGS);
    this.ensureTable('website_content', () => INITIAL_WEBSITE_CONTENT);
  }

  ensureTable(tableName, defaultFactory) {
    const key = DEMO_STORAGE_PREFIX + tableName;
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          this.memoryTables.set(tableName, parsed);
          return;
        }
      }
    } catch (e) {}

    const initData = defaultFactory();
    this.memoryTables.set(tableName, initData);
    this.saveTable(tableName, initData);
  }

  getTable(tableName) {
    if (!this.memoryTables.has(tableName)) {
      this.ensureTable(tableName, () => []);
    }
    return [...(this.memoryTables.get(tableName) || [])];
  }

  saveTable(tableName, data) {
    this.memoryTables.set(tableName, data);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(DEMO_STORAGE_PREFIX + tableName, JSON.stringify(data));
      }
    } catch (e) {}
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify(tableName, eventType, record, oldRecord = null) {
    const payload = {
      table: tableName,
      eventType,
      new: record,
      old: oldRecord
    };
    this.subscribers.forEach(cb => {
      try {
        cb(payload);
      } catch (e) {
        console.warn('[DemoDB] Subscriber error:', e);
      }
    });

    if (typeof window !== 'undefined') {
      if (tableName === 'walkin_sessions') {
        window.dispatchEvent(new CustomEvent('gforce_session_changed', { detail: payload }));
        window.dispatchEvent(new CustomEvent('gforce_dashboard_updated'));
      } else if (tableName === 'cafe_orders') {
        window.dispatchEvent(new CustomEvent('gforce_order_updated', { detail: payload }));
        window.dispatchEvent(new CustomEvent('gforce_dashboard_updated'));
      }
    }
  }
}

const localDb = new LocalDatabase();

class MockQueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.filters = [];
    this.orConditions = [];
    this.sortFields = [];
    this.limitCount = null;
    this.rangeOffsets = null;
    this.isSingle = false;
    this.isMaybeSingle = false;
    this.operation = 'SELECT';
    this.insertData = null;
    this.updateData = null;
    this.upsertData = null;
    this.upsertOptions = null;
    this.selectFields = '*';
  }

  select(fields = '*') {
    this.selectFields = fields;
    return this;
  }

  insert(data) {
    this.operation = 'INSERT';
    this.insertData = Array.isArray(data) ? data : [data];
    return this;
  }

  update(data) {
    this.operation = 'UPDATE';
    this.updateData = data;
    return this;
  }

  upsert(data, options = {}) {
    this.operation = 'UPSERT';
    this.upsertData = Array.isArray(data) ? data : [data];
    this.upsertOptions = options;
    return this;
  }

  delete() {
    this.operation = 'DELETE';
    return this;
  }

  eq(column, value) {
    this.filters.push(row => String(row[column] ?? '') === String(value ?? ''));
    return this;
  }

  neq(column, value) {
    this.filters.push(row => String(row[column] ?? '') !== String(value ?? ''));
    return this;
  }

  gt(column, value) {
    this.filters.push(row => Number(row[column]) > Number(value));
    return this;
  }

  gte(column, value) {
    this.filters.push(row => Number(row[column]) >= Number(value));
    return this;
  }

  lt(column, value) {
    this.filters.push(row => Number(row[column]) < Number(value));
    return this;
  }

  lte(column, value) {
    this.filters.push(row => Number(row[column]) <= Number(value));
    return this;
  }

  in(column, values) {
    const arr = Array.isArray(values) ? values.map(v => String(v).toLowerCase()) : [];
    this.filters.push(row => arr.includes(String(row[column] ?? '').toLowerCase()));
    return this;
  }

  is(column, value) {
    if (value === null) {
      this.filters.push(row => row[column] === null || row[column] === undefined);
    } else {
      this.filters.push(row => row[column] === value);
    }
    return this;
  }

  not(column, operator, value) {
    if (operator === 'is' && value === null) {
      this.filters.push(row => row[column] !== null && row[column] !== undefined);
    } else if (operator === 'in') {
      const arr = Array.isArray(value) ? value.map(v => String(v)) : [];
      this.filters.push(row => !arr.includes(String(row[column] ?? '')));
    } else if (operator === 'eq') {
      this.filters.push(row => String(row[column] ?? '') !== String(value ?? ''));
    }
    return this;
  }

  like(column, pattern) {
    const cleanPattern = String(pattern).replace(/^%|%$/g, '');
    this.filters.push(row => String(row[column] ?? '').includes(cleanPattern));
    return this;
  }

  ilike(column, pattern) {
    const cleanPattern = String(pattern).replace(/^%|%$/g, '').toLowerCase();
    this.filters.push(row => String(row[column] ?? '').toLowerCase().includes(cleanPattern));
    return this;
  }

  or(conditionStr) {
    if (!conditionStr || typeof conditionStr !== 'string') return this;
    const parts = conditionStr.split(',').map(s => s.trim()).filter(Boolean);
    const orPredicates = parts.map(part => {
      const match = part.match(/^([^.]+)\.(eq|neq|ilike|like)\.(.*)$/);
      if (!match) return null;
      const [, col, op, val] = match;
      if (op === 'eq') return row => String(row[col] ?? '') === String(val);
      if (op === 'neq') return row => String(row[col] ?? '') !== String(val);
      if (op === 'ilike') {
        const p = val.replace(/^%|%$/g, '').toLowerCase();
        return row => String(row[col] ?? '').toLowerCase().includes(p);
      }
      if (op === 'like') {
        const p = val.replace(/^%|%$/g, '');
        return row => String(row[col] ?? '').includes(p);
      }
      return null;
    }).filter(Boolean);

    if (orPredicates.length > 0) {
      this.filters.push(row => orPredicates.some(fn => fn(row)));
    }
    return this;
  }

  order(column, options = {}) {
    const ascending = options.ascending !== false;
    this.sortFields.push({ column, ascending });
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  range(from, to) {
    this.rangeOffsets = { from, to };
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  async execute() {
    let rows = localDb.getTable(this.tableName);

    if (this.operation === 'INSERT') {
      const insertedRows = [];
      const newTable = [...rows];
      for (const item of (this.insertData || [])) {
        const id = item.id || `demo-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const record = {
          ...item,
          id,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        newTable.push(record);
        insertedRows.push(record);
        localDb.notify(this.tableName, 'INSERT', record);
      }
      localDb.saveTable(this.tableName, newTable);
      return { data: insertedRows, error: null, count: insertedRows.length };
    }

    if (this.operation === 'UPSERT') {
      const conflictKey = this.upsertOptions?.onConflict || 'id';
      const updatedRows = [];
      let newTable = [...rows];

      for (const item of (this.upsertData || [])) {
        const matchIdx = newTable.findIndex(r => String(r[conflictKey]) === String(item[conflictKey]));
        if (matchIdx >= 0) {
          const old = newTable[matchIdx];
          const updated = { ...old, ...item, updated_at: new Date().toISOString() };
          newTable[matchIdx] = updated;
          updatedRows.push(updated);
          localDb.notify(this.tableName, 'UPDATE', updated, old);
        } else {
          const id = item.id || `demo-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
          const created = { ...item, id, created_at: item.created_at || new Date().toISOString(), updated_at: new Date().toISOString() };
          newTable.push(created);
          updatedRows.push(created);
          localDb.notify(this.tableName, 'INSERT', created);
        }
      }
      localDb.saveTable(this.tableName, newTable);
      return { data: updatedRows, error: null, count: updatedRows.length };
    }

    if (this.operation === 'UPDATE') {
      let matchingIndices = [];
      rows.forEach((row, idx) => {
        if (this.filters.every(fn => fn(row))) {
          matchingIndices.push(idx);
        }
      });

      const updatedRecords = [];
      const newTable = [...rows];
      matchingIndices.forEach(idx => {
        const old = newTable[idx];
        const updated = { ...old, ...this.updateData, updated_at: new Date().toISOString() };
        newTable[idx] = updated;
        updatedRecords.push(updated);
        localDb.notify(this.tableName, 'UPDATE', updated, old);
      });

      localDb.saveTable(this.tableName, newTable);
      return { data: updatedRecords, error: null, count: updatedRecords.length };
    }

    if (this.operation === 'DELETE') {
      const remaining = [];
      const deleted = [];
      rows.forEach(row => {
        if (this.filters.length > 0 && this.filters.every(fn => fn(row))) {
          deleted.push(row);
          localDb.notify(this.tableName, 'DELETE', null, row);
        } else if (this.filters.length === 0) {
          deleted.push(row);
          localDb.notify(this.tableName, 'DELETE', null, row);
        } else {
          remaining.push(row);
        }
      });
      localDb.saveTable(this.tableName, remaining);
      return { data: deleted, error: null, count: deleted.length };
    }

    // SELECT Operation
    let result = rows.filter(row => this.filters.every(fn => fn(row)));

    if (this.sortFields.length > 0) {
      result.sort((a, b) => {
        for (const { column, ascending } of this.sortFields) {
          const valA = a[column];
          const valB = b[column];
          if (valA === valB) continue;
          if (valA === undefined || valA === null) return ascending ? -1 : 1;
          if (valB === undefined || valB === null) return ascending ? 1 : -1;
          if (typeof valA === 'number' && typeof valB === 'number') {
            return ascending ? valA - valB : valB - valA;
          }
          const strA = String(valA);
          const strB = String(valB);
          return ascending ? strA.localeCompare(strB) : strB.localeCompare(strA);
        }
        return 0;
      });
    }

    if (this.rangeOffsets) {
      result = result.slice(this.rangeOffsets.from, this.rangeOffsets.to + 1);
    } else if (this.limitCount !== null) {
      result = result.slice(0, this.limitCount);
    }

    if (this.isSingle) {
      return {
        data: result[0] || null,
        error: result.length === 0 ? { message: 'No record found' } : null,
        count: result.length
      };
    }

    if (this.isMaybeSingle) {
      return {
        data: result[0] || null,
        error: null,
        count: result.length
      };
    }

    return { data: result, error: null, count: result.length };
  }

  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.execute().catch(onRejected);
  }
}

class MockRealtimeChannel {
  constructor(name) {
    this.name = name;
    this.handlers = [];
    this.unsubscribeDb = null;
  }

  on(event, filter, callback) {
    this.handlers.push({ event, filter, callback });
    return this;
  }

  subscribe(callback) {
    this.unsubscribeDb = localDb.subscribe(payload => {
      this.handlers.forEach(h => {
        if (h.filter?.table && h.filter.table !== payload.table) return;
        h.callback(payload);
      });
    });
    if (callback) callback('SUBSCRIBED');
    return this;
  }

  unsubscribe() {
    if (this.unsubscribeDb) {
      this.unsubscribeDb();
      this.unsubscribeDb = null;
    }
  }
}

const activeChannels = new Map();

const DEMO_ADMIN_USER = {
  id: 'demo-admin-id',
  email: 'admin@gforcehub.com',
  user_metadata: { role: 'super_admin' },
  app_metadata: { provider: 'demo' },
  aud: 'authenticated',
  created_at: new Date().toISOString()
};

const DEMO_AUTH_SESSION = {
  access_token: 'demo-access-token',
  token_type: 'bearer',
  expires_in: 3600000,
  user: DEMO_ADMIN_USER
};

export const supabase = {
  from(tableName) {
    return new MockQueryBuilder(tableName);
  },

  channel(name) {
    if (!activeChannels.has(name)) {
      activeChannels.set(name, new MockRealtimeChannel(name));
    }
    return activeChannels.get(name);
  },

  removeChannel(channel) {
    if (!channel) return;
    channel.unsubscribe();
    if (channel.name) {
      activeChannels.delete(channel.name);
    }
  },

  async rpc(fnName, params) {
    return { data: null, error: null };
  },

  auth: {
    async getSession() {
      return { data: { session: DEMO_AUTH_SESSION }, error: null };
    },

    async getUser() {
      return { data: { user: DEMO_ADMIN_USER }, error: null };
    },

    onAuthStateChange(callback) {
      setTimeout(() => {
        try {
          callback('SIGNED_IN', DEMO_AUTH_SESSION);
        } catch (e) {}
      }, 0);
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    },

    async signInWithPassword({ email, password }) {
      return {
        data: { user: DEMO_ADMIN_USER, session: DEMO_AUTH_SESSION },
        error: null
      };
    },

    async signOut() {
      return { error: null };
    }
  }
};

export function createClient() {
  return supabase;
}

