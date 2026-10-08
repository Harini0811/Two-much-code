export type Provider = 'AWS' | 'Azure' | 'GCP';
export type Risk = 'LOW' | 'MEDIUM' | 'HIGH';
export type Action = 'TERMINATE' | 'DOWNSIZE' | 'SCHEDULE_STOP' | 'DELETE_VOLUME' | 'KEEP';

export interface NewResource {
  provider: Provider;
  resource_id: string;
  resource_type: string;
  category: 'compute' | 'storage' | 'database';
  region: string;
  env: 'dev' | 'staging' | 'prod';
  cpu_avg: number;
  mem_avg: number;
  network_mbps: number;
  allocated_cpu: number;
  allocated_mem_gb: number;
  status: string;
  attached: boolean;
  hourly_cost: number;
  prev_daily_cost: number;
  age_days: number;
}
export interface Resource extends NewResource { id: string }

export interface Detection {
  type: 'ZOMBIE' | 'UNATTACHED_STORAGE' | 'OVER_PROVISIONED' | 'COST_SPIKE';
  score: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  reasons: string[];
  breakdown: { label: string; points: number }[];
  monthly_waste: number;
}
export interface Anomaly extends Detection {
  id: string;
  resource_uuid: string;
  status: 'open' | 'resolved';
  created_at: string;
}
export interface Option { action: Action; label: string; savings: number; risk: Risk }
export interface Remediation {
  id: string;
  anomaly_id: string;
  resource_uuid: string;
  resource_ref: string;
  action: Action;
  savings: number;
  risk: Risk;
  script: string;
  status: 'pending' | 'executed' | 'rejected';
  created_at: string;
}