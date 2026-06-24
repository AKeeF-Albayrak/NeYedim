-- NeYedim — Veri katmanı şeması (Faz 1)
-- Supabase SQL Editor'da bir kez çalıştırın.

-- ---------------------------------------------------------------------------
-- foods: besin veri tabanı (Kaggle "Yemek Veri Tabanı" CSV'sinden import edilir)
-- Tüm değerler 100 gram baz alınarak tutulur.
-- ---------------------------------------------------------------------------
create table if not exists public.foods (
  id                 uuid primary key default gen_random_uuid(),
  name               text    not null,
  calories_per_100g  numeric not null,
  protein_per_100g   numeric not null,
  carbs_per_100g     numeric not null,
  fat_per_100g       numeric not null,
  sugar_per_100g     numeric,
  fiber_per_100g     numeric,
  created_at         timestamptz not null default now()
);

-- İsme göre arama / eşleştirme için indeks
create index if not exists foods_name_idx on public.foods (name);

-- Bulanık (fuzzy) eşleştirmeyi DB tarafında da hızlandırmak için trigram indeksi.
-- (Parser'da rapidfuzz kullanılsa bile, SQL ilike/similarity aramaları için faydalı.)
create extension if not exists pg_trgm;
create index if not exists foods_name_trgm_idx
  on public.foods using gin (name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- unit_weights: adet/dilim/bardak/kaşık -> gram dönüşüm tablosu
-- Örn. "1 adet armut ≈ 178 g", "1 dilim ekmek ≈ 25 g", "1 bardak süt ≈ 200 g"
-- food_name, foods.name ile eşleşir (parser bunu kullanarak grama çevirir).
-- ---------------------------------------------------------------------------
create table if not exists public.unit_weights (
  id             uuid primary key default gen_random_uuid(),
  food_name      text    not null,
  unit           text    not null default 'adet',
  grams_per_unit numeric not null,
  note           text
);

-- Aynı besin + birim ikilisi tekrar etmesin
create unique index if not exists unit_weights_food_unit_idx
  on public.unit_weights (food_name, unit);

-- ---------------------------------------------------------------------------
-- meals: kullanıcının kaydettiği öğünler
-- parsed_items, analyzeMeal çıktısındaki kalem listesini (jsonb) tutar.
-- (Tek kullanıcılı kişisel sürüm; çok kullanıcı eklenince user_id kolonu gelir.)
-- ---------------------------------------------------------------------------
create table if not exists public.meals (
  id             uuid primary key default gen_random_uuid(),
  raw_text       text not null,
  parsed_items   jsonb not null default '[]'::jsonb,
  total_calories numeric not null default 0,
  total_protein  numeric not null default 0,
  total_carbs    numeric not null default 0,
  total_fat      numeric not null default 0,
  created_at     timestamptz not null default now()
);

-- Geçmişi tarihe göre listelemek için indeks
create index if not exists meals_created_at_idx
  on public.meals (created_at desc);
