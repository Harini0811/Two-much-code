"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/lib/supabase";

const STAGES = ["Detect", "Explain", "Quantify", "Recommend", "Simulate", "Approve", "Remediate", "Verify", "Audit"];
const ACTIONS = ["", "", "", "", "Run simulation", "Approve change", "Remediate now", "Verify result", "Write audit entry"];

const CLOUD_COLOR: Record<string, string> = { AWS: "#ffb020", Azure: "#22e5ff", GCP: "#b6ff3b" };

type Finding = {
  id: string; cloud: string; resource: string; type: string;
  waste: number; cause: string; fix: string; sim: string; done: number;
};

const SPARK = [12, 14, 13, 15, 14, 16, 15, 17, 16, 18, 41, 44, 43];

export default function Dashboard() {
  const [items, setItems] = useState<Finding[]>([]);
  const [sel, setSel] = useState("f1");
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const { data: fs } = await supabase.from("findings").select("*").order("id");
      const { data: ls } = await supabase
        .from("audit_log").select("message,created_at")
        .order("created_at", { ascending: false }).limit(20);
      if (fs) setItems(fs as Finding[]);
      if (ls) setLog(ls.map((l) => `${new Date(l.created_at).toLocaleTimeString()}  ${l.message}`));
    }
    load();
  }, []);

  const f = items.find((i) => i.id === sel) ?? items[0];
  if (!f) return <p className="text-[var(--mute)]">Loading findings…</p>;

  const total = items.reduce((s, i) => s + i.waste, 0);
  const saved = items.filter((i) => i.done >= 9).reduce((s, i) => s + i.waste, 0);

  async function advance() {
    if (f.done >= 9) return;
    const msg = `${ACTIONS[f.done]} · ${f.resource}`;
    const next = f.done + 1;
    setItems((xs) => xs.map((x) => (x.id === f.id ? { ...x, done: next } : x)));
    setLog((l) => [`${new Date().toLocaleTimeString()}  ${msg}`, ...l]);
    await supabase.from("findings").update({ done: next }).eq("id", f.id);
    await supabase.from("audit_log").insert({ message: msg });
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
                className={`panel w-full p-4 text-left transition-shadow ${f.id === i.id ? "shadow-[0_0_0_1px_var(--cyan),0_0_24px_rgba(34,229,255,.25)]" : ""}`}>
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