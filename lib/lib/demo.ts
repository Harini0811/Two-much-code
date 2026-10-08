import type { NewResource } from './types';

type Req = Partial<NewResource> & Pick<NewResource, 'provider' | 'resource_id' | 'resource_type' | 'env' | 'hourly_cost' | 'age_days'>;

const mk = (p: Req): NewResource => ({
  category: 'compute', region: 'ap-south-1', cpu_avg: 50, mem_avg: 50, network_mbps: 8,
  allocated_cpu: 4, allocated_mem_gb: 16, status: 'RUNNING', attached: true,
  prev_daily_cost: p.hourly_cost * 24,
  ...p,
});

const vol = (provider: NewResource['provider'], resource_id: string, resource_type: string, env: NewResource['env'], hourly_cost: number, age_days: number) =>
  mk({ provider, resource_id, resource_type, env, hourly_cost, age_days, category: 'storage', status: 'AVAILABLE', attached: false, cpu_avg: 0, mem_avg: 0, network_mbps: 0, allocated_cpu: 0, allocated_mem_gb: 0 });

export function demoResources(): NewResource[] {
  const list: NewResource[] = [
    // Hero resource: zombie + spike, production, HIGH risk, ₹86,400 / 30d
    mk({ provider: 'AWS', resource_id: 'vm-prod-782', resource_type: 'EC2', env: 'prod', cpu_avg: 4.2, mem_avg: 7.3, network_mbps: 0.4, allocated_cpu: 16, allocated_mem_gb: 64, hourly_cost: 120, prev_daily_cost: 443, age_days: 47 }),
    vol('AWS', 'vol-9281', 'EBS', 'dev', 5.8, 63),
    mk({ provider: 'AWS', resource_id: 'vm-test-112', resource_type: 'EC2', env: 'staging', cpu_avg: 8, mem_avg: 11, network_mbps: 3, allocated_cpu: 16, allocated_mem_gb: 64, hourly_cost: 26, age_days: 30 }),
    mk({ provider: 'AWS', resource_id: 'rds-analytics', resource_type: 'RDS', env: 'prod', cpu_avg: 11, mem_avg: 18, network_mbps: 6, allocated_cpu: 8, allocated_mem_gb: 64, hourly_cost: 52, age_days: 120 }),
    mk({ provider: 'Azure', resource_id: 'vm-dev-203', resource_type: 'Virtual Machine', env: 'dev', region: 'centralindia', cpu_avg: 2.9, mem_avg: 5.1, network_mbps: 0.2, allocated_cpu: 8, allocated_mem_gb: 32, hourly_cost: 38, age_days: 52 }),
    vol('Azure', 'disk-staging-44', 'Managed Disk', 'staging', 3.1, 41),
    mk({ provider: 'Azure', resource_id: 'vm-api-prod-01', resource_type: 'Virtual Machine', env: 'prod', region: 'centralindia', cpu_avg: 61, mem_avg: 58, hourly_cost: 85, age_days: 200 }),
    mk({ provider: 'GCP', resource_id: 'gce-stg-531', resource_type: 'Compute Engine', env: 'staging', region: 'asia-south1', cpu_avg: 3.5, mem_avg: 8, network_mbps: 0.6, allocated_cpu: 8, allocated_mem_gb: 32, hourly_cost: 44, age_days: 38 }),
    vol('GCP', 'pd-old-77', 'Persistent Disk', 'dev', 2.4, 90),
    mk({ provider: 'GCP', resource_id: 'gce-ml-train', resource_type: 'Compute Engine', env: 'dev', region: 'asia-south1', cpu_avg: 70, mem_avg: 65, hourly_cost: 90, prev_daily_cost: 600, age_days: 10 }),
    mk({ provider: 'AWS', resource_id: 'vm-web-prod-02', resource_type: 'EC2', env: 'prod', cpu_avg: 55, mem_avg: 62, hourly_cost: 70, age_days: 150 }),
  ];
  // 9 healthy resources to reach 20 total
  const providers = ['AWS', 'Azure', 'GCP'] as const;
  const envs = ['prod', 'staging', 'dev'] as const;
  const types = { AWS: 'EC2', Azure: 'Virtual Machine', GCP: 'Compute Engine' };
  for (let i = 0; i < 9; i++) {
    const provider = providers[i % 3];
    list.push(mk({ provider, resource_id: `app-${provider.toLowerCase()}-${i + 1}`, resource_type: types[provider], env: envs[i % 3], cpu_avg: 40 + i * 3, mem_avg: 45 + i * 2, hourly_cost: 12 + i * 3, age_days: 20 + i * 10 }));
  }
  return list;
}