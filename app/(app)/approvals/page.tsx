"use client";
import { useState } from "react";

type Req = {
  id: string; cloud: string; resource: string; action: string;
  saving: number; risk: "Low" | "Medium" | "High"; sim: string;
  status: "pending" | "approved" | "rejected";
};

const COLOR: Record<string, string> = { AWS: "#ffb020", Azure: "#22e5ff", GCP: "#b6ff3b" };
const RISK: Record<string, string> = { Low: "var(--lime)", Medium: "#ffb020", High: "var(--pink)" };

const SEED: Req[] = [
  { id: "r1", cloud: "AWS", resource: "m5.4xlarge · prod-batch-07", action: "Stop instance, snapshot volume, terminate after 7 days",
    saving: 4820, risk: "Low", sim: "No dependent services found.", status: "pending" },
  { id: "r2", cloud: "Azure", resource: "12 unattached managed disks", action: "Snapshot to cool storage, then delete disks",
    saving: 1960, risk: "Low", sim: "No attachments or backup policies reference these disks.", status: "pending" },
  { id: "r3", cloud: "GCP", resource: "BigQuery · analytics-prod", action: "Restore partition filter and add a per-query byte limit",
    saving: 7340, risk: "Medium", sim: "Projected scan drops from 38 TB to 0.4 TB per run.", status: "pending" },
];

export default function Approvals() {
  const [items, setItems] = useState(SEED);
  const [log, setLog] = useState<string[]>([]);

  function decide(r: Req, status: "approved" | "rejected") {
    setItems((xs) => xs.map((x) => (x.id === r.id ? { ...x, status } : x)));
    const verb = status === "approved" ? "Approved" : "Rejected";
    setLog((l) => [`${new Date().toLocaleTimeString()}  ${verb} · ${r.resource}`, ...l]);
  }

  const pending = items.filter((i) => i.status === "pending");
  const done = items.filter((i) => i.status !== "pending");
  const waiting = pending.reduce((s, i) => s + i.saving, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Approvals</h1>
        <p className="mt-1 text-[var(--mute)]">
          {pending.length} {pending.length === 1 ? "fix is" : "fixes are"} waiting for sign-off, worth{" "}
          <span className="mono text-[var(--lime)]">${waiting.toLocaleString()}/mo</span>. Nothing runs until you approve it.
        </p>
      </header>

      {pending.length === 0 && (
        <div className="panel p-8 text-center text-[var(--mute)]">
          No fixes are waiting. New recommendations appear here after they are simulated.
        </div>
      )}

      <div className="space-y-4">
        {pending.map((r) => (
          <article key={r.id} className="panel space-y-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="mono text-xs" style={{ color: COLOR[r.cloud] }}>{r.cloud}</span>
              <span className="mono text-sm">${r.saving.toLocaleString()}/mo saving</span>
            </div>
            <h2 className="font-medium">{r.resource}</h2>
            <p className="text-sm leading-relaxed">{r.action}</p>
            <div className="rounded-lg border border-[var(--line)] p-3 text-sm">
              <span className="text-[var(--violet)]">Simulation: </span>{r.sim}
              <span className="mono ml-2 text-xs" style={{ color: RISK[r.risk] }}>Risk: {r.risk}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => decide(r, "approved")}
                className="btn-neon flex-1 rounded-lg px-4 py-2.5 font-semibold text-white">Approve</button>
              <button onClick={() => decide(r, "rejected")}
                className="flex-1 rounded-lg border border-[var(--line)] px-4 py-2.5 text-[var(--mute)] hover:border-[var(--pink)] hover:text-white">
                Reject
              </button>
            </div>
          </article>
        ))}
      </div>

      {done.length > 0 && (
        <section className="panel p-5">
          <h2 className="mb-3 text-sm text-[var(--mute)]">Decided</h2>
          <ul className="space-y-2 text-sm">
            {done.map((r) => (
              <li key={r.id} className="flex justify-between gap-3">
                <span>{r.resource}</span>
                <span className={`mono text-xs ${r.status === "approved" ? "text-[var(--lime)]" : "text-[var(--pink)]"}`}>
                  {r.status === "approved" ? "Approved, ready to remediate" : "Rejected"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {log.length > 0 && (
        <section className="panel p-5">
          <h2 className="mb-3 text-sm text-[var(--mute)]">Decision log</h2>
          <ul className="mono space-y-1 text-xs text-[var(--mute)]">
            {log.map((l, i) => <li key={i}><span className="text-[var(--cyan)]">▍</span> {l}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}