// /api/meals
//   GET  -> giriş yapan kullanıcının son öğünleri (?limit=50)
//   POST -> { text } alır, sunucuda analiz edip kullanıcıya kaydeder
//
// Tüm işlemler kullanıcı oturumuna bağlıdır; RLS politikaları erişimi izole eder.

import { NextResponse } from "next/server";
import { analyzeMeal } from "@/lib/analyze";
import { fetchFoods, fetchUnitWeights } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return NextResponse.json({ meals: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    return NextResponse.json(
      { error: `Öğünler çekilemedi: ${message}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövde." }, { status: 400 });
  }

  const text =
    typeof body === "object" && body !== null && "text" in body
      ? (body as { text: unknown }).text
      : undefined;

  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json(
      { error: "'text' alanı zorunlu ve boş olamaz." },
      { status: 400 }
    );
  }
  if (text.length > 1000) {
    return NextResponse.json(
      { error: "Metin çok uzun (en fazla 1000 karakter)." },
      { status: 400 }
    );
  }

  try {
    const [foods, unitWeights] = await Promise.all([
      fetchFoods(),
      fetchUnitWeights(),
    ]);
    const analysis = analyzeMeal(text, foods, unitWeights);

    const { data, error } = await supabase
      .from("meals")
      .insert({
        user_id: user.id,
        raw_text: text,
        parsed_items: analysis.items,
        total_calories: analysis.totals.calories,
        total_protein: analysis.totals.protein,
        total_carbs: analysis.totals.carbs,
        total_fat: analysis.totals.fat,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ meal: data, analysis }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    return NextResponse.json(
      { error: `Öğün kaydedilemedi: ${message}` },
      { status: 500 }
    );
  }
}
