import React, { useState, useEffect } from 'react';
import { membershipService } from '../../../services/membershipService';
import MembershipDetailsModal from '../MembershipDetailsModal';
import { MEMBERSHIP_PLANS } from '../../../config/membershipConfig';
import ErrorBoundary from '../ErrorBoundary';
import { supabase } from '../../../services/supabase';
import { 
  Users, 
  UserCheck, 
  UserX, 
  UserPlus, 
  Wallet, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Eye, 
  Check, 
  X, 
  Calendar, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  MessageSquare, 
  ShieldAlert, 
  CreditCard,
  FileText,
  AlertTriangle,
  ChevronDown,
  User,
  Ban
} from 'lucide-react';

export default function MembershipModule() {
  const [memberships, setMemberships] = useState([]);
  const [metrics, setMetrics] = useState({
    totalMemberships: 0,
    pendingMemberships: 0,
    activeMemberships: 0,
    expiredMemberships: 0,
    membershipRevenue: 0,
    todayNewMembers: 0,
    monthlyMembers: 0,
    threeMonthMembers: 0
  });

  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, PENDING, ACTIVE, EXPIRED, REJECTED, CANCELLED, SUSPENDED
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected Member for Right Detail Panel
  const [selectedMember, setSelectedMember] = useState(null);

  // Export Dropdown State
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState('NEWEST');

  // Inline Toast Alert State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Helper to trigger custom toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4500);
  };

  // Modals State
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmState, setDeleteConfirmState] = useState({ isOpen: false, member: null });

  // Add Member Form State
  const [newMemberForm, setNewMemberForm] = useState({
    full_name: '',
    mobile_number: '',
    membership_plan: MEMBERSHIP_PLANS.threeMonth.name,
    preferred_start_date: new Date().toISOString().split('T')[0],
    paymentMode: 'Cash',
    remarks: ''
  });

  // Edit Member Form State
  const [editMemberForm, setEditMemberForm] = useState({
    id: '',
    full_name: '',
    mobile_number: '',
    membership_plan: MEMBERSHIP_PLANS.threeMonth.name,
    preferred_start_date: '',
    paymentMode: 'Cash',
    remarks: '',
    status: 'Approved'
  });

  const fetchMembers = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await membershipService.getMemberships();
      const list = Array.isArray(data) ? data : [];
      setMemberships(list);
      const mData = await membershipService.getMembershipMetrics();
      setMetrics(mData);

      // Keep current selected member updated if modified
      if (selectedMember) {
        const updatedSel = list.find(m => (m.id || m.id) === (selectedMember.requestId || selectedMember.id));
        setSelectedMember(updatedSel || null);
      }
    } catch (e) {
      console.error('Failed to load memberships:', e);
      setMemberships([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    // Perform initial fetch and scan for expired members on load
    const initFetch = async () => {
      try {
        await membershipService.checkAndUpdateExpiredMemberships();
      } catch (err) {
        console.error('Auto-expiry scan error:', err);
      }
      await fetchMembers(true);
    };

    initFetch();

    // Subscribe to realtime Supabase changes for memberships
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'memberships'
        },
        (payload) => {
          console.log('Realtime change detected in memberships:', payload);
          fetchMembers(false);
          
          if (payload.eventType === 'INSERT') {
            showToast(`New membership request received from ${payload.new.full_name || 'Customer'}!`, 'success');
          } else if (payload.eventType === 'UPDATE') {
            showToast(`Membership of ${payload.new.full_name || 'Customer'} was updated!`, 'success');
          } else if (payload.eventType === 'DELETE') {
            showToast(`A membership record was deleted!`, 'success');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateStatus = async (requestId, newStatus) => {
    setLoading(true);
    try {
      await membershipService.updateMembershipStatus(requestId, newStatus);
      showToast(`Membership status updated to ${newStatus} successfully!`, 'success');
      await fetchMembers();
    } catch (err) {
      showToast(`Failed to update status: ${err.message || err}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRenewMember = async (requestId) => {
    setLoading(true);
    try {
      await membershipService.renewMembership(requestId);
      showToast('Membership successfully activated/renewed!', 'success');
      await fetchMembers();
    } catch (err) {
      showToast(`Failed to renew membership: ${err.message || err}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    if (!newMemberForm.full_name || !newMemberForm.mobile_number) return;
    setLoading(true);
    try {
      const created = await membershipService.createMembership({
        full_name: newMemberForm.full_name,
        mobile_number: newMemberForm.mobile_number,
        membership_plan: newMemberForm.membership_plan,
        preferredStartDate: newMemberForm.preferred_start_date,
        preferred_start_date: newMemberForm.preferred_start_date,
        paymentMode: newMemberForm.paymentMode,
        remarks: newMemberForm.remarks,
        isAdminAdd: true,
        status: 'Active' // Admin created members become ACTIVE immediately
      });

      setAddModalOpen(false);
      setNewMemberForm({
        full_name: '',
        mobile_number: '',
        membership_plan: MEMBERSHIP_PLANS.threeMonth.name,
        preferred_start_date: new Date().toISOString().split('T')[0],
        paymentMode: 'Cash',
        remarks: ''
      });

      showToast('New active member added successfully!', 'success');
      await fetchMembers();
      if (created) setSelectedMember(created);
    } catch (err) {
      showToast(`Failed to add member: ${err.message || err}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMemberOpen = (m) => {
    setEditMemberForm({
      id: m.id || m.id,
      full_name: m.full_name || m.name || '',
      mobile_number: m.mobile_number || m.phone || '',
      membership_plan: m.membership_plan || MEMBERSHIP_PLANS.threeMonth.name,
      preferred_start_date: m.preferred_start_date !== '-' ? m.preferred_start_date : new Date().toISOString().split('T')[0],
      paymentMode: m.paymentMode || 'Cash',
      remarks: m.remarks || '',
      status: m.status || 'Approved'
    });
    setEditModalOpen(true);
  };

  const handleEditMemberSubmit = async (e) => {
    e.preventDefault();
    if (!editMemberForm.full_name || !editMemberForm.mobile_number) return;
    setLoading(true);
    try {
      await membershipService.updateMembership(editMemberForm.id, {
        full_name: editMemberForm.full_name,
        mobile_number: editMemberForm.mobile_number,
        membership_plan: editMemberForm.membership_plan,
        preferred_start_date: editMemberForm.preferred_start_date,
        paymentMode: editMemberForm.paymentMode,
        remarks: editMemberForm.remarks,
        status: editMemberForm.status
      });

      setEditModalOpen(false);
      showToast('Member details updated successfully!', 'success');
      await fetchMembers();
    } catch (err) {
      showToast(`Failed to update member details: ${err.message || err}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmState.member) return;
    const reqId = deleteConfirmState.member.requestId || deleteConfirmState.member.id;
    setLoading(true);
    try {
      await membershipService.deleteMembership(reqId);
      if (selectedMember && (selectedMember.requestId || selectedMember.id) === reqId) {
        setSelectedMember(null);
      }
      setDeleteConfirmState({ isOpen: false, member: null });
      showToast('Membership record permanently deleted!', 'success');
      await fetchMembers();
    } catch (err) {
      showToast(`Failed to delete record: ${err.message || err}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = (memberships || []).filter(m => {
    const name = m.full_name || '';
    const phone = m.mobile_number || m.mobileNumber || m.phone || '';
    const id = m.id || '';
    const plan = m.membership_plan || m.membershipPlan || m.planName || '';
    const query = (searchQuery || '').toLowerCase();

    const matchesQuery = name.toLowerCase().includes(query) ||
                         phone.includes(query) ||
                         id.toLowerCase().includes(query) ||
                         plan.toLowerCase().includes(query);

    if (!matchesQuery) return false;

    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'PENDING') return m.status === 'Pending';
    if (activeFilter === 'ACTIVE') return m.status === 'Active' || m.status === 'Approved';
    if (activeFilter === 'EXPIRED') return m.status === 'Expired';
    if (activeFilter === 'REJECTED') return m.status === 'Rejected';
    if (activeFilter === 'CANCELLED') return m.status === 'Cancelled';
    if (activeFilter === 'SUSPENDED') return m.status === 'Suspended';
    return true;
  });

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (sortBy === 'NEWEST') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    if (sortBy === 'OLDEST') {
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    }
    if (sortBy === 'ACTIVE_FIRST') {
      if (a.status === 'Active' && b.status !== 'Active') return -1;
      if (a.status !== 'Active' && b.status === 'Active') return 1;
      return 0;
    }
    if (sortBy === 'PENDING_FIRST') {
      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
      if (a.status !== 'Pending' && b.status === 'Pending') return 1;
      return 0;
    }
    if (sortBy === 'EXPIRED_FIRST') {
      if (a.status === 'Expired' && b.status !== 'Expired') return -1;
      if (a.status !== 'Expired' && b.status === 'Expired') return 1;
      return 0;
    }
    return 0;
  });

  const handleExportCSV = () => {
    setExportDropdownOpen(false);
    exportMembersToCSV(sortedMembers, 'csv');
  };

  const handleExportExcel = () => {
    setExportDropdownOpen(false);
    exportMembersToCSV(sortedMembers, 'excel');
  };

  const handleExportPDF = () => {
    setExportDropdownOpen(false);
    exportMembersToPDF(sortedMembers);
  };

  const exportMembersToCSV = (members, format = 'csv') => {
    if (!members || members.length === 0) {
      showToast("No members found to export.", "error");
      return;
    }
    const headers = ["Member ID", "Customer Name", "Mobile Number", "Membership Plan", "Price", "Payment Mode", "Payment Status", "Start Date", "Expiry Date", "Status"];
    const rows = members.map(m => [
      `"${m.id || ''}"`,
      `"${(m.full_name || '').replace(/"/g, '""')}"`,
      `"${m.mobile_number || m.mobileNumber || m.phone || ''}"`,
      `"${(m.membership_plan || m.membershipPlan || '').replace(/"/g, '""')}"`,
      `"${m.price || ''}"`,
      `"${m.payment_mode || m.paymentMode || 'Cash'}"`,
      `"${m.payment_status || m.paymentStatus || 'Pending'}"`,
      `"${m.preferred_start_date || m.startDate || '-'}"`,
      `"${m.expiry_date || m.expiryDate || '-'}"`,
      `"${m.status}"`
    ]);

    let csvContent = "";
    if (format === 'excel') {
      csvContent += "\uFEFF"; // Byte Order Mark for Excel
    }
    csvContent += [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `G-FORCE_Members_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Members exported to ${format.toUpperCase()} successfully!`, 'success');
  };

  const exportMembersToPDF = (members) => {
    if (!members || members.length === 0) {
      showToast("No members found to export.", "error");
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Popup blocker prevented opening the print report.', 'error');
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>G-FORCE Gaming Cafe - Members Directory</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #111; background: #fff; }
          h1 { color: #4c1d95; margin-bottom: 4px; font-size: 22px; }
          p { color: #666; margin-top: 0; font-size: 13px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
          th { background: #f3e8ff; color: #581c87; font-weight: bold; }
          tr:nth-child(even) { background: #f9fafb; }
          .badge { padding: 3px 8px; border-radius: 12px; font-weight: bold; font-size: 10px; display: inline-block; text-transform: uppercase; }
          .Active { background: #dcfce7; color: #15803d; }
          .Approved { background: #dcfce7; color: #15803d; }
          .Pending { background: #fef3c7; color: #b45309; }
          .Expired { background: #fee2e2; color: #b91c1c; }
        </style>
      </head>
      <body>
        <h1>🎮 G-FORCE Gaming Cafe — Membership Report</h1>
        <p>Generated Date: ${new Date().toLocaleDateString()} | Total Members: ${members.length}</p>
        <table>
          <thead>
            <tr>
              <th>MEMBER ID</th>
              <th>NAME</th>
              <th>MOBILE</th>
              <th>PLAN</th>
              <th>PAYMENT METHOD</th>
              <th>PAYMENT STATUS</th>
              <th>START DATE</th>
              <th>EXPIRY DATE</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            ${members.map(m => `
              <tr>
                <td><strong>${m.id || ''}</strong></td>
                <td>${m.full_name || ''}</td>
                <td>${m.mobile_number || m.mobileNumber || m.phone || ''}</td>
                <td>${m.membership_plan || m.membershipPlan || ''}</td>
                <td>${m.payment_mode || m.paymentMode || 'Cash'}</td>
                <td>${m.payment_status || m.paymentStatus || 'Pending'}</td>
                <td>${m.preferred_start_date || m.startDate || '-'}</td>
                <td>${m.expiry_date || m.expiryDate || '-'}</td>
                <td><span class="badge ${m.status}">${m.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    showToast('Report opened in print preview successfully!', 'success');
  };

  const getAvatarBg = (name, index) => {
    const colors = [
      'bg-purple-600 text-white',
      'bg-blue-600 text-white',
      'bg-emerald-600 text-white',
      'bg-pink-600 text-white',
      'bg-amber-600 text-white'
    ];
    return colors[index % colors.length];
  };

  return (
    <ErrorBoundary moduleName="Membership Management Module">
      <div className="space-y-4 text-gray-100 font-sans select-none overflow-x-hidden min-w-0">
        
        {/* 1. TOP HEADER ROW MATCHING REFERENCE IMAGE EXACTLY */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
          <div>
            <h1 className="font-cyber text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
              MEMBERSHIP MANAGEMENT
            </h1>
            <p className="text-xs text-gray-400 font-sans mt-0.5">
              Manage all members, approvals, plans and billing
            </p>
          </div>

          {/* Action Buttons: Export Dropdown + Add New Member */}
          <div className="flex items-center gap-2.5 relative">
            
            {/* Export Members Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="px-4 py-2 rounded-xl bg-[#1E1B3A] hover:bg-[#2A264D] border border-purple-500/30 text-xs font-cyber font-bold text-purple-200 flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Export Members</span>
                <ChevronDown className="w-3.5 h-3.5 text-purple-300" />
              </button>

              {exportDropdownOpen && (
                <div className="absolute right-0 mt-1 w-44 rounded-xl bg-[#17142E] border border-purple-500/40 shadow-2xl z-50 py-1 font-cyber text-xs">
                  <button
                    onClick={handleExportCSV}
                    className="w-full px-3 py-2 text-left text-gray-200 hover:bg-purple-600/30 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-purple-400" /> Export as CSV
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="w-full px-3 py-2 text-left text-gray-200 hover:bg-purple-600/30 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" /> Export as Excel
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full px-3 py-2 text-left text-gray-200 hover:bg-purple-600/30 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-pink-400" /> Export as PDF
                  </button>
                </div>
              )}
            </div>

            {/* Primary Add New Member Button */}
            <button
              onClick={() => setAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-cyber font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Member
            </button>
          </div>
        </div>

        {/* 2. TOP 6 KPI SUMMARY CARDS MATCHING REFERENCE IMAGE EXACTLY */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* Card 1: TOTAL MEMBERS */}
          <div className="glass-panel p-3.5 rounded-2xl border border-blue-500/20 bg-[#0A0D24]/90 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-blue-500/50 transition-all">
            <div className="space-y-1">
              <span className="text-[10px] font-cyber tracking-wider text-blue-300 font-bold uppercase block">TOTAL MEMBERS</span>
              <span className="text-2xl font-cyber font-black text-white block leading-none">{metrics.totalMemberships}</span>
              <span className="text-[9px] font-mono text-gray-400 block truncate">All registered members</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
              <Users className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: PENDING APPROVAL */}
          <div className="glass-panel p-3.5 rounded-2xl border border-amber-500/20 bg-[#1C1405]/90 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition-all">
            <div className="space-y-1">
              <span className="text-[10px] font-cyber tracking-wider text-amber-300 font-bold uppercase block">PENDING APPROVAL</span>
              <span className="text-2xl font-cyber font-black text-white block leading-none">{metrics.pendingMemberships}</span>
              <span className="text-[9px] font-mono text-gray-400 block truncate">Waiting for approval</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>

          {/* Card 3: ACTIVE MEMBERS */}
          <div className="glass-panel p-3.5 rounded-2xl border border-emerald-500/20 bg-[#051C12]/90 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="space-y-1">
              <span className="text-[10px] font-cyber tracking-wider text-emerald-300 font-bold uppercase block">ACTIVE MEMBERS</span>
              <span className="text-2xl font-cyber font-black text-white block leading-none">{metrics.activeMemberships}</span>
              <span className="text-[9px] font-mono text-gray-400 block truncate">Currently active</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>

          {/* Card 4: EXPIRED MEMBERS */}
          <div className="glass-panel p-3.5 rounded-2xl border border-red-500/20 bg-[#1D080B]/90 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-red-500/50 transition-all">
            <div className="space-y-1">
              <span className="text-[10px] font-cyber tracking-wider text-red-300 font-bold uppercase block">EXPIRED MEMBERS</span>
              <span className="text-2xl font-cyber font-black text-white block leading-none">{metrics.expiredMemberships}</span>
              <span className="text-[9px] font-mono text-gray-400 block truncate">Membership expired</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 shadow-inner">
              <UserX className="w-4 h-4" />
            </div>
          </div>

          {/* Card 5: TODAY'S REVENUE */}
          <div className="glass-panel p-3.5 rounded-2xl border border-cyan-500/20 bg-[#051726]/90 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-cyan-500/50 transition-all">
            <div className="space-y-1">
              <span className="text-[10px] font-cyber tracking-wider text-cyan-300 font-bold uppercase block">TODAY'S REVENUE</span>
              <span className="text-xl font-cyber font-black text-white block leading-none">₹ {(metrics.membershipRevenue || 0).toLocaleString()}</span>
              <span className="text-[9px] font-mono text-gray-400 block truncate">From {metrics.activeMemberships} transactions</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          {/* Card 6: TODAY'S NEW MEMBERS */}
          <div className="glass-panel p-3.5 rounded-2xl border border-purple-500/20 bg-[#180A28]/90 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-purple-500/50 transition-all">
            <div className="space-y-1">
              <span className="text-[10px] font-cyber tracking-wider text-purple-300 font-bold uppercase block">TODAY'S NEW MEMBERS</span>
              <span className="text-2xl font-cyber font-black text-white block leading-none">{metrics.todayNewMembers || (metrics.activeMemberships > 0 ? metrics.activeMemberships : 0)}</span>
              <span className="text-[9px] font-mono text-gray-400 block truncate">New members today</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 shadow-inner">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>

        </div>

        {/* 3. MAIN GRID (LEFT: TABLE 8 COLS | RIGHT: DETAIL PANEL 4 COLS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* LEFT COLUMN: FILTER TABS, SEARCH, TABLE & PAGINATION (8 COLS) */}
          <div className="lg:col-span-8 space-y-3 min-w-0">
            
            {/* Filter Tabs + Search Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#0E0B24]/90 backdrop-blur-md p-2 rounded-2xl border border-white/10">
              
              {/* Filter Tabs matching reference image */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
                {[
                  { id: 'ALL', label: 'All Members' },
                  { id: 'PENDING', label: 'Pending' },
                  { id: 'ACTIVE', label: 'Active' },
                  { id: 'EXPIRED', label: 'Expired' },
                  { id: 'REJECTED', label: 'Rejected' },
                  { id: 'CANCELLED', label: 'Cancelled' },
                  { id: 'SUSPENDED', label: 'Suspended' }
                ].map(tab => {
                  const isActive = activeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-xl font-cyber text-xs font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                        isActive 
                          ? 'text-white bg-purple-950/80 border border-purple-500/50 shadow-[0_0_12px_rgba(147,51,234,0.4)]' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Search & Filter Dropdown */}
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <div className="relative flex-1 sm:w-48">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search members..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-white/15 focus:border-purple-400 text-xs text-white placeholder-gray-500 outline-none transition-all font-sans"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                </div>

                <div className="relative">
                  <button 
                    onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-cyber font-bold text-gray-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Filter className="w-3.5 h-3.5" /> Sort: {sortBy === 'ACTIVE_FIRST' ? 'Active First' : sortBy === 'PENDING_FIRST' ? 'Pending First' : sortBy === 'EXPIRED_FIRST' ? 'Expired First' : sortBy === 'OLDEST' ? 'Oldest First' : 'Newest First'} ∨
                  </button>
                  
                  {sortDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-44 rounded-xl bg-[#17142E] border border-purple-500/40 shadow-2xl z-50 py-1 font-cyber text-xs animate-fade-in">
                      {[
                        { id: 'NEWEST', label: 'Newest First' },
                        { id: 'OLDEST', label: 'Oldest First' },
                        { id: 'ACTIVE_FIRST', label: 'Active First' },
                        { id: 'PENDING_FIRST', label: 'Pending First' },
                        { id: 'EXPIRED_FIRST', label: 'Expired First' }
                      ].map(option => (
                        <button 
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setSortBy(option.id);
                            setSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-white/5 flex items-center justify-between transition-colors ${sortBy === option.id ? 'text-purple-400 font-bold' : 'text-gray-300'}`}
                        >
                          {option.label}
                          {sortBy === option.id && <Check className="w-3.5 h-3.5 text-purple-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* TABLE CONTAINER */}
            <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-[#09071B]/90">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[780px]">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-950/70 text-[10px] font-cyber text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-3 font-bold">MEMBER ID</th>
                      <th className="py-3 px-3 font-bold">NAME</th>
                      <th className="py-3 px-3 font-bold">MOBILE</th>
                      <th className="py-3 px-3 font-bold">PLAN</th>
                      <th className="py-3 px-3 font-bold">PAYMENT</th>
                      <th className="py-3 px-3 font-bold">START DATE</th>
                      <th className="py-3 px-3 font-bold">EXPIRY DATE</th>
                      <th className="py-3 px-3 font-bold">STATUS</th>
                      <th className="py-3 px-3 font-bold text-center">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs font-sans">
                    {sortedMembers.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="py-16 text-center text-gray-400 font-cyber text-xs">
                          <User className="w-10 h-10 text-purple-500/30 mx-auto mb-2" />
                          <p className="font-bold text-gray-300">No Members Found</p>
                          <p className="text-[11px] text-gray-500 font-sans mt-1">
                            Click "+ Add New Member" above or purchase membership from the website to see members here.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      sortedMembers.map((m, idx) => {
                        const name = m.full_name || '';
                        const phone = m.mobile_number || '';
                        const planName = m.membership_plan || '';
                        const is3Month = planName.includes('3 Month') || planName.includes('Three') || planName.includes('499');
                        const status = m.status === 'Approved' ? 'Active' : m.status || 'Pending';
                        const reqId = m.id || m.id;
                        const isSelected = selectedMember && (selectedMember.requestId || selectedMember.id) === reqId;

                        return (
                          <tr 
                            key={reqId || idx} 
                            onClick={() => setSelectedMember(m)}
                            className={`transition-colors cursor-pointer group ${
                              isSelected ? 'bg-purple-900/40 border-l-2 border-purple-500' : 'hover:bg-purple-950/20'
                            }`}
                          >
                            {/* Member ID */}
                            <td className="py-3 px-3 font-mono text-gray-300 font-bold text-[11px] whitespace-nowrap">
                              {reqId}
                            </td>

                            {/* Name */}
                            <td className="py-3 px-3 font-bold text-white whitespace-nowrap group-hover:text-purple-300 transition-colors">
                              {name}
                            </td>

                            {/* Mobile */}
                            <td className="py-3 px-3 font-mono text-gray-300 text-[11px] whitespace-nowrap">
                              {phone}
                            </td>

                            {/* Plan Badge matching reference image styling */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-cyber font-bold inline-block ${
                                is3Month
                                  ? 'bg-purple-950/90 border border-purple-500/50 text-purple-300'
                                  : 'bg-blue-950/90 border border-blue-500/50 text-blue-300'
                              }`}>
                                {planName.toUpperCase()} - ₹{m.price || (is3Month ? 499 : 1999)}
                              </span>
                            </td>

                            {/* Payment Method */}
                            <td className="py-3 px-3 whitespace-nowrap font-mono text-gray-300 text-[11px]">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                                <CreditCard className="w-3 h-3 text-cyan-400" />
                                {m.paymentMode || 'GPay'}
                              </span>
                            </td>

                            {/* Start Date */}
                            <td className="py-3 px-3 font-mono text-gray-300 text-[11px] whitespace-nowrap">
                              {m.preferred_start_date || '-'}
                            </td>

                            {/* Expiry Date */}
                            <td className="py-3 px-3 font-mono text-[11px] whitespace-nowrap">
                              <span className={status === 'Expired' ? 'text-red-400 font-bold' : 'text-gray-300'}>
                                {m.expiryDate || '-'}
                              </span>
                            </td>

                            {/* Status Badge matching reference screenshot colors */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-cyber font-bold uppercase tracking-wider ${
                                status === 'Active'
                                  ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-500/40'
                                  : status === 'Expired'
                                  ? 'bg-red-950/90 text-red-400 border border-red-500/40'
                                  : status === 'Pending'
                                  ? 'bg-amber-950/90 text-amber-400 border border-amber-500/40 animate-pulse'
                                  : status === 'Cancelled'
                                  ? 'bg-gray-800 text-gray-300 border border-gray-600'
                                  : status === 'Rejected'
                                  ? 'bg-purple-950 text-purple-400 border border-purple-600'
                                  : 'bg-blue-950 text-blue-400 border border-blue-600'
                              }`}>
                                {status}
                              </span>
                            </td>

                            {/* Actions Buttons */}
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => {
                                    setSelectedMember(m);
                                    setDetailsModalOpen(true);
                                  }}
                                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                                  title="View Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleEditMemberOpen(m)}
                                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-colors cursor-pointer"
                                  title="Edit Member"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {m.status === 'Pending' && (
                                  <button
                                    onClick={() => handleUpdateStatus(reqId, 'Active')}
                                    className="p-1 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/40 transition-colors cursor-pointer"
                                    title="Approve Member"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {(status === 'Active' || status === 'Expired') && (
                                  <button
                                    onClick={() => handleRenewMember(reqId)}
                                    className="p-1 rounded bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-500/40 transition-colors cursor-pointer"
                                    title="Renew Membership"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                <button
                                  onClick={() => setDeleteConfirmState({ isOpen: true, member: m })}
                                  className="p-1 rounded bg-red-950/60 hover:bg-red-900 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                                  title="Delete Member"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Pagination matching reference image */}
              <div className="p-3 border-t border-white/10 bg-slate-950/60 flex items-center justify-between text-xs text-gray-400 font-mono">
                <span>Showing {sortedMembers.length > 0 ? 1 : 0} to {sortedMembers.length} of {metrics.totalMemberships} members</span>
                <div className="flex items-center gap-1">
                  <button className="p-1 rounded hover:bg-white/10 text-gray-400 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                  <button className="px-2.5 py-0.5 rounded bg-purple-600 text-white font-bold text-xs">1</button>
                  <button className="p-1 rounded hover:bg-white/10 text-gray-400 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: MEMBER DETAIL SIDE PANEL (4 COLS MATCHING REFERENCE IMAGE) */}
          <div className="lg:col-span-4 min-w-0">
            <div className="glass-panel rounded-2xl border border-white/10 p-4 bg-[#0D0A24]/90 space-y-4 shadow-2xl min-h-[520px]">
              
              {!selectedMember ? (
                /* EMPTY STATE IN RIGHT PANEL MATCHING REQUIREMENTS */
                <div className="py-24 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-cyber text-sm font-bold text-white uppercase tracking-wider mb-1">
                      No Member Selected
                    </h3>
                    <p className="text-xs text-gray-400 font-sans leading-relaxed max-w-xs mx-auto">
                      Click on any member row in the table to view detailed profile, activity & quick actions.
                    </p>
                  </div>
                </div>
              ) : (
                /* SELECTED MEMBER PROFILE CARD MATCHING UPLOADED DESIGN EXACTLY */
                <div className="space-y-4">
                  
                  {/* Avatar & Name Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-cyber font-black text-lg shadow-lg ${getAvatarBg(selectedMember.full_name || 'Member', 0)}`}>
                        {(selectedMember.full_name || 'M').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-cyber font-bold text-white text-base leading-tight">
                          {selectedMember.full_name}
                        </h3>
                        <span className="text-xs font-mono text-gray-400">
                          {selectedMember.requestId || selectedMember.id}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-cyber font-bold uppercase tracking-wider ${
                      selectedMember.status === 'Approved' || selectedMember.status === 'Active'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/50'
                        : selectedMember.status === 'Expired'
                        ? 'bg-red-950 text-red-400 border border-red-500/50'
                        : 'bg-amber-950 text-amber-400 border border-amber-500/50'
                    }`}>
                      {selectedMember.status === 'Approved' ? 'Active' : selectedMember.status}
                    </span>
                  </div>

                  {/* Member Details Grid */}
                  <div className="space-y-2.5 text-xs font-sans">
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-cyber text-[10px] uppercase tracking-wider">MEMBER ID</span>
                      <span className="font-mono font-bold text-white">{selectedMember.requestId || selectedMember.id}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-cyber text-[10px] uppercase tracking-wider">FULL NAME</span>
                      <span className="font-cyber text-white uppercase font-bold">{selectedMember.full_name}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-cyber text-[10px] uppercase tracking-wider">MOBILE NUMBER</span>
                      <a 
                        href={`https://wa.me/${String(selectedMember.mobile_number || selectedMember.mobileNumber || selectedMember.phone || '').replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="font-mono font-bold text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        {selectedMember.mobile_number || selectedMember.mobileNumber || selectedMember.phone}
                        <MessageSquare className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                      </a>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-cyber text-[10px] uppercase tracking-wider">PLAN</span>
                      <span className="font-cyber font-bold text-purple-300">{selectedMember.membership_plan || selectedMember.membershipPlan}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-cyber text-[10px] uppercase tracking-wider">PRICE</span>
                      <span className="font-cyber font-bold text-white">₹ {selectedMember.price || 0}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-cyber text-[10px] uppercase tracking-wider">START DATE</span>
                      <span className="font-mono text-gray-200">{selectedMember.preferred_start_date || selectedMember.startDate || '-'}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-cyber text-[10px] uppercase tracking-wider">EXPIRY DATE</span>
                      <span className="font-mono text-gray-200">{selectedMember.expiry_date || selectedMember.expiryDate || '-'}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-cyber text-[10px] uppercase tracking-wider">CREATED AT</span>
                      <span className="font-mono text-gray-200">{selectedMember.createdAt ? new Date(selectedMember.createdAt).toLocaleDateString() : '-'}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-cyber text-[10px] uppercase tracking-wider">PAYMENT STATUS</span>
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-cyber font-bold uppercase tracking-wider ${
                        (selectedMember.payment_status || selectedMember.paymentStatus) === 'Paid'
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : (selectedMember.payment_status || selectedMember.paymentStatus) === 'Refunded'
                          ? 'bg-red-500/20 border-red-500/50 text-red-400'
                          : 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                      }`}>
                        {selectedMember.payment_status || selectedMember.paymentStatus || 'Pending'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-cyber text-[10px] uppercase tracking-wider">REMARKS</span>
                      <span className="text-gray-300 italic truncate max-w-[150px]" title={selectedMember.remarks || ''}>{selectedMember.remarks || '-'}</span>
                    </div>
                  </div>

                  {/* QUICK ACTIONS MATCHING REFERENCE IMAGE */}
                  <div className="pt-3 space-y-2">
                    <h4 className="font-cyber text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      QUICK ACTIONS
                    </h4>

                    {selectedMember.status === 'Pending' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleUpdateStatus(selectedMember.id, 'Active')}
                          className="py-2 px-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-400 text-xs font-cyber font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(selectedMember.id, 'Rejected')}
                          className="py-2 px-3 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-400 text-xs font-cyber font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setDetailsModalOpen(true)}
                          className="py-2 px-3 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs font-cyber font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Details
                        </button>

                        <button
                          onClick={() => handleEditMemberOpen(selectedMember)}
                          className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-cyber font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-cyan-400" /> Edit Member
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(selectedMember.id, selectedMember.status === 'Suspended' ? 'Active' : 'Suspended')}
                          className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-cyber font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5 text-amber-400" /> {selectedMember.status === 'Suspended' ? 'Activate' : 'Suspend'}
                        </button>

                        <button
                          onClick={() => handleRenewMember(selectedMember.id)}
                          className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-cyber font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-purple-400" /> Renew
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => setDeleteConfirmState({ isOpen: true, member: selectedMember })}
                      className="w-full py-2.5 mt-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 hover:text-white text-xs font-cyber font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Member
                    </button>
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>

        {/* 4. MODALS & POPUPS */}

        {/* Modal: View Details */}
        <MembershipDetailsModal 
          isOpen={detailsModalOpen} 
          onClose={() => setDetailsModalOpen(false)} 
          request={selectedMember}
          onStatusUpdate={handleUpdateStatus}
        />

        {/* Modal: Add New Member */}
        {addModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-panel bg-[#0F0C2B] rounded-3xl border border-purple-500/40 p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-cyber text-lg font-black text-white uppercase flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-400" /> ADD NEW MEMBER
                </h3>
                <button 
                  onClick={() => setAddModalOpen(false)}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMemberSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-gray-300 font-cyber font-bold mb-1">CUSTOMER NAME *</label>
                  <input 
                    type="text" 
                    required
                    value={newMemberForm.full_name}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, full_name: e.target.value })}
                    placeholder="Enter customer full name..."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/15 focus:border-purple-400 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-cyber font-bold mb-1">MOBILE NUMBER *</label>
                  <input 
                    type="text" 
                    required
                    value={newMemberForm.mobile_number}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, mobile_number: e.target.value })}
                    placeholder="Enter 10-digit mobile number..."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/15 focus:border-purple-400 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-cyber font-bold mb-1">SELECT MEMBERSHIP PLAN *</label>
                  <select
                    value={newMemberForm.membership_plan}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, membership_plan: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/15 focus:border-purple-400 text-white outline-none"
                  >
                    <option value={MEMBERSHIP_PLANS.threeMonth.name}>{MEMBERSHIP_PLANS.threeMonth.name} - 20% OFF All Sessions</option>
                    <option value={MEMBERSHIP_PLANS.monthly.name}>{MEMBERSHIP_PLANS.monthly.name} - 25 Hours Included</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 font-cyber font-bold mb-1">START DATE</label>
                    <input 
                      type="date" 
                      value={newMemberForm.preferred_start_date}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, preferred_start_date: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/15 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-cyber font-bold mb-1">PAYMENT MODE</label>
                    <select
                      value={newMemberForm.paymentMode}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, paymentMode: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/15 text-white outline-none"
                    >
                      <option value="Cash">Cash</option>
                      <option value="GPay / UPI">GPay / UPI</option>
                      <option value="Card">Credit / Debit Card</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button 
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-cyber font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-cyber font-bold shadow-lg"
                  >
                    Create Active Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Member */}
        {editModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-panel bg-[#0F0C2B] rounded-3xl border border-cyan-500/40 p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-cyber text-lg font-black text-white uppercase flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-cyan-400" /> EDIT MEMBER DETAILS
                </h3>
                <button 
                  onClick={() => setEditModalOpen(false)}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditMemberSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-gray-300 font-cyber font-bold mb-1">CUSTOMER NAME</label>
                  <input 
                    type="text" 
                    required
                    value={editMemberForm.full_name}
                    onChange={(e) => setEditMemberForm({ ...editMemberForm, full_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/15 focus:border-cyan-400 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-cyber font-bold mb-1">MOBILE NUMBER</label>
                  <input 
                    type="text" 
                    required
                    value={editMemberForm.mobile_number}
                    onChange={(e) => setEditMemberForm({ ...editMemberForm, mobile_number: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/15 focus:border-cyan-400 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-cyber font-bold mb-1">MEMBERSHIP PLAN</label>
                  <select
                    value={editMemberForm.membership_plan}
                    onChange={(e) => setEditMemberForm({ ...editMemberForm, membership_plan: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/15 focus:border-cyan-400 text-white outline-none"
                  >
                    <option value={MEMBERSHIP_PLANS.threeMonth.name}>{MEMBERSHIP_PLANS.threeMonth.name} - 20% OFF</option>
                    <option value={MEMBERSHIP_PLANS.monthly.name}>{MEMBERSHIP_PLANS.monthly.name} - 25 Hours</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 font-cyber font-bold mb-1">STATUS</label>
                    <select
                      value={editMemberForm.status}
                      onChange={(e) => setEditMemberForm({ ...editMemberForm, status: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/15 text-white outline-none"
                    >
                      <option value="Approved">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Expired">Expired</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-300 font-cyber font-bold mb-1">PAYMENT MODE</label>
                    <select
                      value={editMemberForm.paymentMode}
                      onChange={(e) => setEditMemberForm({ ...editMemberForm, paymentMode: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/15 text-white outline-none"
                    >
                      <option value="Cash">Cash</option>
                      <option value="GPay / UPI">GPay / UPI</option>
                      <option value="Card">Credit / Debit Card</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button 
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-cyber font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-cyber font-bold shadow-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Delete Confirmation */}
        {deleteConfirmState.isOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-panel bg-[#1A0A0F] rounded-3xl border border-red-500/50 p-6 max-w-md w-full space-y-4 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-full bg-red-950 border border-red-500/50 flex items-center justify-center text-red-400 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-cyber text-base font-bold text-white uppercase mb-1">
                  Delete Membership Record?
                </h3>
                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  Are you sure you want to permanently delete member record <strong className="text-white">{deleteConfirmState.member?.full_name}</strong> ({deleteConfirmState.member?.id})?
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmState({ isOpen: false, member: null })}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 font-cyber font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-cyber font-bold text-xs shadow-lg cursor-pointer"
                >
                  Permanently Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Custom Toast Alerts */}
        {toast.show && (
          <div className="fixed top-20 right-6 z-[9999] animate-fade-in">
            <div className={`p-4 rounded-2xl glass-panel border shadow-2xl backdrop-blur-xl flex items-center gap-3 relative transition-all duration-300 ${
              toast.type === 'error'
                ? 'bg-[#1D080B]/95 border-red-500/50 shadow-[0_0_25px_rgba(239,68,68,0.3)]'
                : 'bg-[#031B11]/95 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
            }`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                toast.type === 'error' ? 'bg-red-950/80 text-red-400 border border-red-500/40' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
              }`}>
                {toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              </div>
              <div className="min-w-0 pr-4">
                <p className="text-xs font-cyber font-bold uppercase tracking-wider text-white">
                  {toast.type === 'error' ? 'ACTION FAILED' : 'ACTION SUCCESSFUL'}
                </p>
                <p className="text-[10px] text-gray-200 mt-0.5 leading-relaxed font-medium">{toast.message}</p>
              </div>
              <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="p-1 text-gray-400 hover:text-white cursor-pointer absolute top-2 right-2">
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

      </div>
    </ErrorBoundary>
  );
}
