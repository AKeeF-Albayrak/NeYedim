"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Meal, Nutrients } from "@/lib/types";
import MealInput from "./MealInput";
import SummaryCards from "./SummaryCards";
import WeeklyChart, { type DayBar } from "./WeeklyChart";
import MealList from "./MealList";

const TR_DAYS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

function dayKey(d: Date): string {
  // yerel saatle YYYY-MM-DD
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function Dashboard() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/meals?limit=200");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Öğünler alınamadı");
      setMeals(data.meals as Meal[]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/meals/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Silinemedi");
      }
      setMeals((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setDeletingId(null);
    }
  }

  const todayTotals: Nutrients = useMemo(() => {
    const today = dayKey(new Date());
    return meals
      .filter((m) => dayKey(new Date(m.created_at)) === today)
      .reduce<Nutrients>(
        (acc, m) => ({
          calories: acc.calories + Number(m.total_calories),
          protein: acc.protein + Number(m.total_protein),
          carbs: acc.carbs + Number(m.total_carbs),
          fat: acc.fat + Number(m.total_fat),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
  }, [meals]);

  const weekly: DayBar[] = useMemo(() => {
    const days: { key: string; label: string; calories: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({ key: dayKey(d), label: TR_DAYS[d.getDay()], calories: 0 });
    }
    const byKey = new Map(days.map((d) => [d.key, d]));
    for (const m of meals) {
      const k = dayKey(new Date(m.created_at));
      const bucket = byKey.get(k);
      if (bucket) bucket.calories += Number(m.total_calories);
    }
    return days.map(({ label, calories }) => ({ label, calories }));
  }, [meals]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          NeYedim
        </h1>
        <span className="text-xs text-zinc-400">
          {new Date().toLocaleDateString("tr-TR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </span>
      </header>

      <MealInput onSaved={load} />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Bugün
        </h2>
        <SummaryCards totals={todayTotals} />
      </section>

      <WeeklyChart data={weekly} />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Geçmiş
        </h2>
        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </p>
        )}
        {loading ? (
          <p className="text-sm text-zinc-400">Yükleniyor…</p>
        ) : (
          <MealList meals={meals} onDelete={remove} deletingId={deletingId} />
        )}
      </section>
    </div>
  );
}
