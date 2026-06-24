-- NeYedim — Kimlik doğrulama & güvenlik (RLS) geçişi
-- Supabase SQL Editor'da bir kez çalıştırın. Tekrar çalıştırılabilir (idempotent).

-- ---------------------------------------------------------------------------
-- 1) meals tablosuna kullanıcı sahipliği ekle
-- ---------------------------------------------------------------------------
alter table public.meals
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

-- Auth öncesi oluşmuş sahipsiz kayıtları temizle (kimseye ait değiller, erişilemezler)
delete from public.meals where user_id is null;

alter table public.meals alter column user_id set not null;

create index if not exists meals_user_id_idx
  on public.meals (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 2) meals üzerinde RLS: herkes yalnızca KENDİ öğünlerini görür/değiştirir
-- ---------------------------------------------------------------------------
alter table public.meals enable row level security;

drop policy if exists "meals_select_own" on public.meals;
create policy "meals_select_own" on public.meals
  for select using (auth.uid() = user_id);

drop policy if exists "meals_insert_own" on public.meals;
create policy "meals_insert_own" on public.meals
  for insert with check (auth.uid() = user_id);

drop policy if exists "meals_update_own" on public.meals;
create policy "meals_update_own" on public.meals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "meals_delete_own" on public.meals;
create policy "meals_delete_own" on public.meals
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3) Referans tabloları (foods, unit_weights): RLS açık ama politika yok.
--    Böylece public/anon anahtarla DOĞRUDAN erişilemezler; uygulamaya yalnızca
--    sunucu tarafı secret key ile (RLS'i baypas ederek) okunur.
-- ---------------------------------------------------------------------------
alter table public.foods enable row level security;
alter table public.unit_weights enable row level security;
