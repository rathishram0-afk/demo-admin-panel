/**
 * Gaming Café Order Service - Enterprise POS/ERP Counter & Session Integrated Order Management System
 * Connected directly to Supabase cafe_orders database table.
 */

import { supabase } from './supabase.js';
import { sessionService } from './sessionService.js';

export const cafeOrderService = {
  async getOrders() {
    try {
      const { data, error } = await supabase
        .from('cafe_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase getOrders Error:', error.message, error.details, error.hint);
        throw error;
      }

      // Map back to camelCase expected by components
      return (data || []).map(row => ({
        id: row.id,
        orderId: row.order_id,
        mode: row.mode,
        sessionId: row.session_id,
        stationId: row.station_id,
        deviceId: row.station_id,
        deviceName: row.device_name,
        customerName: row.customer_name,
        productName: row.product_name,
        category: row.category,
        price: Number(row.price),
        quantity: Number(row.quantity),
        total: Number(row.total_amount),
        subtotal: Number(row.total_amount),
        grandTotal: Number(row.total_amount),
        items: [
          { productName: row.product_name, price: Number(row.price), quantity: Number(row.quantity), total: Number(row.total_amount) }
        ],
        mobile: row.mobile_number,
        date: row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB') : '',
        time: row.created_at ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
        timestamp: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
        status: row.status,
        revenueCounted: row.revenue_counted,
        paymentStatus: row.payment_status,
        paymentMethod: row.payment_method,
        image: row.image_url
      }));
    } catch (err) {
      console.error('Error fetching cafe orders:', err);
      throw err;
    }
  },

  // MODE 1: ATTACH TO RUNNING GAMING SESSION WITH MANDATORY DUAL SESSION ID + DEVICE ID VALIDATION
  async attachOrderToSession({ stationId, sessionId, productName, category, price, quantity, image, customerName }) {
    if (!stationId || !sessionId) {
      throw new Error("Order Mismatch Error: Both Station ID and Session ID are mandatory!");
    }

    const stations = await sessionService.getStations();
    const activeStation = stations.find(s => 
      s.id === stationId && 
      (s.status === 'RUNNING' || s.status === 'ACTIVE' || s.status === 'ENDING_SOON' || s.status === 'BUSY')
    );

    if (!activeStation) {
      throw new Error(`Order Mismatch Error: Station ${stationId} with Session ID ${sessionId} is not active! Order Rejected.`);
    }

    // Generate friendly sequential order ID
    const seqNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = `GF-${seqNum}`;

    const qty = Math.min(20, Math.max(1, Number(quantity) || 1));
    const unitPrice = Number(price) || 20;
    const total = unitPrice * qty;

    const newOrder = {
      order_id: orderId,
      mode: 'SESSION',
      session_id: sessionId,
      station_id: stationId,
      device_name: activeStation.name || stationId,
      customer_name: customerName || activeStation.customerName || 'Walk-in Gamer',
      mobile_number: activeStation.phone || '-',
      product_name: productName,
      category: category || 'Café Item',
      price: unitPrice,
      quantity: qty,
      total_amount: total,
      payment_method: 'Cash',
      payment_status: 'Pending',
      status: 'Pending',
      revenue_counted: false,
      image_url: image || '/images/menu/drinks/pepsi-400ml.png'
    };

    // Merge into live session station bill with STRICT SESSION ID MATCHING optimistically
    await sessionService.addSnackOrderToStation(stationId, sessionId, {
      orderId: newOrder.order_id,
      sessionId: sessionId,
      stationId: stationId,
      productName: productName,
      price: unitPrice,
      quantity: qty,
      total
    });

    const { error } = await supabase
      .from('cafe_orders')
      .insert([newOrder]);

    if (error) {
      console.error('Supabase attachOrderToSession Error:', error.message);
      throw error;
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gforce_order_updated', {
        detail: { eventType: 'INSERT', order: newOrder }
      }));
    }

    const data = newOrder;

    return {
      id: data.id,
      orderId: data.order_id,
      mode: data.mode,
      sessionId: data.session_id,
      stationId: data.station_id,
      deviceId: data.station_id,
      deviceName: data.device_name,
      customerName: data.customer_name,
      productName: data.product_name,
      category: data.category,
      price: Number(data.price),
      quantity: Number(data.quantity),
      total: Number(data.total_amount),
      subtotal: Number(data.total_amount),
      grandTotal: Number(data.total_amount),
      items: [
        { productName: data.product_name, price: Number(data.price), quantity: Number(data.quantity), total: Number(data.total_amount) }
      ],
      mobile: data.mobile_number,
      date: new Date(data.created_at).toLocaleDateString('en-GB'),
      time: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date(data.created_at).getTime(),
      timestamp: new Date(data.created_at).getTime(),
      status: data.status,
      revenueCounted: data.revenue_counted,
      paymentStatus: data.payment_status,
      paymentMethod: data.payment_method,
      image: data.image_url
    };
  },

  // MODE 2: STANDALONE COUNTER WALK-IN ORDER
  async createOrder({ product, quantity, customerName, mobile, mode = 'COUNTER', sessionId = '-', paymentMethod = 'Cash' }) {
    let seqNum = 1;
    try {
      const { count } = await supabase
        .from('cafe_orders')
        .select('*', { count: 'exact', head: true });
      seqNum = (count || 0) + 1;
    } catch (e) {
      console.error('Error calculating order sequence:', e);
    }
    const orderId = `GF-${seqNum.toString().padStart(4, '0')}`;

    const qty = Math.min(20, Math.max(1, Number(quantity) || 1));
    const unitPrice = Number(product.numericPrice || product.price?.replace(/[^0-9]/g, '')) || 20;
    const total = unitPrice * qty;

    const newOrder = {
      order_id: orderId,
      mode: mode,
      session_id: sessionId || '-',
      station_id: '-',
      device_name: 'Counter',
      customer_name: customerName ? customerName.trim() : 'Walk-in Gamer',
      mobile_number: mobile ? mobile.trim() : '-',
      product_name: product.name,
      category: product.badge || product.category || 'Café Item',
      price: unitPrice,
      quantity: qty,
      total_amount: total,
      payment_method: paymentMethod || 'Cash',
      payment_status: 'Pending',
      status: 'Pending',
      revenue_counted: false,
      image_url: product.image
    };

    const { data: insertData, error } = await supabase
      .from('cafe_orders')
      .insert([newOrder])
      .select();

    if (error) {
      console.error('Supabase createOrder Error:', error.message, error.details, error.hint);
      throw error;
    }
    const data = insertData?.[0] || newOrder;

    sessionService.addNotification('New Café Order Received', `Order ${orderId} (${product.name} × ${qty}) placed by ${data.customer_name}.`, 'INFO');
    sessionService.addActivity('New Café Order ' + orderId, `${product.name} × ${qty} (₹${total})`, 'START');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gforce_order_updated', {
        detail: { eventType: 'INSERT', order: data }
      }));
    }

    return {
      id: data.id,
      orderId: data.order_id,
      mode: data.mode,
      sessionId: data.session_id,
      stationId: data.station_id,
      deviceId: data.station_id,
      deviceName: data.device_name,
      customerName: data.customer_name,
      productName: data.product_name,
      category: data.category,
      price: Number(data.price),
      quantity: Number(data.quantity),
      total: Number(data.total_amount),
      subtotal: Number(data.total_amount),
      grandTotal: Number(data.total_amount),
      items: [
        { productName: data.product_name, price: Number(data.price), quantity: Number(data.quantity), total: Number(data.total_amount) }
      ],
      mobile: data.mobile_number,
      date: new Date(data.created_at).toLocaleDateString('en-GB'),
      time: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date(data.created_at).getTime(),
      timestamp: new Date(data.created_at).getTime(),
      status: data.status,
      revenueCounted: data.revenue_counted,
      paymentStatus: data.payment_status,
      paymentMethod: data.payment_method,
      image: data.image_url
    };
  },

  async updateOrderStatus(orderId, newStatus) {
    try {
      const isCollected = newStatus === 'Collected';
      const updatePayload = {
        status: newStatus
      };
      if (isCollected) {
        updatePayload.payment_status = 'Paid';
        updatePayload.revenue_counted = true;
      }

      const isUUID = orderId && orderId.length === 36;
      const query = supabase.from('cafe_orders').update(updatePayload);
      if (isUUID) {
        query.eq('id', orderId);
      } else {
        query.eq('order_id', orderId);
      }

      const { data, error } = await query.select();

      if (error) {
        console.error('Supabase updateOrderStatus Error:', error.message, error.details, error.hint);
        throw error;
      }

      if (isCollected && data && data.length > 0) {
        const collectedOrder = data[0];
        // Sync local storage revenue tracker as fallback indicator
        if (typeof localStorage !== 'undefined') {
          const currentRev = Number(localStorage.getItem('gforce_pos_revenue_prod') || 0);
          localStorage.setItem('gforce_pos_revenue_prod', currentRev + Number(collectedOrder.total_amount));
        }
        sessionService.addActivity('Café Order ' + collectedOrder.order_id + ' Collected', `₹${collectedOrder.total_amount} added to Today's Revenue`, 'END');
      }

      if (data && data.length > 0) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('gforce_order_updated', {
            detail: { eventType: 'UPDATE', order: data[0] }
          }));
        }
      }

      return this.getOrders();
    } catch (e) {
      console.error('Failed to update order status:', e);
      throw e;
    }
  },

  async deleteOrder(orderId) {
    try {
      const isUUID = orderId && orderId.length === 36;

      // 1. Fetch the target cafe order before deletion
      let targetQuery = supabase.from('cafe_orders').select('*');
      if (isUUID) {
        targetQuery = targetQuery.eq('id', orderId);
      } else {
        targetQuery = targetQuery.eq('order_id', orderId);
      }
      const { data: foundOrders, error: fetchErr } = await targetQuery;

      if (fetchErr) {
        console.error('Supabase fetch order for deletion failed:', fetchErr);
        throw fetchErr;
      }

      const targetOrder = foundOrders && foundOrders.length > 0 ? foundOrders[0] : null;

      // 2. Delete the order from cafe_orders table
      const deleteQuery = supabase.from('cafe_orders').delete();
      if (isUUID) {
        deleteQuery.eq('id', orderId);
      } else {
        deleteQuery.eq('order_id', orderId);
      }
      const { error: delErr } = await deleteQuery;

      if (delErr) {
        console.error('Supabase deleteOrder Error:', delErr.message, delErr.details, delErr.hint);
        throw delErr;
      }

      // 3. If attached to a Session (mode === 'SESSION' or has session_id/station_id), update active session in walkin_sessions
      if (targetOrder && (targetOrder.mode === 'SESSION' || (targetOrder.session_id && targetOrder.session_id !== '-'))) {
        const sessId = targetOrder.session_id;
        const stId = targetOrder.station_id;

        const { data: activeWalkins } = await supabase
          .from('walkin_sessions')
          .select('*')
          .in('session_status', ['Active', 'active', 'Paused', 'paused', 'Running', 'running', 'Ending_Soon', 'ending_soon']);

        const activeSession = (activeWalkins || []).find(w => 
          w.id === sessId || 
          w.session_code === sessId || 
          w.device_id === stId ||
          w.device_id === targetOrder.station_id
        );

        if (activeSession) {
          const sessKeys = [activeSession.id, activeSession.session_code].filter(Boolean);

          // Fetch remaining valid cafe orders for this session directly from Supabase DB
          const { data: remOrders } = await supabase
            .from('cafe_orders')
            .select('*');

          // Filter strictly for orders belonging to THIS active session
          const validRemOrders = (remOrders || []).filter(o => {
            if (!o) return false;
            if (o.id === targetOrder.id || o.order_id === targetOrder.order_id || o.id === orderId || o.order_id === orderId) return false;

            const oSessId = String(o.session_id || o.sessionId || '').trim();
            const oStatId = String(o.station_id || o.stationId || '').trim();

            const isSessionMatch = sessKeys.includes(oSessId);
            const isStationMatch = oStatId === activeSession.device_id && sessKeys.includes(oSessId);

            return isSessionMatch || isStationMatch;
          });

          // Calculate new food total from remaining cafe orders
          const newFoodTotal = validRemOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

          // Map remaining orders for snack_orders array in session
          const newSnackOrders = validRemOrders.map(o => ({
            orderId: o.order_id,
            sessionId: o.session_id,
            stationId: o.station_id,
            productName: o.product_name,
            name: o.product_name,
            price: Number(o.price),
            quantity: Number(o.quantity),
            qty: Number(o.quantity),
            total: Number(o.total_amount),
            subtotal: Number(o.total_amount)
          }));

          const baseGamingCharge = Number(
            activeSession.gaming_charge || 
            activeSession.original_gaming_amount || 
            (Number(activeSession.total_amount || 0) - Number(activeSession.food_total || 0)) || 
            0
          );

          const newTotalAmount = baseGamingCharge + newFoodTotal;

          const { error: sessUpdateErr } = await supabase
            .from('walkin_sessions')
            .update({
              snack_orders: newSnackOrders,
              food_total: newFoodTotal,
              total_amount: newTotalAmount
            })
            .eq('id', activeSession.id);

          if (sessUpdateErr) {
            console.error('Error updating walkin_session after cafe order delete:', sessUpdateErr);
          }
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gforce_order_updated', {
          detail: { eventType: 'DELETE', orderId }
        }));
        window.dispatchEvent(new CustomEvent('gforce_session_changed', {
          detail: { eventType: 'UPDATE' }
        }));
        window.dispatchEvent(new CustomEvent('gforce_dashboard_updated'));
      }

      return this.getOrders();
    } catch (e) {
      console.error('Failed to delete order:', e);
      throw e;
    }
  },

  async clearAllOrders() {
    try {
      const { error } = await supabase
        .from('cafe_orders')
        .delete()
        .not('id', 'is', null);
      if (error) throw error;

      await supabase
        .from('cafe_daily_archives')
        .delete()
        .not('id', 'is', null);

      try {
        const { cafeArchiveService } = await import('./cafeArchiveService.js');
        if (cafeArchiveService && cafeArchiveService.clearArchives) {
          cafeArchiveService.clearArchives();
        }
      } catch (e) {}

      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('gforce_pos_revenue_prod');
        localStorage.removeItem('gforce_pos_revenue_v6');
        localStorage.removeItem('gforce_cafe_orders_v2');
        localStorage.removeItem('gforce_cafe_daily_archives_prod');
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gforce_order_updated', {
          detail: { eventType: 'DELETE_ALL' }
        }));
      }
    } catch (e) {
      console.error('Failed to clear cafe orders in Supabase:', e);
      throw e;
    }
  },

  async getMetrics() {
    try {
      const allOrders = await this.getOrders();
      const opDate = (typeof localStorage !== 'undefined' && localStorage.getItem('gforce_operational_date')) || sessionService.getBusinessDate(new Date());

      // Filter orders belonging strictly to today's operational business date
      const orders = allOrders.filter(o => {
        if (!o) return false;
        const ts = o.createdAt || o.timestamp || o.created_at || o.date;
        if (!ts) return false;
        const orderDate = sessionService.getBusinessDate(ts);
        return orderDate === opDate;
      });

      const todaysOrders = orders.length;

      let pendingCount = 0;
      let preparingCount = 0;
      let readyCount = 0;
      let collectedCount = 0;
      let sessionOrdersCount = 0;
      let counterOrdersCount = 0;
      let cafeRevenue = 0;

      orders.forEach(o => {
        if (o.mode === 'SESSION') sessionOrdersCount++;
        else counterOrdersCount++;

        if (o.status === 'Pending') pendingCount++;
        else if (o.status === 'Preparing') preparingCount++;
        else if (o.status === 'Ready') readyCount++;
        else if (o.status === 'Collected' || o.status === 'Completed' || o.revenueCounted) {
          collectedCount++;
          cafeRevenue += Number(o.total || o.total_amount || o.grandTotal) || 0;
        }
      });

      return {
        todaysOrders,
        pendingCount,
        preparingCount,
        readyCount,
        collectedCount,
        sessionOrdersCount,
        counterOrdersCount,
        cafeRevenue
      };
    } catch (e) {
      console.error('Failed to calculate metrics:', e);
      return {
        todaysOrders: 0,
        pendingCount: 0,
        preparingCount: 0,
        readyCount: 0,
        collectedCount: 0,
        sessionOrdersCount: 0,
        counterOrdersCount: 0,
        cafeRevenue: 0
      };
    }
  },

  generateWhatsAppMessage(order) {
    const text = 
`🎮 *G-FORCE Gaming Hub*
🍔 *New Café Order*

*Order ID:* ${order.orderId}
*Mode:* ${order.mode === 'SESSION' ? `Attached to Session (${order.sessionId})` : 'Counter Walk-in'}
*Product:* ${order.productName}
*Price:* ₹${order.price}
*Quantity:* ${order.quantity}
*Total:* ₹${order.total}

*Customer:* ${order.customerName}
*Mobile:* ${order.mobile}
*Date:* ${order.date}
*Time:* ${order.time}
*Status:* ${order.status}`;

    return encodeURIComponent(text);
  }
};
