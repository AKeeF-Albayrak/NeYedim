// NeYedim çekirdek motoru: serbest metin -> kalemler + toplam besin değerleri.
// API route (Faz 4) bu fonksiyonu çağıracak.

import { parseMeal } from "./parser";
import { resolveGrams, nutrientsForGrams, sumNutrients } from "./calculate";
import type { Food, UnitWeight, Nutrients } from "./types";

export interface MealItem {
  /** Kaynak metin parçası */
  raw: string;
  quantity: number;
  unit: string;
  /** Metinden ayıklanan besin adı */
  query: string;
  /** Eşleşen foods kaydının adı (yoksa null) */
  matchedFood: string | null;
  matchScore: number | null;
  grams: number | null;
  nutrients: Nutrients | null;
  /** Gram değeri varsayıma dayalıysa (kesin değil) */
  estimated: boolean;
}

export interface MealAnalysis {
  items: MealItem[];
  totals: Nutrients;
  /** Eşleşmeyen besin sorguları */
  unmatched: string[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Bir öğün metnini analiz eder: ayıkla -> eşleştir -> grama çevir -> hesapla -> topla.
 */
export function analyzeMeal(
  text: string,
  foods: Food[],
  unitWeights: UnitWeight[],
  threshold = 60
): MealAnalysis {
  const parsed = parseMeal<Food>(text, foods, threshold);
  const items: MealItem[] = [];
  const unmatched: string[] = [];
  const nutrientList: Nutrients[] = [];

  for (const { extracted, match } of parsed) {
    const unit = extracted.unit?.canonical ?? "adet";

    if (!match) {
      unmatched.push(extracted.food);
      items.push({
        raw: extracted.raw,
        quantity: extracted.quantity,
        unit,
        query: extracted.food,
        matchedFood: null,
        matchScore: null,
        grams: null,
        nutrients: null,
        estimated: false,
      });
      continue;
    }

    const food = match.food;
    const gram = resolveGrams(extracted, food, unitWeights);
    const nutrients = nutrientsForGrams(gram.grams, food);
    nutrientList.push(nutrients);

    items.push({
      raw: extracted.raw,
      quantity: extracted.quantity,
      unit,
      query: extracted.food,
      matchedFood: food.name,
      matchScore: match.score,
      grams: round1(gram.grams),
      nutrients,
      estimated: gram.estimated,
    });
  }

  return { items, totals: sumNutrients(nutrientList), unmatched };
}
