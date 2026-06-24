"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface DayBar {
  label: string; // "Pzt", "Sal"...
  calories: number;
}

export default function WeeklyChart({ data }: { data: DayBar[] }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Son 7 gün — kalori
      </h2>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-black/5 dark:stroke-white/10" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="currentColor" className="text-zinc-400" />
            <YAxis tick={{ fontSize: 12 }} stroke="currentColor" className="text-zinc-400" />
            <Tooltip
              cursor={{ fill: "rgba(16,185,129,0.08)" }}
              contentStyle={{ borderRadius: 12, border: "none", fontSize: 12 }}
              formatter={(v) =>
                [`${Math.round(Number(v))} kcal`, "Kalori"] as [string, string]
              }
            />
            <Bar dataKey="calories" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
