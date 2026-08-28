import { hashPassword, verifyPassword, type SessionPayload } from "./auth";
import { currentRoom, mutateLeague, persistenceMode, readLeague } from "./store";
import { playUserMatch, prepareWeek } from "@/lib/season";
import type {
  Formation,
  LeagueDocument,
  ManagerInfo,
  MatchSimulationResult,
  Player,
  Tactic,
} from "@/lib/types";
import { ONLINE_MS, SYSTEM_TEAM_ID } from "@/lib/types";
import { botManagerName } from "@/lib/catalog";
import { autoSelectStarters, createUserTeam, leagueTeams } from "@/lib/world";
import { listingId, rowId, uid } from "@/lib/utils";

export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
  }
}

export function publicManagers(doc: LeagueDocument): ManagerInfo[] {
  const now = Date.now();
  const humans: ManagerInfo[] = doc.accounts.map((a) => {
    const team = doc.world.teams.find((t) => t.user_id === a.id);
    const seen = doc.lastSeen[a.id] ?? null;
    return {
      userId: a.id,
      username: a.username,
      teamId: team?.id ?? "",
      teamName: team?.name ?? "—",
      lastSeen: seen,
      online: Boolean(seen && now - new Date(seen).getTime() < ONLINE_MS),
      kind: "human" as const,
    };
  });
  const claimed = new Set(humans.map((h) => h.teamId));
  const bots: ManagerInfo[] = leagueTeams(doc.world)
    .filter((t) => !t.user_id && !claimed.has(t.id))
    .map((t) => ({
      userId: `bot:${t.id}`,
      username: botManagerName(t.name),
      teamId: t.id,
      teamName: t.name,
      lastSeen: new Date().toISOString(),
      online: true,
      kind: "bot" as const,
    }));
  return [...humans, ...bots];
}

export function snapshot(doc: LeagueDocument, userId: string) {
  const team = doc.world.teams.find((t) => t.user_id === userId) ?? null;
  const account = doc.accounts.find((a) => a.id === userId) ?? null;
  return {
    world: doc.world,
    me: account && team ? { id: account.id, username: account.username, teamId: team.id, roomCode: currentRoom() } : null,
    lastSim: team ? (doc.lastSim[team.id] ?? null) : null,
    managers: publicManagers(doc),
    backend: persistenceMode(),
    humans: leagueTeams(doc.world).filter((t) => t.user_id).length,
    bots: leagueTeams(doc.world).filter((t) => !t.user_id).length,
    roomCode: currentRoom(),
  };
}

export async function registerManager(username: string, password: string, teamName: string) {
  const u = username.trim();
  const t = teamName.trim();
  if (u.length < 2) throw new ActionError("Menajer adı çok kısa.");
  if (t.length < 2) throw new ActionError("Takım adı çok kısa.");
  if (password.length < 4) throw new ActionError("Şifre en az 4 karakter olmalı.");

  return mutateLeague((doc) => {
    if (doc.accounts.some((a) => a.username.toLowerCase() === u.toLowerCase())) {
      throw new ActionError("Bu menajer adı alınmış.");
    }
    if (doc.world.teams.some((x) => x.name.toLowerCase() === t.toLowerCase())) {
      throw new ActionError("Bu kulüp adı alınmış.");
    }
    const account = {
      id: uid("user"),
      username: u,
      passwordHash: hashPassword(password),
      created_at: new Date().toISOString(),
    };
    const joined = createUserTeam(doc.world, account.id, t);
    const world = prepareWeek(joined.world);
    const next: LeagueDocument = {
      ...doc,
      accounts: [...doc.accounts, account],
      world,
      lastSeen: { ...doc.lastSeen, [account.id]: new Date().toISOString() },
    };
    return {
      doc: next,
      result: { userId: account.id, username: u, teamId: joined.team.id, teamName: joined.team.name },
    };
  });
}

export async function loginManager(username: string, password: string) {
  const doc = await readLeague();
  const account = doc.accounts.find((a) => a.username.toLowerCase() === username.trim().toLowerCase());
  if (!account || !verifyPassword(password, account.passwordHash)) {
    throw new ActionError("Menajer adı veya şifre hatalı.");
  }
  const team = doc.world.teams.find((t) => t.user_id === account.id);
  if (!team) throw new ActionError("Takım bulunamadı.");
  await mutateLeague((d) => ({
    doc: { ...d, lastSeen: { ...d.lastSeen, [account.id]: new Date().toISOString() } },
    result: true,
  }));
  return { userId: account.id, username: account.username, teamId: team.id, teamName: team.name };
}

