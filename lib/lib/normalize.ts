import Papa from 'papaparse';
import type { NewResource, Provider } from './types';

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 500;
const PROVIDERS: Provider[] = ['AWS', 'Azure', 'GCP'];

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export function normalizeRow(raw: Record<string, unknown>): NewResource {
  const resource_id = String(raw.resource_id ?? '').trim();
  if (!resource_id) throw new Error('A row is missing resource_id');
  const provider = PROVIDERS.find(p => p.toLowerCase() === String(raw.provider ?? '').trim().toLowerCase());
  if (!provider) throw new Error(`Invalid provider for "${resource_id}" (use AWS, Azure or GCP)`);

  const resource_type = String(raw.resource_type ?? 'VM').trim();
  const t = resource_type.toLowerCase();
  const category = /ebs|disk|volume|storage/.test(t) ? 'storage' : /rds|sql|database/.test(t) ? 'database' : 'compute';
  const envRaw = String(raw.env ?? 'dev').toLowerCase();
  const env = (['dev', 'staging', 'prod'].includes(envRaw) ? envRaw : 'dev') as NewResource['env'];
  const attachedRaw = String(raw.attached ?? 'true').toLowerCase();

  return {
    provider, resource_id, resource_type, category,
    region: String(raw.region ?? 'unknown'),
    env,
    cpu_avg: num(raw.cpu_avg),
    mem_avg: num(raw.mem_avg),
    network_mbps: num(raw.network_mbps),
    allocated_cpu: num(raw.allocated_cpu),
    allocated_mem_gb: num(raw.allocated_mem_gb),
    status: String(raw.status ?? (category === 'storage' ? 'AVAILABLE' : 'RUNNING')).toUpperCase(),
    attached: !['false', '0', 'no'].includes(attachedRaw),
    hourly_cost: num(raw.hourly_cost),
    prev_daily_cost: num(raw.prev_daily_cost),
    age_days: Math.round(num(raw.age_days)),
  };
}

export async function parseFile(file: File): Promise<NewResource[]> {
  if (file.size > MAX_BYTES) throw new Error('File exceeds the 2 MB limit');
  const ext = file.name.split('.').pop()?.toLowerCase();
  const text = await file.text();
  let rows: Record<string, unknown>[];
  if (ext === 'csv') {
    rows = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true }).data;
  } else if (ext === 'json') {
    const j = JSON.parse(text);
    rows = Array.isArray(j) ? j : j.resources;
  } else {
    throw new Error('Only .csv or .json files are allowed');
  }
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('No rows found in file');
  if (rows.length > MAX_ROWS) throw new Error(`Too many rows (max ${MAX_ROWS})`);
  return rows.map(normalizeRow);
}