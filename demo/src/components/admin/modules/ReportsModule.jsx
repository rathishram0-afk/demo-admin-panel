import React, { useState, useEffect } from 'react';
import { sessionService } from '../../../services/sessionService';
import { adminDataService } from '../../../services/adminDataService';
import { useRealtime } from '../../../context/RealtimeContext';
import CafeReportsSection from './CafeReportsSection';
import { MobileCard, MobileCardList, MobileCardRow, MobileCardActions, MobileCardEmpty } from '../shared/MobileCard';
import { 
  BarChart3, 
  Download, 
  DollarSign, 
  Calendar, 
  Users, 
  TrendingUp, 
  Printer, 
  Check, 
  Monitor, 
  Clock, 
  PieChart, 
  Zap, 
  Tv, 
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Search,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

export default function ReportsModule({ subTab = 'DAILY', setSubTab }) {
  const { activeSessions: realtimeSessions, cafeOrders: realtimeCafeOrders } = useRealtime();

  const getBusinessDate = (dateObj) => {
    return sessionService.getBusinessDate(dateObj);
  };

  const isSameDate = (timestampStr, compareDate) => {
    if (!timestampStr) return false;
    return sessionService.getBusinessDate(timestampStr) === sessionService.getBusinessDate(compareDate || new Date());
  };

  // Navigation & Notifications State
  const [exportNotice, setExportNotice] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Live Reset Countdown State
  const [resetCountdown, setResetCountdown] = useState('00:00:00');

  // Master historical reports array & live sessions data
  const [historicalReports, setHistoricalReports] = useState([]);
  const [liveStations, setLiveStations] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [cafeOrders, setCafeOrders] = useState([]);
  const [operationalDate, setOperationalDate] = useState('');
  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    runningSessions: 0,
    availableDevices: 0,
    totalPlayers: 0,
    controllersInUse: 0,
    totalControllers: 20,
    availableControllers: 20,
    todaySessions: 0,
    completedSessions: 0,
    onlineBookings: 0,
    activeMemberships: 0
  });

  // Detailed Modal View State
  const [viewingReport, setViewingReport] = useState(null);

  // Search & Filter state
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [filterPayment, setFilterPayment] = useState('All');
  const [filterDevice, setFilterDevice] = useState('All');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Initial Reports Loader
  const getOrInitializeHistoricalReports = () => {
    if (!localStorage.getItem('prod_wiped_v1')) {
      localStorage.removeItem('gforce_historical_reports_prod');
      localStorage.removeItem('gforce_operational_date');
      localStorage.setItem('prod_wiped_v1', 'true');
    }
    
    let reports = localStorage.getItem('gforce_historical_reports_prod');
    if (!reports) {
      localStorage.setItem('gforce_historical_reports_prod', JSON.stringify([]));
      return [];
    }
    return JSON.parse(reports);
  };

  // Helper date formatter
  function formatDateString(dateStr) {
    if (!dateStr) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = parseInt(parts[2], 10);
      const m = months[parseInt(parts[1], 10) - 1];
      const y = parts[0];
      return `${d} ${m} ${y}`;
    }
    return dateStr;
  }

  // Ticking Clock & Countdown strictly to next 12:00 PM NOON IST (12:00:00)
  useEffect(() => {
    const clockTimer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Reset countdown strictly to next 12:00 PM NOON IST
      // In Asia/Kolkata timezone:
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const parts = formatter.formatToParts(now);
      let y, m, d, h = 0;
      parts.forEach(p => {
        if (p.type === 'year') y = parseInt(p.value, 10);
        if (p.type === 'month') m = parseInt(p.value, 10);
        if (p.type === 'day') d = parseInt(p.value, 10);
        if (p.type === 'hour') h = parseInt(p.value, 10);
      });

      // 12:00 PM NOON IST is 06:30:00 UTC on the target day
      let targetY = y;
      let targetM = m;
      let targetD = d;
      if (h >= 12) {
        const nextCal = new Date(Date.UTC(y, m - 1, d + 1));
        targetY = nextCal.getUTCFullYear();
        targetM = nextCal.getUTCMonth() + 1;
        targetD = nextCal.getUTCDate();
      }
      const targetNoonIST = new Date(Date.UTC(targetY, targetM - 1, targetD, 6, 30, 0, 0));
      const diffMs = Math.max(0, targetNoonIST.getTime() - now.getTime());

      const totalSecs = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;
      setResetCountdown(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(clockTimer);
  }, []);

  // Main Daily Reset Check & Data Load Sync
  const loadDataAndCheckReset = async () => {
    try {
      await sessionService.checkAndPerformDailyAutoReset();
    } catch (e) {
      console.error('Error in daily report auto-reset check:', e);
    }

    let dbWalkins = [];
    let dbCafeOrders = [];
    try {
      dbWalkins = await sessionService.getWalkInHistory() || [];
      const { cafeOrderService } = await import('../../../services/cafeOrderService');
      dbCafeOrders = await cafeOrderService.getOrders() || [];
      const dMetrics = await sessionService.getDashboardMetrics(true);
      setMetrics(dMetrics);
    } catch (e) {
      console.error('Error fetching database records in ReportsModule load:', e);
    }

    setActiveSessions(dbWalkins);
    setCafeOrders(dbCafeOrders);

    const now = new Date();
    const currentBizDate = sessionService.getOperationalBusinessDate(now);
    setOperationalDate(currentBizDate);

    // Load historical & live database records directly from production Supabase database
    try {
      const hist = await sessionService.getHistoricalReports();
      setHistoricalReports(hist || []);
    } catch (hErr) {
      console.error('Error fetching production historical reports:', hErr);
      const histFallback = getOrInitializeHistoricalReports();
      setHistoricalReports(histFallback || []);
    }

    const stations = await sessionService.getStations();
    setLiveStations(stations || []);
  };

  useEffect(() => {
    loadDataAndCheckReset();

    const handleReportsUpdate = () => {
      loadDataAndCheckReset();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('gforce_dashboard_updated', handleReportsUpdate);
      window.addEventListener('gforce_session_changed', handleReportsUpdate);
      window.addEventListener('gforce_order_updated', handleReportsUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('gforce_dashboard_updated', handleReportsUpdate);
        window.removeEventListener('gforce_session_changed', handleReportsUpdate);
        window.removeEventListener('gforce_order_updated', handleReportsUpdate);
      }
    };
  }, [realtimeSessions, realtimeCafeOrders]);

  // Reset All ERP/POS Data Functionality
  const handleResetAllData = async () => {
    const isConfirmed = window.confirm(
      "Reset Entire ERP?\n\nThis will permanently remove all demo reports, revenue, analytics, history and statistics.\n\nThe system will be ready for the client's first business day."
    );

    if (isConfirmed) {
      try {
        await adminDataService.resetAllData();
        
        // Sync UI
        await loadDataAndCheckReset();
        
        // Broadcast events to ensure all interconnected modules instantly refresh without a page reload
        window.dispatchEvent(new CustomEvent('gforce_dashboard_updated'));
        window.dispatchEvent(new CustomEvent('gforce_session_changed'));
        window.dispatchEvent(new CustomEvent('gforce_order_updated'));
        window.dispatchEvent(new CustomEvent('gforce_booking_updated'));
        window.dispatchEvent(new CustomEvent('gforce_data_reset')); // General hook for future use
        
        alert(
          "ERP Successfully Initialized\n\nAll transactional data has been removed.\n\nThe system is now ready for the client's first business day."
        );
      } catch (error) {
        console.error("Reset failed:", error);
        alert(`Failed to reset ERP data: ${error.message}`);
      }
    }
  };

  // Compute live real-time Today metrics
  const todayCompleted = activeSessions.filter(s => 
    s.sessionStatus === 'COMPLETED' && 
    isSameDate(s.rawEndTime || s.rawStartTime, operationalDate)
  );
  const todayCafeCompleted = cafeOrders.filter(o => 
    (String(o.status || '').toLowerCase() === 'completed' || String(o.status || '').toLowerCase() === 'collected') && 
    isSameDate(o.created_at || o.time, operationalDate) &&
    String(o.mode || '').toUpperCase() !== 'SESSION' &&
    String(o.sessionId || o.session_id || '-').trim() === '-'
  );
  const todayCafeRevenue = todayCafeCompleted.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const todayRevenue = metrics?.todayRevenue || 0;
  const todaySessionsCount = todayCompleted.length;
  const todayPlayersCount = todayCompleted.reduce((sum, s) => sum + (Number(s.players) || 0), 0);
  const todayAvgDuration = todaySessionsCount > 0 ? 58 : 0;
  const todayPeakHour = sessionService.calculatePeakHour(todayCompleted);
  const todayMostUsed = sessionService.calculateMostUsedDevice(todayCompleted);

  // Calculate live Controller In Use
  let controllersInUse = 0;
  liveStations.forEach(s => {
    const isPS = s.id.startsWith('PS');
    if (isPS && (s.status === 'RUNNING' || s.status === 'ACTIVE' || s.status === 'ENDING_SOON')) {
      controllersInUse += (s.controllersUsed || 0);
    }
  });

  // Total reports count
  const totalReportsCount = historicalReports.length;

  // Master date parsing for filter comparison
  const parsedReportsMap = new Map();

  // Populate from historicalReports fetched directly from Supabase + local storage
  (historicalReports || []).forEach(r => {
    if (r && r.rawDate) {
      parsedReportsMap.set(r.rawDate, r);
    }
  });

  // Prepend or merge Today's live running transactions for active operational business date
  if (operationalDate) {
    const existing = parsedReportsMap.get(operationalDate) || {};
    const effectiveRevenue = existing.revenue !== undefined ? existing.revenue : todayRevenue;
    const todayPaymentBreakdown = existing.paymentBreakdown || metrics?.paymentBreakdown || {
      Cash: effectiveRevenue,
      UPI: 0,
      'Debit Card': 0
    };

    parsedReportsMap.set(operationalDate, {
      ...existing,
      id: `rep_${operationalDate}`,
      rawDate: operationalDate,
      dateStr: formatDateString(operationalDate) + ' (Today)',
      isToday: true,
      revenue: effectiveRevenue,
      sessionRevenue: existing.sessionRevenue !== undefined ? existing.sessionRevenue : (metrics?.sessionRevenue || 0),
      cafeSales: existing.cafeSales !== undefined ? existing.cafeSales : (metrics?.cafeRevenue || 0),
      completedSessions: existing.completedSessions !== undefined ? existing.completedSessions : todaySessionsCount,
      players: existing.players !== undefined ? existing.players : todayPlayersCount,
      avgSessionMins: existing.avgSessionMins || todayAvgDuration || 0,
      peakHour: existing.peakHour || todayPeakHour || '--',
      mostUsedDevice: existing.mostUsedDevice || todayMostUsed || '--',
      paymentBreakdown: todayPaymentBreakdown,
      sessions: (existing.sessions && existing.sessions.length > 0) ? existing.sessions : todayCompleted
    });
  }

  // Convert map to sorted array in descending order by business date
  const parsedReports = Array.from(parsedReportsMap.values()).sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

  // Dynamic Weekly Rollup aggregation
  const weeklyReports = (() => {
    if (!parsedReports || parsedReports.length === 0) return [];

    // Find the earliest actual business date in the report dataset
    const earliestDateStr = parsedReports.reduce((earliest, r) => {
      if (!r.rawDate) return earliest;
      if (!earliest || r.rawDate < earliest) return r.rawDate;
      return earliest;
    }, null);

    const weeks = {};
    parsedReports.forEach(r => {
      if (!r.rawDate) return;
      const parts = r.rawDate.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);

      const dateObj = new Date(y, m, d);
      const dayOfWeek = dateObj.getDay();
      const diffToMonday = d - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);

      const mondayObj = new Date(y, m, diffToMonday);
      const pad = n => String(n).padStart(2, '0');
      const mondayStr = `${mondayObj.getFullYear()}-${pad(mondayObj.getMonth() + 1)}-${pad(mondayObj.getDate())}`;

      const sundayObj = new Date(mondayObj);
      sundayObj.setDate(mondayObj.getDate() + 6);
      const sundayStr = `${sundayObj.getFullYear()}-${pad(sundayObj.getMonth() + 1)}-${pad(sundayObj.getDate())}`;

      // Clamp the week start date so it never goes before the earliest available business date
      const effectiveStartStr = (earliestDateStr && mondayStr < earliestDateStr) ? earliestDateStr : mondayStr;
      const weekKey = mondayStr;

      if (!weeks[weekKey]) {
        weeks[weekKey] = {
          weekKey,
          startStr: formatDateString(effectiveStartStr),
          endStr: formatDateString(sundayStr),
          revenue: 0,
          sessions: 0,
          players: 0,
          dailyRevenues: [],
          devices: {},
          rawReports: []
        };
      }

      weeks[weekKey].revenue += (r.revenue || 0);
      weeks[weekKey].sessions += (r.completedSessions || 0);
      weeks[weekKey].players += (r.players || 0);
      weeks[weekKey].dailyRevenues.push({ date: r.dateStr, revenue: r.revenue || 0 });
      if (r.mostUsedDevice) {
        weeks[weekKey].devices[r.mostUsedDevice] = (weeks[weekKey].devices[r.mostUsedDevice] || 0) + (r.completedSessions || 1);
      }
      weeks[weekKey].rawReports.push(r);
    });

    return Object.values(weeks).map(w => {
      const avgDaily = w.rawReports.length > 0 ? Math.round(w.revenue / w.rawReports.length) : 0;
      let peakDay = 'N/A';
      let maxRev = -1;
      w.dailyRevenues.forEach(dr => {
        if (dr.revenue > maxRev) {
          maxRev = dr.revenue;
          peakDay = `${dr.date.replace(' (Today)', '')} (₹${dr.revenue.toLocaleString()})`;
        }
      });
      let mostUsed = '--';
      let maxCount = 0;
      Object.entries(w.devices).forEach(([k, v]) => {
        if (v > maxCount && k && k !== '--') {
          maxCount = v;
          mostUsed = k;
        }
      });

      return {
        id: `week_${w.weekKey}`,
        weekRange: `${w.startStr} - ${w.endStr}`,
        revenue: w.revenue,
        totalSessions: w.sessions,
        totalPlayers: w.players,
        avgDailyRevenue: avgDaily,
        peakDay,
        mostUsedDevice: mostUsed,
        rawReports: w.rawReports
      };
    }).sort((a, b) => b.id.localeCompare(a.id));
  })();

  // Dynamic Monthly Rollup aggregation
  const monthlyReports = (() => {
    const months = {};
    parsedReports.forEach(r => {
      if (!r.rawDate) return;
      const parts = r.rawDate.split('-');
      const monthKey = `${parts[0]}-${parts[1]}`;

      if (!months[monthKey]) {
        const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
        const monthName = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        months[monthKey] = {
          monthKey,
          monthName,
          revenue: 0,
          sessions: 0,
          players: 0,
          dailyRevenues: [],
          devices: {},
          rawReports: []
        };
      }

      months[monthKey].revenue += r.revenue;
      months[monthKey].sessions += r.completedSessions;
      months[monthKey].players += r.players;
      months[monthKey].dailyRevenues.push({ date: r.dateStr, revenue: r.revenue });
      months[monthKey].devices[r.mostUsedDevice] = (months[monthKey].devices[r.mostUsedDevice] || 0) + r.completedSessions;
      months[monthKey].rawReports.push(r);
    });

    return Object.values(months).map(m => {
      const avgDaily = m.rawReports.length > 0 ? Math.round(m.revenue / m.rawReports.length) : 0;
      let highestDay = 'N/A';
      let lowestDay = 'N/A';
      let maxRev = -1;
      let minRev = Infinity;

      m.dailyRevenues.forEach(dr => {
        if (dr.revenue > maxRev) {
          maxRev = dr.revenue;
          highestDay = `${dr.date.replace(' (Today)', '')} (₹${dr.revenue})`;
        }
        if (dr.revenue < minRev && dr.revenue > 0) {
          minRev = dr.revenue;
          lowestDay = `${dr.date.replace(' (Today)', '')} (₹${dr.revenue})`;
        }
      });
      if (lowestDay === 'N/A' && m.dailyRevenues.length > 0) {
        lowestDay = `${m.dailyRevenues[m.dailyRevenues.length - 1].date.replace(' (Today)', '')} (₹${m.dailyRevenues[m.dailyRevenues.length - 1].revenue})`;
      }

      let mostUsed = '--';
      let maxCount = 0;
      Object.entries(m.devices).forEach(([k, v]) => {
        if (v > maxCount && k && k !== '--') {
          maxCount = v;
          mostUsed = k;
        }
      });

      return {
        id: `month_${m.monthKey}`,
        monthName: m.monthName,
        revenue: m.revenue,
        totalSessions: m.sessions,
        totalPlayers: m.players,
        avgDailyRevenue: avgDaily,
        highestDay,
        lowestDay,
        mostUsedDevice: mostUsed,
        rawReports: m.rawReports
      };
    });
  })();

  // Dynamic Yearly Rollup aggregation
  const yearlyReports = (() => {
    const years = {};
    parsedReports.forEach(r => {
      if (!r.rawDate) return;
      const year = r.rawDate.split('-')[0];

      if (!years[year]) {
        years[year] = {
          year,
          revenue: 0,
          sessions: 0,
          players: 0,
          rawReports: []
        };
      }

      years[year].revenue += r.revenue;
      years[year].sessions += r.completedSessions;
      years[year].players += r.players;
      years[year].rawReports.push(r);
    });

    return Object.values(years).map(y => ({
      id: `year_${y.year}`,
      year: y.year,
      revenue: y.revenue,
      totalSessions: y.sessions,
      totalPlayers: y.players,
      avgDailyRevenue: y.rawReports.length > 0 ? Math.round(y.revenue / y.rawReports.length) : 0,
      rawReports: y.rawReports
    }));
  })();

  // Multi-parameter filter search logic (Daily tab)
  const filteredDailyReports = parsedReports.filter(r => {
    if (filterStartDate && r.rawDate < filterStartDate) return false;
    if (filterEndDate && r.rawDate > filterEndDate) return false;
    if (filterMonth !== 'All' && r.rawDate.split('-')[1] !== filterMonth) return false;
    if (filterYear !== 'All' && r.rawDate.split('-')[0] !== filterYear) return false;
    if (filterPayment !== 'All') {
      if (filterPayment === 'Cash' && (r.paymentBreakdown?.Cash || 0) === 0) return false;
      if (filterPayment === 'UPI' && (r.paymentBreakdown?.UPI || 0) === 0) return false;
      if (filterPayment === 'Credit Card' && (r.paymentBreakdown?.['Credit Card'] || 0) === 0) return false;
      if (filterPayment === 'Debit Card' && (r.paymentBreakdown?.['Debit Card'] || 0) === 0) return false;
    }
    if (filterDevice !== 'All' && r.mostUsedDevice !== filterDevice) return false;

    return true;
  });

  // Pagination bounds
  const totalEntries = filteredDailyReports.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;
  const paginatedDaily = filteredDailyReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleResetFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterMonth('All');
    setFilterYear('All');
    setFilterPayment('All');
    setFilterDevice('All');
    setCurrentPage(1);
  };

  // Actions PDF & CSV exports
  const handleExportPDF = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (filteredDailyReports.length === 0) {
      alert("No reports available to export.");
      return;
    }
    const headers = "Date,Revenue,Completed Sessions,Players,Avg Duration,Peak Hour,Most Used Device,Cash Payment,UPI Payment,Credit Card Payment,Debit Card Payment\n";
    const rows = filteredDailyReports.map(r => 
      `"${r.dateStr}",${r.revenue},${r.completedSessions},${r.players},"${r.avgSessionMins} mins","${r.peakHour}","${r.mostUsedDevice}",${r.paymentBreakdown?.Cash || 0},${r.paymentBreakdown?.UPI || 0},${r.paymentBreakdown?.['Credit Card'] || 0},${r.paymentBreakdown?.['Debit Card'] || 0}`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `G-FORCE_ERP_Financial_Report_${operationalDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  // Single report CSV export
  const exportSingleReportCSV = (rep) => {
    const headers = "Session ID,Leader Name,Device Assigned,Duration,Revenue,Payment Method,Start Time,End Time\n";
    const details = rep.sessions || [];
    const rows = details.map(s => 
      `"${s.id}","${s.leaderName}","${s.device}","${s.duration}",${s.totalAmount},"${s.paymentMethod}","${s.startTime}","${s.endTime || '-'}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Report_Details_${rep.dateStr.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderDailyActions = (r) => (
    <>
      <button
        onClick={() => setViewingReport(r)}
        className="px-2 py-1.5 sm:py-1 rounded bg-purple-950/60 border border-purple-500/30 hover:border-purple-400 text-[10px] font-bold text-purple-300 flex items-center justify-center gap-0.5 cursor-pointer"
      >
        <Eye className="w-2.5 h-2.5" /> View
      </button>
      <button
        onClick={handleExportPDF}
        className="px-2 py-1.5 sm:py-1 rounded bg-red-950/60 border border-red-500/30 hover:border-red-400 text-[10px] font-bold text-red-300 flex items-center justify-center gap-0.5 cursor-pointer"
      >
        <Printer className="w-2.5 h-2.5" /> PDF
      </button>
      <button
        onClick={() => exportSingleReportCSV(r)}
        className="px-2 py-1.5 sm:py-1 rounded bg-emerald-950/60 border border-emerald-500/30 hover:border-emerald-400 text-[10px] font-bold text-emerald-300 flex items-center justify-center gap-0.5 cursor-pointer"
      >
        <FileSpreadsheet className="w-2.5 h-2.5" /> CSV
      </button>
    </>
  );

  const paymentSummary = (r) =>
    `Cash: ₹${(r.paymentBreakdown?.Cash || 0).toLocaleString()} / UPI: ₹${(r.paymentBreakdown?.UPI || 0).toLocaleString()}` +
    (r.paymentBreakdown?.['Credit Card'] ? ` / CC: ₹${r.paymentBreakdown['Credit Card'].toLocaleString()}` : '') +
    (r.paymentBreakdown?.['Debit Card'] ? ` / DC: ₹${r.paymentBreakdown['Debit Card'].toLocaleString()}` : '');

  return (
    <div className="space-y-4 font-sans text-gray-100 min-h-0 flex-1 flex flex-col custom-scrollbar overflow-y-auto pr-1">
      
      {/* 1. TOP METRICS ROW (TODAY'S OPERATIONAL DATA ONLY) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 shrink-0">
        
        {/* Today's Revenue */}
        <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex justify-between items-start text-gray-400">
            <span className="text-[10px] font-cyber uppercase">Today's Revenue</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-cyber font-black text-emerald-400 mt-2">₹ {(metrics?.todayRevenue || 0).toLocaleString()}</div>
          <p className="text-[9px] font-mono text-emerald-500">Live updating ⚡</p>
        </div>

        {/* Today's Sessions */}
        <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex justify-between items-start text-gray-400">
            <span className="text-[10px] font-cyber uppercase">Today's Sessions</span>
            <div className="w-6 h-6 rounded-lg bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-cyber font-black text-purple-300 mt-2">{(metrics?.todaySessions || 0).toString().padStart(2, '0')}</div>
          <p className="text-[9px] font-mono text-purple-400">Live right now</p>
        </div>

        {/* Today's Players */}
        <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex justify-between items-start text-gray-400">
            <span className="text-[10px] font-cyber uppercase">Today's Players</span>
            <div className="w-6 h-6 rounded-lg bg-blue-950/60 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-cyber font-black text-blue-300 mt-2">{(metrics?.todayPlayers || 0).toString().padStart(2, '0')}</div>
          <p className="text-[9px] font-cyber text-blue-400">Active players</p>
        </div>

        {/* Controllers In Use */}
        <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex justify-between items-start text-gray-400">
            <span className="text-[10px] font-cyber uppercase">Controllers In Use</span>
            <div className="w-6 h-6 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Monitor className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-cyber font-black text-cyan-300 mt-2">{metrics?.controllersInUse || 0} / {metrics?.totalControllers || 20}</div>
          <p className="text-[9px] font-mono text-cyan-400">Available: {metrics?.availableControllers || 20}</p>
        </div>

        {/* Available Devices */}
        <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex justify-between items-start text-gray-400">
            <span className="text-[10px] font-cyber uppercase">Available Devices</span>
            <div className="w-6 h-6 rounded-lg bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Tv className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-cyber font-black text-amber-300 mt-2">
            {(metrics?.availableDevices || 0).toString().padStart(2, '0')}
          </div>
          <p className="text-[9px] font-mono text-amber-400">Ready to play</p>
        </div>

        {/* Online Bookings */}
        <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex justify-between items-start text-gray-400">
            <span className="text-[10px] font-cyber uppercase">Online Bookings</span>
            <div className="w-6 h-6 rounded-lg bg-pink-950/60 border border-pink-500/40 flex items-center justify-center text-pink-400">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-cyber font-black text-pink-300 mt-2">{(metrics?.onlineBookings || 0).toString().padStart(2, '0')}</div>
          <p className="text-[9px] font-mono text-pink-400">Today's bookings</p>
        </div>

      </div>

      {/* 2. AUTO-RESET COUNTDOWN BAR */}
      <div className="glass-panel p-3.5 rounded-2xl border border-blue-500/30 bg-blue-950/10 flex items-center justify-between text-xs font-cyber tracking-wide shrink-0">
        <div className="flex items-center gap-2.5 text-gray-300">
          <Clock className="w-5 h-5 text-blue-400 animate-pulse shrink-0" />
          <span>
            Daily auto reset will occur at <strong className="text-white">12:00 PM</strong>. Today's data will be saved and tomorrow will start fresh.
          </span>
        </div>
        <div className="text-right flex items-center gap-1.5 font-mono font-bold text-blue-300">
          <span className="text-[10px] text-gray-500">▲ Auto reset:</span>
          <span>{resetCountdown}</span>
          <span className="text-[9px] text-gray-500 font-sans font-normal">(Hours : Minutes : Seconds)</span>
        </div>
      </div>

      {/* 3. REPORTS TABLE CARD (FULL WIDTH) */}
      <div className="w-full glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-between min-h-0 mb-6 shrink-0">
          
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            {/* Header & Export Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 shrink-0">
              <h3 className="font-cyber text-sm sm:text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                {subTab === 'DAILY' && 'Daily Reports'}
                {subTab === 'WEEKLY' && 'Weekly Reports'}
                {subTab === 'MONTHLY' && 'Monthly Reports'}
                {subTab === 'YEARLY' && 'Yearly Reports'}
                {subTab === 'CAFE' && 'Gaming Café Reports & Analytics'}
              </h3>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetAllData}
                  className="px-2.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-[10px] font-cyber font-bold text-red-300 tracking-wider uppercase flex items-center gap-1 cursor-pointer transition-all mr-2"
                >
                  <RotateCcw className="w-3 h-3" /> Reset All Data
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[10px] font-cyber font-bold text-white uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3 h-3" /> Export PDF
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[10px] font-cyber font-bold text-white uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3 h-3" /> Export CSV
                </button>
              </div>
            </div>

            {/* Filter Bar (Only relevant for Daily Reports) */}
            {subTab === 'DAILY' && (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-[#090B15]/80 p-3 rounded-xl border border-white/5 text-xs font-cyber shrink-0">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-gray-500 uppercase">Date From</span>
                  <input 
                    type="date" 
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-purple-500" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-gray-500 uppercase">Date To</span>
                  <input 
                    type="date" 
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-purple-500" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-gray-500 uppercase">Month</span>
                  <select 
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-purple-500"
                  >
                    <option value="All">All Months</option>
                    <option value="01">January</option>
                    <option value="02">February</option>
                    <option value="03">March</option>
                    <option value="04">April</option>
                    <option value="05">May</option>
                    <option value="06">June</option>
                    <option value="07">July</option>
                    <option value="08">August</option>
                    <option value="09">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-gray-500 uppercase">Year</span>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-purple-500"
                  >
                    <option value="All">All Years</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-gray-500 uppercase">Payment</span>
                  <select
                    value={filterPayment}
                    onChange={(e) => setFilterPayment(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-purple-500"
                  >
                    <option value="All">All</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 justify-end">
                  <button 
                    onClick={handleResetFilters}
                    className="w-full py-1.5 rounded-lg bg-slate-900 border border-white/10 hover:bg-slate-800 text-[10px] font-cyber text-gray-300 font-bold uppercase cursor-pointer"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}

            {/* CAFE REPORTS & ANALYTICS — rendered once; it is responsive on its own */}
            {subTab === 'CAFE' && (
              <div className="flex-1 min-h-0">
                <CafeReportsSection />
              </div>
            )}

            {/* Mobile card lists — the sub-md stand-in for the report tables */}
            <div className="md:hidden flex-1 min-h-0">
              {subTab === 'DAILY' && (
                paginatedDaily.length === 0 ? (
                  <MobileCardEmpty icon={BarChart3}>
                    No Daily Reports Yet. Start a Walk-in Session or convert an Online Booking to generate reports.
                  </MobileCardEmpty>
                ) : (
                  <MobileCardList>
                    {paginatedDaily.map((r, i) => (
                      <MobileCard
                        key={(r.id || '') + i}
                        title={r.dateStr.replace(' (Today)', '')}
                        badge={r.isToday ? (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-cyber font-bold uppercase bg-purple-950/90 text-purple-300 border border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.3)] animate-pulse">Today</span>
                        ) : null}
                        footer={<MobileCardActions>{renderDailyActions(r)}</MobileCardActions>}
                      >
                        <MobileCardRow label="Revenue" value={`₹ ${r.revenue.toLocaleString()}`} className="font-mono text-emerald-400 font-bold" />
                        <MobileCardRow label="Sessions" value={r.completedSessions} className="font-mono" />
                        <MobileCardRow label="Players" value={r.players} className="font-mono text-blue-300" />
                        <MobileCardRow label="Avg Duration" value={`${r.avgSessionMins} mins`} className="font-mono text-gray-400" />
                        <MobileCardRow label="Peak Hour" value={r.peakHour} className="font-mono text-amber-300" />
                        <MobileCardRow label="Top Device" value={r.mostUsedDevice} className="text-white" />
                        <MobileCardRow label="Payments" value={paymentSummary(r)} className="text-[10px] text-gray-400" />
                      </MobileCard>
                    ))}
                  </MobileCardList>
                )
              )}

              {subTab === 'WEEKLY' && (
                weeklyReports.length === 0 ? (
                  <MobileCardEmpty icon={BarChart3}>No Weekly Reports Yet</MobileCardEmpty>
                ) : (
                  <MobileCardList>
                    {weeklyReports.map((w, i) => (
                      <MobileCard
                        key={w.id || i}
                        title={w.weekRange}
                        accent="cyan"
                        footer={
                          <MobileCardActions>
                            <button
                              onClick={handleExportPDF}
                              className="px-2 py-1.5 rounded bg-indigo-950/60 border border-indigo-500/30 hover:border-indigo-400 text-[10px] font-bold text-indigo-300 cursor-pointer"
                            >
                              Print Summary
                            </button>
                          </MobileCardActions>
                        }
                      >
                        <MobileCardRow label="Gross Revenue" value={`₹ ${w.revenue.toLocaleString()}`} className="font-mono text-emerald-400 font-bold" />
                        <MobileCardRow label="Sessions" value={w.totalSessions} className="font-mono" />
                        <MobileCardRow label="Players" value={w.totalPlayers} className="font-mono text-blue-300" />
                        <MobileCardRow label="Avg Daily Rev" value={`₹ ${w.avgDailyRevenue.toLocaleString()}`} className="font-mono text-gray-400" />
                        <MobileCardRow label="Peak Day" value={w.peakDay} className="font-mono text-amber-300" />
                        <MobileCardRow label="Top Device" value={w.mostUsedDevice} className="text-white" />
                      </MobileCard>
                    ))}
                  </MobileCardList>
                )
              )}

              {subTab === 'MONTHLY' && (
                monthlyReports.length === 0 ? (
                  <MobileCardEmpty icon={BarChart3}>No Monthly Reports Yet</MobileCardEmpty>
                ) : (
                  <MobileCardList>
                    {monthlyReports.map((m, i) => (
                      <MobileCard key={m.id || i} title={m.monthName} accent="emerald">
                        <MobileCardRow label="Revenue" value={`₹ ${m.revenue.toLocaleString()}`} className="font-mono text-emerald-400 font-bold" />
                        <MobileCardRow label="Sessions" value={m.totalSessions} className="font-mono" />
                        <MobileCardRow label="Players" value={m.totalPlayers} className="font-mono text-blue-300" />
                        <MobileCardRow label="Avg Daily Rev" value={`₹ ${m.avgDailyRevenue.toLocaleString()}`} className="font-mono text-gray-400" />
                        <MobileCardRow label="Highest Day" value={m.highestDay} className="font-mono text-emerald-400" />
                        <MobileCardRow label="Lowest Day" value={m.lowestDay} className="font-mono text-red-400" />
                        <MobileCardRow label="Top Device" value={m.mostUsedDevice} className="text-white" />
                      </MobileCard>
                    ))}
                  </MobileCardList>
                )
              )}

              {subTab === 'YEARLY' && (
                yearlyReports.length === 0 ? (
                  <MobileCardEmpty icon={BarChart3}>No Yearly Reports Yet</MobileCardEmpty>
                ) : (
                  <MobileCardList>
                    {yearlyReports.map((y, i) => (
                      <MobileCard key={y.id || i} title={String(y.year)} accent="amber">
                        <MobileCardRow label="Revenue" value={`₹ ${y.revenue.toLocaleString()}`} className="font-mono text-emerald-400 font-bold" />
                        <MobileCardRow label="Sessions" value={y.totalSessions} className="font-mono" />
                        <MobileCardRow label="Players" value={y.totalPlayers} className="font-mono text-blue-300" />
                        <MobileCardRow label="Avg Daily Rev" value={`₹ ${y.avgDailyRevenue.toLocaleString()}`} className="font-mono text-gray-400" />
                      </MobileCard>
                    ))}
                  </MobileCardList>
                )
              )}

            </div>

            {/* Table Container */}
            <div className="hidden md:block flex-1 overflow-x-auto min-h-[220px] pb-4">

              {/* DAILY TABLE */}
              {subTab === 'DAILY' && (
                <table className="w-full text-left text-xs font-sans min-w-[950px]">
                  <thead>
                    <tr className="text-[10px] font-cyber text-gray-400 border-b border-white/10 uppercase">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Revenue</th>
                      <th className="pb-2">Sessions</th>
                      <th className="pb-2">Players</th>
                      <th className="pb-2">Avg Duration</th>
                      <th className="pb-2">Peak Hour</th>
                      <th className="pb-2">Most Used Device</th>
                      <th className="pb-2">Payment Breakdown</th>
                      <th className="pb-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-gray-300">
                    {paginatedDaily.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center py-12 text-gray-500 font-sans">
                          <div className="font-cyber font-bold text-white text-sm mb-1">No Daily Reports Yet</div>
                          <div className="text-xs text-gray-400">
                            Start your first Walk-in Session or convert an Online Booking to automatically generate reports.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedDaily.map((r, i) => (
                        <tr key={(r.id || '') + i} className="hover:bg-white/5 transition-colors">
                          <td className="py-2.5 font-cyber text-xs font-bold text-white flex items-center gap-1.5">
                            {r.dateStr.replace(' (Today)', '')}
                            {r.isToday && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-cyber font-bold uppercase bg-purple-950/90 text-purple-300 border border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.3)] animate-pulse">Today</span>
                            )}
                          </td>
                          <td className="py-2.5 text-emerald-400 font-bold">₹ {r.revenue.toLocaleString()}</td>
                          <td className="py-2.5">{r.completedSessions}</td>
                          <td className="py-2.5 text-blue-300">{r.players}</td>
                          <td className="py-2.5 text-gray-400">{r.avgSessionMins} mins</td>
                          <td className="py-2.5 text-amber-300">{r.peakHour}</td>
                          <td className="py-2.5 text-white font-sans">{r.mostUsedDevice}</td>
                          <td className="py-2.5 text-gray-400 text-[10px] font-sans">
                            {paymentSummary(r)}
                          </td>
                          <td className="py-2.5 text-right font-cyber">
                            <div className="inline-flex gap-1">
                              {renderDailyActions(r)}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* WEEKLY TABLE */}
              {subTab === 'WEEKLY' && (
                <table className="w-full text-left text-xs font-sans min-w-[950px]">
                  <thead>
                    <tr className="text-[10px] font-cyber text-gray-400 border-b border-white/10 uppercase">
                      <th className="pb-2">Week Range</th>
                      <th className="pb-2">Gross Revenue</th>
                      <th className="pb-2">Total Sessions</th>
                      <th className="pb-2">Total Players</th>
                      <th className="pb-2">Avg Daily Revenue</th>
                      <th className="pb-2">Peak Day</th>
                      <th className="pb-2">Most Used Device</th>
                      <th className="pb-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-gray-300">
                    {weeklyReports.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-12 text-gray-500">
                          <div className="font-cyber font-bold text-white text-sm">No Weekly Reports Yet</div>
                        </td>
                      </tr>
                    ) : (
                      weeklyReports.map((w, i) => (
                        <tr key={w.id || i} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 font-cyber text-xs font-bold text-white">{w.weekRange}</td>
                          <td className="py-3 text-emerald-400 font-bold">₹ {w.revenue.toLocaleString()}</td>
                          <td className="py-3">{w.totalSessions}</td>
                          <td className="py-3 text-blue-300">{w.totalPlayers}</td>
                          <td className="py-3 text-gray-400">₹ {w.avgDailyRevenue.toLocaleString()}</td>
                          <td className="py-3 text-amber-300">{w.peakDay}</td>
                          <td className="py-3 text-white font-sans">{w.mostUsedDevice}</td>
                          <td className="py-3 text-right font-cyber">
                            <button 
                              onClick={handleExportPDF}
                              className="px-2 py-1 rounded bg-indigo-950/60 border border-indigo-500/30 hover:border-indigo-400 text-[10px] font-bold text-indigo-300 cursor-pointer"
                            >
                              Print Summary
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* MONTHLY TABLE */}
              {subTab === 'MONTHLY' && (
                <table className="w-full text-left text-xs font-sans min-w-[950px]">
                  <thead>
                    <tr className="text-[10px] font-cyber text-gray-400 border-b border-white/10 uppercase">
                      <th className="pb-2">Month</th>
                      <th className="pb-2">Total Revenue</th>
                      <th className="pb-2">Total Sessions</th>
                      <th className="pb-2">Total Players</th>
                      <th className="pb-2">Avg Daily Revenue</th>
                      <th className="pb-2">Highest Revenue Day</th>
                      <th className="pb-2">Lowest Revenue Day</th>
                      <th className="pb-2">Most Used Device</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-gray-300">
                    {monthlyReports.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-12 text-gray-500">
                          <div className="font-cyber font-bold text-white text-sm">No Monthly Reports Yet</div>
                        </td>
                      </tr>
                    ) : (
                      monthlyReports.map((m, i) => (
                        <tr key={m.id || i} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 font-cyber text-xs font-bold text-white">{m.monthName}</td>
                          <td className="py-3 text-emerald-400 font-bold">₹ {m.revenue.toLocaleString()}</td>
                          <td className="py-3">{m.totalSessions}</td>
                          <td className="py-3 text-blue-300">{m.totalPlayers}</td>
                          <td className="py-3 text-gray-400">₹ {m.avgDailyRevenue.toLocaleString()}</td>
                          <td className="py-3 text-emerald-400">{m.highestDay}</td>
                          <td className="py-3 text-red-400">{m.lowestDay}</td>
                          <td className="py-3 text-white font-sans">{m.mostUsedDevice}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* YEARLY TABLE */}
              {subTab === 'YEARLY' && (
                <table className="w-full text-left text-xs font-sans min-w-[950px]">
                  <thead>
                    <tr className="text-[10px] font-cyber text-gray-400 border-b border-white/10 uppercase">
                      <th className="pb-2">Year</th>
                      <th className="pb-2">Total Revenue</th>
                      <th className="pb-2">Total Sessions</th>
                      <th className="pb-2">Total Players</th>
                      <th className="pb-2">Avg Daily Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-gray-300">
                    {yearlyReports.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-12 text-gray-500">
                          <div className="font-cyber font-bold text-white text-sm">No Yearly Reports Yet</div>
                        </td>
                      </tr>
                    ) : (
                      yearlyReports.map((y, i) => (
                        <tr key={y.id || i} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 font-cyber text-xs font-bold text-white">{y.year}</td>
                          <td className="py-3 text-emerald-400 font-bold">₹ {y.revenue.toLocaleString()}</td>
                          <td className="py-3">{y.totalSessions}</td>
                          <td className="py-3 text-blue-300">{y.totalPlayers}</td>
                          <td className="py-3 text-gray-400">₹ {y.avgDailyRevenue.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

            </div>
          </div>

          {/* Pagination Controls */}
          {subTab === 'DAILY' && totalEntries > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-white/10 pt-3 shrink-0 text-xs font-cyber">
              <span className="text-gray-400">
                Showing {Math.min(filteredDailyReports.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredDailyReports.length, currentPage * itemsPerPage)} of {totalEntries} entries
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded bg-slate-900 border border-white/10 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {[...Array(totalPages)].map((_, idx) => {
                  const pg = idx + 1;
                  if (totalPages > 5 && Math.abs(pg - currentPage) > 2 && pg !== 1 && pg !== totalPages) {
                    if (pg === 2 || pg === totalPages - 1) {
                      return <span key={pg} className="text-gray-500 px-1 font-mono">...</span>;
                    }
                    return null;
                  }

                  return (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold cursor-pointer ${
                        currentPage === pg
                          ? 'bg-purple-900 text-white border border-purple-500'
                          : 'bg-[#0A0C16] border border-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      {pg}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded bg-slate-900 border border-white/10 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* 4. SIDEBAR CARDS (3-COLUMN GRID BELOW TABLE) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shrink-0">
          
          {/* Quick Filters */}
          <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-2">
            <h4 className="text-xs font-cyber text-purple-300 font-bold uppercase tracking-wider border-b border-white/10 pb-2">Quick Filters</h4>
            {(() => {
              const yesterdayReport = parsedReports.find(r => r.rawDate < operationalDate);
              const yesterdayRevenue = yesterdayReport ? (yesterdayReport.revenue || 0) : 0;
              const yesterdayDateStr = yesterdayReport ? yesterdayReport.rawDate : '';

              const thisWeekReport = weeklyReports[0];
              const thisWeekRevenue = thisWeekReport ? (thisWeekReport.revenue || 0) : todayRevenue;

              const currentMonthKey = operationalDate.substring(0, 7);
              const thisMonthReport = monthlyReports.find(m => m.monthKey === currentMonthKey) || monthlyReports[0];
              const thisMonthRevenue = thisMonthReport ? (thisMonthReport.revenue || 0) : todayRevenue;

              const currentYearKey = operationalDate.substring(0, 4);
              const thisYearReport = yearlyReports.find(y => String(y.year) === currentYearKey) || yearlyReports[0];
              const thisYearRevenue = thisYearReport ? (thisYearReport.revenue || 0) : todayRevenue;

              return (
                <div className="grid grid-cols-1 gap-1.5 text-xs font-cyber font-bold text-gray-400">
                  <button 
                    onClick={() => {
                      setFilterStartDate(operationalDate);
                      setFilterEndDate(operationalDate);
                      setSubTab('DAILY');
                      setCurrentPage(1);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/5 hover:text-white hover:bg-white/10 text-left transition-all cursor-pointer flex items-center justify-between"
                  >
                    <span>📅 Today</span>
                    <span className="text-[10px] text-purple-400 font-mono">₹{todayRevenue.toLocaleString()}</span>
                  </button>

                  <button 
                    onClick={() => {
                      if (yesterdayDateStr) {
                        setFilterStartDate(yesterdayDateStr);
                        setFilterEndDate(yesterdayDateStr);
                      } else {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        const yesStr = yesterday.toISOString().split('T')[0];
                        setFilterStartDate(yesStr);
                        setFilterEndDate(yesStr);
                      }
                      setSubTab('DAILY');
                      setCurrentPage(1);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/5 hover:text-white hover:bg-white/10 text-left transition-all cursor-pointer flex items-center justify-between"
                  >
                    <span>📅 Yesterday</span>
                    <span className="text-[10px] text-purple-400 font-mono">
                      ₹{yesterdayRevenue.toLocaleString()}
                    </span>
                  </button>

                  <button 
                    onClick={() => {
                      const d = new Date(operationalDate);
                      const day = d.getDay();
                      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                      const monday = new Date(d.setDate(diff));
                      const pad = n => String(n).padStart(2, '0');
                      const monStr = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
                      setFilterStartDate(monStr);
                      setFilterEndDate(operationalDate);
                      setSubTab('DAILY');
                      setCurrentPage(1);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/5 hover:text-white hover:bg-white/10 text-left transition-all cursor-pointer flex items-center justify-between"
                  >
                    <span>📅 This Week</span>
                    <span className="text-[10px] text-purple-400 font-mono">₹{thisWeekRevenue.toLocaleString()}</span>
                  </button>

                  <button 
                    onClick={() => {
                      const parts = operationalDate.split('-');
                      if (parts.length === 3) {
                        setFilterStartDate(`${parts[0]}-${parts[1]}-01`);
                      }
                      setFilterEndDate(operationalDate);
                      setSubTab('DAILY');
                      setCurrentPage(1);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/5 hover:text-white hover:bg-white/10 text-left transition-all cursor-pointer flex items-center justify-between"
                  >
                    <span>📅 This Month</span>
                    <span className="text-[10px] text-purple-400 font-mono">₹{thisMonthRevenue.toLocaleString()}</span>
                  </button>

                  <button 
                    onClick={() => {
                      const parts = operationalDate.split('-');
                      setFilterStartDate(`${parts[0]}-01-01`);
                      setFilterEndDate(`${parts[0]}-12-31`);
                      setSubTab('DAILY');
                      setCurrentPage(1);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/5 hover:text-white hover:bg-white/10 text-left transition-all cursor-pointer flex items-center justify-between"
                  >
                    <span>📅 This Year</span>
                    <span className="text-[10px] text-purple-400 font-mono">₹{thisYearRevenue.toLocaleString()}</span>
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Auto Report System Status */}
          <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3">
            <h4 className="text-xs font-cyber text-purple-300 font-bold uppercase tracking-wider border-b border-white/10 pb-2">Auto Report System</h4>
            <div className="space-y-2.5 text-[11px] font-cyber">
              <div className="flex items-center justify-between text-gray-300">
                <div className="flex flex-col">
                  <span>Daily Report</span>
                  <span className="text-[9px] text-gray-500 font-sans">Everyday at 12:00 PM</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 text-[9px] font-bold">✓ ACTIVE</span>
              </div>

              <div className="flex items-center justify-between text-gray-300">
                <div className="flex flex-col">
                  <span>Weekly Report</span>
                  <span className="text-[9px] text-gray-500 font-sans">Every Sunday at 12:00 PM</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 text-[9px] font-bold">✓ ACTIVE</span>
              </div>

              <div className="flex items-center justify-between text-gray-300">
                <div className="flex flex-col">
                  <span>Monthly Report</span>
                  <span className="text-[9px] text-gray-500 font-sans">Last day of month at 12:00 PM</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 text-[9px] font-bold">✓ ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Report Storage Info */}
          <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-between flex-1">
            <div className="space-y-2">
              <h4 className="text-xs font-cyber text-purple-300 font-bold uppercase tracking-wider border-b border-white/10 pb-2">Report Storage</h4>
              <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                All reports are safely stored locally in localStorage. Future-ready for Supabase migration.
              </p>
            </div>
            
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400 font-mono text-sm font-bold">
                  {totalReportsCount}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-cyber text-white">Total Reports</span>
                  <span className="text-[9px] font-mono text-purple-400">Permanently Archived</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      {/* 5. BOTTOM SUMMARY CARDS (2x2 GRID ON DESKTOP, 2 COLUMNS ON TABLET) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 shrink-0 mt-6">
        
        {/* Café Orders Summary & Best Sellers */}
        <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-[#1C1404]/40 space-y-4">
          <h4 className="text-xs font-cyber text-amber-300 font-bold uppercase tracking-wider border-b border-white/10 pb-2 flex justify-between">
            <span>Café Sales & Best Sellers</span>
            <span className="text-[10px] font-mono text-amber-400">(Today)</span>
          </h4>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded bg-slate-950/60 border border-white/5">
              <span className="text-[9px] text-gray-500 block uppercase">Cafe Rev</span>
              <span className="text-sm font-mono font-bold text-emerald-400">₹{todayCafeRevenue}</span>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-white/5">
              <span className="text-[9px] text-gray-500 block uppercase">Total Orders</span>
              <span className="text-sm font-mono font-bold text-cyan-300">{todayCafeCompleted.length}</span>
            </div>
          </div>

          <div className="flex flex-col text-xs font-cyber text-gray-400 space-y-1">
            <span>Best Seller: <strong className="text-white font-sans">{(() => {
              if (todayCafeCompleted.length === 0) return 'N/A';
              const counts = {};
              todayCafeCompleted.forEach(o => {
                counts[o.productName] = (counts[o.productName] || 0) + Number(o.quantity);
              });
              let bestName = 'N/A';
              let maxCount = 0;
              Object.entries(counts).forEach(([name, count]) => {
                if (count > maxCount) {
                  maxCount = count;
                  bestName = name;
                }
              });
              return maxCount > 0 ? `${bestName} (x${maxCount})` : 'N/A';
            })()}</strong></span>
          </div>

          <button 
            type="button"
            className="w-full py-2 rounded-xl bg-amber-950/60 border border-amber-500/30 text-xs font-cyber font-bold text-amber-300 cursor-default text-center opacity-75"
          >
            Café Sales Monitored
          </button>
        </div>

        {/* Daily Report Summary */}
        <div className="glass-panel p-4 rounded-2xl border border-purple-500/30 bg-[#0F081D]/40 space-y-4">
          <h4 className="text-xs font-cyber text-purple-300 font-bold uppercase tracking-wider border-b border-white/10 pb-2 flex justify-between">
            <span>Daily Report Summary</span>
            <span className="text-[10px] font-mono text-purple-400">({formatDateString(operationalDate)})</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded bg-slate-950/60 border border-white/5">
              <span className="text-[9px] text-gray-500 block uppercase">Revenue</span>
              <span className="text-sm font-mono font-bold text-emerald-400">₹{todayRevenue}</span>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-white/5">
              <span className="text-[9px] text-gray-500 block uppercase">Sessions</span>
              <span className="text-sm font-mono font-bold text-blue-300">{todaySessionsCount}</span>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-white/5">
              <span className="text-[9px] text-gray-500 block uppercase">Players</span>
              <span className="text-sm font-mono font-bold text-purple-300">{todayPlayersCount}</span>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-white/5">
              <span className="text-[9px] text-gray-500 block uppercase">Avg Dur</span>
              <span className="text-sm font-mono font-bold text-amber-300">
                {todaySessionsCount > 0 ? `${todayAvgDuration}m` : '--'}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-cyber text-gray-400 pt-1">
            <span>Top Device: <strong className="text-white font-sans">{todayMostUsed}</strong></span>
            <span>Peak Hour: <strong className="text-white font-mono">{todayPeakHour}</strong></span>
          </div>

          <button 
            onClick={() => setSubTab('DAILY')}
            className="w-full py-2 rounded-xl bg-purple-950/60 border border-purple-500/30 hover:border-purple-400 text-xs font-cyber font-bold text-purple-300 cursor-pointer text-center"
          >
            View Full Report Details →
          </button>
        </div>

        {/* Weekly Report Summary */}
        <div className="glass-panel p-4 rounded-2xl border border-blue-500/30 bg-[#070F1D]/40 space-y-4">
          <h4 className="text-xs font-cyber text-blue-300 font-bold uppercase tracking-wider border-b border-white/10 pb-2 flex justify-between">
            <span>Weekly Report</span>
            <span className="text-[10px] font-mono text-blue-400">
              ({weeklyReports[0] ? weeklyReports[0].weekRange.split(' - ')[0] : 'Current Week'})
            </span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded bg-slate-950/60 border border-white/5">
              <span className="text-[9px] text-gray-500 block uppercase">Total Revenue</span>
              <span className="text-sm font-mono font-bold text-emerald-400">₹{(weeklyReports[0]?.revenue || 0).toLocaleString()}</span>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-white/5">
              <span className="text-[9px] text-gray-500 block uppercase">Sessions</span>
              <span className="text-sm font-mono font-bold text-blue-300">{weeklyReports[0]?.totalSessions || 0}</span>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-white/5">
              <span className="text-[9px] text-gray-500 block uppercase">Players</span>
              <span className="text-sm font-mono font-bold text-purple-300">{weeklyReports[0]?.totalPlayers || 0}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-cyber text-gray-400 pt-1">
            <span>Avg Daily: <strong className="text-white font-mono">₹{(weeklyReports[0]?.avgDailyRevenue || 0).toLocaleString()}</strong></span>
            <span className="truncate max-w-[150px]">Peak: <strong className="text-white font-sans text-[10px]">{weeklyReports[0]?.peakDay || 'N/A'}</strong></span>
          </div>

          <button 
            onClick={() => setSubTab('WEEKLY')}
            className="w-full py-2 rounded-xl bg-blue-950/60 border border-blue-500/30 hover:border-blue-400 text-xs font-cyber font-bold text-blue-300 cursor-pointer text-center"
          >
            View Weekly Report →
          </button>
        </div>

        {/* Monthly Report Summary */}
        <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 bg-[#041C11]/40 space-y-4">
          <h4 className="text-xs font-cyber text-emerald-300 font-bold uppercase tracking-wider border-b border-white/10 pb-2 flex justify-between">
            <span>Monthly Report</span>
            <span className="text-[10px] font-mono text-emerald-400">(July 2026)</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded bg-slate-950/60 border border-white/5">
              <span className="text-[9px] text-gray-500 block uppercase">Total Revenue</span>
              <span className="text-sm font-mono font-bold text-emerald-400">₹{(monthlyReports[0]?.revenue || 0).toLocaleString()}</span>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-white/5">
              <span className="text-[9px] text-gray-500 block uppercase">Sessions</span>
              <span className="text-sm font-mono font-bold text-blue-300">{monthlyReports[0]?.totalSessions || 0}</span>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-white/5">
              <span className="text-[9px] text-gray-500 block uppercase">Players</span>
              <span className="text-sm font-mono font-bold text-purple-300">{monthlyReports[0]?.totalPlayers || 0}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-cyber text-gray-400 pt-1">
            <span>Avg Daily: <strong className="text-white font-mono">₹{(monthlyReports[0]?.avgDailyRevenue || 0).toLocaleString()}</strong></span>
            <span className="truncate max-w-[150px]">Highest: <strong className="text-white font-sans text-[10px]">{monthlyReports[0]?.highestDay || 'N/A'}</strong></span>
          </div>

          <button 
            onClick={() => setSubTab('MONTHLY')}
            className="w-full py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 hover:border-emerald-400 text-xs font-cyber font-bold text-emerald-300 cursor-pointer text-center"
          >
            View Monthly Report →
          </button>
        </div>

      </div>

      {/* 5. VIEW DETAILS DIALOG / MODAL (PREMIUM GLASSMORPHISM OVERLAY) */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-4xl glass-panel bg-[#0C0B1B]/98 border border-purple-500/30 rounded-2xl p-5 shadow-2xl relative flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 shrink-0">
              <div>
                <h3 className="font-cyber text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  Report Details: {viewingReport.dateStr.replace(' (Today)', '')}
                </h3>
                <p className="text-xs text-gray-400">Complete transaction details for the selected operational business day</p>
              </div>

              <button
                onClick={() => setViewingReport(null)}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-6 h-6 rotate-45 transform" /> Close
              </button>
            </div>

            {/* Modal Metrics Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 shrink-0">
              <div className="bg-slate-950/60 border border-white/5 p-3 rounded-xl text-center space-y-1">
                <span className="text-[10px] text-gray-500 font-cyber uppercase">Total Revenue</span>
                <div className="text-lg font-cyber font-bold text-emerald-400 font-mono">₹ {viewingReport.revenue.toLocaleString()}</div>
              </div>
              <div className="bg-slate-950/60 border border-white/5 p-3 rounded-xl text-center space-y-1">
                <span className="text-[10px] text-gray-500 font-cyber uppercase">Sessions Run</span>
                <div className="text-lg font-cyber font-bold text-purple-300 font-mono">{viewingReport.completedSessions} Sessions</div>
              </div>
              <div className="bg-slate-950/60 border border-white/5 p-3 rounded-xl text-center space-y-1">
                <span className="text-[10px] text-gray-500 font-cyber uppercase">Players Roster</span>
                <div className="text-lg font-cyber font-bold text-blue-300 font-mono">{viewingReport.players} Active</div>
              </div>
              <div className="bg-slate-950/60 border border-white/5 p-3 rounded-xl text-center space-y-1">
                <span className="text-[10px] text-gray-500 font-cyber uppercase">Most Used</span>
                <div className="text-sm font-cyber font-bold text-amber-300 truncate mt-1">{viewingReport.mostUsedDevice}</div>
              </div>
            </div>

            {/* Modal Detail Table */}
            <div className="flex-1 overflow-y-auto custom-scrollbar my-2 pr-1 border border-white/5 bg-slate-950/30 rounded-xl p-3">
              {(() => {
                const sessions = viewingReport.sessions || [];

                if (sessions.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-500 font-mono">
                      No session details recorded for this archived date.
                    </div>
                  );
                }

                const sessionAmounts = (s) => {
                  const finalAmt = Number(s.totalAmount || s.total_amount || 0);
                  const extAmt = Number(s.extensionAmount || s.extension_amount || 0);
                  const foodAmt = Number(s.snackTotal || s.food_total || 0);
                  return { finalAmt, extAmt, origAmt: Number(s.originalAmount ?? (finalAmt - extAmt - foodAmt)) };
                };

                const paymentBadge = (s) => (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-cyber font-bold ${
                    s.paymentMethod === 'Cash'
                      ? 'bg-amber-950/80 text-amber-400 border border-amber-500/20'
                      : s.paymentMethod === 'Debit Card'
                      ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/20'
                      : s.paymentMethod === 'Credit Card'
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/20'
                      : (s.paymentMethod === 'Split' || s.paymentMethod === 'Split Payment')
                      ? 'bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-500/30'
                      : 'bg-purple-950/80 text-purple-400 border border-purple-500/20'
                  }`}>
                    {(s.paymentMethod === 'Split' || s.paymentMethod === 'Split Payment') ? 'Split Payment' : (s.paymentMethod || 'Cash')}
                  </span>
                );

                return (
                  <>
                  {/* Mobile card list — the sub-md stand-in for the session table */}
                  <MobileCardList>
                    {sessions.map((s, idx) => {
                      const { finalAmt, extAmt, origAmt } = sessionAmounts(s);
                      return (
                        <MobileCard
                          key={idx}
                          title={s.leaderName || s.customerName}
                          subtitle={s.id || s.sessionId}
                          badge={paymentBadge(s)}
                        >
                          <MobileCardRow label="Device" value={s.device || s.stationId} className="font-mono text-gray-300" />
                          <MobileCardRow label="Duration" value={s.duration} className="font-mono" />
                          <MobileCardRow label="Original" value={`₹ ${origAmt}`} className="font-mono text-gray-300" />
                          <MobileCardRow label="Extension" value={extAmt > 0 ? `+₹ ${extAmt}` : '₹ 0'} className="font-mono text-purple-300 font-bold" />
                          <MobileCardRow label="Final" value={`₹ ${finalAmt}`} className="font-mono text-emerald-400 font-bold" />
                          <MobileCardRow label="Start" value={s.startTime} className="font-mono" />
                          <MobileCardRow label="End" value={s.endTime || '-'} className="font-mono" />
                          <MobileCardRow label="Notes" value={s.notes || 'None'} className="text-[10px] text-gray-500" />
                        </MobileCard>
                      );
                    })}
                  </MobileCardList>

                  <table className="hidden md:table w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="text-[10px] font-cyber text-gray-500 border-b border-white/10 uppercase">
                        <th className="pb-2">Session ID</th>
                        <th className="pb-2">Leader Name</th>
                        <th className="pb-2">Device</th>
                        <th className="pb-2">Duration</th>
                        <th className="pb-2">Original Amount</th>
                        <th className="pb-2">Extension Amount</th>
                        <th className="pb-2">Final Amount</th>
                        <th className="pb-2">Payment</th>
                        <th className="pb-2">Session Start</th>
                        <th className="pb-2">Session End</th>
                        <th className="pb-2">Extension Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-gray-300">
                      {sessions.map((s, idx) => {
                        const finalAmt = Number(s.totalAmount || s.total_amount || 0);
                        const extAmt = Number(s.extensionAmount || s.extension_amount || 0);
                        const foodAmt = Number(s.snackTotal || s.food_total || 0);
                        const origAmt = Number(s.originalAmount ?? (finalAmt - extAmt - foodAmt));

                        return (
                          <tr key={idx} className="hover:bg-white/5">
                            <td className="py-2.5 text-purple-300 font-bold">{s.id || s.sessionId}</td>
                            <td className="py-2.5 text-white font-sans">{s.leaderName || s.customerName}</td>
                            <td className="py-2.5 text-gray-300">{s.device || s.stationId}</td>
                            <td className="py-2.5">{s.duration}</td>
                            <td className="py-2.5 text-gray-300">₹ {origAmt}</td>
                            <td className="py-2.5 text-purple-300 font-bold">{extAmt > 0 ? `+₹ ${extAmt}` : '₹ 0'}</td>
                            <td className="py-2.5 text-emerald-400 font-bold">₹ {finalAmt}</td>
                            <td className="py-2.5">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-cyber font-bold ${
                                s.paymentMethod === 'Cash' 
                                  ? 'bg-amber-950/80 text-amber-400 border border-amber-500/20' 
                                  : s.paymentMethod === 'Debit Card'
                                  ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/20'
                                  : s.paymentMethod === 'Credit Card'
                                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/20'
                                  : (s.paymentMethod === 'Split' || s.paymentMethod === 'Split Payment')
                                  ? 'bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-500/30'
                                  : 'bg-purple-950/80 text-purple-400 border border-purple-500/20'
                              }`}>
                                {(s.paymentMethod === 'Split' || s.paymentMethod === 'Split Payment') ? 'Split Payment' : (s.paymentMethod || 'Cash')}
                              </span>
                            </td>
                            <td className="py-2.5">{s.startTime}</td>
                            <td className="py-2.5">{s.endTime || '-'}</td>
                            <td className="py-2.5 text-gray-500 text-[10px] font-sans truncate max-w-[120px]" title={s.notes}>{s.notes || 'None'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </>
                );
              })()}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 border-t border-white/10 pt-4 shrink-0">
              <button
                onClick={() => exportSingleReportCSV(viewingReport)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-xs font-cyber font-bold text-gray-300 uppercase cursor-pointer"
              >
                Download CSV
              </button>
              <button
                onClick={() => setViewingReport(null)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-cyber font-bold text-white uppercase tracking-wider cursor-pointer"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
