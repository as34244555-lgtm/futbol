import { computeBaseValue, computeOverall, generateExtraPlayers, isLegend, rollPotential, simOverall } from "./catalog";
import { normalizePosition } from "./positions";
import { SYSTEM_TEAM_ID } from "./types";
import type {
  CupState,
  GameWorld,
  NewsItem,
  Player,
  Position,
  Team,
  TeamPlayer,
  Training,
} from "./types";
import { leagueTable, seasonOf, weekInSeason } from "./titles";
import { clamp, hash32, listingId, rowId, uid } from "./utils";

export const CUP_ROUNDS: Record<number, "çeyrek" | "yarı" | "final"> = {
  5: "çeyrek",
  9: "yarı",
  13: "final",
};

export const CUP_PRIZE = 2_500;

export type PlayerAttrs = {
  pace: number;
  finishing: number;
  passing: number;
  marking: number;
  handling: number;
};

function jitter(seed: string, n: number): number {
  return (hash32(seed) % (n * 2 + 1)) - n;
}

export function deriveAttrs(p: Player): PlayerAttrs {
  if (p.pace != null && p.finishing != null && p.passing != null && p.marking != null && p.handling != null) {
    return {
      pace: p.pace,
      finishing: p.finishing,
      passing: p.passing,
      marking: p.marking,
      handling: p.handling,
    };
  }
  const atk = p.attack;
  const def = p.defense;
  const pos = normalizePosition(p.position);
  const cap = (v: number) => clamp(Math.round(v), 8, 99);
  if (pos === "KL") {
    return {
      pace: cap(def * 0.42 + 18 + jitter(p.id + "p", 4)),
      finishing: cap(atk * 0.35 + 10),
      passing: cap(def * 0.55 + 16),
      marking: cap(def * 0.7),
      handling: cap(def * 0.96 + jitter(p.id + "h", 3)),
    };
  }
  if (pos === "STP") {
    return {
      pace: cap(def * 0.58 + atk * 0.18 + jitter(p.id + "p", 5)),
      finishing: cap(atk * 0.5 + 12),
      passing: cap((atk + def) / 2),
      marking: cap(def * 0.94 + jitter(p.id + "m", 3)),
      handling: cap(def * 0.28 + 12),
    };
  }
  if (pos === "SLB" || pos === "SĞB") {
    return {
      pace: cap(def * 0.48 + atk * 0.42 + jitter(p.id + "p", 4)),
      finishing: cap(atk * 0.62 + 8),
      passing: cap(atk * 0.55 + def * 0.38),
      marking: cap(def * 0.86),
      handling: cap(def * 0.22 + 10),
    };
  }
  if (pos === "MOS") {
    return {
      pace: cap(atk * 0.62 + def * 0.28 + jitter(p.id + "p", 4)),
      finishing: cap(atk * 0.74),
      passing: cap(atk * 0.55 + def * 0.42 + jitter(p.id + "pa", 4)),
      marking: cap(def * 0.72),
      handling: cap(def * 0.22 + 10),
    };
  }
  if (pos === "KANAT") {
    return {
      pace: cap(atk * 0.88 + jitter(p.id + "p", 3)),
      finishing: cap(atk * 0.82),
      passing: cap(atk * 0.7 + 8),
      marking: cap(def * 0.58 + 8),
      handling: cap(def * 0.18 + 8),
    };
  }
  return {
    pace: cap(atk * 0.82 + jitter(p.id + "p", 4)),
    finishing: cap(atk * 0.96 + jitter(p.id + "f", 3)),
    passing: cap(atk * 0.62 + 12),
    marking: cap(def * 0.55 + 10),
    handling: cap(def * 0.18 + 8),
  };
}

export function withAttrs(p: Player): Player {
  const a = deriveAttrs(p);
  return { ...p, ...a };
}

export function weeklyWage(p: Player): number {
  if (isLegend(p) || p.overall >= 100) return 0;
  const base = computeBaseValue(simOverall(p), p.age, p.position);
  return Math.max(18, Math.round(base / 42));
}

