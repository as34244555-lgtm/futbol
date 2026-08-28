import { createUserTeam, ensureHumanMatchmaking, generateWeekFixtures, leagueTeams } from "../lib/world";
import { createFreshWorld } from "../lib/world";
import { playUserMatch, prepareWeek } from "../lib/season";
import { SYSTEM_TEAM_ID } from "../lib/types";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function opponentOf(world: ReturnType<typeof createFreshWorld>, teamId: string) {
  const fx = world.matches.find(
    (m) => m.week === world.week && m.status === "pending" && (m.home_team_id === teamId || m.away_team_id === teamId),
  );
  assert(fx, `no pending fixture for ${teamId}`);
  return fx.home_team_id === teamId ? fx.away_team_id : fx.home_team_id;
}

const world0 = createFreshWorld();
const bots = leagueTeams(world0).filter((t) => !t.user_id);
assert(bots.length >= 18, `expected 18 bots, got ${bots.length}`);
assert(!world0.teams.some((t) => t.id === SYSTEM_TEAM_ID && t.user_id), "agency is not a bot manager");

const perClub = bots.map(
  (c) => world0.listings.filter((l) => l.seller_team_id === c.id && l.status === "active").length,
);
assert(
  perClub.every((n) => n >= 6),
  `bot listings too low: ${perClub.join(",")}`,
);

const a = createUserTeam(world0, "user-a", "Ada SK");
let world = { ...a.world, matches: generateWeekFixtures(a.world) };
const oppA = opponentOf(world, a.team.id);
const oppATeam = world.teams.find((t) => t.id === oppA);
assert(oppATeam && !oppATeam.user_id, "solo human should play a bot");

const b = createUserTeam(world, "user-b", "Pera FC");
world = ensureHumanMatchmaking(b.world);
const oppAB = opponentOf(world, a.team.id);
const oppBA = opponentOf(world, b.team.id);
assert(oppAB === b.team.id, `A should face B, faced ${oppAB}`);
assert(oppBA === a.team.id, `B should face A, faced ${oppBA}`);

const live = prepareWeek(b.world);
const first = playUserMatch(live, a.team.id);
assert(typeof first.result !== "string", `A should play, got ${first.result}`);
assert(first.world.week === live.week, `week must stay ${live.week} until B watches, got ${first.world.week}`);
const fxAfterA = first.world.matches.find(
  (m) => m.status === "completed" && (m.home_team_id === a.team.id || m.away_team_id === a.team.id),
);
assert(fxAfterA, "A vs B must be completed after first click");
const second = playUserMatch(first.world, b.team.id, { [a.team.id]: first.result, [fxAfterA.id]: first.result });
assert(typeof second.result !== "string", `B should watch same match, got ${second.result}`);
assert(second.result.match.home_score === first.result.match.home_score, "home score must match");
assert(second.result.match.away_score === first.result.match.away_score, "away score must match");
assert(second.world.week === live.week + 1, `week advances after both watch, got ${second.world.week}`);

console.log(
  JSON.stringify({
    bots: bots.length,
    botListings: perClub.reduce((s, n) => s + n, 0),
    agencyListings: world0.listings.filter((l) => l.seller_team_id === SYSTEM_TEAM_ID && l.status === "active").length,
    soloVsBot: oppATeam?.name,
    humanPair: `${a.team.name} vs ${b.team.name}`,
    ok: true,
  }),
);
