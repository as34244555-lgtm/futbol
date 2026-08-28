import { hashPassword, verifyPassword } from "./auth";
import { mutateLeague, persistenceMode, readLeague } from "./store";
import { playUserMatch } from "@/lib/season";
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
import {
  autoSelectStarters,
  createUserTeam,
  ensureBotWorld,
  ensureHumanMatchmaking,
  generateWeekFixtures,
  leagueTeams,
} from "@/lib/world";
import { uid } from "@/lib/utils";

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
    me: account && team ? { id: account.id, username: account.username, teamId: team.id } : null,
    lastSim: team ? (doc.lastSim[team.id] ?? null) : null,
    managers: publicManagers(doc),
    backend: persistenceMode(),
    humans: leagueTeams(doc.world).filter((t) => t.user_id).length,
    bots: leagueTeams(doc.world).filter((t) => !t.user_id).length,
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
    const joined = createUserTeam(ensureBotWorld(doc.world), account.id, t);
    let world = joined.world;
    if (!world.matches.some((m) => m.week === world.week)) {
      world = { ...world, matches: [...world.matches, ...generateWeekFixtures(world)] };
    } else {
      world = ensureHumanMatchmaking(world);
    }
    const next: LeagueDocument = {
      ...doc,
      accounts: [...doc.accounts, account],
      world,
      lastSeen: { ...doc.lastSeen, [account.id]: new Date().toISOString() },
    };
    return {
      doc: next,
      result: { userId: account.id, username: u, teamId: joined.team.id },
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
  return { userId: account.id, username: account.username, teamId: team.id };
}

function teamOf(doc: LeagueDocument, userId: string) {
  const team = doc.world.teams.find((t) => t.user_id === userId);
  if (!team) throw new ActionError("Takım yok.");
  return team;
}

export async function ping(userId: string) {
  return mutateLeague((doc) => ({
    doc: { ...doc, lastSeen: { ...doc.lastSeen, [userId]: new Date().toISOString() } },
    result: snapshot({ ...doc, lastSeen: { ...doc.lastSeen, [userId]: new Date().toISOString() } }, userId),
  }));
}

export async function setFormation(userId: string, formation: Formation) {
  return mutateLeague((doc) => {
    const team = teamOf(doc, userId);
    const roster = doc.world.teamPlayers.filter((tp) => tp.team_id === team.id);
    const others = doc.world.teamPlayers.filter((tp) => tp.team_id !== team.id);
    const filled = autoSelectStarters(roster, doc.world.players, formation);
    const world = {
      ...doc.world,
      teams: doc.world.teams.map((t) => (t.id === team.id ? { ...t, formation } : t)),
      teamPlayers: [...others, ...filled],
    };
    const next = { ...doc, world };
    return { doc: next, result: snapshot(next, userId) };
  });
}

export async function setTactics(userId: string, tactics: Tactic) {
  return mutateLeague((doc) => {
    const team = teamOf(doc, userId);
    const world = {
      ...doc.world,
      teams: doc.world.teams.map((t) => (t.id === team.id ? { ...t, tactics } : t)),
    };
    const next = { ...doc, world };
    return { doc: next, result: snapshot(next, userId) };
  });
}

export async function assignSlot(userId: string, slotKey: string, teamPlayerId: string) {
  return mutateLeague((doc) => {
    const team = teamOf(doc, userId);
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
    return { doc: next, result: snapshot(next, userId) };
  });
}

export async function autoPick(userId: string) {
  return mutateLeague((doc) => {
    const team = teamOf(doc, userId);
    const roster = doc.world.teamPlayers.filter((tp) => tp.team_id === team.id);
    const others = doc.world.teamPlayers.filter((tp) => tp.team_id !== team.id);
    const world = {
      ...doc.world,
      teamPlayers: [...others, ...autoSelectStarters(roster, doc.world.players, team.formation)],
    };
    const next = { ...doc, world };
    return { doc: next, result: snapshot(next, userId) };
  });
}

export async function listForSale(userId: string, teamPlayerId: string, price: number) {
  if (price <= 0) throw new ActionError("Fiyat 0'dan büyük olmalı.");
  return mutateLeague((doc) => {
    const team = teamOf(doc, userId);
    const tp = doc.world.teamPlayers.find((x) => x.id === teamPlayerId);
    if (!tp || tp.team_id !== team.id) throw new ActionError("Oyuncu kadronuzda değil.");
    if (doc.world.listings.some((l) => l.team_player_id === teamPlayerId && l.status === "active")) {
      throw new ActionError("Bu oyuncu zaten listelenmiş.");
    }
    if (tp.is_starter) throw new ActionError("İlk 11'dekini satmadan önce yedekten yerleştirin.");
    const world = {
      ...doc.world,
      listings: [
        ...doc.world.listings,
        {
          id: uid("tm"),
          team_player_id: teamPlayerId,
          seller_team_id: team.id,
          price: Math.round(price),
          status: "active" as const,
          created_at: new Date().toISOString(),
        },
      ],
    };
    const next = { ...doc, world };
    return { doc: next, result: snapshot(next, userId) };
  });
}

