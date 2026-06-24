# NeYedim

**Serbest metinle çalışan, kural tabanlı kişisel kalori & makro takip uygulaması**

Kullanıcı ne yediğini günlük konuşma diliyle yazar (örn. *"2 yumurta ve bir dilim peynirli tost yedim"*), uygulama bunu otomatik olarak kalori ve makro besin değerlerine (protein, karbonhidrat, yağ) çevirir. Hiçbir ücretli yapay zeka API'sine (Claude/OpenAI) bağımlı değildir; metin ayrıştırma tamamen kural tabanlı (regex + sözlük eşleştirme) bir motorla yapılır.

---

## İçindekiler

- [Proje Özeti](#proje-özeti)
- [Problem / Motivasyon](#problem--motivasyon)
- [Kullanıcı Akışı](#kullanıcı-akışı)
- [Özellikler](#özellikler)
- [Teknoloji Mimarisi](#teknoloji-mimarisi)
- [Veri Modeli](#veri-modeli)
- [Online'a Alma Planı](#onlinea-alma-planı)
- [Çalışma Planı](#çalışma-planı)
- [Gelecek Geliştirmeler](#gelecek-geliştirmeler)

---

## Proje Özeti

NeYedim, kullanıcının serbest metin olarak girdiği öğünü kendi yazılan kural tabanlı bir ayrıştırma motoruyla (regex + sözlük eşleştirme) besin/miktar kalemlerine ayırır. Her kalem, bir besin veri tabanından (100gr bazlı) eşleştirilerek kalori ve makro değerlerine çevrilir, ardından günlük/haftalık takip için kaydedilir.

## Problem / Motivasyon

Klasik kalori takip uygulamaları kullanıcıdan her besini tek tek aratıp seçmesini, porsiyon birimini manuel ayarlamasını ister. Bu süreç zaman alıcıdır ve çoğu kullanıcı bir süre sonra takibi bırakır. NeYedim bu sürtünmeyi ortadan kaldırır: kullanıcı sadece ne yediğini doğal bir dille anlatır. Hazır yapay zeka API'lerine bağımlı kalmamak, maliyetsiz ve tamamen bağımsız bir sistem kurmak amacıyla metni anlama işi kendi yazılan kural tabanlı bir motora bırakılmıştır.

## Kullanıcı Akışı

1. Kullanıcı uygulamayı açar, o öğünde ne yediğini serbest metin olarak yazar.
2. Metin backend'e gönderilir; regex + sözlük eşleştirme tabanlı ayrıştırma motoru (gerekirse Zemberek-NLP ile Türkçe kök/çekim analizi) metni ayrı besin/miktar kalemlerine böler.
3. Her kalem besin veri tabanından (100gr bazlı) eşleştirilir; adet bazlı besinlerde (örn. yumurta) `unit_weights` tablosuyla grama çevrilip oranlama yapılır.
4. Sonuçlar kullanıcıya gösterilir, günlük geçmişe kaydedilir.
5. Kullanıcı gün/hafta bazında toplam kalori ve makro dağılımını panelde görüntüler.

## Özellikler

- **Doğal dilde öğün girişi** — form doldurma yok, sadece yazarak anlatma
- **Otomatik kalori & makro hesaplama** — kural tabanlı ayrıştırma + veri tabanı eşleştirmesi, AI API'sine bağımlı değil
- **Günlük / haftalık özet panel** — toplam kalori ve makro dağılımı grafik olarak
- **Geçmiş kayıtlar** — önceki öğünlerin listesi ve düzenleme imkanı
- **Mobil uyumlu (PWA)** — telefon ana ekranına eklenip native app gibi kullanılabilir

## Teknoloji Mimarisi

| Katman | Teknoloji | Görev |
|---|---|---|
| Frontend | Next.js + Tailwind CSS | Öğün girişi, panel, geçmiş görünümü |
| Backend | Next.js API Routes | Ayrıştırma, hesaplama, veri işleme |
| Metin Ayrıştırma | Regex + sözlük eşleştirme (Zemberek-NLP) | Serbest metni besin/miktar kalemlerine ayırma — AI API'sine ihtiyaç yok |
| Besin Veri Tabanı | Kaggle "Yemek Veri Tabanı" (100gr bazlı) | Kalori/makro referans verisi |
| Birim Ağırlık Tablosu | Kendi oluşturulan referans tablo | "1 adet yumurta ≈ 50gr" gibi adet→gram dönüşümleri |
| Veritabanı | Supabase (PostgreSQL) | Kullanıcı öğünleri, geçmiş kayıtlar, referans tablolar |
| Hosting | Vercel | Otomatik deploy, ücretsiz tier |
| Mobil erişim | PWA (manifest + service worker) | Ana ekrana ekleyip native app gibi kullanma |

## Veri Modeli

**`foods`** — besin veri tabanı (Kaggle CSV'den import)

| Kolon | Tip | Açıklama |
|---|---|---|
| `id` | uuid | Birincil anahtar |
| `name` | text | Besin adı |
| `calories_per_100g` | numeric | 100gr başına kalori |
| `protein_per_100g` | numeric | 100gr başına protein |
| `carbs_per_100g` | numeric | 100gr başına karbonhidrat |
| `fat_per_100g` | numeric | 100gr başına yağ |

**`unit_weights`** — adet→gram dönüşüm tablosu

| Kolon | Tip | Açıklama |
|---|---|---|
| `food_name` | text | Besin adı (foods ile eşleşir) |
| `grams_per_unit` | numeric | 1 adedin yaklaşık gramajı |

**`meals`** — kullanıcı kayıtları

| Kolon | Tip | Açıklama |
|---|---|---|
| `id` | uuid | Birincil anahtar |
| `raw_text` | text | Kullanıcının yazdığı orijinal metin |
| `parsed_items` | jsonb | Ayrıştırılan besin/miktar kalemleri |
| `total_calories` | numeric | Toplam kalori |
| `total_protein` / `total_carbs` / `total_fat` | numeric | Toplam makrolar |
| `created_at` | timestamp | Kayıt zamanı |

## Online'a Alma Planı

1. Proje GitHub reposuna yüklenir.
2. Vercel hesabı bu repoya bağlanır; her commit'te otomatik deploy tetiklenir.
3. Supabase bağlantı bilgileri Vercel ortam değişkenleri olarak güvenli şekilde saklanır (yapay zeka API anahtarına ihtiyaç yoktur).
4. Uygulama `https://neyedim.vercel.app` benzeri bir adresten erişilebilir hale gelir.
5. PWA desteğiyle telefonda "Ana ekrana ekle" yapılarak native app deneyimine yakın bir kullanım sağlanır.

## Çalışma Planı

> Tahmini toplam süre: ~15-18 gün (part-time çalışmayla 3-4 hafta)

### Faz 0 — Altyapı Kurulumu *(1 gün)*
- [ ] `npx create-next-app` ile proje oluştur, GitHub reposunu aç
- [ ] Vercel'e bağla, boş sayfa ile ilk deploy'u yap (pipeline smoke test)
- [ ] Supabase projesi aç, `.env.local` dosyasına bağlantı bilgilerini koy

### Faz 1 — Veri Katmanı *(2-3 gün)*
- [ ] Kaggle "Yemek Veri Tabanı" CSV'sini indir, sütunları/encoding'i kontrol et, temizle
- [ ] Supabase'de `foods` tablosunu oluştur ve CSV'yi import et
- [ ] En sık yenen 30-40 besin için `unit_weights` tablosunu oluştur

### Faz 2 — Parser: Regex + Sözlük + Zemberek *(4-5 gün, en kritik aşama)*
- [ ] Zemberek-NLP'yi kur, basit bir kelime kökü bulma testi yap
- [ ] Türkçe sayı kelimelerini (bir, iki, üç...) ve rakamları yakalayan regex'i yaz
- [ ] "Sayı + besin adı + birim" kalıbını cümleden ayıklayan fonksiyonu yaz
- [ ] `rapidfuzz` ile ayıklanan besin adını `foods` tablosundaki en yakın kayıtla eşleştir
- [ ] 20-30 örnek cümleyle test et, kaçırılan kalıpları genişlet

### Faz 3 — Hesaplama Mantığı *(1 gün)*
- [ ] Adet bazlı besinleri `unit_weights` üzerinden grama çevirip 100gr'a oranlama
- [ ] Birden fazla kalem içeren cümleler için toplam kalori/makro hesaplama

### Faz 4 — Backend API Routes *(2 gün)*
- [ ] `/api/parse-meal`: metni al → parser'dan geçir → hesapla → JSON döndür
- [ ] `/api/meals`: Supabase'e kayıt ekleme ve geçmiş çekme (CRUD)

### Faz 5 — Frontend *(3-4 gün)*
- [ ] Öğün giriş ekranı (textarea + gönder butonu + sonuç gösterimi)
- [ ] Geçmiş kayıtlar listesi
- [ ] Günlük/haftalık özet paneli (recharts ile basit grafikler)

### Faz 6 — PWA Dönüşümü *(1 gün)*
- [ ] `manifest.json`, ikonlar, service worker ekle
- [ ] Telefonda "ana ekrana ekle" testini yap

### Faz 7 — Deploy & Gerçek Kullanım Testi *(1-2 gün)*
- [ ] Vercel ortam değişkenlerini ayarla, son deploy'u yap
- [ ] Birkaç gün gerçek kullanım yap, parser'ın kaçırdığı kalıpları topla ve iyileştir

### Faz 8 — Opsiyonel / İleride
- [ ] spaCy ile kendi NER modelini eğitme

## Gelecek Geliştirmeler

- **Kendi NER modelini eğitme** — spaCy ile Türkçe'ye özel bir Named Entity Recognition modeli eğitilerek, regex/sözlük yönteminin yakalayamadığı daha karmaşık ve yaratıcı cümlelerin de doğru ayrıştırılması.
- **Fotoğraftan öğün tanıma** — kullanıcının yemeğin fotoğrafını yükleyerek de giriş yapabilmesi.
- **Kişiselleştirilmiş hedefler** — günlük kalori/makro hedeflerine göre ilerleme takibi ve öneriler.
- **(Opsiyonel) Kendi sunucuda açık kaynak model** — regex/NER'in yetersiz kaldığı nadir durumlar için Ollama ile kendi sunucuda çalışan küçük bir açık kaynak modelin devreye alınması.

---

*NeYedim — Kişisel proje dokümanı*