export function defaultContractYears(p: Player): number {
  if (isLegend(p)) return 99;
  if (p.age <= 21) return 4;
  if (p.age <= 28) return 3;
  if (p.age <= 32) return 2;
  return 1;
}

export function isInjured(tp: TeamPlayer): boolean {
  return (tp.injuryWeeks ?? 0) > 0;
}

export function pushNews(world: GameWorld, item: Omit<NewsItem, "id" | "at" | "week" | "season"> & Partial<Pick<NewsItem, "week" | "season">>): GameWorld {
  const row: NewsItem = {
    id: uid("news"),
    week: item.week ?? world.week,
    season: item.season ?? seasonOf(world.week),
    at: new Date().toISOString(),
    kind: item.kind,
    text: item.text,
    teamId: item.teamId,
  };
  return { ...world, news: [row, ...(world.news ?? [])].slice(0, 48) };
}

export function teamWageBill(world: GameWorld, teamId: string): number {
  const byId = new Map(world.players.map((p) => [p.id, p]));
  return world.teamPlayers
    .filter((tp) => tp.team_id === teamId)
    .reduce((s, tp) => {
      const p = byId.get(tp.player_id);
      return s + (tp.wage ?? (p ? weeklyWage(p) : 0));
    }, 0);
}

export function hydrateWorld(world: GameWorld): GameWorld {
  const players = world.players.map((p) => {
    const position = normalizePosition(p.position);
    const overall = p.legend ? p.overall : computeOverall(position, p.attack, p.defense);
    return withAttrs({
      ...p,
      position,
      overall: p.legend ? p.overall : overall,
      potential: p.potential ?? rollPotential(simOverall({ overall: p.legend ? 99 : overall }), p.age, p.id, p.legend),
    });
  });
  const byId = new Map(players.map((p) => [p.id, p]));
  const teamPlayers = world.teamPlayers.map((tp) => {
    const p = byId.get(tp.player_id);
    if (!p) return tp;
    return {
      ...tp,
      wage: tp.wage ?? weeklyWage(p),
      contractYears: tp.contractYears ?? defaultContractYears(p),
      injuryWeeks: tp.injuryWeeks ?? 0,
    };
  });
  const teams = world.teams.map((t) => ({
    ...t,
    training: t.training ?? "FITNESS",
    kit_style: t.kit_style ?? "solid",
  }));
  return { ...world, players, teamPlayers, teams, news: world.news ?? [], offers: world.offers ?? [] };
}

const INJURY_NAME = ["Darbe", "Burkulma", "Kas yırtığı"] as const;

export function rollInjuries(world: GameWorld, homeId: string, awayId: string): GameWorld {
  const byId = new Map(world.players.map((p) => [p.id, p]));
  let next = world;
  const teamPlayers = world.teamPlayers.map((tp) => {
    if (tp.team_id !== homeId && tp.team_id !== awayId) return tp;
    if (!tp.is_starter || isInjured(tp)) return tp;
    const p = byId.get(tp.player_id);
    if (!p || isLegend(p)) return tp;
    const h = hash32(`${tp.id}:${world.week}:${homeId}:${awayId}`);
    const chance = tp.energy < 40 ? 0.24 : tp.energy < 55 ? 0.09 : 0.025;
    if ((h % 1000) / 1000 >= chance) return tp;
    const weeks = 1 + (h % 3);
    const injury = INJURY_NAME[weeks - 1]!;
    next = pushNews(next, {
      kind: "injury",
      teamId: tp.team_id,
      text: `${p.name} ${injury.toLowerCase()} yaşadı. ${weeks} hafta yok.`,
    });
    return { ...tp, injuryWeeks: weeks, injury };
  });
  return { ...next, teamPlayers };
}

