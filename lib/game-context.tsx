"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { OpeningSplash } from "@/components/OpeningSplash";
import { RegisterPwa } from "@/components/RegisterPwa";
import { enableNotifications, notifyReady } from "@/lib/notify";
import type {
  Formation,
  GameWorld,
  KitStyle,
  ManagerInfo,
  MatchSimulationResult,
  Player,
  SessionUser,
  StadiumPrefs,
  Tactic,
  Team,
  Training,
} from "./types";

export type LeagueSnap = {
  world: GameWorld;
  me: SessionUser | null;
  lastSim: MatchSimulationResult | null;
  managers: ManagerInfo[];
  backend: "supabase" | "file" | "memory" | "kv";
  humans: number;
  bots: number;
  roomCode?: string;
};

const emptyWorld: GameWorld = {
  players: [],
  teams: [],
  teamPlayers: [],
  listings: [],
  matches: [],
  matchLogs: [],
  week: 1,
  season: 1,
};

type GameContextValue = {
  ready: boolean;
  world: GameWorld;
  userTeam: Team | null;
  me: SessionUser | null;
  lastSim: MatchSimulationResult | null;
  managers: ManagerInfo[];
  backend: LeagueSnap["backend"];
  humans: number;
  bots: number;
  roomCode: string;
  register: (
    username: string,
    password: string,
    teamName: string,
    roomCode?: string,
    extra?: { career?: boolean; kit_primary?: string; kit_secondary?: string; kit_style?: KitStyle },
  ) => Promise<string | null>;
  login: (username: string, password: string, roomCode?: string) => Promise<string | null>;
  logout: () => Promise<void>;
  setFormation: (formation: Formation) => Promise<void>;
  setTactics: (tactics: Tactic) => Promise<void>;
  setClub: (patch: {
    kit_primary?: string;
    kit_secondary?: string;
    kit_style?: KitStyle;
    stadium?: StadiumPrefs;
  }) => Promise<void>;
  assignSlot: (slotKey: string, teamPlayerId: string) => Promise<void>;
  autoPick: () => Promise<void>;
  listForSale: (teamPlayerId: string, price: number) => Promise<string | null>;
  cancelListing: (listingId: string) => Promise<void>;
  buyListing: (input: {
    listingId: string;
    teamPlayerId?: string;
    playerId?: string;
    sellerTeamId?: string;
    price?: number;
  }) => Promise<string | null>;
  ensureWeekFixtures: () => Promise<void>;
  playWeek: () => Promise<MatchSimulationResult | string>;
  setTraining: (training: Training) => Promise<void>;
  markReady: () => Promise<void>;
  makeOffer: (listingId: string, price: number) => Promise<string | null>;
  respondOffer: (offerId: string, accept: boolean) => Promise<string | null>;
  importPlayers: (players: Player[], mode: "merge" | "replace") => Promise<void>;
  watching: boolean;
  setWatching: (v: boolean) => void;
};

const GameContext = createContext<GameContextValue | null>(null);

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    const gone = /deployment has been removed|The deploy/i.test(text);
    throw new Error(
      gone
        ? "Geçici site kapanmış. Yeni adresi açın veya sayfayı yenileyin."
        : text.replace(/\s+/g, " ").slice(0, 180) || "Sunucu yanıtı okunamadı.",
    );
  }
}

async function fetchLeague(): Promise<LeagueSnap> {
  const res = await fetch("/api/league", { cache: "no-store" });
  const json = await readJson(res);
  if (!res.ok) throw new Error("Lig yüklenemedi");
  return json as LeagueSnap;
}

