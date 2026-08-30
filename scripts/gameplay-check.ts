import { buildSimSide, simulateMatch } from "../lib/match-engine";
import { marketValue, positionFit } from "../lib/ratings";
import { playUserMatch, prepareWeek } from "../lib/season";
import { applyMatchResult, createFreshWorld, createUserTeam, generateWeekFixtures, leagueTeams, rosterOf } from "../lib/world";
import { densifyTimeline } from "../lib/match-playback";
import { listingId } from "../lib/utils";
import { SYSTEM_TEAM_ID } from "../lib/types";
import { packLeague, unpackLeague } from "../lib/server/remote-kv";
import { CHAMPION_PRIZE, crownSeason, recentForm, seasonOf, weekInSeason } from "../lib/titles";

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

const abdullah = joined.world.players.find((p) => p.name === "Abdullah Sarıyıldız");
assert(abdullah, "Abdullah Sarıyıldız must exist in catalog");
assert(abdullah!.overall === 999, `Abdullah overall should be 999, got ${abdullah!.overall}`);
assert(abdullah!.base_value === 100_000, `Abdullah value should be 100000, got ${abdullah!.base_value}`);
assert(abdullah!.nationality_code === "tr", "Abdullah must be Turkish");
assert(abdullah!.versatile, "Abdullah must play every position");
assert(
  joined.world.teamPlayers.some((tp) => tp.team_id === joined.team.id && tp.player_id === abdullah!.id),
  "new human squad should receive Abdullah",
);
const abdullahStart = joined.world.teamPlayers.find(
  (tp) => tp.team_id === joined.team.id && tp.player_id === abdullah!.id,
);
assert(abdullahStart?.is_starter, "999 overall should start");
assert(abdullahStart?.squad_position === "st", `Abdullah should start at ST, got ${abdullahStart?.squad_position}`);

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
assert(avgGoals >= 1.2, `expected live xG scores, got avg ${avgGoals.toFixed(2)}`);
const withSheet = simulateMatch(homeSide, awaySide, 1, 4242);
assert(withSheet.sheet, "match sheet (xG) required");
assert(withSheet.sheet!.possession[0] + withSheet.sheet!.possession[1] === 100, "possession must sum 100");
assert(withSheet.ratings && withSheet.ratings.length >= 20, "both XIs should have match ratings");
assert(
  withSheet.ratings!.every((r) => r.rating >= 4.5 && r.rating <= 10),
  "ratings must stay in 4.5–10",
);
assert(withSheet.motm && withSheet.ratings!.some((r) => r.playerId === withSheet.motm!.playerId), "MOTM rated");

const boosted = {
  ...homeSide,
  starters: homeSide.starters.map((p) => ({ ...p, attack: 99, defense: 90, energy: 100, form: 95 })),
};
const weak = {
  ...awaySide,
  starters: awaySide.starters.map((p) => ({ ...p, attack: 40, defense: 40, energy: 55, form: 45 })),
};
let strongGoals = 0;
let weakGoals = 0;
for (let i = 0; i < 12; i++) {
  const s = simulateMatch(boosted, weak, 1, 5000 + i * 11);
  strongGoals += s.match.home_score;
  weakGoals += s.match.away_score;
}
assert(strongGoals > weakGoals, `stronger XI should score more (${strongGoals} vs ${weakGoals})`);
assert(positionFit("FV", "KL") < 0.6, "striker in goal is a bad fit");
assert(positionFit("OS", "FV") > positionFit("KL", "FV"), "adjacent roles beat opposite roles");
const star = joined.world.players.find((p) => p.name === "Erlung Haland")!;
assert(marketValue(star, 95) > marketValue(star, 40), "hot form raises market value");

