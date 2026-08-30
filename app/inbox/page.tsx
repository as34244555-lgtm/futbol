"use client";

import { GameShell } from "@/components/GameShell";
import { useGame } from "@/lib/game-context";

export default function InboxPage() {
  const { world, userTeam } = useGame();
  const items = (world.news ?? []).filter((n) => !n.teamId || n.teamId === userTeam?.id || n.kind === "cup" || n.kind === "title");

  return (
    <GameShell>
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Kulüp</p>
      <h1 className="font-display mb-6 text-4xl sm:text-5xl">Haber kutusu</h1>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-slate-500">Henüz haber yok. Maç oynayın, transfer yapın.</p>}
        {items.map((n) => (
          <div key={n.id} className="rounded-2xl border border-white/10 bg-ink-800 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              Sezon {n.season} · Hafta {n.week} · {n.kind}
            </p>
            <p className="mt-1 text-sm">{n.text}</p>
          </div>
        ))}
      </div>
    </GameShell>
  );
}
