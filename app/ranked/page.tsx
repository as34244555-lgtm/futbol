"use client";

import { GameShell } from "@/components/GameShell";
import { useGame } from "@/lib/game-context";
import { DIVISION_LABEL, divisionFromPoints, divisionLabel, ensureTeamMeta } from "@/lib/meta";
import { leagueTeams } from "@/lib/world";
import Link from "next/link";

export default function RankedPage() {
  const { world, userTeam } = useGame();
  const meta = userTeam ? ensureTeamMeta(userTeam) : null;
  const board = leagueTeams(world)
    .filter((t) => t.user_id)
    .map((t) => ensureTeamMeta(t))
    .sort((a, b) => (b.rankedPoints ?? 0) - (a.rankedPoints ?? 0));

  return (
    <GameShell>
      <p className="text-[10px] uppercase tracking-[0.35em] text-[#d4af37]">Rekabet</p>
      <h1 className="font-display mt-1 text-4xl">Ranked / Division</h1>
      {meta && (
        <div className="mt-4 rounded-2xl border border-[#d4af37]/30 bg-[#16110a] p-4">
          <p className="text-sm text-[#e7c56a]">{divisionLabel(meta.rankedDivision ?? 3)}</p>
          <p className="mt-1 text-3xl font-semibold">{meta.rankedPoints ?? 1000} RP</p>
          <p className="mt-2 text-xs text-slate-400">Galibiyet +18 · Beraberlik +6 · Mağlubiyet −10</p>
        </div>
      )}
      <h2 className="mt-6 text-sm uppercase tracking-wider text-slate-400">Sıralama</h2>
      <div className="mt-2 space-y-2">
        {board.map((t, i) => (
          <div key={t.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm">
            <span>
              #{i + 1} {t.name}
            </span>
            <span className="text-[#e7c56a]">
              {t.rankedPoints ?? 1000} · {divisionLabel(t.rankedDivision ?? divisionFromPoints(t.rankedPoints ?? 1000))}
            </span>
          </div>
        ))}
        {!board.length && <p className="text-sm text-slate-500">Henüz insan sıralaması yok.</p>}
      </div>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {DIVISION_LABEL.map((label, i) => (
          <div key={label} className="rounded-lg border border-white/5 px-3 py-2 text-xs text-slate-400">
            {i}. {label}
          </div>
        ))}
      </div>
      <Link href="/match" className="mt-6 inline-flex rounded-xl bg-[#1f6dff] px-4 py-3 text-sm font-semibold">
        Maça git
      </Link>
    </GameShell>
  );
}
