import React, { useState } from 'react';
import { FormInput } from './FormInputs';
import { validateMembershipForm } from '../../utils/validation';
import { membershipService } from '../../services/membershipService';
import { openVenueWhatsAppForSubmission } from '../../utils/whatsapp';
import { User, Phone, Calendar, Crown, Loader2, CheckCircle } from 'lucide-react';
import { MEMBERSHIP_PLANS } from '../../config/membershipConfig';

export default function MembershipForm({ defaultPlan = MEMBERSHIP_PLANS.monthly.name, onSuccess, onClose }) {
  const todayString = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    customerName: '',
    mobileNumber: '',
    preferredStartDate: '',
    membershipPlan: defaultPlan
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  // Real-time validation check for submit button enabled/disabled state
  const validation = validateMembershipForm(formData);
  const isFormValid = validation.isValid;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    // Clear error for field as soon as user edits
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    const valResult = validateMembershipForm(formData);
    if (!valResult.isValid) {
      setErrors(valResult.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Save membership request into local/Supabase storage
      const createdRequest = await membershipService.createMembership(formData);

      // 2. Immediately open WhatsApp to business number (+91 9344176534)
      openVenueWhatsAppForSubmission(createdRequest);

      // 3. Display success screen
      setSubmitted(true);
      setSubmittedData(createdRequest);
      if (onSuccess) onSuccess(createdRequest);
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="py-6 px-4 text-center space-y-5 animate-in fade-in duration-500">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
          <CheckCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-cyber font-black text-white tracking-wider uppercase">
            MEMBERSHIP REQUEST SUBMITTED!
          </h3>
          <p className="text-sm text-cyan-300 font-sans max-w-md mx-auto leading-relaxed font-semibold">
            Membership request submitted successfully. Our team will contact you shortly.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 text-left space-y-2 text-xs text-gray-300">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-gray-400 font-cyber">MEMBERSHIP ID:</span>
            <span className="font-cyber font-bold text-pink-400">
              {submittedData?.id ? `GF-${submittedData.id.toString().substring(0,8).toUpperCase()}` : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-gray-400 font-cyber">CUSTOMER NAME:</span>
            <span className="font-bold text-white">{submittedData?.full_name || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-gray-400 font-cyber">PLAN:</span>
            <span className="font-cyber font-bold text-purple-300">{submittedData?.membership_plan || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-gray-400 font-cyber">START DATE:</span>
            <span className="font-mono text-gray-200">{submittedData?.preferred_start_date || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-gray-400 font-cyber">DURATION:</span>
            <span className="font-mono text-cyan-400">{submittedData?.duration || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-gray-400 font-cyber">PRICE:</span>
            <span className="font-mono text-emerald-400">₹{submittedData?.price || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-gray-400 font-cyber">STATUS:</span>
            <span className="font-mono text-amber-400">{submittedData?.status || 'N/A'}</span>
          </div>
        </div>

        {/* Close Button on Success */}
        {onClose && (
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl btn-cyber-pink font-cyber font-black text-xs tracking-widest uppercase shadow-[0_0_25px_rgba(255,0,127,0.6)] cursor-pointer"
          >
            CLOSE
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {/* Desktop Two-Column Layout / Mobile Single Column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="FULL NAME"
          name="customerName"
          value={formData.customerName}
          onChange={handleChange}
          error={errors.customerName}
          placeholder="Enter your full name"
          icon={User}
          required
        />

        <FormInput
          label="MOBILE NUMBER"
          name="mobileNumber"
          type="tel"
          value={formData.mobileNumber}
          onChange={handleChange}
          error={errors.mobileNumber}
          placeholder="10-digit Indian mobile number"
          icon={Phone}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Preferred Start Date with HTML5 Date Picker & min=today */}
        <FormInput
          label="PREFERRED START DATE"
          name="preferredStartDate"
          type="date"
          value={formData.preferredStartDate}
          onChange={handleChange}
          error={errors.preferredStartDate}
          icon={Calendar}
          min={todayString}
          required
        />

        {/* Membership Plan (Auto-filled & Locked) */}
        <FormInput
          label="MEMBERSHIP PLAN"
          name="membershipPlan"
          value={formData.membershipPlan}
          readOnly={true}
          icon={Crown}
          required
        />
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className={`w-full py-3.5 rounded-xl font-cyber font-black text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
            isFormValid && !isSubmitting
              ? 'bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-500 hover:from-pink-500 hover:to-cyan-400 text-white cursor-pointer shadow-[0_0_25px_rgba(255,0,127,0.6)] hover:shadow-[0_0_35px_rgba(255,0,127,0.9)] scale-100 active:scale-[0.99]'
              : 'bg-slate-900 border border-white/10 text-gray-500 cursor-not-allowed opacity-50'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>SUBMITTING REQUEST...</span>
            </>
          ) : (
            <span>SUBMIT MEMBERSHIP REQUEST</span>
          )}
        </button>
      </div>
    </form>
  );
}
