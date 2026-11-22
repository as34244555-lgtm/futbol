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
      <div className="flex h-[calc(100dvh-6.2rem)] w-full flex-col px-[clamp(0.75rem,2vw,1.5rem)]">
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
          {/* Epic / özel çekiliş — kapakta en iyi özel kartlar */}
          <article className="relative flex flex-col overflow-hidden rounded-3xl border border-[#e7c56a]/35 bg-[#071820] shadow-[0_0_40px_rgba(231,197,106,0.12)]">
            <div className="relative min-h-0 flex-1">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#3dff8a44_0%,#0a2a18_42%,#071820_70%)]" />
              <div className="absolute inset-0 bg-[repeating-radial-gradient(circle_at_center,#2bd67a22_0_2px,transparent_2px_22px)] opacity-55" />
              <div className="absolute left-1/2 top-[8%] -translate-x-1/2 text-center">
                <p className="text-[11px] font-bold tracking-[0.28em] text-[#e7c56a]">ÖZEL ÇEKİLİŞ</p>
                <p className="font-display text-xl text-white/90">Çıkabilecek yıldızlar</p>
              </div>
              <div className="absolute inset-x-0 bottom-3 flex items-end justify-center px-3">
                {stars.map((p, i) => (
                  <div
                    key={p.id}
                    className="w-[18%] max-w-[6.2rem] shrink-0 drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)]"
                    style={{
                      marginLeft: i === 0 ? 0 : "-0.65rem",
                      transform: `translateY(${i === 2 ? 0 : 12 + Math.abs(i - 2) * 6}px) rotate(${(i - 2) * 7}deg) scale(${i === 2 ? 1.12 : 0.9})`,
                      zIndex: i === 2 ? 6 : 5 - Math.abs(i - 2),
                    }}
                  >
                    <PlayerCard player={p} compact featured />
                  </div>
                ))}
              </div>
              <span className="absolute right-3 top-3 rounded-md bg-black/55 px-2 py-1 text-[11px] text-white/85">
                Sınırlı Çekiliş: 50/50
              </span>
            </div>
            <div className="relative z-10 border-t border-white/10 bg-black/55 px-4 py-3">
              <p className="text-sm font-semibold text-[#9dffb0]">Epic · Big Time</p>
              <p className="font-display text-2xl">Özel Oyuncu Paketi</p>
              <p className="text-xs text-white/55">Bitmesine: 3 gün 5 sa · En yüksek OVR havuzu</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void open("coins")}
                  className="flex-1 rounded-full border border-[#e7c56a]/40 bg-[#2a3140] px-3 py-2 text-sm font-semibold hover:bg-[#343c4e]"
                >
                  x1 · {formatCoins(PACK_COST_COINS)} coin
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void open("gems")}
                  className="flex-1 rounded-full border border-[#7CFF4A]/35 bg-[#2a3140] px-3 py-2 text-sm font-semibold hover:bg-[#343c4e]"
                >
                  x10 · {PACK_COST_GEMS * 9} gem
                </button>
              </div>
            </div>
          </article>

          {/* POTW */}
          <article className="relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0a1a12]">
            <div className="relative min-h-0 flex-1">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,#3dff8a55,transparent_45%)]" />
              <div className="absolute inset-y-0 right-2 flex items-center gap-0 font-display text-[5.5rem] leading-none text-[#7CFF4A]/28 sm:text-[7rem]">
                <span>P</span>
                <span>O</span>
                <span>T</span>
                <span>W</span>
              </div>
              <div className="absolute bottom-4 left-6 flex items-end -space-x-5">
                {potw.map((p, i) => (
                  <div
                    key={p.id}
                    className="w-[5.5rem] shrink-0 sm:w-[6.5rem]"
                    style={{ zIndex: potw.length - i, transform: `rotate(${(i - 1) * 7}deg)` }}
                  >
                    <PlayerCard player={p} compact featured />
                  </div>
                ))}
              </div>
              <span className="absolute right-3 top-3 rounded-md bg-black/50 px-2 py-1 text-[11px] text-white/80">
                Sınırlı Çekiliş: 11/11
              </span>
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
        <p className="mt-2 text-[10px] text-white/40">
          * Kapaktaki kartlar çekilişte çıkabilecek en yüksek dereceli özel / Big Time oyuncuları gösterir.
        </p>
        {pulls && <PackOpen pulls={pulls} onClose={() => setPulls(null)} />}
      </div>
    </GameShell>
  );
}
