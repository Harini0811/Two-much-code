import type { Resource, Detection } from './types';
import { monthlyCost, inr } from './utils';

const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));
const r1 = (n: number) => Math.round(n * 10) / 10;

function severity(score: number): Detection['severity'] {
  return score >= 85 ? 'CRITICAL' : score >= 65 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';
}

export function detect(r: Resource): Detection | null {
  if (['TERMINATED', 'DELETED'].includes(r.status)) return null;
  const monthly = monthlyCost(r.hourly_cost);
  const daily = r.hourly_cost * 24;
  const ratio = r.prev_daily_cost > 0 ? daily / r.prev_daily_cost : 1;
  const spike = ratio >= 3;

  // Unattached storage
  if (r.category === 'storage') {
    if (r.attached || r.age_days < 14) return null;
    const agePts = Math.round((Math.min(r.age_days, 60) / 60) * 35);
    const score = 60 + agePts;
    return {
      type: 'UNATTACHED_STORAGE', score, severity: severity(score),
      confidence: Math.min(99, Math.round(score * 0.97)),
      reasons: ['Volume is not attached to any instance', `Unattached for ${r.age_days} days`, `Costing ${inr(monthly)} / month`],
      breakdown: [{ label: 'Unattached state', points: 60 }, { label: 'Resource age', points: agePts }],
      monthly_waste: monthly,
    };
  }

  // Weighted score for compute / database
  const breakdown = [
    { label: 'CPU utilization', points: r1(35 * (1 - clamp(r.cpu_avg / 30))) },
    { label: 'Memory utilization', points: r1(25 * (1 - clamp(r.mem_avg / 40))) },
    { label: 'Cost anomaly', points: r1(20 * clamp((ratio - 1) / 5)) },
    { label: 'Resource age', points: r1(10 * clamp(r.age_days / 45)) },
    { label: 'Network inactivity', points: r1(10 * (1 - clamp(r.network_mbps / 10))) },
  ];
  const score = Math.round(breakdown.reduce((s, b) => s + b.points, 0));

  let type: Detection['type'] | null = null;
  let waste = 0;
  if (r.cpu_avg < 5 && r.mem_avg < 10 && r.network_mbps < 1) { type = 'ZOMBIE'; waste = monthly; }
  else if (r.cpu_avg < 15 && r.mem_avg < 20) { type = 'OVER_PROVISIONED'; waste = monthly * 0.5; }
  else if (spike) { type = 'COST_SPIKE'; waste = Math.max(0, (daily - r.prev_daily_cost) * 30); }
  if (!type) return null;

  const reasons = [`CPU utilization: ${r.cpu_avg}%`, `Memory utilization: ${r.mem_avg}%`];
  if (r.network_mbps < 1) reasons.push('Very low network activity');
  reasons.push(`Running for ${r.age_days} days`);
  if (spike) reasons.push(`Daily cost up ${Math.round((ratio - 1) * 100)}% vs baseline`);

  return {
    type, score, severity: severity(score),
    confidence: Math.min(99, Math.round(score * 0.97)),
    reasons, breakdown, monthly_waste: waste,
  };
}