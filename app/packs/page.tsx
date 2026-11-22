"use client";

import { GameShell } from "@/components/GameShell";
import { PackOpen } from "@/components/PackOpen";
import { PlayerCard } from "@/components/PlayerCard";
import { makeAbdullah, rosterPlayers } from "@/lib/catalog";
import { useGame } from "@/lib/game-context";
import { PACK_COST_COINS, PACK_COST_GEMS } from "@/lib/meta";
import type { Player } from "@/lib/types";
import { formatCoins } from "@/lib/utils";
import { useMemo, useState } from "react";

function featuredSpecials(n = 5): Player[] {
  const specials = rosterPlayers()
    .filter((p) => p.tier === "special")
    .sort((a, b) => b.overall - a.overall);
  return [makeAbdullah(), ...specials].slice(0, n);
}

export default function PacksPage() {
  const { openPack } = useGame();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pulls, setPulls] = useState<Array<{ player: Player; fromPool: string }> | null>(null);
  const stars = useMemo(() => featuredSpecials(5), []);
  const potw = useMemo(() => featuredSpecials(8).slice(1, 4), []);

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
      <div className="flex h-[calc(100dvh-6.2rem)] w-full flex-col px-[clamp(0.5rem,1.2vw,1rem)]">
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2">
          <article className="relative flex flex-col overflow-hidden rounded-3xl border border-[#e7c56a]/45 bg-[#071820] shadow-[0_0_48px_rgba(231,197,106,0.18)]">
            <div className="relative min-h-0 flex-[1.35]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#3dff8a55_0%,#0a2a18_40%,#071820_72%)]" />
              <div className="absolute inset-0 bg-[repeating-radial-gradient(circle_at_center,#2bd67a25_0_2px,transparent_2px_20px)] opacity-60" />
              <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 text-center">
                <p className="text-[11px] font-bold tracking-[0.3em] text-[#e7c56a]">ÖZEL ÇEKİLİŞ</p>
                <p className="font-display text-2xl text-white">Çıkabilecek yıldızlar</p>
              </div>
              {/* Hero cards — large, centered fan */}
              <div className="absolute inset-x-0 bottom-2 top-14 flex items-end justify-center">
                {stars.map((p, i) => {
                  const mid = 2;
                  const offset = i - mid;
                  return (
                    <div
                      key={p.id}
                      className="absolute bottom-0 w-[min(22%,9.5rem)]"
                      style={{
                        left: `calc(50% + ${offset * 14}% - 11%)`,
                        transform: `translateY(${Math.abs(offset) * 14}px) rotate(${offset * 9}deg) scale(${i === mid ? 1.18 : 0.92})`,
                        zIndex: 10 - Math.abs(offset),
                        filter: "drop-shadow(0 18px 28px rgba(0,0,0,0.55))",
                      }}
                    >
                      <PlayerCard player={p} featured />
                    </div>
                  );
                })}
              </div>
              <span className="absolute right-3 top-3 z-20 rounded-md bg-black/60 px-2 py-1 text-[11px] text-white/85">
                Sınırlı: 50/50
              </span>
            </div>
            <div className="relative z-10 border-t border-white/10 bg-black/60 px-4 py-3">
              <p className="text-sm font-semibold text-[#9dffb0]">Epic · Big Time</p>
              <p className="font-display text-2xl">Özel Oyuncu Paketi</p>
              <p className="text-xs text-white/55">Bitmesine: 3 gün 5 sa · En yüksek OVR havuzu</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void open("coins")}
                  className="flex-1 rounded-full border border-[#e7c56a]/45 bg-[#2a3140] px-3 py-2.5 text-sm font-semibold hover:bg-[#343c4e]"
                >
                  x1 · {formatCoins(PACK_COST_COINS)} coin
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void open("gems")}
                  className="flex-1 rounded-full border border-[#7CFF4A]/4 bg-[#2a3140] px-3 py-2.5 text-sm font-semibold hover:bg-[#343c4e]"
                >
                  x10 · {PACK_COST_GEMS * 9} gem
                </button>
              </div>
            </div>
          </article>

          <article className="relative flex flex-col overflow-hidden rounded-3xl border border-white/12 bg-[#0a1a12]">
            <div className="relative min-h-0 flex-[1.35]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_35%,#3dff8a55,transparent_48%)]" />
              <div className="absolute inset-y-0 right-1 flex items-center font-display text-[6rem] leading-none text-[#7CFF4A]/25 sm:text-[8rem]">
                POTW
              </div>
              <div className="absolute inset-x-0 bottom-3 top-10 flex items-end justify-center gap-1 px-6">
                {potw.map((p, i) => (
                  <div
                    key={p.id}
                    className="w-[32%] max-w-[10rem]"
                    style={{
                      transform: `translateY(${i === 1 ? 0 : 18}px) rotate(${(i - 1) * 8}deg) scale(${i === 1 ? 1.08 : 0.95})`,
                      zIndex: i === 1 ? 3 : 1,
                      filter: "drop-shadow(0 14px 22px rgba(0,0,0,0.5))",
                    }}
                  >
                    <PlayerCard player={p} featured />
                  </div>
                ))}
              </div>
              <span className="absolute right-3 top-3 rounded-md bg-black/55 px-2 py-1 text-[11px] text-white/80">
                Sınırlı: 11/11
              </span>
            </div>
            <div className="relative z-10 border-t border-white/10 bg-black/55 px-4 py-3">
              <p className="text-sm font-semibold text-[#9dffb0]">POTW</p>
              <p className="font-display text-2xl">Haftanın Oyuncuları</p>
              <p className="text-xs text-orange-300">Kalan: 3 · Bitmesine: 3 gün 5 sa</p>
              <div className="mt-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void open("gems")}
                  className="w-full rounded-full border border-white/20 bg-[#2a3140] px-3 py-2.5 text-sm font-semibold"
                >
                  x1 · {PACK_COST_GEMS} gem
                </button>
              </div>
            </div>
          </article>
        </div>
        {err && <p className="mt-2 text-sm text-rose-300">{err}</p>}
        <p className="mt-2 text-[10px] text-white/40">
          * Kapaktaki kartlar çekilişte çıkabilecek en yüksek dereceli özel / Big Time oyuncuları gösterir.
        </p>
        {pulls && <PackOpen pulls={pulls} onClose={() => setPulls(null)} />}
      </div>
    </GameShell>
  );
}