async function postAction<T = LeagueSnap>(body: unknown): Promise<T> {
  const res = await fetch("/api/league/action", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await readJson(res)) as T & { error?: string };
  if (!res.ok) throw new Error(json.error ?? "İşlem başarısız");
  return json;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [snap, setSnap] = useState<LeagueSnap>({
    world: emptyWorld,
    me: null,
    lastSim: null,
    managers: [],
    backend: "file",
    humans: 0,
    bots: 0,
    roomCode: "NOVA",
  });
  const [ready, setReady] = useState(false);
  const [watching, setWatching] = useState(false);

  const apply = useCallback((s: LeagueSnap) => setSnap(s), []);

  const refresh = useCallback(async () => {
    try {
      apply(await fetchLeague());
    } catch {
      /* keep last */
    } finally {
      setReady(true);
    }
  }, [apply]);

  useEffect(() => {
    void refresh();
    const t = window.setInterval(() => {
      if (!watching) void refresh();
    }, 4000);
    return () => window.clearInterval(t);
  }, [refresh, watching]);

  const userTeam = useMemo(
    () =>
      snap.me
        ? snap.world.teams.find((t) => t.id === snap.me?.teamId) ??
          snap.world.teams.find((t) => t.user_id === snap.me?.id) ??
          null
        : null,
    [snap],
  );

  useEffect(() => {
    if (!userTeam) return;
    const next = snap.world.matches.find(
      (m) =>
        m.week === snap.world.week &&
        m.status === "pending" &&
        (m.home_team_id === userTeam.id || m.away_team_id === userTeam.id),
    );
    if (!next) return;
    const oppId = next.home_team_id === userTeam.id ? next.away_team_id : next.home_team_id;
    const opp = snap.world.teams.find((t) => t.id === oppId);
    if (opp?.user_id && opp.readyWeek === snap.world.week && userTeam.readyWeek !== snap.world.week) {
      notifyReady("Rakip hazır", `${opp.name} düdük için bekliyor.`);
    }
  }, [snap.world, userTeam]);

  const register = useCallback(
    async (
      username: string,
      password: string,
      teamName: string,
      roomCode?: string,
      extra?: { career?: boolean; kit_primary?: string; kit_secondary?: string; kit_style?: KitStyle },
    ) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password, teamName, roomCode, ...extra }),
      });
      const json = (await readJson(res)) as { error?: string };
      if (!res.ok) return json.error ?? "Kayıt başarısız";
      await refresh();
      void enableNotifications();
      return null;
    },
    [refresh],
  );

  const login = useCallback(async (username: string, password: string, roomCode?: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password, roomCode }),
    });
    const json = (await readJson(res)) as { error?: string };
    if (!res.ok) return json.error ?? "Giriş başarısız";
    await refresh();
    return null;
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
  }, [refresh]);

  const setFormation = useCallback(async (formation: Formation) => {
    apply(await postAction({ type: "setFormation", formation }));
  }, [apply]);

  const setTactics = useCallback(async (tactics: Tactic) => {
    apply(await postAction({ type: "setTactics", tactics }));
  }, [apply]);

  const setClub = useCallback(
    async (patch: { kit_primary?: string; kit_secondary?: string; kit_style?: KitStyle; stadium?: StadiumPrefs }) => {
      apply(await postAction({ type: "setClub", ...patch }));
    },
    [apply],
  );

  const assignSlot = useCallback(async (slotKey: string, teamPlayerId: string) => {
    apply(await postAction({ type: "assignSlot", slotKey, teamPlayerId }));
  }, [apply]);

  const autoPick = useCallback(async () => {
    apply(await postAction({ type: "autoPick" }));
  }, [apply]);

  const listForSale = useCallback(async (teamPlayerId: string, price: number) => {
    try {
      apply(await postAction({ type: "listForSale", teamPlayerId, price }));
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "İlan açılamadı";
    }
  }, [apply]);

  const cancelListing = useCallback(async (listingId: string) => {
    apply(await postAction({ type: "cancelListing", listingId }));
  }, [apply]);

  const buyListing = useCallback(
    async (input: {
      listingId: string;
      teamPlayerId?: string;
      playerId?: string;
      sellerTeamId?: string;
      price?: number;
    }) => {
      try {
        apply(await postAction({ type: "buyListing", ...input }));
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Satın alınamadı";
      }
    },
    [apply],
  );

  const ensureWeekFixtures = useCallback(async () => {
    apply(await postAction({ type: "ensureFixtures" }));
  }, [apply]);

  const playWeek = useCallback(async (): Promise<MatchSimulationResult | string> => {
    const json = await postAction<{
      snap: LeagueSnap;
      match: MatchSimulationResult | null;
      error: string | null;
      coinsDelta?: number;
      pointsDelta?: number;
    }>({ type: "playMatch" });
    apply(json.snap);
    if (json.error) return json.error as string;
    return {
      ...(json.match as MatchSimulationResult),
      coinsDelta: json.coinsDelta ?? 0,
      pointsDelta: json.pointsDelta ?? 0,
    };
  }, [apply]);

  const setTraining = useCallback(async (training: Training) => {
    apply(await postAction({ type: "setTraining", training }));
  }, [apply]);

  const markReady = useCallback(async () => {
    apply(await postAction({ type: "setReady" }));
  }, [apply]);

  const makeOffer = useCallback(async (listingId: string, price: number) => {
    try {
      apply(await postAction({ type: "makeOffer", listingId, price }));
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Teklif gönderilemedi";
    }
  }, [apply]);

  const respondOffer = useCallback(async (offerId: string, accept: boolean) => {
    try {
      apply(await postAction({ type: "respondOffer", offerId, accept }));
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Teklif yanıtlanamadı";
    }
  }, [apply]);

  const importPlayers = useCallback(async (players: Player[], mode: "merge" | "replace") => {
    apply(await postAction({ type: "importPlayers", players, mode }));
  }, [apply]);

  const value = useMemo<GameContextValue>(
    () => ({
      ready,
      world: snap.world,
      userTeam,
      me: snap.me,
      lastSim: snap.lastSim,
      managers: snap.managers,
      backend: snap.backend,
      humans: snap.humans,
      bots: snap.bots ?? 0,
      roomCode: snap.roomCode ?? snap.me?.roomCode ?? "NOVA",
      register,
      login,
      logout,
      setFormation,
      setTactics,
      setClub,
      assignSlot,
      autoPick,
      listForSale,
      cancelListing,
      buyListing,
      ensureWeekFixtures,
      playWeek,
      setTraining,
      markReady,
      makeOffer,
      respondOffer,
      importPlayers,
      watching,
      setWatching,
    }),
    [
      ready,
      snap,
      userTeam,
      register,
      login,
      logout,
      setFormation,
      setTactics,
      setClub,
      assignSlot,
      autoPick,
      listForSale,
      cancelListing,
      buyListing,
      ensureWeekFixtures,
      playWeek,
      setTraining,
      markReady,
      makeOffer,
      respondOffer,
      importPlayers,
      watching,
    ],
  );

  return (
    <GameContext.Provider value={value}>
      <RegisterPwa />
      <OpeningSplash>{children}</OpeningSplash>
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
