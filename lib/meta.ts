import { catalogId, clamp, hash32, seededRandom } from "./utils";
import type { GameWorld, Player, Team, TeamPlayer } from "./types";
import { SPECIAL_SPECS } from "./roster";
import { computeOverall, makeAbdullah, rosterPlayers } from "./catalog";
import { normalizePosition } from "./positions";

export const PACK_COST_COINS = 2500;
export const PACK_COST_GEMS = 40;
export const DAILY_LOGIN_COINS = 400;
export const DAILY_LOGIN_GEMS = 5;
export const MATCH_REWARD_WIN = { coins: 350, gems: 2, ranked: 18 };
export const MATCH_REWARD_DRAW = { coins: 180, gems: 1, ranked: 6 };
export const MATCH_REWARD_LOSS = { coins: 90, gems: 0, ranked: -10 };
export const BOOST_COST_GEMS = 15;
export const TRAIN_CARD_COST_COINS = 800;
export const MAX_CARD_LEVEL = 20;

export type QuestId = "login" | "play_match" | "open_pack" | "train_card" | "win_match";

export type QuestProgress = {
  id: QuestId;
  progress: number;
  target: number;
  claimed: boolean;
  rewardCoins: number;
  rewardGems: number;
};

export type TeamMeta = {
  gems: number;
  rankedPoints: number;
  rankedDivision: number;
  dailyLoginAt?: string;
  questDay?: string;
  quests?: QuestProgress[];
  tutorialStep?: number;
  tutorialDone?: boolean;
  battleXp?: number;
  battleClaimed?: number[];
};

export type CardMeta = {
  level: number;
  boost: number;
  trainedAt?: string;
};

export const QUEST_DEFS: Array<Omit<QuestProgress, "progress" | "claimed">> = [
  { id: "login", target: 1, rewardCoins: 200, rewardGems: 2 },
  { id: "play_match", target: 1, rewardCoins: 300, rewardGems: 3 },
  { id: "open_pack", target: 1, rewardCoins: 250, rewardGems: 4 },
  { id: "train_card", target: 1, rewardCoins: 220, rewardGems: 2 },
  { id: "win_match", target: 1, rewardCoins: 400, rewardGems: 5 },
];

export const BATTLE_PASS = [
  { xp: 0, coins: 0, gems: 0 },
  { xp: 20, coins: 200, gems: 0 },
  { xp: 45, coins: 0, gems: 8 },
  { xp: 80, coins: 500, gems: 0 },
  { xp: 120, coins: 0, gems: 15 },
  { xp: 180, coins: 900, gems: 5 },
  { xp: 250, coins: 0, gems: 25 },
  { xp: 320, coins: 1200, gems: 10 },
] as const;

export const DIVISION_LABEL = [
  "Amatör",
  "Bronz III",
  "Bronz II",
  "Bronz I",
  "Gümüş III",
  "Gümüş II",
  "Gümüş I",
  "Altın III",
  "Altın II",
  "Altın I",
  "Elmas",
  "Efsane",
] as const;

export function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function defaultQuests(): QuestProgress[] {
  return QUEST_DEFS.map((q) => ({ ...q, progress: 0, claimed: false }));
}

export function ensureTeamMeta(team: Team): Team & TeamMeta {
  const gems = team.gems ?? 80;
  const rankedPoints = team.rankedPoints ?? 1000;
  const rankedDivision = team.rankedDivision ?? divisionFromPoints(rankedPoints);
  const questDay = team.questDay;
  const today = dayKey();
  const quests: QuestProgress[] =
    questDay === today && team.quests?.length
      ? team.quests.map((q) => ({
          id: q.id as QuestId,
          progress: q.progress,
          target: q.target,
          claimed: q.claimed,
          rewardCoins: q.rewardCoins,
          rewardGems: q.rewardGems,
        }))
      : defaultQuests();
  return {
    ...team,
    gems,
    rankedPoints,
    rankedDivision,
    questDay: today,
    quests,
    tutorialStep: team.tutorialStep ?? 0,
    tutorialDone: Boolean(team.tutorialDone),
    battleXp: team.battleXp ?? 0,
    battleClaimed: team.battleClaimed ?? [],
  };
}

export function ensureCardMeta(tp: TeamPlayer): TeamPlayer & CardMeta {
  return {
    ...tp,
    level: clamp(tp.level ?? 1, 1, MAX_CARD_LEVEL),
    boost: clamp(tp.boost ?? 0, 0, 10),
    trainedAt: tp.trainedAt,
  };
}

