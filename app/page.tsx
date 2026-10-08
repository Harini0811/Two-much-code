import Link from "next/link";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";

const sans = Space_Grotesk({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const STAGES = ["Detect", "Explain", "Quantify", "Recommend", "Simulate", "Approve", "Remediate", "Verify", "Audit"];

const FEATURES = [
  { t: "Multi-cloud logs", d: "Upload AWS, Azure and GCP logs. Each cloud is recognized automatically." },
  { t: "Anomaly detection", d: "Spend spikes are flagged against each service's own baseline." },
  { t: "AI root cause", d: "Claude explains why the waste happened, in plain language." },
  { t: "Safe remediation", d: "Simulate, approve, fix and verify, with every step in the audit trail." },
];

export default function Home() {
  return (
    <div className={`${sans.variable} ${mono.variable} relative min-h-screen overflow-hidden`}>
      <div className="grid-bg" />
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <span className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="h-3 w-3 rounded-full bg-[var(--cyan)] shadow-[0_0_14px_var(--cyan)]" />
          CloudGuard <span className="neon-text">AI</span>
        </span>
        <Link href="/login" className="rounded-lg px-4 py-2 text-sm text-[var(--mute)] hover:text-white">
          Sign in
        </Link>
      </header>

      <main className="relative mx-auto max-w-6xl px-5 pb-20 pt-12 md:pt-20">
        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          Find cloud waste. Explain it. <span className="neon-text">Fix it safely.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-[var(--mute)]">
          CloudGuard AI reads your AWS, Azure and GCP logs, shows what you are overpaying for and why,
          then walks each fix from simulation to audit.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login" className="btn-neon rounded-lg px-6 py-3 font-semibold text-white">
            Get started
          </Link>
          <Link href="/dashboard" className="panel px-6 py-3 font-medium hover:text-[var(--cyan)]">
            View dashboard
          </Link>
        </div>

        {/* The pipeline is the centerpiece */}
        <div className="panel mt-14 overflow-x-auto p-6">
          <ol className="flex min-w-[720px] items-start">
            {STAGES.map((s, i) => {
              const cls = i < 4 ? "node-done" : i === 4 ? "node-now" : "node-next";
              return (
                <li key={s} className="flex flex-1 flex-col items-center text-center">
                  <div className="relative flex w-full items-center justify-center">
                    {i > 0 && <span className={`absolute right-1/2 h-px w-full ${i <= 4 ? "bg-[var(--cyan)]" : "bg-[var(--line)]"}`} />}
                    <span className={`mono relative z-10 grid h-10 w-10 place-items-center rounded-full text-sm font-bold ${cls}`}>{i + 1}</span>
                  </div>
                  <span className="mt-2 text-sm">{s}</span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.t} className="panel p-5">
              <h2 className="font-medium text-[var(--violet)]">{f.t}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--mute)]">{f.d}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
