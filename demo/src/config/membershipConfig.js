export const MEMBERSHIP_PLANS = {
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

export const getMembershipPlanById = (id) => {
  return MEMBERSHIP_PLANS[id] || MEMBERSHIP_PLANS.monthly;
};

export const getMembershipPlanByName = (name) => {
  return Object.values(MEMBERSHIP_PLANS).find(plan => plan.name === name) || MEMBERSHIP_PLANS.monthly;
};
