import { buildSimSide, simulateMatch, simulateScoreOnly } from "./match-engine";
import type { GameWorld, Match, MatchSimulationResult, Team } from "./types";
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

function involvesTeam(m: { home_team_id: string | null; away_team_id: string | null }, teamId: string) {
  return m.home_team_id === teamId || m.away_team_id === teamId;
}

function matchSeed(fx: { home_team_id: string | null; away_team_id: string | null; week: number }) {
  const ids = [fx.home_team_id, fx.away_team_id].filter(Boolean).sort().join(":");
  return hashSeed(`${fx.week}:${ids}`);
}

function claimMatch(world: GameWorld, matchId: string, teamId: string): GameWorld {
  return {
    ...world,
    matches: world.matches.map((m) =>
      m.id === matchId ? { ...m, claimed_by: [...new Set([...(m.claimed_by ?? []), teamId])] } : m,
    ),
  };
}

function humansPending(world: GameWorld): boolean {
  const humanIds = new Set(world.teams.filter(isHuman).map((t) => t.id));
  return [...humanIds].some((id) => {
    const fx = world.matches.find((m) => m.week === world.week && involvesTeam(m, id));
    if (!fx) return false;
    if (fx.status === "pending") return true;
    return !(fx.claimed_by ?? []).includes(id);
  });
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
    ? simulateMatch(homeSide, awaySide, fx.week, matchSeed(fx))
    : simulateScoreOnly(homeSide, awaySide, fx.week, matchSeed(fx));
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
            replay: humanGame ? { timeline: sim.timeline, motm: sim.motm } : m.replay,
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

function pickStoredSim(
  lastSim: Record<string, MatchSimulationResult> | undefined,
  fx: { id: string; home_team_id: string | null; away_team_id: string | null },
): MatchSimulationResult | null {
  if (!lastSim) return null;
  return lastSim[fx.id] ?? (fx.home_team_id ? lastSim[fx.home_team_id] : undefined) ?? (fx.away_team_id ? lastSim[fx.away_team_id] : undefined) ?? null;
}

function viewFromDone(fx: Match, stored: MatchSimulationResult | null): MatchSimulationResult {
  const match: Match = { ...fx, status: "completed" };
  if (stored) {
    return {
      ...stored,
      match: { ...stored.match, ...match, replay: fx.replay },
      timeline: stored.timeline.length ? stored.timeline : (fx.replay?.timeline ?? stored.timeline),
      motm: stored.motm ?? fx.replay?.motm,
    };
  }
  return {
    match,
    logs: [],
    timeline: fx.replay?.timeline ?? [],
    motm: fx.replay?.motm,
  };
}

export function playUserMatch(
  world: GameWorld,
  userTeamId: string,
  lastSim?: Record<string, MatchSimulationResult>,
): {
  world: GameWorld;
  result: MatchSimulationResult | string;
} {
  let next = prepareWeek(world);

  const pending = next.matches.find(
    (m) => m.week === next.week && m.status === "pending" && involvesTeam(m, userTeamId),
  );
  if (pending) {
    const played = simulateOne(next, pending);
    if (!played) return { world: next, result: "Maç oynatılamadı." };
    const claimed = claimMatch(played.world, pending.id, userTeamId);
    return { world: closeWeekIfReady(claimed), result: played.sim };
  }

  const done =
    next.matches.find((m) => m.week === next.week && m.status === "completed" && involvesTeam(m, userTeamId)) ??
    [...next.matches]
      .reverse()
      .find(
        (m) =>
          m.status === "completed" &&
          involvesTeam(m, userTeamId) &&
          !(m.claimed_by ?? []).includes(userTeamId),
      );

  if (done) {
    const claimed = closeWeekIfReady(claimMatch(next, done.id, userTeamId));
    return { world: claimed, result: viewFromDone(done, pickStoredSim(lastSim, done)) };
  }

  next = closeWeekIfReady(next);
  return { world: next, result: "Bu hafta fikstürünüz yok (bay). Lig haftası güncellendi." };
}
