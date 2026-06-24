// PWA ikonlarını üretir (SVG -> PNG, sharp ile).
// Çalıştırma: node scripts/gen-icons.mjs

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, "..", "public");

const BG = "#10b981"; // emerald-500

// Çatal + bıçak amblemi. scale: glyph'in tuval içindeki oranı (maskable için küçük).
function svg(scale = 0.5) {
  const s = 512;
  const g = s * scale; // glyph boyutu
  const off = (s - g) / 2; // ortalamak için offset
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${s * 0.22}" fill="${BG}"/>
  <g transform="translate(${off} ${off}) scale(${g / 100})" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
    <!-- Çatal -->
    <path d="M28 8 V34 a10 10 0 0 1 -20 0 V8" />
    <line x1="18" y1="8" x2="18" y2="30" />
    <line x1="18" y1="44" x2="18" y2="92" />
    <!-- Bıçak -->
    <path d="M78 8 C92 22 92 44 82 54 L78 50 V92" />
  </g>
</svg>`;
}

async function main() {
  const targets = [
    { file: "icon-192.png", size: 192, scale: 0.5 },
    { file: "icon-512.png", size: 512, scale: 0.5 },
    { file: "icon-maskable-512.png", size: 512, scale: 0.42 },
    { file: "apple-touch-icon.png", size: 180, scale: 0.5 },
  ];

  for (const t of targets) {
    await sharp(Buffer.from(svg(t.scale)))
      .resize(t.size, t.size)
      .png()
      .toFile(join(PUBLIC, t.file));
    console.log("✓", t.file);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