export function applyTrainingRecovery(world: GameWorld): GameWorld {
  const trainingOf = new Map(world.teams.map((t) => [t.id, t.training ?? "FITNESS"]));
  return {
    ...world,
    teamPlayers: world.teamPlayers.map((tp) => {
      const focus = trainingOf.get(tp.team_id);
      const extraE = focus === "FITNESS" ? 8 : 0;
      const extraF = focus === "ATTACK" || focus === "DEFENSE" || focus === "TACTIC" ? 1 : 0;
      const left = Math.max(0, (tp.injuryWeeks ?? 0) - 1);
      return {
        ...tp,
        energy: clamp(tp.energy + 18 + extraE, 0, 100),
        form: clamp(tp.form + extraF, 0, 100),
        injuryWeeks: left,
        injury: left > 0 ? tp.injury : undefined,
      };
    }),
    teams: world.teams.map((t) => ({ ...t, readyWeek: undefined })),
  };
}

export function payWeeklyWages(world: GameWorld): GameWorld {
  let next = world;
  const teams = world.teams.map((t) => {
    if (!t.user_id || t.id === SYSTEM_TEAM_ID) return t;
    const bill = teamWageBill(world, t.id);
    if (bill <= 0) return t;
    const coins = t.coins - bill;
    if (coins < 800) {
      next = pushNews(next, {
        kind: "wage",
        teamId: t.id,
        text: `${t.name} maaş günü −${bill} ₡. Kasa ${Math.max(0, coins)} ₡.`,
      });
    }
    return { ...t, coins: Math.max(0, coins) };
  });
  return { ...next, teams };
}

function growStat(v: number, delta: number): number {
  return clamp(v + delta, 8, 99);
}

export function ageSquads(world: GameWorld): GameWorld {
  const players = world.players.map((p) => {
    if (isLegend(p)) return p;
    const age = p.age + 1;
    let attack = p.attack;
    let defense = p.defense;
    let overall = p.overall;
    if (age <= 23) {
      attack = growStat(attack, 1);
      defense = growStat(defense, 1);
      overall = growStat(overall, 1);
    } else if (age >= 33) {
      attack = growStat(attack, -1);
      defense = growStat(defense, -1);
      overall = growStat(overall, -1);
    }
    const next = withAttrs({
      ...p,
      age,
      attack,
      defense,
      overall,
      base_value: computeBaseValue(simOverall({ ...p, overall }), age, p.position),
    });
    return next;
  });
  const byId = new Map(players.map((p) => [p.id, p]));
  const expired: TeamPlayer[] = [];
  const kept: TeamPlayer[] = [];
  for (const tp of world.teamPlayers) {
    const p = byId.get(tp.player_id);
    if (!p) {
      kept.push(tp);
      continue;
    }
    if (tp.team_id === SYSTEM_TEAM_ID) {
      kept.push({ ...tp, wage: weeklyWage(p) });
      continue;
    }
    if (isLegend(p)) {
      kept.push({ ...tp, contractYears: 99, wage: 0 });
      continue;
    }
    const years = (tp.contractYears ?? 2) - 1;
    if (years <= 0) {
      expired.push({
        ...tp,
        team_id: SYSTEM_TEAM_ID,
        id: rowId(SYSTEM_TEAM_ID, tp.player_id),
        is_starter: false,
        squad_position: null,
        contractYears: 2,
        wage: weeklyWage(p),
        acquired_at: new Date().toISOString(),
      });
    } else {
      kept.push({ ...tp, contractYears: years, wage: weeklyWage(p) });
    }
  }
  let next: GameWorld = {
    ...world,
    players,
    teamPlayers: [...kept, ...expired],
  };
  const listings = [
    ...next.listings,
    ...expired.map((tp) => {
      const p = byId.get(tp.player_id)!;
      return {
        id: listingId(SYSTEM_TEAM_ID, p.id),
        team_player_id: tp.id,
        seller_team_id: SYSTEM_TEAM_ID,
        price: Math.max(200, Math.round((p.base_value || 400) * 0.7)),
        status: "active" as const,
        created_at: new Date().toISOString(),
      };
    }),
  ];
  next = { ...next, listings };
  if (expired.length) {
    next = pushNews(next, {
      kind: "contract",
      text: `${expired.length} oyuncunun sözleşmesi bitti; serbest piyasaya düştüler.`,
    });
  }
  return next;
}

