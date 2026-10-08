"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/lib/supabase";

type AuditRow = {
  id: string;
  created_at: string;
  finding_id: string | null;
  action: string;
  actor: string | null;
  details: string | null;
};

export default function AuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) setError(error.message);
      else setRows(data ?? []);
      setLoading(false);
    })();
  }, []);

  const shown = rows.filter((r) =>
    `${r.action} ${r.actor ?? ""} ${r.details ?? ""}`
      .toLowerCase()
      .includes(filter.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-cyan-300">Audit Trail</h1>

      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by action, actor, details..."
        className="w-full max-w-md rounded-lg border border-cyan-500/40 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-400"
      />

      {loading && <p className="text-gray-400">Loading...</p>}
      {error && <p className="text-red-400">Error: {error}</p>}
      {!loading && !error && shown.length === 0 && (
        <p className="text-gray-400">No audit entries yet.</p>
      )}

      <ul className="space-y-2">
        {shown.map((r) => (
          <li
            key={r.id}
            className="rounded-lg border border-cyan-500/30 bg-white/5 p-3"
          >
            <div className="flex justify-between text-xs text-gray-400">
              <span>{new Date(r.created_at).toLocaleString()}</span>
              <span>{r.actor ?? "system"}</span>
            </div>
            <p className="mt-1 font-semibold text-fuchsia-300">{r.action}</p>
            {r.details && (
              <p className="text-sm text-gray-300">{r.details}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}