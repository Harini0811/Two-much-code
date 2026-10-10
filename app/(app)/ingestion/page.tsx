"use client";
import { useState } from "react";

type Row = Record<string, unknown>;

function parseLogs(text: string): Row[] {
  const t = text.trim();
  if (!t) return [];
  try {
    const j = JSON.parse(t);
    if (Array.isArray(j)) return j;
    if (Array.isArray(j.Records)) return j.Records; // AWS CloudTrail
    if (Array.isArray(j.value)) return j.value; // Azure
    return [j];
  } catch {
    // NDJSON fallback
    return t.split("\n").flatMap((l) => {
      try { return [JSON.parse(l)]; } catch { return []; }
    });
  }
}

function detectCloud(r: Row): "AWS" | "Azure" | "GCP" | "Unknown" {
  const s = JSON.stringify(r);
  if (s.includes("amazonaws.com") || "eventSource" in r) return "AWS";
  if ("protoPayload" in r || s.includes("googleapis.com")) return "GCP";
  if ("operationName" in r || s.includes("subscriptions/")) return "Azure";
  return "Unknown";
}

const COLOR: Record<string, string> = { AWS: "#ffb020", Azure: "#22e5ff", GCP: "#b6ff3b", Unknown: "#8f8aa8" };

export default function Ingestion() {
  const [rows, setRows] = useState<Row[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setName(file.name);
    setResult("");
    setRows(parseLogs(await file.text()));
  }

  const counts = rows.reduce<Record<string, number>>((a, r) => {
    const c = detectCloud(r);
    a[c] = (a[c] || 0) + 1;
    return a;
  }, {});

  const getRowEventName = (r: Row): string => {
    const eventName = typeof r.eventName === "string" ? r.eventName : undefined;
    const operationName = typeof r.operationName === "string" ? r.operationName : undefined;
    const protoPayload =
      "protoPayload" in r && r.protoPayload && typeof r.protoPayload === "object"
        ? (r.protoPayload as { methodName?: string })
        : undefined;
    return String(eventName ?? operationName ?? protoPayload?.methodName ?? "event");
  };

  async function analyze() {
    setBusy(true);
    setResult("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sample: rows.slice(0, 25), counts }),
      });
      const data = await res.json();
      setResult(data.analysis ?? data.error ?? "No response.");
    } catch {
      setResult("Request failed. Check that the dev server is running.");
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Log ingestion</h1>
        <p className="mt-1 text-[var(--mute)]">Upload CloudTrail, Azure Activity or GCP audit logs (JSON or NDJSON). Each cloud is detected automatically.</p>
      </header>

      <label className="panel flex cursor-pointer flex-col items-center gap-2 border-dashed p-10 text-center transition-shadow hover:shadow-[0_0_0_1px_var(--cyan),0_0_28px_rgba(34,229,255,.25)]">
        <span className="neon-text text-lg font-medium">{name || "Choose a log file"}</span>
        <span className="text-sm text-[var(--mute)]">.json or .log</span>
        <input type="file" accept=".json,.log,.ndjson,.txt" onChange={onFile} className="sr-only" />
      </label>

      {rows.length > 0 && (
        <>
          <section className="grid gap-3 sm:grid-cols-4">
            <div className="panel p-4">
              <p className="text-xs text-[var(--mute)]">Events parsed</p>
              <p className="mono text-2xl">{rows.length.toLocaleString()}</p>
            </div>
            {Object.entries(counts).map(([c, n]) => (
              <div key={c} className="panel p-4">
                <p className="text-xs" style={{ color: COLOR[c] }}>{c}</p>
                <p className="mono text-2xl">{n.toLocaleString()}</p>
              </div>
            ))}
          </section>

          <section className="panel overflow-x-auto p-4">
            <table className="mono w-full min-w-[520px] text-left text-xs">
              <thead className="text-[var(--mute)]">
                <tr><th className="pb-2">Cloud</th><th>Event</th><th>Time</th></tr>
              </thead>
              <tbody>
                {rows.slice(0, 8).map((r, i) => {
                  const c = detectCloud(r);
                  return (
                    <tr key={i} className="border-t border-[var(--line)]">
                      <td className="py-2" style={{ color: COLOR[c] }}>{c}</td>
                      <td>{getRowEventName(r)}</td>
                      <td className="text-[var(--mute)]">{String(r.eventTime ?? r.time ?? r.timestamp ?? "-")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <button onClick={analyze} disabled={busy}
            className="btn-neon rounded-lg px-6 py-3 font-semibold text-white disabled:opacity-50">
            {busy ? "Analyzing…" : "Analyze with AI"}
          </button>
        </>
      )}

      {result && (
        <section className="panel p-5">
          <h2 className="mb-2 text-sm text-[var(--violet)]">AI root cause explanation</h2>
          <p className="whitespace-pre-wrap leading-relaxed">{result}</p>
        </section>
      )}
    </div>
  );
}