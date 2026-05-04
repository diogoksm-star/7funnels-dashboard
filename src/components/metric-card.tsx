import type { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
  tone?: "default" | "good" | "bad" | "warn";
};

const toneClass = {
  default: "border-white/10 bg-white/[0.04]",
  good: "border-emerald-400/25 bg-emerald-400/10",
  bad: "border-rose-400/25 bg-rose-400/10",
  warn: "border-amber-300/25 bg-amber-300/10",
};

export function MetricCard({ label, value, detail, icon, tone = "default" }: MetricCardProps) {
  return (
    <div className={`rounded-lg border p-4 ${toneClass[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">{label}</p>
        <div className="text-zinc-500">{icon}</div>
      </div>
      <p className="mt-3 text-2xl font-semibold text-zinc-50">{value}</p>
      {detail ? <p className="mt-2 text-xs text-zinc-500">{detail}</p> : null}
    </div>
  );
}
