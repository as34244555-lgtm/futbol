"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SAVE_KEY, SYSTEM_TEAM_ID } from "./types";
import type {
  Formation,
  MatchSimulationResult,
  Player,
  Tactic,
  Team,
} from "./types";
import { simulateGameWeek } from "./season";
import {
  autoSelectStarters,
  createFreshWorld,
  createUserTeam,
  generateWeekFixtures,
  type GameWorld,
} from "./world";
import { uid } from "./utils";

type GameContextValue = {
  ready: boolean;
  world: GameWorld;
  userTeam: Team | null;
  newGame: (username: string, teamName: string) => void;
  continueGame: () => boolean;
  setFormation: (formation: Formation) => void;
  setTactics: (tactics: Tactic) => void;
  assignSlot: (slotKey: string, teamPlayerId: string) => void;
  autoPick: () => void;
  listForSale: (teamPlayerId: string, price: number) => string | null;
  cancelListing: (listingId: string) => void;
  buyListing: (listingId: string) => string | null;
  ensureWeekFixtures: () => void;
  playWeek: () => MatchSimulationResult | string;
  importPlayers: (players: Player[], mode: "merge" | "replace") => void;
  resetSave: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);

function persist(world: GameWorld) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(world));
  } catch {
    /* quota */
  }
}

