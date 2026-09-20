/**
 * Membership Form Validation Helpers
 */
export function validateMembershipForm(data) {
  const errors = {};

  if (!data.customerName || data.customerName.trim().length < 2) {
    errors.customerName = 'Full Name is required (at least 2 characters).';
  }

  const phoneRegex = /^[6-9]\d{9}$/;
  if (!data.mobileNumber || !phoneRegex.test(data.mobileNumber.replace(/\D/g, ''))) {
    errors.mobileNumber = 'Valid 10-digit Indian mobile number is required.';
  }

  if (!data.preferredStartDate) {
    errors.preferredStartDate = 'Preferred Start Date is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