export function divisionFromPoints(points: number) {
  if (points >= 2200) return 11;
  if (points >= 2000) return 10;
  if (points >= 1800) return 9;
  if (points >= 1650) return 8;
  if (points >= 1500) return 7;
  if (points >= 1350) return 6;
  if (points >= 1200) return 5;
  if (points >= 1100) return 4;
  if (points >= 1000) return 3;
  if (points >= 900) return 2;
  if (points >= 800) return 1;
  return 0;
}

export function divisionLabel(div: number) {
  return DIVISION_LABEL[clamp(div, 0, DIVISION_LABEL.length - 1)] ?? DIVISION_LABEL[0];
}

/** Live OVR with card level + boost. */
export function cardLiveOverall(player: Player, row?: Pick<TeamPlayer, "level" | "boost">) {
  if (player.legend) return player.overall;
  const level = row?.level ?? 1;
  const boost = row?.boost ?? 0;
  return clamp(player.overall + Math.floor((level - 1) * 0.45) + boost, 1, 99);
}

/** Nation + club chemistry links for XI. */
export function squadChemistry(
  rows: Array<TeamPlayer & { player: Player }>,
  teamNation?: string,
): { score: number; links: number; nationBonus: number } {
  const starters = rows.filter((r) => r.is_starter).slice(0, 11);
  if (!starters.length) return { score: 0, links: 0, nationBonus: 0 };
  let links = 0;
  for (let i = 0; i < starters.length; i++) {
    for (let j = i + 1; j < starters.length; j++) {
      const a = starters[i]!.player;
      const b = starters[j]!.player;
      if (a.nationality_code && a.nationality_code === b.nationality_code) links += 1;
      if (a.tier && a.tier === b.tier && a.tier === "special") links += 0.5;
    }
  }
  const nationBonus = teamNation
    ? starters.filter((r) => r.player.nationality_code === teamNation).length * 2
    : 0;
  const score = clamp(Math.round(35 + links * 3.2 + nationBonus), 0, 100);
  return { score, links: Math.round(links), nationBonus };
}

export function bumpQuest(team: Team, id: QuestId, amount = 1): Team {
  const meta = ensureTeamMeta(team);
  const quests = (meta.quests ?? defaultQuests()).map((q) =>
    q.id === id ? { ...q, progress: Math.min(q.target, q.progress + amount) } : q,
  );
  return { ...meta, quests, questDay: dayKey() };
}

export function claimQuest(team: Team, id: QuestId): Team {
  const meta = ensureTeamMeta(team);
  const quests = [...(meta.quests ?? defaultQuests())];
  const q = quests.find((x) => x.id === id);
  if (!q || q.claimed || q.progress < q.target) throw new Error("Görev hazır değil.");
  return {
    ...meta,
    coins: meta.coins + q.rewardCoins,
    gems: (meta.gems ?? 0) + q.rewardGems,
    battleXp: (meta.battleXp ?? 0) + 12,
    quests: quests.map((x) => (x.id === id ? { ...x, claimed: true } : x)),
  };
}

export function claimDailyLogin(team: Team): Team {
  const meta = ensureTeamMeta(team);
  const today = dayKey();
  if (meta.dailyLoginAt === today) throw new Error("Günlük ödül alındı.");
  return bumpQuest(
    {
      ...meta,
      coins: meta.coins + DAILY_LOGIN_COINS,
      gems: (meta.gems ?? 0) + DAILY_LOGIN_GEMS,
      dailyLoginAt: today,
      battleXp: (meta.battleXp ?? 0) + 8,
    },
    "login",
  );
}

/** Ranked / gem / quest / battle XP after a match. League coins stay in applyMatchResult. */
export function applyMatchRewards(
  team: Team,
  result: "win" | "draw" | "loss",
): Team {
  const meta = ensureTeamMeta(team);
  const table = result === "win" ? MATCH_REWARD_WIN : result === "draw" ? MATCH_REWARD_DRAW : MATCH_REWARD_LOSS;
  const rankedPoints = clamp((meta.rankedPoints ?? 1000) + table.ranked, 0, 3000);
  let next: Team = {
    ...meta,
    gems: (meta.gems ?? 0) + table.gems,
    rankedPoints,
    rankedDivision: divisionFromPoints(rankedPoints),
    battleXp: (meta.battleXp ?? 0) + (result === "win" ? 25 : result === "draw" ? 12 : 6),
  };
  next = bumpQuest(next, "play_match");
  if (result === "win") next = bumpQuest(next, "win_match");
  return next;
}

