import { FORMATION_SLOTS } from "./formations";
import {
  expectedGoals,
  lateFatigue,
  playerLive,
  playingRole,
  possessionShare,
  shotXg,
  teamProfile,
  type SimLike,
} from "./ratings";
import type {
  Formation,
  Match,
  MatchLog,
  MatchSheet,
  MatchSimulationResult,
  PitchPoint,
  Player,
  Position,
  Team,
  TeamPlayer,
  TimelineEvent,
} from "./types";
import { clamp, seededRandom, uid } from "./utils";

export type SimPlayer = SimLike;

export type SimSide = {
  team: Team;
  starters: SimPlayer[];
};

function role(p: SimPlayer, formation: Formation): Position {
  return playingRole(p, formation);
}

function ratingOn(p: SimPlayer, formation: Formation, key: "attack" | "defense"): number {
  const live = playerLive(p, formation);
  return key === "attack" ? live.rawAttack : live.rawDefense;
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

function poisson(rand: () => number, lambda: number): number {
  const L = Math.exp(-Math.max(0.05, lambda));
  let k = 0;
  let p = 1;
  do {
    k += 1;
    p *= rand();
  } while (p > L);
  return k - 1;
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

function line(templates: string[], vars: Record<string, string>, rand: () => number): string {
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
  const hp = teamProfile(home.team, home.starters, true, away.team.tactics);
  const ap = teamProfile(away.team, away.starters, false, home.team.tactics);
  const homePoss = possessionShare(hp, ap);
  const homeEnergy = home.starters.reduce((s, p) => s + p.energy, 0) / Math.max(1, home.starters.length);
  const awayEnergy = away.starters.reduce((s, p) => s + p.energy, 0) / Math.max(1, away.starters.length);
  const sheet: MatchSheet = {
    xg: [0, 0],
    shots: [0, 0],
    shotsOn: [0, 0],
    possession: [Math.round(homePoss * 100), Math.round((1 - homePoss) * 100)],
  };
  const contrib = new Map<string, number>();
  const addC = (id: string, n: number) => contrib.set(id, (contrib.get(id) ?? 0) + n);

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

  const attackers = (side: SimSide) =>
    side.starters.filter((p) => {
      const pos = role(p, side.team.formation);
      return pos === "FV" || pos === "OS";
    });
  const defenders = (side: SimSide) => side.starters.filter((p) => role(p, side.team.formation) === "DEF");
  const gk = (side: SimSide) =>
    side.starters.find((p) => role(p, side.team.formation) === "KL") ?? side.starters[0]!;

  const playMinute = (minute: number) => {
    const homeHas = rand() < homePoss;
    const att = homeHas ? home : away;
    const def = homeHas ? away : home;
    const attP = homeHas ? hp : ap;
    const defP = homeHas ? ap : hp;
    const side: "home" | "away" = homeHas ? "home" : "away";
    const actor = safePick(rand, attackers(att), att.starters, (p) => ratingOn(p, att.team.formation, "attack") + 8);
    const marker = safePick(rand, defenders(def), def.starters, (p) => ratingOn(p, def.team.formation, "defense") + 8);
    const keeper = gk(def);
    const from = jitter(rand, slotPos(att.team.formation, actor.slotKey, homeHas));
    const towardGoal: PitchPoint = homeHas ? { x: 94, y: 50 } : { x: 6, y: 50 };
    const box = lerp(from, towardGoal, 0.72 + rand() * 0.18);
    const fat = lateFatigue(minute, homeHas ? awayEnergy : homeEnergy);

    const resolveShot = (close: boolean) => {
      const xg = shotXg(
        ratingOn(actor, att.team.formation, "attack"),
        defP.defense,
        ratingOn(keeper, def.team.formation, "defense"),
        attP.conversion,
        fat,
        close,
      );
      if (homeHas) {
        sheet.xg[0] += xg;
        sheet.shots[0] += 1;
      } else {
        sheet.xg[1] += xg;
        sheet.shots[1] += 1;
      }
      addC(actor.id, 2);
      push(
        minute,
        EVENT.SHOT,
        line(["ŞUT! {att} deniyor!", "{att} kaleyi karşısına aldı ve vurdu!", "Uzak mesafeden {att}!"], { att: actor.name }, rand),
        jitter(rand, box, 6),
        side,
        actor,
      );
      if (rand() < xg) {
        if (homeHas) {
          homeScore += 1;
          sheet.shotsOn[0] += 1;
        } else {
          awayScore += 1;
          sheet.shotsOn[1] += 1;
        }
        addC(actor.id, 12);
        push(
          minute,
          EVENT.GOAL,
          line(
            [
              "GOOOOL! {att} fileleri havalandırdı! {home} {hs} - {as} {away}",
              "AĞLARDA! {att} skoru {hs}-{as} yaptı.",
              "Muhteşem gol! {att} stadyumu ayağa kaldırdı. {hs}-{as}",
            ],
            {
              att: actor.name,
              home: home.team.name,
              away: away.team.name,
              hs: String(homeScore),
              as: String(awayScore),
            },
            rand,
          ),
          towardGoal,
          side,
          actor,
        );
        return;
      }
      const onTarget = rand() < 0.52 + xg;
      if (onTarget) {
        if (homeHas) sheet.shotsOn[0] += 1;
        else sheet.shotsOn[1] += 1;
        addC(keeper.id, 3);
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
    };

    const roll = rand();
    if (roll < 0.1) {
      push(
        minute,
        EVENT.FOUL,
        line(
          ["{def} {att} oyuncusunu düşürdü. Serbest vuruş.", "Faul! {att} yerde kaldı, {def} itiraz ediyor."],
          { att: actor.name, def: marker.name },
          rand,
        ),
        jitter(rand, from, 8),
        side,
        actor,
      );
      if (rand() < 0.18) {
        push(
          minute,
          EVENT.CARD,
          `${marker.name} sarı kart gördü.`,
          jitter(rand, from, 4),
          side === "home" ? "away" : "home",
          marker,
        );
      }
      return;
    }
    if (roll < 0.16) {
      push(
        minute,
        EVENT.OFFSIDE,
        line(["{att} ofsayta yakalandı.", "Bayrak havada! {att} ofsayt."], { att: actor.name }, rand),
        jitter(rand, box, 10),
        side,
        actor,
      );
      return;
    }
    if (roll < 0.62) {
      const dest = safePick(rand, att.starters, att.starters, (p) => (role(p, att.team.formation) === "FV" ? 3 : 1));
      push(
        minute,
        EVENT.PASS,
        line(
          [
            "{a} topu {b} ile buluşturdu.",
            "Güzel kombinasyon: {a} → {b}.",
            "{a} kanattan içeri çeviriyor, {b} karşılıyor.",
            "{home} tempoyu yükseltiyor, {a} yönlendiriyor.",
          ],
          { a: actor.name, b: dest.name, home: att.team.name },
          rand,
        ),
        jitter(rand, lerp(from, slotPos(att.team.formation, dest.slotKey, homeHas), 0.7)),
        side,
        actor,
      );
      return;
    }
    if (roll < 0.72) {
      addC(actor.id, 1);
      push(
        minute,
        EVENT.CHANCE,
        line(
          [
            "{att} ceza sahasına süzüldü!",
            "Tehlikeli an! {att} kaleye yaklaşıyor.",
            "{att} savunmayı geçti, şimdi ne yapacak?",
            "Orta açıldı, {att} kafa vuruşuna hazırlanıyor.",
          ],
          { att: actor.name },
          rand,
        ),
        jitter(rand, box, 8),
        side,
        actor,
      );
      if (rand() < 0.42 * attP.tempo) resolveShot(true);
      return;
    }
    if (roll < 0.8) {
      push(
        minute,
        EVENT.CORNER,
        `${actor.name} korner kazandırdı. ${att.team.name} baskı kuruyor.`,
        homeHas ? { x: 98, y: rand() < 0.5 ? 8 : 92 } : { x: 2, y: rand() < 0.5 ? 8 : 92 },
        side,
        actor,
      );
      if (rand() < 0.28) resolveShot(true);
      return;
    }

    resolveShot(rand() < 0.45);
  };

  push(1, EVENT.KICKOFF, `Hakem düdüğü çaldı! ${home.team.name} — ${away.team.name} karşılaşması başladı.`, { x: 50, y: 50 }, "neutral");

  for (let minute = 2; minute <= 89; minute++) {
    if (minute === 45) {
      push(
        45,
        EVENT.WHISTLE,
        `İlk yarı sona erdi. Skor ${home.team.name} ${homeScore} - ${awayScore} ${away.team.name}`,
        { x: 50, y: 50 },
        "neutral",
      );
      continue;
    }
    playMinute(minute);
  }

  push(
    90,
    EVENT.WHISTLE,
    `Maç sona erdi! ${home.team.name} ${homeScore} - ${awayScore} ${away.team.name}`,
    { x: 50, y: 50 },
    "neutral",
  );

  const scoreOf = (p: SimPlayer, formation: Formation) =>
    (contrib.get(p.id) ?? 0) + playerLive(p, formation).rawAttack / 18;
  const homeBest = [...home.starters].sort((a, b) => scoreOf(b, home.team.formation) - scoreOf(a, home.team.formation))[0];
  const awayBest = [...away.starters].sort((a, b) => scoreOf(b, away.team.formation) - scoreOf(a, away.team.formation))[0];
  const motmSide: "home" | "away" =
    homeScore > awayScore
      ? "home"
      : awayScore > homeScore
        ? "away"
        : homeBest && awayBest && scoreOf(homeBest, home.team.formation) >= scoreOf(awayBest, away.team.formation)
          ? "home"
          : "away";
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
    sheet: {
      ...sheet,
      xg: [Math.round(sheet.xg[0] * 10) / 10, Math.round(sheet.xg[1] * 10) / 10],
    },
  };
}

/** Bot-bot maçları için hızlı skor; tam anlatım yok. */
export function simulateScoreOnly(
  home: SimSide,
  away: SimSide,
  week: number,
  seed = Date.now(),
): MatchSimulationResult {
  const rand = seededRandom(seed >>> 0);
  const hp = teamProfile(home.team, home.starters, true, away.team.tactics);
  const ap = teamProfile(away.team, away.starters, false, home.team.tactics);
  const xg = expectedGoals(hp, ap);
  let homeScore = poisson(rand, xg.home);
  let awayScore = poisson(rand, xg.away);
  const match: Match = {
    id: uid("match"),
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
    logs: [],
    timeline: [
      {
        minute: 90,
        second: 0,
        eventType: "whistle",
        description: `Maç sona erdi! ${home.team.name} ${homeScore} - ${awayScore} ${away.team.name}`,
        ball: { x: 50, y: 50 },
        team: "neutral",
        score: [homeScore, awayScore],
      },
    ],
    sheet: {
      xg: [Math.round(xg.home * 10) / 10, Math.round(xg.away * 10) / 10],
      shots: [0, 0],
      shotsOn: [0, 0],
      possession: [
        Math.round(possessionShare(hp, ap) * 100),
        Math.round((1 - possessionShare(hp, ap)) * 100),
      ],
    },
  };
}

export function buildSimSide(team: Team, roster: Array<TeamPlayer & { player: Player }>): SimSide {
  const chosen = [...roster.filter((r) => r.is_starter), ...roster.filter((r) => !r.is_starter)].slice(0, 11);
  const starters = chosen.map((r) => {
    const slotKey = r.squad_position || "gk";
    const slot = FORMATION_SLOTS[team.formation].find((s) => s.key === slotKey);
    const position = r.player.versatile && slot ? slot.position : r.player.position;
    return {
      ...r.player,
      position,
      energy: r.energy,
      form: r.form,
      slotKey,
    };
  });
  return { team, starters };
}
