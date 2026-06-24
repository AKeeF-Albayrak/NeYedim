// Sunucu tarafı Supabase istemcisi.
// Secret key kullanır -> yalnızca API route'larda / sunucuda çağrılmalı,
// asla client component'e import edilmemeli.

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
