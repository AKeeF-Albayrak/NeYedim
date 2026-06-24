// Günlük kalori donut'u (SVG halka). Tüketilen kaloriyi merkezde gösterir,
// halka hedefe göre dolar.

export default function CalorieRing({
  calories,
  goal,
}: {
  calories: number;
  goal: number;
}) {
  const size = 180;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progress = goal > 0 ? Math.min(calories / goal, 1) : 0;
  const offset = c * (1 - progress);
  const pct = Math.round(progress * 100);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-zinc-200 dark:stroke-zinc-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke="#10b981"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
          {Math.round(calories)}
        </span>
        <span className="text-xs text-zinc-400">/ {goal} kcal</span>
        <span className="mt-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          %{pct}
        </span>
      </div>
    </div>
  );
}
