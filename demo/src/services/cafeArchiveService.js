import { supabase } from './supabase.js';
import { sessionService } from './sessionService.js';

const STORAGE_KEYS = {
  CAFE_DAILY_ARCHIVES: 'gforce_demo_cafe_daily_archives'
};

let memoryArchives = [];

function getStoredCafeArchives() {
  try {
    if (typeof localStorage !== 'undefined') {
      const item = localStorage.getItem(STORAGE_KEYS.CAFE_DAILY_ARCHIVES);
      return item ? JSON.parse(item) : memoryArchives;
    }
  } catch (e) {
    console.error('Error reading cafe archives from localStorage:', e);
  }
  return memoryArchives;
}

function setStoredCafeArchives(archives) {
  memoryArchives = archives || [];
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CAFE_DAILY_ARCHIVES, JSON.stringify(archives));
    }
  } catch (e) {
    console.error('Error saving cafe archives to localStorage:', e);
  }
}

function setArchiveRecord(archivesMap, newRecord) {
  if (!newRecord || !newRecord.rawDate) return;
  const existing = archivesMap.get(newRecord.rawDate);
  if (existing && (existing.totalRevenue > 0 || existing.totalOrders > 0)) {
    // IMMUTABLE PROTECTION: Never overwrite a non-zero archive with a zero record!
    if (newRecord.totalRevenue === 0 && newRecord.totalOrders === 0) {
      return;
    }
  }
  archivesMap.set(newRecord.rawDate, newRecord);
}

