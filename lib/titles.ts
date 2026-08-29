import { SYSTEM_TEAM_ID } from "./types";
import type { GameWorld, SeasonTitle, Team } from "./types";

export const SEASON_WEEKS = 18;

export const CHAMPION_PRIZE = 8_000;
const PODIUM_PRIZE = [CHAMPION_PRIZE, 4_000, 2_000] as const;

export function seasonOf(week: number): number {
  return Math.floor((Math.max(1, week) - 1) / SEASON_WEEKS) + 1;
}

export function weekInSeason(week: number): number {
  return ((Math.max(1, week) - 1) % SEASON_WEEKS) + 1;
}

/** Hafta kapandıktan sonra yeni hafta numarası (ör. 18 bitti → 19). */
export function seasonJustEnded(week: number): boolean {
  return week > 1 && (week - 1) % SEASON_WEEKS === 0;
}

export function formatSeasonWeek(week: number): string {
  return `Sezon ${seasonOf(week)} · Hafta ${weekInSeason(week)}/${SEASON_WEEKS}`;
}

export function compareTable(a: Team, b: Team): number {
  if (b.points !== a.points) return b.points - a.points;
  const gdA = a.goals_for - a.goals_against;
  const gdB = b.goals_for - b.goals_against;
  if (gdB !== gdA) return gdB - gdA;
  if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
  return a.name.localeCompare(b.name, "tr");
}

export function leagueTable(world: GameWorld): Team[] {
  return world.teams.filter((t) => t.id !== SYSTEM_TEAM_ID).slice().sort(compareTable);
}

export function makeTitle(season: number, champion: Team): SeasonTitle {
  return {
    season,
    teamId: champion.id,
    teamName: champion.name,
    points: champion.points,
    played: champion.played,
    won: champion.won,
    goalDiff: champion.goals_for - champion.goals_against,
    crownedAt: new Date().toISOString(),
  };
}

function resetRow(t: Team): Team {
  return {
    ...t,
    points: 0,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goals_for: 0,
    goals_against: 0,
  };
}

/** 18. hafta bitince lideri şampiyon ilan eder, puanları sıfırlar, yeni sezon açar. */
export function crownSeason(world: GameWorld): GameWorld {
  const season = seasonOf(world.week);
  if (!seasonJustEnded(world.week)) {
    return world.season === season ? world : { ...world, season };
  }

  const finishedSeason = seasonOf(world.week - 1);
  if ((world.titles ?? []).some((t) => t.season === finishedSeason)) {
    return world.season === season ? world : { ...world, season };
  }

  const table = leagueTable(world);
  const champ = table[0];
  if (!champ || champ.played < 1) {
    return world.season === season ? world : { ...world, season };
  }

  const title = makeTitle(finishedSeason, champ);
  const teams = world.teams.map((t) => {
    if (t.id === SYSTEM_TEAM_ID) return t;
    const place = table.findIndex((x) => x.id === t.id);
    const prize = t.user_id && place >= 0 && place < PODIUM_PRIZE.length ? PODIUM_PRIZE[place]! : 0;
    return resetRow({
      ...t,
      titles: (t.titles ?? 0) + (t.id === champ.id ? 1 : 0),
      coins: t.coins + prize,
    });
  });

  return {
    ...world,
    season,
    teams,
    titles: [...(world.titles ?? []), title],
    lastTitle: title,
  };
}
