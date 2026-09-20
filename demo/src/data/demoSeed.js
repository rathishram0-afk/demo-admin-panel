/**
 * DEMO DATA SEED
 *
 * Generates a populated, internally consistent ~3 months of trading for the
 * standalone demo. Everything is produced *relative to the moment the demo is
 * opened*, not baked in as fixed dates, so:
 *   - live session timers count down correctly, and
 *   - the Reports tabs always show "recent" business regardless of when the
 *     demo is run.
 *
 * Two things are deliberately NOT generated here because the app derives them:
 *   - daily/weekly/monthly/yearly reports  -> sessionService.getHistoricalReports()
 *     re-aggregates walkin_sessions + cafe_orders by business date.
 *   - cafe_daily_archives -> cafeArchiveService falls back to aggregating
 *     cafe_orders for any past business date.
 * Seeding those separately would risk numbers that disagree with the source rows.
 *
 * Business dates are Asia/Kolkata calendar days, matching sessionService.getBusinessDate().
 */

import { MENU_DATA } from './gamingData.js';

const HISTORY_DAYS = 425; // ~14 months, so the Yearly tab has two years to compare

// Browser localStorage is the hard constraint here: Chrome accounts for it in
// UTF-16, so every character of JSON costs two bytes against a ~5 MB quota,
// and supabase.js:saveTable swallows quota errors silently - an oversized seed
// would appear to work, then vanish on the next reload.
//
// 14 months at today's trading density does not fit. Rather than truncate the
// history, older months are modelled at lower volume on a growth curve, which
// is both realistic for a cafe that has been ramping up and keeps the Monthly
// and Yearly tabs meaningful. The most recent RECENT_FULL_DAYS run at full
// density so the Daily tab and dashboard are unaffected.
const RECENT_FULL_DAYS = 60;
const OLDEST_VOLUME_FACTOR = 0.10;
const GROWTH_CURVE_EXPONENT = 2; // convex: slow early growth, accelerating recently

const SEED = 0x5f3a91c7;

/* ------------------------------------------------------------------ random */

/** mulberry32 - small deterministic PRNG so the demo is identical every load. */
function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Re-initialised at the top of buildDemoData() so every call - first load or a
// later "Reset All Data" - produces byte-identical output.
let rng = makeRng(SEED);
const randInt = (min, max) => min + Math.floor(rng() * (max - min + 1));
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const chance = (p) => rng() < p;

function pickWeighted(entries) {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let roll = rng() * total;
  for (const e of entries) {
    roll -= e.weight;
    if (roll <= 0) return e.value;
  }
  return entries[entries.length - 1].value;
}

/* -------------------------------------------------------------- IST dates */

const IST_DATE_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** 'YYYY-MM-DD' for the Asia/Kolkata calendar day containing `date`. */
function istDateStr(date) {
  return IST_DATE_FMT.format(date);
}

/** Shift a 'YYYY-MM-DD' string by whole days without touching timezones. */
function shiftDateStr(dateStr, deltaDays) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().slice(0, 10);
}

/** ISO timestamp at second resolution - the millis are noise on every row. */
function iso(date) {
  return `${date.toISOString().slice(0, 19)}Z`;
}

/** An exact instant at HH:MM IST on the given business date. */
function istAt(dateStr, hour, minute = 0) {
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return new Date(`${dateStr}T${hh}:${mm}:00+05:30`);
}

function isWeekendDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return dow === 0 || dow === 6;
}

/* ------------------------------------------------------------ domain facts */

// Mirrors DEFAULT_PRICING_SETTINGS in sessionService.js
const PRICING = {
  weekday: {
    'PlayStation 5': { 30: 60, 60: 100, 120: 180, 180: 280 },
    'PlayStation 4': { 60: 80, 120: 150, 180: 220 },
    'PlayStation 2': { 60: 60, 120: 110, 180: 160 },
    'Racing Simulator': { 30: 100, 60: 180, 120: 250 },
    'PS VR2': { 20: 100, 40: 160, 60: 220 },
  },
  weekend: {
    'PlayStation 5': { 30: 60, 60: 100, 120: 200, 180: 280 },
    'PlayStation 4': { 60: 90, 120: 160, 180: 220 },
    'PlayStation 2': { 60: 70, 120: 120, 180: 160 },
    'Racing Simulator': { 30: 100, 60: 180, 120: 250 },
    'PS VR2': { 20: 100, 40: 160, 60: 220 },
  },
};

