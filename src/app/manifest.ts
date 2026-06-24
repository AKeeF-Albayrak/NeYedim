import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NeYedim — Kalori & Makro Takibi",
    short_name: "NeYedim",
    description:
      "Ne yediğini günlük dille yaz, kalori ve makro değerlerine otomatik çevrilsin.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#10b981",
    lang: "tr",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
