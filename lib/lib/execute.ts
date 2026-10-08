import { supabase } from './supabase';
import type { Remediation, Resource, Action } from './types';
import { monthlyCost } from './utils';

const NEXT_STATE: Record<Action, string> = {
  TERMINATE: 'TERMINATED', DOWNSIZE: 'RESIZED', SCHEDULE_STOP: 'SCHEDULED', DELETE_VOLUME: 'DELETED', KEEP: 'RUNNING',
};

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function executeRemediation(rem: Remediation, userEmail: string) {
  const { data, error } = await supabase.from('resources').select('*').eq('id', rem.resource_uuid).single();
  check(error);
  const res = data as Resource;

  const prev = res.status;
  const next = NEXT_STATE[rem.action];
  const monthly = monthlyCost(res.hourly_cost);
  const newHourly = monthly > 0 ? Math.max(0, res.hourly_cost * (1 - rem.savings / monthly)) : 0;

  check((await supabase.from('resources').update({ status: next, hourly_cost: newHourly }).eq('id', res.id)).error);
  check((await supabase.from('anomalies').update({ status: 'resolved' }).eq('id', rem.anomaly_id)).error);
  check((await supabase.from('remediation_actions').update({ status: 'executed' }).eq('id', rem.id)).error);
  check((await supabase.from('execution_logs').insert({
    remediation_id: rem.id, resource_ref: rem.resource_ref, action: rem.action,
    prev_state: prev, new_state: next, savings: rem.savings, status: 'SUCCESS', executed_by: userEmail,
  })).error);
}