// Mirrors DEVICE_DURATIONS in sessionService.js
const DURATIONS = {
  'PlayStation 5': [30, 60, 120, 180],
  'PlayStation 4': [60, 120, 180],
  'PlayStation 2': [60, 120, 180],
  'Racing Simulator': [30, 60, 120],
  'PS VR2': [20, 40, 60],
};

// The bookable stations. The "EXTRA PERSON" PS5 rows in the device table are
// add-on seats rather than consoles, so they are never assigned a session.
const STATIONS = [
  { code: 'PS5-1', name: 'PS5 - 1', zone: 'PlayStation 5', maxPlayers: 4, weight: 10 },
  { code: 'PS5-2', name: 'PS5 - 2', zone: 'PlayStation 5', maxPlayers: 4, weight: 10 },
  { code: 'PS5-3', name: 'PS5 - 3', zone: 'PlayStation 5', maxPlayers: 4, weight: 9 },
  { code: 'PS5-4', name: 'PS5 - 4', zone: 'PlayStation 5', maxPlayers: 4, weight: 9 },
  { code: 'PS4-1', name: 'PS4 - 1', zone: 'PlayStation 4', maxPlayers: 4, weight: 6 },
  { code: 'PS4-2', name: 'PS4 - 2', zone: 'PlayStation 4', maxPlayers: 4, weight: 6 },
  { code: 'PS4-3', name: 'PS4 - 3', zone: 'PlayStation 4', maxPlayers: 4, weight: 5 },
  { code: 'PS4-4', name: 'PS4 - 4', zone: 'PlayStation 4', maxPlayers: 4, weight: 5 },
  { code: 'PS2-1', name: 'PS2 - 1', zone: 'PlayStation 2', maxPlayers: 2, weight: 3 },
  { code: 'SIM-1', name: 'SIM - 1', zone: 'Racing Simulator', maxPlayers: 1, weight: 7 },
  { code: 'VR-1', name: 'VR - 1', zone: 'PS VR2', maxPlayers: 1, weight: 7 },
];

const FIRST_NAMES = [
  'Arjun', 'Priya', 'Rahul', 'Sneha', 'Karthik', 'Divya', 'Vikram', 'Ananya',
  'Rohan', 'Meera', 'Aditya', 'Kavya', 'Sanjay', 'Nithya', 'Harish', 'Pooja',
  'Surya', 'Lakshmi', 'Manoj', 'Deepika', 'Ashwin', 'Ramya', 'Naveen', 'Swetha',
  'Gokul', 'Janani', 'Praveen', 'Keerthi', 'Vishnu', 'Abinaya', 'Yuvan', 'Shalini',
];
const LAST_INITIALS = ['R', 'K', 'S', 'M', 'V', 'P', 'N', 'B', 'G', 'T'];

const PAYMENT_METHODS = [
  { value: 'Cash', weight: 34 },
  { value: 'UPI', weight: 42 },
  { value: 'Debit Card', weight: 10 },
  { value: 'Credit Card', weight: 8 },
  { value: 'Split', weight: 6 },
];