export async function cancelListing(userId: string, listingId: string) {
  return mutateLeague((doc) => {
    const team = teamOf(doc, userId);
    const world = {
      ...doc.world,
      listings: doc.world.listings.map((l) =>
        l.id === listingId && l.seller_team_id === team.id && l.status === "active"
          ? { ...l, status: "cancelled" as const }
          : l,
      ),
    };
    const next = { ...doc, world };
    return { doc: next, result: snapshot(next, userId) };
  });
}

export async function buyListing(userId: string, listingId: string) {
  return mutateLeague((doc) => {
    const team = teamOf(doc, userId);
    const listing = doc.world.listings.find((l) => l.id === listingId && l.status === "active");
    if (!listing) throw new ActionError("İlan bulunamadı.");
    if (listing.seller_team_id === team.id) throw new ActionError("Kendi ilanınızı satın alamazsınız.");
    if (team.coins < listing.price) throw new ActionError("Yetersiz bütçe.");
    const tp = doc.world.teamPlayers.find((x) => x.id === listing.team_player_id);
    if (!tp) throw new ActionError("Oyuncu kaydı yok.");
    const squadSize = doc.world.teamPlayers.filter((x) => x.team_id === team.id).length;
    if (squadSize >= 28) throw new ActionError("Kadro dolu (maks. 28).");
    const world = {
      ...doc.world,
      teams: doc.world.teams.map((t) => {
        if (t.id === team.id) return { ...t, coins: t.coins - listing.price };
        if (t.id === listing.seller_team_id && t.id !== SYSTEM_TEAM_ID) {
          return { ...t, coins: t.coins + listing.price };
        }
        return t;
      }),
      teamPlayers: doc.world.teamPlayers.map((row) =>
        row.id === tp.id
          ? {
              ...row,
              team_id: team.id,
              is_starter: false,
              squad_position: null,
              acquired_at: new Date().toISOString(),
            }
          : row,
      ),
      listings: doc.world.listings.map((l) => (l.id === listingId ? { ...l, status: "sold" as const } : l)),
    };
    const next = { ...doc, world };
    return { doc: next, result: snapshot(next, userId) };
  });
}

export async function ensureFixtures(userId: string) {
  return mutateLeague((doc) => {
    teamOf(doc, userId);
    let world = ensureBotWorld(doc.world);
    if (!world.matches.some((m) => m.week === world.week)) {
      world = { ...world, matches: [...world.matches, ...generateWeekFixtures(world)] };
    } else {
      world = ensureHumanMatchmaking(world);
    }
    const next = { ...doc, world };
    return { doc: next, result: snapshot(next, userId) };
  });
}

export async function playMatch(userId: string) {
  return mutateLeague((doc) => {
    const team = teamOf(doc, userId);
    const out = playUserMatch(doc.world, team.id);
    const lastSim = { ...doc.lastSim };
    if (typeof out.result !== "string") {
      lastSim[team.id] = out.result;
      if (out.result.match.home_team_id) lastSim[out.result.match.home_team_id] = out.result;
      if (out.result.match.away_team_id) lastSim[out.result.match.away_team_id] = out.result;
    }
    const next: LeagueDocument = {
      ...doc,
      world: out.world,
      lastSim,
      lastSeen: { ...doc.lastSeen, [userId]: new Date().toISOString() },
    };
    return {
      doc: next,
      result: { snap: snapshot(next, userId), match: typeof out.result === "string" ? null : out.result, error: typeof out.result === "string" ? out.result : null },
    };
  });
}

export async function importPlayers(userId: string, players: Player[], mode: "merge" | "replace") {
  return mutateLeague((doc) => {
    teamOf(doc, userId);
    if (mode === "replace") {
      const next = { ...doc, world: { ...doc.world, players } };
      return { doc: next, result: snapshot(next, userId) };
    }
    const names = new Set(doc.world.players.map((p) => p.name.toLowerCase()));
    const extra = players.filter((p) => !names.has(p.name.toLowerCase()));
    const agencyRows = extra.map((p) => ({
      id: uid("tp"),
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
        id: uid("tm"),
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
    return { doc: next, result: snapshot(next, userId) };
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
    };
  }
  return snapshot(doc, userId);
}
