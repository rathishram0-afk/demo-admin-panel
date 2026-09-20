var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/services/supabase.js
import { createClient } from "@supabase/supabase-js";
var supabaseUrl, supabaseKey, supabase;
var init_supabase = __esm({
  "src/services/supabase.js"() {
    supabaseUrl = "https://rxtlqtsolgytphwixqux.supabase.co";
    supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4dGxxdHNvbGd5dHBod2l4cXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NTAxNDMsImV4cCI6MjA2ODIyNjE0M30.K9eSvew5U1Y2JngGvY_2-Yn14H_q3K7XNIsW4a2-gV0";
    supabase = createClient(
      supabaseUrl,
      supabaseKey
    );
  }
});

// src/services/bookingService.js
var bookingService_exports = {};
__export(bookingService_exports, {
  bookingService: () => bookingService
});
var bookingService;
var init_bookingService = __esm({
  "src/services/bookingService.js"() {
    init_supabase();
    bookingService = {
      // Fetch all bookings
      async getBookings() {
        try {
          const { data, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
          if (error) {
            console.error("Supabase getBookings Error:", error);
            return [];
          }
          return data || [];
        } catch (err) {
          console.error("Error fetching bookings:", err);
          return [];
        }
      },
      // Submit a new booking request
      async createBooking(bookingData) {
        try {
          const newBooking = {
            customer_name: bookingData.name.trim(),
            mobile_number: bookingData.phone.trim(),
            gaming_zone: bookingData.zone,
            booking_date: bookingData.date,
            booking_time: bookingData.time,
            duration: bookingData.hours,
            total_amount: bookingData.price || 100,
            payment_method: null,
            payment_status: "Unpaid",
            booking_status: "Pending"
          };
          const { data, error } = await supabase.from("bookings").insert([newBooking]).select();
          if (error) {
            console.error("Supabase createBooking Error:", error);
            throw error;
          }
          return data?.[0] || newBooking;
        } catch (err) {
          console.error("Failed to create booking in Supabase:", err);
          throw err;
        }
      },
      // Update status (Pending, Approved, Rejected, Completed)
      async updateStatus(bookingId, newStatus) {
        try {
          const { data, error } = await supabase.from("bookings").update({ booking_status: newStatus }).eq("id", bookingId).select();
          if (error) {
            console.error("Supabase updateStatus Error:", error);
            throw error;
          }
          return this.getBookings();
        } catch (err) {
          console.error("Failed to update booking status:", err);
          return this.getBookings();
        }
      },
      // Delete a booking record
      async deleteBooking(bookingId) {
        try {
          const { error } = await supabase.from("bookings").delete().eq("id", bookingId);
          if (error) {
            console.error("Supabase deleteBooking Error:", error);
            throw error;
          }
          return this.getBookings();
        } catch (err) {
          console.error("Failed to delete booking:", err);
          return this.getBookings();
        }
      },
      // Check live availability for a specific zone and date
      async getSlotAvailability(zone, date, timeSlots) {
        try {
          const { data: activeBookings, error } = await supabase.from("bookings").select("booking_time").eq("booking_date", date).eq("gaming_zone", zone).not("booking_status", "in", '("Rejected","Cancelled")');
          if (error) {
            console.error("Supabase getSlotAvailability Error:", error);
            const availability2 = {};
            timeSlots.forEach((slot) => {
              availability2[slot] = "Available";
            });
            return availability2;
          }
          const MAX_CAPACITY = 2;
          const availability = {};
          timeSlots.forEach((slot) => {
            const overlappingBookings = activeBookings.filter((b) => b.booking_time === slot);
            const bookedCount = overlappingBookings.length;
            if (bookedCount === 0) {
              availability[slot] = "Available";
            } else if (bookedCount < MAX_CAPACITY) {
              availability[slot] = "Limited";
            } else {
              availability[slot] = "Fully Booked";
            }
          });
          return availability;
        } catch (err) {
          console.error("Failed to get slot availability:", err);
          const availability = {};
          timeSlots.forEach((slot) => {
            availability[slot] = "Available";
          });
          return availability;
        }
      },
      // Check if a specific new booking conflicts before submit
      async checkConflict(zone, date, time) {
        const availability = await this.getSlotAvailability(zone, date, [time]);
        return availability[time] === "Fully Booked";
      }
    };
  }
});

// src/services/settingsService.js
var settingsService_exports = {};
__export(settingsService_exports, {
  settingsService: () => settingsService
});
var SettingsService, settingsService;
var init_settingsService = __esm({
  "src/services/settingsService.js"() {
    init_supabase();
    SettingsService = class {
      constructor() {
        this.cache = /* @__PURE__ */ new Map();
        this.isCacheValid = false;
      }
      async getAllSettings() {
        if (this.isCacheValid && this.cache.size > 0) {
          return Object.fromEntries(this.cache);
        }
        try {
          const { data, error } = await supabase.from("settings").select("*");
          if (error) throw error;
          this.cache.clear();
          data.forEach((item) => {
            this.cache.set(item.setting_key, item.setting_value);
          });
          this.isCacheValid = true;
          return Object.fromEntries(this.cache);
        } catch (err) {
          console.error("Failed to fetch settings from Supabase:", err);
          return {};
        }
      }
      async getSetting(key) {
        if (this.isCacheValid && this.cache.has(key)) {
          return this.cache.get(key);
        }
        try {
          const { data, error } = await supabase.from("settings").select("setting_value").eq("setting_key", key).limit(1);
          if (error) throw error;
          const val = data && data.length > 0 ? data[0].setting_value : {};
          this.cache.set(key, val);
          return val;
        } catch (err) {
          console.warn(`Failed to fetch setting ${key}, returning empty object.`, err);
          return {};
        }
      }
      async updateSetting(key, value) {
        try {
          const { error } = await supabase.from("settings").upsert(
            { setting_key: key, setting_value: value },
            { onConflict: "setting_key" }
          );
          if (error) throw error;
          this.cache.set(key, value);
          return true;
        } catch (err) {
          console.error(`Failed to update setting ${key}:`, err);
          return false;
        }
      }
      invalidateCache() {
        this.isCacheValid = false;
        this.cache.clear();
      }
    };
    settingsService = new SettingsService();
  }
});

// src/services/sessionService.js
init_supabase();

// src/services/deviceService.js
init_supabase();
var INITIAL_DEVICES = [
  { device_code: "PS5-1", device_name: "PS5 - 1", zone: "PlayStation 5", category: "PlayStation 5", platform: "PlayStation 5", status: "AVAILABLE", is_active: true, display_order: 1, image_url: "/admin/ps5-admin.webp" },
  { device_code: "PS5-2", device_name: "PS5 - 2", zone: "PlayStation 5", category: "PlayStation 5", platform: "PlayStation 5", status: "AVAILABLE", is_active: true, display_order: 2, image_url: "/admin/ps5-admin.webp" },
  { device_code: "PS5-3", device_name: "PS5 - 3", zone: "PlayStation 5", category: "PlayStation 5", platform: "PlayStation 5", status: "AVAILABLE", is_active: true, display_order: 3, image_url: "/admin/ps5-admin.webp" },
  { device_code: "PS5-4", device_name: "PS5 - 4", zone: "PlayStation 5", category: "PlayStation 5", platform: "PlayStation 5", status: "AVAILABLE", is_active: true, display_order: 4, image_url: "/admin/ps5-admin.webp" },
  { device_code: "PS4-1", device_name: "PS4 - 1", zone: "PlayStation 4", category: "PlayStation 4", platform: "PlayStation 4", status: "AVAILABLE", is_active: true, display_order: 5, image_url: "/admin/ps4-admin.webp" },
  { device_code: "PS2-1", device_name: "PS2 - 1", zone: "PlayStation 2", category: "PlayStation 2", platform: "PlayStation 2", status: "AVAILABLE", is_active: true, display_order: 6, image_url: "/admin/ps2-admin.webp" },
  { device_code: "SIM-1", device_name: "SIM - 1", zone: "Racing Simulator", category: "Racing Simulator", platform: "Racing Simulator", status: "AVAILABLE", is_active: true, display_order: 7, image_url: "/admin/sim1-admin.webp" },
  { device_code: "VR-1", device_name: "VR - 1", zone: "PS VR2", category: "PS VR2", platform: "PS VR2", status: "AVAILABLE", is_active: true, display_order: 8, image_url: "/admin/vr-admin.webp" },
  { device_code: "VR-2", device_name: "VR - 2", zone: "PS VR2", category: "PS VR2", platform: "PS VR2", status: "AVAILABLE", is_active: true, display_order: 9, image_url: "/admin/vr-admin.webp" }
];
var deviceService = {
  _isSeedFailing: false,
  _cachedDevices: null,
  async seedDatabase() {
    try {
      if (this._isSeedFailing) return;
      const { data: existing, error: checkError } = await supabase.from("devices").select("id").limit(1);
      if (checkError) {
        console.warn("Could not check devices table for seeding:", checkError.message || checkError);
        return;
      }
      if (!existing || existing.length === 0) {
        console.log("Seeding initial devices into Supabase...");
        const { error: insertError } = await supabase.from("devices").insert(INITIAL_DEVICES);
        if (insertError) {
          console.error("Seed insert error:", insertError.message || insertError);
          this._isSeedFailing = true;
        } else {
          console.log("Devices successfully seeded to Supabase.");
          this._isSeedFailing = false;
        }
      }
    } catch (err) {
      console.error("Failed to seed devices:", err);
      this._isSeedFailing = true;
    }
  },
  async getDevices(forceRefresh = false) {
    if (!forceRefresh && this._cachedDevices) return this._cachedDevices;
    try {
      const { data, error } = await supabase.from("devices").select("*").order("display_order", { ascending: true });
      if (error) {
        console.error("Supabase getDevices error:", error.message || error);
        if (!this._isSeedFailing) await this.seedDatabase();
        return this._cachedDevices || INITIAL_DEVICES;
      }
      if (!data || data.length === 0) {
        if (!this._isSeedFailing) {
          console.log("No devices found in Supabase. Auto-seeding initial devices...");
          await this.seedDatabase();
          const { data: seededData } = await supabase.from("devices").select("*").order("display_order", { ascending: true });
          if (seededData && seededData.length > 0) {
            this._cachedDevices = seededData;
            return seededData;
          }
        }
        return INITIAL_DEVICES;
      }
      this._cachedDevices = data;
      return data;
    } catch (err) {
      console.error("Failed to fetch devices from Supabase:", err);
      return INITIAL_DEVICES;
    }
  },
  async createDevice(deviceData) {
    try {
      const { data: existingRecords } = await supabase.from("devices").select("id").eq("device_code", deviceData.device_code).limit(1);
      if (existingRecords && existingRecords.length > 0) {
        throw new Error(`Device code '${deviceData.device_code}' already exists.`);
      }
      const { data, error } = await supabase.from("devices").insert([deviceData]).select();
      if (error) throw error;
      return data?.[0] || deviceData;
    } catch (err) {
      console.error("Failed to create device:", err);
      throw err;
    }
  },
  async updateDevice(id, updates) {
    try {
      if (updates.device_code) {
        const { data: existingRecords } = await supabase.from("devices").select("id").eq("device_code", updates.device_code).neq("id", id).limit(1);
        if (existingRecords && existingRecords.length > 0) {
          throw new Error(`Device code '${updates.device_code}' already exists.`);
        }
      }
      const { data, error } = await supabase.from("devices").update(updates).eq("id", id).select();
      if (error) throw error;
      return data?.[0] || updates;
    } catch (err) {
      console.error("Failed to update device:", err);
      throw err;
    }
  },
  async deleteDevice(id) {
    try {
      const { error } = await supabase.from("devices").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Failed to delete device:", err);
      throw err;
    }
  },
  async toggleStatus(id, newStatus) {
    try {
      const validStatuses = ["AVAILABLE", "BUSY", "RUNNING", "MAINTENANCE", "OFFLINE"];
      const statusToSet = validStatuses.includes(newStatus.toUpperCase()) ? newStatus.toUpperCase() : "AVAILABLE";
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      const query = supabase.from("devices").update({ status: statusToSet });
      const { data, error } = await (isUuid ? query.eq("id", id) : query.eq("device_code", id)).select();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Failed to toggle device status:", err);
      throw err;
    }
  },
  async toggleActive(id, isActive) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      const query = supabase.from("devices").update({ is_active: isActive });
      const { data, error } = await (isUuid ? query.eq("id", id) : query.eq("device_code", id)).select();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Failed to toggle device active state:", err);
      throw err;
    }
  },
  async getAvailableDevices() {
    const devices = await this.getDevices();
    return devices.filter((d) => d.status === "AVAILABLE" && d.is_active !== false);
  },
  async getBusyDevices() {
    const devices = await this.getDevices();
    return devices.filter((d) => d.status === "BUSY" || d.status === "ACTIVE" || d.status === "RUNNING" || d.status === "ENDING_SOON");
  },
  async getMaintenanceDevices() {
    const devices = await this.getDevices();
    return devices.filter((d) => d.status === "MAINTENANCE");
  }
};

