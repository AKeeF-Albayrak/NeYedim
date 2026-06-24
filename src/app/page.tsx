export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 px-6 py-24 text-center">
        <span className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-white/15 dark:text-zinc-400">
          Faz 0 · Altyapı kuruldu
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-black sm:text-5xl dark:text-zinc-50">
          NeYedim
        </h1>
        <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Ne yediğini günlük konuşma diliyle yaz, NeYedim otomatik olarak kalori
          ve makro besin değerlerine çevirsin. Kural tabanlı, AI API&apos;sine
          bağımlı değil.
        </p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          Yakında: öğün girişi, panel ve geçmiş.
        </p>
      </main>
    </div>
  );
}
