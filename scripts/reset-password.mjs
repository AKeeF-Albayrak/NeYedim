// Bir kullanıcının şifresini admin (secret key) ile sıfırlar.
// Kullanım:
//   node --env-file=.env.local scripts/reset-password.mjs <eposta> <yeni-sifre>
// Örnek:
//   node --env-file=.env.local scripts/reset-password.mjs ben@example.com yeniSifre123

import { createClient } from "@supabase/supabase-js";

const [, , email, newPassword] = process.argv;

if (!email || !newPassword) {
  console.error("Kullanım: node --env-file=.env.local scripts/reset-password.mjs <eposta> <yeni-sifre>");
  process.exit(1);
}
if (newPassword.length < 6) {
  console.error("Şifre en az 6 karakter olmalı.");
  process.exit(1);
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } }
);

// Kullanıcıyı e-postaya göre bul (sayfalı listede ara)
async function findUserByEmail(target) {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const u = data.users.find((x) => x.email?.toLowerCase() === target.toLowerCase());
    if (u) return u;
    if (data.users.length < 200) return null; // son sayfa
    page++;
  }
}

const user = await findUserByEmail(email);
if (!user) {
  console.error(`Kullanıcı bulunamadı: ${email}`);
  console.error("Authentication → Users altında e-postayı kontrol et.");
  process.exit(1);
}

const { error } = await admin.auth.admin.updateUserById(user.id, {
  password: newPassword,
  email_confirm: true, // onaylanmamışsa onayla, böylece hemen giriş yapılır
});

if (error) {
  console.error("Şifre güncellenemedi:", error.message);
  process.exit(1);
}

console.log(`✓ ${email} şifresi güncellendi. Artık yeni şifreyle giriş yapabilirsin.`);