function teamOf(doc: LeagueDocument, userId: string) {
  const team = doc.world.teams.find((t) => t.user_id === userId);
  if (!team) throw new ActionError("Takım yok.");
  return team;
}

type SessionHint = SessionPayload;

/** Vercel bellek modunda soğuk başlangıçta oturumdaki menajeri lige geri yazar. */
export function withSessionUser(doc: LeagueDocument, session: SessionHint): LeagueDocument {
  if (doc.world.teams.some((t) => t.user_id === session.sub)) return doc;
  const base = (session.teamName?.trim() || `${session.name} SK`).slice(0, 32);
  let name = base;
  let n = 2;
  while (doc.world.teams.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
    name = `${base} ${n++}`;
  }
  let username = session.name;
  let u = 2;
  while (doc.accounts.some((a) => a.username.toLowerCase() === username.toLowerCase())) {
    username = `${session.name}${u++}`;
  }
  const account = {
    id: session.sub,
    username,
    passwordHash: "session-restore",
    created_at: new Date().toISOString(),
  };
  const joined = createUserTeam(doc.world, account.id, name);
  const world = prepareWeek(joined.world);
  return {
    ...doc,
    accounts: [...doc.accounts, account],
    world,
    lastSeen: { ...doc.lastSeen, [account.id]: new Date().toISOString() },
  };
}

export async function ping(session: SessionHint) {
  return mutateLeague((doc) => {
    const ready = withSessionUser(doc, session);
    const next = { ...ready, lastSeen: { ...ready.lastSeen, [session.sub]: new Date().toISOString() } };
    return { doc: next, result: snapshot(next, session.sub) };
  });
}

export async function setFormation(session: SessionHint, formation: Formation) {
  return mutateLeague((doc) => {
    doc = withSessionUser(doc, session);
    const team = teamOf(doc, session.sub);
    const roster = doc.world.teamPlayers.filter((tp) => tp.team_id === team.id);
    const others = doc.world.teamPlayers.filter((tp) => tp.team_id !== team.id);
    const filled = autoSelectStarters(roster, doc.world.players, formation);
    const world = {
      ...doc.world,
      teams: doc.world.teams.map((t) => (t.id === team.id ? { ...t, formation } : t)),
      teamPlayers: [...others, ...filled],
    };
    const next = { ...doc, world };
    return { doc: next, result: snapshot(next, session.sub) };
  });
}

export async function setTactics(session: SessionHint, tactics: Tactic) {
  return mutateLeague((doc) => {
    doc = withSessionUser(doc, session);
    const team = teamOf(doc, session.sub);
    const world = {
      ...doc.world,
      teams: doc.world.teams.map((t) => (t.id === team.id ? { ...t, tactics } : t)),
    };
    const next = { ...doc, world };
    return { doc: next, result: snapshot(next, session.sub) };
  });
}

export async function assignSlot(session: SessionHint, slotKey: string, teamPlayerId: string) {
  return mutateLeague((doc) => {
    doc = withSessionUser(doc, session);
    const team = teamOf(doc, session.sub);
    const world = {
      ...doc.world,
      teamPlayers: doc.world.teamPlayers.map((tp) => {
        if (tp.team_id !== team.id) return tp;
        if (tp.squad_position === slotKey) return { ...tp, is_starter: false, squad_position: null };
        if (tp.id === teamPlayerId) return { ...tp, is_starter: true, squad_position: slotKey };
        return tp;
      }),
    };
    const next = { ...doc, world };
    return { doc: next, result: snapshot(next, session.sub) };
  });
}

export async function autoPick(session: SessionHint) {
  return mutateLeague((doc) => {
    doc = withSessionUser(doc, session);
    const team = teamOf(doc, session.sub);
    const roster = doc.world.teamPlayers.filter((tp) => tp.team_id === team.id);
    const others = doc.world.teamPlayers.filter((tp) => tp.team_id !== team.id);
    const world = {
      ...doc.world,
      teamPlayers: [...others, ...autoSelectStarters(roster, doc.world.players, team.formation)],
    };
    const next = { ...doc, world };
    return { doc: next, result: snapshot(next, session.sub) };
  });
}

