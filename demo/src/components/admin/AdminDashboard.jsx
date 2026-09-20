import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sessionService } from '../../services/sessionService';
import { RealtimeProvider, useRealtime } from '../../context/RealtimeContext';
import ErrorBoundary from './ErrorBoundary';
import { 
  ShieldCheck, 
  LogOut, 
  ArrowLeft, 
  LayoutDashboard, 
  Clock, 
  Calendar, 
  Crown, 
  Gamepad2, 
  Globe, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Bell,
  Play,
  Tv,
  Zap,
  DollarSign,
  UtensilsCrossed,
  X,
  Trash2,
  CheckCheck,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Gift,
  Menu
} from 'lucide-react';
import { lazyWithRetry } from '../../utils/lazyWithRetry';

const DashboardOverviewModule = lazyWithRetry(() => import('./modules/DashboardOverviewModule'));
const LiveSessionsModule = lazyWithRetry(() => import('./modules/LiveSessionsModule'));
const WalkInSessionModule = lazyWithRetry(() => import('./modules/WalkInSessionModule'));
const OffersModule = lazyWithRetry(() => import('./modules/OffersModule'));
const PricingSettingsModule = lazyWithRetry(() => import('./modules/PricingSettingsModule'));
const BookingModule = lazyWithRetry(() => import('./modules/BookingModule'));
const DevicesModule = lazyWithRetry(() => import('./modules/DevicesModule'));
const MembershipModule = lazyWithRetry(() => import('./modules/MembershipModule'));
const WebsiteEditorModule = lazyWithRetry(() => import('./modules/WebsiteEditorModule'));
const WebsitePricingManagerModule = lazyWithRetry(() => import('./modules/WebsitePricingManagerModule'));
const GameLibraryManagerModule = lazyWithRetry(() => import('./modules/GameLibraryManagerModule'));
const CafeMenuManagerModule = lazyWithRetry(() => import('./modules/CafeMenuManagerModule'));
const CafeOrdersModule = lazyWithRetry(() => import('./modules/CafeOrdersModule'));
const ReportsModule = lazyWithRetry(() => import('./modules/ReportsModule'));
const SettingsModule = lazyWithRetry(() => import('./modules/SettingsModule'));

export default function AdminDashboard() {
  return (
    <RealtimeProvider>
      <AdminDashboardInner />
    </RealtimeProvider>
  );
}

