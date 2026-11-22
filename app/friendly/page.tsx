"use client";

import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/game-context";
import { leagueTeams } from "@/lib/world";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function FriendlyPage() {
  const { world, userTeam, managers } = useGame();
  const [mode, setMode] = useState<"cpu" | "human">("cpu");
  const bots = useMemo(() => leagueTeams(world).filter((t) => !t.user_id).slice(0, 12), [world]);
  const humans = managers.filter((m) => m.kind === "human" && m.teamId !== userTeam?.id);

  return (
    <GameShell>
      <p className="text-[10px] uppercase tracking-[0.35em] text-[#d4af37]">Dostluk</p>
      <h1 className="font-display mt-1 text-4xl">Friendly / vs CPU</h1>
      <div className="mt-4 flex gap-2">
        <Button size="sm" variant={mode === "cpu" ? "primary" : "ghost"} onClick={() => setMode("cpu")}>
          vs CPU
        </Button>
        <Button size="sm" variant={mode === "human" ? "primary" : "ghost"} onClick={() => setMode("human")}>
          İnsan
        </Button>
      </div>
      <p className="mt-3 text-sm text-slate-400">
        {mode === "cpu"
          ? "Bot kulüplerden biriyle canlı veya simülasyon maçı için maç ekranına geç."
          : "Odadaki diğer menajerlerle hazır olunca lig fikstürü üzerinden eşleşirsiniz."}
      </p>
      <div className="mt-5 space-y-2">
        {(mode === "cpu" ? bots : humans.map((h) => ({ id: h.teamId, name: h.teamName }))).map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-3">
            <span className="text-sm font-medium">{t.name}</span>
            <Link href="/match" className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20">
              Seç
            </Link>
          </div>
        ))}
      </div>
      <Link href="/match" className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#ff7a12] px-4 py-3 text-sm font-semibold">
        Maç lobisine git
      </Link>
    </GameShell>
  );
}
