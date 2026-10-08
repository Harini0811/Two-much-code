"use client";
import { useState } from "react";

const STAGES = ["Detect", "Explain", "Quantify", "Recommend", "Simulate", "Approve", "Remediate", "Verify", "Audit"];
const ACTIONS = ["", "", "", "", "Run simulation", "Approve change", "Remediate now", "Verify result", "Write audit entry"];

const CLOUD_COLOR: Record<string, string> = { AWS: "#ffb020", Azure: "#22e5ff", GCP: "#b6ff3b" };

type Finding = {
  id: string; cloud: string; resource: string; type: string;
  waste: number; cause: string; fix: string; sim: string; done: number;
};

const SEED: Finding[] = [
  { id: "f1", cloud: "AWS", resource: "m5.4xlarge · prod-batch-07", type: "Idle compute", waste: 4820,
    cause: "The nightly batch job was migrated to Fargate on Aug 14, but its EC2 host kept running. CPU has stayed under 3% for 54 days.",
    fix: "Stop the instance, snapshot its volume, and terminate after 7 days.",
    sim: "No dependent services found. Estimated saving $4,820/mo. Risk: low.", done: 4 },
  { id: "f2", cloud: "Azure", resource: "12 unattached managed disks", type: "Orphaned storage", waste: 1960,
    cause: "A decommissioned AKS node pool left its Premium SSDs behind. No VM has attached them since Sep 2.",
    fix: "Snapshot to cool storage, then delete the disks.",
    sim: "No attachments or backup policies reference these disks. Saving $1,960/mo. Risk: low.", done: 4 },
  { id: "f3", cloud: "GCP", resource: "BigQuery · analytics-prod", type: "Cost anomaly", waste: 7340,
    cause: "A scheduled query lost its partition filter after a schema change on Oct 1, so it now scans the full 38 TB table every hour.",
    fix: "Restore the partition filter and add a per-query byte limit.",
    sim: "Projected scan drops from 38 TB to 0.4 TB per run. Saving $7,340/mo. Risk: medium.", done: 5 },
  { id: "f4", cloud: "AWS", resource: "NAT gateway · vpc-staging", type: "Idle network", waste: 1180,
    cause: "Staging traffic moved to VPC endpoints, leaving this gateway with near-zero throughput.",
    fix: "Remove the gateway and its Elastic IP.",
    sim: "Applied. Saving $1,180/mo.", done: 7 },
];

const SPARK = [12, 14, 13, 15, 14, 16, 15, 17, 16, 18, 41, 44, 43];