export function claimBattleTier(team: Team, tier: number): Team {
  const meta = ensureTeamMeta(team);
  const step = BATTLE_PASS[tier];
  if (!step || tier <= 0) throw new Error("Geçersiz kademe.");
  if ((meta.battleXp ?? 0) < step.xp) throw new Error("XP yetmiyor.");
  if ((meta.battleClaimed ?? []).includes(tier)) throw new Error("Ödül alındı.");
  return {
    ...meta,
    coins: meta.coins + step.coins,
    gems: (meta.gems ?? 0) + step.gems,
    battleClaimed: [...(meta.battleClaimed ?? []), tier],
  };
}

export function levelUpCard(tp: TeamPlayer, team: Team): { tp: TeamPlayer; team: Team } {
  const card = ensureCardMeta(tp);
  if (card.level >= MAX_CARD_LEVEL) throw new Error("Maks seviye.");
  if ((team.gems ?? 0) < 8) throw new Error("Yetersiz gem.");
  return {
    tp: { ...card, level: card.level + 1 },
    team: { ...team, gems: (team.gems ?? 0) - 8 },
  };
}

export function boostCard(tp: TeamPlayer, team: Team): { tp: TeamPlayer; team: Team } {
  const card = ensureCardMeta(tp);
  if (card.boost >= 10) throw new Error("Boost dolu.");
  if ((team.gems ?? 0) < BOOST_COST_GEMS) throw new Error("Yetersiz gem.");
  return {
    tp: { ...card, boost: card.boost + 1 },
    team: bumpQuest({ ...team, gems: (team.gems ?? 0) - BOOST_COST_GEMS }, "train_card"),
  };
}

export function trainCard(tp: TeamPlayer, team: Team): { tp: TeamPlayer; team: Team } {
  const card = ensureCardMeta(tp);
  const today = dayKey();
  if (card.trainedAt === today) throw new Error("Bugün antrenman yapıldı.");
  if (team.coins < TRAIN_CARD_COST_COINS) throw new Error("Yetersiz coin.");
  return {
    tp: {
      ...card,
      level: Math.min(MAX_CARD_LEVEL, card.level + (card.level < 10 ? 1 : 0)),
      form: clamp(tp.form + 4, 0, 100),
      energy: clamp(tp.energy + 6, 0, 100),
      trainedAt: today,
    },
    team: bumpQuest({ ...team, coins: team.coins - TRAIN_CARD_COST_COINS }, "train_card"),
  };
}

export type PackPull = {
  player: Player;
  fromPool: "standard" | "special" | "legend";
};

function poolPlayers(world: GameWorld): Player[] {
  const owned = new Set(
    world.teamPlayers.filter((tp) => tp.team_id !== "00000000-0000-4000-8000-000000agency0").map((tp) => tp.player_id),
  );
  const roster = rosterPlayers();
  const extras = world.players.filter((p) => !owned.has(p.id) && !p.legend);
  return [...roster, ...extras].filter((p) => !owned.has(p.id) || p.tier === "special");
}

