"use client";

import { GameShell } from "@/components/GameShell";
import { PackOpen } from "@/components/PackOpen";
import { useGame } from "@/lib/game-context";
import { PACK_COST_COINS, PACK_COST_GEMS } from "@/lib/meta";
import { formatCoins } from "@/lib/utils";
import type { Player } from "@/lib/types";
import Image from "next/image";
import { useState } from "react";

export default function PacksPage() {
  const { openPack } = useGame();
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
    <GameShell title="Ürün Ayrıntıları" flush>
      <div className="flex h-[calc(100dvh-6.2rem)] w-full flex-col px-[clamp(0.75rem,2vw,1.5rem)]">
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
          {/* Epic-style pack */}
          <article className="relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#071820]">
            <div className="relative min-h-0 flex-1">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#3dff8a44_0%,#0a2a18_42%,#071820_70%)]" />
              <div className="absolute inset-0 bg-[repeating-radial-gradient(circle_at_center,#2bd67a22_0_2px,transparent_2px_22px)] opacity-60" />
              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-end gap-2">
                <Image src="/a-studio-192.png" alt="" width={120} height={160} className="h-36 w-28 rounded-xl object-cover ring-2 ring-[#e7c56a]/60" />
              </div>
              <span className="absolute right-3 top-3 rounded-md bg-black/50 px-2 py-1 text-[11px] text-white/80">Sınırlı Çekiliş: 50/50</span>
            </div>
            <div className="relative z-10 border-t border-white/10 bg-black/50 px-4 py-3">
              <p className="text-sm font-semibold text-[#9dffb0]">Epic</p>
              <p className="font-display text-2xl">Özel Kart Paketi</p>
              <p className="text-xs text-white/55">Bitmesine: 3 gün 5 sa</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void open("coins")}
                  className="flex-1 rounded-full border border-white/20 bg-[#2a3140] px-3 py-2 text-sm font-semibold"
                >
                  x1 · {formatCoins(PACK_COST_COINS)} coin
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void open("gems")}
                  className="flex-1 rounded-full border border-white/20 bg-[#2a3140] px-3 py-2 text-sm font-semibold"
                >
                  x10 · {PACK_COST_GEMS * 9} gem
                </button>
              </div>
            </div>
          </article>

          {/* POTW-style pack */}
          <article className="relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0a1a12]">
            <div className="relative min-h-0 flex-1">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,#3dff8a55,transparent_45%)]" />
              <div className="absolute inset-y-0 right-2 flex items-center gap-0 font-display text-[5.5rem] leading-none text-[#7CFF4A]/30 sm:text-[7rem]">
                <span>P</span><span>O</span><span>T</span><span>W</span>
              </div>
              <div className="absolute bottom-6 left-8 flex -space-x-4">
                <Image src="/a-studio-icon.png" alt="" width={72} height={96} className="h-24 w-18 rounded-lg object-cover ring-1 ring-white/30" />
                <Image src="/apple-touch-icon.png" alt="" width={72} height={96} className="h-24 w-18 rounded-lg object-cover ring-1 ring-white/30" />
                <Image src="/a-studio-192.png" alt="" width={72} height={96} className="h-24 w-18 rounded-lg object-cover ring-1 ring-white/30" />
              </div>
              <span className="absolute right-3 top-3 rounded-md bg-black/50 px-2 py-1 text-[11px] text-white/80">Sınırlı Çekiliş: 11/11</span>
            </div>
            <div className="relative z-10 border-t border-white/10 bg-black/50 px-4 py-3">
              <p className="text-sm font-semibold text-[#9dffb0]">POTW</p>
              <p className="font-display text-2xl">Haftanın Oyuncuları</p>
              <p className="text-xs text-orange-300">Kalan: 3 · Bitmesine: 3 gün 5 sa</p>
              <div className="mt-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void open("gems")}
                  className="w-full rounded-full border border-white/20 bg-[#2a3140] px-3 py-2 text-sm font-semibold"
                >
                  x1 · {PACK_COST_GEMS} gem
                </button>
              </div>
            </div>
          </article>
        </div>
        {err && <p className="mt-2 text-sm text-rose-300">{err}</p>}
        <p className="mt-2 text-[10px] text-white/40">* Gösterilen genel dereceler, oyuncuların olası en yüksek derecelerini yansıtır.</p>
        {pulls && <PackOpen pulls={pulls} onClose={() => setPulls(null)} />}
      </div>
    </GameShell>
  );
}
