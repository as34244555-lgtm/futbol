import { AI_CLUBS, generateCatalog } from "./catalog";
import { FORMATION_SLOTS } from "./formations";
import { SYSTEM_TEAM_ID } from "./types";
import type {
  Formation,
  Match,
  MatchLog,
  MatchSimulationResult,
  Player,
  Profile,
  Team,
  TeamPlayer,
  TransferListing,
} from "./types";
import { clamp, teamId, uid } from "./utils";

export type GameWorld = {
  profile: Profile | null;
  userTeamId: string | null;
  players: Player[];
  teams: Team[];
  teamPlayers: TeamPlayer[];
  listings: TransferListing[];
  matches: Match[];
  matchLogs: MatchLog[];
  week: number;
  season: number;
  lastSim: MatchSimulationResult | null;
}

const KIT_USER_PRIMARY = "#3dff8a";
const KIT_USER_SECONDARY = "#0b1220";

function emptyTeam(
  id: string,
  name: string,
  userId: string | null,
  kit_primary: string,
  kit_secondary: string,
  coins = 10000,
  division = 10,
): Team {
  return {
    id,
    user_id: userId,
    name,
    coins,
    division,
    formation: "4-3-3",
    tactics: "BALANCED",
    points: 0,
    created_at: new Date().toISOString(),
    kit_primary,
    kit_secondary,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goals_for: 0,
    goals_against: 0,
  };
}

export function autoSelectStarters(roster: TeamPlayer[], players: Player[], formation: Formation): TeamPlayer[] {
  const slots = FORMATION_SLOTS[formation];
  const used = new Set<string>();
  const byId = new Map(players.map((p) => [p.id, p]));
  const updated = roster.map((r) => ({ ...r, is_starter: false, squad_position: null as string | null }));

  for (const slot of slots) {
    const candidates = updated
      .filter((r) => !used.has(r.id))
      .map((r) => ({ r, p: byId.get(r.player_id) }))
      .filter((x): x is { r: TeamPlayer; p: Player } => Boolean(x.p))
      .sort((a, b) => {
        const posBonus = a.p.position === slot.position ? 25 : 0;
        const posBonusB = b.p.position === slot.position ? 25 : 0;
        return b.p.overall + posBonusB + b.r.form / 10 - (a.p.overall + posBonus + a.r.form / 10);
      });
    const pick = candidates[0];
    if (!pick) continue;
    pick.r.is_starter = true;
    pick.r.squad_position = slot.key;
    used.add(pick.r.id);
  }
  return updated;
}

function takePosition(pool: Player[], position: Player["position"], n: number): { taken: Player[]; rest: Player[] } {
  const matches = pool.filter((p) => p.position === position);
  const others = pool.filter((p) => p.position !== position);
  return { taken: matches.slice(0, n), rest: [...matches.slice(n), ...others] };
}

function pickBalancedSquad(pool: Player[], strength: number, size = 18): { squad: Player[]; rest: Player[] } {
  const target = 62 + strength * 28;
  let rest = [...pool].sort(
    (a, b) => Math.abs(a.overall - target) - Math.abs(b.overall - target) || b.overall - a.overall,
  );
  const squad: Player[] = [];
  const quotas: Array<[Player["position"], number]> = [
    ["KL", 2],
    ["DEF", 6],
    ["OS", 6],
    ["FV", 4],
  ];
  for (const [pos, n] of quotas) {
    const chunk = takePosition(rest, pos, n);
    squad.push(...chunk.taken);
    rest = chunk.rest;
  }
  if (!squad.some((p) => p.position === "KL")) {
    const stolen = takePosition(rest, "KL", 1);
    if (stolen.taken[0]) {
      squad[0] = stolen.taken[0];
      rest = stolen.rest;
    }
  }
  while (squad.length < size && rest.length) squad.push(rest.shift()!);
  return { squad: squad.slice(0, size), rest: [...squad.slice(size), ...rest] };
}

