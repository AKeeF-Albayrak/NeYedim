// Next 16 "proxy" (eski adıyla middleware).
// Her istekte Supabase oturum çerezini tazeler ve korumalı sayfaları yönlendirir.
// Not: proxy izole çalışır; paylaşılan modüllere bağlanmadan client'ı burada kurarız.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response; // env yoksa dokunma

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // getUser() oturumu Auth sunucusuna doğrulatır (güvenilir).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthPage = path === "/login";
  const isApi = path.startsWith("/api");

  // API route'ları kendi 401'ini döndürür; burada yönlendirme yapmayız.
  if (isApi) return response;

  // Giriş yapmamış kullanıcı korumalı sayfaya gidemez
  if (!user && !isAuthPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  // Giriş yapmış kullanıcı login sayfasında durmaz
  if (user && isAuthPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Statik dosyaları, görselleri ve PWA varlıklarını hariç tut
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.png$).*)",
  ],
};
