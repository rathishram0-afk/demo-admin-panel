import { supabase } from './supabase.js';
import { getMembershipPlanByName } from '../config/membershipConfig.js';

function calculateDaysLeft(expiryDateStr) {
  if (!expiryDateStr || expiryDateStr === '-') return null;
  const expDate = new Date(expiryDateStr);
  if (isNaN(expDate.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expDate.setHours(0, 0, 0, 0);
  const diffTime = expDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export const membershipService = {
  // Fetch all memberships
  async getMemberships() {
    try {
      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase getMemberships Error:', error.message, error.details, error.hint);
        throw error;
      }

      // Map snake_case database schema fields to camelCase properties for frontend compatibility
      const mapped = (data || []).map(m => {
        let plan = m.membership_plan || '';
        let price = m.price;
        
        // Auto map existing records with old plan names/prices to official plan names and prices
        if (plan.includes('G-FORCE PRO') || plan.includes('Starter') || plan.toLowerCase().includes('monthly') || String(price) === '1499' || String(price) === '1999') {
          plan = 'Monthly Membership';
          price = 1999;
        } else if (plan.includes('WEEKEND') || plan.toLowerCase().includes('3 month') || plan.toLowerCase().includes('three') || String(price) === '799' || String(price) === '499') {
          plan = '3 Month Membership';
          price = 499;
        }
        
        return {
          id: m.id,
          full_name: m.full_name,
          customerName: m.full_name,
          fullName: m.full_name,
          mobile_number: m.mobile_number,
          mobileNumber: m.mobile_number,
          phone: m.mobile_number,
          membership_plan: plan,
          membershipPlan: plan,
          planName: plan,
          preferred_start_date: m.preferred_start_date,
          startDate: m.preferred_start_date,
          preferredStartDate: m.preferred_start_date,
          duration: plan.includes('3 Month') ? '3 Months' : '1 Month',
          price: price,
          status: m.status,
          expiry_date: m.expiry_date,
          expiryDate: m.expiry_date,
          remarks: m.remarks,
          payment_status: m.payment_status,
          paymentStatus: m.payment_status || 'Pending',
          payment_mode: m.payment_mode,
          paymentMode: m.payment_mode || 'Cash',
          createdAt: m.created_at,
          daysLeft: calculateDaysLeft(m.expiry_date)
        };
      });

      return mapped;
    } catch (err) {
      console.error('Error fetching memberships:', err);
      throw err;
    }
  },

  // Submit a new membership request
  async createMembership(formData) {
    try {
      const planInfo = getMembershipPlanByName(formData.membershipPlan || formData.membership_plan);

      // Determine initial start date
      const startDateStr = formData.preferredStartDate || formData.startDate || formData.preferred_start_date || new Date().toISOString().split('T')[0];
      
      // Calculate expiry date if the admin is adding an immediately active/approved member
      let expiryDateStr = null;
      const isAdminAdd = formData.isAdminAdd || false;
      const isApproved = formData.status === 'Approved' || formData.status === 'Active';
      
      if (isAdminAdd && isApproved) {
        const startDate = new Date(startDateStr);
        const expiryDate = new Date(startDate);
        if (planInfo.name.toLowerCase().includes('monthly')) {
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        } else if (planInfo.name.toLowerCase().includes('3 month')) {
          expiryDate.setMonth(expiryDate.getMonth() + 3);
        } else {
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        }
        expiryDateStr = expiryDate.toISOString().split('T')[0];
      }

      const newMembership = {
        full_name: (formData.full_name || formData.customerName || formData.fullName || '').trim(),
        mobile_number: (formData.mobile_number || formData.mobileNumber || formData.phone || '').trim(),
        membership_plan: planInfo.name,
        preferred_start_date: startDateStr,
        duration: planInfo.duration,
        price: planInfo.price,
        status: formData.status || 'Pending',
        remarks: formData.remarks || null,
        payment_status: isApproved ? 'Paid' : (formData.paymentStatus || 'Pending'),
        payment_mode: formData.paymentMode || formData.payment_mode || 'Cash',
        expiry_date: expiryDateStr
      };

      const { data, error } = await supabase
        .from('memberships')
        .insert([newMembership])
        .select();

      if (error) {
        console.error('Supabase createMembership Error:', error.message, error.details, error.hint);
        throw error;
      }

      const created = data?.[0] || newMembership;
      try {
        const { sessionService } = await import('./sessionService');
        await sessionService.addNotification('Membership Created', `Membership created for ${created.full_name || 'Member'} (${created.membership_plan}).`, 'SUCCESS');
      } catch (notifErr) {
        console.error('Failed to trigger notification for membership creation:', notifErr);
      }

      return created;
    } catch (err) {
      console.error('Failed to create membership in Supabase:', err);
      throw err;
    }
  },

  async renewMembership(id) {
    return this.updateMembershipStatus(id, 'Active');
  },

  // Update status (Pending, Approved, Expired, Active, Suspended, Rejected, Cancelled)
  async updateMembershipStatus(id, newStatus) {
    try {
      const updatePayload = { status: newStatus };

      // Calculate expiry date if the membership is being Approved or Activated
      if (newStatus === 'Active' || newStatus === 'Approved') {
        const { data: members, error: fetchErr } = await supabase
          .from('memberships')
          .select('*')
          .eq('id', id)
          .limit(1);

        const member = members?.[0];

        if (fetchErr) {
          console.error('Supabase fetch member error during update:', fetchErr.message, fetchErr.details, fetchErr.hint);
          throw fetchErr;
        }

        if (member) {
          const startDateStr = member.preferred_start_date || new Date().toISOString().split('T')[0];
          const startDate = new Date(startDateStr);
          const expiryDate = new Date(startDate);
          let planName = member.membership_plan || '';
          if (planName.includes('G-FORCE PRO') || planName.includes('Starter') || planName.toLowerCase().includes('monthly')) {
            planName = 'Monthly Membership';
          } else if (planName.includes('WEEKEND') || planName.toLowerCase().includes('3 month') || planName.toLowerCase().includes('three')) {
            planName = '3 Month Membership';
          }

          if (planName === '3 Month Membership') {
            expiryDate.setMonth(expiryDate.getMonth() + 3);
          } else {
            expiryDate.setMonth(expiryDate.getMonth() + 1);
          }

          updatePayload.expiry_date = expiryDate.toISOString().split('T')[0];
          updatePayload.payment_status = 'Paid'; // Automatically marked as Paid on approval
        }
      } else if (newStatus === 'Rejected') {
        updatePayload.payment_status = 'Refunded'; // Auto-refund on rejection if pre-paid
      }

      const { data, error } = await supabase
        .from('memberships')
        .update(updatePayload)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Supabase updateMembershipStatus Error:', error.message, error.details, error.hint);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Update failed: No rows were updated. This is likely blocked by Row-Level Security (RLS) policies in your Supabase dashboard.');
      }

      if (newStatus === 'Expired') {
        try {
          const { sessionService } = await import('./sessionService');
          await sessionService.addNotification('Membership Expired', `Membership for ${data[0].full_name || 'Member'} has expired.`, 'ALERT');
        } catch (notifErr) {
          console.error('Failed to trigger notification for membership expiry:', notifErr);
        }
      }
      
      return data;
    } catch (err) {
      console.error('Failed to update membership status:', err);
      throw err;
    }
  },

  // Update full membership details
  async updateMembership(id, updatedFields) {
    try {
      // Map camelCase fields to snake_case fields for Supabase
      const payload = {};
      if (updatedFields.full_name !== undefined) payload.full_name = updatedFields.full_name;
      if (updatedFields.customerName !== undefined) payload.full_name = updatedFields.customerName;
      if (updatedFields.fullName !== undefined) payload.full_name = updatedFields.fullName;
      
      if (updatedFields.mobile_number !== undefined) payload.mobile_number = updatedFields.mobile_number;
      if (updatedFields.mobileNumber !== undefined) payload.mobile_number = updatedFields.mobileNumber;
      if (updatedFields.phone !== undefined) payload.mobile_number = updatedFields.phone;
      
      if (updatedFields.membership_plan !== undefined) payload.membership_plan = updatedFields.membership_plan;
      if (updatedFields.membershipPlan !== undefined) payload.membership_plan = updatedFields.membershipPlan;
      if (updatedFields.planName !== undefined) payload.membership_plan = updatedFields.planName;
      
      if (updatedFields.preferred_start_date !== undefined) payload.preferred_start_date = updatedFields.preferred_start_date;
      if (updatedFields.preferredStartDate !== undefined) payload.preferred_start_date = updatedFields.preferredStartDate;
      if (updatedFields.startDate !== undefined) payload.preferred_start_date = updatedFields.startDate;
      
      if (updatedFields.status !== undefined) payload.status = updatedFields.status;
      if (updatedFields.paymentMode !== undefined) payload.payment_mode = updatedFields.paymentMode;
      if (updatedFields.payment_mode !== undefined) payload.payment_mode = updatedFields.payment_mode;
      
      if (updatedFields.paymentStatus !== undefined) payload.payment_status = updatedFields.paymentStatus;
      if (updatedFields.payment_status !== undefined) payload.payment_status = updatedFields.payment_status;
      if (updatedFields.remarks !== undefined) payload.remarks = updatedFields.remarks;
      if (updatedFields.expiryDate !== undefined) payload.expiry_date = updatedFields.expiryDate;
      if (updatedFields.expiry_date !== undefined) payload.expiry_date = updatedFields.expiry_date;

      // Recalculate expiry_date if status was modified to Active/Approved and expiry_date was not manually provided
      if ((payload.status === 'Active' || payload.status === 'Approved') && !payload.expiry_date) {
        const { data: members, error: fetchErr } = await supabase.from('memberships').select('*').eq('id', id).limit(1);
        if (fetchErr) throw fetchErr;
        const member = members?.[0];
        if (member) {
          const startDateStr = payload.preferred_start_date || member.preferred_start_date || new Date().toISOString().split('T')[0];
          const startDate = new Date(startDateStr);
          const expiryDate = new Date(startDate);
          
          let planName = payload.membership_plan || member.membership_plan || '';
          if (planName.includes('G-FORCE PRO') || planName.includes('Starter') || planName.toLowerCase().includes('monthly')) {
            planName = 'Monthly Membership';
          } else if (planName.includes('WEEKEND') || planName.toLowerCase().includes('3 month') || planName.toLowerCase().includes('three')) {
            planName = '3 Month Membership';
          }

          if (planName === '3 Month Membership') {
            expiryDate.setMonth(expiryDate.getMonth() + 3);
          } else {
            expiryDate.setMonth(expiryDate.getMonth() + 1);
          }
          payload.expiry_date = expiryDate.toISOString().split('T')[0];
          payload.payment_status = 'Paid';
        }
      }

      const { data, error } = await supabase
        .from('memberships')
        .update(payload)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Supabase updateMembership Error:', error.message, error.details, error.hint);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Update failed: No rows were updated. This is likely blocked by Row-Level Security (RLS) policies in your Supabase dashboard.');
      }
      
      return data;
    } catch (err) {
      console.error('Failed to update membership:', err);
      throw err;
    }
  },

  // Delete a membership record
  async deleteMembership(id) {
    try {
      const { data, error } = await supabase
        .from('memberships')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error('Supabase deleteMembership Error:', error.message, error.details, error.hint);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Delete failed: No rows were deleted. This is likely blocked by Row-Level Security (RLS) policies in your Supabase dashboard.');
      }
      
      return data;
    } catch (err) {
      console.error('Failed to delete membership:', err);
      throw err;
    }
  },

  // Scan and mark expired memberships automatically in Supabase
  async checkAndUpdateExpiredMemberships() {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('memberships')
        .select('id')
        .in('status', ['Active', 'Approved'])
        .lt('expiry_date', todayStr);

      if (error) {
        console.error('Supabase checkAndUpdateExpiredMemberships Error:', error);
        return;
      }

      if (data && data.length > 0) {
        const ids = data.map(m => m.id);
        const { error: updateError } = await supabase
          .from('memberships')
          .update({ status: 'Expired' })
          .in('id', ids);

        if (updateError) {
          console.error('Failed to auto-expire memberships:', updateError);
        } else {
          try {
            const { sessionService } = await import('./sessionService');
            await sessionService.addNotification('Membership Expired', `${data.length} membership(s) automatically expired today.`, 'ALERT');
          } catch (notifErr) {
            console.error('Failed to trigger notification for auto-expired memberships:', notifErr);
          }
        }
      }
    } catch (err) {
      console.error('Error auto-expiring memberships:', err);
    }
  },

  // Calculate metrics
  async getMembershipMetrics() {
    try {
      const memberships = await this.getMemberships();
      
      const totalMemberships = memberships.length;
      const pendingMemberships = memberships.filter(m => m.status === 'Pending').length;
      const activeMemberships = memberships.filter(m => m.status === 'Active' || m.status === 'Approved').length;
      const expiredMemberships = memberships.filter(m => m.status === 'Expired').length;
      
      const membershipRevenue = memberships
        .filter(m => m.status === 'Approved' || m.status === 'Active' || m.status === 'Expired')
        .reduce((sum, m) => sum + (Number(m.price) || 0), 0);

      const todayNewMembers = memberships.filter(m => {
        const createdDate = m.createdAt ? new Date(m.createdAt) : null;
        if (!createdDate) return false;
        const today = new Date();
        return createdDate.toDateString() === today.toDateString();
      }).length;

      // Check for expiring soon
      let needsAttention = false;
      const expSoonCount = memberships.filter(m => {
        if (m.status !== 'Approved' && m.status !== 'Active') return false;
        const days = m.daysLeft;
        return days !== null && days <= 5 && days > 0;
      }).length;

      if (expSoonCount > 0) needsAttention = true;
      if (pendingMemberships > 0) needsAttention = true;

      return {
        totalMemberships,
        pendingMemberships,
        activeMemberships,
        expiredMemberships,
        membershipRevenue,
        todayNewMembers,
        needsAttention
      };
    } catch (err) {
      console.error('Failed to calculate metrics:', err);
      return { 
        totalMemberships: 0, 
        pendingMemberships: 0,
        activeMemberships: 0, 
        expiredMemberships: 0,
        membershipRevenue: 0,
        todayNewMembers: 0,
        needsAttention: false 
      };
    }
  },

  async checkMemberDiscount(identifier) {
    if (!identifier) return { hasDiscount: false, isMonthly: false };
    const query = String(identifier).trim().toLowerCase();
    
    try {
      const list = await this.getMemberships();
      const matched = list.find(m => {
        if (m.status !== 'Active' && m.status !== 'Approved') return false;
        const phone = String(m.mobile_number || '').toLowerCase();
        const name = String(m.full_name || '').toLowerCase();
        return phone === query || name === query || name.includes(query);
      });

      if (!matched) return { hasDiscount: false, isMonthly: false };

      if (matched.membership_plan.toLowerCase().includes('3 month')) {
        return {
          hasDiscount: true,
          discountPercent: 20,
          member: matched,
          memberName: matched.full_name,
          planName: matched.membership_plan
        };
      } else if (matched.membership_plan.toLowerCase().includes('monthly')) {
        const remarksStr = matched.remarks || '';
        const curHours = remarksStr.includes('Remaining Hours:')
          ? Number(remarksStr.split('Remaining Hours:')[1].trim())
          : 25;
        return {
          hasDiscount: false,
          isMonthly: true,
          remainingHours: curHours,
          member: matched,
          memberName: matched.full_name,
          planName: matched.membership_plan
        };
      }
    } catch (e) {
      console.error('Error checking member discount:', e);
    }
    return { hasDiscount: false, isMonthly: false };
  },

  async deductMonthlyHours(identifier, durationHours) {
    if (!identifier) return;
    const query = String(identifier).trim().toLowerCase();
    
    try {
      const list = await this.getMemberships();
      const matched = list.find(m => {
        if (m.status !== 'Active' && m.status !== 'Approved') return false;
        const phone = String(m.mobile_number || '').toLowerCase();
        const name = String(m.full_name || '').toLowerCase();
        return (phone === query || name === query || name.includes(query)) && m.membership_plan.toLowerCase().includes('monthly');
      });

      if (matched) {
        const remarksStr = matched.remarks || '';
        const cur = remarksStr.includes('Remaining Hours:')
          ? Number(remarksStr.split('Remaining Hours:')[1].trim())
          : 25;
        const newRem = Math.max(0, cur - Number(durationHours));
        
        await this.updateMembership(matched.id, {
          remarks: `Remaining Hours: ${newRem}`,
          status: newRem === 0 ? 'Expired' : matched.status
        });
      }
    } catch (e) {
      console.error('Error in deductMonthlyHours:', e);
    }
  }
};
