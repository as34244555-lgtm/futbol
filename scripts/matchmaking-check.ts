import { createUserTeam, ensureHumanMatchmaking, generateWeekFixtures, leagueTeams } from "../lib/world";
import { createFreshWorld } from "../lib/world";
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
