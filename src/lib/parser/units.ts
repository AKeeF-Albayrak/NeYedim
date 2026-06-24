// Birim tanımları ve cümleden birim ayıklama.

export type UnitKind = "mass" | "count";

export interface UnitDef {
  /** unit_weights tablosundaki / hesaplamadaki kanonik ad */
  canonical: string;
  kind: UnitKind;
  /** mass birimleri için 1 birimin gram karşılığı (count birimlerinde unit_weights'ten gelir) */
  grams?: number;
}

// Birim ifadeleri -> tanım. Anahtarlar boşluklu olabilir (çok kelimeli birim).
// Daha uzun (çok kelimeli) ifadeler önce denenir.
const UNIT_ALIASES: Record<string, UnitDef> = {
  // Kütle birimleri (doğrudan grama çevrilir)
  gram: { canonical: "gram", kind: "mass", grams: 1 },
  gr: { canonical: "gram", kind: "mass", grams: 1 },
  g: { canonical: "gram", kind: "mass", grams: 1 },
  kilo: { canonical: "kilogram", kind: "mass", grams: 1000 },
  kilogram: { canonical: "kilogram", kind: "mass", grams: 1000 },
  kg: { canonical: "kilogram", kind: "mass", grams: 1000 },
  mililitre: { canonical: "mililitre", kind: "mass", grams: 1 }, // ~su yoğunluğu
  ml: { canonical: "mililitre", kind: "mass", grams: 1 },

  // Sayım/porsiyon birimleri (unit_weights tablosundan grama çevrilir)
  adet: { canonical: "adet", kind: "count" },
  tane: { canonical: "adet", kind: "count" },
  dilim: { canonical: "dilim", kind: "count" },
  bardak: { canonical: "bardak", kind: "count" },
  "su bardağı": { canonical: "bardak", kind: "count" },
  "çay bardağı": { canonical: "bardak", kind: "count" },
  kase: { canonical: "kase", kind: "count" },
  kâse: { canonical: "kase", kind: "count" },
  "yemek kaşığı": { canonical: "yemek kaşığı", kind: "count" },
  "tatlı kaşığı": { canonical: "tatlı kaşığı", kind: "count" },
  "çay kaşığı": { canonical: "çay kaşığı", kind: "count" },
  kaşık: { canonical: "yemek kaşığı", kind: "count" }, // yalın "kaşık" -> yemek kaşığı
  avuç: { canonical: "avuç", kind: "count" },
  porsiyon: { canonical: "porsiyon", kind: "count" },
  paket: { canonical: "paket", kind: "count" },
  şişe: { canonical: "şişe", kind: "count" },
  kutu: { canonical: "kutu", kind: "count" },
};

// Çok kelimeli ifadeleri önce denemek için uzunluğa göre sıralı anahtarlar
const ALIAS_KEYS = Object.keys(UNIT_ALIASES).sort(
  (a, b) => b.split(" ").length - a.split(" ").length
);

/**
 * Token dizisinin başından birim ifadesi okur.
 * "su bardağı süt" -> { unit: bardak tanımı, consumed: 2 }
 * "gram tavuk"     -> { unit: gram tanımı, consumed: 1 }
 * Birim yoksa unit=null döner.
 */
export function parseLeadingUnit(tokens: string[]): {
  unit: UnitDef | null;
  consumed: number;
} {
  for (const key of ALIAS_KEYS) {
    const parts = key.split(" ");
    if (parts.length > tokens.length) continue;
    let ok = true;
    for (let i = 0; i < parts.length; i++) {
      if (tokens[i] !== parts[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return { unit: UNIT_ALIASES[key], consumed: parts.length };
  }
  return { unit: null, consumed: 0 };
}
