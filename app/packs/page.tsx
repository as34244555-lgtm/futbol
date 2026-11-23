"use client";

import { GameShell } from "@/components/GameShell";
import { PackOpen } from "@/components/PackOpen";
import { PackPortraitCard } from "@/components/PackPortraitCard";
import { rosterPlayers } from "@/lib/catalog";
import { useGame } from "@/lib/game-context";
import { PACK_COST_COINS, PACK_COST_GEMS } from "@/lib/meta";
import type { Player } from "@/lib/types";
import { formatCoins } from "@/lib/utils";
import { useMemo, useState } from "react";

function byOvr(a: Player, b: Player) {
  return b.overall - a.overall;
}

function mixCover(specials: Player[], standards: Player[], pattern: Array<"s" | "n">): Player[] {
  let si = 0;
  let ni = 0;
  return pattern.map((kind) => {
    if (kind === "s") return specials[si++] ?? standards[ni++]!;
    return standards[ni++] ?? specials[si++]!;
  });
}

type PackKind = "epic" | "potw" | "standard" | "featured";

type PackDef = {
  id: string;
  kind: PackKind;
  kicker: string;
  title: string;
  subtitle: string;
  limit: string;
  timer: string;
  players: Player[];
  pay: "coins" | "gems" | "both";
};