export function stampShare(world: GameWorld): GameWorld {
  const title = world.lastTitle;
  if (!title) return world;
  const champ = world.teams.find((t) => t.id === title.teamId);
  if (!champ) return world;
  const shareText = makeShareText(world, champ, title.season);
  const cupWinner = world.teams.find((t) => t.id === world.cup?.championId)?.name;
  const stamped = { ...title, shareText, cupWinner };
  return {
    ...world,
    lastTitle: stamped,
    titles: (world.titles ?? []).map((t) => (t.season === stamped.season ? stamped : t)),
  };
}

export function makeShareText(world: GameWorld, champion: Team, season: number): string {
  const cup = world.cup?.season === season ? world.teams.find((t) => t.id === world.cup?.championId)?.name : undefined;
  return [
    `Liga Nova · Sezon ${season} bitti`,
    `Şampiyon: ${champion.name} · ${champion.points}p · ${champion.won}G`,
    `Av ${champion.goals_for - champion.goals_against > 0 ? "+" : ""}${champion.goals_for - champion.goals_against}`,
    cup ? `Kupa: ${cup}` : "",
    "futbol-ashen.vercel.app",
  ]
    .filter(Boolean)
    .join(" · ");
}

export function cupRoundOf(week: number): "çeyrek" | "yarı" | "final" | null {
  return CUP_ROUNDS[weekInSeason(week)] ?? null;
}

function pairSeeds(ids: string[]): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  for (let i = 0; i < ids.length; i += 2) {
    const a = ids[i];
    const b = ids[i + 1];
    if (a && b) pairs.push([a, b]);
  }
  return pairs;
}

export function advancingFrom(world: GameWorld, week: number): string[] {
  return world.matches
    .filter((m) => m.week === week && m.kind === "cup" && m.status === "completed")
    .map((m) => (m.home_score >= m.away_score ? m.home_team_id : m.away_team_id))
    .filter((id): id is string => Boolean(id));
}

export function ensureCup(world: GameWorld): GameWorld {
  const round = cupRoundOf(world.week);
  if (!round) return world;
  const season = seasonOf(world.week);
  if (world.matches.some((m) => m.week === world.week && m.kind === "cup")) return world;

  let cup: CupState | undefined = world.cup?.season === season ? world.cup : undefined;
  let seeds = cup?.seeds ?? [];

  if (round === "çeyrek") {
    const table = leagueTable(world).slice(0, 8);
    if (table.length < 4) return world;
    seeds = table.map((t) => t.id);
    if (seeds.length % 2 === 1) seeds = seeds.slice(0, seeds.length - 1);
    cup = { season, seeds };
  } else if (round === "yarı") {
    const qfWeek = (season - 1) * 18 + 5;
    seeds = advancingFrom(world, qfWeek);
    if (seeds.length < 2) return world;
  } else {
    const sfWeek = (season - 1) * 18 + 9;
    seeds = advancingFrom(world, sfWeek);
    if (seeds.length < 2) return world;
  }

  const byId = new Map(world.teams.map((t) => [t.id, t]));
  const ordered =
    round === "çeyrek" && seeds.length >= 8
      ? [seeds[0]!, seeds[7]!, seeds[3]!, seeds[4]!, seeds[1]!, seeds[6]!, seeds[2]!, seeds[5]!]
      : seeds;
  const fixtures = pairSeeds(ordered)
    .map(([a, b]) => {
      const home = byId.get(a);
      const away = byId.get(b);
      if (!home || !away) return null;
      return {
        id: `fx_${world.week}_${home.id}_${away.id}_cup`,
        home_team_id: home.id,
        away_team_id: away.id,
        home_score: 0,
        away_score: 0,
        status: "pending" as const,
        played_at: new Date().toISOString(),
        week: world.week,
        claimed_by: [],
        kind: "cup" as const,
      };
    })
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  let next: GameWorld = {
    ...world,
    cup: cup ?? { season, seeds },
    matches: [...world.matches, ...fixtures],
  };
  if (fixtures.length) {
    next = pushNews(next, {
      kind: "cup",
      text: `Liga Nova Kupası ${round} finali kuraları çekildi (${fixtures.length} maç).`,
    });
  }
  return next;
}

