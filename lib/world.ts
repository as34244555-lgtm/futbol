import {
  ABDULLAH_ID,
  AI_CLUBS,
  generateCatalog,
  generateExtraPlayers,
  isLegend,
  makeAbdullah,
  playsPosition,
} from "./catalog";
import { applyTrainingRecovery, hydrateWorld, isInjured, rollInjuries } from "./career";
import { marketValue } from "./ratings";
import { FORMATION_SLOTS } from "./formations";
import { SYSTEM_TEAM_ID } from "./types";
import type {
  Formation,
  GameWorld,
  Match,
  Player,
  Team,
  TeamPlayer,
  TransferListing,
} from "./types";
import { clamp, fixtureId, hash32, humanTeamId, listingId, rowId, seededRandom, teamId } from "./utils";


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
    titles: 0,
  };
}

export function autoSelectStarters(roster: TeamPlayer[], players: Player[], formation: Formation): TeamPlayer[] {
  const slots = FORMATION_SLOTS[formation];
  const used = new Set<string>();
  const byId = new Map(players.map((p) => [p.id, p]));
  const updated = roster.map((r) => ({ ...r, is_starter: false, squad_position: null as string | null }));

  const place = (row: TeamPlayer, slotKey: string) => {
    row.is_starter = true;
    row.squad_position = slotKey;
    used.add(row.id);
  };

  for (const row of updated) {
    const p = byId.get(row.player_id);
    if (!p?.legend || used.has(row.id)) continue;
    const preferred =
      slots.find((s) => s.key === "st" || s.label === "SAN") ??
      slots.find((s) => s.position === p.position) ??
      slots.find((s) => playsPosition(p, s.position));
    if (preferred && !updated.some((r) => r.squad_position === preferred.key)) {
      place(row, preferred.key);
    }
  }

  for (const slot of slots) {
    if (updated.some((r) => r.squad_position === slot.key)) continue;
    const healthy = updated.filter((r) => !used.has(r.id) && !isInjured(r));
    const pool = healthy.length ? healthy : updated.filter((r) => !used.has(r.id));
    const candidates = pool
      .map((r) => ({ r, p: byId.get(r.player_id) }))
      .filter((x): x is { r: TeamPlayer; p: Player } => Boolean(x.p))
      .sort((a, b) => {
        const score = (p: Player, r: TeamPlayer) => {
          let s = p.overall + r.form / 10;
          if (playsPosition(p, slot.position)) s += 25;
          if (p.position === slot.position) s += 8;
          if (p.position === "KL" && slot.position !== "KL") s -= 90;
          if (p.position !== "KL" && slot.position === "KL") s -= 90;
          if (p.versatile && p.position !== "KL" && slot.position === "KL") s -= 40;
          return s;
        };
        return score(b.p, b.r) - score(a.p, a.r);
      });
    const pick = candidates[0];
    if (!pick) continue;
    place(pick.r, slot.key);
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
    id: rowId(team.id, p.id),
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
  const catalog = generateCatalog(420);
  const rand = seededRandom(20260828);
  const agency = emptyTeam(SYSTEM_TEAM_ID, "Lig Ajansı", null, "#334155", "#e2e8f0", 0, 10);
  const aiTeams = AI_CLUBS.map((c, i) =>
    emptyTeam(teamId(i + 1), c.name, null, c.kit_primary, c.kit_secondary, 8000 + i * 400, 10),
  );

  let pool = catalog.filter((p) => !isLegend(p));
  const allRows: TeamPlayer[] = [];
  const listings: TransferListing[] = [];

  for (let i = 0; i < aiTeams.length; i++) {
    const club = aiTeams[i]!;
    const { squad, rest } = pickBalancedSquad(pool, AI_CLUBS[i]!.strength, 18);
    pool = rest;
    const { rows } = assignSquad(club, squad, squad.length, rand);
    allRows.push(...rows);
  }

  const catalogById = new Map(catalog.map((p) => [p.id, p]));
  const { rows: agencyRows } = assignSquad(agency, pool, pool.length, rand);
  for (const r of agencyRows) {
    r.is_starter = false;
    r.squad_position = null;
    const player = catalogById.get(r.player_id);
    const price = player ? Math.round(marketValue(player) * (0.9 + rand() * 0.35)) : 500;
    listings.push({
      id: listingId(agency.id, r.player_id),
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
        id: listingId(club.id, r.player_id),
        team_player_id: r.id,
        seller_team_id: club.id,
        price: Math.max(300, Math.round((player ? marketValue(player) : 800) * (1.05 + rand() * 0.4))),
        status: "active",
        created_at: new Date().toISOString(),
      });
    }
  }

  const world: GameWorld = {
    players: catalog,
    teams: [agency, ...aiTeams],
    teamPlayers: allRows,
    listings,
    matches: [],
    matchLogs: [],
    week: 1,
    season: 1,
    titles: [],
  };
  return hydrateWorld(ensureBotWorld(world));
}

