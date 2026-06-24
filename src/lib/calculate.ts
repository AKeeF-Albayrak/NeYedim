// Miktar + birim + besin -> gram -> kalori/makro hesaplama (Faz 3).

import type { ExtractedItem } from "./parser/extract";
import type { Food, UnitWeight, Nutrients } from "./types";

// Besine özel unit_weights bulunamayınca kullanılacak genel birim gramajları.
// (Sıvılar ~su yoğunluğu, kaşıklar tipik değerler.)
const DEFAULT_UNIT_GRAMS: Record<string, number> = {
  bardak: 200,
  kase: 200,
  porsiyon: 200,
  avuç: 30,
  "yemek kaşığı": 15,
  "tatlı kaşığı": 7,
  "çay kaşığı": 5,
  paket: 50,
  şişe: 500,
  kutu: 330,
  dilim: 30,
};

// adet/tane için besine özel ağırlık yoksa son çare varsayım (1 adet ~100g).
const ADET_FALLBACK_GRAMS = 100;

export type GramSource =
  | "mass" // doğrudan gram/kg
  | "unit_weights" // besine özel tablo
  | "default_unit" // genel birim varsayımı
  | "fallback"; // bilinmeyen adet -> 100g

export interface GramResult {
  grams: number;
  source: GramSource;
  /** Varsayıma dayalıysa (kesin değilse) true */
  estimated: boolean;
}

/**
 * Bir kalemin toplam gram karşılığını çözer.
 */
export function resolveGrams(
  item: ExtractedItem,
  food: Food,
  unitWeights: UnitWeight[]
): GramResult {
  const qty = item.quantity;
  const unit = item.unit;

  // 1) Kütle birimi: doğrudan grama çevir
  if (unit && unit.kind === "mass") {
    return { grams: qty * (unit.grams ?? 1), source: "mass", estimated: false };
  }

  // Birim yoksa "adet" varsay
  const canonical = unit?.canonical ?? "adet";

  // 2) Besine özel unit_weights kaydı
  const uw = unitWeights.find(
    (u) => u.food_name === food.name && u.unit === canonical
  );
  if (uw) {
    return {
      grams: qty * uw.grams_per_unit,
      source: "unit_weights",
      estimated: false,
    };
  }

  // 3) Genel birim varsayımı (bardak, kaşık, dilim...)
  if (canonical in DEFAULT_UNIT_GRAMS) {
    return {
      grams: qty * DEFAULT_UNIT_GRAMS[canonical],
      source: "default_unit",
      estimated: true,
    };
  }

  // 4) Bilinmeyen adet/tane: son çare 100g
  return { grams: qty * ADET_FALLBACK_GRAMS, source: "fallback", estimated: true };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Verilen gram için besinin kalori/makro değerlerini hesaplar (100g bazından oranlar).
 */
export function nutrientsForGrams(grams: number, food: Food): Nutrients {
  const f = grams / 100;
  return {
    calories: round1(food.calories_per_100g * f),
    protein: round1(food.protein_per_100g * f),
    carbs: round1(food.carbs_per_100g * f),
    fat: round1(food.fat_per_100g * f),
  };
}

/**
 * Birden fazla besin değerini toplar.
 */
export function sumNutrients(list: Nutrients[]): Nutrients {
  return list.reduce(
    (acc, n) => ({
      calories: round1(acc.calories + n.calories),
      protein: round1(acc.protein + n.protein),
      carbs: round1(acc.carbs + n.carbs),
      fat: round1(acc.fat + n.fat),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
