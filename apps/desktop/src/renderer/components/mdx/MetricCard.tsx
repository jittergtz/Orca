import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

type MetricCardProps = {
  label?: string | null;
  value?: string | number | null;
  change?: string | null;
};

function getChangeTone(change: string | null | undefined) {
  if (!change) {
    return {
      className: "text-neutral-500 dark:text-neutral-400",
      icon: ArrowRight,
    };
  }

  if (change.trim().startsWith("-")) {
    return {
      className: "text-red-500 dark:text-red-400",
      icon: ArrowDownRight,
    };
  }

  if (change.includes("+") || /\d/.test(change)) {
    return {
      className: "text-emerald-600 dark:text-emerald-400",
      icon: ArrowUpRight,
    };
  }

  return {
    className: "text-neutral-500 dark:text-neutral-400",
    icon: ArrowRight,
  };
}

export function MetricCard({ label, value, change }: MetricCardProps) {
  const tone = getChangeTone(change);
  const Icon = tone.icon;

  return (
    <div className="my-6 rounded-lg border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.03] px-5 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
        {label || "Metric"}
      </div>
      <div className="mt-2 flex items-end justify-between gap-4">
        <div className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          {value ?? "N/A"}
        </div>
        {change ? (
          <div className={`mb-1 inline-flex items-center gap-1 text-sm font-medium ${tone.className}`}>
            <Icon size={16} />
            <span>{change}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
