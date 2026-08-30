import { FORMATION_SLOTS, TACTIC_MOD } from "./formations";
import { computeBaseValue, simOverall } from "./catalog";
import type { Formation, Player, Position, Tactic, Team, TeamPlayer } from "./types";
import { clamp } from "./utils";

export type SimLike = Player & { energy: number; form: number; slotKey: string };

export const FORMATION_SHAPE: Record<
  Formation,
  { attack: number; defense: number; mid: number; width: number }
> = {
  "4-3-3": { attack: 1.06, defense: 0.96, mid: 1.02, width: 1.08 },
  "4-4-2": { attack: 1.02, defense: 1.02, mid: 1.0, width: 1.04 },
  "3-5-2": { attack: 1.04, defense: 0.94, mid: 1.1, width: 1.06 },
  "4-2-3-1": { attack: 1.05, defense: 1.0, mid: 1.08, width: 1.0 },
  "5-3-2": { attack: 0.92, defense: 1.12, mid: 0.98, width: 0.92 },
  "3-4-3": { attack: 1.1, defense: 0.9, mid: 0.96, width: 1.1 },
};

export function playingRole(p: SimLike, formation: Formation): Position {
  if (!p.versatile) {
    const slot = FORMATION_SLOTS[formation].find((s) => s.key === p.slotKey);
    return slot?.position ?? p.position;
  }
  return FORMATION_SLOTS[formation].find((s) => s.key === p.slotKey)?.position ?? p.position;
}

/** Doğal mevki dışındaki düşüş. Kaleci forvette %45, komşu mevki %82. */
export function positionFit(natural: Position, playing: Position, versatile?: boolean): number {
  if (versatile || natural === playing) return 1;
  if (natural === "KL" || playing === "KL") return 0.48;
  if (
    (natural === "OS" && (playing === "FV" || playing === "DEF")) ||
    (playing === "OS" && (natural === "FV" || natural === "DEF"))
  ) {
    return 0.84;
  }
  return 0.7;
}

/** Enerji ve form: yorgun/düşük formlu oyuncu belirgin zayıflar. */
export function condition(energy: number, form: number): number {
  const e = clamp(energy, 0, 100) / 100;
  const f = clamp(form, 0, 100) / 100;
  const tired = e < 0.55 ? 0.72 + e * 0.4 : 0.82 + e * 0.18;
  return clamp(tired * (0.62 + f * 0.48), 0.35, 1.08);
}

export function slotWeights(pos: Position): { attack: number; defense: number; mid: number } {
  if (pos === "KL") return { attack: 0.12, defense: 1.45, mid: 0.15 };
  if (pos === "DEF") return { attack: 0.48, defense: 1.22, mid: 0.55 };
  if (pos === "OS") return { attack: 1.05, defense: 0.88, mid: 1.25 };
  return { attack: 1.28, defense: 0.38, mid: 0.7 };
}

export function playerLive(p: SimLike, formation: Formation) {
  const pos = playingRole(p, formation);
  const fit = positionFit(p.position, pos, p.versatile);
  const cond = condition(p.energy, p.form);
  const w = slotWeights(pos);
  const atk = p.attack * cond * fit;
  const def = p.defense * cond * fit;
  const ctrl = ((simOverall(p) + p.attack + p.defense) / 3) * cond * fit;
  return {
    pos,
    fit,
    cond,
    attack: atk * w.attack,
    defense: def * w.defense,
    mid: ctrl * w.mid,
    rawAttack: atk,
    rawDefense: def,
  };
}

export type TeamProfile = {
  attack: number;
  defense: number;
  mid: number;
  tempo: number;
  possession: number;
  conversion: number;
  chemistry: number;
  home: boolean;
};

function tacticClash(self: Tactic, opp: Tactic) {
  if (self === "COUNTER" && (opp === "ATTACKING" || opp === "POSSESSION")) {
    return { attack: 1.08, defense: 1.04, conversion: 1.12, possession: 0.94 };
  }
  if (self === "POSSESSION" && opp === "DEFENSIVE") {
    return { attack: 0.94, defense: 1.02, conversion: 0.9, possession: 1.06 };
  }
  if (self === "ATTACKING" && opp === "DEFENSIVE") {
    return { attack: 0.97, defense: 0.92, conversion: 0.93, possession: 1.04 };
  }
  if (self === "DEFENSIVE" && opp === "ATTACKING") {
    return { attack: 0.92, defense: 1.1, conversion: 0.96, possession: 0.95 };
  }
  return { attack: 1, defense: 1, conversion: 1, possession: 1 };
}

