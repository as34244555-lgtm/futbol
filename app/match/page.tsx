"use client";

import { GameShell } from "@/components/GameShell";
import { MatchSimulation } from "@/components/MatchSimulation";
import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/game-context";
import { botManagerName } from "@/lib/catalog";
import type { MatchSimulationResult } from "@/lib/types";
import { rosterOf } from "@/lib/world";
import { useEffect, useMemo, useState } from "react";

export default function MatchPage() {
  const { world, userTeam, lastSim, playWeek, ensureWeekFixtures, setWatching } = useGame();
  const [sim, setSim] = useState<MatchSimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const unclaimedMatch = userTeam
    ? [...world.matches]
        .reverse()
        .find(
          (m) =>
            m.status === "completed" &&
            (m.home_team_id === userTeam.id || m.away_team_id === userTeam.id) &&
            !(m.claimed_by ?? []).includes(userTeam.id),
        )
    : undefined;
  const myWeekMatch = world.matches.find(
    (m) =>
      userTeam &&
      m.week === world.week &&
      (m.home_team_id === userTeam.id || m.away_team_id === userTeam.id),
  );
  const waitingToWatch = Boolean(unclaimedMatch);
  const alreadyPlayed = Boolean(
    userTeam &&
      !waitingToWatch &&
      myWeekMatch &&
      myWeekMatch.status === "completed" &&
      (myWeekMatch.claimed_by ?? []).includes(userTeam.id),
  );
  const next = unclaimedMatch ?? myWeekMatch;
  const active = sim ?? null;
  const homeId = active?.match.home_team_id ?? next?.home_team_id;
  const awayId = active?.match.away_team_id ?? next?.away_team_id;
  const home = world.teams.find((t) => t.id === homeId);
  const away = world.teams.find((t) => t.id === awayId);
  const opp =
    next && userTeam
      ? world.teams.find((t) => t.id === (next.home_team_id === userTeam.id ? next.away_team_id : next.home_team_id))
      : null;

  const homeRoster = useMemo(() => (home ? rosterOf(world, home.id) : []), [world, home]);
  const awayRoster = useMemo(() => (away ? rosterOf(world, away.id) : []), [world, away]);

  useEffect(() => {
    setWatching(Boolean(active));
    return () => setWatching(false);
  }, [active, setWatching]);

  useEffect(() => {
    void ensureWeekFixtures();
  }, [ensureWeekFixtures]);

  const resultWeek = active?.match.week ?? (world.matches.some((m) => m.week === world.week) ? world.week : Math.max(1, world.week - 1));
  const botWeek = world.matches.filter((m) => {
    if (m.week !== resultWeek || m.status !== "completed") return false;
    const h = world.teams.find((t) => t.id === m.home_team_id);
    const a = world.teams.find((t) => t.id === m.away_team_id);
    return Boolean(h && a && !h.user_id && !a.user_id);
  });

  return (
    <GameShell>
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Canlı saha</p>
      <h1 className="font-display mb-2 text-5xl">Maç günü</h1>
      <p className="mb-6 max-w-2xl text-slate-400">
        Karşılıklı maç <strong>bir kez</strong> oynanır. Biri başlatır, diğeri “Maçı izle” der. Bot maçından sonra
        lig sonraki haftaya geçer; aynı skor tekrarlanmaz.
      </p>

      {!active && (
        <div className="mb-8 rounded-3xl border border-white/10 bg-ink-800/70 p-6">
          <p className="text-sm text-slate-400">Hafta {world.week}</p>
          <p className="font-display text-4xl">
            {userTeam && opp ? `${userTeam.name} vs ${opp.name}` : "Fikstür hazır değil — maçı başlatın"}
          </p>
          {opp && (
            <p className="mt-1 text-sm text-slate-400">
              {opp.user_id ? "İnsan menajer · tek maç, tek skor" : `Bot menajer · ${botManagerName(opp.name)}`}
            </p>
          )}
          {waitingToWatch && next && (
            <p className="mt-3 text-sm text-neon">
              Skor {next.home_score} - {next.away_score}. Rakip maçı bitirdi; siz de aynı karşılaşmayı izleyin.
            </p>
          )}
          {alreadyPlayed && next && (
            <p className="mt-3 text-sm text-neon">
              Bu hafta {next.home_score} - {next.away_score} bitti
              {opp?.user_id ? ". Rakip izleyince sonraki hafta açılır." : "."} Aynı maç yeniden oynanmaz.
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="ghost" onClick={() => void ensureWeekFixtures()}>
              Fikstürü oluştur
            </Button>
            <Button
              disabled={busy || alreadyPlayed}
              onClick={async () => {
                setBusy(true);
                setError(null);
                try {
                  const res = await playWeek();
                  if (typeof res === "string") setError(res);
                  else setSim(res);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Simülasyon hatası");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Hazırlanıyor…" : waitingToWatch ? "Maçı izle" : alreadyPlayed ? "Hafta bitti" : "Maçı başlat"}
            </Button>
            {lastSim && (
              <Button variant="outline" onClick={() => setSim(lastSim)}>
                Son maçı tekrar izle
              </Button>
            )}
          </div>
          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
        </div>
      )}

      {botWeek.length > 0 && (
        <div className="mb-8 rounded-3xl border border-white/10 bg-ink-800/70 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Hafta {resultWeek} · bot kapışması</p>
          <h2 className="font-display mb-3 text-2xl">Ligde diğer maçlar</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {botWeek.map((m) => (
              <div key={m.id} className="flex justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
                <span className="truncate pr-2">
                  {world.teams.find((t) => t.id === m.home_team_id)?.name} —{" "}
                  {world.teams.find((t) => t.id === m.away_team_id)?.name}
                </span>
                <span className="shrink-0 font-semibold text-neon">
                  {m.home_score} - {m.away_score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {active && home && away && (
        <>
          {(active.coinsDelta || active.pointsDelta) ? (
            <p className="mb-4 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
              Maç ödülü kaydedildi: {active.coinsDelta! >= 0 ? "+" : ""}
              {active.coinsDelta} ₡
              {active.pointsDelta ? ` · +${active.pointsDelta} puan` : ""}
            </p>
          ) : null}
          <MatchSimulation
            result={active}
            home={home}
            away={away}
            homeRoster={homeRoster}
            awayRoster={awayRoster}
            onClose={() => setSim(null)}
          />
        </>
      )}

      {world.matches.filter((m) => userTeam && m.status === "completed" && (m.home_team_id === userTeam.id || m.away_team_id === userTeam.id)).length > 0 && (
        <div className="mt-10">
          <h2 className="font-display mb-3 text-2xl">Son sonuçlarınız</h2>
          <div className="space-y-2">
            {world.matches
              .filter((m) => userTeam && m.status === "completed" && (m.home_team_id === userTeam.id || m.away_team_id === userTeam.id))
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