export async function listForSale(session: SessionHint, teamPlayerId: string, price: number) {
  if (price <= 0) throw new ActionError("Fiyat 0'dan büyük olmalı.");
  return mutateLeague((doc) => {
    doc = withSessionUser(doc, session);
    const team = teamOf(doc, session.sub);
    const tp = doc.world.teamPlayers.find((x) => x.id === teamPlayerId);
    if (!tp || tp.team_id !== team.id) throw new ActionError("Oyuncu kadronuzda değil.");
    if (doc.world.listings.some((l) => l.team_player_id === teamPlayerId && l.status === "active")) {
      throw new ActionError("Bu oyuncu zaten listelenmiş.");
    }
    const unseated = doc.world.teamPlayers.map((row) =>
      row.id === tp.id ? { ...row, is_starter: false, squad_position: null } : row,
    );
    const roster = unseated.filter((row) => row.team_id === team.id);
    const others = unseated.filter((row) => row.team_id !== team.id);
    const filled = autoSelectStarters(roster, doc.world.players, team.formation);
    const world = {
      ...doc.world,
      teamPlayers: [...others, ...filled],
      listings: [
        ...doc.world.listings,
        {
          id: listingId(team.id, tp.player_id),
          team_player_id: teamPlayerId,
          seller_team_id: team.id,
          price: Math.round(price),
          status: "active" as const,
          created_at: new Date().toISOString(),
        },
      ],
    };
    const next = { ...doc, world };
    return { doc: next, result: snapshot(next, session.sub) };
  });
}

export async function cancelListing(session: SessionHint, listingIdArg: string) {
  return mutateLeague((doc) => {
    doc = withSessionUser(doc, session);
    const team = teamOf(doc, session.sub);
    const world = {
      ...doc.world,
      listings: doc.world.listings.map((l) =>
        l.id === listingIdArg && l.seller_team_id === team.id && l.status === "active"
          ? { ...l, status: "cancelled" as const }
          : l,
      ),
    };
    const next = { ...doc, world };
    return { doc: next, result: snapshot(next, session.sub) };
  });
}

export type BuyPayload = {
  listingId: string;
  teamPlayerId?: string;
  playerId?: string;
  sellerTeamId?: string;
  price?: number;
};

export async function buyListing(session: SessionHint, payload: string | BuyPayload) {
  const input: BuyPayload = typeof payload === "string" ? { listingId: payload } : payload;
  return mutateLeague((doc) => {
    doc = withSessionUser(doc, session);
    const team = teamOf(doc, session.sub);
    const active = doc.world.listings.filter((l) => l.status === "active");
    let listing = active.find((l) => l.id === input.listingId);
    if (!listing && input.teamPlayerId) {
      listing = active.find((l) => l.team_player_id === input.teamPlayerId);
    }
    if (!listing && input.playerId) {
      listing = active.find((l) => {
        const row = doc.world.teamPlayers.find((x) => x.id === l.team_player_id);
        return row?.player_id === input.playerId;
      });
    }
    if (!listing && input.sellerTeamId && input.playerId) {
      listing = active.find((l) => {
        if (l.seller_team_id !== input.sellerTeamId) return false;
        const row = doc.world.teamPlayers.find((x) => x.id === l.team_player_id);
        return row?.player_id === input.playerId;
      });
    }

    let tp = listing ? doc.world.teamPlayers.find((x) => x.id === listing!.team_player_id) : undefined;
    if (!tp && input.playerId) {
      tp = doc.world.teamPlayers.find((x) => x.player_id === input.playerId);
    }
    if (!tp) throw new ActionError("Oyuncu kaydı yok.");
    if (tp.team_id === team.id) throw new ActionError("Bu oyuncu zaten kadronuzda.");

    const price = Math.round(listing?.price ?? input.price ?? 0);
    if (price <= 0) throw new ActionError("İlan bulunamadı.");
    const sellerId = listing?.seller_team_id ?? tp.team_id;
    if (sellerId === team.id) throw new ActionError("Kendi ilanınızı satın alamazsınız.");
    if (team.coins < price) throw new ActionError("Yetersiz bütçe.");
    const squadSize = doc.world.teamPlayers.filter((x) => x.team_id === team.id).length;
    if (squadSize >= 28) throw new ActionError("Kadro dolu (maks. 28).");

    const soldId = listing?.id;
    const world = {
      ...doc.world,
      teams: doc.world.teams.map((t) => {
        if (t.id === team.id) return { ...t, coins: t.coins - price };
        if (t.id === sellerId && t.id !== SYSTEM_TEAM_ID) return { ...t, coins: t.coins + price };
        return t;
      }),
      teamPlayers: doc.world.teamPlayers.map((row) =>
        row.id === tp!.id
          ? {
              ...row,
              id: rowId(team.id, row.player_id),
              team_id: team.id,
              is_starter: false,
              squad_position: null,
              acquired_at: new Date().toISOString(),
            }
          : row,
      ),
      listings: doc.world.listings.map((l) => {
        const row = doc.world.teamPlayers.find((x) => x.id === l.team_player_id);
        const samePlayer = row?.player_id === tp!.player_id;
        if (l.status === "active" && (l.id === soldId || samePlayer)) return { ...l, status: "sold" as const };
        return l;
      }),
    };
    const next = { ...doc, world };
    return { doc: next, result: snapshot(next, session.sub) };
  });
}

