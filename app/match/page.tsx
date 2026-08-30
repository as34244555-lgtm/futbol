"use client";

import { ChampionOverlay } from "@/components/ChampionBanner";
import { GameShell } from "@/components/GameShell";
import { MatchSimulation } from "@/components/MatchSimulation";
import { StadiumPrep } from "@/components/StadiumPrep";
import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/game-context";
import { botManagerName } from "@/lib/catalog";
import type { MatchSimulationResult, SeasonTitle } from "@/lib/types";
import { playCrowd, playFanfare, playWhistle, unlockAudio } from "@/lib/sfx";
import { expectedGoals, possessionShare, startersOf, teamGrade, teamProfile } from "@/lib/ratings";
import { formatSeasonWeek, seasonOf, weekInSeason } from "@/lib/titles";
import { rosterOf } from "@/lib/world";
import { useEffect, useMemo, useState } from "react";

export default function MatchPage() {
  const { world, userTeam, lastSim, playWeek, ensureWeekFixtures, setWatching, markReady } = useGame();
  const [sim, setSim] = useState<MatchSimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [prep, setPrep] = useState(false);
  const [title, setTitle] = useState<SeasonTitle | null>(null);

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

  const preview = useMemo(() => {
    if (!userTeam || !opp) return null;
    const homeTeam = next?.home_team_id === userTeam.id ? userTeam : opp;
    const awayTeam = next?.home_team_id === userTeam.id ? opp : userTeam;
    const hp = teamProfile(homeTeam, startersOf(homeTeam, rosterOf(world, homeTeam.id)), true, awayTeam.tactics);
    const ap = teamProfile(awayTeam, startersOf(awayTeam, rosterOf(world, awayTeam.id)), false, homeTeam.tactics);
    const xg = expectedGoals(hp, ap);
    const poss = possessionShare(hp, ap);
    return {
      homeName: homeTeam.name,
      awayName: awayTeam.name,
      xg,
      poss: [Math.round(poss * 100), Math.round((1 - poss) * 100)] as const,
      home: teamGrade(hp),
      away: teamGrade(ap),
    };
  }, [userTeam, opp, next, world]);
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
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Canlı saha · {formatSeasonWeek(world.week)}</p>
      <h1 className="font-display mb-2 text-4xl sm:text-5xl">Maç günü</h1>
      <p className="mb-6 max-w-2xl text-sm text-slate-400 sm:text-base">
        Karşılıklı maç <strong>bir kez</strong> oynanır. Biri başlatır, diğeri “Maçı izle” der. Bot maçından sonra
        lig sonraki haftaya geçer; aynı skor tekrarlanmaz.
      </p>

      {!active && (
        <div className="mb-8 rounded-3xl border border-white/10 bg-ink-800/70 p-4 sm:p-6">
          {prep ? (
            <StadiumPrep
              home={userTeam?.name ?? "Ev"}
              away={opp?.name ?? "Konuk"}
              stadium={`${(next?.home_team_id === userTeam?.id ? userTeam?.name : opp?.name) ?? "Liga Nova"} Arena`}
            />
          ) : (
            <>
          <p className="text-sm text-slate-400">{formatSeasonWeek(world.week)}</p>
          <p className="font-display text-3xl sm:text-4xl">
            {userTeam && opp ? `${userTeam.name} vs ${opp.name}` : "Fikstür hazır değil — maçı başlatın"}
          </p>
          {opp && (
            <p className="mt-1 text-sm text-slate-400">
              {opp.user_id
                ? `İnsan menajer · ${opp.readyWeek === world.week ? "rakip hazır" : "rakip bekleniyor"}`
                : `Bot menajer · ${botManagerName(opp.name)}`}
            </p>
          )}
          {preview && (
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <PreviewStat
                label="Beklenen gol (xG)"
                value={`${preview.xg.home.toFixed(2)} — ${preview.xg.away.toFixed(2)}`}
              />
              <PreviewStat label="Topa sahip olma" value={`%${preview.poss[0]} — %${preview.poss[1]}`} />
              <PreviewStat
                label="Hücum / savunma"
                value={`${preview.home.attack}/${preview.home.defense} · ${preview.away.attack}/${preview.away.defense}`}
              />
            </div>
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
            {opp?.user_id && (
              <Button variant="outline" onClick={() => void markReady()}>
                {userTeam?.readyWeek === world.week ? "Hazırsınız" : "Hazırım"}
              </Button>
            )}
            <Button
              disabled={busy || alreadyPlayed}
              onClick={async () => {
                setBusy(true);
                setError(null);
                setPrep(true);
                try {
                  await unlockAudio();
                  playCrowd();
                  window.setTimeout(() => playWhistle(), 900);
                  await new Promise((r) => window.setTimeout(r, 2400));
                  const res = await playWeek();
                  if (typeof res === "string") setError(res);
                  else {
                    setSim(res);
                    if (res.title) {
                      setTitle(res.title);
                      playFanfare();
                    }
                  }
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Simülasyon hatası");
                } finally {
                  setPrep(false);
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
            </>
          )}
        </div>
      )}

      {botWeek.length > 0 && (
        <div className="mb-8 rounded-3xl border border-white/10 bg-ink-800/70 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {formatSeasonWeek(resultWeek)} · bot kapışması
          </p>
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
                    Hafta {weekInSeason(m.week)} · S{seasonOf(m.week)}: {h} — {a}
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
      {title && userTeam && !active && (
        <ChampionOverlay
          title={title}
          mine={title.teamId === userTeam.id}
          onClose={() => setTitle(null)}
        />
      )}
    </GameShell>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gold/20 bg-gold/5 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-gold/80">{label}</p>
      <p className="font-display text-lg text-gold sm:text-xl">{value}</p>
    </div>
  );
}
