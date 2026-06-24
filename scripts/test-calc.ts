// Uçtan uca hesaplama testi (parse -> match -> gram -> kalori/makro).
// Çalıştırma:  npx tsx scripts/test-calc.ts

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse } from "csv-parse/sync";
import { analyzeMeal } from "../src/lib/analyze";
import type { Food, UnitWeight } from "../src/lib/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadFoods(): Food[] {
  const raw = readFileSync(join(ROOT, "Yemek_Veri_Tabani.csv"), "utf8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true });
  const byName = new Map<string, Food>();
  for (const r of rows as Record<string, string>[]) {
    const name = r["Malzeme Adı"];
    const cal = Number(r["Enerji (kcal)"]);
    if (!name || !Number.isFinite(cal)) continue;
    const f: Food = {
      name,
      calories_per_100g: cal,
      protein_per_100g: Number(r["Protein (g)"]) || 0,
      carbs_per_100g: Number(r["Karbonhidrat (g)"]) || 0,
      fat_per_100g: Number(r["Yağ (g)"]) || 0,
      sugar_per_100g: Number(r["Şeker (g)"]) || 0,
      fiber_per_100g: Number(r["Fiber (g)"]) || 0,
    };
    const prev = byName.get(name);
    if (!prev || cal > prev.calories_per_100g) byName.set(name, f);
  }
  return [...byName.values()];
}

function loadUnitWeights(): UnitWeight[] {
  const raw = readFileSync(join(ROOT, "data", "unit_weights.csv"), "utf8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true });
  return (rows as Record<string, string>[]).map((r) => ({
    food_name: r.food_name,
    unit: r.unit || "adet",
    grams_per_unit: Number(r.grams_per_unit),
    note: r.note || null,
  }));
}

const SENTENCES = [
  "2 yumurta ve bir dilim peynirli tost yedim",
  "3 yumurta, yarım ekmek ve bir bardak süt içtim",
  "100 gram tavuk göğsü yedim",
  "bir armut yedim",
  "iki muz ve bir avuç badem",
  "150 gr yoğurt ve bir yemek kaşığı bal",
  "yarım kilo karpuz",
  "bir kase mercimek çorbası",
  "1,5 bardak süt",
];

function main() {
  const foods = loadFoods();
  const unitWeights = loadUnitWeights();
  console.log(`foods=${foods.length}, unit_weights=${unitWeights.length}\n`);

  for (const s of SENTENCES) {
    const res = analyzeMeal(s, foods, unitWeights);
    console.log(`» ${s}`);
    for (const it of res.items) {
      if (!it.matchedFood) {
        console.log(`   ✗ "${it.query}" eşleşmedi`);
        continue;
      }
      const est = it.estimated ? " ~tahmini" : "";
      console.log(
        `   ${it.quantity} ${it.unit} ${it.query} → ${it.matchedFood} | ` +
          `${it.grams}g${est} | ${it.nutrients!.calories} kcal ` +
          `(P${it.nutrients!.protein} K${it.nutrients!.carbs} Y${it.nutrients!.fat})`
      );
    }
    const t = res.totals;
    console.log(
      `   ── TOPLAM: ${t.calories} kcal | P${t.protein} K${t.carbs} Y${t.fat}\n`
    );
  }
}

main();
