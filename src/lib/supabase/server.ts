// Kullanıcı oturumuna bağlı (cookie tabanlı) sunucu Supabase istemcisi.
// Publishable (anon) key kullanır; RLS politikaları bu istemci üzerinden uygulanır.
// Server Component'ler ve Route Handler'lar içinde kullanılır.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

function readEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase ortam değişkenleri eksik: NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY gerekli."
    );
  }
  return { url, key };
}

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const { url, key } = readEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component'ten çağrıldığında cookie yazılamaz;
          // oturum yenileme proxy.ts içinde yapılır.
        }
      },
    },
  });
}

/**
 * Oturum açmış kullanıcıyı döndürür (yoksa null).
 * getUser() Supabase Auth sunucusuna doğrulatır (güvenilir).
 */
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
