"use client";

import { GameShell } from "@/components/GameShell";
import { PackOpen } from "@/components/PackOpen";
import { PlayerCard } from "@/components/PlayerCard";
import { rosterPlayers } from "@/lib/catalog";
import { useGame } from "@/lib/game-context";
import { PACK_COST_COINS, PACK_COST_GEMS } from "@/lib/meta";
import type { Player } from "@/lib/types";
import { formatCoins } from "@/lib/utils";
import { useMemo, useState } from "react";

function featuredSpecials(n = 5): Player[] {
  return rosterPlayers()
    .filter((p) => p.tier === "special")
    .sort((a, b) => b.overall - a.overall)
    .slice(0, n);
}

function PackBanner({
  kind,
  players,
  title,
  kicker,
  limit,
  footer,
}: {
  kind: "epic" | "potw";
  players: Player[];
  title: string;
  kicker: string;
  limit: string;
  footer: React.ReactNode;
}) {
  const mid = Math.floor(players.length / 2);
  return (
    <article
      className={`relative flex min-h-0 flex-col overflow-hidden rounded-[1.35rem] border shadow-[0_20px_50px_rgba(0,0,0,0.45)] ${
        kind === "epic" ? "border-[#e7c56a]/45 bg-[#06141c]" : "border-white/12 bg-[#071a12]"
      }`}
    >
      {/* Full art plane — cards fill almost entire panel */}
      <div className="relative min-h-0 flex-1">
        {kind === "epic" ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#3dff8a55_0%,#0a2a18_38%,#06141c_72%)]" />
            <div className="absolute inset-0 bg-[repeating-radial-gradient(circle_at_center,#2bd67a28_0_2px,transparent_2px_18px)] opacity-70" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,#3dff8a50,transparent_50%),linear-gradient(135deg,#0a1f14,#06140e)]" />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 font-display text-[7.5rem] leading-none text-[#7CFF4A]/22 sm:text-[9rem]">
              POTW
            </div>
          </>
        )}

        <div className="absolute left-4 top-3 z-20 sm:left-5">
          <p className={`text-[11px] font-bold tracking-[0.28em] ${kind === "epic" ? "text-[#e7c56a]" : "text-[#9dffb0]"}`}>
            {kicker}
          </p>
          <p className="font-display text-2xl text-white drop-shadow sm:text-3xl">{title}</p>
        </div>
        <span className="absolute right-3 top-3 z-20 rounded-md bg-black/55 px-2 py-1 text-[11px] text-white/85 backdrop-blur-sm">
          {limit}
        </span>

        {/* Cards fill the art plane like eFootball product covers */}
        <div className="absolute inset-x-0 bottom-[3%] top-[12%] flex items-center justify-center overflow-hidden">
          {players.map((p, i) => {
            const offset = i - mid;
            const isHero = i === mid;
            const cardH = kind === "epic" ? (isHero ? "min(62vh, 28rem)" : "min(52vh, 23rem)") : isHero ? "min(60vh, 26rem)" : "min(50vh, 22rem)";
            return (
              <div
                key={p.id}
                className="absolute"
                style={{
                  height: cardH,
                  width: `calc(${cardH} * 5 / 7)`,
                  left: `calc(50% + ${offset * (kind === "epic" ? 11 : 14)}vw)`,
                  top: "50%",
                  transform: `translate(-50%, -50%) translateY(${Math.abs(offset) * 1.2}vh) rotate(${offset * (kind === "epic" ? 6 : 5)}deg)`,
                  zIndex: 20 - Math.abs(offset),
                  filter: "drop-shadow(0 24px 40px rgba(0,0,0,0.7))",
                }}
              >
                <PlayerCard player={p} featured />
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 shrink-0 border-t border-white/10 bg-black/70 px-4 py-2.5 backdrop-blur-md">
        {footer}
      </div>
    </article>
  );
}

export default function PacksPage() {
  const { openPack } = useGame();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pulls, setPulls] = useState<Array<{ player: Player; fromPool: string }> | null>(null);
  const stars = useMemo(() => featuredSpecials(5), []);
  const potw = useMemo(() => featuredSpecials(6).slice(0, 3), []);

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
      <div className="flex h-[calc(100dvh-6.2rem)] w-full flex-col gap-2 px-[clamp(0.4rem,1vw,0.85rem)] pb-1">
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2">
          <PackBanner
            kind="epic"
            players={stars}
            kicker="ÖZEL ÇEKİLİŞ"
            title="Çıkabilecek yıldızlar"
            limit="Sınırlı: 50/50"
            footer={
              <>
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#9dffb0]">Epic · Showtime</p>
                    <p className="font-display text-xl leading-tight sm:text-2xl">Özel Oyuncu Paketi</p>
                    <p className="text-[11px] text-white/55">Bitmesine: 3 gün 5 sa</p>
                  </div>
                  <div className="flex min-w-[14rem] flex-1 gap-2 sm:max-w-md">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void open("coins")}
                      className="flex-1 rounded-full border border-[#e7c56a]/45 bg-[#2a3140] px-3 py-2 text-sm font-semibold hover:bg-[#343c4e]"
                    >
                      x1 · {formatCoins(PACK_COST_COINS)} coin
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void open("gems")}
                      className="flex-1 rounded-full border border-[#7CFF4A]/4 bg-[#2a3140] px-3 py-2 text-sm font-semibold hover:bg-[#343c4e]"
                    >
                      x10 · {PACK_COST_GEMS * 9} gem
                    </button>
                  </div>
                </div>
              </>
            }
          />

          <PackBanner
            kind="potw"
            players={potw}
            kicker="POTW"
            title="Haftanın Oyuncuları"
            limit="Sınırlı: 11/11"
            footer={
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[#9dffb0]">POTW</p>
                  <p className="font-display text-xl leading-tight sm:text-2xl">National Selection</p>
                  <p className="text-[11px] text-orange-300">Kalan: 3 · Bitmesine: 3 gün 5 sa</p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void open("gems")}
                  className="min-w-[10rem] rounded-full border border-white/20 bg-[#2a3140] px-5 py-2 text-sm font-semibold"
                >
                  x1 · {PACK_COST_GEMS} gem
                </button>
              </div>
            }
          />
        </div>
        {err && <p className="text-sm text-rose-300">{err}</p>}
        <p className="text-[10px] text-white/40">
          * Kapaktaki genel dereceler, oyuncuların olası en yüksek derecelerini yansıtır.
        </p>
        {pulls && <PackOpen pulls={pulls} onClose={() => setPulls(null)} />}
      </div>
    </GameShell>
  );
}
