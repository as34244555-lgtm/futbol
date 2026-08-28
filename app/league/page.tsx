"use client";

import { GameShell } from "@/components/GameShell";
import { useGame } from "@/lib/game-context";
import { leagueTeams } from "@/lib/world";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export default function LeaguePage() {
  const { world, userTeam } = useGame();
  const table = useMemo(() => {
    return leagueTeams(world)
      .slice()
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const gdA = a.goals_for - a.goals_against;
        const gdB = b.goals_for - b.goals_against;
        if (gdB !== gdA) return gdB - gdA;
        return b.goals_for - a.goals_for;
      });
  }, [world]);

  const results = world.matches
    .filter((m) => m.status === "completed")
    .slice(-12)
    .reverse();

  return (
    <GameShell>
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Küme {userTeam?.division}</p>
      <h1 className="font-display mb-6 text-5xl">Liga Nova puan durumu</h1>
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3">#</th>
              <th>Takım</th>
              <th>O</th>
              <th>G</th>
              <th>B</th>
              <th>M</th>
              <th>A</th>
              <th>Y</th>
              <th>Av</th>
              <th>P</th>
            </tr>
          </thead>
          <tbody>
            {table.map((t, i) => {
              const mine = t.id === userTeam?.id;
              const gd = t.goals_for - t.goals_against;
              return (
                <tr
                  key={t.id}
                  className={cn("border-t border-white/5", mine && "bg-neon/10 text-neon")}
                >
                  <td className="px-4 py-3 font-mono">{i + 1}</td>
                  <td className="font-medium">{t.name}</td>
                  <td>{t.played}</td>
                  <td>{t.won}</td>
                  <td>{t.drawn}</td>
                  <td>{t.lost}</td>
                  <td>{t.goals_for}</td>
                  <td>{t.goals_against}</td>
                  <td>{gd > 0 ? `+${gd}` : gd}</td>
                  <td className="font-bold">{t.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <h2 className="font-display mt-10 text-2xl">Son lig sonuçları</h2>
      <div className="mt-3 space-y-2">
        {results.length === 0 && <p className="text-slate-500">Henüz maç oynanmadı.</p>}
        {results.map((m) => (
          <div key={m.id} className="flex justify-between rounded-xl border border-white/10 bg-ink-800 px-4 py-2 text-sm">
            <span>
              {world.teams.find((t) => t.id === m.home_team_id)?.name} —{" "}
              {world.teams.find((t) => t.id === m.away_team_id)?.name}
            </span>
            <span>
              {m.home_score} - {m.away_score}
            </span>
          </div>
        ))}
      </div>
    </GameShell>
  );
}
