// POST /api/parse-meal
// Gövde: { text: string }
// Döner: MealAnalysis (kalemler + toplam besin değerleri + eşleşmeyenler)

import { NextResponse } from "next/server";
import { analyzeMeal } from "@/lib/analyze";
import { fetchFoods, fetchUnitWeights } from "@/lib/data";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
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

  try {
    const [foods, unitWeights] = await Promise.all([
      fetchFoods(),
      fetchUnitWeights(),
    ]);
    const analysis = analyzeMeal(text, foods, unitWeights);
    return NextResponse.json(analysis);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    return NextResponse.json(
      { error: `Analiz başarısız: ${message}` },
      { status: 500 }
    );
  }
}
