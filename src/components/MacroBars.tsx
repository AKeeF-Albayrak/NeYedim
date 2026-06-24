import type { Nutrients } from "@/lib/types";

const round = (n: number) => Math.round(n * 10) / 10;

function Bar({
  label,
  grams,
  pct,
  color,
}: {
  label: string;
  grams: number;
  pct: number;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-zinc-600 dark:text-zinc-300">{label}</span>
        <span className="tabular-nums text-zinc-500">
          {round(grams)} g · %{Math.round(pct)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  );
}

export default function MacroBars({ totals }: { totals: Nutrients }) {
  // Kalori katkısı: protein 4, karbonhidrat 4, yağ 9 kcal/g
  const pCal = totals.protein * 4;
  const cCal = totals.carbs * 4;
  const fCal = totals.fat * 9;
  const sum = pCal + cCal + fCal || 1;

  return (
    <div className="flex flex-col gap-3">
      <Bar label="Protein" grams={totals.protein} pct={(pCal / sum) * 100} color="bg-sky-500" />
      <Bar label="Karbonhidrat" grams={totals.carbs} pct={(cCal / sum) * 100} color="bg-amber-500" />
      <Bar label="Yağ" grams={totals.fat} pct={(fCal / sum) * 100} color="bg-rose-500" />
    </div>
  );
}
