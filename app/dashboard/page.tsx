"use client";

import { ChampionBanner } from "@/components/ChampionBanner";
import { GameShell } from "@/components/GameShell";
import { PlayerStage } from "@/components/scene/PlayerStage";
import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/game-context";
import { expectedGoals, startersOf, teamGrade, teamProfile } from "@/lib/ratings";
import { SEASON_WEEKS, weekInSeason } from "@/lib/titles";
import { rosterOf } from "@/lib/world";
import { isInjured } from "@/lib/career";
import Link from "next/link";
import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";

export default function DashboardPage() {
  const { world, userTeam } = useGame();
  const { t } = useI18n();
  const roster = useMemo(() => (userTeam ? rosterOf(world, userTeam.id) : []), [world, userTeam]);
  const starters = roster.filter((r) => r.is_starter);
  const grade = userTeam ? teamGrade(teamProfile(userTeam, startersOf(userTeam, roster), true)) : null;
  const featured = [...roster].sort(
    (a, b) => Number(Boolean(b.player.legend)) - Number(Boolean(a.player.legend)) || b.player.overall - a.player.overall,
  )[0];
  const xiReady = starters.filter((r) => !isInjured(r)).length >= 11;
  const next = world.matches.find(
    (m) =>
      m.week === world.week &&
      m.status === "pending" &&
      (m.home_team_id === userTeam?.id || m.away_team_id === userTeam?.id),
  );
  const oppId = next ? (next.home_team_id === userTeam?.id ? next.away_team_id : next.home_team_id) : null;
  const opponent = world.teams.find((t) => t.id === oppId);
  const nextXg =
    userTeam && opponent && next
      ? expectedGoals(
          teamProfile(
            next.home_team_id === userTeam.id ? userTeam : opponent,
            startersOf(
              next.home_team_id === userTeam.id ? userTeam : opponent,
              rosterOf(world, next.home_team_id === userTeam.id ? userTeam.id : opponent.id),
            ),
            true,
            (next.home_team_id === userTeam.id ? opponent : userTeam).tactics,
          ),
          teamProfile(
            next.home_team_id === userTeam.id ? opponent : userTeam,
            startersOf(
              next.home_team_id === userTeam.id ? opponent : userTeam,
              rosterOf(world, next.home_team_id === userTeam.id ? opponent.id : userTeam.id),
            ),
            false,
            (next.home_team_id === userTeam.id ? userTeam : opponent).tactics,
          ),
        )
      : null;

  return (
    <GameShell flush>
      <div className="relative min-h-[calc(100dvh-4.6rem)] overflow-hidden">
        <PlayerStage className="absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05070c] via-transparent to-black/45" />

        <div className="relative z-10 flex min-h-[calc(100dvh-4.6rem)] flex-col px-4 pb-6 pt-20 sm:px-8">
          {world.lastTitle && (
            <div className="pointer-events-auto mb-3 max-w-xl">
              <ChampionBanner title={world.lastTitle} />
            </div>
          )}

          <div className="pointer-events-auto mt-2 flex max-w-xs flex-col gap-2">
            <ModeTile href="/match" kicker={t("home.quickKicker")} title={t("home.quick")} ready={xiReady} />
            <ModeTile href="/league" kicker={t("home.leagueKicker")} title={t("nav.league")} />
            <ModeTile href="/squad" kicker="XI" title={t("nav.team")} />
            <ModeTile href="/transfer" kicker={t("home.shopKicker")} title={t("nav.shop")} />
          </div>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-3">
              {featured && (
                <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#e7c56a] font-display text-xl text-[#e7c56a]">
                  {featured.player.overall}
                </span>
              )}
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-[#e7c56a]">{t("home.featured")}</p>
                <h1 className="font-display text-4xl leading-none sm:text-6xl">
                  {featured?.player.name ?? userTeam?.name}
                </h1>
                <p className="mt-2 text-sm text-slate-300">
                  {userTeam?.name}
                  {grade ? ` · ${grade.attack}/${grade.defense}` : ""}
                </p>
              </div>
            </div>
            <div className="ef-card pointer-events-auto min-w-[220px] p-4 backdrop-blur">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">{t("home.next")}</p>
              {opponent ? (
                <>
                  <p className="mt-1 font-display text-2xl">{opponent.name}</p>
                  <p className="text-xs text-slate-400">
                    {t("week")} {weekInSeason(world.week)}/{SEASON_WEEKS}
                    {nextXg ? ` · xG ${nextXg.home.toFixed(1)}–${nextXg.away.toFixed(1)}` : ""}
                  </p>
                  <Link href="/match" className="mt-3 block">
                    <Button className="w-full" variant="gold">
                      {t("home.play")}
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm text-slate-400">{t("home.noFixture")}</p>
                  <Link href="/match" className="mt-3 block">
                    <Button className="w-full">{t("home.play")}</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </GameShell>
  );
}

function ModeTile({
  href,
  kicker,
  title,
  ready,
}: {
  href: string;
  kicker: string;
  title: string;
  ready?: boolean;
}) {
  return (
    <Link
      href={href}
      className="ef-card px-4 py-3 backdrop-blur hover:bg-white/5"
    >
      <p className="text-[10px] uppercase tracking-[0.28em] text-[#d4af37]">{kicker}</p>
      <p className="font-display text-xl">{title}</p>
      {ready === false && <p className="text-xs text-rose-300">XI</p>}
    </Link>
  );
}