function PackBanner({
  pack,
  busy,
  onOpen,
}: {
  pack: PackDef;
  busy: boolean;
  onOpen: (pay: "coins" | "gems") => void;
}) {
  const mid = Math.floor(pack.players.length / 2);
  const tint =
    pack.kind === "epic"
      ? "border-[#e7c56a]/45 bg-[#06141c]"
      : pack.kind === "potw"
        ? "border-[#7CFF4A]/25 bg-[#071a12]"
        : pack.kind === "featured"
          ? "border-[#5ec8ff]/35 bg-[#061828]"
          : "border-white/15 bg-[#0c1018]";

  return (
    <article
      className={`relative flex h-full min-h-0 w-[min(92vw,34rem)] shrink-0 snap-center flex-col overflow-hidden rounded-[1.35rem] border shadow-[0_20px_50px_rgba(0,0,0,0.45)] sm:w-[min(46vw,36rem)] ${tint}`}
    >
      <div className="relative min-h-0 flex-1">
        {pack.kind === "epic" && (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#3dff8a55_0%,#0a2a18_38%,#06141c_72%)]" />
            <div className="absolute inset-0 bg-[repeating-radial-gradient(circle_at_center,#2bd67a28_0_2px,transparent_2px_18px)] opacity-70" />
          </>
        )}
        {pack.kind === "potw" && (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,#3dff8a50,transparent_50%),linear-gradient(135deg,#0a1f14,#06140e)]" />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 font-display text-[6.5rem] leading-none text-[#7CFF4A]/22 sm:text-[8rem]">
              POTW
            </div>
          </>
        )}
        {pack.kind === "standard" && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#4a5a70aa,transparent_55%),linear-gradient(160deg,#121820,#080b10)]" />
        )}
        {pack.kind === "featured" && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,#3aa0ff55,transparent_50%),linear-gradient(145deg,#0a1a2e,#041018)]" />
        )}

        <div className="absolute left-4 top-3 z-20 sm:left-5">
          <p
            className={`text-[11px] font-bold tracking-[0.28em] ${
              pack.kind === "epic"
                ? "text-[#e7c56a]"
                : pack.kind === "featured"
                  ? "text-[#7eb6ff]"
                  : "text-[#9dffb0]"
            }`}
          >
            {pack.kicker}
          </p>
          <p className="font-display text-2xl text-white drop-shadow sm:text-3xl">{pack.title}</p>
        </div>
        <span className="absolute right-3 top-3 z-20 rounded-md bg-black/55 px-2 py-1 text-[11px] text-white/85 backdrop-blur-sm">
          {pack.limit}
        </span>

        <div className="absolute inset-x-0 bottom-[2%] top-[11%] flex items-center justify-center overflow-hidden">
          {pack.players.map((p, i) => {
            const offset = i - mid;
            const isHero = i === mid;
            const cardH = isHero ? "min(58vh, 26rem)" : "min(48vh, 21rem)";
            return (
              <div
                key={`${pack.id}-${p.id}-${i}`}
                className="absolute"
                style={{
                  height: cardH,
                  aspectRatio: "5 / 7",
                  left: `calc(50% + ${offset * 10.5}vw)`,
                  top: "50%",
                  transform: `translate(-50%, -50%) translateY(${Math.abs(offset) * 1.1}vh) rotate(${offset * 5.5}deg)`,
                  zIndex: 20 - Math.abs(offset),
                  filter: "drop-shadow(0 22px 36px rgba(0,0,0,0.72))",
                }}
              >
                <PackPortraitCard player={p} hero={isHero} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 shrink-0 border-t border-white/10 bg-black/70 px-4 py-2.5 backdrop-blur-md">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-[#9dffb0]">{pack.subtitle}</p>
            <p className="font-display text-xl leading-tight sm:text-2xl">{pack.title}</p>
            <p className="text-[11px] text-white/55">{pack.timer}</p>
          </div>
          <div className="flex min-w-[12rem] gap-2">
            {(pack.pay === "coins" || pack.pay === "both") && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onOpen("coins")}
                className="flex-1 rounded-full border border-[#e7c56a]/45 bg-[#2a3140] px-3 py-2 text-sm font-semibold hover:bg-[#343c4e]"
              >
                x1 · {formatCoins(PACK_COST_COINS)} coin
              </button>
            )}
            {(pack.pay === "gems" || pack.pay === "both") && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onOpen("gems")}
                className="flex-1 rounded-full border border-[#7CFF4A]/4 bg-[#2a3140] px-3 py-2 text-sm font-semibold hover:bg-[#343c4e]"
              >
                x1 · {PACK_COST_GEMS} gem
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function PacksPage() {
  const { openPack } = useGame();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pulls, setPulls] = useState<Array<{ player: Player; fromPool: string }> | null>(null);

  const packs = useMemo(() => {
    const all = rosterPlayers();
    const specials = all.filter((p) => p.tier === "special" && p.position !== "KL").sort(byOvr);
    const standards = all.filter((p) => p.tier === "standard").sort(byOvr);
    const defs: PackDef[] = [
      {
        id: "epic",
        kind: "epic",
        kicker: "ÖZEL ÇEKİLİŞ",
        title: "Özel Oyuncu Paketi",
        subtitle: "Epic · Showtime",
        limit: "Sınırlı: 50/50",
        timer: "Bitmesine: 3 gün 5 sa",
        // özel ağırlıklı; kenarlarda standart
        players: mixCover(specials, standards, ["n", "s", "s", "s", "n"]),
        pay: "both",
      },
      {
        id: "potw",
        kind: "potw",
        kicker: "POTW",
        title: "Haftanın Oyuncuları",
        subtitle: "National Selection",
        limit: "Sınırlı: 11/11",
        timer: "Kalan: 3 · Bitmesine: 3 gün 5 sa",
        // ortada özel, yanlarda standart
        players: mixCover(specials.slice(1), standards.slice(1), ["n", "s", "n"]),
        pay: "gems",
      },
      {
        id: "standard",
        kind: "standard",
        kicker: "STANDART",
        title: "Standart Oyuncu Paketi",
        subtitle: "Bronze · Gold",
        limit: "Sınırsız",
        timer: "Her zaman açık",
        // ortada standart; kenarda 1 özel
        players: mixCover(specials.slice(4), standards, ["n", "n", "n", "n", "s"]),
        pay: "coins",
      },
      {
        id: "featured",
        kind: "featured",
        kicker: "FEATURED",
        title: "Öne Çıkanlar",
        subtitle: "Featured Mix",
        limit: "Sınırlı: 30/30",
        timer: "Bitmesine: 5 gün 12 sa",
        // karışık: standart hero
        players: mixCover(specials.slice(2), standards.slice(3), ["s", "n", "n", "s"]),
        pay: "both",
      },
    ];
    return defs;
  }, []);

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
        <div className="flex min-h-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {packs.map((pack) => (
            <PackBanner key={pack.id} pack={pack} busy={busy} onOpen={(pay) => void open(pay)} />
          ))}
        </div>
        {err && <p className="text-sm text-rose-300">{err}</p>}
        <p className="text-[10px] text-white/40">
          * Kapakta özel ve standart oyuncular birlikte gösterilir. Kaydırarak diğer paketleri gör.
        </p>
        {pulls && <PackOpen pulls={pulls} onClose={() => setPulls(null)} />}
      </div>
    </GameShell>
  );
}
