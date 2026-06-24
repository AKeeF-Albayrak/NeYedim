// Serbest metinden ham besin kalemlerini ayıklama (DB eşleştirmesi öncesi).

import { trLower } from "./normalize";
import { parseLeadingQuantity } from "./numbers";
import { parseLeadingUnit, type UnitDef } from "./units";

export interface ExtractedItem {
  /** Miktar (belirtilmemişse 1) */
  quantity: number;
  /** Tanınan birim (yoksa null -> "adet" varsayılır) */
  unit: UnitDef | null;
  /** Eşleştirilecek besin adı metni (temizlenmiş) */
  food: string;
  /** Bu kalemin kaynak metin parçası */
  raw: string;
}

// Besin adından atılacak dolgu/fiil kelimeleri
const STOPWORDS = new Set([
  "yedim",
  "yidim",
  "yedik",
  "içtim",
  "ictim",
  "içtik",
  "tükettim",
  "aldım",
  "bir",
  "de",
  "da",
  "ile",
  "ve",
  "biraz",
  "adet",
  "tane",
]);

// Kalemleri ayıran bağlaçlar (lowered metin üzerinde).
// NOT: Virgül yalnızca ardından boşluk gelirse ayraç sayılır; böylece
// ondalık sayılar ("1,5") bölünmez.
const SPLIT_RE = /\s*,\s+|\s+ve\s+|\s+ile\s+|\s*\+\s*|\s+artı\s+|\s+ayrıca\s+|\s+bir\s+de\s+/;

function segmentTokenize(segment: string): string[] {
  return segment
    .replace(/(\d)[.,](\d)/g, "$1·$2")
    .replace(/[^\p{L}\p{N}·]+/gu, " ")
    .replace(/·/g, ".")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Bir öğün metnini ham kalemlere ayırır.
 * "2 yumurta ve bir dilim peynirli tost yedim" ->
 *   [{quantity:2, unit:null, food:"yumurta"},
 *    {quantity:1, unit:dilim, food:"peynirli tost"}]
 */
export function extractItems(text: string): ExtractedItem[] {
  const lowered = trLower(text);
  const segments = lowered.split(SPLIT_RE);
  const items: ExtractedItem[] = [];

  for (const segment of segments) {
    const tokens = segmentTokenize(segment);
    if (tokens.length === 0) continue;

    // 1) Baştan miktar oku
    const qty = parseLeadingQuantity(tokens);
    let idx = qty.consumed;
    const quantity = qty.value ?? 1;

    // 2) Miktardan sonra birim oku
    const unitRes = parseLeadingUnit(tokens.slice(idx));
    let unit: UnitDef | null = unitRes.unit;
    idx += unitRes.consumed;

    // 2b) Bazı yazımlarda birim sayıdan önce gelebilir ("dilim ekmek" gibi).
    //     Miktar bulunamadıysa baştan birimi de dene.
    if (qty.value === null && !unit) {
      const altUnit = parseLeadingUnit(tokens);
      if (altUnit.unit) {
        unit = altUnit.unit;
        idx = altUnit.consumed;
      }
    }

    // 3) Kalan token'lar besin adı; stopword'leri at
    const foodTokens = tokens.slice(idx).filter((t) => !STOPWORDS.has(t));
    const food = foodTokens.join(" ").trim();

    if (!food) continue;

    items.push({ quantity, unit, food, raw: segment.trim() });
  }

  return items;
}