export const HUMAN_KITS: Array<[string, string]> = [
  ["#3dff8a", "#0b1220"],
  ["#38bdf8", "#0b1220"],
  ["#f472b6", "#0b1220"],
  ["#facc15", "#0b1220"],
  ["#fb7185", "#0b1220"],
  ["#a78bfa", "#0b1220"],
  ["#fb923c", "#0b1220"],
  ["#2dd4bf", "#0b1220"],
];

export function nextHumanKit(world: GameWorld): [string, string] {
  const used = new Set(world.teams.filter((t) => t.user_id).map((t) => t.kit_primary));
  return HUMAN_KITS.find((k) => !used.has(k[0])) ?? HUMAN_KITS[world.teams.length % HUMAN_KITS.length]!;
}

export function createUserTeam(world: GameWorld, userId: string, teamName: string): { world: GameWorld; team: Team } {
  const existing = world.teams.find((t) => t.user_id === userId);
  if (existing) return { world: ensureLegendWorld(world), team: existing };
  const [kit_primary, kit_secondary] = nextHumanKit(world);
  const userTeam = emptyTeam(humanTeamId(userId), teamName, userId, kit_primary, kit_secondary, 15_000);
  const agencyPlayers = world.teamPlayers.filter((tp) => tp.team_id === SYSTEM_TEAM_ID);
  const byId = new Map(world.players.map((p) => [p.id, p]));
  let agencyCatalog = agencyPlayers
    .map((tp) => byId.get(tp.player_id))
    .filter((p): p is Player => Boolean(p));

  const countPos = (pos: Player["position"]) => agencyCatalog.filter((p) => p.position === pos).length;
  let extraPlayers: Player[] = [];
  if (countPos("KL") < 2 || countPos("DEF") < 6 || countPos("OS") < 6 || countPos("FV") < 4 || agencyCatalog.length < 18) {
    extraPlayers = generateExtraPlayers(80, 900 + world.players.length);
    agencyCatalog = [...agencyCatalog, ...extraPlayers];
  }

  const { squad } = pickBalancedSquad(agencyCatalog, 0.7, 18);
  const squadIds = new Set(squad.map((p) => p.id));
  const fromAgency = agencyPlayers.filter((tp) => squadIds.has(tp.player_id));
  const fromExtra = squad.filter((p) => extraPlayers.some((e) => e.id === p.id));
  const packIds = new Set(fromAgency.map((p) => p.id));

  const moved: TeamPlayer[] = [
    ...fromAgency.map((p) => ({
      ...p,
      id: rowId(userTeam.id, p.player_id),
      team_id: userTeam.id,
      energy: 100,
      form: 80,
      is_starter: false,
      squad_position: null,
      acquired_at: new Date().toISOString(),
    })),
    ...fromExtra.map((p) => ({
      id: rowId(userTeam.id, p.id),
      team_id: userTeam.id,
      player_id: p.id,
      energy: 100,
      form: 80,
      is_starter: false,
      squad_position: null,
      acquired_at: new Date().toISOString(),
    })),
  ];
  const filled = autoSelectStarters(moved, [...world.players, ...extraPlayers], userTeam.formation);

  return {
    team: userTeam,
    world: hydrateWorld(ensureLegendWorld({
      ...world,
      players: extraPlayers.length ? [...world.players, ...extraPlayers] : world.players,
      teams: [...world.teams, userTeam],
      teamPlayers: [...world.teamPlayers.filter((tp) => !packIds.has(tp.id)), ...filled],
      listings: world.listings.filter((l) => !packIds.has(l.team_player_id)),
    })),
  };
}