function loadSave(): GameWorld | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameWorld;
  } catch {
    return null;
  }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [world, setWorld] = useState<GameWorld>(() => createFreshWorld());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = loadSave();
    if (saved?.profile && saved.userTeamId) setWorld(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && world.profile) persist(world);
  }, [world, ready]);

  const patch = useCallback((fn: (w: GameWorld) => GameWorld) => {
    setWorld((prev) => fn(prev));
  }, []);

  const userTeam = useMemo(
    () => world.teams.find((t) => t.id === world.userTeamId) ?? null,
    [world.teams, world.userTeamId],
  );

  const newGame = useCallback((username: string, teamName: string) => {
    const fresh = createFreshWorld();
    const profile = {
      id: uid("user"),
      username: username.trim(),
      created_at: new Date().toISOString(),
    };
    const next = createUserTeam(fresh, profile, teamName.trim());
    setWorld(next);
    persist(next);
  }, []);

  const continueGame = useCallback(() => {
    const saved = loadSave();
    if (saved?.profile && saved.userTeamId) {
      setWorld(saved);
      return true;
    }
    return false;
  }, []);

  const setFormation = useCallback(
    (formation: Formation) => {
      patch((w) => {
        if (!w.userTeamId) return w;
        const roster = w.teamPlayers.filter((tp) => tp.team_id === w.userTeamId);
        const others = w.teamPlayers.filter((tp) => tp.team_id !== w.userTeamId);
        const filled = autoSelectStarters(roster, w.players, formation);
        return {
          ...w,
          teams: w.teams.map((t) => (t.id === w.userTeamId ? { ...t, formation } : t)),
          teamPlayers: [...others, ...filled],
        };
      });
    },
    [patch],
  );

  const setTactics = useCallback(
    (tactics: Tactic) => {
      patch((w) => ({
        ...w,
        teams: w.teams.map((t) => (t.id === w.userTeamId ? { ...t, tactics } : t)),
      }));
    },
    [patch],
  );

  const assignSlot = useCallback(
    (slotKey: string, teamPlayerId: string) => {
      patch((w) => {
        if (!w.userTeamId) return w;
        const team = w.teams.find((t) => t.id === w.userTeamId);
        if (!team) return w;
        return {
          ...w,
          teamPlayers: w.teamPlayers.map((tp) => {
            if (tp.team_id !== w.userTeamId) return tp;
            if (tp.squad_position === slotKey) {
              return { ...tp, is_starter: false, squad_position: null };
            }
            if (tp.id === teamPlayerId) {
              return { ...tp, is_starter: true, squad_position: slotKey };
            }
            return tp;
          }),
        };
      });
    },
    [patch],
  );

  const autoPick = useCallback(() => {
    patch((w) => {
      if (!w.userTeamId) return w;
      const team = w.teams.find((t) => t.id === w.userTeamId);
      if (!team) return w;
      const roster = w.teamPlayers.filter((tp) => tp.team_id === w.userTeamId);
      const others = w.teamPlayers.filter((tp) => tp.team_id !== w.userTeamId);
      return { ...w, teamPlayers: [...others, ...autoSelectStarters(roster, w.players, team.formation)] };
    });
  }, [patch]);

  const listForSale = useCallback(
    (teamPlayerId: string, price: number): string | null => {
      if (price <= 0) return "Fiyat 0'dan büyük olmalı.";
      let err: string | null = null;
      patch((w) => {
        const tp = w.teamPlayers.find((x) => x.id === teamPlayerId);
        if (!tp || tp.team_id !== w.userTeamId) {
          err = "Oyuncu kadronuzda değil.";
          return w;
        }
        if (w.listings.some((l) => l.team_player_id === teamPlayerId && l.status === "active")) {
          err = "Bu oyuncu zaten listelenmiş.";
          return w;
        }
        const starters = w.teamPlayers.filter((x) => x.team_id === w.userTeamId && x.is_starter);
        if (tp.is_starter && starters.length <= 11) {
          err = "İlk 11'deki oyuncuyu satmak için önce yedekten birini yerleştirin.";
          return w;
        }
        return {
          ...w,
          listings: [
            ...w.listings,
            {
              id: uid("tm"),
              team_player_id: teamPlayerId,
              seller_team_id: tp.team_id,
              price: Math.round(price),
              status: "active",
              created_at: new Date().toISOString(),
            },
          ],
        };
      });
      return err;
    },
    [patch],
  );

  const cancelListing = useCallback(
    (listingId: string) => {
      patch((w) => ({
        ...w,
        listings: w.listings.map((l) =>
          l.id === listingId && l.seller_team_id === w.userTeamId && l.status === "active"
            ? { ...l, status: "cancelled" }
            : l,
        ),
      }));
    },
    [patch],
  );

  const buyListing = useCallback(
    (listingId: string): string | null => {
      let err: string | null = null;
      patch((w) => {
        const team = w.teams.find((t) => t.id === w.userTeamId);
        const listing = w.listings.find((l) => l.id === listingId && l.status === "active");
        if (!team || !listing) {
          err = "İlan bulunamadı.";
          return w;
        }
        if (listing.seller_team_id === team.id) {
          err = "Kendi ilanınızı satın alamazsınız.";
          return w;
        }
        if (team.coins < listing.price) {
          err = "Yetersiz bütçe.";
          return w;
        }
        const tp = w.teamPlayers.find((x) => x.id === listing.team_player_id);
        if (!tp) {
          err = "Oyuncu kaydı yok.";
          return w;
        }
        const squadSize = w.teamPlayers.filter((x) => x.team_id === team.id).length;
        if (squadSize >= 28) {
          err = "Kadro dolu (maks. 28).";
          return w;
        }
        return {
          ...w,
          teams: w.teams.map((t) => {
            if (t.id === team.id) return { ...t, coins: t.coins - listing.price };
            if (t.id === listing.seller_team_id && t.id !== SYSTEM_TEAM_ID) {
              return { ...t, coins: t.coins + listing.price };
            }
            return t;
          }),
          teamPlayers: w.teamPlayers.map((row) =>
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
          listings: w.listings.map((l) => (l.id === listingId ? { ...l, status: "sold" } : l)),
        };
      });
      return err;
    },
    [patch],
  );

  const ensureWeekFixtures = useCallback(() => {
    patch((w) => {
      const existing = w.matches.filter((m) => m.week === w.week);
      if (existing.length > 0) return w;
      return { ...w, matches: [...w.matches, ...generateWeekFixtures(w)] };
    });
  }, [patch]);

  const playWeek = useCallback((): MatchSimulationResult | string => {
    const out = simulateGameWeek(world);
    setWorld(out.world);
    return out.result;
  }, [world]);

  const importPlayers = useCallback((players: Player[], mode: "merge" | "replace") => {
    patch((w) => {
      if (mode === "replace") {
        return { ...w, players };
      }
      const names = new Set(w.players.map((p) => p.name.toLowerCase()));
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
      return {
        ...w,
        players: [...w.players, ...extra],
        teamPlayers: [...w.teamPlayers, ...agencyRows],
        listings: [...w.listings, ...listings],
      };
    });
  }, [patch]);

  const resetSave = useCallback(() => {
    localStorage.removeItem(SAVE_KEY);
    setWorld(createFreshWorld());
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({
      ready,
      world,
      userTeam,
      newGame,
      continueGame,
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
      resetSave,
    }),
    [
      ready,
      world,
      userTeam,
      newGame,
      continueGame,
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
      resetSave,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
