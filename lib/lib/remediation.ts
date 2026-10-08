import type { Resource, Option, Risk, Action, Provider } from './types';
import { monthlyCost } from './utils';

const stepDown: Record<Risk, Risk> = { HIGH: 'MEDIUM', MEDIUM: 'LOW', LOW: 'LOW' };
const riskWeight: Record<Risk, number> = { LOW: 1, MEDIUM: 0.8, HIGH: 0.5 };

export function buildOptions(r: Resource) {
  const m = monthlyCost(r.hourly_cost);
  const termRisk: Risk = r.env === 'prod' ? 'HIGH' : r.env === 'staging' ? 'MEDIUM' : 'LOW';
  const options: Option[] =
    r.category === 'storage'
      ? [
          { action: 'DELETE_VOLUME', label: 'Snapshot & delete volume', savings: m, risk: 'LOW' },
          { action: 'KEEP', label: 'Keep', savings: 0, risk: 'LOW' },
        ]
      : [
          { action: 'TERMINATE', label: 'Terminate', savings: m, risk: termRisk },
          { action: 'DOWNSIZE', label: 'Downsize', savings: m * 0.6, risk: stepDown[termRisk] },
          { action: 'SCHEDULE_STOP', label: 'Schedule stop (off-hours)', savings: m * 0.7, risk: 'LOW' },
          { action: 'KEEP', label: 'Keep running', savings: 0, risk: 'LOW' },
        ];
  const best = options
    .filter(o => o.action !== 'KEEP')
    .sort((a, b) => b.savings * riskWeight[b.risk] - a.savings * riskWeight[a.risk])[0];
  return { options, recommended: best.action as Action, isProtected: r.env === 'prod' };
}

export function generateScript(r: Resource, action: Action): string {
  const id = r.resource_id;
  const header = `# CloudGuard AI remediation\n# Resource: ${id} (${r.provider}, ${r.region})\n# Action: ${action}\n# Generated: ${new Date().toISOString()}\n# REVIEW BEFORE RUNNING\n\n`;
  const rg = '<resource-group>';
  const zone = `${r.region}-a`;
  const cmds: Record<Provider, Partial<Record<Action, string>>> = {
    AWS: {
      TERMINATE: r.category === 'database'
        ? `aws rds delete-db-instance --db-instance-identifier ${id} --final-db-snapshot-identifier ${id}-final --region ${r.region}`
        : `aws ec2 terminate-instances --instance-ids ${id} --region ${r.region}`,
      DOWNSIZE: `aws ec2 stop-instances --instance-ids ${id} --region ${r.region}\naws ec2 modify-instance-attribute --instance-id ${id} --instance-type "{\\"Value\\": \\"t3.medium\\"}" --region ${r.region}\naws ec2 start-instances --instance-ids ${id} --region ${r.region}`,
      SCHEDULE_STOP: `# Stop now; use EventBridge Scheduler to start Mon-Fri 09:00 IST\naws ec2 stop-instances --instance-ids ${id} --region ${r.region}`,
      DELETE_VOLUME: `aws ec2 create-snapshot --volume-id ${id} --description "cloudguard-backup" --region ${r.region}\naws ec2 delete-volume --volume-id ${id} --region ${r.region}`,
    },
    Azure: {
      TERMINATE: `az vm delete --resource-group ${rg} --name ${id} --yes`,
      DOWNSIZE: `az vm resize --resource-group ${rg} --name ${id} --size Standard_B2s`,
      SCHEDULE_STOP: `az vm deallocate --resource-group ${rg} --name ${id}\n# Configure Azure Automation to start at 09:00 IST Mon-Fri`,
      DELETE_VOLUME: `az snapshot create --resource-group ${rg} --name ${id}-snap --source ${id}\naz disk delete --resource-group ${rg} --name ${id} --yes`,
    },
    GCP: {
      TERMINATE: `gcloud compute instances delete ${id} --zone ${zone} --quiet`,
      DOWNSIZE: `gcloud compute instances stop ${id} --zone ${zone}\ngcloud compute instances set-machine-type ${id} --zone ${zone} --machine-type e2-medium\ngcloud compute instances start ${id} --zone ${zone}`,
      SCHEDULE_STOP: `gcloud compute instances stop ${id} --zone ${zone}\n# Attach an instance schedule to start at 09:00 IST Mon-Fri`,
      DELETE_VOLUME: `gcloud compute disks snapshot ${id} --zone ${zone} --snapshot-names ${id}-snap\ngcloud compute disks delete ${id} --zone ${zone} --quiet`,
    },
  };
  return header + (cmds[r.provider][action] ?? '# No action required');
}