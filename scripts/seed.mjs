// NeYedim — Veri yükleme (seed) script'i
//
// İki CSV'yi Supabase'e yükler:
//   1) Yemek_Veri_Tabani.csv -> public.foods
//   2) data/unit_weights.csv -> public.unit_weights
//
// Çalıştırma (Node 22+, env dosyasını otomatik yükler):
//   node --env-file=.env.local scripts/seed.mjs
//
// Önce supabase/schema.sql dosyasını Supabase SQL Editor'da çalıştırıp
// tabloları oluşturmuş olmanız gerekir.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error(
    "Hata: NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SECRET_KEY tanımlı değil.\n" +
      "Çalıştırma: node --env-file=.env.local scripts/seed.mjs"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const num = (v) => {
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
};

// --- foods CSV'sini oku, temizle ---------------------------------------------
function loadFoods() {
  const raw = readFileSync(join(ROOT, "Yemek_Veri_Tabani.csv"), "utf8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true });

  const mapped = rows.map((r) => ({
    name: r["Malzeme Adı"],
    calories_per_100g: num(r["Enerji (kcal)"]),
    protein_per_100g: num(r["Protein (g)"]),
    carbs_per_100g: num(r["Karbonhidrat (g)"]),
    fat_per_100g: num(r["Yağ (g)"]),
    sugar_per_100g: num(r["Şeker (g)"]),
    fiber_per_100g: num(r["Fiber (g)"]),
  }));

  // İsme göre tekilleştir: aynı isimden en yüksek kalorili olanı tut.
  // (Tam tekrarları siler, Kuşburnu=2kcal gibi hatalı satırları eler.)
  const byName = new Map();
  for (const f of mapped) {
    if (!f.name || f.calories_per_100g === null) continue;
    const prev = byName.get(f.name);
    if (!prev || f.calories_per_100g > prev.calories_per_100g) {
      byName.set(f.name, f);
    }
  }
  return { all: mapped.length, foods: [...byName.values()] };
}

// --- unit_weights CSV'sini oku ----------------------------------------------
function loadUnitWeights() {
  const raw = readFileSync(join(ROOT, "data", "unit_weights.csv"), "utf8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true });
  return rows.map((r) => ({
    food_name: r.food_name,
    unit: r.unit || "adet",
    grams_per_unit: num(r.grams_per_unit),
    note: r.note || null,
  }));
}

async function insertInBatches(table, rows, size = 500) {
  for (let i = 0; i < rows.length; i += size) {
    const batch = rows.slice(i, i + size);
    const { error } = await supabase.from(table).insert(batch);
    if (error) throw new Error(`${table} insert hatası: ${error.message}`);
  }
}

async function main() {
  const { all, foods } = loadFoods();
  const units = loadUnitWeights();

  console.log(`foods: ${all} satır okundu, ${foods.length} benzersiz kayıt yüklenecek.`);
  console.log(`unit_weights: ${units.length} kayıt yüklenecek.`);

  // Tekrar çalıştırılabilir olması için önce mevcut kayıtları temizle.
  console.log("Mevcut kayıtlar temizleniyor...");
  for (const t of ["foods", "unit_weights"]) {
    const { error } = await supabase
      .from(t)
      .delete()
      .not("id", "is", null);
    if (error) throw new Error(`${t} temizleme hatası: ${error.message}`);
  }

  console.log("foods yükleniyor...");
  await insertInBatches("foods", foods);

  console.log("unit_weights yükleniyor...");
  await insertInBatches("unit_weights", units);

  // Doğrulama
  const { count: foodCount } = await supabase
    .from("foods")
    .select("*", { count: "exact", head: true });
  const { count: unitCount } = await supabase
    .from("unit_weights")
    .select("*", { count: "exact", head: true });

  console.log(`\n✓ Bitti. foods=${foodCount}, unit_weights=${unitCount}`);
}

main().catch((err) => {
  console.error("\n✗ Seed başarısız:", err.message);
  process.exit(1);
});
