// Sunucu tarafı "admin" Supabase istemcisi (secret key).
// RLS'i baypas eder -> yalnızca kullanıcıya özel OLMAYAN referans verisi için
// (foods, unit_weights) ve sunucuda kullanılır. Asla client'a import edilmez.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase ortam değişkenleri eksik: NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SECRET_KEY gerekli."
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
