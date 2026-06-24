// Türkçe sayı kelimelerini ve rakamları sayıya çevirme.

// Temel sayı kelimeleri
const ONES: Record<string, number> = {
  sıfır: 0,
  bir: 1,
  iki: 2,
  üç: 3,
  dört: 4,
  beş: 5,
  altı: 6,
  yedi: 7,
  sekiz: 8,
  dokuz: 9,
};

const TENS: Record<string, number> = {
  on: 10,
  yirmi: 20,
  otuz: 30,
  kırk: 40,
  elli: 50,
  altmış: 60,
  yetmiş: 70,
  seksen: 80,
  doksan: 90,
};

const SCALES: Record<string, number> = {
  yüz: 100,
  bin: 1000,
};

// Kesirler ve özel miktar kelimeleri
const FRACTIONS: Record<string, number> = {
  yarım: 0.5,
  çeyrek: 0.25,
};

export const NUMBER_WORDS = new Set([
  ...Object.keys(ONES),
  ...Object.keys(TENS),
  ...Object.keys(SCALES),
  ...Object.keys(FRACTIONS),
  "buçuk",
]);

/** Tek bir token sayı kelimesi mi? (rakam ya da bilinen kelime) */
export function isNumberToken(token: string): boolean {
  if (/^\d+([.,]\d+)?$/.test(token)) return true;
  return NUMBER_WORDS.has(token);
}

/**
 * Token dizisinin başından miktarı okur.
 * "iki buçuk yumurta" -> { value: 2.5, consumed: 2 }
 * "on iki köfte"      -> { value: 12,  consumed: 2 }
 * "1,5 ekmek"         -> { value: 1.5, consumed: 1 }
 * "yarım elma"        -> { value: 0.5, consumed: 1 }
 * Sayı bulunamazsa value=null döner (çağıran varsayılan 1 kullanabilir).
 */
export function parseLeadingQuantity(tokens: string[]): {
  value: number | null;
  consumed: number;
} {
  let i = 0;
  let total = 0;
  let current = 0;
  let matched = false;
  let fraction = 0;

  while (i < tokens.length) {
    const t = tokens[i];

    // Rakamsal değer (1, 1.5, 1,5)
    if (/^\d+([.,]\d+)?$/.test(t)) {
      const val = parseFloat(t.replace(",", "."));
      current += val;
      matched = true;
      i++;
      continue;
    }

    if (t in ONES) {
      current += ONES[t];
      matched = true;
      i++;
      continue;
    }

    if (t in TENS) {
      current += TENS[t];
      matched = true;
      i++;
      continue;
    }

    if (t in SCALES) {
      const scale = SCALES[t];
      // "yüz" / "bin" çarpan gibi davranır; current 0 ise 1 kabul et (yüz = 100)
      current = (current === 0 ? 1 : current) * scale;
      matched = true;
      i++;
      continue;
    }

    if (t in FRACTIONS) {
      fraction += FRACTIONS[t];
      matched = true;
      i++;
      continue;
    }

    if (t === "buçuk") {
      fraction += 0.5;
      matched = true;
      i++;
      continue;
    }

    break;
  }

  if (!matched) return { value: null, consumed: 0 };

  total = current + fraction;
  return { value: total, consumed: i };
}
