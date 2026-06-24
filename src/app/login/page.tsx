"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const supabase = createSupabaseBrowserClient();

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // E-posta onayı kapalıysa oturum hemen açılır; açıksa onay beklenir.
        if (data.session) {
          router.push("/");
          router.refresh();
        } else {
          setInfo(
            "Kayıt alındı. E-posta onayı açıksa gelen kutunu kontrol et, sonra giriş yap."
          );
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            NeYedim
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {mode === "signin" ? "Hesabına giriş yap" : "Yeni hesap oluştur"}
          </p>
        </div>

        <form
          onSubmit={submit}
          className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900"
        >
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-zinc-50 p-3 text-sm text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="Şifre (en az 6 karakter)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-zinc-50 p-3 text-sm text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-100"
          />

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
          >
            {busy
              ? "Lütfen bekle…"
              : mode === "signin"
                ? "Giriş Yap"
                : "Kayıt Ol"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-500">
          {mode === "signin" ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setInfo(null);
            }}
            className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
          >
            {mode === "signin" ? "Kayıt ol" : "Giriş yap"}
          </button>
        </p>
      </div>
    </div>
  );
}