export function crownCup(world: GameWorld): GameWorld {
  if (weekInSeason(world.week - 1) !== 13) return world;
  const lookSeason = seasonOf(world.week - 1);
  const fw = (lookSeason - 1) * 18 + 13;
  const final = world.matches.find((m) => m.week === fw && m.kind === "cup" && m.status === "completed");
  if (!final) return world;
  if (world.cup?.championId && world.cup.season === lookSeason) return world;
  const winnerId = final.home_score >= final.away_score ? final.home_team_id : final.away_team_id;
  if (!winnerId) return world;
  const winner = world.teams.find((t) => t.id === winnerId);
  let next: GameWorld = {
    ...world,
    cup: { season: lookSeason, seeds: world.cup?.seeds ?? [], championId: winnerId },
    teams: world.teams.map((t) =>
      t.id === winnerId && t.user_id ? { ...t, coins: t.coins + CUP_PRIZE } : t,
    ),
  };
  next = pushNews(next, {
    kind: "cup",
    teamId: winnerId,
    text: `${winner?.name ?? "Takım"} Liga Nova Kupası'nı kaldırdı.${winner?.user_id ? ` Ödül +${CUP_PRIZE} ₡.` : ""}`,
  });
  return next;
}

export function trainingHint(focus: Training): string {
  if (focus === "FITNESS") return "Enerji dolar; gençler biraz tempo kazanır.";
  if (focus === "ATTACK") return "Bitiricilik ve hücum gelişir — genç yıldızlar daha hızlı büyür.";
  if (focus === "DEFENSE") return "Markaj ve savunma gelişir.";
  return "Pas, mevki uyumu ve oyun zekâsı pekişir.";
}

export function positionAttrKey(pos: Position): keyof PlayerAttrs {
  const p = normalizePosition(pos);
  if (p === "KL") return "handling";
  if (p === "STP" || p === "SLB" || p === "SĞB") return "marking";
  if (p === "MOS") return "passing";
  if (p === "KANAT") return "pace";
  return "finishing";
}

function bumpAttr(p: Player, key: keyof PlayerAttrs, delta: number): Player {
  const cur = deriveAttrs(p);
  const next = clamp((cur[key] ?? 50) + delta, 8, p.legend ? 99 : 99);
  return { ...p, [key]: next };
}

/** Haftalık gelişim: antrenman + yaş + oynama süresi. Efsane sabit. */
export function developPlayers(world: GameWorld): GameWorld {
  const trainingOf = new Map(world.teams.map((t) => [t.id, t.training ?? "FITNESS"]));
  const byTp = new Map(world.teamPlayers.map((tp) => [tp.player_id, tp]));
  const grown: string[] = [];
  const players = world.players.map((p) => {
    if (isLegend(p)) return { ...p, lastGrowth: 0 };
    const tp = byTp.get(p.id);
    if (!tp || tp.team_id === SYSTEM_TEAM_ID) return { ...p, lastGrowth: 0 };
    if ((tp.injuryWeeks ?? 0) > 0) return { ...p, lastGrowth: 0 };
    const potential = p.potential ?? rollPotential(simOverall(p), p.age, p.id, p.legend);
    const h = hash32(`${p.id}:${world.week}:grow`);
    const focus = trainingOf.get(tp.team_id) ?? "FITNESS";
    const youth = p.age <= 21 ? 0.42 : p.age <= 24 ? 0.28 : p.age <= 28 ? 0.12 : p.age <= 32 ? 0.04 : 0;
    const starter = tp.is_starter ? 0.18 : 0.06;
    const train = focus === "FITNESS" ? 0.04 : 0.12;
    const chance = youth + starter + train;
    let attack = p.attack;
    let defense = p.defense;
    let delta = 0;
    if (p.age >= 33 && (h % 1000) / 1000 < 0.35) {
      attack = growStat(attack, -1);
      defense = growStat(defense, -1);
      delta = -1;
    } else if (simOverall(p) < potential && (h % 1000) / 1000 < chance) {
      if (focus === "ATTACK" || p.position === "FV" || p.position === "KANAT") attack = growStat(attack, 1);
      else if (focus === "DEFENSE" || p.position === "STP" || p.position === "KL") defense = growStat(defense, 1);
      else {
        if (h % 2 === 0) attack = growStat(attack, 1);
        else defense = growStat(defense, 1);
      }
      delta = 1;
    }
    const overall = p.legend ? p.overall : computeOverall(normalizePosition(p.position), attack, defense);
    let next = withAttrs({
      ...p,
      attack,
      defense,
      overall,
      potential,
      lastGrowth: delta,
      base_value: computeBaseValue(simOverall({ overall }), p.age, normalizePosition(p.position)),
    });
    if (delta > 0) {
      const key = positionAttrKey(normalizePosition(p.position));
      next = bumpAttr(next, key, 1);
      grown.push(`${p.name} ${p.overall}→${next.overall}`);
    }
    return next;
  });
  let next: GameWorld = { ...world, players };
  if (grown.length) {
    next = pushNews(next, {
      kind: "growth",
      text: `Antrenman işe yaradı: ${grown.slice(0, 4).join(", ")}${grown.length > 4 ? "…" : ""}`,
    });
  }
  return next;
}