function assignSquad(
  team: Team,
  pool: Player[],
  size: number,
  energyJitter: () => number,
): { remaining: Player[]; rows: TeamPlayer[] } {
  const taken = pool.slice(0, size);
  const remaining = pool.slice(size);
  const rows: TeamPlayer[] = taken.map((p) => ({
    id: uid("tp"),
    team_id: team.id,
    player_id: p.id,
    energy: clamp(88 + Math.floor(energyJitter() * 12), 70, 100),
    form: clamp(72 + Math.floor(energyJitter() * 20), 55, 95),
    is_starter: false,
    squad_position: null,
    acquired_at: new Date().toISOString(),
  }));
  const filled = autoSelectStarters(rows, taken, team.formation);
  return { remaining, rows: filled };
}

export function createFreshWorld(): GameWorld {
  const catalog = generateCatalog(240);
  const agency = emptyTeam(SYSTEM_TEAM_ID, "Lig Ajansı", null, "#334155", "#e2e8f0", 0, 10);
  const aiTeams = AI_CLUBS.map((c, i) =>
    emptyTeam(teamId(i + 1), c.name, null, c.kit_primary, c.kit_secondary, 8000 + i * 400, 10),
  );

  let pool = [...catalog];
  const allRows: TeamPlayer[] = [];
  const listings: TransferListing[] = [];

  for (let i = 0; i < aiTeams.length; i++) {
    const club = aiTeams[i]!;
    const { squad, rest } = pickBalancedSquad(pool, AI_CLUBS[i]!.strength, 18);
    pool = rest;
    const { rows } = assignSquad(club, squad, squad.length, () => Math.random());
    allRows.push(...rows);
  }

  const catalogById = new Map(catalog.map((p) => [p.id, p]));
  const { rows: agencyRows } = assignSquad(agency, pool, pool.length, () => Math.random());
  for (const r of agencyRows) {
    r.is_starter = false;
    r.squad_position = null;
    const player = catalogById.get(r.player_id);
    const price = player ? Math.round(player.base_value * (0.9 + Math.random() * 0.35)) : 500;
    listings.push({
      id: uid("tm"),
      team_player_id: r.id,
      seller_team_id: agency.id,
      price: Math.max(250, price),
      status: "active",
      created_at: new Date().toISOString(),
    });
  }
  allRows.push(...agencyRows);

  for (const club of aiTeams) {
    const benches = allRows.filter((r) => r.team_id === club.id && !r.is_starter).slice(0, 2);
    for (const r of benches) {
      const player = catalogById.get(r.player_id);
      listings.push({
        id: uid("tm"),
        team_player_id: r.id,
        seller_team_id: club.id,
        price: Math.max(300, Math.round((player?.base_value ?? 800) * (1.05 + Math.random() * 0.4))),
        status: "active",
        created_at: new Date().toISOString(),
      });
    }
  }

  return {
    profile: null,
    userTeamId: null,
    players: catalog,
    teams: [agency, ...aiTeams],
    teamPlayers: allRows,
    listings,
    matches: [],
    matchLogs: [],
    week: 1,
    season: 1,
    lastSim: null,
  };
}

export function createUserTeam(world: GameWorld, profile: Profile, teamName: string): GameWorld {
  const userTeam = emptyTeam(uid("team"), teamName, profile.id, KIT_USER_PRIMARY, KIT_USER_SECONDARY);
  const agencyPlayers = world.teamPlayers.filter((tp) => tp.team_id === SYSTEM_TEAM_ID);
  const byId = new Map(world.players.map((p) => [p.id, p]));
  const agencyCatalog = agencyPlayers
    .map((tp) => byId.get(tp.player_id))
    .filter((p): p is Player => Boolean(p));
  const { squad } = pickBalancedSquad(agencyCatalog, 0.7, 18);
  const squadIds = new Set(squad.map((p) => p.id));
  const pack = agencyPlayers.filter((tp) => squadIds.has(tp.player_id)).slice(0, 18);
  const packIds = new Set(pack.map((p) => p.id));

  const moved: TeamPlayer[] = pack.map((p) => ({
    ...p,
    id: uid("tp"),
    team_id: userTeam.id,
    energy: 100,
    form: 80,
    is_starter: false,
    squad_position: null,
    acquired_at: new Date().toISOString(),
  }));
  const filled = autoSelectStarters(moved, world.players, userTeam.formation);

  return {
    ...world,
    profile,
    userTeamId: userTeam.id,
    teams: [...world.teams, userTeam],
    teamPlayers: [...world.teamPlayers.filter((tp) => !packIds.has(tp.id)), ...filled],
    listings: world.listings.filter((l) => !packIds.has(l.team_player_id)),
  };
}

