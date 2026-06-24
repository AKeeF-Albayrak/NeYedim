"use client";

import type { Meal } from "@/lib/types";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MealList({
  meals,
  onDelete,
  deletingId,
}: {
  meals: Meal[];
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  if (meals.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-black/10 p-6 text-center text-sm text-zinc-400 dark:border-white/10">
        Henüz öğün kaydı yok. Yukarıdan ne yediğini yazıp kaydet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {meals.map((m) => (
        <li
          key={m.id}
          className="flex items-start justify-between gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
              {m.raw_text}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {formatTime(m.created_at)} ·{" "}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {Math.round(m.total_calories)} kcal
              </span>{" "}
              · P{Math.round(m.total_protein)} K{Math.round(m.total_carbs)} Y
              {Math.round(m.total_fat)}
            </p>
          </div>
          <button
            onClick={() => onDelete(m.id)}
            disabled={deletingId === m.id}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-40 dark:text-rose-400 dark:hover:bg-rose-950/40"
            aria-label="Öğünü sil"
          >
            {deletingId === m.id ? "Siliniyor…" : "Sil"}
          </button>
        </li>
      ))}
    </ul>
  );
}