function legendReady(world: GameWorld): boolean {
  const p = world.players.find((x) => x.id === ABDULLAH_ID);
  if (!p || p.overall !== 999 || p.base_value !== 100_000 || !p.versatile || !p.legend) return false;
  return world.teams
    .filter((t) => t.user_id)
    .every((t) => world.teamPlayers.some((tp) => tp.team_id === t.id && tp.player_id === ABDULLAH_ID));
}

/** Abdullah Sarıyıldız her insan kadrosuna 999'luk efsane olarak eklenir. */
export function ensureLegendWorld(world: GameWorld): GameWorld {
  if (legendReady(world)) return world;
  const legend = makeAbdullah();
  let players = world.players.filter((p) => p.id !== ABDULLAH_ID && p.name !== legend.name);
  players = [legend, ...players];

  let teamPlayers = world.teamPlayers.map((tp) => {
    const owned = world.players.find((p) => p.id === tp.player_id);
    if (owned && owned.name === legend.name && tp.player_id !== ABDULLAH_ID) {
      return { ...tp, player_id: ABDULLAH_ID, id: rowId(tp.team_id, ABDULLAH_ID) };
    }
    return tp;
  });

  teamPlayers = teamPlayers.filter((tp) => {
    if (tp.player_id !== ABDULLAH_ID) return true;
    const team = world.teams.find((t) => t.id === tp.team_id);
    return Boolean(team?.user_id);
  });

  const dropIds = new Set(
    world.teamPlayers.filter((tp) => !teamPlayers.some((x) => x.id === tp.id)).map((tp) => tp.id),
  );
  const listings = world.listings.filter((l) => !dropIds.has(l.team_player_id));

  let next: GameWorld = { ...world, players, teamPlayers, listings };
  for (const team of next.teams.filter((t) => t.user_id)) {
    if (next.teamPlayers.some((tp) => tp.team_id === team.id && tp.player_id === ABDULLAH_ID)) continue;
    const row: TeamPlayer = {
      id: rowId(team.id, ABDULLAH_ID),
      team_id: team.id,
      player_id: ABDULLAH_ID,
      energy: 100,
      form: 99,
      is_starter: false,
      squad_position: null,
      acquired_at: new Date().toISOString(),
    };
    const roster = [...next.teamPlayers.filter((tp) => tp.team_id === team.id), row];
    const filledLegend = autoSelectStarters(roster, next.players, team.formation);
    next = {
      ...next,
      teamPlayers: [...next.teamPlayers.filter((tp) => tp.team_id !== team.id), ...filledLegend],
    };
  }
  return next;
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
  opts?: { cup?: boolean },
): GameWorld {
  const reward = (won: boolean, draw: boolean, goals: number) =>
    (won ? 900 : draw ? 350 : 120) + goals * 40;

  const update = (t: Team, gf: number, ga: number, home: boolean): Team => {
    const won = gf > ga;
    const draw = gf === ga;
    const lost = gf < ga;
    if (opts?.cup) {
      return {
        ...t,
        coins: t.user_id ? t.coins + (won ? 400 : draw ? 160 : 60) : t.coins,
      };
    }
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

  const drain = (tp: TeamPlayer): TeamPlayer => {
    if (tp.team_id !== homeId && tp.team_id !== awayId) return tp;
    const homeSide = tp.team_id === homeId;
    const won = homeSide ? homeScore > awayScore : awayScore > homeScore;
    const draw = homeScore === awayScore;
    if (!tp.is_starter) {
      return { ...tp, energy: clamp(tp.energy + 9, 0, 100), form: clamp(tp.form + 1, 0, 100) };
    }
    return {
      ...tp,
      energy: clamp(tp.energy - 14, 0, 100),
      form: clamp(tp.form + (won ? 4 : draw ? 1 : -3), 0, 100),
    };
  };

  const drained = {
    ...world,
    teams: world.teams.map((t) => {
      if (t.id === homeId) return update(t, homeScore, awayScore, true);
      if (t.id === awayId) return update(t, awayScore, homeScore, false);
      return t;
    }),
    teamPlayers: world.teamPlayers.map((tp) => drain(tp)),
  };
  return rollInjuries(drained, homeId, awayId);
}

export function recoverEnergy(world: GameWorld): GameWorld {
  return applyTrainingRecovery(world);
}

export function isBotTeam(t: Team): boolean {
  return !t.user_id && t.id !== SYSTEM_TEAM_ID;
}

export function makeFixture(home: Team, away: Team, week: number): Match {
  return {
    id: fixtureId(week, home.id, away.id),
    home_team_id: home.id,
    away_team_id: away.id,
    home_score: 0,
    away_score: 0,
    status: "pending",
    played_at: new Date().toISOString(),
    week,
    claimed_by: [],
  };
}

function pairHumans(a: Team, b: Team, week: number): [Team, Team] {
  const [lo, hi] = a.id < b.id ? [a, b] : [b, a];
  return week % 2 === 0 ? [hi, lo] : [lo, hi];
}

function involves(m: Match, teamId: string): boolean {
  return m.home_team_id === teamId || m.away_team_id === teamId;
}

function opponentId(m: Match, teamId: string): string | null {
  if (m.home_team_id === teamId) return m.away_team_id;
  if (m.away_team_id === teamId) return m.home_team_id;
  return null;
}

/** Gerçek menajerler birbirine eşleşir; tek kalan botla oynar. */
export function ensureHumanMatchmaking(world: GameWorld): GameWorld {
  const week = world.week;
  const humans = leagueTeams(world).filter((t) => t.user_id);
  const bots = leagueTeams(world).filter((t) => !t.user_id);
  const completedIds = new Set(
    world.matches
      .filter((m) => m.week === week && m.status === "completed")
      .flatMap((m) => [m.home_team_id, m.away_team_id]),
  );

  const rematchable: Team[] = [];
  for (const h of humans) {
    if (completedIds.has(h.id)) continue;
    const fx = world.matches.find((m) => m.week === week && m.status === "pending" && involves(m, h.id));
    if (!fx) {
      rematchable.push(h);
      continue;
    }
    const opp = opponentId(fx, h.id);
    const oppTeam = world.teams.find((t) => t.id === opp);
    if (!oppTeam?.user_id) rematchable.push(h);
  }

  let matches = [...world.matches];
  const paired = new Set<string>();
  rematchable.sort((x, y) => x.id.localeCompare(y.id));
  for (let i = 0; i + 1 < rematchable.length; i += 2) {
    const a = rematchable[i]!;
    const b = rematchable[i + 1]!;
    matches = matches.filter(
      (m) => !(m.week === week && m.status === "pending" && (involves(m, a.id) || involves(m, b.id))),
    );
    const [home, away] = pairHumans(a, b, week);
    matches.push(makeFixture(home, away, week));
    paired.add(a.id);
    paired.add(b.id);
  }

  const leftover = rematchable.filter((h) => !paired.has(h.id));
  for (const h of leftover) {
    if (matches.some((m) => m.week === week && m.status === "pending" && involves(m, h.id))) continue;
    const bot = freeBotForHuman(matches, bots, week);
    if (bot) matches.push(makeFixture(week % 2 === 0 ? h : bot, week % 2 === 0 ? bot : h, week));
  }

  matches = fillIdleBots(matches, bots, week);
  return { ...world, matches };
}

function weekBusy(matches: Match[], week: number): Set<string> {
  return new Set(
    matches
      .filter((m) => m.week === week && (m.status === "pending" || m.status === "completed"))
      .flatMap((m) => [m.home_team_id, m.away_team_id])
      .filter((id): id is string => Boolean(id)),
  );
}

function freeBotForHuman(matches: Match[], bots: Team[], week: number): Team | undefined {
  const busy = weekBusy(matches, week);
  const idle = bots.find((t) => !busy.has(t.id));
  if (idle) return idle;
  const botVsBot = matches.find((m) => {
    if (m.week !== week || m.status !== "pending" || m.kind === "cup") return false;
    const home = bots.some((t) => t.id === m.home_team_id);
    const away = bots.some((t) => t.id === m.away_team_id);
    return home && away;
  });
  if (botVsBot) {
    const idx = matches.indexOf(botVsBot);
    if (idx >= 0) matches.splice(idx, 1);
    return bots.find((t) => t.id === botVsBot.home_team_id);
  }
  return [...bots].sort((a, b) => a.played - b.played || a.points - b.points)[0];
}

function fillIdleBots(matches: Match[], bots: Team[], week: number): Match[] {
  const next = [...matches];
  const idle = bots.filter((t) => !weekBusy(next, week).has(t.id));
  for (let i = 0; i + 1 < idle.length; i += 2) {
    next.push(makeFixture(idle[i]!, idle[i + 1]!, week));
  }
  return next;
}

export function generateWeekFixtures(world: GameWorld): Match[] {
  const humans = leagueTeams(world).filter((t) => t.user_id);
  const bots = leagueTeams(world).filter((t) => !t.user_id);
  if (humans.length + bots.length < 2) return [];
  const week = world.week;
  const rotate = (arr: Team[]) => {
    const copy = [...arr].sort((a, b) => a.id.localeCompare(b.id));
    const n = ((week - 1) % Math.max(1, copy.length)) % copy.length;
    return copy.slice(n).concat(copy.slice(0, n));
  };
  const used = new Set<string>();
  const matches: Match[] = [];
  const push = (home: Team, away: Team) => {
    used.add(home.id);
    used.add(away.id);
    matches.push(makeFixture(home, away, week));
  };

  const rh = rotate(humans);
  for (let i = 0; i + 1 < rh.length; i += 2) push(rh[i]!, rh[i + 1]!);
  const leftoverH = rh.filter((h) => !used.has(h.id));
  const rb = rotate(bots);
  for (const h of leftoverH) {
    const bot = rb.find((b) => !used.has(b.id));
    if (bot) push(h, bot);
  }
  const restBots = rb.filter((b) => !used.has(b.id));
  for (let i = 0; i + 1 < restBots.length; i += 2) push(restBots[i]!, restBots[i + 1]!);
  return matches;
}

export function seedBotListings(world: GameWorld, perClub = 6): GameWorld {
  const byId = new Map(world.players.map((p) => [p.id, p]));
  const listed = new Set(
    world.listings.filter((l) => l.status === "active").map((l) => l.team_player_id),
  );
  const extra: TransferListing[] = [];
  for (const club of leagueTeams(world).filter((t) => !t.user_id)) {
    const have = world.listings.filter((l) => l.seller_team_id === club.id && l.status === "active").length;
    const need = Math.max(0, perClub - have);
    if (need === 0) continue;
    const rand = seededRandom(hash32(club.id));
    const benches = world.teamPlayers.filter(
      (r) => r.team_id === club.id && !r.is_starter && !listed.has(r.id),
    );
    for (const r of benches.slice(0, need)) {
      const player = byId.get(r.player_id);
      extra.push({
        id: listingId(club.id, r.player_id),
        team_player_id: r.id,
        seller_team_id: club.id,
        price: Math.max(300, Math.round((player ? marketValue(player) : 800) * (0.95 + rand() * 0.45))),
        status: "active",
        created_at: new Date().toISOString(),
      });
      listed.add(r.id);
    }
  }
  if (!extra.length) return world;
  return { ...world, listings: [...world.listings, ...extra] };
}

export function ensureBotWorld(world: GameWorld): GameWorld {
  const have = new Set(world.teams.map((t) => t.name));
  const missing = AI_CLUBS.filter((c) => !have.has(c.name));
  let next = world;
  if (missing.length) {
    const extraPlayers = generateExtraPlayers(missing.length * 24, 3000 + world.players.length);
    let pool = [...extraPlayers];
    const newTeams: Team[] = [];
    const newRows: TeamPlayer[] = [];
    missing.forEach((c, i) => {
      const team = emptyTeam(teamId(100 + i), c.name, null, c.kit_primary, c.kit_secondary, 7500 + i * 250, 10);
      const { squad, rest } = pickBalancedSquad(pool, c.strength, 18);
      pool = rest;
      const { rows } = assignSquad(team, squad, squad.length, () => Math.random());
      newTeams.push(team);
      newRows.push(...rows);
    });
    next = {
      ...next,
      players: [...next.players, ...extraPlayers],
      teams: [...next.teams, ...newTeams],
      teamPlayers: [...next.teamPlayers, ...newRows],
    };
  }
  const seeded = seedBotListings(next, 6);
  const withLegend = ensureLegendWorld(seeded);
  if (withLegend === world) return world;
  return withLegend;
}
