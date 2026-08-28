import { FORMATION_SLOTS, TACTIC_MOD } from "./formations";
import type {
  Formation,
  Match,
  MatchLog,
  MatchSimulationResult,
  PitchPoint,
  Player,
  Team,
  TeamPlayer,
  TimelineEvent,
} from "./types";
import { clamp, seededRandom, uid } from "./utils";

export type SimPlayer = Player & {
  energy: number;
  form: number;
  slotKey: string;
};

export type SimSide = {
  team: Team;
  starters: SimPlayer[];
};

function rating(p: SimPlayer, key: "attack" | "defense"): number {
  const cond = (p.energy / 100) * (0.55 + p.form / 220);
  return p[key] * cond;
}

function sideStrength(side: SimSide) {
  const tac = TACTIC_MOD[side.team.tactics];
  const atk =
    side.starters.reduce((s, p) => {
      const w = p.position === "FV" ? 1.25 : p.position === "OS" ? 1.05 : p.position === "KL" ? 0.15 : 0.55;
      return s + rating(p, "attack") * w;
    }, 0) / 11;
  const def =
    side.starters.reduce((s, p) => {
      const w = p.position === "KL" ? 1.4 : p.position === "DEF" ? 1.2 : p.position === "OS" ? 0.85 : 0.4;
      return s + rating(p, "defense") * w;
    }, 0) / 11;
  const mid =
    side.starters.filter((p) => p.position === "OS").reduce((s, p) => s + (p.overall * p.form) / 100, 0) /
    Math.max(1, side.starters.filter((p) => p.position === "OS").length);
  return {
    attack: atk * tac.attack,
    defense: def * tac.defense,
    tempo: tac.tempo,
    possession: tac.possession * (mid / 75),
    conversion: tac.conversion,
  };
}

function slotPos(formation: Formation, slotKey: string, home: boolean): PitchPoint {
  const slots = FORMATION_SLOTS[formation];
  const s = slots.find((x) => x.key === slotKey) ?? slots[0]!;
  return home ? { x: s.x, y: s.y } : { x: 100 - s.x, y: 100 - s.y };
}

