"use client";

import { CardArt } from "@/components/Portrait";
import { cardRarity, displayOvr, EF_POS, RARITY_THEME } from "@/lib/card-rarity";
import { flagUrl } from "@/lib/nations";
import type { Player } from "@/lib/types";
import { cn } from "@/lib/utils";
import Image from "next/image";

/** eFootball ürün kapağı — süslü portre futbolcu kartı. */
export function PackPortraitCard({
  player,
  className,
  hero = false,
}: {
  player: Player;
  className?: string;
  hero?: boolean;
}) {
  const rarity = cardRarity(player);
  const theme = RARITY_THEME[rarity];
  const pos = player.versatile ? "ALL" : EF_POS[player.position] ?? player.position;
  const ovr = displayOvr(player.overall);
  const surname = player.name.split(" ").slice(-1)[0] ?? player.name;
  const isSpecial = player.tier === "special" || Boolean(player.legend);

  return (
    <div className={cn("relative h-full w-full select-none", className)}>
      <div
        className={cn(
          "relative h-full w-full overflow-hidden rounded-[1.2rem] bg-gradient-to-br p-[3px]",
          theme.frame,
          theme.glow,
          hero && "ring-2 ring-white/30",
        )}
      >
        <div className="relative h-full overflow-hidden rounded-[1.05rem] bg-[#060910]">
          {/* Decorative top crest bar */}
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 z-20 h-7 bg-gradient-to-b opacity-95",
              isSpecial ? "from-[#e7c56a]/35 via-transparent to-transparent" : "from-white/15 via-transparent to-transparent",
            )}
          />
          <div className="pointer-events-none absolute left-1/2 top-1 z-20 h-2 w-16 -translate-x-1/2 rounded-b-full bg-gradient-to-r from-transparent via-[#e7c56a] to-transparent opacity-80" />

          {/* Filigree border */}
          <div
            className="pointer-events-none absolute inset-[4px] z-10 rounded-[0.95rem]"
            style={{
              border: "1px solid rgba(255,255,255,0.22)",
              boxShadow: "inset 0 0 0 1px rgba(231,197,106,0.25), inset 0 0 28px rgba(0,0,0,0.5)",
            }}
          />

          {/* Corner flourishes */}
          <svg className="pointer-events-none absolute left-1 top-1 z-20 h-6 w-6 text-[#e7c56a]/80" viewBox="0 0 24 24" fill="none">
            <path d="M3 14 V4 H13" stroke="currentColor" strokeWidth="2" />
            <circle cx="4" cy="5" r="1.4" fill="currentColor" />
          </svg>
          <svg className="pointer-events-none absolute right-1 top-1 z-20 h-6 w-6 text-[#e7c56a]/80" viewBox="0 0 24 24" fill="none">
            <path d="M21 14 V4 H11" stroke="currentColor" strokeWidth="2" />
            <circle cx="20" cy="5" r="1.4" fill="currentColor" />
          </svg>
          <svg className="pointer-events-none absolute bottom-1 left-1 z-20 h-6 w-6 text-[#e7c56a]/65" viewBox="0 0 24 24" fill="none">
            <path d="M3 10 V20 H13" stroke="currentColor" strokeWidth="2" />
          </svg>
          <svg className="pointer-events-none absolute bottom-1 right-1 z-20 h-6 w-6 text-[#e7c56a]/65" viewBox="0 0 24 24" fill="none">
            <path d="M21 10 V20 H11" stroke="currentColor" strokeWidth="2" />
          </svg>

          {/* Side wing ornaments */}
          <span className="pointer-events-none absolute left-0 top-[28%] z-20 h-[32%] w-1.5 rounded-r-full bg-gradient-to-b from-transparent via-[#e7c56a]/70 to-transparent" />
          <span className="pointer-events-none absolute right-0 top-[28%] z-20 h-[32%] w-1.5 rounded-l-full bg-gradient-to-b from-transparent via-[#e7c56a]/70 to-transparent" />

          <CardArt
            id={player.id}
            portrait={player.portrait}
            name={player.name}
            nation={player.nationality_code}
            age={player.age}
          />

          <span className={cn("ef-foil ef-foil-shine", `ef-foil-${rarity}`)} />
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,transparent_30%,rgba(0,0,0,0.58)_100%)]" />

          {/* Special spark accents */}
          {isSpecial && (
            <>
              <span className="pointer-events-none absolute -right-2 top-10 h-16 w-16 rounded-full bg-[#ff5a7a]/25 blur-2xl" />
              <span className="pointer-events-none absolute -left-3 bottom-16 h-14 w-14 rounded-full bg-[#c084fc]/20 blur-2xl" />
            </>
          )}

          {/* OVR badge */}
          <div className="absolute left-2 top-2.5 z-30">
            <div className="relative flex min-w-[3rem] flex-col items-center overflow-hidden rounded-md px-1.5 py-1 ring-1 ring-white/30">
              <span className={cn("absolute inset-0 opacity-90", theme.gem)} />
              <span className="absolute inset-0 bg-gradient-to-b from-white/25 to-black/35" />
              <p className="relative font-display text-[1.7rem] leading-none text-ink-950 drop-shadow">{ovr}</p>
              <p className="relative mt-0.5 text-[9px] font-black tracking-[0.18em] text-ink-950/85">{pos}</p>
            </div>
          </div>

          <div className="absolute right-2 top-2.5 z-30 flex flex-col items-end gap-1">
            <Image
              src={flagUrl(player.nationality_code, 48)}
              alt=""
              width={26}
              height={17}
              className="h-[17px] w-[26px] rounded-[2px] object-cover ring-1 ring-black/50"
              unoptimized
            />
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-ink-950 shadow",
                theme.gem,
              )}
            >
              {isSpecial ? (rarity === "showtime" ? "SHOWTIME" : "EPIC") : "STANDARD"}
            </span>
          </div>

          {/* Ornate name plate */}
          <div className={cn("absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t to-transparent px-2 pb-2.5 pt-14", theme.plate)}>
            <div className="mb-1.5 flex items-center gap-1">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#e7c56a]/80" />
              <span className="h-1.5 w-1.5 rotate-45 bg-[#e7c56a]" />
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#e7c56a]/80" />
            </div>
            <p className="truncate text-center font-display text-[1rem] uppercase leading-tight tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {surname}
            </p>
            <p className="mt-0.5 text-center text-[10px] tracking-[0.28em] text-[#f5c542]">
              {"★".repeat(player.overall >= 84 ? 5 : player.overall >= 76 ? 4 : 3)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
