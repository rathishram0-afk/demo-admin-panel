import React, { useState, useEffect } from 'react';
import { useSiteContext } from '../../../context/SiteContext';
import { cafeOrderService } from '../../../services/cafeOrderService';
import { cafeMenuService, normalizeCategoryKey } from '../../../services/cafeMenuService';
import { sessionService } from '../../../services/sessionService';
import { useRealtime } from '../../../context/RealtimeContext';
import CafeReportsSection from './CafeReportsSection';
import { 
  UtensilsCrossed, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Eye, 
  Trash2, 
  Printer, 
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShoppingBag,
  Gamepad2,
  Plus,
  Minus,
  Check,
  Zap,
  Sparkles,
  Lock,
  AlertTriangle,
  BarChart3
} from 'lucide-react';

const CATEGORY_PRODUCTS = {
  Drinks: [
    { name: 'Fanta 400ml', price: 20, image: '/images/menu/drinks/fanta-400ml.png' },
    { name: 'Coca-Cola 400ml', price: 20, image: '/images/menu/drinks/coco-cola-400ml.png' },
    { name: 'Pepsi 400ml', price: 20, image: '/images/menu/drinks/pepsi-400ml.png' }
  ],
  Shakes: [
    { name: 'Godrej Jersey Vanilla Thick Shake', price: 40, image: '/images/menu/shakes/vanilla-thick-shake.png' },
    { name: 'Godrej Jersey Chocolate Thick Shake', price: 40, image: '/images/menu/shakes/chocolate-thick-shake.png' },
    { name: 'Godrej Jersey Strawberry Thick Shake', price: 40, image: '/images/menu/shakes/strawberry-thick-shake.png' }
  ],
  Snacks: [
    { name: 'Doritos Sweet Chilli Large', price: 85, image: '/images/menu/snacks/doritos-sweet-chilli-large.png' },
    { name: 'Doritos Sweet Chilli Regular', price: 50, image: '/images/menu/snacks/doritos-sweet-chilli-regular.png' },
    { name: 'Doritos Nacho Cheese', price: 50, image: '/images/menu/snacks/doritos-nachos-cheese.png' },
    { name: 'Bingo Mad Angles Large', price: 50, image: '/images/menu/snacks/bingo-mad-angles.png' },
    { name: 'Bingo Mad Angles Regular', price: 20, image: '/images/menu/snacks/bingo-mad-angles.png' },
    { name: 'Lays All Flavours Large', price: 50, image: '/images/menu/snacks/lays-all-flavours.png' },
    { name: 'Lays All Flavours Medium', price: 30, image: '/images/menu/snacks/lays-all-flavours.png' },
    { name: 'Lays All Flavours Small', price: 20, image: '/images/menu/snacks/lays-all-flavours.png' },
    { name: 'Kurkure Large', price: 30, image: '/images/menu/snacks/kurkure-all-flavours.png' },
    { name: 'Kurkure Small', price: 20, image: '/images/menu/snacks/kurkure-all-flavours.png' }
  ]
};

