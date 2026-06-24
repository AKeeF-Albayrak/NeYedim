// Tarayıcı (client component) Supabase istemcisi.
// Publishable (anon) key kullanır — bu key tarayıcıya açıktır, güvenlidir.

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  return createBrowserClient(url, key);
}
