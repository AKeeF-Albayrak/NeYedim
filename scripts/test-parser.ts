// Parser'ı örnek cümlelerle dener.
// Çalıştırma:  npx tsx scripts/test-parser.ts

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse } from "csv-parse/sync";
import { parseMeal } from "../src/lib/parser/index";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

interface Food {
  name: string;
  calories_per_100g: number;
  [key: string]: unknown;
}

function loadFoods(): Food[] {
  const raw = readFileSync(join(ROOT, "Yemek_Veri_Tabani.csv"), "utf8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true });
  const byName = new Map<string, Food>();
  for (const r of rows as Record<string, string>[]) {
    const name = r["Malzeme Adı"];
    const cal = Number(r["Enerji (kcal)"]);
    if (!name || !Number.isFinite(cal)) continue;
    const prev = byName.get(name);
    if (!prev || cal > prev.calories_per_100g) {
      byName.set(name, { name, calories_per_100g: cal });
    }
  }
  return [...byName.values()];
}

const SENTENCES = [
  "2 yumurta ve bir dilim peynirli tost yedim",
  "3 yumurta, yarım ekmek ve bir bardak süt içtim",
  "100 gram tavuk göğsü yedim",
  "bir armut yedim",
  "iki muz ve bir avuç badem",
  "150 gr yoğurt",
  "bir bardak ayran içtim",
  "yarım kilo karpuz",
  "on iki adet zeytin",
  "bir buçuk dilim ekmek",
  "2 yemek kaşığı bal",
  "bir kase mercimek çorbası",
  "üç tane kayısı yedim",
  "1,5 bardak süt",
  "200 gram pirinç pilavı",
  "bir dilim kaşar peyniri",
  "iki çay kaşığı şeker",
  "bir elma ile bir portakal yedim",
  "250 gr kıyma",
  "bir paket bisküvi",
  "çeyrek ekmek",
  "5 ceviz yedim",
  "bir porsiyon makarna",
  "yarım avokado",
  "bir simit ve bir bardak çay",
];

function main() {
  const foods = loadFoods();
  console.log(`Yüklenen besin sayısı: ${foods.length}\n`);

  let matched = 0;
  let total = 0;

  for (const s of SENTENCES) {
    console.log(`» ${s}`);
    const items = parseMeal(s, foods);
    for (const { extracted, match } of items) {
      total++;
      const unit = extracted.unit?.canonical ?? "adet";
      const m = match
        ? `→ ${match.food.name} (${match.score})`
        : "→ EŞLEŞME YOK";
      if (match) matched++;
      console.log(
        `   ${String(extracted.quantity).padEnd(4)} ${unit.padEnd(13)} "${extracted.food}" ${m}`
      );
    }
    console.log("");
  }

  console.log(`Eşleşen kalem: ${matched}/${total}`);
}

main();
