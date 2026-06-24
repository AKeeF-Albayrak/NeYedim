// /api/meals/[id]
//   PUT    -> { text } alır, yeniden analiz edip kaydı günceller
//   DELETE -> kaydı siler
//
// RLS yalnızca sahibinin erişmesine izin verir; ayrıca user_id ile de filtreleriz.
// NOT: Next 16'da dinamik route params bir Promise'tir, await edilmelidir.

import { NextResponse } from "next/server";
import { analyzeMeal } from "@/lib/analyze";
import { fetchFoods, fetchUnitWeights } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;

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
      .update({
        raw_text: text,
        parsed_items: analysis.items,
        total_calories: analysis.totals.calories,
        total_protein: analysis.totals.protein,
        total_carbs: analysis.totals.carbs,
        total_fat: analysis.totals.fat,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) {
      return NextResponse.json({ error: "Öğün bulunamadı." }, { status: 404 });
    }
    return NextResponse.json({ meal: data, analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    return NextResponse.json(
      { error: `Öğün güncellenemedi: ${message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }

  try {
    const { error } = await supabase
      .from("meals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    return NextResponse.json(
      { error: `Öğün silinemedi: ${message}` },
      { status: 500 }
    );
  }
}