export default function CafeOrdersModule() {
  const { menu } = useSiteContext();
  const [activeModuleTab, setActiveModuleTab] = useState('POS'); // 'POS' or 'REPORTS'
  const [activeFormTab, setActiveFormTab] = useState('SESSION'); // 'SESSION' or 'COUNTER'
  const [runningStations, setRunningStations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [metrics, setMetrics] = useState({
    todaysOrders: 0,
    pendingCount: 0,
    preparingCount: 0,
    readyCount: 0,
    collectedCount: 0,
    sessionOrdersCount: 0,
    counterOrdersCount: 0,
    cafeRevenue: 0
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [notice, setNotice] = useState('');

  // Form State for Mode 1: Attach to Session
  const [sessionForm, setSessionForm] = useState({
    stationId: '',
    sessionId: '',
    category: 'Drinks',
    productIndex: 0,
    quantity: 1,
    notes: ''
  });

  // Form State for Mode 2: Counter Walk-in
  const [counterForm, setCounterForm] = useState({
    customerName: '',
    mobile: '',
    category: 'Drinks',
    productIndex: 0,
    quantity: 1
  });

  const { cafeOrders, devices, activeSessions } = useRealtime();

  const [deleteModalOrder, setDeleteModalOrder] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      const [ords, met] = await Promise.all([
        cafeOrderService.getOrders(),
        cafeOrderService.getMetrics()
      ]);
      setOrders(ords || []);
      setMetrics(met);
    } catch (e) {
      console.error('Error loading CafeOrders data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [cafeOrders]);

  useEffect(() => {
    const stData = sessionService.mapStations(devices, activeSessions);
    const active = stData.filter(s => s.status === 'RUNNING' || s.status === 'ACTIVE' || s.status === 'ENDING_SOON');
    setRunningStations(active);

    setSessionForm(prev => {
      const savedStation = localStorage.getItem('gforce_pos_selected_station');
      const currentSelection = prev.stationId || savedStation;
      const match = active.find(s => s.id === currentSelection);

      if (match) {
        localStorage.setItem('gforce_pos_selected_station', match.id);
        return {
          ...prev,
          stationId: match.id,
          sessionId: match.currentSessionId || ''
        };
      } else if (active.length > 0) {
        localStorage.setItem('gforce_pos_selected_station', active[0].id);
        return {
          ...prev,
          stationId: active[0].id,
          sessionId: active[0].currentSessionId || ''
        };
      }
      return prev;
    });
  }, [devices, activeSessions]);

  const handleStationDropdownChange = (stId) => {
    const selectedSt = runningStations.find(s => s.id === stId);
    const sessId = selectedSt ? selectedSt.currentSessionId : '';
    localStorage.setItem('gforce_pos_selected_station', stId);
    setSessionForm(prev => ({
      ...prev,
      stationId: stId,
      sessionId: sessId
    }));
  };

  // Handle category change
  const handleSessionCategoryChange = (catName) => {
    setSessionForm(prev => ({
      ...prev,
      category: catName,
      productIndex: 0
    }));
  };

  const handleCounterCategoryChange = (catName) => {
    setCounterForm(prev => ({
      ...prev,
      category: catName,
      productIndex: 0
    }));
  };

  const selectedStationObj = runningStations.find(s => s.id === sessionForm.stationId);

  // Mode 1: Session Attached Submit Handler
  const handleSessionOrderSubmit = async (e) => {
    e.preventDefault();

    if (!sessionForm.stationId) {
      alert("Please select an active gaming station!");
      return;
    }

    const targetSt = runningStations.find(s => s.id === sessionForm.stationId);
    const currentSessionId = targetSt?.currentSessionId || sessionForm.sessionId;

    if (!currentSessionId) {
      alert("Selected station has no active session ID!");
      return;
    }

    const categoryProducts = getProductsByCategory(sessionForm.category);
    const selectedProd = categoryProducts[sessionForm.productIndex] || categoryProducts[0];

    try {
      await cafeOrderService.attachOrderToSession({
        stationId: sessionForm.stationId,
        sessionId: currentSessionId,
        productName: selectedProd.name,
        category: sessionForm.category,
        price: selectedProd.price,
        quantity: sessionForm.quantity,
        notes: sessionForm.notes,
        image: selectedProd.image,
        customerName: targetSt.customerName || 'Walk-in Gamer'
      });

      setNotice(`✅ Order attached strictly to ${currentSessionId} (${sessionForm.stationId})!`);
      setTimeout(() => setNotice(''), 3500);

      setSessionForm(prev => ({ ...prev, quantity: 1, notes: '' }));
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to attach order.');
    }
  };

  // Mode 2: Counter Order Submit Handler
  const handleCounterOrderSubmit = async (e) => {
    e.preventDefault();

    const categoryProducts = getProductsByCategory(counterForm.category);
    const selectedProd = categoryProducts[counterForm.productIndex] || categoryProducts[0];

    try {
      await cafeOrderService.createOrder({
        product: {
          name: selectedProd.name,
          numericPrice: selectedProd.price,
          badge: counterForm.category,
          image: selectedProd.image
        },
        quantity: counterForm.quantity,
        customerName: counterForm.customerName,
        mobile: counterForm.mobile,
        mode: 'COUNTER',
        sessionId: '-'
      });

      setNotice('✅ Standalone counter order submitted!');
      setTimeout(() => setNotice(''), 3500);

      setCounterForm(prev => ({ ...prev, customerName: '', mobile: '', quantity: 1 }));
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to submit counter order.');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    await cafeOrderService.updateOrderStatus(orderId, newStatus);
    await loadData();
  };

  const handleConfirmDeleteOrder = async (order) => {
    if (!order) return;
    setIsDeleting(true);
    try {
      await cafeOrderService.deleteOrder(order.id || order.orderId);
      setDeleteModalOrder(null);
      setNotice(`✅ Cafe Order ${order.orderId || order.id} deleted.`);
      setTimeout(() => setNotice(''), 3500);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete cafe order.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      (o.id && o.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.productName && o.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.sessionId && o.sessionId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.stationId && o.stationId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesStatus = true;
    if (statusFilter === 'SESSION_ORDERS') matchesStatus = o.mode === 'SESSION';
    else if (statusFilter === 'COUNTER_ORDERS') matchesStatus = o.mode === 'COUNTER';
    else if (statusFilter !== 'ALL') matchesStatus = o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pageSize = 6;
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getProductsByCategory = (catName) => {
    if (!menu) return [];
    const normKey = normalizeCategoryKey(catName);
    const rawList = menu[normKey] || menu[catName] || [];
    return rawList.map(item => ({
      name: item.name,
      price: Number(item.numericPrice || String(item.price).replace(/[^0-9.]/g, '')) || 0,
      image: item.image,
      status: item.status,
      isAvailable: item.status === 'AVAILABLE' && item.isVisible !== false
    }));
  };

  const activeSessionProductList = getProductsByCategory(sessionForm.category);
  const activeSessionProd = activeSessionProductList[sessionForm.productIndex] || activeSessionProductList[0];
  const sessionEstimatedTotal = (activeSessionProd?.price || 20) * sessionForm.quantity;

  const activeCounterProductList = getProductsByCategory(counterForm.category);
  const activeCounterProd = activeCounterProductList[counterForm.productIndex] || activeCounterProductList[0];
  const counterEstimatedTotal = (activeCounterProd?.price || 20) * counterForm.quantity;

  return (
    <div className="space-y-4 font-sans text-gray-100 min-h-0 flex-1 flex flex-col custom-scrollbar overflow-y-auto pr-1">
      
      {/* HEADER BAR */}
      <div className="glass-panel p-4 xl:p-5 rounded-2xl border border-white/10 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="font-cyber text-base xl:text-lg font-bold text-white tracking-wider flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-purple-400" /> Gaming Café Orders & Session Isolation
          </h2>
          <p className="text-xs text-gray-400">Strict unique session-based order mapping & standalone counter sales</p>
        </div>

        <div className="flex items-center gap-2">
          {notice && (
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-cyber font-bold flex items-center gap-2 animate-pulse shadow-md">
              <Check className="w-4 h-4 text-emerald-400" /> {notice}
            </div>
          )}

          <div className="flex items-center gap-1 bg-[#090C19] p-1.5 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveModuleTab('POS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-cyber font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeModuleTab === 'POS'
                  ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" /> Live POS & Orders
            </button>
            <button
              onClick={() => setActiveModuleTab('REPORTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-cyber font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeModuleTab === 'REPORTS'
                  ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Café Analytics & Archives
            </button>
          </div>
        </div>
      </div>

      {activeModuleTab === 'REPORTS' ? (
        <CafeReportsSection />
      ) : (
        <>

      {/* TOP STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="glass-panel p-3.5 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[10px] font-cyber text-gray-400 uppercase">Today's Orders</span>
          <div className="text-xl xl:text-2xl font-cyber font-bold text-white font-mono">{metrics.todaysOrders}</div>
          <span className="text-[10px] text-gray-500 font-mono">Sessions: {metrics.sessionOrdersCount} | Counter: {metrics.counterOrdersCount}</span>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl border border-amber-500/30 bg-amber-950/20 space-y-1">
          <span className="text-[10px] font-cyber text-amber-300 uppercase font-bold">Pending</span>
          <div className="text-xl xl:text-2xl font-cyber font-bold text-amber-400 font-mono">{metrics.pendingCount}</div>
          <span className="text-[10px] text-amber-500/80 font-mono">Kitchen Queue</span>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl border border-blue-500/30 bg-blue-950/20 space-y-1">
          <span className="text-[10px] font-cyber text-blue-300 uppercase font-bold">Preparing</span>
          <div className="text-xl xl:text-2xl font-cyber font-bold text-blue-400 font-mono">{metrics.preparingCount}</div>
          <span className="text-[10px] text-blue-500/80 font-mono">In Preparation</span>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 space-y-1">
          <span className="text-[10px] font-cyber text-emerald-300 uppercase font-bold">Ready</span>
          <div className="text-xl xl:text-2xl font-cyber font-bold text-emerald-400 font-mono">{metrics.readyCount}</div>
          <span className="text-[10px] text-emerald-500/80 font-mono">Pickup Ready</span>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl border border-purple-500/30 bg-purple-950/20 space-y-1">
          <span className="text-[10px] font-cyber text-purple-300 uppercase font-bold">Collected</span>
          <div className="text-xl xl:text-2xl font-cyber font-bold text-purple-300 font-mono">{metrics.collectedCount}</div>
          <span className="text-[10px] text-purple-400/80 font-mono">Completed</span>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 space-y-1">
          <span className="text-[10px] font-cyber text-emerald-400 uppercase font-bold">Today's Revenue</span>
          <div className="text-xl xl:text-2xl font-cyber font-bold text-emerald-400 font-mono">₹ {(metrics?.cafeRevenue || 0).toLocaleString()}</div>
          <span className="text-[10px] text-emerald-500/80 font-mono">Gaming + F&B</span>
        </div>
      </div>

      {/* WORKFLOW MODE TABS */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-4">
        <div className="flex justify-center border-b border-white/10 pb-3">
          <div className="inline-flex p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md gap-2">
            <button
              type="button"
              onClick={() => setActiveFormTab('SESSION')}
              className={`px-5 py-2 rounded-xl text-xs font-cyber font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeFormTab === 'SESSION'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)] border border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Gamepad2 className="w-4 h-4 text-purple-400" /> 🎮 Attach to Live Gaming Session
            </button>

            <button
              type="button"
              onClick={() => setActiveFormTab('COUNTER')}
              className={`px-5 py-2 rounded-xl text-xs font-cyber font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeFormTab === 'COUNTER'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)] border border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-cyan-400" /> 🛒 Counter Walk-in Order
            </button>
          </div>
        </div>

        {/* PROTECTION ALERT BANNER IF NO ACTIVE LIVE SESSION */}
        {activeFormTab === 'SESSION' && runningStations.length === 0 && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-300 text-xs font-cyber font-bold flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> ⚠ No Active Session Selected. Please start a session from Walk-in POS first.
          </div>
        )}

        {/* MODE 1 FORM: ATTACH TO RUNNING SESSION */}
        {activeFormTab === 'SESSION' && (
          <form onSubmit={handleSessionOrderSubmit} className="space-y-4 text-left">
            
            {/* SESSION SELECTION DROPDOWN */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="md:col-span-2">
                <label className="text-xs font-cyber font-bold text-purple-300 block mb-1">Select Active Live Session *</label>
                <select
                  value={sessionForm.stationId}
                  onChange={(e) => handleStationDropdownChange(e.target.value)}
                  disabled={runningStations.length === 0}
                  className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-purple-500/40 text-xs font-cyber font-bold text-white outline-none cursor-pointer"
                >
                  {runningStations.length === 0 ? (
                    <option value="">No Active Running Sessions</option>
                  ) : (
                    runningStations.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.id} ({st.currentSessionId || 'SESS'}) — {st.customerName || 'Player'} [Gaming ₹{st.price}]
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* READ-ONLY AUTO-FILLED FIELDS */}
              <div>
                <label className="text-[10px] font-cyber text-gray-400 block mb-1 uppercase">Session ID (Auto)</label>
                <div className="px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs font-mono font-bold text-purple-400 flex items-center justify-between">
                  <span>{selectedStationObj?.currentSessionId || 'SESSION-001'}</span>
                  <Lock className="w-3.5 h-3.5 text-gray-600" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-cyber text-gray-400 block mb-1 uppercase">Leader Name (Auto)</label>
                <div className="px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs font-sans font-bold text-white flex items-center justify-between truncate">
                  <span className="truncate">{selectedStationObj?.customerName || 'None'}</span>
                  <Lock className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                </div>
              </div>
            </div>

            {/* PRODUCT & ORDER SELECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Category</label>
                <select
                  value={sessionForm.category}
                  onChange={(e) => setSessionForm({ ...sessionForm, category: e.target.value, productIndex: 0 })}
                  disabled={runningStations.length === 0}
                  className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="drinks">Cold Drinks</option>
                  <option value="shakes">Thick Shakes</option>
                  <option value="snacks">Snacks & Chips</option>
                  <option value="waffles">Waffles</option>
                  <option value="fries_momos">Fries & Momos</option>
                  <option value="burger_sandwich">Burger & Sandwich</option>
                  {Object.keys(menu || {}).map(k => {
                    const baseKeys = ['drinks', 'shakes', 'snacks', 'waffles', 'fries_momos', 'burger_sandwich'];
                    if (baseKeys.includes(k) || k.includes(' ')) return null;
                    return <option key={k} value={k}>{k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Product</label>
                <select
                  value={sessionForm.productIndex}
                  onChange={(e) => setSessionForm({ ...sessionForm, productIndex: Number(e.target.value) })}
                  disabled={runningStations.length === 0}
                  className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-white outline-none cursor-pointer"
                >
                  {activeSessionProductList.map((prod, idx) => (
                    <option key={idx} value={idx}>{prod.name} (₹{prod.price})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Quantity</label>
                <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-[#0F1219] border border-white/10">
                  <button
                    type="button"
                    disabled={runningStations.length === 0}
                    onClick={() => setSessionForm(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-sm font-bold text-white px-2">{sessionForm.quantity}</span>
                  <button
                    type="button"
                    disabled={runningStations.length === 0}
                    onClick={() => setSessionForm(prev => ({ ...prev, quantity: Math.min(20, prev.quantity + 1) }))}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Estimated Total</label>
                <div className="px-3 py-2 rounded-xl bg-[#0F1219] border border-purple-500/40 text-amber-300 font-mono font-bold text-sm">
                  ₹ {sessionEstimatedTotal}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-xs text-gray-400 font-mono">
                Order will link strictly to {selectedStationObj?.currentSessionId || 'Session ID'} ({sessionForm.stationId || 'Console'})
              </span>

              <button
                type="submit"
                disabled={runningStations.length === 0 || !selectedStationObj}
                className={`px-6 py-2.5 rounded-xl text-xs font-cyber font-bold uppercase tracking-wider transition-all ${
                  runningStations.length === 0 || !selectedStationObj
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)] cursor-pointer'
                }`}
              >
                Add Order
              </button>
            </div>
          </form>
        )}

        {/* MODE 2 FORM: COUNTER WALK-IN ORDER */}
        {activeFormTab === 'COUNTER' && (
          <form onSubmit={handleCounterOrderSubmit} className="space-y-3 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Customer Name (Optional)</label>
                <input
                  type="text"
                  value={counterForm.customerName}
                  onChange={(e) => setCounterForm({ ...counterForm, customerName: e.target.value })}
                  placeholder="Enter name"
                  className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Mobile (Optional)</label>
                <input
                  type="text"
                  value={counterForm.mobile}
                  onChange={(e) => setCounterForm({ ...counterForm, mobile: e.target.value })}
                  placeholder="+91 Mobile"
                  className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Category</label>
                <select
                  value={counterForm.category}
                  onChange={(e) => setCounterForm({ ...counterForm, category: e.target.value, productIndex: 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="drinks">Cold Drinks</option>
                  <option value="shakes">Thick Shakes</option>
                  <option value="snacks">Snacks & Chips</option>
                  <option value="waffles">Waffles</option>
                  <option value="fries_momos">Fries & Momos</option>
                  <option value="burger_sandwich">Burger & Sandwich</option>
                  {Object.keys(menu || {}).map(k => {
                    const baseKeys = ['drinks', 'shakes', 'snacks', 'waffles', 'fries_momos', 'burger_sandwich'];
                    if (baseKeys.includes(k) || k.includes(' ')) return null;
                    return <option key={k} value={k}>{k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Product</label>
                <select
                  value={counterForm.productIndex}
                  onChange={(e) => setCounterForm({ ...counterForm, productIndex: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-white outline-none cursor-pointer"
                >
                  {activeCounterProductList.map((prod, idx) => (
                    <option key={idx} value={idx}>{prod.name} (₹{prod.price})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Quantity</label>
                <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-[#0F1219] border border-white/10">
                  <button
                    type="button"
                    onClick={() => setCounterForm(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-sm font-bold text-white px-2">{counterForm.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setCounterForm(prev => ({ ...prev, quantity: Math.min(20, prev.quantity + 1) }))}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Total Amount</label>
                <div className="px-3 py-2 rounded-xl bg-[#0F1219] border border-emerald-500/40 text-emerald-400 font-mono font-bold text-sm">
                  ₹ {counterEstimatedTotal}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-xs text-gray-400 font-mono">Standalone counter sale record</span>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-cyber font-bold text-white uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer"
              >
                Save Counter Order
              </button>
            </div>
          </form>
        )}
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: 'All Orders' },
              { id: 'SESSION_ORDERS', label: '🎮 Session Orders' },
              { id: 'COUNTER_ORDERS', label: '🛒 Counter Orders' },
              { id: 'Pending', label: 'Pending' },
              { id: 'Collected', label: 'Collected' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-cyber font-bold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-purple-900/80 text-white border border-purple-500 shadow-[0_0_12px_rgba(147,51,234,0.3)]'
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Session ID, Console, Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-white outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* ORDERS TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 font-cyber uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Order ID</th>
                <th className="py-3 px-3">Session ID</th>
                <th className="py-3 px-3">Console / Customer</th>
                <th className="py-3 px-3">Product</th>
                <th className="py-3 px-3">Qty</th>
                <th className="py-3 px-3">Unit Price</th>
                <th className="py-3 px-3">Total</th>
                <th className="py-3 px-3">Time</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-200">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-gray-500 font-mono">
                    No orders recorded matching filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-mono text-purple-300 font-bold">{ord.id}</td>
                    
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        ord.mode === 'SESSION'
                          ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                          : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                      }`}>
                        {ord.sessionId || '-'}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-medium text-white font-sans">
                      {ord.mode === 'SESSION' ? `${ord.stationId || 'Console'} — ${ord.customerName}` : ord.customerName}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <img 
                          src={ord.image} 
                          alt={ord.productName} 
                          className="w-7 h-7 rounded object-contain bg-black/40 border border-white/10 p-0.5" loading="lazy" decoding="async" />
                        <span className="font-bold text-white font-sans">{ord.productName}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-white">{ord.quantity}</td>
                    <td className="py-3 px-3 font-mono text-amber-300">₹ {ord.price}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">₹ {ord.total}</td>
                    <td className="py-3 px-3 font-mono text-gray-400 text-[11px]">{ord.time}</td>

                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-cyber font-bold border ${
                        ord.status === 'Pending'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                          : ord.status === 'Preparing'
                          ? 'bg-blue-950/80 text-blue-300 border-blue-500/50'
                          : ord.status === 'Ready'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                          : 'bg-purple-950/80 text-purple-300 border-purple-500/50'
                      }`}>
                        {ord.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <select
                          value={ord.status}
                          onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                          className="px-2 py-1 rounded-lg bg-[#0F1219] border border-white/10 text-[11px] font-cyber font-bold text-white outline-none cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Ready">Ready</option>
                          <option value="Collected">Collected</option>
                        </select>

                        <button 
                          onClick={() => setSelectedOrder(ord)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                          title="View Receipt"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button 
                          onClick={() => setDeleteModalOrder(ord)}
                          className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 transition-colors cursor-pointer"
                          title="Delete Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-gray-400">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg bg-white/5 disabled:opacity-30 hover:bg-white/10 text-white cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 rounded-lg bg-white/5 disabled:opacity-30 hover:bg-white/10 text-white cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RECEIPT MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm glass-panel bg-[#0C0A1D]/95 border border-purple-500/40 rounded-2xl p-5 relative shadow-[0_0_50px_rgba(147,51,234,0.3)] space-y-4 font-sans text-gray-100">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-cyber text-sm font-bold text-white uppercase tracking-wider">
                Receipt: <span className="text-purple-400">{selectedOrder.id}</span>
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="p-1 rounded-full hover:bg-white/10 text-gray-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Session ID:</span>
                <span className="text-purple-300 font-mono font-bold">{selectedOrder.sessionId || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Console / Customer:</span>
                <span className="text-white font-bold">{selectedOrder.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Product:</span>
                <span className="text-white font-bold">{selectedOrder.productName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Quantity:</span>
                <span className="text-white font-mono">{selectedOrder.quantity}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Unit Price:</span>
                <span className="text-amber-300 font-mono">₹ {selectedOrder.price}</span>
              </div>
              <div className="flex justify-between py-1.5 text-sm font-bold bg-white/5 px-2 rounded-lg mt-2">
                <span className="text-gray-300">Total Billed:</span>
                <span className="text-emerald-400 font-mono">₹ {selectedOrder.total}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button 
                onClick={() => window.print()} 
                className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-cyber font-bold text-white uppercase flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-sans text-gray-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm glass-panel bg-[#0C0A1D]/95 border border-red-500/40 rounded-2xl p-5 relative shadow-[0_0_50px_rgba(239,68,68,0.35)] space-y-4 font-sans text-gray-100">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-cyber text-sm font-bold text-red-400 uppercase tracking-wider">
                Delete this cafe order?
              </h3>
              <button 
                onClick={() => setDeleteModalOrder(null)} 
                disabled={isDeleting}
                className="p-1 rounded-full hover:bg-white/10 text-gray-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-gray-300">
              <p className="font-medium text-gray-200">
                This order will be removed from the active session.
              </p>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-400">Order ID:</span>
                  <span className="text-purple-300 font-bold">{deleteModalOrder.orderId || deleteModalOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Item:</span>
                  <span className="text-white font-bold">{deleteModalOrder.productName} × {deleteModalOrder.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Amount:</span>
                  <span className="text-emerald-400 font-bold">₹ {deleteModalOrder.total}</span>
                </div>
                {deleteModalOrder.sessionId && deleteModalOrder.sessionId !== '-' && (
                  <div className="flex justify-between text-amber-300">
                    <span>Attached Session:</span>
                    <span>{deleteModalOrder.sessionId}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModalOrder(null)}
                className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-cyber font-bold text-gray-300 uppercase transition-all cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleConfirmDeleteOrder(deleteModalOrder)}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-xs font-cyber font-bold text-white uppercase shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>DELETE</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
