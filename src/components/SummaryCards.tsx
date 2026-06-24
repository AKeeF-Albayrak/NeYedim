import type { Nutrients } from "@/lib/types";

const round = (n: number) => Math.round(n * 10) / 10;

function Card({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: number;
  unit: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span className={`text-2xl font-bold tabular-nums ${accent}`}>
        {round(value)}
        <span className="ml-1 text-sm font-normal text-zinc-400">{unit}</span>
      </span>
    </div>
  );
}

export default function SummaryCards({ totals }: { totals: Nutrients }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card label="Kalori" value={totals.calories} unit="kcal" accent="text-emerald-600 dark:text-emerald-400" />
      <Card label="Protein" value={totals.protein} unit="g" accent="text-sky-600 dark:text-sky-400" />
      <Card label="Karbonhidrat" value={totals.carbs} unit="g" accent="text-amber-600 dark:text-amber-400" />
      <Card label="Yağ" value={totals.fat} unit="g" accent="text-rose-600 dark:text-rose-400" />
    </div>
  );
}