export function openPack(world: GameWorld, team: Team, pay: "coins" | "gems"): {
  team: Team;
  pulls: PackPull[];
  worldPlayers: Player[];
  newRows: TeamPlayer[];
} {
  const meta = ensureTeamMeta(team);
  if (pay === "coins" && meta.coins < PACK_COST_COINS) throw new Error("Yetersiz coin.");
  if (pay === "gems" && (meta.gems ?? 0) < PACK_COST_GEMS) throw new Error("Yetersiz gem.");
  const rand = seededRandom(hash32(`${team.id}:${Date.now()}:pack`));
  const pulls: PackPull[] = [];
  const newRows: TeamPlayer[] = [];
  const worldPlayers = [...world.players];
  const pool = poolPlayers(world);

  for (let i = 0; i < 3; i++) {
    const roll = rand();
    let pick: Player | undefined;
    let fromPool: PackPull["fromPool"] = "standard";
    if (roll > 0.97) {
      pick = makeAbdullah();
      fromPool = "legend";
    } else if (roll > 0.72) {
      const specials = pool.filter((p) => p.tier === "special");
      pick = specials[Math.floor(rand() * specials.length)] ?? pool[Math.floor(rand() * pool.length)];
      fromPool = "special";
    } else {
      const standards = pool.filter((p) => p.tier === "standard" || !p.tier);
      pick = standards[Math.floor(rand() * standards.length)] ?? pool[Math.floor(rand() * pool.length)];
      fromPool = "standard";
    }
    if (!pick) {
      const spec = SPECIAL_SPECS[Math.floor(rand() * SPECIAL_SPECS.length)]!;
      const id = catalogId(9200 + Math.floor(rand() * 500));
      pick = {
        id,
        name: spec.name,
        nationality: spec.nationality,
        nationality_code: spec.nationality_code,
        position: normalizePosition(spec.position),
        age: spec.age,
        attack: spec.attack,
        defense: spec.defense,
        overall: computeOverall(normalizePosition(spec.position), spec.attack, spec.defense),
        base_value: 5000,
        tier: "special",
        portrait: spec.portrait,
      };
      worldPlayers.push(pick);
    }
    pulls.push({ player: pick, fromPool });
    if (!worldPlayers.some((p) => p.id === pick!.id)) worldPlayers.push(pick);
    newRows.push({
      id: `pack_${team.id}_${pick.id}_${i}_${Date.now().toString(36)}`,
      team_id: team.id,
      player_id: pick.id,
      energy: 100,
      form: 80,
      is_starter: false,
      squad_position: null,
      acquired_at: new Date().toISOString(),
      wage: 50,
      contractYears: 2,
      level: 1,
      boost: 0,
    });
  }

  const paid: Team = {
    ...meta,
    coins: pay === "coins" ? meta.coins - PACK_COST_COINS : meta.coins,
    gems: pay === "gems" ? (meta.gems ?? 0) - PACK_COST_GEMS : meta.gems ?? 0,
    battleXp: (meta.battleXp ?? 0) + 15,
  };
  return { team: bumpQuest(paid, "open_pack"), pulls, worldPlayers, newRows };
}

export function hydrateMetaWorld(world: GameWorld): GameWorld {
  return {
    ...world,
    teams: world.teams.map((t) => ensureTeamMeta(t)),
    teamPlayers: world.teamPlayers.map((tp) => ensureCardMeta(tp)),
  };
}

/** Filter helpers for transfer / squad UI. */
export type CardFilter = {
  q?: string;
  pos?: string;
  tier?: "all" | "standard" | "special" | "legend";
  minOvr?: number;
  sort?: "ovr" | "name" | "value" | "level";
};

export function filterPlayers<T extends { player: Player; level?: number; boost?: number; base_value?: number }>(
  rows: T[],
  filter: CardFilter,
): T[] {
  const q = filter.q?.trim().toLowerCase() ?? "";
  let out = rows.filter((r) => {
    const p = r.player;
    if (q && !p.name.toLowerCase().includes(q) && !p.nationality.toLowerCase().includes(q)) return false;
    if (filter.pos && filter.pos !== "ALL" && p.position !== filter.pos && !p.versatile) return false;
    if (filter.tier === "legend" && !p.legend) return false;
    if (filter.tier === "special" && p.tier !== "special") return false;
    if (filter.tier === "standard" && p.tier === "special") return false;
    const ovr = cardLiveOverall(p, r);
    if ((filter.minOvr ?? 0) > 0 && ovr < (filter.minOvr ?? 0)) return false;
    return true;
  });
  const sort = filter.sort ?? "ovr";
  out = [...out].sort((a, b) => {
    if (sort === "name") return a.player.name.localeCompare(b.player.name, "tr");
    if (sort === "level") return (b.level ?? 1) - (a.level ?? 1);
    if (sort === "value") return (b.player.base_value ?? 0) - (a.player.base_value ?? 0);
    return cardLiveOverall(b.player, b) - cardLiveOverall(a.player, a);
  });
  return out;
}

export const TUTORIAL_STEPS = [
  "Hoş geldin. Önce kadronu ve formasyonunu kontrol et.",
  "Transfer / Paket ekranından oyuncu topla.",
  "Günlük görevleri ve giriş ödülünü al.",
  "Canlı maçta skill, duran top ve değişiklik kullan.",
  "Ranked puanınla division tırman.",
] as const;
