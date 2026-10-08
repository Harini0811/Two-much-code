export const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export const HOURS_30D = 24 * 30;
export const monthlyCost = (hourly: number) => hourly * HOURS_30D; // ₹120 × 24 × 30 = ₹86,400