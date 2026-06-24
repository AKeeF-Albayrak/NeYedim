// NeYedim parser — genel giriş noktası.
// Hesaplama (gram/kalori) Faz 3'te eklenecek; burada yalnızca
// ayıklama + besin eşleştirme yapılır.

import { extractItems, type ExtractedItem } from "./extract";
import { matchFood, type FoodRecord, type MatchResult } from "./match";

export * from "./normalize";
export * from "./numbers";
export * from "./units";
export * from "./extract";
export * from "./match";

export interface ParsedItem<T extends FoodRecord> {
  extracted: ExtractedItem;
  match: MatchResult<T> | null;
}

/**
 * Bir öğün metnini ayıklar ve her kalemi foods listesiyle eşleştirir.
 */
export function parseMeal<T extends FoodRecord>(
  text: string,
  foods: T[],
  threshold = 60
): ParsedItem<T>[] {
  return extractItems(text).map((extracted) => ({
    extracted,
    match: matchFood(extracted.food, foods, threshold),
  }));
}
