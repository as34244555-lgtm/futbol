"use client";

import { GameShell } from "@/components/GameShell";
import { PackOpen } from "@/components/PackOpen";
import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/game-context";
import { PACK_COST_COINS, PACK_COST_GEMS } from "@/lib/meta";
import { formatCoins } from "@/lib/utils";
import type { Player } from "@/lib/types";
import { useState } from "react";

export default function PacksPage() {
  const { userTeam, openPack } = useGame();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pulls, setPulls] = useState<Array<{ player: Player; fromPool: string }> | null>(null);

  const open = async (pay: "coins" | "gems") => {
    setBusy(true);
    setErr(null);
    const res = await openPack(pay);
    setBusy(false);
    if (res.error) setErr(res.error);
    else if (res.pulls?.length) setPulls(res.pulls);
  };

  return (
    <GameShell>
      <p className="text-[10px] uppercase tracking-[0.35em] text-[#d4af37]">Gacha</p>
      <h1 className="font-display mt-1 text-4xl">Oyuncu Paketi</h1>
      <p className="mt-2 text-sm text-slate-400">3 kart çekimi · özel havuz şansı yüksek</p>
      <div className="mt-4 flex gap-4 text-sm">
        <span className="text-white">₡ {formatCoins(userTeam?.coins ?? 0)}</span>
        <span className="text-cyan-300">◆ {formatCoins(userTeam?.gems ?? 0)}</span>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#101826] p-4">
          <p className="font-semibold">Coin Paketi</p>
          <p className="mt-1 text-sm text-slate-400">{formatCoins(PACK_COST_COINS)} coin</p>
          <Button className="mt-4 w-full" disabled={busy} onClick={() => void open("coins")}>
            Aç
          </Button>
        </div>
        <div className="rounded-2xl border border-cyan-400/30 bg-[#0c1a24] p-4">
          <p className="font-semibold text-cyan-200">Gem Paketi</p>
          <p className="mt-1 text-sm text-slate-400">{PACK_COST_GEMS} gem</p>
          <Button className="mt-4 w-full" variant="gold" disabled={busy} onClick={() => void open("gems")}>
            Aç
          </Button>
        </div>
      </div>
      {err && <p className="mt-3 text-sm text-rose-300">{err}</p>}
      {pulls && <PackOpen pulls={pulls} onClose={() => setPulls(null)} />}
    </GameShell>
  );
}
