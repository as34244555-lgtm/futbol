"use client";

import { GameShell } from "@/components/GameShell";
import { MatchSimulation } from "@/components/MatchSimulation";
import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/game-context";
import type { MatchSimulationResult } from "@/lib/types";
import { rosterOf } from "@/lib/world";
import { useMemo, useState } from "react";

export default function MatchPage() {
  const { world, userTeam, playWeek, ensureWeekFixtures } = useGame();
  const [sim, setSim] = useState<MatchSimulationResult | null>(world.lastSim);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const next = world.matches.find(
    (m) =>
      m.week === world.week &&
      m.status === "pending" &&
      (m.home_team_id === userTeam?.id || m.away_team_id === userTeam?.id),
  );
  const home = world.teams.find((t) => t.id === (sim?.match.home_team_id ?? next?.home_team_id));
  const away = world.teams.find((t) => t.id === (sim?.match.away_team_id ?? next?.away_team_id));
  const opp = next && userTeam
    ? world.teams.find((t) => t.id === (next.home_team_id === userTeam.id ? next.away_team_id : next.home_team_id))
    : null;

  const homeRoster = useMemo(() => (home ? rosterOf(world, home.id) : []), [world, home]);
  const awayRoster = useMemo(() => (away ? rosterOf(world, away.id) : []), [world, away]);

  if (!userTeam) return null;

  return (
    <GameShell>
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Canlı saha</p>
      <h1 className="font-display mb-2 text-5xl">Maç günü</h1>
      <p className="mb-6 max-w-2xl text-slate-400">
        Motor 90 dakikalık olay zincirini milisaniyede üretir; 2D saha top, oyuncu ve anlatımı oynatır.
        Aynı hesaplama <code className="text-neon">/api/simulate-match</code> serverless rotasında da çalışır.
      </p>

      {!sim && (
        <div className="mb-8 rounded-3xl border border-white/10 bg-ink-800/70 p-6">
          <p className="text-sm text-slate-400">Hafta {world.week}</p>
          <p className="font-display text-4xl">
            {opp ? `${userTeam.name} vs ${opp.name}` : "Fikstür hazır değil"}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="ghost" onClick={ensureWeekFixtures}>
              Fikstürü oluştur
            </Button>
            <Button
              disabled={busy}
              onClick={() => {
                setBusy(true);
                setError(null);
                const res = playWeek();
                if (typeof res === "string") setError(res);
                else setSim(res);
                setBusy(false);
              }}
            >
              {busy ? "Simüle ediliyor…" : "Maçı başlat"}
            </Button>
          </div>
          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
        </div>
      )}

      {sim && home && away && (
        <MatchSimulation
          result={sim}
          home={home}
          away={away}
          homeRoster={homeRoster}
          awayRoster={awayRoster}
          onClose={() => setSim(null)}
        />
      )}

      {world.matches.filter((m) => m.status === "completed" && (m.home_team_id === userTeam.id || m.away_team_id === userTeam.id)).length > 0 && (
        <div className="mt-10">
          <h2 className="font-display mb-3 text-2xl">Son sonuçlarınız</h2>
          <div className="space-y-2">
            {world.matches
              .filter((m) => m.status === "completed" && (m.home_team_id === userTeam.id || m.away_team_id === userTeam.id))
              .slice(-8)
              .reverse()
              .map((m) => {
                const h = world.teams.find((t) => t.id === m.home_team_id)?.name ?? "?";
                const a = world.teams.find((t) => t.id === m.away_team_id)?.name ?? "?";
                return (
                  <div key={m.id} className="flex justify-between rounded-xl border border-white/10 bg-ink-800 px-4 py-2 text-sm">
                    <span>
                      Hafta {m.week}: {h} — {a}
                    </span>
                    <span className="font-semibold">
                      {m.home_score} - {m.away_score}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </GameShell>
  );
}