export function intakeYouth(world: GameWorld): GameWorld {
  const humans = world.teams.filter((t) => t.user_id);
  if (!humans.length) return world;
  const extras = generateExtraPlayers(humans.length * 3, 12_000 + world.players.length + world.week);
  const youths = extras.map((p) => {
    const age = 16 + (hash32(p.id) % 3);
    const attack = clamp(p.attack - 12, 42, 68);
    const defense = clamp(p.defense - 12, 40, 68);
    const position = normalizePosition(p.position);
    const overall = computeOverall(position, attack, defense);
    return withAttrs({
      ...p,
      age,
      attack,
      defense,
      overall,
      potential: rollPotential(overall, age, p.id + ":y"),
      base_value: computeBaseValue(overall, age, position),
    });
  });
  const rows: TeamPlayer[] = [];
  let i = 0;
  for (const team of humans) {
    const take = youths.slice(i, i + 3);
    i += 3;
    for (const p of take) {
      rows.push({
        id: rowId(team.id, p.id),
        team_id: team.id,
        player_id: p.id,
        energy: 100,
        form: 70,
        is_starter: false,
        squad_position: null,
        acquired_at: new Date().toISOString(),
        contractYears: 4,
        wage: weeklyWage(p),
      });
    }
  }
  let next: GameWorld = {
    ...world,
    players: [...world.players, ...youths.slice(0, humans.length * 3)],
    teamPlayers: [...world.teamPlayers, ...rows],
  };
  next = pushNews(next, {
    kind: "youth",
    text: `Altyapıdan ${rows.length} genç futbolcu A takıma çıktı.`,
  });
  return next;
}

export function retireVeterans(world: GameWorld): GameWorld {
  const byId = new Map(world.players.map((p) => [p.id, p]));
  const retired: string[] = [];
  const keepTp: TeamPlayer[] = [];
  const dropIds = new Set<string>();
  for (const tp of world.teamPlayers) {
    const p = byId.get(tp.player_id);
    if (!p || isLegend(p) || tp.team_id === SYSTEM_TEAM_ID) {
      keepTp.push(tp);
      continue;
    }
    if (p.age >= 36 || (p.age >= 34 && p.overall <= 62)) {
      retired.push(p.name);
      dropIds.add(tp.id);
      continue;
    }
    keepTp.push(tp);
  }
  if (!retired.length) return world;
  let next: GameWorld = {
    ...world,
    teamPlayers: keepTp,
    listings: world.listings.map((l) => (dropIds.has(l.team_player_id) ? { ...l, status: "cancelled" as const } : l)),
  };
  next = pushNews(next, {
    kind: "retire",
    text: `${retired.slice(0, 5).join(", ")} futbolu bıraktı.`,
  });
  return next;
}
