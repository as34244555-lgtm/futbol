import { ABDULLAH_ID, generatePlayerAt, isLegend, makeAbdullah } from "./catalog";
import { marketValue } from "./ratings";
import { POSITIONS, SYSTEM_TEAM_ID } from "./types";
import type { GameWorld, Player, Position, TransferListing } from "./types";
import { catalogId, hash32, listingId, seededRandom } from "./utils";

/** Ajans stoğu KV'yi şişirmeden pazarda 1000+ oyuncu dursun. */
export const MARKET_POOL_SIZE = 1200;
export const MARKET_POOL_START = 20_000;
export const POOL_PREFIX = "tm_pool_";

const CYCLE: Position[] = [
  ...Array(8).fill("KL"),
  ...Array(14).fill("STP"),
  ...Array(8).fill("SLB"),
  ...Array(8).fill("SĞB"),
  ...Array(16).fill("MOS"),
  ...Array(12).fill("KANAT"),
  ...Array(12).fill("FV"),
];

export function isPoolListingId(id: string): boolean {
  return id.startsWith(POOL_PREFIX);
}

export function poolPlayerIdFromListing(listingIdArg: string): string | null {
  if (!isPoolListingId(listingIdArg)) return null;
  return listingIdArg.slice(POOL_PREFIX.length);
}

export function marketPoolPlayer(index: number): Player {
  const i = ((index % MARKET_POOL_SIZE) + MARKET_POOL_SIZE) % MARKET_POOL_SIZE;
  const rand = seededRandom(hash32(`liga-market-${i}`) ^ 0x9e3779b9);
  const position = CYCLE[i % CYCLE.length]!;
  return generatePlayerAt(i + 77, catalogId(MARKET_POOL_START + i + 1), rand, position);
}

export function marketPoolListingId(playerId: string): string {
  return `${POOL_PREFIX}${playerId}`;
}

export type MarketRow = {
  listing: TransferListing;
  player: Player;
  virtual: boolean;
};

function ownedIds(world: GameWorld): Set<string> {
  return new Set(
    world.teamPlayers.filter((tp) => tp.team_id !== SYSTEM_TEAM_ID).map((tp) => tp.player_id),
  );
}

export function virtualMarketRows(world: GameWorld): MarketRow[] {
  const owned = ownedIds(world);
  const worldIds = new Set(world.players.map((p) => p.id));
  const rows: MarketRow[] = [];
  for (let i = 0; i < MARKET_POOL_SIZE; i++) {
    const player = marketPoolPlayer(i);
    if (owned.has(player.id) || worldIds.has(player.id)) continue;
    const price = Math.max(220, Math.round(marketValue(player) * (0.88 + (hash32(player.id) % 28) / 100)));
    rows.push({
      player,
      virtual: true,
      listing: {
        id: marketPoolListingId(player.id),
        team_player_id: `pool_${player.id}`,
        seller_team_id: SYSTEM_TEAM_ID,
        price,
        status: "active",
        created_at: "2026-01-01T00:00:00.000Z",
      },
    });
  }
  return rows;
}

export function playerFromPoolListing(listingIdArg: string): Player | null {
  const pid = poolPlayerIdFromListing(listingIdArg);
  if (!pid) return null;
  for (let i = 0; i < MARKET_POOL_SIZE; i++) {
    const p = marketPoolPlayer(i);
    if (p.id === pid) return p;
  }
  return null;
}

export function abdullahListing(world: GameWorld): MarketRow | null {
  const owned = world.teamPlayers.some((tp) => tp.player_id === ABDULLAH_ID && tp.team_id !== SYSTEM_TEAM_ID);
  if (owned) return null;
  const player = world.players.find((p) => p.id === ABDULLAH_ID) ?? makeAbdullah();
  const existing = world.listings.find(
    (l) => l.status === "active" && world.teamPlayers.find((tp) => tp.id === l.team_player_id)?.player_id === ABDULLAH_ID,
  );
  if (existing) {
    const tp = world.teamPlayers.find((x) => x.id === existing.team_player_id);
    if (!tp) return null;
    return { listing: { ...existing, price: 100_000 }, player, virtual: false };
  }
  return {
    player,
    virtual: false,
    listing: {
      id: listingId(SYSTEM_TEAM_ID, ABDULLAH_ID),
      team_player_id: `tp_${SYSTEM_TEAM_ID}_${ABDULLAH_ID}`,
      seller_team_id: SYSTEM_TEAM_ID,
      price: 100_000,
      status: "active",
      created_at: "2026-01-01T00:00:00.000Z",
    },
  };
}

export function mergeMarket(world: GameWorld): MarketRow[] {
  const players = new Map(world.players.map((p) => [p.id, p]));
  const tps = new Map(world.teamPlayers.map((t) => [t.id, t]));
  const live: MarketRow[] = world.listings
    .filter((l) => l.status === "active")
    .map((l) => {
      const tp = tps.get(l.team_player_id);
      const player = tp ? players.get(tp.player_id) : undefined;
      if (!player || !tp) return null;
      const price = isLegend(player) ? 100_000 : l.price;
      return { listing: { ...l, price }, player, virtual: false };
    })
    .filter((x): x is MarketRow => Boolean(x));

  const liveIds = new Set(live.map((r) => r.player.id));
  const featured = abdullahListing(world);
  const extra = virtualMarketRows(world).filter((r) => !liveIds.has(r.player.id));
  const head = featured && !liveIds.has(featured.player.id) ? [featured] : [];
  return [...head, ...live, ...extra];
}

export function marketCount(world: GameWorld): number {
  return mergeMarket(world).length;
}

export function positionFilters(): Array<{ id: string; label: string }> {
  return [{ id: "ALL", label: "Tümü" }, ...POSITIONS.map((p) => ({ id: p, label: p }))];
}