function AdminDashboardInner() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [reportsSubTab, setReportsSubTab] = useState('DAILY');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // Below `lg` the sidebar is an off-canvas drawer instead of an in-flow column
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Controller Metrics & Notifications
  const [controllerMetrics, setControllerMetrics] = useState({ totalControllers: 20, controllersInUse: 14, availableControllers: 6 });
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  // Smart Floating Toast Queue State
  const [toastQueue, setToastQueue] = useState([]);
  const [currentToast, setCurrentToast] = useState(null);
  const seenToastIds = useRef(new Set());

  const { devices, activeSessions } = useRealtime();

  useEffect(() => {
    const st = sessionService.mapStations(devices, activeSessions);
    const ctrl = sessionService.mapControllerMetrics(st);
    setControllerMetrics(ctrl);

    sessionService.getNotifications().then(notifs => {
      setNotifications(notifs || []);
    }).catch(() => {});
  }, [devices, activeSessions]);

  useEffect(() => {
    const handleNotifsUpdate = (e) => {
      if (e.detail) {
        setNotifications(e.detail);
      }
    };
    window.addEventListener('gforce_notifications_updated', handleNotifsUpdate);
    return () => window.removeEventListener('gforce_notifications_updated', handleNotifsUpdate);
  }, []);

  // Enqueue new ALERT or SUCCESS notifications into Toast Queue
  useEffect(() => {
    if (notifications.length > 0) {
      const newToasts = notifications.filter(n => 
        (n.type === 'ALERT' || n.type === 'SUCCESS') && !seenToastIds.current.has(n.id)
      );
      if (newToasts.length > 0) {
        newToasts.forEach(t => seenToastIds.current.add(t.id));
        setToastQueue(prev => [...prev, ...newToasts]);
      }
    }
  }, [notifications]);

  // Toast Queue Processor - Shows 1 toast at a time for exactly 5 seconds
  useEffect(() => {
    if (!currentToast && toastQueue.length > 0) {
      const nextToast = toastQueue[0];
      setCurrentToast(nextToast);
      setToastQueue(prev => prev.slice(1));

      const timer = setTimeout(() => {
        setCurrentToast(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [currentToast, toastQueue]);

  // Drawer: lock page scroll behind the scrim, close on Esc, and drop the
  // drawer state when the viewport grows back to the static-sidebar layout.
  useEffect(() => {
    if (!isDrawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsDrawerOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsDrawerOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDrawerOpen]);

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setIsDrawerOpen(false);
  };

  const handleLogout = async () => {
    if (window.confirm('Log out from Admin Panel?')) {
      await logout();
      navigate('/admin/login');
    }
  };

  const handleBackToWebsite = () => {
    navigate('/website');
  };

  const handleMarkNotifsRead = async () => {
    const updated = await sessionService.markAllNotificationsRead();
    setNotifications(updated);
  };

  const handleMarkSingleRead = async (id) => {
    const updated = await sessionService.markNotificationRead(id);
    setNotifications(updated);
  };

  const handleDismissNotification = async (id, e) => {
    if (e) e.stopPropagation();
    const updated = await sessionService.dismissNotification(id);
    setNotifications(updated);
  };

  const handleClearAllNotifications = async () => {
    const updated = await sessionService.clearAllNotifications();
    setNotifications(updated);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Collapsing is a desktop-only affordance; the open drawer always shows labels.
  const showCollapsed = isSidebarCollapsed && !isDrawerOpen;

  const navItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'SESSIONS', label: 'Live Sessions', icon: Play },
    { id: 'WALKIN', label: 'Walk-in Session', icon: Zap },
    { id: 'OFFERS', label: 'Offers', icon: Gift },
    { id: 'PRICING_SETTINGS', label: 'Pricing Settings', icon: DollarSign },
    { id: 'BOOKINGS', label: 'Bookings', icon: Calendar },
    { id: 'DEVICES', label: 'Devices', icon: Tv },
    { id: 'MEMBERSHIPS', label: 'Memberships', icon: Crown },
    { id: 'GAMES_MANAGER', label: 'Game Library', icon: Gamepad2 },
    { id: 'MENU_MANAGER', label: 'Cafe Menu', icon: UtensilsCrossed },
    { id: 'CAFE_ORDERS', label: 'Gaming Café Orders', icon: UtensilsCrossed },
    { id: 'REPORTS', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'SETTINGS', label: 'Settings', icon: Settings },
  ];

  const renderModuleContent = () => {
    switch (activeTab) {
      case 'DASHBOARD':
        return <DashboardOverviewModule onNavigateTab={setActiveTab} />;
      case 'SESSIONS':
        return <LiveSessionsModule />;
      case 'WALKIN':
        return <WalkInSessionModule onNavigateTab={setActiveTab} />;
      case 'OFFERS':
        return <OffersModule onNavigateTab={setActiveTab} />;
      case 'PRICING_SETTINGS':
        return <PricingSettingsModule />;
      case 'BOOKINGS':
        return <BookingModule />;
      case 'DEVICES':
        return <DevicesModule />;
      case 'MEMBERSHIPS':
        return <MembershipModule />;
      case 'WEBSITE_CMS':
        return <WebsiteEditorModule />;
      case 'PRICING_MANAGER':
        return <WebsitePricingManagerModule />;
      case 'GAMES_MANAGER':
        return <GameLibraryManagerModule />;
      case 'MENU_MANAGER':
        return <CafeMenuManagerModule />;
      case 'CAFE_ORDERS':
        return <CafeOrdersModule />;
      case 'REPORTS':
        return <ReportsModule subTab={reportsSubTab} setSubTab={setReportsSubTab} />;
      case 'SETTINGS':
        return <SettingsModule />;
      default:
        return <DashboardOverviewModule onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-dvh bg-[#070A17] text-gray-100 font-sans overflow-hidden select-none relative">
      
      {/* FLOATING TOAST NOTIFICATION OVERLAY (TOP-RIGHT, 5s AUTO CLOSE, SINGLE QUEUE) */}
      {currentToast && (
        <div className="fixed top-16 left-3 right-3 sm:top-20 sm:left-auto sm:right-6 sm:max-w-sm z-[60] animate-bounce-short font-sans">
          <div className={`p-4 rounded-2xl glass-panel border shadow-2xl backdrop-blur-xl flex items-start gap-3 relative transition-all duration-300 ${
            currentToast.type === 'ALERT'
              ? 'bg-[#1C1004]/95 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.3)]'
              : 'bg-[#031B11]/95 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              currentToast.type === 'ALERT' 
                ? 'bg-amber-950/80 text-amber-400 border border-amber-500/40' 
                : 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
            }`}>
              {currentToast.type === 'ALERT' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>

            <div className="flex-1 pr-4 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className={`font-cyber text-xs font-bold uppercase tracking-wider ${
                  currentToast.type === 'ALERT' ? 'text-amber-300' : 'text-emerald-300'
                }`}>
                  {currentToast.title}
                </h4>
              </div>
              <p className="text-[11px] text-gray-200 mt-0.5 leading-relaxed font-medium">{currentToast.message}</p>
              <span className="text-[9px] font-mono text-gray-400 mt-1 block">Saved in Notification Center • Auto-closes in 5s</span>
            </div>

            <button
              onClick={() => setCurrentToast(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer absolute top-2.5 right-2.5"
              title="Close Toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* DRAWER SCRIM — below lg only, closes the off-canvas sidebar */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR NAVIGATION — off-canvas drawer below lg, in-flow column at lg+ */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[17rem] ${
          // `invisible` keeps the off-screen drawer out of the tab order
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full invisible lg:visible'
        } lg:static lg:translate-x-0 lg:z-30 lg:shrink-0 ${
          isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        } transition-[transform,visibility] duration-300 lg:transition-all bg-[#0C091F]/95 lg:bg-[#0C091F]/90 backdrop-blur-xl border-r border-white/10 flex flex-col justify-between shadow-[4_0_25px_rgba(0,0,0,0.5)]`}
      >
        <div className="flex flex-col h-full">

          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-white/10 h-14 lg:h-16">
            {/* Drawer close button — the collapse chevron is meaningless off-canvas */}
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="lg:hidden p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer order-last"
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4" />
            </button>

            {!showCollapsed && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 border border-purple-500/40 flex items-center justify-center font-cyber font-black text-white text-xs shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                  AP
                </div>
                <div>
                  <h1 className="font-cyber text-xs sm:text-sm font-black tracking-wider text-white uppercase leading-none">
                    ADMIN PANEL
                  </h1>
                </div>
              </div>
            )}

            {showCollapsed && (
              <div className="w-full flex justify-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 border border-purple-500/40 flex items-center justify-center font-cyber font-black text-white text-xs shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                  AP
                </div>
              </div>
            )}

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:block p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              aria-label={showCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {showCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Items List */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <div key={item.id} className="w-full">
                  <button
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-xl font-cyber text-xs font-bold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-900/80 to-indigo-900/60 text-white border border-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.35)]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    } ${showCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-400' : 'text-gray-400'}`} />
                    {!showCollapsed && <span className="truncate tracking-wider">{item.label}</span>}
                  </button>
                  {item.id === 'REPORTS' && isActive && !showCollapsed && (
                    <div className="pl-8 mt-1.5 space-y-1 border-l border-purple-500/20 ml-5">
                      {[
                        { id: 'DAILY', label: 'Daily Reports' },
                        { id: 'WEEKLY', label: 'Weekly Reports' },
                        { id: 'MONTHLY', label: 'Monthly Reports' },
                        { id: 'YEARLY', label: 'Yearly Reports' }
                      ].map(sub => (
                        <button
                          key={sub.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setReportsSubTab(sub.id);
                            setIsDrawerOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 lg:py-1.5 rounded-lg text-[10px] font-cyber tracking-wider transition-colors text-left cursor-pointer ${
                            reportsSubTab === sub.id
                              ? 'text-purple-400 font-bold bg-purple-950/20'
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span className="text-[8px] text-purple-400">•</span> {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Sidebar Footer Logout */}
          <div className="p-3 border-t border-white/10 space-y-2">
            <button
              onClick={handleBackToWebsite}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-sans text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer ${
                showCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400 shrink-0" />
              {!showCollapsed && <span>Public Website</span>}
            </button>

            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-cyber font-bold text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-500/20 transition-all cursor-pointer ${
                showCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!showCollapsed && <span className="uppercase tracking-wider">Logout</span>}
            </button>
          </div>

        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#070A17]">
        
        {/* Top Navbar Header */}
        <header className="h-14 lg:h-16 px-3 sm:px-4 xl:px-6 bg-[#0C091F]/60 backdrop-blur-md border-b border-white/10 flex items-center justify-between gap-2 z-20 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Drawer trigger — replaces the sidebar below lg */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <ShieldCheck className="hidden sm:block w-5 h-5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <h2 className="font-cyber text-xs sm:text-sm font-bold text-white uppercase tracking-wider truncate">
                ADMIN PANEL
              </h2>
              <span className="text-[10px] font-mono text-purple-400 block truncate">
                <span className="hidden sm:inline">ACTIVE MODULE: </span>{navItems.find(n => n.id === activeTab)?.label}
              </span>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3 xl:gap-4 shrink-0">
            
            {/* Live Controller Allocation Bar */}
            <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono">
              <span className="text-gray-400">CONTROLLERS IN USE:</span>
              <span className="font-cyber font-bold text-purple-400">{controllerMetrics.controllersInUse} / {controllerMetrics.totalControllers}</span>
              <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" 
                  style={{ width: `${(controllerMetrics.controllersInUse / controllerMetrics.totalControllers) * 100}%` }}
                />
              </div>
            </div>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={`relative p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer ${
                  unreadCount > 0 ? 'animate-bounce' : ''
                }`}
                title="System Notifications"
              >
                <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-purple-400' : ''}`} />
                {unreadCount > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-mono font-bold flex items-center justify-center border border-red-400">
                    {unreadCount}
                  </span>
                ) : (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gray-700 text-gray-300 text-[8px] font-mono font-bold flex items-center justify-center">
                    0
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80 xl:w-96 glass-panel bg-[#0C0A1D]/98 border border-purple-500/30 rounded-2xl p-3.5 shadow-2xl z-50 space-y-2.5 font-sans backdrop-blur-xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h3 className="font-cyber text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      Notifications <span className="text-[10px] font-mono text-purple-400">({notifications.length})</span>
                    </h3>
                    
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkNotifsRead}
                          className="flex items-center gap-1 text-purple-400 hover:text-purple-300 hover:underline cursor-pointer"
                          title="Mark all as read"
                        >
                          <CheckCheck className="w-3 h-3" /> Read All
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button 
                          onClick={handleClearAllNotifications}
                          className="flex items-center gap-1 text-red-400 hover:text-red-300 hover:underline cursor-pointer ml-1"
                          title="Clear all notifications"
                        >
                          <Trash2 className="w-3 h-3" /> Clear All
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 max-h-[60vh] sm:max-h-72 overflow-y-auto custom-scrollbar pr-0.5">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 space-y-1">
                        <Bell className="w-6 h-6 text-gray-600 mx-auto opacity-50" />
                        <p className="text-xs text-gray-500 font-mono">No active notifications</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => handleMarkSingleRead(n.id)}
                          className={`p-2.5 rounded-xl border text-xs text-left transition-all relative group cursor-pointer ${
                            n.read 
                              ? 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10' 
                              : 'bg-purple-950/40 border-purple-500/40 text-gray-200 shadow-[0_0_10px_rgba(147,51,234,0.15)]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 truncate">
                              {!n.read && <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0 animate-pulse" />}
                              <span className="font-cyber font-bold text-purple-300 truncate">{n.title}</span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[9px] font-mono text-gray-500">{n.time}</span>
                              <button 
                                onClick={(e) => handleDismissNotification(n.id, e)}
                                className="p-0.5 rounded hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                                title="Dismiss notification"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-[11px] leading-relaxed mt-1 text-gray-300 pr-3">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Avatar Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center font-cyber font-bold text-purple-300 text-xs">
                {user?.email ? user.email.charAt(0).toUpperCase() : 'SA'}
              </div>
              <div className="hidden sm:block text-left">
                <span className="font-cyber text-xs font-bold text-white block leading-none truncate max-w-[120px]" title={user?.email || 'Admin'}>
                  {user?.email || 'SUPER ADMIN'}
                </span>
                <span className="text-[9px] font-mono text-emerald-400">ONLINE</span>
              </div>
            </div>

          </div>
        </header>

        {/* Dynamic Module Content View */}
        <div className="flex-1 p-3 sm:p-4 xl:p-6 overflow-y-auto lg:overflow-hidden flex flex-col custom-scrollbar">
          <ErrorBoundary>
            <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div></div>}>
              {renderModuleContent()}
            </Suspense>
          </ErrorBoundary>
        </div>

      </main>

    </div>
  );
}
