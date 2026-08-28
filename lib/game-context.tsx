"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  Formation,
  GameWorld,
  ManagerInfo,
  MatchSimulationResult,
  Player,
  SessionUser,
  Tactic,
  Team,
} from "./types";

export type LeagueSnap = {
  world: GameWorld;
  me: SessionUser | null;
  lastSim: MatchSimulationResult | null;
  managers: ManagerInfo[];
  backend: "supabase" | "file" | "memory";
  humans: number;
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
  register: (username: string, password: string, teamName: string) => Promise<string | null>;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  setFormation: (formation: Formation) => Promise<void>;
  setTactics: (tactics: Tactic) => Promise<void>;
  assignSlot: (slotKey: string, teamPlayerId: string) => Promise<void>;
  autoPick: () => Promise<void>;
  listForSale: (teamPlayerId: string, price: number) => Promise<string | null>;
  cancelListing: (listingId: string) => Promise<void>;
  buyListing: (listingId: string) => Promise<string | null>;
  ensureWeekFixtures: () => Promise<void>;
  playWeek: () => Promise<MatchSimulationResult | string>;
  importPlayers: (players: Player[], mode: "merge" | "replace") => Promise<void>;
};

const GameContext = createContext<GameContextValue | null>(null);

async function fetchLeague(): Promise<LeagueSnap> {
  const res = await fetch("/api/league", { cache: "no-store" });
  if (!res.ok) throw new Error("Lig yüklenemedi");
  return res.json();
}

async function postAction(body: unknown) {
  const res = await fetch("/api/league/action", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
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
  });
  const [ready, setReady] = useState(false);

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
    const t = window.setInterval(() => void refresh(), 4000);
    return () => window.clearInterval(t);
  }, [refresh]);

  const userTeam = useMemo(
    () => (snap.me ? snap.world.teams.find((t) => t.id === snap.me?.teamId) ?? null : null),
    [snap],
  );

  const register = useCallback(async (username: string, password: string, teamName: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password, teamName }),
    });
    const json = await res.json();
    if (!res.ok) return (json.error as string) ?? "Kayıt başarısız";
    await refresh();
    return null;
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json();
    if (!res.ok) return (json.error as string) ?? "Giriş başarısız";
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

  const buyListing = useCallback(async (listingId: string) => {
    try {
      apply(await postAction({ type: "buyListing", listingId }));
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Satın alınamadı";
    }
  }, [apply]);

  const ensureWeekFixtures = useCallback(async () => {
    apply(await postAction({ type: "ensureFixtures" }));
  }, [apply]);

  const playWeek = useCallback(async (): Promise<MatchSimulationResult | string> => {
    const json = await postAction({ type: "playMatch" });
    apply(json.snap);
    if (json.error) return json.error as string;
    return json.match as MatchSimulationResult;
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
      register,
      login,
      logout,
      setFormation,
      setTactics,
      assignSlot,
      autoPick,
      listForSale,
      cancelListing,
      buyListing,
      ensureWeekFixtures,
      playWeek,
      importPlayers,
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
      assignSlot,
      autoPick,
      listForSale,
      cancelListing,
      buyListing,
      ensureWeekFixtures,
      playWeek,
      importPlayers,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