function lerp(a: PitchPoint, b: PitchPoint, t: number): PitchPoint {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function jitter(rand: () => number, p: PitchPoint, n = 6): PitchPoint {
  return { x: clamp(p.x + (rand() - 0.5) * n, 4, 96), y: clamp(p.y + (rand() - 0.5) * n, 6, 94) };
}

function pickBy<T>(rand: () => number, items: T[], weight: (item: T) => number): T {
  if (items.length === 0) {
    throw new Error("empty pick");
  }
  const weights = items.map(weight);
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  let r = rand() * sum;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

function safePick<T>(rand: () => number, preferred: T[], fallback: T[], weight: (item: T) => number): T {
  const pool = preferred.length ? preferred : fallback;
  return pickBy(rand, pool, weight);
}

const EVENT = {
  KICKOFF: "kickoff",
  PASS: "pass",
  SHOT: "shot",
  GOAL: "goal",
  SAVE: "save",
  MISS: "miss",
  FOUL: "foul",
  CARD: "card",
  CORNER: "corner",
  OFFSIDE: "offside",
  CHANCE: "chance",
  WHISTLE: "whistle",
} as const;

function line(
  templates: string[],
  vars: Record<string, string>,
  rand: () => number,
): string {
  const t = templates[Math.floor(rand() * templates.length)]!;
  return t.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

export function simulateMatch(
  home: SimSide,
  away: SimSide,
  week: number,
  seed = Date.now(),
): MatchSimulationResult {
  const rand = seededRandom(seed >>> 0);
  const matchId = uid("match");
  const logs: MatchLog[] = [];
  const timeline: TimelineEvent[] = [];
  let homeScore = 0;
  let awayScore = 0;
  const hs = sideStrength(home);
  const as = sideStrength(away);
  const homePoss = hs.possession / (hs.possession + as.possession);

  const push = (
    minute: number,
    eventType: string,
    description: string,
    ball: PitchPoint,
    team: TimelineEvent["team"],
    actor?: SimPlayer,
  ) => {
    logs.push({
      id: uid("log"),
      match_id: matchId,
      minute: clamp(Math.round(minute), 1, 90),
      event_type: eventType,
      description,
    });
    timeline.push({
      minute: clamp(Math.round(minute), 1, 90),
      second: Math.floor(rand() * 60),
      eventType,
      description,
      ball,
      actorName: actor?.name,
      actorId: actor?.id,
      team,
      score: [homeScore, awayScore],
    });
  };

  const kick: PitchPoint = { x: 50, y: 50 };
  push(1, EVENT.KICKOFF, "Hakem düdüğü çaldı! Karşılaşma başladı.", kick, "neutral");

  const attackers = (side: SimSide) => side.starters.filter((p) => p.position === "FV" || p.position === "OS");
  const defenders = (side: SimSide) => side.starters.filter((p) => p.position === "DEF");
  const gk = (side: SimSide) => side.starters.find((p) => p.position === "KL") ?? side.starters[0]!;

  const eventChance = ((hs.tempo + as.tempo) / 2) * 0.17;

  for (let minute = 2; minute <= 90; minute++) {
    if (rand() > eventChance && minute !== 45 && minute !== 90) continue;
    const homeHas = rand() < homePoss;
    const att = homeHas ? home : away;
    const def = homeHas ? away : home;
    const attS = homeHas ? hs : as;
    const defS = homeHas ? as : hs;
    const side: "home" | "away" = homeHas ? "home" : "away";
    const actor = safePick(rand, attackers(att), att.starters, (p) => rating(p, "attack") + 8);
    const marker = safePick(rand, defenders(def), def.starters, (p) => rating(p, "defense") + 8);
    const keeper = gk(def);
    const from = jitter(rand, slotPos(att.team.formation, actor.slotKey, homeHas));
    const towardGoal: PitchPoint = homeHas ? { x: 94, y: 50 } : { x: 6, y: 50 };
    const box = lerp(from, towardGoal, 0.72 + rand() * 0.18);

    const roll = rand();
    if (minute === 45 && roll < 0.5) {
      push(45, EVENT.WHISTLE, "İlk yarı sona erdi.", { x: 50, y: 50 }, "neutral");
      continue;
    }

    if (roll < 0.12) {
      push(
        minute,
        EVENT.FOUL,
        line(
          [
            "{def} {att} oyuncusunu düşürdü. Serbest vuruş.",
            "Faul! {att} yerde kaldı, {def} itiraz ediyor.",
          ],
          { att: actor.name, def: marker.name },
          rand,
        ),
        jitter(rand, from, 8),
        side,
        actor,
      );
      if (rand() < 0.22) {
        push(
          minute,
          EVENT.CARD,
          `${marker.name} sarı kart gördü.`,
          jitter(rand, from, 4),
          side === "home" ? "away" : "home",
          marker,
        );
      }
      continue;
    }

    if (roll < 0.2) {
      push(
        minute,
        EVENT.OFFSIDE,
        line(["{att} ofsayta yakalandı.", "Bayrak havada! {att} ofsayt."], { att: actor.name }, rand),
        jitter(rand, box, 10),
        side,
        actor,
      );
      continue;
    }

    if (roll < 0.48) {
      const dest = safePick(rand, att.starters, att.starters, (p) => (p.position === "FV" ? 3 : 1));
      push(
        minute,
        EVENT.PASS,
        line(
          [
            "{a} topu {b} ile buluşturdu.",
            "Güzel kombinasyon: {a} → {b}.",
            "{a} kanattan içeri çeviriyor, {b} karşılıyor.",
          ],
          { a: actor.name, b: dest.name },
          rand,
        ),
        jitter(rand, lerp(from, slotPos(att.team.formation, dest.slotKey, homeHas), 0.7)),
        side,
        actor,
      );
      continue;
    }

    if (roll < 0.62) {
      push(
        minute,
        EVENT.CHANCE,
        line(
          [
            "{att} ceza sahasına süzüldü!",
            "Tehlikeli an! {att} kaleye yaklaşıyor.",
            "{att} savunmayı geçti, şimdi ne yapacak?",
          ],
          { att: actor.name },
          rand,
        ),
        jitter(rand, box, 8),
        side,
        actor,
      );
      continue;
    }

    if (roll < 0.72) {
      push(
        minute,
        EVENT.CORNER,
        `${actor.name} korner kazandırdı.`,
        homeHas ? { x: 98, y: rand() < 0.5 ? 8 : 92 } : { x: 2, y: rand() < 0.5 ? 8 : 92 },
        side,
        actor,
      );
      continue;
    }

    // Shot sequence
    push(
      minute,
      EVENT.SHOT,
      line(
        ["ŞUT! {att} deniyor!", "{att} kaleyi karşısına aldı ve vurdu!", "Uzak mesafeden {att}!" ],
        { att: actor.name },
        rand,
      ),
      jitter(rand, box, 6),
      side,
      actor,
    );

    const shotQuality = attS.attack * attS.conversion * (0.75 + rand() * 0.5);
    const saveQuality = defS.defense * (0.85 + rand() * 0.4) * (keeper.defense / 72);
    const onTarget = rand() < 0.55;
    const gap = shotQuality - saveQuality;
    const goalChance = clamp(0.09 + gap / 320, 0.04, 0.3);
    const isGoal = onTarget && rand() < goalChance;

    if (isGoal) {
      if (homeHas) homeScore += 1;
      else awayScore += 1;
      const desc = line(
        [
          "GOOOOL! {att} fileleri havalandırdı! {home} {hs} - {as} {away}",
          "AĞLARDA! {att} takımını öne taşıyor. Skor {hs}-{as}.",
          "Muhteşem gol! {att} stadyumu ayağa kaldırdı.",
        ],
        {
          att: actor.name,
          home: home.team.name,
          away: away.team.name,
          hs: String(homeScore),
          as: String(awayScore),
        },
        rand,
      );
      push(minute, EVENT.GOAL, desc, towardGoal, side, actor);
    } else if (onTarget) {
      push(
        minute,
        EVENT.SAVE,
        line(
          ["Kaleci {gk} harika kurtardı!", "{gk} topu kornere çeldi.", "Müthiş refleks! {gk} gole izin vermedi."],
          { gk: keeper.name },
          rand,
        ),
        lerp(box, homeHas ? { x: 96, y: 50 } : { x: 4, y: 50 }, 0.9),
        side === "home" ? "away" : "home",
        keeper,
      );
    } else {
      push(
        minute,
        EVENT.MISS,
        line(["Direğin yanından dışarı!", "{att} topu tribüne gönderdi.", "Kaleciye gitmedi, aut."], { att: actor.name }, rand),
        { x: clamp(towardGoal.x + (rand() - 0.5) * 8, 2, 98), y: rand() < 0.5 ? 8 : 92 },
        side,
        actor,
      );
    }
  }

  push(
    90,
    EVENT.WHISTLE,
    `Maç sona erdi! ${home.team.name} ${homeScore} - ${awayScore} ${away.team.name}`,
    { x: 50, y: 50 },
    "neutral",
  );

  const homeBest = [...home.starters].sort((a, b) => b.overall * b.form - a.overall * a.form)[0];
  const awayBest = [...away.starters].sort((a, b) => b.overall * b.form - a.overall * a.form)[0];
  const motmSide = homeScore > awayScore ? "home" : awayScore > homeScore ? "away" : homeBest && awayBest && homeBest.overall >= awayBest.overall ? "home" : "away";
  const motmPlayer = motmSide === "home" ? homeBest : awayBest;

  const match: Match = {
    id: matchId,
    home_team_id: home.team.id,
    away_team_id: away.team.id,
    home_score: homeScore,
    away_score: awayScore,
    status: "completed",
    played_at: new Date().toISOString(),
    week,
  };

  return {
    match,
    logs,
    timeline,
    motm: motmPlayer ? { playerId: motmPlayer.id, name: motmPlayer.name, team: motmSide } : undefined,
  };
}

export function buildSimSide(
  team: Team,
  roster: Array<TeamPlayer & { player: Player }>,
): SimSide {
  const chosen = [
    ...roster.filter((r) => r.is_starter),
    ...roster.filter((r) => !r.is_starter),
  ].slice(0, 11);
  const starters = chosen.map((r) => ({
    ...r.player,
    energy: r.energy,
    form: r.form,
    slotKey: r.squad_position || "gk",
  }));
  return { team, starters };
}
