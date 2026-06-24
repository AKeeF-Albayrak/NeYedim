// Ayıklanan besin adını foods kayıtlarıyla bulanık (fuzzy) eşleştirme.

import * as fuzz from "fuzzball";
import { asciiFold } from "./normalize";
import { applySynonyms } from "./synonyms";

export interface FoodRecord {
  name: string;
  // hesaplama için diğer alanlar çağıran tarafında taşınır
  [key: string]: unknown;
}

export interface MatchResult<T extends FoodRecord> {
  food: T;
  score: number; // 0-100
}

/**
 * Besin adı sorgusunu aday listesiyle eşleştirir, en iyi eşleşmeyi döndürür.
 * Eşik altındaysa (varsayılan 60) null döner.
 *
 * Normalleştirmeyi (Türkçe -> aksansız küçük harf) tamamen kendimiz yapıyoruz;
 * fuzzball'un kendi full_process'i Türkçe harfleri farklı işlediği için kapalı.
 * Eşit skorlu adaylarda en kısa (en öz) ad seçilir: "portakal" -> "Portakal"
 * (yoksa "Konsantre Portakal Suyu" gibi yanlış üst-küme seçilebilir).
 */
export function matchFood<T extends FoodRecord>(
  query: string,
  foods: T[],
  threshold = 60
): MatchResult<T> | null {
  if (!query || foods.length === 0) return null;

  const folded = applySynonyms(asciiFold(query));

  const results = fuzz.extract(folded, foods, {
    scorer: fuzz.token_set_ratio,
    processor: (choice: T) => asciiFold(choice.name),
    full_process: false,
    limit: 10,
    cutoff: threshold,
  }) as [T, number, number][];

  if (results.length === 0) return null;

  const maxScore = results[0][1];
  // En yüksek skoru paylaşan adaylar arasında en kısa adı seç
  const best = results
    .filter(([, score]) => score === maxScore)
    .sort(
      ([a], [b]) => asciiFold(a.name).length - asciiFold(b.name).length
    )[0];

  return { food: best[0], score: best[1] };
}
