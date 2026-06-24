// foods ve unit_weights referans verisini Supabase'den çeker.
// Bu tablolar nadiren değiştiği için süreç içi (in-memory) önbellek kullanılır;
// her parse isteğinde 460 satırı yeniden çekmemek için.

import { getSupabaseAdmin } from "./supabase/admin";
import type { Food, UnitWeight } from "./types";

const TTL_MS = 5 * 60 * 1000; // 5 dakika

interface Cache<T> {
  data: T | null;
  at: number;
}

const foodsCache: Cache<Food[]> = { data: null, at: 0 };
const unitsCache: Cache<UnitWeight[]> = { data: null, at: 0 };

function fresh<T>(c: Cache<T>): boolean {
  return c.data !== null && Date.now() - c.at < TTL_MS;
}

export async function fetchFoods(): Promise<Food[]> {
  if (fresh(foodsCache)) return foodsCache.data!;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("foods")
    .select(
      "id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, sugar_per_100g, fiber_per_100g"
    );

  if (error) throw new Error(`foods çekilemedi: ${error.message}`);

  foodsCache.data = (data ?? []) as Food[];
  foodsCache.at = Date.now();
  return foodsCache.data;
}

export async function fetchUnitWeights(): Promise<UnitWeight[]> {
  if (fresh(unitsCache)) return unitsCache.data!;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("unit_weights")
    .select("food_name, unit, grams_per_unit, note");

  if (error) throw new Error(`unit_weights çekilemedi: ${error.message}`);

  unitsCache.data = (data ?? []) as UnitWeight[];
  unitsCache.at = Date.now();
  return unitsCache.data;
}