export default function Dashboard() {
  const [items, setItems] = useState(SEED);
  const [sel, setSel] = useState("f1");
  const [log, setLog] = useState<string[]>(["Ingested 2.4M log lines from 3 clouds", "Anomaly flagged: GCP BigQuery spend +128%"]);

  const f = items.find((i) => i.id === sel)!;
  const total = items.reduce((s, i) => s + i.waste, 0);
  const saved = items.filter((i) => i.done >= 9).reduce((s, i) => s + i.waste, 0);

  function advance() {
    if (f.done >= 9) return;
    const msg = `${ACTIONS[f.done]} · ${f.resource}`;
    setItems((xs) => xs.map((x) => (x.id === f.id ? { ...x, done: x.done + 1 } : x)));
    setLog((l) => [`${new Date().toLocaleTimeString()}  ${msg}`, ...l]);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Hero */}
      <section className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <div className="panel p-6">
          <p className="text-sm text-[var(--mute)]">Waste found this month</p>
          <p className="mono neon-text mt-1 text-5xl font-bold md:text-6xl">${total.toLocaleString()}</p>
          <p className="mt-2 text-sm text-[var(--mute)]">
            <span className="text-[var(--lime)]">${saved.toLocaleString()}</span> already recovered across AWS, Azure and GCP.
          </p>
          <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-[var(--line)]">
            {["AWS", "Azure", "GCP"].map((c) => {
              const v = items.filter((i) => i.cloud === c).reduce((s, i) => s + i.waste, 0);
              return <div key={c} style={{ width: `${(v / total) * 100}%`, background: CLOUD_COLOR[c] }} title={`${c} $${v}`} />;
            })}
          </div>
          <div className="mono mt-2 flex gap-4 text-xs">
            {Object.entries(CLOUD_COLOR).map(([c, col]) => (
              <span key={c} style={{ color: col }}>{c}</span>
            ))}
          </div>
        </div>
        <div className="panel p-6">
          <p className="text-sm text-[var(--mute)]">Daily spend · anomaly detected</p>
          <svg viewBox="0 0 130 50" className="mt-3 w-full" role="img" aria-label="Spend spikes on day 11">
            <polyline fill="none" stroke="var(--violet)" strokeWidth="2"
              points={SPARK.map((v, i) => `${i * 10},${50 - v}`).join(" ")} />
            <circle cx="100" cy={50 - SPARK[10]} r="3.5" fill="var(--pink)" />
          </svg>
          <p className="mt-2 text-sm">Spend jumped <span className="text-[var(--pink)]">+128%</span> on Oct 1 in GCP BigQuery.</p>
        </div>
      </section>

      {/* Pipeline */}
      <section className="panel p-5">
        <h2 className="mb-4 text-sm text-[var(--mute)]">Remediation pipeline · {f.resource}</h2>
        <ol className="flex items-start gap-0 overflow-x-auto pb-2">
          {STAGES.map((s, i) => {
            const state = i < f.done ? "node-done" : i === f.done ? "node-now" : "node-next";
            return (
              <li key={s} className="flex min-w-[84px] flex-1 flex-col items-center text-center">
                <div className="relative flex w-full items-center justify-center">
                  {i > 0 && <span className={`absolute right-1/2 h-px w-full ${i <= f.done ? "bg-[var(--cyan)]" : "bg-[var(--line)]"}`} />}
                  <span className={`mono relative z-10 grid h-9 w-9 place-items-center rounded-full text-xs font-bold ${state}`}>{i + 1}</span>
                </div>
                <span className={`mt-2 text-xs ${i === f.done ? "text-white" : "text-[var(--mute)]"}`}>{s}</span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Findings + detail */}
      <section className="grid gap-4 md:grid-cols-[1fr_1.3fr]">
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.id}>
              <button onClick={() => setSel(i.id)}
                className={`panel w-full p-4 text-left transition-shadow ${sel === i.id ? "shadow-[0_0_0_1px_var(--cyan),0_0_24px_rgba(34,229,255,.25)]" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className="mono text-xs" style={{ color: CLOUD_COLOR[i.cloud] }}>{i.cloud}</span>
                  <span className="mono text-sm">${i.waste.toLocaleString()}/mo</span>
                </div>
                <p className="mt-1 font-medium">{i.type}</p>
                <p className="text-sm text-[var(--mute)]">{i.resource}</p>
                <p className="mt-2 text-xs text-[var(--mute)]">{i.done >= 9 ? "Complete" : `Next: ${ACTIONS[i.done]}`}</p>
              </button>
            </li>
          ))}
        </ul>

        <div className="panel space-y-4 p-5">
          <div>
            <h3 className="text-sm text-[var(--violet)]">Why it happened · AI root cause</h3>
            <p className="mt-1 leading-relaxed">{f.cause}</p>
          </div>
          <div>
            <h3 className="text-sm text-[var(--violet)]">Recommendation</h3>
            <p className="mt-1 leading-relaxed">{f.fix}</p>
          </div>
          {f.done >= 5 && (
            <div className="rounded-lg border border-[var(--lime)]/40 bg-[var(--lime)]/5 p-3">
              <h3 className="text-sm text-[var(--lime)]">Simulation result</h3>
              <p className="mt-1 text-sm">{f.sim}</p>
            </div>
          )}
          <button onClick={advance} disabled={f.done >= 9}
            className="btn-neon w-full rounded-lg px-4 py-3 font-semibold text-white disabled:opacity-40">
            {f.done >= 9 ? "Fully remediated and audited" : ACTIONS[f.done]}
          </button>
        </div>
      </section>

      {/* Audit */}
      <section className="panel p-5">
        <h2 className="mb-3 text-sm text-[var(--mute)]">Audit trail</h2>
        <ul className="mono space-y-1 text-xs text-[var(--mute)]">
          {log.map((l, i) => <li key={i}><span className="text-[var(--cyan)]">▍</span> {l}</li>)}
        </ul>
      </section>
    </div>
  );
}