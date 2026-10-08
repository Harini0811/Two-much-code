export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl border border-slate-800 bg-slate-900 p-4 ${className}`}>{children}</div>
);

export const Stat = ({ label, value, tone = '' }: { label: string; value: string | number; tone?: string }) => (
  <Card>
    <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
    <div className={`mt-1 text-2xl font-bold ${tone}`}>{value}</div>
  </Card>
);

const colors: Record<string, string> = {
  CRITICAL: 'bg-red-600', HIGH: 'bg-orange-600', MEDIUM: 'bg-yellow-600', LOW: 'bg-emerald-600',
};
export const Badge = ({ level }: { level: string }) => (
  <span className={`rounded px-2 py-0.5 text-xs font-semibold text-white ${colors[level] ?? 'bg-slate-600'}`}>{level}</span>
);

export const btn = 'rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40';