export async function ensureFixtures(session: SessionHint) {
  return mutateLeague((doc) => {
    doc = withSessionUser(doc, session);
    teamOf(doc, session.sub);
    const world = prepareWeek(doc.world);
    const next = { ...doc, world };
    return { doc: next, result: snapshot(next, session.sub) };
  });
}

export async function playMatch(session: SessionHint) {
  return mutateLeague((doc) => {
    doc = withSessionUser(doc, session);
    const team = teamOf(doc, session.sub);
    const out = playUserMatch(doc.world, team.id);
    const lastSim = { ...doc.lastSim };
    if (typeof out.result !== "string") {
      lastSim[team.id] = { ...out.result, logs: [] };
      if (out.result.match.home_team_id) lastSim[out.result.match.home_team_id] = lastSim[team.id]!;
      if (out.result.match.away_team_id) lastSim[out.result.match.away_team_id] = lastSim[team.id]!;
    }
    const next: LeagueDocument = {
      ...doc,
      world: out.world,
      lastSim,
      lastSeen: { ...doc.lastSeen, [session.sub]: new Date().toISOString() },
    };
    return {
      doc: next,
      result: { snap: snapshot(next, session.sub), match: typeof out.result === "string" ? null : out.result, error: typeof out.result === "string" ? out.result : null },
    };
  });
}

export async function importPlayers(session: SessionHint, players: Player[], mode: "merge" | "replace") {
  return mutateLeague((doc) => {
    doc = withSessionUser(doc, session);
    teamOf(doc, session.sub);
    if (mode === "replace") {
      const next = { ...doc, world: { ...doc.world, players } };
      return { doc: next, result: snapshot(next, session.sub) };
    }
    const names = new Set(doc.world.players.map((p) => p.name.toLowerCase()));
    const extra = players.filter((p) => !names.has(p.name.toLowerCase()));
    const agencyRows = extra.map((p) => ({
      id: rowId(SYSTEM_TEAM_ID, p.id),
      team_id: SYSTEM_TEAM_ID,
      player_id: p.id,
      energy: 100,
      form: 80,
      is_starter: false,
      squad_position: null,
      acquired_at: new Date().toISOString(),
    }));
    const listings = agencyRows.map((r) => {
      const p = extra.find((x) => x.id === r.player_id)!;
      return {
        id: listingId(SYSTEM_TEAM_ID, p.id),
        team_player_id: r.id,
        seller_team_id: SYSTEM_TEAM_ID,
        price: p.base_value,
        status: "active" as const,
        created_at: new Date().toISOString(),
      };
    });
    const world = {
      ...doc.world,
      players: [...doc.world.players, ...extra],
      teamPlayers: [...doc.world.teamPlayers, ...agencyRows],
      listings: [...doc.world.listings, ...listings],
    };
    const next = { ...doc, world };
    return { doc: next, result: snapshot(next, session.sub) };
  });
}

export async function getSnapshot(userId: string | null) {
  const doc = await readLeague();
  if (!userId) {
    return {
      world: doc.world,
      me: null,
      lastSim: null as MatchSimulationResult | null,
      managers: publicManagers(doc),
      backend: persistenceMode(),
      humans: leagueTeams(doc.world).filter((t) => t.user_id).length,
      bots: leagueTeams(doc.world).filter((t) => !t.user_id).length,
      roomCode: currentRoom(),
    };
  }
  return snapshot(doc, userId);
}
