"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/ingestion", label: "Log ingestion" },
  { href: "/anomalies", label: "Anomalies" },
  { href: "/approvals", label: "Approvals" },
  { href: "/clouds", label: "Clouds" },
  { href: "/audit", label: "Audit" },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <nav className="flex items-center gap-4 overflow-x-auto border-b border-[var(--line)] bg-[var(--panel)]/80 px-4 py-3 backdrop-blur md:sticky md:top-0 md:h-screen md:w-60 md:flex-col md:items-stretch md:gap-2 md:border-b-0 md:border-r md:px-5 md:py-6">
      <div className="mr-2 flex shrink-0 items-center gap-2 md:mb-6">
        <span className="h-3 w-3 rounded-full bg-[var(--cyan)] shadow-[0_0_14px_var(--cyan)]" />
        <span className="text-lg font-semibold tracking-tight">
          CloudGuard <span className="neon-text">AI</span>
        </span>
      </div>
      {LINKS.map((l) => {
        const active = path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-[var(--violet)]/20 text-white shadow-[inset_0_0_0_1px_var(--violet)]"
                : "text-[var(--mute)] hover:text-white"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
      <div className="mono mt-auto hidden text-xs text-[var(--mute)] md:block">
        AWS · Azure · GCP connected
      </div>
    </nav>
  );
}