export function teamProfile(team: Team, starters: SimLike[], home: boolean, oppTactic?: Tactic): TeamProfile {
  const shape = FORMATION_SHAPE[team.formation];
  const tac = TACTIC_MOD[team.tactics];
  const clash = oppTactic ? tacticClash(team.tactics, oppTactic) : { attack: 1, defense: 1, conversion: 1, possession: 1 };
  const lives = starters.map((p) => playerLive(p, team.formation));
  const n = Math.max(1, lives.length);
  const attack = lives.reduce((s, p) => s + p.attack, 0) / n;
  const defense = lives.reduce((s, p) => s + p.defense, 0) / n;
  const mid = lives.reduce((s, p) => s + p.mid, 0) / n;
  const chemistry = lives.reduce((s, p) => s + p.fit, 0) / n;
  const homeMul = home ? 1.055 : 1;
  return {
    attack: attack * shape.attack * tac.attack * clash.attack * homeMul,
    defense: defense * shape.defense * tac.defense * clash.defense * (home ? 1.03 : 1),
    mid: mid * shape.mid,
    tempo: tac.tempo * (0.92 + shape.width * 0.08),
    possession: tac.possession * clash.possession * (0.85 + mid / 140),
    conversion: tac.conversion * clash.conversion,
    chemistry,
    home,
  };
}

export function possessionShare(home: TeamProfile, away: TeamProfile): number {
  const h = home.possession * (0.7 + home.mid / 90);
  const a = away.possession * (0.7 + away.mid / 90);
  return clamp(h / (h + a || 1), 0.32, 0.68);
}

/** Dakika ilerledikçe yorgun savunma açılır. */
export function lateFatigue(minute: number, avgEnergy: number): number {
  const t = clamp((minute - 55) / 40, 0, 1);
  return 1 + t * (1 - avgEnergy / 100) * 0.22;
}

export function shotXg(
  attacker: number,
  defense: number,
  keeper: number,
  conversion: number,
  fatigue: number,
  close: boolean,
): number {
  const gap = (attacker - defense * 0.72 - keeper * 0.28) / 90;
  const base = 0.09 + gap * 0.16;
  const loc = close ? 1.38 : 0.82;
  return clamp(base * loc * conversion * fatigue, 0.035, 0.46);
}

export function expectedGoals(home: TeamProfile, away: TeamProfile): { home: number; away: number } {
  const poss = possessionShare(home, away);
  const homeChances = (7.2 + (home.attack - away.defense) / 14) * home.tempo * poss * 1.15;
  const awayChances = (6.4 + (away.attack - home.defense) / 14) * away.tempo * (1 - poss) * 1.05;
  const hx = clamp(homeChances, 4, 14) * 0.13 * home.conversion;
  const ax = clamp(awayChances, 3.2, 12) * 0.12 * away.conversion;
  return { home: clamp(hx, 0.35, 3.6), away: clamp(ax, 0.25, 3.2) };
}

export function chemistryOf(team: Team, starters: SimLike[]): number {
  if (!starters.length) return 0;
  return starters.reduce((s, p) => s + positionFit(p.position, playingRole(p, team.formation), p.versatile), 0) / starters.length;
}

/** Piyasa: yaş + form. Efsane kart sabit 100.000. */
export function marketValue(player: Player, form = 78): number {
  if (player.legend || player.overall >= 100) return player.base_value;
  const formMul = 0.7 + clamp(form, 30, 100) / 220;
  return Math.max(180, Math.round(computeBaseValue(simOverall(player), player.age, player.position) * formMul));
}

export function teamGrade(profile: TeamProfile): { attack: number; defense: number; mid: number } {
  return {
    attack: clamp(Math.round(profile.attack), 1, 99),
    defense: clamp(Math.round(profile.defense), 1, 99),
    mid: clamp(Math.round(profile.mid), 1, 99),
  };
}

export function startersOf(team: Team, roster: Array<TeamPlayer & { player: Player }>): SimLike[] {
  const chosen = [...roster.filter((r) => r.is_starter), ...roster.filter((r) => !r.is_starter)].slice(0, 11);
  return chosen.map((r) => {
    const slotKey = r.squad_position || "gk";
    const slot = FORMATION_SLOTS[team.formation].find((s) => s.key === slotKey);
    const position = r.player.versatile && slot ? slot.position : r.player.position;
    return { ...r.player, position, energy: r.energy, form: r.form, slotKey };
  });
}
