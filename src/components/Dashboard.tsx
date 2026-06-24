"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Meal, Nutrients } from "@/lib/types";
import MealInput from "./MealInput";
import DailySummary from "./DailySummary";
import WeeklyChart, { type DayBar } from "./WeeklyChart";
import MealList from "./MealList";
import LogoutButton from "./LogoutButton";

const TR_DAYS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

function dayKey(d: Date): string {
  // yerel saatle YYYY-MM-DD
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function Dashboard({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/meals?limit=200");
      // Oturum yoksa giriş sayfasına yönlendir
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Öğünler alınamadı");
      setMeals(data.meals as Meal[]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setLoading(false);
    }
  }, [router]);

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
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <header className="flex items-center justify-between gap-3 border-b border-black/5 pb-4 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 2v7a2.5 2.5 0 0 0 5 0V2" />
              <path d="M9.5 9v13" />
              <path d="M18 2c-1.5 1.5-1.5 4-.5 5.5S18 11 18 13v9" />
            </svg>
          </span>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              NeYedim
            </h1>
            <span className="text-xs text-zinc-400">
              {new Date().toLocaleDateString("tr-TR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="max-w-[12rem] truncate text-xs text-zinc-500 dark:text-zinc-400">
            {userEmail}
          </span>
          <LogoutButton />
        </div>
      </header>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
        {/* Sol: öğün girişi */}
        <MealInput onSaved={load} />

        {/* Orta: günlük özet (donut + makrolar) */}
        <DailySummary totals={todayTotals} />

        {/* Sağ: haftalık grafik + geçmiş */}
        <div className="flex flex-col gap-4">
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
      </div>
    </div>
  );
}