export function leagueTeams(world: GameWorld): Team[] {
  return world.teams.filter((t) => t.id !== SYSTEM_TEAM_ID);
}

export function rosterOf(world: GameWorld, teamId: string): Array<TeamPlayer & { player: Player }> {
  const byId = new Map(world.players.map((p) => [p.id, p]));
  return world.teamPlayers
    .filter((tp) => tp.team_id === teamId)
    .map((tp) => ({ ...tp, player: byId.get(tp.player_id)! }))
    .filter((x) => x.player)
    .sort((a, b) => b.player.overall - a.player.overall);
}

export function applyMatchResult(
  world: GameWorld,
  homeId: string,
  awayId: string,
  homeScore: number,
  awayScore: number,
): GameWorld {
  const reward = (won: boolean, draw: boolean, goals: number) =>
    (won ? 900 : draw ? 350 : 120) + goals * 40;

  const update = (t: Team, gf: number, ga: number, home: boolean): Team => {
    const won = gf > ga;
    const draw = gf === ga;
    const lost = gf < ga;
    return {
      ...t,
      points: t.points + (won ? 3 : draw ? 1 : 0),
      played: t.played + 1,
      won: t.won + (won ? 1 : 0),
      drawn: t.drawn + (draw ? 1 : 0),
      lost: t.lost + (lost ? 1 : 0),
      goals_for: t.goals_for + gf,
      goals_against: t.goals_against + ga,
      coins: t.user_id ? t.coins + reward(won, draw, gf) + (home ? 80 : 0) : t.coins,
    };
  };

  const drain = (tp: TeamPlayer, starter: boolean): TeamPlayer => {
    if (tp.team_id !== homeId && tp.team_id !== awayId) return tp;
    if (!starter) {
      return { ...tp, energy: clamp(tp.energy + 8, 0, 100), form: clamp(tp.form + 1, 0, 100) };
    }
    return {
      ...tp,
      energy: clamp(tp.energy - (10 + Math.floor(Math.random() * 8)), 0, 100),
      form: clamp(tp.form + (homeScore === awayScore ? 0 : Math.random() > 0.5 ? 3 : -2), 0, 100),
    };
  };

  return {
    ...world,
    teams: world.teams.map((t) => {
      if (t.id === homeId) return update(t, homeScore, awayScore, true);
      if (t.id === awayId) return update(t, awayScore, homeScore, false);
      return t;
    }),
    teamPlayers: world.teamPlayers.map((tp) => drain(tp, tp.is_starter)),
  };
}

export function recoverEnergy(world: GameWorld): GameWorld {
  return {
    ...world,
    teamPlayers: world.teamPlayers.map((tp) => ({
      ...tp,
      energy: clamp(tp.energy + 18, 0, 100),
    })),
  };
}

export function generateWeekFixtures(world: GameWorld): Match[] {
  const clubs = leagueTeams(world).sort((a, b) => a.name.localeCompare(b.name, "tr"));
  if (clubs.length < 2) return [];
  const bye = clubs.length % 2 === 1 ? ({ id: "__bye__" } as Team) : null;
  const arr: Team[] = bye ? [...clubs, bye] : [...clubs];
  const n = arr.length;
  const rounds = n - 1;
  const weekIndex = ((world.week - 1) % rounds) + 1;
  for (let r = 1; r < weekIndex; r++) {
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop()!);
    arr.splice(0, arr.length, fixed!, ...rest);
  }
  const matches: Match[] = [];
  for (let i = 0; i < n / 2; i++) {
    const home = arr[i]!;
    const away = arr[n - 1 - i]!;
    if (!home || !away || home.id === away.id || home.id === "__bye__" || away.id === "__bye__") continue;
    const swap = world.week % 2 === 0;
    matches.push({
      id: uid("fx"),
      home_team_id: swap ? away.id : home.id,
      away_team_id: swap ? home.id : away.id,
      home_score: 0,
      away_score: 0,
      status: "pending",
      played_at: new Date().toISOString(),
      week: world.week,
    });
  }
  return matches;
}