// src/services/membershipService.js
init_supabase();

// src/config/membershipConfig.js
var MEMBERSHIP_PLANS = {
  monthly: {
    id: "monthly",
    name: "Monthly Membership",
    price: 1999,
    duration: "1 Month"
  },
  threeMonth: {
    id: "threeMonth",
    name: "3 Month Membership",
    price: 499,
    duration: "3 Months"
  }
};
var getMembershipPlanByName = (name) => {
  return Object.values(MEMBERSHIP_PLANS).find((plan) => plan.name === name) || MEMBERSHIP_PLANS.monthly;
};

// src/services/membershipService.js
function calculateDaysLeft(expiryDateStr) {
  if (!expiryDateStr || expiryDateStr === "-") return null;
  const expDate = new Date(expiryDateStr);
  if (isNaN(expDate.getTime())) return null;
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  expDate.setHours(0, 0, 0, 0);
  const diffTime = expDate - today;
  return Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
}
var membershipService = {
  // Fetch all memberships
  async getMemberships() {
    try {
      const { data, error } = await supabase.from("memberships").select("*").order("created_at", { ascending: false });
      if (error) {
        console.error("Supabase getMemberships Error:", error.message, error.details, error.hint);
        throw error;
      }
      const mapped = (data || []).map((m) => {
        let plan = m.membership_plan || "";
        let price = m.price;
        if (plan.includes("G-FORCE PRO") || plan.includes("Starter") || plan.toLowerCase().includes("monthly") || String(price) === "1499" || String(price) === "1999") {
          plan = "Monthly Membership";
          price = 1999;
        } else if (plan.includes("WEEKEND") || plan.toLowerCase().includes("3 month") || plan.toLowerCase().includes("three") || String(price) === "799" || String(price) === "499") {
          plan = "3 Month Membership";
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
          duration: plan.includes("3 Month") ? "3 Months" : "1 Month",
          price,
          status: m.status,
          expiry_date: m.expiry_date,
          expiryDate: m.expiry_date,
          remarks: m.remarks,
          payment_status: m.payment_status,
          paymentStatus: m.payment_status || "Pending",
          payment_mode: m.payment_mode,
          paymentMode: m.payment_mode || "Cash",
          createdAt: m.created_at,
          daysLeft: calculateDaysLeft(m.expiry_date)
        };
      });
      return mapped;
    } catch (err) {
      console.error("Error fetching memberships:", err);
      throw err;
    }
  },
  // Submit a new membership request
  async createMembership(formData) {
    try {
      const planInfo = getMembershipPlanByName(formData.membershipPlan || formData.membership_plan);
      const startDateStr = formData.preferredStartDate || formData.startDate || formData.preferred_start_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      let expiryDateStr = null;
      const isAdminAdd = formData.isAdminAdd || false;
      const isApproved = formData.status === "Approved" || formData.status === "Active";
      if (isAdminAdd && isApproved) {
        const startDate = new Date(startDateStr);
        const expiryDate = new Date(startDate);
        if (planInfo.name.toLowerCase().includes("monthly")) {
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        } else if (planInfo.name.toLowerCase().includes("3 month")) {
          expiryDate.setMonth(expiryDate.getMonth() + 3);
        } else {
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        }
        expiryDateStr = expiryDate.toISOString().split("T")[0];
      }
      const newMembership = {
        full_name: (formData.full_name || formData.customerName || formData.fullName || "").trim(),
        mobile_number: (formData.mobile_number || formData.mobileNumber || formData.phone || "").trim(),
        membership_plan: planInfo.name,
        preferred_start_date: startDateStr,
        duration: planInfo.duration,
        price: planInfo.price,
        status: formData.status || "Pending",
        remarks: formData.remarks || null,
        payment_status: isApproved ? "Paid" : formData.paymentStatus || "Pending",
        payment_mode: formData.paymentMode || formData.payment_mode || "Cash",
        expiry_date: expiryDateStr
      };
      const { data, error } = await supabase.from("memberships").insert([newMembership]).select();
      if (error) {
        console.error("Supabase createMembership Error:", error.message, error.details, error.hint);
        throw error;
      }
      return data?.[0] || newMembership;
    } catch (err) {
      console.error("Failed to create membership in Supabase:", err);
      throw err;
    }
  },
  async renewMembership(id) {
    return this.updateMembershipStatus(id, "Active");
  },
  // Update status (Pending, Approved, Expired, Active, Suspended, Rejected, Cancelled)
  async updateMembershipStatus(id, newStatus) {
    try {
      const updatePayload = { status: newStatus };
      if (newStatus === "Active" || newStatus === "Approved") {
        const { data: members, error: fetchErr } = await supabase.from("memberships").select("*").eq("id", id).limit(1);
        const member = members?.[0];
        if (fetchErr) {
          console.error("Supabase fetch member error during update:", fetchErr.message, fetchErr.details, fetchErr.hint);
          throw fetchErr;
        }
        if (member) {
          const startDateStr = member.preferred_start_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
          const startDate = new Date(startDateStr);
          const expiryDate = new Date(startDate);
          let planName = member.membership_plan || "";
          if (planName.includes("G-FORCE PRO") || planName.includes("Starter") || planName.toLowerCase().includes("monthly")) {
            planName = "Monthly Membership";
          } else if (planName.includes("WEEKEND") || planName.toLowerCase().includes("3 month") || planName.toLowerCase().includes("three")) {
            planName = "3 Month Membership";
          }
          if (planName === "3 Month Membership") {
            expiryDate.setMonth(expiryDate.getMonth() + 3);
          } else {
            expiryDate.setMonth(expiryDate.getMonth() + 1);
          }
          updatePayload.expiry_date = expiryDate.toISOString().split("T")[0];
          updatePayload.payment_status = "Paid";
        }
      } else if (newStatus === "Rejected") {
        updatePayload.payment_status = "Refunded";
      }
      const { data, error } = await supabase.from("memberships").update(updatePayload).eq("id", id).select();
      if (error) {
        console.error("Supabase updateMembershipStatus Error:", error.message, error.details, error.hint);
        throw error;
      }
      if (!data || data.length === 0) {
        throw new Error("Update failed: No rows were updated. This is likely blocked by Row-Level Security (RLS) policies in your Supabase dashboard.");
      }
      return data;
    } catch (err) {
      console.error("Failed to update membership status:", err);
      throw err;
    }
  },
  // Update full membership details
  async updateMembership(id, updatedFields) {
    try {
      const payload = {};
      if (updatedFields.full_name !== void 0) payload.full_name = updatedFields.full_name;
      if (updatedFields.customerName !== void 0) payload.full_name = updatedFields.customerName;
      if (updatedFields.fullName !== void 0) payload.full_name = updatedFields.fullName;
      if (updatedFields.mobile_number !== void 0) payload.mobile_number = updatedFields.mobile_number;
      if (updatedFields.mobileNumber !== void 0) payload.mobile_number = updatedFields.mobileNumber;
      if (updatedFields.phone !== void 0) payload.mobile_number = updatedFields.phone;
      if (updatedFields.membership_plan !== void 0) payload.membership_plan = updatedFields.membership_plan;
      if (updatedFields.membershipPlan !== void 0) payload.membership_plan = updatedFields.membershipPlan;
      if (updatedFields.planName !== void 0) payload.membership_plan = updatedFields.planName;
      if (updatedFields.preferred_start_date !== void 0) payload.preferred_start_date = updatedFields.preferred_start_date;
      if (updatedFields.preferredStartDate !== void 0) payload.preferred_start_date = updatedFields.preferredStartDate;
      if (updatedFields.startDate !== void 0) payload.preferred_start_date = updatedFields.startDate;
      if (updatedFields.status !== void 0) payload.status = updatedFields.status;
      if (updatedFields.paymentMode !== void 0) payload.payment_mode = updatedFields.paymentMode;
      if (updatedFields.payment_mode !== void 0) payload.payment_mode = updatedFields.payment_mode;
      if (updatedFields.paymentStatus !== void 0) payload.payment_status = updatedFields.paymentStatus;
      if (updatedFields.payment_status !== void 0) payload.payment_status = updatedFields.payment_status;
      if (updatedFields.remarks !== void 0) payload.remarks = updatedFields.remarks;
      if (updatedFields.expiryDate !== void 0) payload.expiry_date = updatedFields.expiryDate;
      if (updatedFields.expiry_date !== void 0) payload.expiry_date = updatedFields.expiry_date;
      if ((payload.status === "Active" || payload.status === "Approved") && !payload.expiry_date) {
        const { data: members, error: fetchErr } = await supabase.from("memberships").select("*").eq("id", id).limit(1);
        if (fetchErr) throw fetchErr;
        const member = members?.[0];
        if (member) {
          const startDateStr = payload.preferred_start_date || member.preferred_start_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
          const startDate = new Date(startDateStr);
          const expiryDate = new Date(startDate);
          let planName = payload.membership_plan || member.membership_plan || "";
          if (planName.includes("G-FORCE PRO") || planName.includes("Starter") || planName.toLowerCase().includes("monthly")) {
            planName = "Monthly Membership";
          } else if (planName.includes("WEEKEND") || planName.toLowerCase().includes("3 month") || planName.toLowerCase().includes("three")) {
            planName = "3 Month Membership";
          }
          if (planName === "3 Month Membership") {
            expiryDate.setMonth(expiryDate.getMonth() + 3);
          } else {
            expiryDate.setMonth(expiryDate.getMonth() + 1);
          }
          payload.expiry_date = expiryDate.toISOString().split("T")[0];
          payload.payment_status = "Paid";
        }
      }
      const { data, error } = await supabase.from("memberships").update(payload).eq("id", id).select();
      if (error) {
        console.error("Supabase updateMembership Error:", error.message, error.details, error.hint);
        throw error;
      }
      if (!data || data.length === 0) {
        throw new Error("Update failed: No rows were updated. This is likely blocked by Row-Level Security (RLS) policies in your Supabase dashboard.");
      }
      return data;
    } catch (err) {
      console.error("Failed to update membership:", err);
      throw err;
    }
  },
  // Delete a membership record
  async deleteMembership(id) {
    try {
      const { data, error } = await supabase.from("memberships").delete().eq("id", id).select();
      if (error) {
        console.error("Supabase deleteMembership Error:", error.message, error.details, error.hint);
        throw error;
      }
      if (!data || data.length === 0) {
        throw new Error("Delete failed: No rows were deleted. This is likely blocked by Row-Level Security (RLS) policies in your Supabase dashboard.");
      }
      return data;
    } catch (err) {
      console.error("Failed to delete membership:", err);
      throw err;
    }
  },
  // Scan and mark expired memberships automatically in Supabase
  async checkAndUpdateExpiredMemberships() {
    try {
      const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const { data, error } = await supabase.from("memberships").select("id").in("status", ["Active", "Approved"]).lt("expiry_date", todayStr);
      if (error) {
        console.error("Supabase checkAndUpdateExpiredMemberships Error:", error);
        return;
      }
      if (data && data.length > 0) {
        const ids = data.map((m) => m.id);
        const { error: updateError } = await supabase.from("memberships").update({ status: "Expired" }).in("id", ids);
        if (updateError) {
          console.error("Failed to auto-expire memberships:", updateError);
        }
      }
    } catch (err) {
      console.error("Error auto-expiring memberships:", err);
    }
  },
  // Calculate metrics
  async getMembershipMetrics() {
    try {
      const memberships = await this.getMemberships();
      const totalMemberships = memberships.length;
      const pendingMemberships = memberships.filter((m) => m.status === "Pending").length;
      const activeMemberships = memberships.filter((m) => m.status === "Active" || m.status === "Approved").length;
      const expiredMemberships = memberships.filter((m) => m.status === "Expired").length;
      const membershipRevenue = memberships.filter((m) => m.status === "Approved" || m.status === "Active" || m.status === "Expired").reduce((sum, m) => sum + (Number(m.price) || 0), 0);
      const todayNewMembers = memberships.filter((m) => {
        const createdDate = m.createdAt ? new Date(m.createdAt) : null;
        if (!createdDate) return false;
        const today = /* @__PURE__ */ new Date();
        return createdDate.toDateString() === today.toDateString();
      }).length;
      let needsAttention = false;
      const expSoonCount = memberships.filter((m) => {
        if (m.status !== "Approved" && m.status !== "Active") return false;
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
      console.error("Failed to calculate metrics:", err);
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
      const matched = list.find((m) => {
        if (m.status !== "Active" && m.status !== "Approved") return false;
        const phone = String(m.mobile_number || "").toLowerCase();
        const name = String(m.full_name || "").toLowerCase();
        return phone === query || name === query || name.includes(query);
      });
      if (!matched) return { hasDiscount: false, isMonthly: false };
      if (matched.membership_plan.toLowerCase().includes("3 month")) {
        return {
          hasDiscount: true,
          discountPercent: 20,
          member: matched,
          memberName: matched.full_name,
          planName: matched.membership_plan
        };
      } else if (matched.membership_plan.toLowerCase().includes("monthly")) {
        const remarksStr = matched.remarks || "";
        const curHours = remarksStr.includes("Remaining Hours:") ? Number(remarksStr.split("Remaining Hours:")[1].trim()) : 25;
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
      console.error("Error checking member discount:", e);
    }
    return { hasDiscount: false, isMonthly: false };
  },
  async deductMonthlyHours(identifier, durationHours) {
    if (!identifier) return;
    const query = String(identifier).trim().toLowerCase();
    try {
      const list = await this.getMemberships();
      const matched = list.find((m) => {
        if (m.status !== "Active" && m.status !== "Approved") return false;
        const phone = String(m.mobile_number || "").toLowerCase();
        const name = String(m.full_name || "").toLowerCase();
        return (phone === query || name === query || name.includes(query)) && m.membership_plan.toLowerCase().includes("monthly");
      });
      if (matched) {
        const remarksStr = matched.remarks || "";
        const cur = remarksStr.includes("Remaining Hours:") ? Number(remarksStr.split("Remaining Hours:")[1].trim()) : 25;
        const newRem = Math.max(0, cur - Number(durationHours));
        await this.updateMembership(matched.id, {
          remarks: `Remaining Hours: ${newRem}`,
          status: newRem === 0 ? "Expired" : matched.status
        });
      }
    } catch (e) {
      console.error("Error in deductMonthlyHours:", e);
    }
  }
};

// src/services/sessionService.js
var STORAGE_KEYS = {
  STATIONS: "gforce_pos_stations_v6",
  REVENUE: "gforce_pos_revenue_v6",
  WALKINS: "gforce_pos_walkins_v6",
  ACTIVITIES: "gforce_pos_activities_v6",
  SESSION_COUNTER: "gforce_pos_session_counter_v6",
  NOTIFICATIONS: "gforce_pos_notifications_v6",
  BOOKINGS: "gforce_pos_bookings_v6",
  CONTROLLERS: "gforce_pos_controllers_v6",
  PRICING: "gforce_pos_pricing_v6",
  SOUND_SETTINGS: "gforce_pos_sound_settings_v6"
};
var DEFAULT_CONTROLLER_INVENTORY = {
  totalControllers: 20,
  maintenanceControllers: 0,
  brokenControllers: 0,
  reservedControllers: 0
};
var DEFAULT_PRICING_SETTINGS = {
  pricingMode: "AUTO",
  weekday: {
    "PlayStation 5": { 60: 100, 120: 180, 180: 280 },
    "PlayStation 4": { 60: 80, 120: 150, 180: 220 },
    "PlayStation 2": { 60: 60, 120: 110, 180: 160 },
    "Racing Simulator": { 30: 100, 60: 180, 120: 250 },
    "PS VR2": { 20: 100, 40: 160, 60: 220 }
  },
  weekend: {
    "PlayStation 5": { 60: 100, 120: 200, 180: 280 },
    "PlayStation 4": { 60: 90, 120: 160, 180: 220 },
    "PlayStation 2": { 60: 70, 120: 120, 180: 160 },
    "Racing Simulator": { 30: 100, 60: 180, 120: 250 },
    "PS VR2": { 20: 100, 40: 160, 60: 220 }
  }
};
var DEFAULT_SOUND_SETTINGS = {
  masterVolume: 80,
  chimesEnabled: true,
  timerAlertsEnabled: true,
  sessionStartSound: true,
  sessionEndSound: true,
  snackAddedSound: true
};
function getItem(key, defaultValue) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}
function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key}:`, e);
  }
}
function isPlayStationCategory(station) {
  const cat = (station.category || station.zone || station.name || station.id || "").toLowerCase();
  return cat.includes("ps5") || cat.includes("ps4") || cat.includes("ps2") || cat.includes("playstation");
}
function resolveDeviceImage(device) {
  if (device.image_url && device.image_url.trim() !== "" && !device.image_url.includes("ps5-admin.webp")) {
    return device.image_url;
  }
  if (device.image && device.image.trim() !== "" && !device.image.includes("ps5-admin.webp")) {
    return device.image;
  }
  const str = (device.category || device.zone || device.platform || device.device_code || device.id || device.name || "").toLowerCase();
  if (str.includes("ps4") || str.includes("playstation 4")) return "/admin/ps4-admin.webp";
  if (str.includes("ps2") || str.includes("playstation 2")) return "/admin/ps2-admin.webp";
  if (str.includes("sim") || str.includes("racing")) return "/admin/sim1-admin.webp";
  if (str.includes("vr")) return "/admin/vr-admin.webp";
  return "/admin/ps5-admin.webp";
}
function playChime(type = "generic") {
  try {
    const settings = getItem(STORAGE_KEYS.SOUND_SETTINGS, DEFAULT_SOUND_SETTINGS);
    if (!settings.chimesEnabled) return;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const volumeLevel = (settings.masterVolume || 80) / 100;
    if (type === "5min") {
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(volumeLevel * 0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(1e-3, audioCtx.currentTime + 0.4);
    } else if (type === "0min") {
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      gain.gain.setValueAtTime(volumeLevel * 0.6, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(1e-3, audioCtx.currentTime + 0.8);
    } else {
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      gain.gain.setValueAtTime(volumeLevel * 0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(1e-3, audioCtx.currentTime + 0.3);
    }
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.8);
  } catch (e) {
    console.log("Audio chime prevented:", e);
  }
}
function getNextSessionId() {
  const curSeq = Number(getItem(STORAGE_KEYS.SESSION_COUNTER, 5)) || 5;
  const nextSeq = curSeq + 1;
  setItem(STORAGE_KEYS.SESSION_COUNTER, nextSeq);
  return `SES-${String(nextSeq).padStart(3, "0")}`;
}
var sessionService = {
  mapStations(dbDevices, activeSessions) {
    const sessionsList = activeSessions || [];
    return (dbDevices || []).map((device) => {
      const activeSession = sessionsList.find((s) => s.device_id === device.device_code || s.device_id === device.id);
      let maxC = 4;
      const cat = (device.category || device.zone || "").toLowerCase();
      if (cat.includes("ps2") || cat.includes("playstation 2")) maxC = 2;
      if (cat.includes("sim") || cat.includes("vr")) maxC = 1;
      const deviceImg = resolveDeviceImage(device);
      if (activeSession) {
        const now = Date.now();
        const startMs = new Date(activeSession.start_time).getTime();
        const elapsedSecs = Math.max(0, Math.floor((now - startMs) / 1e3));
        const totalPlannedMins = Number(activeSession.planned_duration || 60) + Number(activeSession.extended_minutes || 0);
        const remainingSecs = Math.max(0, totalPlannedMins * 60 - elapsedSecs);
        const isEndingSoon = remainingSecs <= 300 && remainingSecs > 0;
        return {
          id: device.device_code || device.id,
          dbId: device.id,
          name: device.device_name || device.name || device.device_code,
          zone: device.zone || device.category || "PlayStation 5",
          category: device.category || device.zone || "PlayStation 5",
          status: "RUNNING",
          currentSessionId: activeSession.session_code || activeSession.id,
          customerName: activeSession.customer_name,
          phone: activeSession.mobile_number,
          startTime: startMs,
          startTimeStr: new Date(activeSession.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          durationMinutes: totalPlannedMins,
          elapsedSeconds: elapsedSecs,
          remainingSeconds: remainingSecs,
          isEndingSoon,
          price: activeSession.gaming_charge || 0,
          currentAmount: activeSession.total_amount || 0,
          hourlyPrice: activeSession.hourly_price,
          type: "Walk-in",
          paymentMethod: activeSession.payment_method,
          playersCount: activeSession.player_count,
          controllersUsed: activeSession.player_count,
          controllersTotal: maxC,
          maxPlayers: maxC,
          players: [activeSession.customer_name],
          snackOrders: activeSession.snack_orders || [],
          snackTotal: activeSession.food_total || 0,
          isPaused: activeSession.session_status === "Paused",
          pausedAt: activeSession.session_status === "Paused" ? activeSession.expected_end_time : null,
          totalPausedMs: 0,
          bookedDuration: "00:00:00",
          notes: "",
          image: deviceImg,
          pricingSnapshot: activeSession.pricing_snapshot,
          memberDiscountInfo: activeSession.member_discount_info,
          alert5MinTriggered: isEndingSoon,
          alert0MinTriggered: remainingSecs === 0,
          reservationInfo: null
        };
      }
      return {
        id: device.device_code || device.id,
        dbId: device.id,
        name: device.device_name || device.name || device.device_code,
        zone: device.zone || device.category || "PlayStation 5",
        category: device.category || device.zone || "PlayStation 5",
        status: device.status || "AVAILABLE",
        currentSessionId: null,
        customerName: null,
        phone: null,
        startTime: null,
        durationMinutes: 0,
        elapsedSeconds: 0,
        remainingSeconds: 0,
        isEndingSoon: false,
        price: 0,
        hourlyPrice: 100,
        type: null,
        paymentMethod: null,
        playersCount: 0,
        controllersUsed: 0,
        controllersTotal: maxC,
        maxPlayers: maxC,
        players: [],
        snackOrders: [],
        snackTotal: 0,
        isPaused: false,
        pausedAt: null,
        totalPausedMs: 0,
        bookedDuration: "00:00:00",
        notes: "",
        image: deviceImg,
        pricingSnapshot: null,
        memberDiscountInfo: null,
        alert5MinTriggered: false,
        alert0MinTriggered: false,
        reservationInfo: null
      };
    }).sort((a, b) => {
      const orderA = a.display_order !== void 0 ? a.display_order : 999;
      const orderB = b.display_order !== void 0 ? b.display_order : 999;
      return orderA - orderB;
    });
  },
  async getStations() {
    try {
      const dbDevices = await deviceService.getDevices();
      const { data: activeSessions, error } = await supabase.from("walkin_sessions").select("*").in("session_status", ["Active", "Paused"]);
      if (error) console.error("Error fetching walkin_sessions in getStations:", error);
      return this.mapStations(dbDevices, activeSessions);
    } catch (e) {
      console.error(e);
      return [];
    }
  },
  async findAvailableStation(deviceZone) {
    try {
      const stations = await this.getStations();
      const zoneClean = (deviceZone || "").toLowerCase();
      const matchingStations = stations.filter((s) => {
        const z = (s.zone || s.category || "").toLowerCase();
        return z === zoneClean || z.includes(zoneClean) || zoneClean.includes(z);
      });
      const available = matchingStations.find((s) => s.status === "AVAILABLE");
      if (available) {
        return { availableStation: available, error: null };
      }
      let errorMsg = `No ${deviceZone} Stations Available`;
      if (zoneClean.includes("racing") || zoneClean.includes("sim")) errorMsg = "Racing Simulator currently occupied or in maintenance.";
      else if (zoneClean.includes("vr")) errorMsg = "All VR Stations are Occupied or in maintenance.";
      else if (zoneClean.includes("5") || zoneClean.includes("ps5")) errorMsg = "No PlayStation 5 Stations Available.";
      else if (zoneClean.includes("4") || zoneClean.includes("ps4")) errorMsg = "PS4 Station Currently Occupied.";
      else if (zoneClean.includes("2") || zoneClean.includes("ps2")) errorMsg = "PS2 Station Currently Occupied.";
      return { availableStation: null, error: errorMsg };
    } catch (e) {
      console.error("Error finding available station:", e);
      return { availableStation: null, error: "Error checking station availability." };
    }
  },
  async toggleMaintenance(stationId) {
    try {
      const stations = await this.getStations();
      const target = stations.find((s) => s.id === stationId);
      if (target && (target.status === "RUNNING" || target.status === "ACTIVE" || target.status === "ENDING_SOON")) {
        throw new Error(`Cannot enable Maintenance on ${stationId} while a session is RUNNING.`);
      }
      const isNowMaint = target?.status !== "MAINTENANCE";
      const newStatus = isNowMaint ? "MAINTENANCE" : "AVAILABLE";
      await deviceService.toggleStatus(stationId, newStatus);
      this.addActivity(`Maintenance Toggled`, `${stationId} is now ${newStatus}`, "ALERT");
      this.addNotification(`Device Maintenance ${isNowMaint ? "Enabled" : "Disabled"}`, `Station ${stationId} is now ${newStatus === "MAINTENANCE" ? "Under Maintenance" : "Available again"}.`, "ALERT");
      return await this.getStations();
    } catch (e) {
      console.error("Error toggling maintenance:", e);
      throw e;
    }
  },
  async addDevice(formData) {
    try {
      const rawName = (formData.name || formData.deviceName || formData.device_name || "").trim();
      if (!rawName) throw new Error("Device Name cannot be empty.");
      const zone = formData.zone || formData.category || "PlayStation 5";
      const code = formData.device_code || formData.id || rawName;
      let localImg = formData.image || formData.image_url || "";
      if (!localImg) {
        localImg = resolveDeviceImage({ category: zone, device_code: code });
      }
      await deviceService.createDevice({
        device_code: code,
        device_name: rawName,
        zone,
        category: zone,
        platform: zone,
        status: formData.status || "AVAILABLE",
        image_url: localImg,
        is_active: true
      });
      this.addActivity("New Device Added", `Station ${rawName} (${zone}) created`, "START");
      this.addNotification("Device Created", `Station ${rawName} (${zone}) was added.`, "SUCCESS");
      return await this.getStations();
    } catch (e) {
      console.error("Error adding device:", e);
      throw e;
    }
  },
  async updateDevice(stationId, updatedFields) {
    try {
      const dbDevices = await deviceService.getDevices();
      const target = dbDevices.find((s) => s.device_code === stationId || s.id === stationId);
      if (!target) throw new Error(`Device ${stationId} not found.`);
      const payload = {};
      if (updatedFields.name || updatedFields.device_name) payload.device_name = updatedFields.name || updatedFields.device_name;
      if (updatedFields.zone || updatedFields.category) {
        payload.zone = updatedFields.zone || updatedFields.category;
        payload.category = updatedFields.zone || updatedFields.category;
        payload.platform = updatedFields.zone || updatedFields.category;
      }
      if (updatedFields.status) payload.status = updatedFields.status;
      if (updatedFields.image || updatedFields.image_url) payload.image_url = updatedFields.image || updatedFields.image_url;
      await deviceService.updateDevice(target.id, payload);
      this.addActivity("Device Updated", `Station ${stationId} updated`, "INFO");
      return await this.getStations();
    } catch (e) {
      console.error("Error updating device:", e);
      throw e;
    }
  },
  async deleteDevice(stationId) {
    try {
      const dbDevices = await deviceService.getDevices();
      const target = dbDevices.find((s) => s.device_code === stationId || s.id === stationId);
      if (!target) throw new Error(`Device ${stationId} not found.`);
      if (target.status === "RUNNING" || target.status === "ACTIVE" || target.status === "BUSY") {
        throw new Error("This device currently has an active session.");
      }
      await deviceService.deleteDevice(target.id);
      this.addActivity("Device Deleted", `Station ${target.device_name || stationId} removed`, "ALERT");
      return await this.getStations();
    } catch (e) {
      console.error("Error deleting device:", e);
      throw e;
    }
  },
  async duplicateDevice(stationId) {
    try {
      const stations = await this.getStations();
      const target = stations.find((s) => s.id === stationId);
      if (!target) throw new Error(`Device ${stationId} not found.`);
      let baseName = target.name || stationId;
      let nextNum = 2;
      let newName = `${baseName}-COPY`;
      const match = baseName.match(/^(.*?)[-\s]?(\d+)$/);
      if (match) {
        const prefix = match[1];
        const num = parseInt(match[2], 10);
        nextNum = num + 1;
        newName = `${prefix}-${nextNum}`;
        while (stations.some((s) => s.id.toLowerCase() === newName.toLowerCase())) {
          nextNum++;
          newName = `${prefix}-${nextNum}`;
        }
      }
      return await this.addDevice({
        device_code: newName,
        device_name: newName,
        zone: target.zone,
        category: target.category,
        status: "AVAILABLE",
        image: target.image
      });
    } catch (e) {
      console.error("Error duplicating device:", e);
      throw e;
    }
  },
  async getDashboardMetrics() {
    try {
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const { data: walkins, error: wError } = await supabase.from("walkin_sessions").select("*");
      const { data: orders, error: oError } = await supabase.from("cafe_orders").select("*");
      const devices = await deviceService.getDevices();
      let todayRevenue = 0;
      let totalPlayers = 0;
      let controllersInUse = 0;
      let totalControllers = 0;
      devices.forEach((d) => {
        let maxC = 4;
        const cat = (d.category || d.zone || "").toLowerCase();
        if (cat.includes("ps2")) maxC = 2;
        if (cat.includes("sim") || cat.includes("vr")) maxC = 1;
        totalControllers += maxC;
      });
      const walkinsList = walkins || [];
      const ordersList = orders || [];
      walkinsList.forEach((w) => {
        if (w.session_status === "Active") {
          totalPlayers += Number(w.player_count || 0);
          controllersInUse += Number(w.player_count || 0);
        }
        const wDate = w.session_date || (w.created_at ? w.created_at.split("T")[0] : "");
        if (w.session_status === "Completed" && wDate === today) {
          todayRevenue += Number(w.total_amount || 0);
        }
      });
      ordersList.forEach((o) => {
        const oDate = o.created_at ? o.created_at.split("T")[0] : "";
        if (o.status === "Completed" && oDate === today) {
          todayRevenue += Number(o.total_amount || 0);
        }
      });
      let onlineBookings = 0;
      try {
        const { bookingService: bookingService2 } = await Promise.resolve().then(() => (init_bookingService(), bookingService_exports));
        const bList = await bookingService2.getBookings();
        onlineBookings = (bList || []).filter((b) => b.booking_status === "Pending" || b.booking_status === "Approved").length;
      } catch (bErr) {
      }
      let activeMemberships = 0;
      let totalMemberships = 0;
      let pendingMemberships = 0;
      let expiredMemberships = 0;
      try {
        const mMetrics = await membershipService.getMembershipMetrics();
        activeMemberships = mMetrics.activeMemberships || 0;
        totalMemberships = mMetrics.totalMemberships || 0;
        pendingMemberships = mMetrics.pendingMemberships || 0;
        expiredMemberships = mMetrics.expiredMemberships || 0;
      } catch (mErr) {
      }
      const activeDevicesCount = walkinsList.filter((w) => w.session_status === "Active").length;
      return {
        todayRevenue,
        runningSessions: activeDevicesCount,
        availableDevices: Math.max(0, devices.length - activeDevicesCount),
        totalPlayers,
        controllersInUse,
        totalControllers: totalControllers || 20,
        availableControllers: Math.max(0, (totalControllers || 20) - controllersInUse),
        onlineBookings,
        activeMemberships,
        totalMemberships,
        pendingMemberships,
        expiredMemberships
      };
    } catch (e) {
      console.error("Supabase getDashboardMetrics Error:", e);
      return { todayRevenue: 0, runningSessions: 0, availableDevices: 0, totalPlayers: 0, controllersInUse: 0, totalControllers: 20, availableControllers: 20, onlineBookings: 0, activeMemberships: 0 };
    }
  },
  async convertBookingToSession({ bookingId, stationId, operator, notes }) {
    try {
      const { bookingService: bookingService2 } = await Promise.resolve().then(() => (init_bookingService(), bookingService_exports));
      const bookings = await bookingService2.getBookings();
      const booking = bookings.find((b) => b.id === bookingId || b.bookingId === bookingId);
      if (!booking) throw new Error("Booking not found.");
      await bookingService2.updateStatus(booking.id, "Completed");
      const numPlayers = booking.gaming_zone && booking.gaming_zone.includes("Multiplayer") ? 2 : 1;
      const durationMinutes = Number(booking.duration) * 60;
      return await this.startWalkInSession({
        stationId,
        customerName: booking.customer_name,
        phone: booking.mobile_number,
        numPlayers,
        durationMinutes,
        estimatedTotal: booking.total_amount,
        notes: notes || `Converted from Online Booking ${bookingId}`,
        paymentMethod: "Cash"
      });
    } catch (e) {
      console.error("Error converting booking to session:", e);
      throw e;
    }
  },
  async startWalkInSession({ stationId, customerName, phone, numPlayers, durationMinutes, hourlyPrice, estimatedTotal, notes, paymentMethod }) {
    try {
      const dbDevices = await deviceService.getDevices();
      const targetStation = dbDevices.find((s) => s.device_code === stationId || s.id === stationId);
      if (targetStation && (targetStation.status === "BUSY" || targetStation.status === "RUNNING" || targetStation.status === "MAINTENANCE")) {
        throw new Error(`${targetStation.device_name || stationId} is currently not available.`);
      }
      const deviceZone = targetStation?.zone || targetStation?.category || "PlayStation 5";
      const durMins = Number(durationMinutes) || 60;
      const { pricePerPlayer: dynamicPrice, isWeekend, tierName } = await this.getPriceForSession(deviceZone, durMins);
      const pricePerPlayer = hourlyPrice ? Number(hourlyPrice) : dynamicPrice;
      const playersNum = Number(numPlayers) || 1;
      const originalGamingAmount = estimatedTotal ? Number(estimatedTotal) : Math.round(pricePerPlayer * playersNum);
      let discountPercent = 0;
      let discountAmount = 0;
      let totalAmount = originalGamingAmount;
      let memberDiscountInfo = null;
      try {
        const memberCheck = await membershipService.checkMemberDiscount(phone || customerName);
        if (memberCheck.hasDiscount) {
          discountPercent = memberCheck.discountPercent || 20;
          discountAmount = Math.round(originalGamingAmount * (discountPercent / 100));
          totalAmount = originalGamingAmount - discountAmount;
          memberDiscountInfo = {
            isMember: true,
            discountPercent,
            originalGamingAmount,
            discountAmount,
            memberPlan: memberCheck.planName,
            memberName: memberCheck.memberName
          };
        } else if (memberCheck.isMonthly) {
          memberDiscountInfo = {
            isMonthly: true,
            remainingHours: memberCheck.remainingHours,
            memberPlan: memberCheck.planName,
            memberName: memberCheck.memberName
          };
        }
      } catch (mErr) {
        console.warn("Member check skipped:", mErr);
      }
      const newSessionCode = getNextSessionId();
      const pricingSnapshot = { hourlyPrice: pricePerPlayer, pricePerPlayer, durationMinutes: durMins, tierName, isWeekend };
      const { data, error } = await supabase.from("walkin_sessions").insert([{
        session_code: newSessionCode,
        customer_name: customerName || "Walk-in Player",
        mobile_number: phone || "-",
        device_id: targetStation.id,
        // Store correct device UUID
        device_name: targetStation?.device_name || targetStation?.name || stationId,
        device_type: deviceZone,
        player_count: playersNum,
        planned_duration: durMins,
        hourly_price: pricePerPlayer,
        total_amount: totalAmount,
        gaming_charge: totalAmount,
        payment_method: paymentMethod || "Cash",
        session_status: "Active",
        pricing_snapshot: pricingSnapshot,
        member_discount_info: memberDiscountInfo
      }]).select();
      if (error) throw error;
      await deviceService.toggleStatus(stationId, "RUNNING");
      this.addActivity(`Session ${newSessionCode} Started`, `Station ${stationId} started (Billed \u20B9${totalAmount})`, "START");
      playChime("generic");
      return await this.getStations();
    } catch (e) {
      console.error("Error starting walk-in session:", e);
      throw e;
    }
  },
  async endSession(stationId, paymentMethod = "Cash") {
    try {
      const dbDevices = await deviceService.getDevices();
      const targetStation = dbDevices.find((s) => s.device_code === stationId || s.id === stationId);
      if (!targetStation) throw new Error(`Device ${stationId} not found.`);
      const { data: activeSessions, error: fetchErr } = await supabase.from("walkin_sessions").select("*").or(`device_id.eq.${targetStation.id},device_id.eq.${targetStation.device_code},device_name.ilike.%${targetStation.device_code}%`).eq("session_status", "Active").limit(1);
      if (fetchErr) throw fetchErr;
      if (!activeSessions || activeSessions.length === 0) throw new Error(`No active session found for ${stationId}.`);
      const activeSession = activeSessions[0];
      if (activeSession.member_discount_info && activeSession.member_discount_info.isMonthly) {
        const playedHours = (activeSession.planned_duration + (activeSession.extended_minutes || 0)) / 60;
        await membershipService.deductMonthlyHours(activeSession.mobile_number || activeSession.customer_name, playedHours);
      }
      let safePaymentMethod = paymentMethod || "Cash";
      if (safePaymentMethod === "GPay / Cash" || safePaymentMethod === "GPay") {
        safePaymentMethod = "UPI";
      }
      const { error: updateErr } = await supabase.from("walkin_sessions").update({
        session_status: "Completed",
        actual_end_time: (/* @__PURE__ */ new Date()).toISOString(),
        payment_status: "Paid",
        payment_method: safePaymentMethod
      }).eq("id", activeSession.id);
      if (updateErr) throw updateErr;
      await deviceService.toggleStatus(stationId, "AVAILABLE");
      this.addActivity(`Session Ended`, `Station ${stationId} Session Completed. Total Bill \u20B9${activeSession.total_amount}`, "END");
      playChime("generic");
      return await this.getStations();
    } catch (e) {
      console.error("Error ending session:", e);
      throw e;
    }
  },
  async extendSession(stationId, extraMinutes) {
    try {
      const dbDevices = await deviceService.getDevices();
      const targetStation = dbDevices.find((s) => s.device_code === stationId || s.id === stationId);
      if (!targetStation) throw new Error(`Device ${stationId} not found.`);
      const { data: activeSessions, error: fetchErr } = await supabase.from("walkin_sessions").select("*").or(`device_id.eq.${targetStation.id},device_id.eq.${targetStation.device_code},device_name.ilike.%${targetStation.device_code}%`).eq("session_status", "Active").limit(1);
      if (fetchErr) throw fetchErr;
      if (!activeSessions || activeSessions.length === 0) throw new Error(`No active session found for ${stationId}.`);
      const activeSession = activeSessions[0];
      const newExtended = (activeSession.extended_minutes || 0) + extraMinutes;
      const { pricePerPlayer: extraPrice } = await this.getPriceForSession(activeSession.device_type, extraMinutes);
      let extraCharge = extraPrice * activeSession.player_count;
      if (activeSession.member_discount_info && activeSession.member_discount_info.discountPercent) {
        extraCharge = extraCharge - Math.round(extraCharge * (activeSession.member_discount_info.discountPercent / 100));
      }
      const newTotal = Number(activeSession.gaming_charge || 0) + extraCharge;
      const { error: updateErr } = await supabase.from("walkin_sessions").update({
        extended_minutes: newExtended,
        gaming_charge: newTotal,
        total_amount: newTotal + Number(activeSession.food_total || 0)
      }).eq("id", activeSession.id);
      if (updateErr) throw updateErr;
      playChime("generic");
      return await this.getStations();
    } catch (e) {
      console.error("Error extending session:", e);
      throw e;
    }
  },
  async togglePauseSession(stationId) {
    try {
      const dbDevices = await deviceService.getDevices();
      const targetStation = dbDevices.find((s) => s.device_code === stationId || s.id === stationId);
      if (!targetStation) throw new Error(`Device ${stationId} not found.`);
      const { data: sessions, error: fetchErr } = await supabase.from("walkin_sessions").select("*").or(`device_id.eq.${targetStation.id},device_id.eq.${targetStation.device_code},device_name.ilike.%${targetStation.device_code}%`).in("session_status", ["Active", "Paused"]).limit(1);
      if (fetchErr) throw fetchErr;
      if (!sessions || sessions.length === 0) throw new Error(`No running session found for ${stationId}.`);
      const activeSession = sessions[0];
      const isCurrentlyPaused = activeSession.session_status === "Paused";
      if (!isCurrentlyPaused) {
        const { error: updateErr } = await supabase.from("walkin_sessions").update({
          session_status: "Paused",
          expected_end_time: (/* @__PURE__ */ new Date()).toISOString()
          // Store pause start time
        }).eq("id", activeSession.id);
        if (updateErr) throw updateErr;
        await deviceService.toggleStatus(stationId, "BUSY");
        this.addActivity(`Session Paused`, `Station ${stationId} session paused.`, "PAUSE");
      } else {
        let newStartTime = new Date(activeSession.start_time).getTime();
        if (activeSession.expected_end_time) {
          const pauseStartMs = new Date(activeSession.expected_end_time).getTime();
          const pausedDurationMs = Date.now() - pauseStartMs;
          newStartTime += pausedDurationMs;
        }
        const { error: updateErr } = await supabase.from("walkin_sessions").update({
          session_status: "Active",
          expected_end_time: null,
          start_time: new Date(newStartTime).toISOString()
        }).eq("id", activeSession.id);
        if (updateErr) throw updateErr;
        await deviceService.toggleStatus(stationId, "RUNNING");
        this.addActivity(`Session Resumed`, `Station ${stationId} session resumed.`, "RESUME");
      }
      return await this.getStations();
    } catch (e) {
      console.error("Error toggling pause:", e);
      throw e;
    }
  },
  async addSnackOrderToStation(stationId, expectedSessionId, snackItem) {
    try {
      const dbDevices = await deviceService.getDevices();
      const targetStation = dbDevices.find((s) => s.device_code === stationId || s.id === stationId);
      if (!targetStation) throw new Error(`Device ${stationId} not found.`);
      const { data: activeSessions, error: fetchErr } = await supabase.from("walkin_sessions").select("*").or(`device_id.eq.${targetStation.id},device_id.eq.${targetStation.device_code},device_name.ilike.%${targetStation.device_code}%`).eq("session_status", "Active").limit(1);
      if (fetchErr) throw fetchErr;
      if (!activeSessions || activeSessions.length === 0) throw new Error(`No active session found for ${stationId}.`);
      const activeSession = activeSessions[0];
      const currentOrders = activeSession.snack_orders || [];
      const newOrders = [...currentOrders];
      const matched = newOrders.find((o) => o.name === snackItem.name);
      if (matched) {
        matched.qty += snackItem.qty || 1;
        matched.subtotal += snackItem.subtotal !== void 0 ? snackItem.subtotal : snackItem.total || 0;
      } else {
        const newItem = { ...snackItem };
        if (newItem.subtotal === void 0) newItem.subtotal = newItem.total || 0;
        newOrders.push(newItem);
      }
      const itemTotal = snackItem.subtotal !== void 0 ? snackItem.subtotal : snackItem.total;
      const newFoodTotal = Number(activeSession.food_total || 0) + Number(itemTotal || 0);
      const newTotalAmount = Number(activeSession.gaming_charge || activeSession.total_amount || 0) + newFoodTotal;
      const { error: updateErr } = await supabase.from("walkin_sessions").update({
        snack_orders: newOrders,
        food_total: newFoodTotal,
        total_amount: newTotalAmount
      }).eq("id", activeSession.id);
      if (updateErr) throw updateErr;
      playChime("generic");
      return await this.getStations();
    } catch (e) {
      console.error("Error adding snack to station:", e);
      throw e;
    }
  },
  async getWalkInHistory() {
    try {
      const { data, error } = await supabase.from("walkin_sessions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const dbDevices = await deviceService.getDevices();
      return (data || []).map((d) => {
        const dev = dbDevices.find((s) => s.id === d.device_id || s.device_code === d.device_id);
        return {
          id: d.id,
          sessionId: d.session_code || d.id,
          stationId: dev ? dev.device_code : d.device_id,
          leaderName: d.customer_name,
          phone: d.mobile_number,
          device: dev ? dev.device_name : d.device_name || d.device_id,
          players: d.player_count,
          startTime: new Date(d.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          endTime: d.actual_end_time ? new Date(d.actual_end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-",
          duration: d.planned_duration + (d.extended_minutes || 0) + " mins",
          pricePerPlayer: d.hourly_price,
          gamingCharge: d.gaming_charge,
          originalGamingAmount: d.original_gaming_amount || d.member_discount_info?.originalGamingAmount || 0,
          discountAmount: d.discount_amount || d.member_discount_info?.discountAmount || 0,
          foodTotal: d.food_total,
          totalAmount: d.total_amount,
          paymentStatus: d.payment_status || "PAID",
          sessionStatus: d.session_status === "Active" ? "RUNNING" : "COMPLETED",
          date: new Date(d.start_time).toLocaleDateString(),
          snackOrders: d.snack_orders || [],
          pricingSnapshot: d.pricing_snapshot,
          memberDiscountInfo: d.member_discount_info
        };
      });
    } catch (e) {
      console.error("Error fetching walk-in history:", e);
      return [];
    }
  },
  async deleteWalkInRecord(id) {
    try {
      const { error } = await supabase.from("walkin_sessions").delete().eq("id", id);
      if (error) throw error;
      this.addActivity(`Session Deleted`, `Removed session from history`, "ALERT");
      return await this.getWalkInHistory();
    } catch (e) {
      console.error("Error deleting walk-in:", e);
      throw e;
    }
  },
  async getActivities() {
    try {
      const { data, error } = await supabase.from("activity_logs").select("*").order("time", { ascending: false }).limit(20);
      if (error) throw error;
      return (data || []).map((a) => ({
        ...a,
        time: new Date(a.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }));
    } catch (e) {
      console.error("Error fetching activities:", e);
      return [];
    }
  },
  async addActivity(title, subtitle, type = "INFO") {
    try {
      await supabase.from("activity_logs").insert([{
        title,
        message: subtitle,
        type
      }]);
      return await this.getActivities();
    } catch (e) {
      console.error("Error adding activity:", e);
    }
  },
  async getNotifications() {
    const raw = getItem(STORAGE_KEYS.NOTIFICATIONS, []);
    return raw;
  },
  async addNotification(title, message, type = "INFO") {
    const raw = getItem(STORAGE_KEYS.NOTIFICATIONS, []);
    const newNotif = { id: "notif_" + Date.now(), title, message, type, time: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), timestamp: Date.now(), read: false };
    setItem(STORAGE_KEYS.NOTIFICATIONS, [newNotif, ...raw].slice(0, 50));
  },
  async getControllerMetrics() {
    const inv = getItem(STORAGE_KEYS.CONTROLLERS, DEFAULT_CONTROLLER_INVENTORY);
    const stations = await this.getStations();
    let controllersInUse = 0;
    stations.forEach((s) => {
      if (s.status === "RUNNING" || s.status === "ACTIVE" || s.status === "ENDING_SOON") {
        if (isPlayStationCategory(s)) {
          controllersInUse += s.controllersUsed || 0;
        }
      }
    });
    const maintenance = Number(inv.maintenanceControllers) || 0;
    const broken = Number(inv.brokenControllers) || 0;
    const reserved = Number(inv.reservedControllers) || 0;
    const total = Number(inv.totalControllers) || 20;
    const availableControllers = Math.max(0, total - controllersInUse - maintenance - broken - reserved);
    return {
      totalControllers: total,
      controllersInUse,
      availableControllers,
      maintenanceControllers: maintenance,
      brokenControllers: broken,
      reservedControllers: reserved,
      usableControllers: Math.max(0, total - maintenance - broken)
    };
  },
  mapControllerMetrics(stations = []) {
    const inv = getItem(STORAGE_KEYS.CONTROLLERS, DEFAULT_CONTROLLER_INVENTORY);
    let controllersInUse = 0;
    stations.forEach((s) => {
      if (s.status === "RUNNING" || s.status === "ACTIVE" || s.status === "ENDING_SOON") {
        if (isPlayStationCategory(s)) {
          controllersInUse += s.controllersUsed || 0;
        }
      }
    });
    const maintenance = Number(inv.maintenanceControllers) || 0;
    const broken = Number(inv.brokenControllers) || 0;
    const reserved = Number(inv.reservedControllers) || 0;
    const total = Number(inv.totalControllers) || 20;
    const availableControllers = Math.max(0, total - controllersInUse - maintenance - broken - reserved);
    return {
      totalControllers: total,
      controllersInUse,
      availableControllers,
      maintenanceControllers: maintenance,
      brokenControllers: broken,
      reservedControllers: reserved,
      usableControllers: Math.max(0, total - maintenance - broken)
    };
  },
  async addControllers(quantity) {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      throw new Error("Please enter a valid positive number of controllers to add.");
    }
    const inv = getItem(STORAGE_KEYS.CONTROLLERS, DEFAULT_CONTROLLER_INVENTORY);
    const newTotal = (inv.totalControllers || 20) + qty;
    const updated = { ...inv, totalControllers: newTotal };
    setItem(STORAGE_KEYS.CONTROLLERS, updated);
    this.addActivity("Controllers Added", `Added ${qty} new controllers to hardware inventory. Total: ${newTotal}`, "SUCCESS");
    return updated;
  },
  async updateControllerHardwareStatus(maintenance, broken, reserved) {
    const inv = getItem(STORAGE_KEYS.CONTROLLERS, DEFAULT_CONTROLLER_INVENTORY);
    const m = Math.max(0, parseInt(maintenance, 10) || 0);
    const b = Math.max(0, parseInt(broken, 10) || 0);
    const r = Math.max(0, parseInt(reserved, 10) || 0);
    const updated = {
      ...inv,
      maintenanceControllers: m,
      brokenControllers: b,
      reservedControllers: r
    };
    setItem(STORAGE_KEYS.CONTROLLERS, updated);
    this.addActivity("Controller Hardware Status Updated", `Maintenance: ${m}, Broken: ${b}, Reserved: ${r}`, "INFO");
    return updated;
  },
  async getSoundSettings() {
    const { settingsService: settingsService2 } = await Promise.resolve().then(() => (init_settingsService(), settingsService_exports));
    const settings = await settingsService2.getSetting("audio_alerts");
    if (!settings || Object.keys(settings).length === 0) {
      return DEFAULT_SOUND_SETTINGS;
    }
    return settings;
  },
  async updateSoundSettings(newSettings) {
    const { settingsService: settingsService2 } = await Promise.resolve().then(() => (init_settingsService(), settingsService_exports));
    const current = await this.getSoundSettings();
    const updated = { ...current, ...newSettings };
    await settingsService2.updateSetting("audio_alerts", updated);
    return updated;
  },
  async testSoundChime(type = "5min") {
    playChime(type);
  },
  async getPricingSettings() {
    return getItem(STORAGE_KEYS.PRICING, DEFAULT_PRICING_SETTINGS);
  },
  async updatePricingSettings(newSettings) {
    const current = getItem(STORAGE_KEYS.PRICING, DEFAULT_PRICING_SETTINGS);
    const updated = {
      ...current,
      ...newSettings,
      lastUpdated: (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      history: [
        { date: (/* @__PURE__ */ new Date()).toLocaleDateString(), action: "Pricing Settings Updated", updatedBy: "Admin" },
        ...(current.history || []).slice(0, 9)
      ]
    };
    setItem(STORAGE_KEYS.PRICING, updated);
    this.addActivity("Pricing Updated", `Global Gaming Pricing Matrix updated by Admin`, "ALERT");
    this.addNotification("Pricing Updated", "Global Gaming Pricing Matrix updated by Admin.", "INFO");
    return updated;
  },
  async resetPricingSettings() {
    setItem(STORAGE_KEYS.PRICING, DEFAULT_PRICING_SETTINGS);
    this.addActivity("Pricing Reset", `Restored default pricing matrix for all devices`, "ALERT");
    this.addNotification("Pricing Reset", "Restored default pricing matrix for all devices.", "INFO");
    return DEFAULT_PRICING_SETTINGS;
  },
  async getPriceForSession(deviceZone, durationMinutes) {
    const settings = getItem(STORAGE_KEYS.PRICING, DEFAULT_PRICING_SETTINGS);
    const pricePerPlayer = this.getPriceForSessionSync(deviceZone, durationMinutes, settings);
    const dayOfWeek = (/* @__PURE__ */ new Date()).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    return {
      pricePerPlayer: Number(pricePerPlayer),
      isWeekend,
      tierName: isWeekend ? "Weekend Rate" : "Weekday Rate",
      pricingMode: settings.pricingMode || "AUTO"
    };
  },
  getPriceForSessionSync(deviceZone, durationMinutes, settings) {
    const pSettings = settings || getItem(STORAGE_KEYS.PRICING, DEFAULT_PRICING_SETTINGS);
    const dayOfWeek = (/* @__PURE__ */ new Date()).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const tierKey = isWeekend ? "weekend" : "weekday";
    const durMins = Number(durationMinutes) || 60;
    const deviceMap = pSettings[tierKey]?.[deviceZone] || {};
    let pricePerPlayer = deviceMap[durMins];
    if (!pricePerPlayer) {
      if (deviceZone === "PlayStation 5") pricePerPlayer = durMins === 60 ? 100 : durMins === 120 ? isWeekend ? 200 : 180 : 280;
      else if (deviceZone === "PlayStation 4") pricePerPlayer = durMins === 60 ? isWeekend ? 90 : 80 : durMins === 120 ? isWeekend ? 160 : 150 : 220;
      else if (deviceZone === "PlayStation 2") pricePerPlayer = durMins === 60 ? isWeekend ? 70 : 60 : durMins === 120 ? isWeekend ? 120 : 110 : 160;
      else if (deviceZone === "Racing Simulator") pricePerPlayer = durMins === 30 ? 100 : durMins === 60 ? 180 : 250;
      else if (deviceZone === "PS VR2") pricePerPlayer = durMins === 20 ? 100 : durMins === 40 ? 160 : 220;
      else pricePerPlayer = 100;
    }
    return Number(pricePerPlayer);
  }
};

// scratch/test_regression_suite.js
var storage = /* @__PURE__ */ new Map();
global.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear()
};
async function runRegressionSuite() {
  console.log("==============================================");
  console.log("   G-FORCE GAMING HUB - REGRESSION SUITE      ");
  console.log("==============================================\n");
  let passed = 0;
  let failed = 0;
  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }
  console.log("--- 1. Testing Pricing Engine ---");
  const p1 = sessionService.getPriceForSessionSync("PlayStation 5", 60);
  assert(p1 === 100, "PS5 60 min default rate is 100");
  const p2 = sessionService.getPriceForSessionSync("PlayStation 4", 60);
  assert(p2 === 80 || p2 === 90, "PS4 60 min rate resolves correctly based on weekday/weekend");
  const p3 = await sessionService.getPriceForSession("PlayStation 5", 120);
  assert(p3.pricePerPlayer > 0 && typeof p3.isWeekend === "boolean", "Async getPriceForSession returns structure with pricePerPlayer & isWeekend");
  console.log("\n--- 2. Testing Controller Metrics Mapping ---");
  const mockStations = [
    { id: "PS5-01", category: "PlayStation 5", status: "RUNNING", controllersUsed: 2 },
    { id: "PS5-02", category: "PlayStation 5", status: "AVAILABLE", controllersUsed: 0 },
    { id: "PS4-01", category: "PlayStation 4", status: "ACTIVE", controllersUsed: 4 },
    { id: "SIM-01", category: "Racing Simulator", status: "RUNNING", controllersUsed: 1 }
    // Non-PlayStation, should not count towards PlayStation controllers
  ];
  const metrics = sessionService.mapControllerMetrics(mockStations);
  assert(metrics.totalControllers === 20, "Default total controllers is 20");
  assert(metrics.controllersInUse === 6, `Controllers in use for PlayStation stations is 6 (got ${metrics.controllersInUse})`);
  assert(metrics.availableControllers === 14, `Available controllers is 14 (got ${metrics.availableControllers})`);
  assert(metrics.usableControllers === 20, "Usable controllers calculation is correct");
  console.log("\n--- 3. Testing Station Mapping ---");
  const mockDevices = [
    { id: "dev-1", device_code: "PS5-01", device_name: "PS5 Station 1", category: "PlayStation 5", status: "AVAILABLE" }
  ];
  const mockSessions = [
    { id: "ses-101", session_code: "SES-101", device_id: "PS5-01", customer_name: "John Doe", player_count: 2, planned_duration: 60, start_time: new Date(Date.now() - 30 * 6e4).toISOString(), session_status: "Active" }
  ];
  const mapped = sessionService.mapStations(mockDevices, mockSessions);
  assert(mapped.length === 1, "Mapped stations array has length 1");
  assert(mapped[0].status === "RUNNING", "Station with active session has RUNNING status");
  assert(mapped[0].customerName === "John Doe", "Customer name is mapped correctly");
  assert(mapped[0].remainingSeconds > 0, "Remaining seconds calculated correctly");
  console.log("\n--- 4. Testing Live Supabase Database Connectivity ---");
  const liveStations = await sessionService.getStations();
  assert(Array.isArray(liveStations), `sessionService.getStations() returns array from live DB (got ${liveStations.length} devices)`);
  if (liveStations.length > 0) {
    const s = liveStations[0];
    assert(typeof s.id === "string" && typeof s.zone === "string", "Live station has valid id and zone properties");
    assert(["AVAILABLE", "RUNNING", "BUSY", "MAINTENANCE", "RESERVED"].includes(s.status), `Live station status (${s.status}) is a valid ERP status`);
  }
  console.log("\n--- 5. Testing Walk-in History & Cafe Orders DB ---");
  const history = await sessionService.getWalkInHistory();
  assert(Array.isArray(history), `getWalkInHistory() returns array (got ${history.length} sessions)`);
  const notifs = await sessionService.getNotifications();
  assert(Array.isArray(notifs), `getNotifications() returns array (got ${notifs.length} notifications)`);
  console.log("\n==============================================");
  console.log(`Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log("==============================================");
  if (failed > 0) process.exit(1);
}
runRegressionSuite().catch((err) => {
  console.error("Fatal regression suite error:", err);
  process.exit(1);
});
