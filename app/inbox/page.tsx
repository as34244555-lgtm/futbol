"use client";

import { GameShell } from "@/components/GameShell";
import { NewsCard } from "@/components/NewsCard";
import { useGame } from "@/lib/game-context";

export default function InboxPage() {
  const { world } = useGame();
  const items = world.news ?? [];

  return (
    <GameShell>
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Kulüp</p>
      <h1 className="font-display mb-6 text-4xl sm:text-5xl">Haber kutusu</h1>
      <div className="space-y-2">
        {items.length === 0 && (
          <p className="rounded-2xl border border-white/10 bg-ink-800 px-4 py-8 text-center text-slate-500">
            Henüz haber yok. Maç oynayın, antrenman seçin veya transfer yapın — sakatlık, gelişim ve kupa buraya düşer.
          </p>
        )}
        {items.map((n) => (
          <NewsCard key={n.id} item={n} />
        ))}
      </div>
    </GameShell>
  );
}
