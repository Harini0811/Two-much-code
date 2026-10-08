"use client";
import { useState } from "react";

type Cloud = {
  id: string; name: string; color: string; field: string; placeholder: string;
  role: string; resources: string[];
};

const CLOUDS: Cloud[] = [
  { id: "aws", name: "AWS", color: "#ffb020", field: "Read-only role ARN",
    placeholder: "arn:aws:iam::123456789012:role/CloudGuardReadOnly",
    role: "IAM role with the ReadOnlyAccess and Billing view policies",
    resources: ["EC2", "EBS", "NAT gateways", "S3", "Cost Explorer"] },
  { id: "azure", name: "Azure", color: "#22e5ff", field: "Subscription ID",
    placeholder: "00000000-0000-0000-0000-000000000000",
    role: "Reader role plus Cost Management Reader on the subscription",
    resources: ["VMs", "Managed disks", "AKS", "Storage", "Cost Management"] },
  { id: "gcp", name: "GCP", color: "#b6ff3b", field: "Project ID",
    placeholder: "my-project-123",
    role: "Viewer and Billing Account Viewer roles on the project",
    resources: ["Compute Engine", "BigQuery", "Cloud Storage", "Billing export"] },
];

export default function Clouds() {
  const [connected, setConnected] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [value, setValue] = useState("");

  function save(id: string) {
    if (!value.trim()) return;
    setConnected((c) => ({ ...c, [id]: value.trim() }));
    setOpen(null);
    setValue("");
  }

  function disconnect(id: string) {
    setConnected((c) => {
      const n = { ...c };
      delete n[id];
      return n;
    });
  }

  const count = Object.keys(connected).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Cloud connections</h1>
        <p className="mt-1 text-[var(--mute)]">
          {count} of 3 clouds connected. CloudGuard asks for read-only access first. Fixes only run after you approve them.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {CLOUDS.map((c) => {
          const on = c.id in connected;
          return (
            <article key={c.id} className="panel space-y-3 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold" style={{ color: c.color }}>{c.name}</h2>
                <span className={`mono text-xs ${on ? "text-[var(--lime)]" : "text-[var(--mute)]"}`}>
                  {on ? "Connected" : "Not connected"}
                </span>
              </div>
              <p className="text-sm text-[var(--mute)]">{c.role}</p>
              <p className="mono text-xs text-[var(--mute)]">{c.resources.join(" · ")}</p>

              {on && <p className="mono break-all text-xs">{connected[c.id]}</p>}

              {open === c.id && (
                <div className="space-y-2">
                  <label className="block text-sm text-[var(--mute)]">
                    {c.field}
                    <input
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder={c.placeholder}
                      className="mono mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--ink)] px-3 py-2 text-xs text-white outline-none focus:border-[var(--cyan)]"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => save(c.id)}
                      className="btn-neon flex-1 rounded-lg px-3 py-2 text-sm font-semibold text-white">Save connection</button>
                    <button onClick={() => { setOpen(null); setValue(""); }}
                      className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-[var(--mute)]">Cancel</button>
                  </div>
                </div>
              )}

              {open !== c.id && (on ? (
                <button onClick={() => disconnect(c.id)}
                  className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-[var(--mute)] hover:border-[var(--pink)] hover:text-white">
                  Disconnect
                </button>
              ) : (
                <button onClick={() => { setOpen(c.id); setValue(""); }}
                  className="btn-neon w-full rounded-lg px-3 py-2 text-sm font-semibold text-white">
                  Connect {c.name}
                </button>
              ))}
            </article>
          );
        })}
      </div>

      <p className="text-sm text-[var(--mute)]">
        Never paste secret access keys here. Use a read-only role or service account, and keep any secret values in <span className="mono">.env.local</span> on the server.
      </p>
    </div>
  );
}