import React, { useState, useEffect } from 'react';
import { cafeArchiveService } from '../../../services/cafeArchiveService';
import { MobileCard, MobileCardList, MobileCardRow, MobileCardActions, MobileCardEmpty } from '../shared/MobileCard';
import { cafeOrderService } from '../../../services/cafeOrderService';
import { 
  UtensilsCrossed, 
  DollarSign, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  TrendingUp, 
  Calendar, 
  Search, 
  Eye, 
  FileSpreadsheet, 
  Printer, 
  X,
  Award,
  BarChart3,
  Sparkles,
  PieChart
} from 'lucide-react';

export default function CafeReportsSection() {
  const [filterType, setFilterType] = useState('TODAY'); // 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_YEAR' | 'CUSTOM'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [todayOrders, setTodayOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [viewingArchive, setViewingArchive] = useState(null);
  const [productSearch, setProductSearch] = useState('');

  const loadData = async () => {
    try {
      const orders = await cafeOrderService.getOrders();
      setTodayOrders(orders || []);

      const data = await cafeArchiveService.getAnalyticsSummary(filterType, orders || [], customStart, customEnd);
      setAnalytics(data);
    } catch (e) {
      console.error('Error loading CafeReportsSection data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterType, customStart, customEnd]);

  useEffect(() => {
    const handleUpdate = () => {
      loadData();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('gforce_order_updated', handleUpdate);
      window.addEventListener('gforce_dashboard_updated', handleUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('gforce_order_updated', handleUpdate);
        window.removeEventListener('gforce_dashboard_updated', handleUpdate);
      }
    };
  }, []);

  if (!analytics) {
    return (
      <div className="p-8 text-center text-gray-400 font-cyber">
        Loading Café Orders Archive & Analytics...
      </div>
    );
  }

  const filteredProducts = (analytics.productList || []).filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-4 font-sans text-gray-100 min-h-0 flex-1 flex flex-col">
      
      {/* 1. HEADER & FILTER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 glass-panel p-3.5 rounded-2xl border border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-cyber text-sm xl:text-base font-bold text-white uppercase tracking-wider">
              ☕ Gaming Café Orders Archive & Analytics
            </h3>
            <p className="text-[11px] text-gray-400">Enterprise POS Daily Rollover, Permanently Saved Order History & Product Intelligence</p>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#090C19] p-1.5 rounded-xl border border-white/10">
          {[
            { id: 'TODAY', label: 'Today' },
            { id: 'YESTERDAY', label: 'Yesterday' },
            { id: 'THIS_WEEK', label: 'This Week' },
            { id: 'THIS_MONTH', label: 'This Month' },
            { id: 'THIS_YEAR', label: 'This Year' },
            { id: 'CUSTOM', label: 'Custom Date' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1 rounded-lg text-xs font-cyber font-bold transition-all cursor-pointer ${
                filterType === f.id
                  ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.4)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {filterType === 'CUSTOM' && (
        <div className="flex items-center gap-3 glass-panel p-3 rounded-xl border border-purple-500/30 text-xs font-cyber shrink-0">
          <span className="text-gray-400 uppercase">From:</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="bg-[#0F1219] border border-white/10 rounded-lg px-2.5 py-1 text-white outline-none focus:border-purple-500"
          />
          <span className="text-gray-400 uppercase">To:</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="bg-[#0F1219] border border-white/10 rounded-lg px-2.5 py-1 text-white outline-none focus:border-purple-500"
          />
        </div>
      )}

      {/* 2. CONSOLIDATED SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        
        {/* Total Cafe Revenue */}
        <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 flex flex-col justify-between shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-cyber uppercase text-emerald-400 tracking-wider">Total Café Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-cyber font-black text-emerald-400 mt-2">
            ₹ {(analytics.aggregateRevenue || 0).toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mt-2 pt-2 border-t border-white/5">
            <span>Cash: <strong className="text-emerald-300">₹{analytics.aggregateCash}</strong></span>
            <span>UPI: <strong className="text-cyan-300">₹{analytics.aggregateUpi}</strong></span>
          </div>
        </div>

        {/* Total Orders Breakdown */}
        <div className="glass-panel p-4 rounded-2xl border border-purple-500/30 bg-purple-950/10 flex flex-col justify-between shadow-[0_0_15px_rgba(147,51,234,0.1)]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-cyber uppercase text-purple-300 tracking-wider">Total Orders</span>
            <div className="w-7 h-7 rounded-lg bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-cyber font-black text-purple-300 mt-2">
            {analytics.aggregateOrders} <span className="text-xs font-sans font-normal text-gray-400">Orders</span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mt-2 pt-2 border-t border-white/5">
            <span>Completed: <strong className="text-emerald-400">{analytics.aggregateCompleted}</strong></span>
            <span>Pending: <strong className="text-amber-400">{analytics.aggregatePending}</strong></span>
            <span>Cancelled: <strong className="text-red-400">{analytics.aggregateCancelled}</strong></span>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="glass-panel p-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/10 flex flex-col justify-between shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-cyber uppercase text-cyan-300 tracking-wider">Average Order Value</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-cyber font-black text-cyan-300 mt-2">
            ₹ {(analytics.averageOrderValue || 0).toLocaleString()}
          </div>
          <p className="text-[10px] font-mono text-cyan-400/80 mt-2 pt-2 border-t border-white/5">
            Avg bill per completed customer order
          </p>
        </div>

        {/* Best Selling Product */}
        <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-amber-950/10 flex flex-col justify-between shadow-[0_0_15px_rgba(245,158,11,0.1)]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-cyber uppercase text-amber-300 tracking-wider">Top Performing Item</span>
            <div className="w-7 h-7 rounded-lg bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-cyber font-extrabold text-amber-300 truncate mt-2">
            {analytics.bestSellingProduct}
          </div>
          <p className="text-[10px] font-mono text-gray-400 mt-2 pt-2 border-t border-white/5">
            Least Selling: <span className="text-red-300">{analytics.leastSellingProduct}</span>
          </p>
        </div>

      </div>

      {/* 3. MAIN CONTENT GRID: DAILY ARCHIVE LOGS & PRODUCT SALES RANKINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0 flex-1">
        
        {/* LEFT 2 COLUMNS: DAILY ARCHIVES TABLE */}
        <div className="lg:col-span-2 glass-panel p-4 rounded-2xl border border-white/10 flex flex-col min-h-0 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5 shrink-0">
            <h4 className="font-cyber text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" /> Daily Cafe Archive Reports Log
            </h4>
            <span className="text-xs text-gray-400 font-mono">
              Permanently Saved: {(analytics.allHistoricalArchives || analytics.dailyArchives)?.length || 0} Days
            </span>
          </div>

          {/* Mobile card list — the sub-md stand-in for the archive table */}
          <div className="md:hidden flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {((analytics.allHistoricalArchives || analytics.dailyArchives)?.length === 0) ? (
              <MobileCardEmpty icon={Calendar}>No cafe archive logs found.</MobileCardEmpty>
            ) : (
              <MobileCardList>
                {(analytics.allHistoricalArchives || analytics.dailyArchives)?.map(arch => (
                  <MobileCard
                    key={arch.id}
                    title={arch.dateStr}
                    badge={arch.isToday ? (
                      <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">LIVE</span>
                    ) : null}
                    footer={
                      <MobileCardActions>
                        <button
                          onClick={() => setViewingArchive(arch)}
                          className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 text-purple-300 hover:text-white text-[10px] font-cyber font-bold border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Orders
                        </button>
                      </MobileCardActions>
                    }
                  >
                    <MobileCardRow label="Revenue" value={`₹ ${arch.totalRevenue?.toLocaleString()}`} className="font-mono text-emerald-400 font-bold" />
                    <MobileCardRow label="Orders" value={arch.totalOrders} className="font-mono text-purple-300" />
                    <MobileCardRow label="Completed" value={arch.completedOrders} className="font-mono text-emerald-300" />
                    <MobileCardRow label="Cash / UPI" value={`₹${arch.cashRevenue || 0} / ₹${arch.upiRevenue || 0}`} className="font-mono text-gray-300" />
                    <MobileCardRow label="Avg Bill" value={`₹ ${arch.averageOrderValue || 0}`} className="font-mono text-cyan-300" />
                  </MobileCard>
                ))}
              </MobileCardList>
            )}
          </div>

          <div className="hidden md:block flex-1 min-h-0 overflow-y-auto custom-scrollbar border border-white/5 rounded-xl">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead className="sticky top-0 bg-[#090C1B] text-[10px] font-cyber uppercase tracking-wider text-gray-400 border-b border-white/10 z-10">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Total Revenue</th>
                  <th className="py-2.5 px-3">Orders</th>
                  <th className="py-2.5 px-3">Completed</th>
                  <th className="py-2.5 px-3">Cash / UPI</th>
                  <th className="py-2.5 px-3">Avg Bill</th>
                  <th className="py-2.5 px-3 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {((analytics.allHistoricalArchives || analytics.dailyArchives)?.length === 0) ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-500 font-cyber">
                      No cafe archive logs found.
                    </td>
                  </tr>
                ) : (
                  (analytics.allHistoricalArchives || analytics.dailyArchives)?.map(arch => (
                    <tr key={arch.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-white">
                        {arch.dateStr}
                        {arch.isToday && (
                          <span className="ml-1.5 text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            LIVE
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">
                        ₹ {arch.totalRevenue?.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-purple-300">{arch.totalOrders}</td>
                      <td className="py-2.5 px-3 text-emerald-300">{arch.completedOrders}</td>
                      <td className="py-2.5 px-3 text-gray-300">
                        ₹{arch.cashRevenue || 0} / ₹{arch.upiRevenue || 0}
                      </td>
                      <td className="py-2.5 px-3 text-cyan-300">₹ {arch.averageOrderValue || 0}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setViewingArchive(arch)}
                          className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-purple-300 hover:text-white text-[10px] font-cyber font-bold border border-white/10 transition-all cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3 h-3" /> Orders
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT 1 COLUMN: PRODUCT SALES RANKING ANALYTICS */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col min-h-0 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5 shrink-0">
            <h4 className="font-cyber text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-pink-400" /> Product Sales Ranking
            </h4>
          </div>

          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search product..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#0F1219] border border-white/10 text-xs text-white outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {filteredProducts.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-xs font-cyber">
                No product analytics recorded yet.
              </div>
            ) : (
              filteredProducts.map((prod, idx) => (
                <div 
                  key={prod.name}
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5 flex items-center justify-between text-xs hover:border-purple-500/30 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-purple-950 text-purple-300 font-cyber font-bold text-[10px] flex items-center justify-center border border-purple-500/30 shrink-0">
                      #{idx + 1}
                    </span>
                    <div>
                      <h5 className="font-cyber font-bold text-white text-xs">{prod.name}</h5>
                      <span className="text-[10px] text-gray-400 font-mono">{prod.category}</span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-emerald-400 font-bold">₹ {prod.revenue?.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400">{prod.unitsSold} units sold</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* DETAILED ARCHIVED ORDERS AUDIT MODAL */}
      {viewingArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-4xl glass-panel p-5 rounded-2xl border border-purple-500/40 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div>
                <h3 className="font-cyber font-bold text-white text-base flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-purple-400" />
                  Archived Orders Audit Log — {viewingArchive.dateStr}
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  Total Orders: {viewingArchive.ordersList?.length || 0} | Total Revenue: ₹{viewingArchive.totalRevenue?.toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => setViewingArchive(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile card list — the sub-md stand-in for the audit table */}
            <div className="md:hidden flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              <MobileCardList>
                {viewingArchive.ordersList?.map((ord, i) => (
                  <MobileCard
                    key={i}
                    title={ord.productName}
                    subtitle={ord.orderId}
                    accent="amber"
                    badge={
                      <span className={`px-2 py-0.5 rounded text-[10px] font-cyber font-bold uppercase ${
                        ord.status === 'Collected' || ord.status === 'Completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                      }`}>
                        {ord.status}
                      </span>
                    }
                  >
                    <MobileCardRow label="Mode" value={`${ord.mode} (${ord.stationId})`} className="font-mono text-gray-300" />
                    <MobileCardRow label="Customer" value={ord.customerName} className="text-white" />
                    <MobileCardRow label="Qty x Unit" value={`${ord.quantity} × ₹${ord.unitPrice}`} className="font-mono text-gray-300" />
                    <MobileCardRow label="Total" value={`₹ ${ord.totalAmount}`} className="font-mono text-emerald-400 font-bold" />
                    <MobileCardRow label="Payment" value={ord.paymentMethod} className="font-mono text-cyan-300" />
                  </MobileCard>
                ))}
              </MobileCardList>
            </div>

            <div className="hidden md:block flex-1 min-h-0 overflow-y-auto custom-scrollbar border border-white/10 rounded-xl">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead className="sticky top-0 bg-[#090C1B] text-[10px] font-cyber uppercase tracking-wider text-gray-400 border-b border-white/10">
                  <tr>
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Mode & Station</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Qty & Unit Price</th>
                    <th className="py-2.5 px-3">Total Amount</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {viewingArchive.ordersList?.map((ord, i) => (
                    <tr key={i} className="hover:bg-white/5">
                      <td className="py-2.5 px-3 font-bold text-purple-300">{ord.orderId}</td>
                      <td className="py-2.5 px-3 text-gray-300">{ord.mode} ({ord.stationId})</td>
                      <td className="py-2.5 px-3 text-white font-sans">{ord.customerName}</td>
                      <td className="py-2.5 px-3 text-amber-300 font-sans font-bold">{ord.productName}</td>
                      <td className="py-2.5 px-3 text-gray-300">{ord.quantity} × ₹{ord.unitPrice}</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">₹ {ord.totalAmount}</td>
                      <td className="py-2.5 px-3 text-cyan-300">{ord.paymentMethod}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-cyber font-bold uppercase ${
                          ord.status === 'Collected' || ord.status === 'Completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10 shrink-0">
              <button
                onClick={() => setViewingArchive(null)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-cyber text-xs font-bold uppercase tracking-wider"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