const dense = densifyTimeline(
  {
    match: { id: "m", home_team_id: "h", away_team_id: "a", home_score: 2, away_score: 1, status: "completed", played_at: "", week: 1 },
    logs: [],
    timeline: [
      { minute: 1, second: 0, eventType: "kickoff", description: "başla", ball: { x: 50, y: 50 }, team: "neutral", score: [0, 0] },
      { minute: 90, second: 0, eventType: "whistle", description: "bitti", ball: { x: 50, y: 50 }, team: "neutral", score: [2, 1] },
    ],
  },
  "Ev",
  "Dep",
);
assert(dense.length === 90, `densify should be 90 minutes, got ${dense.length}`);
assert(dense.some((e) => e.minute === 44 && e.description.length > 8), "filler commentary missing");
assert(dense[dense.length - 1]!.score[0] === 2, "final score kept");

const fresh = createUserTeam(createFreshWorld(), "user-reward", "Reward FC");
const oppTeam = leagueTeams(fresh.world).find((t) => !t.user_id)!;
const rewarded = applyMatchResult(fresh.world, fresh.team.id, oppTeam.id, 3, 1);
const meAfter = rewarded.teams.find((t) => t.id === fresh.team.id)!;
assert(meAfter.points === 3, `win should give 3 points, got ${meAfter.points}`);
assert(meAfter.coins > fresh.team.coins, "win should add coins");
assert(meAfter.played === 1 && meAfter.won === 1, "win should count on the table");

const packed = packLeague({ version: 3, world: rewarded, accounts: [], lastSim: {}, lastSeen: {} });
const unpacked = unpackLeague(packed);
assert(unpacked.version === 3, "kv pack roundtrip version");
assert(unpacked.world.teams.find((t) => t.id === fresh.team.id)?.coins === meAfter.coins, "kv pack keeps coins");

const cheap = fresh.world.listings
  .filter((l) => l.status === "active" && l.seller_team_id !== fresh.team.id)
  .sort((a, b) => a.price - b.price)[0];
assert(cheap, "market should have listings");
assert(cheap.price < fresh.team.coins, "starter budget should buy a cheap listing");
const played = playUserMatch(prepareWeek(fresh.world), fresh.team.id);
assert(typeof played.result !== "string", `human match should simulate, got ${played.result}`);
const afterPlay = played.world.teams.find((t) => t.id === fresh.team.id)!;
assert(afterPlay.played === 1, "playing a match should increment played");
assert(afterPlay.coins !== fresh.team.coins, "match reward should change coins");
const formAfter = recentForm(played.world, fresh.team.id);
assert(formAfter.length === 1, `form should have one result, got ${formAfter.join("")}`);
assert(["G", "B", "M"].includes(formAfter[0]!), "form letter must be G/B/M");

assert(seasonOf(1) === 1 && weekInSeason(1) === 1, "week 1 is season 1 week 1");
assert(seasonOf(18) === 1 && weekInSeason(18) === 18, "week 18 is last of season 1");
assert(seasonOf(19) === 2 && weekInSeason(19) === 1, "week 19 starts season 2");

const beforeCrown = {
  ...joined.world,
  week: 19,
  season: 1,
  teams: joined.world.teams.map((t) =>
    t.id === joined.team.id
      ? { ...t, points: 44, played: 18, won: 14, drawn: 2, lost: 2, goals_for: 40, goals_against: 12, coins: 15_000, titles: 0 }
      : t.id === SYSTEM_TEAM_ID
        ? t
        : { ...t, points: 10, played: 18, won: 2, drawn: 4, lost: 12, titles: 0 },
  ),
};
const crowned = crownSeason(beforeCrown);
assert(crowned.lastTitle?.teamId === joined.team.id, "human with most points is champion");
assert(crowned.lastTitle?.season === 1, "crowned season 1");
assert(crowned.season === 2, `new season should be 2, got ${crowned.season}`);
const champTeam = crowned.teams.find((t) => t.id === joined.team.id)!;
assert(champTeam.titles === 1, "champion gets a title");
assert(champTeam.points === 0 && champTeam.played === 0, "table resets for new season");
assert(champTeam.coins === 15_000 + CHAMPION_PRIZE, `champion prize ${CHAMPION_PRIZE}`);
const againCrown = crownSeason(crowned);
assert((againCrown.titles ?? []).length === 1, "crowning is idempotent");
assert(againCrown.teams.find((t) => t.id === joined.team.id)?.titles === 1, "titles not doubled");

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
