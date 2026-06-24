"use client";

import { useState } from "react";
import type { MealAnalysis } from "@/lib/analyze";

export default function MealInput({ onSaved }: { onSaved: () => void }) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<MealAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    if (!text.trim()) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/parse-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analiz başarısız");
      setPreview(data as MealAnalysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setAnalyzing(false);
    }
  }

  async function save() {
    if (!text.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Kayıt başarısız");
      setText("");
      setPreview(null);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Ne yedin?
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="örn: 2 yumurta, bir dilim peynirli tost ve bir bardak süt"
        rows={3}
        className="w-full resize-none rounded-xl border border-black/10 bg-zinc-50 p-3 text-sm text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-100"
      />

      <div className="flex gap-2">
        <button
          onClick={analyze}
          disabled={analyzing || saving || !text.trim()}
          className="flex-1 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {analyzing ? "Analiz ediliyor…" : "Analiz Et"}
        </button>
        <button
          onClick={save}
          disabled={saving || !text.trim()}
          className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
        >
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}

      {preview && (
        <div className="flex flex-col gap-2 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Önizleme
            </span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {preview.totals.calories} kcal
            </span>
          </div>
          <ul className="flex flex-col gap-1">
            {preview.items.map((it, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-zinc-700 dark:text-zinc-200">
                  {it.quantity} {it.unit} {it.query}
                  {it.matchedFood ? (
                    <span className="text-zinc-400">
                      {" → "}
                      {it.matchedFood}
                      {it.estimated && (
                        <span className="ml-1 text-[10px] text-amber-500">~tahmini</span>
                      )}
                    </span>
                  ) : (
                    <span className="ml-1 text-[10px] text-rose-500">eşleşmedi</span>
                  )}
                </span>
                {it.nutrients && (
                  <span className="shrink-0 tabular-nums text-zinc-500">
                    {it.grams}g · {it.nutrients.calories} kcal
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="text-xs text-zinc-400">
            P{preview.totals.protein} · K{preview.totals.carbs} · Y{preview.totals.fat}
          </p>
        </div>
      )}
    </div>
  );
}
