"use client";

import { ChampionBanner } from "@/components/ChampionBanner";
import { GameShell } from "@/components/GameShell";
import { useGame } from "@/lib/game-context";
import { formatSeasonWeek, leagueTable, recentForm, SEASON_WEEKS, weekInSeason } from "@/lib/titles";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";
import { useMemo } from "react";

export default function LeaguePage() {
  const { world, userTeam } = useGame();
  const table = useMemo(() => leagueTable(world), [world]);
  const titles = world.titles ?? [];
  const lastTitle = world.lastTitle ?? titles[titles.length - 1];

  const weekHas = world.matches.some((m) => m.week === world.week);
  const resultWeek = weekHas ? world.week : Math.max(1, world.week - 1);
  const results = world.matches
    .filter((m) => m.week === resultWeek)
    .sort((a, b) => Number(b.status === "completed") - Number(a.status === "completed"));

  return (
    <GameShell>
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{formatSeasonWeek(world.week)}</p>
      <h1 className="font-display mb-2 text-4xl sm:text-5xl">Liga Nova puan durumu</h1>
      <p className="mb-6 text-sm text-slate-400">
        {SEASON_WEEKS} haftalık sezon. {SEASON_WEEKS}. hafta bitince lider kupayı alır, puanlar sıfırlanır.
      </p>
      {lastTitle && (
        <div className="mb-6">
          <ChampionBanner title={lastTitle} />
        </div>
      )}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[560px] text-left text-sm">
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
              <th>Form</th>
              <th>Kupa</th>
            </tr>
          </thead>
          <tbody>
            {table.map((t, i) => {
              const mine = t.id === userTeam?.id;
              const gd = t.goals_for - t.goals_against;
              const form = recentForm(world, t.id);
              return (
                <tr
                  key={t.id}
                  className={cn(
                    "border-t border-white/5",
                    mine && "bg-neon/10 text-neon",
                    i === 0 && !mine && "bg-gold/10",
                    i === 0 && mine && "bg-gold/20",
                  )}
                >
                  <td className="px-4 py-3 font-mono">{i + 1}</td>
                  <td className="font-medium">
                    {i === 0 && <Trophy className="mr-1 inline h-4 w-4 text-gold" />}
                    {t.name}
                    {t.user_id ? (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-gold">insan</span>
                    ) : (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-slate-500">bot</span>
                    )}
                  </td>
                  <td>{t.played}</td>
                  <td>{t.won}</td>
                  <td>{t.drawn}</td>
                  <td>{t.lost}</td>
                  <td>{t.goals_for}</td>
                  <td>{t.goals_against}</td>
                  <td>{gd > 0 ? `+${gd}` : gd}</td>
                  <td className="font-bold">{t.points}</td>
                  <td>
                    <span className="inline-flex gap-0.5">
                      {form.length === 0 && <span className="text-slate-600">—</span>}
                      {form.map((r, fi) => (
                        <span
                          key={`${t.id}-${fi}`}
                          className={cn(
                            "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                            r === "G" && "bg-emerald-500/80 text-ink-950",
                            r === "B" && "bg-slate-400/80 text-ink-950",
                            r === "M" && "bg-rose-500/80 text-white",
                          )}
                        >
                          {r}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="text-gold">{t.titles ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {titles.length > 0 && (
        <>
          <h2 className="font-display mt-10 text-2xl">Şampiyonlar</h2>
          <div className="mt-3 space-y-2">
            {[...titles].reverse().map((c) => (
              <div
                key={c.season}
                className="flex items-center justify-between rounded-xl border border-gold/20 bg-ink-800 px-4 py-3 text-sm"
              >
                <span className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-gold" />
                  Sezon {c.season}
                </span>
                <span className="font-semibold">
                  {c.teamName}
                  <span className="ml-2 text-slate-500">{c.points}p</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
      <h2 className="font-display mt-10 text-2xl">
        Hafta {weekInSeason(resultWeek)} maçları
      </h2>
      <div className="mt-3 space-y-2">
        {results.length === 0 && <p className="text-slate-500">Henüz fikstür yok.</p>}
        {results.map((m) => (
          <div key={m.id} className="flex justify-between rounded-xl border border-white/10 bg-ink-800 px-4 py-2 text-sm">
            <span>
              {world.teams.find((t) => t.id === m.home_team_id)?.name} —{" "}
              {world.teams.find((t) => t.id === m.away_team_id)?.name}
            </span>
            <span className="font-semibold">
              {m.status === "completed" ? `${m.home_score} - ${m.away_score}` : "bekliyor"}
            </span>
          </div>
        ))}
      </div>
    </GameShell>
  );
}
