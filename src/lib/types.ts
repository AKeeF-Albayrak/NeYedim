// NeYedim — ortak veri tipleri (foods, unit_weights, besin değerleri).

export interface Food {
  id?: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  sugar_per_100g?: number | null;
  fiber_per_100g?: number | null;
}

export interface UnitWeight {
  food_name: string;
  unit: string;
  grams_per_unit: number;
  note?: string | null;
}

export interface Nutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// meals tablosundaki bir kayıt (API'den dönen)
export interface Meal {
  id: string;
  raw_text: string;
  parsed_items: unknown[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  created_at: string;
}
