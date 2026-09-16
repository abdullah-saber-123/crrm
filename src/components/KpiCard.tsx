import type { LucideIcon } from "lucide-react";

const TONES = {
  teal: "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400",
  orange: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  purple: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  red: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  pink: "bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-400",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
} as const;

export type KpiTone = keyof typeof TONES;

export default function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "purple",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: KpiTone;
}) {
  return (
    <div className="card flex items-center justify-between gap-3 p-4">
      <div>
        <div className="text-xs text-muted">{label}</div>
        <div className="mt-1 text-xl font-semibold">{value}</div>
      </div>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${TONES[tone]}`}>
        <Icon size={20} />
      </div>
    </div>
  );
}
