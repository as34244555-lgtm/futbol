import { buildSimSide, simulateMatch } from "./match-engine";
import type { MatchSimulationResult, Team } from "./types";
import {
  applyMatchResult,
  autoSelectStarters,
  generateWeekFixtures,
  recoverEnergy,
  rosterOf,
  type GameWorld,
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

export function simulateGameWeek(world: GameWorld): {
  world: GameWorld;
  result: MatchSimulationResult | string;
} {
  if (!world.userTeamId) return { world, result: "Takım yok." };

  let next =
    world.matches.some((m) => m.week === world.week) ? world : { ...world, matches: [...world.matches, ...generateWeekFixtures(world)] };

  const matches = next.matches.filter((m) => m.week === next.week && m.status === "pending");
  const userFx = matches.find(
    (m) => m.home_team_id === next.userTeamId || m.away_team_id === next.userTeamId,
  );

  if (!userFx) {
    return {
      world: recoverEnergy({ ...next, week: next.week + 1 }),
      result: "Bu hafta fikstürünüz yok (bay). Hafta ilerletildi.",
    };
  }

  const completed = [];
  let userSim: MatchSimulationResult | null = null;
  let acc = next;

  for (const fx of matches) {
    const home = acc.teams.find((t) => t.id === fx.home_team_id);
    const away = acc.teams.find((t) => t.id === fx.away_team_id);
    if (!home || !away) continue;
    acc = ensureEleven(acc, home);
    acc = ensureEleven(acc, away);
    const homeSide = buildSimSide(home, rosterOf(acc, home.id));
    const awaySide = buildSimSide(away, rosterOf(acc, away.id));
    if (homeSide.starters.length < 8 || awaySide.starters.length < 8) continue;
    const sim = simulateMatch(homeSide, awaySide, acc.week, hashSeed(fx.id + String(acc.week)));
    sim.match.id = fx.id;
    sim.match.home_team_id = home.id;
    sim.match.away_team_id = away.id;
    sim.logs = sim.logs.map((l) => ({ ...l, match_id: fx.id }));
    if (fx.id === userFx.id) {
      userSim = sim;
      acc = { ...acc, matchLogs: [...acc.matchLogs, ...sim.logs], lastSim: sim };
    }
    acc = applyMatchResult(acc, home.id, away.id, sim.match.home_score, sim.match.away_score);
    completed.push({
      ...fx,
      home_score: sim.match.home_score,
      away_score: sim.match.away_score,
      status: "completed" as const,
      played_at: sim.match.played_at,
    });
  }

  const completedIds = new Set(completed.map((m) => m.id));
  acc = recoverEnergy({
    ...acc,
    matches: [...acc.matches.filter((m) => !completedIds.has(m.id)), ...completed],
    week: acc.week + 1,
  });

  return {
    world: acc,
    result: userSim ?? "Maç oynatılamadı.",
  };
}
