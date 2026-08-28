import { buildSimSide, simulateMatch } from "../lib/match-engine";
import { prepareWeek } from "../lib/season";
import { createFreshWorld, createUserTeam, generateWeekFixtures, leagueTeams, rosterOf } from "../lib/world";
import { listingId } from "../lib/utils";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const world0 = createFreshWorld();
const world1 = createFreshWorld();
const ids0 = world0.listings.filter((l) => l.status === "active").map((l) => l.id).sort();
const ids1 = world1.listings.filter((l) => l.status === "active").map((l) => l.id).sort();
assert(ids0.length > 20, "expected many listings");
assert(ids0.join() === ids1.join(), "listing ids must be deterministic across worlds");
assert(
  ids0.every((id) => id.startsWith("tm_")),
  "listing ids should be stable listingId() values",
);

const joined = createUserTeam(world0, "user-a", "Ada SK");
assert(joined.team.id === "team_user-a", `expected humanTeamId, got ${joined.team.id}`);
const again = createUserTeam(joined.world, "user-a", "Ada SK");
assert(again.team.id === joined.team.id, "same user should reuse team");

const sample = world0.listings.find((l) => l.status === "active")!;
const seller = world0.teams.find((t) => t.id === sample.seller_team_id)!;
const tp = world0.teamPlayers.find((r) => r.id === sample.team_player_id)!;
assert(sample.id === listingId(seller.id, tp.player_id), "listing id formula");

const bots = leagueTeams(joined.world).filter((t) => !t.user_id);
let weekWorld = { ...joined.world, matches: generateWeekFixtures(joined.world) };
weekWorld = prepareWeek(weekWorld);
const week1 = weekWorld.matches.filter((m) => m.week === weekWorld.week || m.week === 1);
const botDone = weekWorld.matches.filter((m) => {
  const home = weekWorld.teams.find((t) => t.id === m.home_team_id);
  const away = weekWorld.teams.find((t) => t.id === m.away_team_id);
  return m.status === "completed" && home && away && !home.user_id && !away.user_id;
});
assert(botDone.length >= 8, `bots should finish same week, got ${botDone.length}`);
assert(
  botDone.some((m) => m.home_score + m.away_score > 0),
  "bot matches should produce scores",
);
const humanPending = weekWorld.matches.filter(
  (m) =>
    m.status === "pending" &&
    (m.home_team_id === joined.team.id || m.away_team_id === joined.team.id),
);
assert(humanPending.length === 1, "human match should stay pending");

const home = bots[0]!;
const away = bots[1]!;
const homeSide = buildSimSide(home, rosterOf(world0, home.id));
const awaySide = buildSimSide(away, rosterOf(world0, away.id));
let totalGoals = 0;
let minEvents = Infinity;
for (let i = 0; i < 16; i++) {
  const sim = simulateMatch(homeSide, awaySide, 1, 1000 + i * 97);
  totalGoals += sim.match.home_score + sim.match.away_score;
  minEvents = Math.min(minEvents, sim.timeline.length);
  assert(sim.timeline.length >= 80, `timeline too short: ${sim.timeline.length}`);
  assert(
    sim.timeline.some((e) => e.eventType === "goal") || sim.match.home_score + sim.match.away_score === 0,
    "goals should appear on the timeline",
  );
  const last = sim.timeline[sim.timeline.length - 1]!;
  assert(last.score[0] === sim.match.home_score && last.score[1] === sim.match.away_score, "final score mismatch");
}
const avgGoals = totalGoals / 16;
assert(avgGoals >= 1.5, `expected ~2-4 goals, got avg ${avgGoals.toFixed(2)}`);

console.log(
  JSON.stringify({
    listings: ids0.length,
    botResults: botDone.length,
    sampleScore: `${botDone[0]?.home_score}-${botDone[0]?.away_score}`,
    timelineMin: minEvents,
    avgGoals: Number(avgGoals.toFixed(2)),
    weekMatches: week1.length,
    ok: true,
  }),
);
