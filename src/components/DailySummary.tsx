import type { Nutrients } from "@/lib/types";
import CalorieRing from "./CalorieRing";
import MacroBars from "./MacroBars";

// Varsayılan günlük kalori hedefi. İleride kullanıcıya özel ayarlanabilir
// (README "Gelecek Geliştirmeler" — kişiselleştirilmiş hedefler).
export const DAILY_CALORIE_GOAL = 2000;

export default function DailySummary({ totals }: { totals: Nutrients }) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Günlük Özet
      </h2>
      <div className="flex justify-center">
        <CalorieRing calories={totals.calories} goal={DAILY_CALORIE_GOAL} />
      </div>
      <MacroBars totals={totals} />
    </div>
  );
}
