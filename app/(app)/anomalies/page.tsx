"use client";
import { useState } from "react";

type Series = { id: string; cloud: string; service: string; data: number[]; cause: string };

const COLOR: Record<string, string> = { AWS: "#ffb020", Azure: "#22e5ff", GCP: "#b6ff3b" };

const SERIES: Series[] = [
  { id: "a1", cloud: "GCP", service: "BigQuery · analytics-prod",
    data: [310, 295, 320, 305, 330, 315, 300, 325, 310, 318, 720, 745, 730, 740],
    cause: "A scheduled query lost its partition filter after a schema change, so it now scans the full table every hour." },
  { id: "a2", cloud: "AWS", service: "EC2 · us-east-1",
    data: [520, 515, 530, 525, 518, 522, 528, 521, 524, 640, 910, 905, 915, 900],
    cause: "An autoscaling group's minimum size was raised from 4 to 12 and never lowered after a load test." },
  { id: "a3", cloud: "Azure", service: "Storage · logs-archive",
    data: [140, 142, 139, 141, 143, 140, 142, 141, 144, 143, 145, 144, 146, 145],
    cause: "" },
];

function detect(data: number[]) {
  const base = data.slice(0, 8);
  const mean = base.reduce((a, b) => a + b, 0) / base.length;
  const sd = Math.sqrt(base.reduce((a, b) => a + (b - mean) ** 2, 0) / base.length) || 1;
  const flags = data.map((v, i) => i >= 8 && (v - mean) / sd > 3);
  const first = flags.indexOf(true);
  const pct = first >= 0 ? Math.round(((data[first] - mean) / mean) * 100) : 0;
  return { flags, first, pct, mean: Math.round(mean) };
}

function Chart({ data, flags }: { data: number[]; flags: boolean[] }) {
  const min = Math.min(...data), max = Math.max(...data);
  const x = (i: number) => (i / (data.length - 1)) * 280;
  const y = (v: number) => 70 - ((v - min) / (max - min || 1)) * 60;
  return (
    <svg viewBox="0 0 280 80" className="w-full" role="img" aria-label="Daily spend chart">
      <polyline fill="none" stroke="var(--violet)" strokeWidth="2"
        points={data.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
      {data.map((v, i) => flags[i] && (
        <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill="var(--pink)" />
      ))}
    </svg>
  );
}

export default function Anomalies() {
  const [sent, setSent] = useState<string[]>([]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Anomalies</h1>
        <p className="mt-1 text-[var(--mute)]">
          Daily spend is compared with each service’s first 8 days. A day more than 3 standard deviations above that baseline is flagged.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {SERIES.map((s) => {
          const d = detect(s.data);
          const bad = d.first >= 0;
          return (
            <article key={s.id} className="panel space-y-3 p-5">
              <div className="flex items-center justify-between">
                <span className="mono text-xs" style={{ color: COLOR[s.cloud] }}>{s.cloud}</span>
                <span className={`mono text-xs ${bad ? "text-[var(--pink)]" : "text-[var(--lime)]"}`}>
                  {bad ? `+${d.pct}% vs baseline` : "Normal"}
                </span>
              </div>
              <h2 className="font-medium">{s.service}</h2>
              <Chart data={s.data} flags={d.flags} />
              <p className="mono text-xs text-[var(--mute)]">Baseline ${d.mean}/day</p>
              {bad && (
                <>
                  <div>
                    <h3 className="text-sm text-[var(--violet)]">Why it happened · AI root cause</h3>
                    <p className="mt-1 text-sm leading-relaxed">{s.cause}</p>
                  </div>
                  <button
                    onClick={() => setSent((x) => [...x, s.id])}
                    disabled={sent.includes(s.id)}
                    className="btn-neon w-full rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
                    {sent.includes(s.id) ? "Sent to remediation" : "Send to remediation"}
                  </button>
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}