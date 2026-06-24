// Türkçe metin normalleştirme yardımcıları.

/**
 * Türkçe'ye duyarlı küçük harfe çevirme.
 * Standart toLowerCase() Türkçe'de hatalıdır: "I" -> "i" (olması gereken "ı"),
 * "İ" -> "i̇" (noktalı). Önce özel harfleri elle çeviriyoruz.
 */
export function trLower(input: string): string {
  return input
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .replace(/Ş/g, "ş")
    .replace(/Ğ/g, "ğ")
    .replace(/Ü/g, "ü")
    .replace(/Ö/g, "ö")
    .replace(/Ç/g, "ç")
    .toLowerCase();
}

/**
 * Eşleştirme için Türkçe karakterleri ASCII'ye indirger ve küçük harfe çevirir.
 * "Çörek Otu" -> "corek otu". Fuzzy eşleştirmede aksan/harf farklarını yok sayar.
 */
export function asciiFold(input: string): string {
  return trLower(input)
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

/**
 * Cümleyi token'lara böler: küçük harfe çevirir, noktalama işaretlerini
 * boşlukla değiştirir (ondalık sayılardaki , ve . korunur), fazla boşlukları atar.
 */
export function tokenize(input: string): string[] {
  const lowered = trLower(input)
    // sayı içindeki ondalık ayıracı koru (1,5 / 1.5), diğer noktalamayı boşluğa çevir
    .replace(/(\d)[.,](\d)/g, "$1·$2") // geçici işaret
    .replace(/[^\p{L}\p{N}·]+/gu, " ")
    .replace(/·/g, ".");
  return lowered.split(/\s+/).filter(Boolean);
}
