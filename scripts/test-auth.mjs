// RLS izolasyon testi: iki kullanıcı birbirinin öğünlerini görememeli.
// Çalıştırma: node --env-file=.env.local scripts/test-auth.mjs
// ÖN KOŞUL: supabase/auth.sql çalıştırılmış olmalı (user_id + RLS).

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET = process.env.SUPABASE_SECRET_KEY;

if (!URL || !ANON || !SECRET) {
  console.error("Eksik env: URL / PUBLISHABLE / SECRET gerekli.");
  process.exit(1);
}

const admin = createClient(URL, SECRET, { auth: { persistSession: false } });
const pass = (m) => console.log("  ✓", m);
const fail = (m) => {
  console.log("  ✗", m);
  process.exitCode = 1;
};

const ts = Date.now();
const userA = { email: `neyedim_a_${ts}@example.com`, password: "test123456" };
const userB = { email: `neyedim_b_${ts}@example.com`, password: "test123456" };
let idA, idB;

async function makeUser(u) {
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
  });
  if (error) throw new Error("Kullanıcı oluşturulamadı: " + error.message);
  return data.user.id;
}

function clientFor() {
  return createClient(URL, ANON, { auth: { persistSession: false } });
}

async function signIn(u) {
  const c = clientFor();
  const { error } = await c.auth.signInWithPassword(u);
  if (error) throw new Error("Giriş başarısız: " + error.message);
  return c;
}

async function insertMeal(c, uid, text) {
  return c.from("meals").insert({
    user_id: uid,
    raw_text: text,
    parsed_items: [],
    total_calories: 100,
    total_protein: 1,
    total_carbs: 1,
    total_fat: 1,
  });
}

async function main() {
  console.log("Kullanıcılar oluşturuluyor...");
  idA = await makeUser(userA);
  idB = await makeUser(userB);

  // 1) Oturumsuz anon: meals'i okuyamamalı (RLS)
  const anon = clientFor();
  const { data: anonMeals } = await anon.from("meals").select("*");
  (anonMeals?.length ?? 0) === 0
    ? pass("Oturumsuz anon meals göremiyor")
    : fail("Oturumsuz anon meals GÖRÜYOR (RLS açık değil!)");

  // 1b) Oturumsuz anon: foods referans tablosunu da okuyamamalı
  const { data: anonFoods } = await anon.from("foods").select("id").limit(1);
  (anonFoods?.length ?? 0) === 0
    ? pass("Oturumsuz anon foods göremiyor")
    : fail("Oturumsuz anon foods GÖRÜYOR (foods RLS açık değil!)");

  // 2) A giriş yapar, öğün ekler
  const ca = await signIn(userA);
  const insA = await insertMeal(ca, idA, "A kullanıcısının öğünü");
  insA.error ? fail("A ekleyemedi: " + insA.error.message) : pass("A öğün ekledi");
  const { data: aMeals } = await ca.from("meals").select("*");
  aMeals?.length === 1 ? pass("A kendi 1 öğününü görüyor") : fail(`A ${aMeals?.length} öğün görüyor (1 bekleniyordu)`);

  // 3) B giriş yapar, A'nın öğününü GÖRMEMELİ
  const cb = await signIn(userB);
  const { data: bBefore } = await cb.from("meals").select("*");
  (bBefore?.length ?? 0) === 0
    ? pass("B, A'nın öğününü göremiyor (izolasyon)")
    : fail(`B ${bBefore.length} öğün görüyor (0 bekleniyordu — İZOLASYON KIRIK!)`);

  // 4) B kendi öğününü ekler, sadece kendi görür
  await insertMeal(cb, idB, "B kullanıcısının öğünü");
  const { data: bMeals } = await cb.from("meals").select("*");
  bMeals?.length === 1 ? pass("B kendi 1 öğününü görüyor") : fail(`B ${bMeals?.length} öğün görüyor`);

  // 5) B, A'nın user_id'siyle kayıt ekleyememeli (insert policy)
  const insSpoof = await insertMeal(cb, idA, "sahte sahiplik");
  insSpoof.error
    ? pass("B, başkasının adına kayıt ekleyemiyor (insert policy)")
    : fail("B başkasının adına kayıt EKLEDİ (insert policy zayıf!)");

  // Temizlik: kullanıcıları sil (meals cascade ile silinir)
  await admin.auth.admin.deleteUser(idA);
  await admin.auth.admin.deleteUser(idB);
  console.log("\nTest kullanıcıları temizlendi.");
  console.log(process.exitCode ? "\n✗ BAZI TESTLER BAŞARISIZ" : "\n✓ TÜM RLS TESTLERİ GEÇTİ");
}

main().catch(async (e) => {
  console.error("\nHATA:", e.message);
  try {
    if (idA) await admin.auth.admin.deleteUser(idA);
    if (idB) await admin.auth.admin.deleteUser(idB);
  } catch {}
  process.exit(1);
});
