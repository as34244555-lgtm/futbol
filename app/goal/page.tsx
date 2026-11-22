"use client";

import { GameShell } from "@/components/GameShell";
import { PlayerCard } from "@/components/PlayerCard";
import { PenaltyKick } from "@/components/scene/PenaltyKick";
import { Button } from "@/components/ui/Button";
import { makeAbdullah, rosterPlayers } from "@/lib/catalog";
import { useGame } from "@/lib/game-context";
import { cardLiveOverall } from "@/lib/meta";
import type { Player } from "@/lib/types";
import { rosterOf } from "@/lib/world";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

const DAILY_MAX = 3;

function bestSpecialTaker(roster: Array<{ player: Player; is_starter?: boolean }>, kit?: string): Player {
  const specials = roster
    .map((r) => r.player)
    .filter((p) => p.legend || p.tier === "special")
    .sort((a, b) => b.overall - a.overall);
  if (specials[0]) return specials[0];
  const pool = rosterPlayers()
    .filter((p) => p.tier === "special" && p.position !== "KL")
    .sort((a, b) => b.overall - a.overall);
  return pool[0] ?? makeAbdullah();
  void kit;
}

export default function GoalRoomPage() {
  const { world, userTeam, claimGoalReward } = useGame();
  const router = useRouter();
  const roster = useMemo(() => (userTeam ? rosterOf(world, userTeam.id) : []), [world, userTeam]);
  const taker = useMemo(() => bestSpecialTaker(roster, userTeam?.kit_primary), [roster, userTeam?.kit_primary]);

  const today = new Date().toISOString().slice(0, 10);
  const used = userTeam?.goalDay === today ? userTeam.goalShots ?? 0 : 0;
  const remaining = Math.max(0, DAILY_MAX - used);

  const [aimX, setAimX] = useState(0);
  const [power, setPower] = useState(0.62);
  const [shooting, setShooting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [rewardLine, setRewardLine] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSettled = useCallback(
    async (result: "goal" | "save" | "miss") => {
      setShooting(false);
      setBanner(result === "goal" ? "GOL!" : result === "save" ? "KALECİ!" : "AUT / DİREK");
      setBusy(true);
      const res = await claimGoalReward(result === "goal");
      setBusy(false);
      if (res.error) setRewardLine(res.error);
      else {
        const parts = [];
        if (res.coins) parts.push(`+${res.coins} coin`);
        if (res.gems) parts.push(`+${res.gems} gem`);
        setRewardLine(
          `${parts.join(" · ") || "Kayıt alındı"} · Penaltı ${res.shot ?? used + 1}/${res.max ?? DAILY_MAX}`,
        );
      }
    },
    [claimGoalReward, used],
  );

  const shoot = () => {
    if (shooting || busy || remaining <= 0) return;
    setBanner(null);
    setRewardLine(null);
    setShooting(true);
  };

  if (!userTeam) return null;

  return (
    <GameShell bare>
      <div className="relative h-full w-full overflow-hidden">
        <PenaltyKick
          taker={taker}
          kit={userTeam.kit_primary}
          aimX={aimX}
          power={power}
          shooting={shooting}
          onSettled={(r) => void onSettled(r)}
          className="absolute inset-0 h-full w-full"
        />

        {/* Top HUD */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 bg-gradient-to-b from-black/70 to-transparent px-[clamp(0.75rem,2vw,1.5rem)] pb-10 pt-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.28em] text-[#ffb04a]">GOAL · GÜNLÜK PENALTI</p>
            <p className="font-display text-2xl text-white sm:text-3xl">Şut ve Gol</p>
            <p className="text-xs text-white/70">
              En iyi özel oyuncu ile · Hak {remaining}/{DAILY_MAX}
            </p>
          </div>
          <div className="pointer-events-auto w-[7.5rem] shrink-0 sm:w-[9rem]">
            <PlayerCard player={taker} compact featured />
            <p className="mt-1 truncate text-center text-[11px] text-white/80">
              {taker.name.split(" ").slice(-1)[0]} · {cardLiveOverall(taker)}
            </p>
          </div>
        </div>

        {banner && (
          <div className="absolute left-1/2 top-[38%] z-30 -translate-x-1/2 rounded-2xl bg-black/75 px-10 py-4 text-center shadow-2xl">
            <p className="font-display text-5xl text-[#e7c56a]">{banner}</p>
            {rewardLine && <p className="mt-2 text-sm text-white/80">{rewardLine}</p>}
          </div>
        )}

        {/* Controls */}
        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-[clamp(0.75rem,2vw,1.5rem)] pb-4 pt-14">
          <div className="mb-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="flex min-h-11 items-center gap-1 rounded-r-xl rounded-l-md bg-[#1f8fff] px-5 text-sm font-bold text-white"
            >
              ‹ Geri
            </button>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex justify-between text-[11px] text-white/65">
                <span>Köşe</span>
                <span>{aimX < -0.35 ? "Sol" : aimX > 0.35 ? "Sağ" : "Orta"}</span>
              </div>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.01}
                value={aimX}
                disabled={shooting || remaining <= 0}
                onChange={(e) => setAimX(Number(e.target.value))}
                className="w-full accent-[#1f8fff]"
              />
            </div>
            <div className="w-[min(28%,220px)]">
              <div className="mb-1 flex justify-between text-[11px] text-white/65">
                <span>Güç</span>
                <span>{Math.round(power * 100)}</span>
              </div>
              <input
                type="range"
                min={0.35}
                max={1}
                step={0.01}
                value={power}
                disabled={shooting || remaining <= 0}
                onChange={(e) => setPower(Number(e.target.value))}
                className="w-full accent-[#ff7a12]"
              />
            </div>
            <Button
              size="lg"
              className="min-w-[8.5rem] bg-[#ff7a12] text-white hover:bg-[#ff8c2e]"
              disabled={shooting || busy || remaining <= 0}
              onClick={shoot}
            >
              {remaining <= 0 ? "Yarın" : shooting ? "..." : "PENALTI"}
            </Button>
          </div>
          {remaining <= 0 && !banner && (
            <p className="text-center text-xs text-[#e7c56a]">Günlük 3 penaltı hakkın bitti — yarın ödüllü Goal yeniden açılır.</p>
          )}
          {rewardLine && !banner && <p className="text-center text-xs text-white/70">{rewardLine}</p>}
        </div>
      </div>
    </GameShell>
  );
}