export const cafeArchiveService = {
  clearArchives() {
    memoryArchives = [];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.CAFE_DAILY_ARCHIVES);
    }
  },

  /**
   * Retrieves all historical daily archived cafe order reports
   */
  async getArchivedCafeReports() {
    let localArchives = getStoredCafeArchives() || [];
    const archivesMap = new Map();

    try {
      const { data, error } = await supabase
        .from('cafe_daily_archives')
        .select('*')
        .order('raw_date', { ascending: false });

      if (!error && data && data.length > 0) {
        data.forEach(row => {
          setArchiveRecord(archivesMap, {
            id: row.id,
            rawDate: row.raw_date,
            dateStr: row.date_str,
            totalRevenue: Number(row.total_revenue || 0),
            totalOrders: Number(row.total_orders || 0),
            completedOrders: Number(row.completed_orders || 0),
            pendingOrders: Number(row.pending_orders || 0),
            cancelledOrders: Number(row.cancelled_orders || 0),
            cashRevenue: Number(row.cash_revenue || 0),
            upiRevenue: Number(row.upi_revenue || 0),
            cardRevenue: Number(row.card_revenue || 0),
            averageOrderValue: Number(row.average_order_value || 0),
            bestSellingProduct: row.best_selling_product || 'None',
            mostOrderedCategory: row.most_ordered_category || 'None',
            ordersList: row.orders_list || [],
            productAnalytics: row.product_analytics || {},
            archivedAt: row.archived_at
          });
        });
      } else if (!error && data && data.length === 0) {
        // If DB table is empty (e.g. after Reset All Data), clear local storage archives as well!
        setStoredCafeArchives([]);
        localArchives = [];
      }
    } catch (e) {}

    // Fallback/Recovery: Aggregate past completed cafe orders directly from cafe_orders table in Supabase DB by business date
    try {
      const todayOpDate = (typeof localStorage !== 'undefined' && localStorage.getItem('gforce_operational_date')) || sessionService.getBusinessDate(new Date());

      const { data: allCafeOrders } = await supabase.from('cafe_orders').select('*');

      if (allCafeOrders && allCafeOrders.length > 0) {
        const groups = {};
        allCafeOrders.forEach(o => {
          const rawTs = o.created_at || o.createdAt || o.timestamp || o.date;
          if (!rawTs) return;
          const bizDate = sessionService.getBusinessDate(rawTs);
          if (!bizDate || bizDate === todayOpDate) return;

          if (!groups[bizDate]) groups[bizDate] = [];
          groups[bizDate].push(o);
        });

        Object.entries(groups).forEach(([opDate, daysOrders]) => {
          if (archivesMap.has(opDate)) return;

          let totalRevenue = 0;
          let completedOrders = 0;
          let pendingOrders = 0;
          let cancelledOrders = 0;
          let cashRevenue = 0;
          let upiRevenue = 0;
          let cardRevenue = 0;

          const productAnalyticsMap = {};
          const categoryCounts = {};
          const archivedOrders = [];

          daysOrders.forEach(o => {
            const amt = Number(o.total || o.total_amount) || 0;
            const status = o.status || 'Collected';
            const method = o.paymentMethod || o.payment_method || 'Cash';
            const prodName = o.product_name || o.productName || 'Café Item';
            const category = o.category || 'Snacks';
            const qty = Number(o.quantity) || 1;

              if (status === 'Collected' || status === 'Completed' || o.revenue_counted || o.revenueCounted) {
              completedOrders++;
              totalRevenue += amt;
              if (method === 'Split' || o.splitBreakdown || o.split_breakdown) {
                const split = o.splitBreakdown || o.split_breakdown || {};
                cashRevenue += (Number(split.cash) || 0);
                upiRevenue += (Number(split.upi) || 0);
                cardRevenue += (Number(split.card || split.debitCard) || 0);
              } else if (method === 'Cash') cashRevenue += amt;
              else if (method === 'UPI') upiRevenue += amt;
              else cardRevenue += amt;

              if (!productAnalyticsMap[prodName]) {
                productAnalyticsMap[prodName] = { name: prodName, category, unitsSold: 0, revenue: 0, lastSoldTime: 'Completed' };
              }
              productAnalyticsMap[prodName].unitsSold += qty;
              productAnalyticsMap[prodName].revenue += amt;

              categoryCounts[category] = (categoryCounts[category] || 0) + qty;
            } else if (status === 'Cancelled') {
              cancelledOrders++;
            } else {
              pendingOrders++;
            }

            archivedOrders.push({
              orderId: o.order_id || o.orderId || `GF-${Math.floor(1000 + Math.random() * 9000)}`,
              mode: o.mode || 'COUNTER',
              sessionId: o.session_id || o.sessionId || '-',
              stationId: o.station_id || o.stationId || '-',
              customerName: o.customer_name || o.customerName || 'Walk-in Gamer',
              productName: prodName,
              category,
              quantity: qty,
              unitPrice: o.price || (amt / qty),
              totalAmount: amt,
              paymentMethod: method,
              status,
              createdTime: o.created_at || new Date().toISOString()
            });
          });

          let bestSellingProduct = 'None';
          let maxQty = -1;
          Object.values(productAnalyticsMap).forEach(p => {
            if (p.unitsSold > maxQty) {
              maxQty = p.unitsSold;
              bestSellingProduct = p.name;
            }
          });

          let mostOrderedCategory = 'None';
          let maxCatQty = -1;
          Object.entries(categoryCounts).forEach(([cat, qty]) => {
            if (qty > maxCatQty) {
              maxCatQty = qty;
              mostOrderedCategory = cat;
            }
          });

          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const parts = opDate.split('-');
          const formattedDateStr = `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;

          setArchiveRecord(archivesMap, {
            id: `cafe_arch_${opDate}`,
            rawDate: opDate,
            dateStr: formattedDateStr,
            totalRevenue,
            totalOrders: daysOrders.length,
            completedOrders,
            pendingOrders,
            cancelledOrders,
            cashRevenue,
            upiRevenue,
            cardRevenue,
            averageOrderValue: completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : 0,
            bestSellingProduct,
            mostOrderedCategory,
            ordersList: archivedOrders,
            productAnalytics: productAnalyticsMap,
            archivedAt: new Date().toISOString()
          });
        });
      }
    } catch (err) {}

    localArchives.forEach(a => {
      if (a && a.rawDate) setArchiveRecord(archivesMap, a);
    });

    const combinedList = Array.from(archivesMap.values())
      .filter(a => a && a.rawDate && (a.totalRevenue > 0 || a.totalOrders > 0))
      .sort((a, b) => b.rawDate.localeCompare(a.rawDate));

    setStoredCafeArchives(combinedList);
    return combinedList;
  },

  /**
   * Automatically archives today's Cafe Orders at 12:00 PM NOON or rollover
   * TRANSACTION SAFE: Verifies save success before returning true!
   */
  async archiveDailyCafeReport(opDate, cafeOrdersList = []) {
    try {
      if (!opDate) {
        opDate = new Date().toISOString().split('T')[0];
      }

      const existingArchives = getStoredCafeArchives();

      // Prevent duplicate archiving for the exact same business day
      if (existingArchives.some(a => a.rawDate === opDate)) {
        return true;
      }

      let sourceOrders = Array.isArray(cafeOrdersList) ? cafeOrdersList : [];
      if (sourceOrders.length === 0) {
        try {
          const { data: dbOrders } = await supabase.from('cafe_orders').select('*');
          if (dbOrders && dbOrders.length > 0) {
            sourceOrders = dbOrders;
          }
        } catch (e) {}
      }

      // Filter orders belonging strictly to this business date
      const daysOrders = sourceOrders.filter(o => {
        if (!o) return false;
        const ts = o.created_at || o.createdAt || o.timestamp || o.date;
        if (ts) {
          const orderDate = sessionService.getBusinessDate(ts);
          return orderDate === opDate;
        }
        return true;
      });

      let totalRevenue = 0;
      let completedOrders = 0;
      let pendingOrders = 0;
      let cancelledOrders = 0;
      let cashRevenue = 0;
      let upiRevenue = 0;
      let cardRevenue = 0;

      const productAnalyticsMap = {};
      const categoryCounts = {};
      const archivedOrders = [];

      daysOrders.forEach(o => {
        const amt = Number(o.total || o.total_amount) || 0;
        const status = o.status || 'Collected';
        const method = o.paymentMethod || o.payment_method || 'Cash';
        const prodName = o.productName || o.product_name || 'Café Item';
        const category = o.category || 'Snacks';
        const qty = Number(o.quantity) || 1;
        const unitPrice = Number(o.price) || (qty > 0 ? Math.round(amt / qty) : amt);

        if (status === 'Collected' || status === 'Completed' || o.revenueCounted || o.revenue_counted) {
          completedOrders++;
          totalRevenue += amt;

          if (method === 'Split' || o.splitBreakdown || o.split_breakdown) {
            const split = o.splitBreakdown || o.split_breakdown || {};
            cashRevenue += (Number(split.cash) || 0);
            upiRevenue += (Number(split.upi) || 0);
            cardRevenue += (Number(split.card || split.debitCard) || 0);
          } else if (method === 'Cash') cashRevenue += amt;
          else if (method === 'UPI') upiRevenue += amt;
          else cardRevenue += amt;

          // Product analytics accumulation
          if (!productAnalyticsMap[prodName]) {
            productAnalyticsMap[prodName] = {
              name: prodName,
              category,
              unitsSold: 0,
              revenue: 0,
              lastSoldTime: o.time || o.created_at || new Date().toISOString()
            };
          }
          productAnalyticsMap[prodName].unitsSold += qty;
          productAnalyticsMap[prodName].revenue += amt;

          categoryCounts[category] = (categoryCounts[category] || 0) + qty;
        } else if (status === 'Cancelled') {
          cancelledOrders++;
        } else {
          pendingOrders++;
        }

        archivedOrders.push({
          orderId: o.orderId || o.order_id || `GF-${Math.floor(1000 + Math.random() * 9000)}`,
          mode: o.mode || 'COUNTER',
          sessionId: o.sessionId || o.session_id || '-',
          stationId: o.stationId || o.station_id || '-',
          customerName: o.customerName || o.customer_name || 'Walk-in Gamer',
          productName: prodName,
          category,
          quantity: qty,
          unitPrice,
          totalAmount: amt,
          paymentMethod: method,
          status,
          createdTime: o.time || o.created_at || new Date().toISOString()
        });
      });

      const totalOrders = daysOrders.length;
      const averageOrderValue = completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : 0;

      // Calculate Best Selling Product
      let bestSellingProduct = 'None';
      let maxQty = -1;
      Object.values(productAnalyticsMap).forEach(p => {
        if (p.unitsSold > maxQty) {
          maxQty = p.unitsSold;
          bestSellingProduct = p.name;
        }
      });

      // Calculate Most Ordered Category
      let mostOrderedCategory = 'None';
      let maxCatQty = -1;
      Object.entries(categoryCounts).forEach(([cat, qty]) => {
        if (qty > maxCatQty) {
          maxCatQty = qty;
          mostOrderedCategory = cat;
        }
      });

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const parts = opDate.split('-');
      const formattedDateStr = `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;

      const newArchiveRecord = {
        id: `cafe_arch_${opDate}`,
        rawDate: opDate,
        dateStr: formattedDateStr,
        totalRevenue,
        totalOrders,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        cashRevenue,
        upiRevenue,
        cardRevenue,
        averageOrderValue,
        bestSellingProduct,
        mostOrderedCategory,
        ordersList: archivedOrders,
        productAnalytics: productAnalyticsMap,
        archivedAt: new Date().toISOString()
      };

      // Save to localStorage
      const updatedArchives = [newArchiveRecord, ...existingArchives];
      setStoredCafeArchives(updatedArchives);

      // Save to Supabase table
      try {
        const { error: sbErr } = await supabase.from('cafe_daily_archives').insert([{
          raw_date: opDate,
          date_str: formattedDateStr,
          total_revenue: totalRevenue,
          total_orders: totalOrders,
          completed_orders: completedOrders,
          pending_orders: pendingOrders,
          cancelled_orders: cancelledOrders,
          cash_revenue: cashRevenue,
          upi_revenue: upiRevenue,
          card_revenue: cardRevenue,
          average_order_value: averageOrderValue,
          best_selling_product: bestSellingProduct,
          most_ordered_category: mostOrderedCategory,
          orders_list: archivedOrders,
          product_analytics: productAnalyticsMap,
          archived_at: newArchiveRecord.archivedAt
        }]);

        if (sbErr) {
          console.error("Supabase cafe_daily_archives insert error:", sbErr);
        }
      } catch (e) {
        console.error("Supabase insert exception:", e);
      }

      // VERIFY SAVE SUCCESS AND TOTALS ACCURACY
      const savedCheck = getStoredCafeArchives();
      const savedEntry = savedCheck.find(a => a.rawDate === opDate);
      
      if (!savedEntry) {
        throw new Error(`Cafe Archive Verification Failed: Record for ${opDate} not found after write.`);
      }

      if (totalRevenue > 0 && savedEntry.totalRevenue === 0) {
        throw new Error(`Cafe Archive Verification Failed: Live revenue ₹${totalRevenue} was stored as zero.`);
      }

      return true;
    } catch (err) {
      console.error('Failed to archive daily cafe report:', err);
      return false; // Prevent dashboard reset if archive fails!
    }
  },

  /**
   * Analytics calculation for Today, Yesterday, This Week, This Month, This Year, Custom Date
   */
  async getAnalyticsSummary(filterType = 'TODAY', todayOrders = [], customStart = null, customEnd = null) {
    const archives = await this.getArchivedCafeReports();
    const opDate = (typeof localStorage !== 'undefined' && localStorage.getItem('gforce_operational_date')) || sessionService.getBusinessDate(new Date());
    const todayStr = opDate;

    // Filter todayOrders strictly for today's operational business date
    const actualTodayOrders = (todayOrders || []).filter(o => {
      if (!o) return false;
      const raw = o.created_at || o.createdAt || o.timestamp || o.date;
      if (!raw) return false;
      const orderDate = sessionService.getBusinessDate(raw);
      return orderDate === opDate;
    });

    // Build today's active archive object
    let todayRevenue = 0;
    let todayCompleted = 0;
    let todayPending = 0;
    let todayCancelled = 0;
    let todayCash = 0;
    let todayUpi = 0;
    let todayCard = 0;
    const todayProductAnalytics = {};

    actualTodayOrders.forEach(o => {
      const amt = Number(o.total || o.total_amount) || 0;
      const status = o.status || 'Collected';
      const method = o.paymentMethod || o.payment_method || 'Cash';
      const prodName = o.productName || o.product_name || 'Café Item';
      const category = o.category || 'Snacks';
      const qty = Number(o.quantity) || 1;

      if (status === 'Collected' || status === 'Completed' || o.revenueCounted) {
        todayCompleted++;
        todayRevenue += amt;
        if (method === 'Cash') todayCash += amt;
        else if (method === 'UPI') todayUpi += amt;
        else todayCard += amt;

        if (!todayProductAnalytics[prodName]) {
          todayProductAnalytics[prodName] = { name: prodName, category, unitsSold: 0, revenue: 0, lastSoldTime: o.time || 'Today' };
        }
        todayProductAnalytics[prodName].unitsSold += qty;
        todayProductAnalytics[prodName].revenue += amt;
      } else if (status === 'Cancelled') {
        todayCancelled++;
      } else {
        todayPending++;
      }
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const parts = todayStr.split('-');
    const formattedTodayStr = `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;

    const todayRecord = {
      id: `cafe_arch_${todayStr}`,
      rawDate: todayStr,
      dateStr: `${formattedTodayStr} (Today)`,
      isToday: true,
      totalRevenue: todayRevenue,
      totalOrders: actualTodayOrders.length,
      completedOrders: todayCompleted,
      pendingOrders: todayPending,
      cancelledOrders: todayCancelled,
      cashRevenue: todayCash,
      upiRevenue: todayUpi,
      cardRevenue: todayCard,
      averageOrderValue: todayCompleted > 0 ? Math.round(todayRevenue / todayCompleted) : 0,
      productAnalytics: todayProductAnalytics,
      ordersList: actualTodayOrders
    };

    // Combine historical archives with Today's live record
    const allArchivesMap = new Map();
    archives.forEach(a => allArchivesMap.set(a.rawDate, a));
    allArchivesMap.set(todayStr, todayRecord);

    const allCombined = Array.from(allArchivesMap.values()).sort((a, b) => b.rawDate.localeCompare(a.rawDate));

    // Filter by selected filterType
    let filtered = allCombined;
    if (filterType === 'TODAY') {
      filtered = allCombined.filter(a => a.rawDate === todayStr);
    } else if (filterType === 'YESTERDAY') {
      const yDate = new Date();
      yDate.setDate(yDate.getDate() - 1);
      const yStr = yDate.toISOString().split('T')[0];
      filtered = allCombined.filter(a => a.rawDate === yStr);
    } else if (filterType === 'THIS_WEEK') {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diffToMonday));
      const mondayStr = monday.toISOString().split('T')[0];
      filtered = allCombined.filter(a => a.rawDate >= mondayStr);
    } else if (filterType === 'THIS_MONTH') {
      const mStr = todayStr.substring(0, 7);
      filtered = allCombined.filter(a => a.rawDate.startsWith(mStr));
    } else if (filterType === 'THIS_YEAR') {
      const yStr = todayStr.substring(0, 4);
      filtered = allCombined.filter(a => a.rawDate.startsWith(yStr));
    } else if (filterType === 'CUSTOM' && customStart && customEnd) {
      filtered = allCombined.filter(a => a.rawDate >= customStart && a.rawDate <= customEnd);
    }

    // Consolidated Metrics Calculation
    let aggregateRevenue = 0;
    let aggregateOrders = 0;
    let aggregateCompleted = 0;
    let aggregatePending = 0;
    let aggregateCancelled = 0;
    let aggregateCash = 0;
    let aggregateUpi = 0;
    let aggregateCard = 0;
    const consolidatedProducts = {};

    filtered.forEach(r => {
      aggregateRevenue += (r.totalRevenue || 0);
      aggregateOrders += (r.totalOrders || 0);
      aggregateCompleted += (r.completedOrders || 0);
      aggregatePending += (r.pendingOrders || 0);
      aggregateCancelled += (r.cancelledOrders || 0);
      aggregateCash += (r.cashRevenue || 0);
      aggregateUpi += (r.upiRevenue || 0);
      aggregateCard += (r.cardRevenue || 0);

      // Merge product analytics
      if (r.productAnalytics) {
        Object.values(r.productAnalytics).forEach(p => {
          if (!consolidatedProducts[p.name]) {
            consolidatedProducts[p.name] = {
              name: p.name,
              category: p.category || 'Snacks',
              unitsSold: 0,
              revenue: 0,
              lastSoldTime: p.lastSoldTime || r.dateStr
            };
          }
          consolidatedProducts[p.name].unitsSold += (p.unitsSold || 0);
          consolidatedProducts[p.name].revenue += (p.revenue || 0);
        });
      }
    });

    const productList = Object.values(consolidatedProducts).sort((a, b) => b.revenue - a.revenue);
    const bestSelling = productList.length > 0 ? productList[0].name : 'None';
    const leastSelling = productList.length > 1 ? productList[productList.length - 1].name : 'None';

    return {
      filterType,
      aggregateRevenue,
      aggregateOrders,
      aggregateCompleted,
      aggregatePending,
      aggregateCancelled,
      aggregateCash,
      aggregateUpi,
      aggregateCard,
      averageOrderValue: aggregateCompleted > 0 ? Math.round(aggregateRevenue / aggregateCompleted) : 0,
      bestSellingProduct: bestSelling,
      leastSellingProduct: leastSelling,
      productList,
      dailyArchives: filtered,
      allHistoricalArchives: allCombined
    };
  }
};