function personName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_INITIALS)}.`;
}

function mobileNumber() {
  return `+91 ${randInt(70000, 99999)}${randInt(10000, 99999)}`;
}

/** Flatten MENU_DATA into a sellable product list with real prices and images. */
function menuProducts() {
  const out = [];
  Object.keys(MENU_DATA || {}).forEach((cat) => {
    (MENU_DATA[cat] || []).forEach((item) => {
      const price =
        item.numericPrice ||
        parseFloat(String(item.price || '0').replace(/[^0-9.]/g, '')) ||
        20;
      out.push({
        name: item.name,
        category: item.category || cat,
        price,
        image: item.image,
      });
    });
  });
  return out;
}

/* ------------------------------------------------------------ builders */

function splitBreakdownFor(amount) {
  const cash = Math.round(amount * (0.3 + rng() * 0.4));
  const upi = amount - cash;
  return { cash, upi, card: 0 };
}

/**
 * Only the snapshot fields something actually reads are stored.
 * A grep over services + admin components shows reads of isPrepaid,
 * paymentMethod, hourlyPrice and the split amounts; pricePerPlayer,
 * durationMinutes, tierName, isWeekend and paymentStatus are written by the
 * live code path but never read back, and at thousands of rows those keys are
 * pure quota cost.
 */
function pricingSnapshot({ pricePerPlayer, method, isPrepaid, amount }) {
  const isSplit = method === 'Split';
  const split = isSplit ? splitBreakdownFor(amount) : null;
  return {
    hourlyPrice: pricePerPlayer,
    isPrepaid,
    paymentMethod: method,
    ...(split
      ? { splitBreakdown: split, cashAmount: split.cash, upiAmount: split.upi, cardAmount: split.card }
      : {}),
  };
}

/**
 * Trading volume for a day `back` days ago, as a fraction of today's density.
 *
 * The most recent RECENT_FULL_DAYS are at full volume; before that the curve
 * falls away to OLDEST_VOLUME_FACTOR at the start of the history. This models
 * a cafe that has been growing, and is what makes 14 months fit the browser
 * storage budget - see the note beside the constants.
 */
function volumeFactor(back) {
  if (back <= RECENT_FULL_DAYS) return 1;
  const span = HISTORY_DAYS - RECENT_FULL_DAYS;
  const age = (back - RECENT_FULL_DAYS) / span; // 0 = just before the full window, 1 = oldest
  // Convex rather than linear: a linear ramp averages ~0.55 of full volume,
  // which is still far too many rows for the storage budget. Squaring gives a
  // ~0.40 average and the shape of a business that grew slowly then took off.
  return OLDEST_VOLUME_FACTOR + (1 - OLDEST_VOLUME_FACTOR) * Math.pow(1 - age, GROWTH_CURVE_EXPONENT);
}

/** Pick a plausible start hour: mostly evening peak, some afternoon. */
function sessionStartHour() {
  return pickWeighted([
    { value: 11, weight: 2 }, { value: 12, weight: 2 }, { value: 13, weight: 3 },
    { value: 14, weight: 3 }, { value: 15, weight: 4 }, { value: 16, weight: 6 },
    { value: 17, weight: 9 }, { value: 18, weight: 12 }, { value: 19, weight: 14 },
    { value: 20, weight: 13 }, { value: 21, weight: 9 }, { value: 22, weight: 4 },
  ]);
}

function buildCompletedSession(dateStr, seq) {
  const weekend = isWeekendDate(dateStr);
  const station = pickWeighted(STATIONS.map((s) => ({ value: s, weight: s.weight })));
  const durationMins = pick(DURATIONS[station.zone]);
  const tier = weekend ? PRICING.weekend : PRICING.weekday;
  const pricePerPlayer = tier[station.zone][durationMins];
  const players = station.maxPlayers === 1 ? 1 : randInt(1, station.maxPlayers);

  // A minority of sessions get extended, so Reports' extension column has data.
  const extendedMinutes = chance(0.18) ? pick([15, 30, 60]) : 0;
  const extensionAmount = extendedMinutes
    ? Math.round((pricePerPlayer / durationMins) * extendedMinutes * players)
    : 0;

  const gamingCharge = Math.round(pricePerPlayer * players);
  const totalAmount = gamingCharge + extensionAmount;

  const startHour = sessionStartHour();
  const start = istAt(dateStr, startHour, pick([0, 10, 15, 20, 30, 40, 45, 50]));
  const end = new Date(start.getTime() + (durationMins + extendedMinutes) * 60000);

  const method = pickWeighted(PAYMENT_METHODS);
  const isPrepaid = chance(0.35);

  return {
    id: `ws-${dateStr}-${seq}`,
    session_code: `WI-${dateStr.replace(/-/g, '').slice(2)}-${String(seq).padStart(2, '0')}`,
    customer_name: personName(),
    mobile_number: mobileNumber(),
    device_id: station.code,
    device_name: station.name,
    device_type: station.zone,
    player_count: players,
    planned_duration: durationMins,
    hourly_price: pricePerPlayer,
    gaming_charge: gamingCharge,
    total_amount: totalAmount,
    payment_status: 'Paid',
    payment_method: method === 'Debit Card' || method === 'Credit Card' ? 'Card' : method,
    session_status: 'Completed',
    pricing_snapshot: pricingSnapshot({ pricePerPlayer, method, isPrepaid, amount: totalAmount }),
    start_time: iso(start),
    actual_end_time: iso(end),
    // created_at is load-bearing: getWalkInHistory() orders on it.
    created_at: iso(start),
    // Extension fields are omitted entirely when unused - every reader coerces
    // with `|| 0`, and at this row count the empty keys cost real quota.
    ...(extendedMinutes
      ? {
          extended_minutes: extendedMinutes,
          extension_amount: extensionAmount,
          notes: `Extended by ${extendedMinutes} mins on request`,
        }
      : {}),
  };
}

function buildCafeOrder({ dateStr, seq, product, session, status, now }) {
  const qty = pickWeighted([
    { value: 1, weight: 60 }, { value: 2, weight: 25 },
    { value: 3, weight: 10 }, { value: 4, weight: 5 },
  ]);
  const total = product.price * qty;
  const attached = Boolean(session);

  // Attached orders land a few minutes into the session they belong to.
  const placedAt = attached
    ? new Date(new Date(session.start_time).getTime() + randInt(3, 40) * 60000)
    : istAt(dateStr, sessionStartHour(), randInt(0, 59));

  const method = pickWeighted(PAYMENT_METHODS.filter((m) => m.value !== 'Split'));

  return {
    id: `co-${dateStr}-${seq}`,
    order_id: `GF-${String(seq).padStart(4, '0')}`,
    mode: attached ? 'SESSION' : 'COUNTER',
    session_id: attached ? session.session_code : '-',
    station_id: attached ? session.device_id : '-',
    device_name: attached ? session.device_name : 'Counter',
    customer_name: attached ? session.customer_name : personName(),
    mobile_number: attached ? session.mobile_number : mobileNumber(),
    product_name: product.name,
    category: product.category,
    price: product.price,
    quantity: qty,
    total_amount: total,
    payment_method: method,
    payment_status: status === 'Collected' ? 'Paid' : 'Pending',
    status,
    revenue_counted: status === 'Collected',
    image_url: product.image,
    created_at: iso(placedAt > now ? now : placedAt),
  };
}

/* ------------------------------------------------------------ live "today" */

function buildLiveSessions(todayStr, now) {
  // Elapsed/planned pairs chosen to exercise every Live Sessions visual state:
  // comfortable, mid-session, ending-soon (<15 min left), paused, and scheduled.
  const specs = [
    { code: 'PS5-1', elapsedMins: 22, durationMins: 60, status: 'Active' },
    { code: 'PS5-2', elapsedMins: 88, durationMins: 120, status: 'Active' },
    { code: 'PS5-3', elapsedMins: 52, durationMins: 60, status: 'Active' }, // ending soon
    { code: 'PS4-1', elapsedMins: 35, durationMins: 120, status: 'Active' },
    { code: 'SIM-1', elapsedMins: 14, durationMins: 30, status: 'Active' },
    { code: 'VR-1', elapsedMins: 18, durationMins: 40, status: 'Paused' },
  ];

  const weekend = isWeekendDate(todayStr);
  const tier = weekend ? PRICING.weekend : PRICING.weekday;

  return specs.map((spec, i) => {
    const station = STATIONS.find((s) => s.code === spec.code);
    const pricePerPlayer = tier[station.zone][spec.durationMins];
    const players = station.maxPlayers === 1 ? 1 : randInt(1, station.maxPlayers);
    const gamingCharge = Math.round(pricePerPlayer * players);
    const start = new Date(now.getTime() - spec.elapsedMins * 60000);
    const method = pickWeighted(PAYMENT_METHODS);
    const isPrepaid = chance(0.4);

    const row = {
      id: `ws-live-${i + 1}`,
      session_code: `WI-${todayStr.replace(/-/g, '').slice(2)}-L${i + 1}`,
      customer_name: personName(),
      mobile_number: mobileNumber(),
      device_id: station.code,
      device_name: station.name,
      device_type: station.zone,
      player_count: players,
      planned_duration: spec.durationMins,
      hourly_price: pricePerPlayer,
      gaming_charge: gamingCharge,
      total_amount: gamingCharge,
      payment_status: isPrepaid ? 'Paid' : 'Pending',
      payment_method: isPrepaid ? (method === 'Debit Card' || method === 'Credit Card' ? 'Card' : method) : null,
      session_status: spec.status,
      pricing_snapshot: pricingSnapshot({ pricePerPlayer, method, isPrepaid, amount: gamingCharge }),
      start_time: iso(start),
      created_at: iso(start),
    };

    // A paused session records where the clock stopped in expected_end_time,
    // which is how mapStations() freezes its elapsed counter.
    if (spec.status === 'Paused') {
      row.expected_end_time = iso(new Date(start.getTime() + spec.elapsedMins * 60000));
    }
    return row;
  });
}

/* -------------------------------------------------------------- bookings */

function buildBookings(todayStr) {
  const rows = [];
  const zones = ['PlayStation 5', 'PlayStation 4', 'PlayStation 2', 'Racing Simulator', 'PS VR2'];

  // Spread across every status so each Bookings filter tab has content.
  const plan = [
    ...Array(6).fill('Pending'),
    ...Array(5).fill('Approved'),
    ...Array(6).fill('Converted'),
    ...Array(6).fill('Completed'),
    ...Array(3).fill('Rejected'),
  ];

  plan.forEach((status, i) => {
    const zone = pick(zones);
    const players = zone === 'Racing Simulator' || zone === 'PS VR2' ? 1 : randInt(1, 4);
    const durationMins = pick(DURATIONS[zone]);

    // Upcoming statuses sit in the future; settled ones in the recent past.
    const future = status === 'Pending' || status === 'Approved';
    const dayOffset = future ? randInt(0, 6) : -randInt(0, 12);
    const dateStr = shiftDateStr(todayStr, dayOffset);
    const weekend = isWeekendDate(dateStr);
    const pricePerPlayer = (weekend ? PRICING.weekend : PRICING.weekday)[zone][durationMins];

    const hour = sessionStartHour();
    const createdOffset = future ? -randInt(1, 5) : dayOffset - randInt(0, 2);

    rows.push({
      id: `BK-${String(1000 + i)}`,
      customer_name: personName(),
      mobile_number: mobileNumber(),
      gaming_zone: `${zone} (${players} ${players === 1 ? 'Player' : 'Players'})`,
      booking_date: dateStr,
      booking_time: `${String(hour).padStart(2, '0')}:00`,
      duration: durationMins >= 60 ? `${durationMins / 60} hr` : `${durationMins} mins`,
      total_amount: Math.round(pricePerPlayer * players),
      payment_method: status === 'Completed' || status === 'Converted' ? pickWeighted(PAYMENT_METHODS) : null,
      payment_status: status === 'Completed' || status === 'Converted' ? 'Paid' : 'Unpaid',
      booking_status: status,
      created_at: iso(istAt(shiftDateStr(todayStr, createdOffset), randInt(9, 21), randInt(0, 59))),
    });
  });

  return rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

/* ----------------------------------------------------------- memberships */

function buildMemberships(todayStr) {
  const rows = [];

  // status, how many, and where the start date sits relative to today
  const plan = [
    { status: 'Active', count: 9 },
    { status: 'Pending', count: 4 },
    { status: 'Expired', count: 4 },
    { status: 'Cancelled', count: 2 },
    { status: 'Rejected', count: 1 },
  ];

  let i = 0;
  plan.forEach(({ status, count }) => {
    for (let n = 0; n < count; n += 1, i += 1) {
      const isThreeMonth = chance(0.55);
      const planName = isThreeMonth ? '3 Month Membership' : 'Monthly Membership';
      const price = isThreeMonth ? 499 : 1999;
      const months = isThreeMonth ? 3 : 1;

      let startOffset;
      if (status === 'Expired') startOffset = -randInt(months * 30 + 5, months * 30 + 50);
      else if (status === 'Pending') startOffset = randInt(0, 6);
      else startOffset = -randInt(2, months * 30 - 5);

      const startStr = shiftDateStr(todayStr, startOffset);
      const expiryStr = shiftDateStr(startStr, months * 30);
      const settled = status === 'Active' || status === 'Expired';

      rows.push({
        id: `MB-${String(2000 + i)}`,
        full_name: personName(),
        mobile_number: mobileNumber(),
        membership_plan: planName,
        preferred_start_date: startStr,
        duration: isThreeMonth ? '3 Months' : '1 Month',
        price,
        status,
        remarks: status === 'Cancelled' ? 'Cancelled at member request' : null,
        payment_status: settled ? 'Paid' : 'Pending',
        payment_mode: pick(['Cash', 'UPI', 'GPay', 'Debit Card']),
        expiry_date: status === 'Pending' ? null : expiryStr,
        created_at: iso(istAt(startStr, randInt(10, 20), randInt(0, 59))),
      });
    }
  });

  return rows;
}

/* --------------------------------------------------------------- public */

/**
 * Build the whole demo dataset.
 * @param {Date} now anchor instant; defaults to the current time.
 */
export function buildDemoData(now = new Date()) {
  rng = makeRng(SEED);

  const todayStr = istDateStr(now);
  const products = menuProducts();

  const walkinSessions = [];
  const cafeOrders = [];
  let orderSeq = 1;

  // ---- history: HISTORY_DAYS of completed trading, oldest first -----------
  for (let back = HISTORY_DAYS; back >= 1; back -= 1) {
    const dateStr = shiftDateStr(todayStr, -back);
    const weekend = isWeekendDate(dateStr);
    const factor = volumeFactor(back);

    const baseCount = weekend ? randInt(9, 14) : randInt(4, 9);
    const sessionCount = Math.max(1, Math.round(baseCount * factor));

    const daysSessions = [];
    for (let s = 1; s <= sessionCount; s += 1) {
      const row = buildCompletedSession(dateStr, s);
      daysSessions.push(row);
      walkinSessions.push(row);
    }

    // Roughly 55% of sessions add food, plus a few walk-up counter sales.
    // Attach rate tapers with volume on the older, quieter days.
    const attachRate = 0.55 * (0.7 + 0.3 * factor);
    daysSessions.forEach((session) => {
      if (!chance(attachRate)) return;
      const items = chance(0.3 * factor) ? 2 : 1;
      for (let k = 0; k < items; k += 1) {
        cafeOrders.push(buildCafeOrder({
          dateStr, seq: orderSeq++, product: pick(products), session, status: 'Collected', now,
        }));
      }
    });

    const counterSales = Math.round((weekend ? randInt(2, 5) : randInt(1, 3)) * factor);
    for (let c = 0; c < counterSales; c += 1) {
      cafeOrders.push(buildCafeOrder({
        dateStr, seq: orderSeq++, product: pick(products), session: null, status: 'Collected', now,
      }));
    }
  }

  // ---- today: live sessions + a few already-settled earlier today ---------
  const liveSessions = buildLiveSessions(todayStr, now);

  const earlierToday = [];
  const settledTodayCount = randInt(3, 6);
  for (let s = 1; s <= settledTodayCount; s += 1) {
    const row = buildCompletedSession(todayStr, s);
    // Keep these strictly in the past relative to `now`.
    const end = new Date(now.getTime() - randInt(40, 260) * 60000);
    const start = new Date(end.getTime() - row.planned_duration * 60000);
    row.start_time = iso(start);
    row.created_at = iso(start);
    row.actual_end_time = iso(end);
    earlierToday.push(row);
    walkinSessions.push(row);
  }

  walkinSessions.push(...liveSessions);

  // Settled food from earlier today
  earlierToday.forEach((session) => {
    if (!chance(0.6)) return;
    cafeOrders.push(buildCafeOrder({
      dateStr: todayStr, seq: orderSeq++, product: pick(products), session, status: 'Collected', now,
    }));
  });

  // Open tickets attached to the live sessions, one per board column
  const openStatuses = ['Pending', 'Pending', 'Preparing', 'Preparing', 'Ready'];
  openStatuses.forEach((status, idx) => {
    const session = liveSessions[idx % liveSessions.length];
    cafeOrders.push(buildCafeOrder({
      dateStr: todayStr, seq: orderSeq++, product: pick(products), session, status, now,
    }));
  });
  // Plus a couple of counter tickets waiting at the till
  for (let c = 0; c < 2; c += 1) {
    cafeOrders.push(buildCafeOrder({
      dateStr: todayStr, seq: orderSeq++, product: pick(products), session: null, status: 'Pending', now,
    }));
  }

  const bookings = buildBookings(todayStr);
  const memberships = buildMemberships(todayStr);

  // ---- activity log ------------------------------------------------------
  const activityLogs = liveSessions.slice(0, 4).map((s, i) => ({
    id: `act-${i + 1}`,
    title: `Session ${s.session_code} Started`,
    message: `Station ${s.device_id} started (Billed ₹${s.total_amount})`,
    type: 'START',
    time: s.start_time,
    created_at: s.start_time,
  }));
  earlierToday.slice(0, 3).forEach((s, i) => {
    activityLogs.push({
      id: `act-end-${i + 1}`,
      title: 'Session Ended',
      message: `Station ${s.device_id} Session Completed. Total Bill ₹${s.total_amount}`,
      type: 'END',
      time: s.actual_end_time,
      created_at: s.actual_end_time,
    });
  });
  activityLogs.sort((a, b) => new Date(b.time) - new Date(a.time));

  // ---- notifications (plain localStorage, not a table) -------------------
  const pendingBookings = bookings.filter((b) => b.booking_status === 'Pending').length;
  const notifications = [
    {
      title: 'Session Ending Soon',
      message: `Station PS5-3 has under 15 minutes remaining.`,
      type: 'ALERT',
      minutesAgo: 2,
      read: false,
    },
    {
      title: 'New Café Order',
      message: 'A new café order is waiting to be prepared at the counter.',
      type: 'SUCCESS',
      minutesAgo: 9,
      read: false,
    },
    {
      title: 'Booking Requests Pending',
      message: `${pendingBookings} online booking${pendingBookings === 1 ? '' : 's'} awaiting approval.`,
      type: 'ALERT',
      minutesAgo: 24,
      read: false,
    },
    {
      title: 'Session Completed',
      message: 'Station PS4-2 session completed and settled.',
      type: 'SUCCESS',
      minutesAgo: 68,
      read: true,
    },
  ].map((n, i) => {
    const ts = now.getTime() - n.minutesAgo * 60000;
    return {
      id: `notif_seed_${i}`,
      title: n.title,
      message: n.message,
      type: n.type,
      time: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: ts,
      read: n.read,
    };
  });

  return {
    walkinSessions,
    cafeOrders,
    bookings,
    memberships,
    activityLogs,
    notifications,
    /** device_codes that must show as occupied so Devices agrees with Live Sessions. */
    occupiedDeviceCodes: liveSessions.map((s) => s.device_id),
  };
}

/** Storage key sessionService reads notifications from. */
export const NOTIFICATIONS_STORAGE_KEY = 'gforce_demo_pos_notifications';
