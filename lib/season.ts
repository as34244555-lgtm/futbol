import { buildSimSide, simulateMatch, simulateScoreOnly } from "./match-engine";
import type { GameWorld, MatchSimulationResult, Team } from "./types";
import {
  applyMatchResult,
  autoSelectStarters,
  ensureBotWorld,
  ensureHumanMatchmaking,
  generateWeekFixtures,
  recoverEnergy,
  rosterOf,
} from "./world";

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function ensureEleven(world: GameWorld, team: Team): GameWorld {
  const roster = rosterOf(world, team.id);
  if (roster.filter((r) => r.is_starter).length >= 11) return world;
  const filled = autoSelectStarters(
    world.teamPlayers.filter((tp) => tp.team_id === team.id),
    world.players,
    team.formation,
  );
  return {
    ...world,
    teamPlayers: [...world.teamPlayers.filter((tp) => tp.team_id !== team.id), ...filled],
  };
}

function isHuman(team: Team): boolean {
  return Boolean(team.user_id);
}

function humansPending(world: GameWorld): boolean {
  const humanIds = new Set(world.teams.filter(isHuman).map((t) => t.id));
  return world.matches.some(
    (m) =>
      m.week === world.week &&
      m.status === "pending" &&
      ((m.home_team_id && humanIds.has(m.home_team_id)) || (m.away_team_id && humanIds.has(m.away_team_id))),
  );
}

function simulateOne(world: GameWorld, fx: { id: string; home_team_id: string | null; away_team_id: string | null; week: number }) {
  const home = world.teams.find((t) => t.id === fx.home_team_id);
  const away = world.teams.find((t) => t.id === fx.away_team_id);
  if (!home || !away) return null;
  let acc = ensureEleven(world, home);
  acc = ensureEleven(acc, away);
  const homeSide = buildSimSide(home, rosterOf(acc, home.id));
  const awaySide = buildSimSide(away, rosterOf(acc, away.id));
  if (homeSide.starters.length < 8 || awaySide.starters.length < 8) return null;
  const humanGame = Boolean(home.user_id || away.user_id);
  const sim = humanGame
    ? simulateMatch(homeSide, awaySide, fx.week, hashSeed(fx.id + String(fx.week)))
    : simulateScoreOnly(homeSide, awaySide, fx.week, hashSeed(fx.id + String(fx.week)));
  sim.match.id = fx.id;
  sim.match.home_team_id = home.id;
  sim.match.away_team_id = away.id;
  sim.logs = sim.logs.map((l) => ({ ...l, match_id: fx.id }));
  const keepLogs = Boolean(home.user_id || away.user_id);
  acc = applyMatchResult(acc, home.id, away.id, sim.match.home_score, sim.match.away_score);
  acc = {
    ...acc,
    matchLogs: keepLogs ? [...acc.matchLogs, ...sim.logs] : acc.matchLogs,
    matches: acc.matches.map((m) =>
      m.id === fx.id
        ? {
            ...m,
            home_score: sim.match.home_score,
            away_score: sim.match.away_score,
            status: "completed" as const,
            played_at: sim.match.played_at,
          }
        : m,
    ),
  };
  return { world: acc, sim };
}

/** İnsan maçlarını bekletmeden bot-bot fikstürlerini aynı hafta oynatır. */
export function resolveBotFixtures(world: GameWorld): GameWorld {
  const humanIds = new Set(world.teams.filter(isHuman).map((t) => t.id));
  let acc = world;
  const pending = acc.matches.filter((m) => m.week === acc.week && m.status === "pending");
  for (const fx of pending) {
    const homeHuman = Boolean(fx.home_team_id && humanIds.has(fx.home_team_id));
    const awayHuman = Boolean(fx.away_team_id && humanIds.has(fx.away_team_id));
    if (homeHuman || awayHuman) continue;
    const out = simulateOne(acc, fx);
    if (out) acc = out.world;
  }
  return acc;
}

function closeWeekIfReady(world: GameWorld): GameWorld {
  let acc = resolveBotFixtures(world);
  if (humansPending(acc)) return acc;
  const leftover = acc.matches.filter((m) => m.week === acc.week && m.status === "pending");
  for (const fx of leftover) {
    const out = simulateOne(acc, fx);
    if (out) acc = out.world;
  }
  return recoverEnergy({ ...acc, week: acc.week + 1 });
}

export function prepareWeek(world: GameWorld): GameWorld {
  let next = ensureBotWorld(world);
  if (!next.matches.some((m) => m.week === next.week)) {
    next = { ...next, matches: [...next.matches, ...generateWeekFixtures(next)] };
  } else {
    next = ensureHumanMatchmaking(next);
  }
  return resolveBotFixtures(next);
}

export function playUserMatch(world: GameWorld, userTeamId: string): {
  world: GameWorld;
  result: MatchSimulationResult | string;
} {
  let next = prepareWeek(world);

  const userFx = next.matches.find(
    (m) =>
      m.week === next.week &&
      m.status === "pending" &&
      (m.home_team_id === userTeamId || m.away_team_id === userTeamId),
  );

  if (!userFx) {
    const already = next.matches.find(
      (m) =>
        m.week === next.week &&
        m.status === "completed" &&
        (m.home_team_id === userTeamId || m.away_team_id === userTeamId),
    );
    if (already) return { world: next, result: "Bu haftaki maçınız zaten oynandı." };
    next = closeWeekIfReady(next);
    return { world: next, result: "Bu hafta fikstürünüz yok (bay). Lig haftası güncellendi." };
  }

  const played = simulateOne(next, userFx);
  if (!played) return { world: next, result: "Maç oynatılamadı." };
  return { world: closeWeekIfReady(played.world), result: played.sim };
}
