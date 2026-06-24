// NeYedim — service worker.
// Sayfa gezinmeleri ve API: AĞ-ÖNCELİKLİ (taze auth durumu + güncel UI için).
// Statik varlıklar (içerik-hash'li JS/CSS/görsel): cache-öncelikli.
const CACHE = "neyedim-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // HTML gezinmeleri + API istekleri: her zaman ağdan dene (auth/redirect taze kalsın),
  // yalnızca çevrimdışıyken önbelleğe düş.
  if (request.mode === "navigate" || url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // Diğer statik varlıklar: cache-öncelikli, yoksa ağdan çek ve önbelleğe al.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
    )
  );
});
