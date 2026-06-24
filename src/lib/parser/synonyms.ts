// Eş anlamlı / halk dilindeki adları veri tabanındaki terimlere eşler.
// Anahtarlar ve değerler asciiFold edilmiş (küçük, aksansız) haldedir,
// çünkü eşleştirme öncesi sorgu da fold edilir.

const SYNONYMS: Record<string, string> = {
  // Kümes hayvanları: kullanıcı "tavuk" der, DB'de "piliç" geçer
  tavuk: "pilic",
  // Yaygın halk dili karşılıkları
  domat: "domates",
  patetes: "patates",
  yogurt: "yogurt",
};

/**
 * asciiFold edilmiş bir besin sorgusundaki token'ları eş anlamlılarıyla değiştirir.
 */
export function applySynonyms(foldedQuery: string): string {
  return foldedQuery
    .split(/\s+/)
    .map((tok) => SYNONYMS[tok] ?? tok)
    .join(" ");
}
