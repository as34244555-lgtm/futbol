"use client";

import { CardArt } from "@/components/Portrait";
import { PlayerInspect } from "@/components/scene/PlayerInspect";
import { cardRarity, displayOvr, EF_POS, RARITY_LABEL, RARITY_THEME } from "@/lib/card-rarity";
import { deriveAttrs } from "@/lib/career";
import { flagUrl } from "@/lib/nations";
import { marketValue } from "@/lib/ratings";
import { POSITION_LABEL, type KitStyle, type Player, type TeamPlayer } from "@/lib/types";
import { cn, formatCoins } from "@/lib/utils";
import { Box, RotateCcw, X } from "lucide-react";
import Image from "next/image";
import { useState, type PointerEvent, type ReactNode } from "react";

function AttrRow({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-[10px] uppercase tracking-wider text-white/70">
        <span>{label}</span>
        <span className="font-semibold text-white">{value}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/10">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

export function PlayerCard({
  player,
  row,
  selected,
  featured,
  onClick,
  footer,
  kit,
  kitSecondary,
  kitStyle,
  compact,
}: {
  player: Player;
  row?: TeamPlayer;
  selected?: boolean;
  featured?: boolean;
  onClick?: () => void;
  footer?: ReactNode;
  kit?: string;
  kitSecondary?: string;
  kitStyle?: KitStyle;
  compact?: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const [inspect, setInspect] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0, px: 50, py: 40 });
  const rarity = cardRarity(player);
  const theme = RARITY_THEME[rarity];
  const attrs = deriveAttrs(player);
  const hurt = (row?.injuryWeeks ?? 0) > 0;
  const growth = player.lastGrowth ?? 0;
  const pos = player.versatile ? "ALL" : EF_POS[player.position] ?? player.position;
  const ovr = displayOvr(player.overall);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (flipped) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * 100;
    const py = ((e.clientY - r.top) / r.height) * 100;
    setTilt({ x: (py - 50) / -4.5, y: (px - 50) / 4.5, px, py });
  };

  return (
    <div className={cn("w-full", featured && "max-w-none")}>
      <div
        className={cn(
          "ef-scene",
          onClick && "cursor-pointer",
          selected && "rounded-[1.15rem] ring-2 ring-neon ring-offset-2 ring-offset-ink-950",
        )}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onPointerMove={onMove}
        onPointerLeave={() => setTilt({ x: 0, y: 0, px: 50, py: 40 })}
        onKeyDown={(e) => {
          if (!onClick) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <div
          className={cn("ef-inner", flipped && "is-flipped")}
          style={
            flipped
              ? undefined
              : {
                  transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                  transition: "transform 80ms linear",
                }
          }
        >
          <div className={cn("ef-face overflow-hidden rounded-[1.05rem] bg-gradient-to-br p-[3px]", theme.frame, theme.glow)}>
            <div className="relative h-full overflow-hidden rounded-[0.92rem] bg-ink-950">
              <CardArt
                id={player.id}
                kit={kit}
                portrait={player.portrait}
                name={player.name}
                nation={player.nationality_code}
                age={player.age}
              />
              <span
                className={cn("ef-foil", `ef-foil-${rarity}`)}
                style={{ backgroundPosition: `${tilt.px}% ${tilt.py}%` }}
              />
              <span className="pointer-events-none absolute inset-0 rounded-[0.92rem] ring-1 ring-inset ring-white/20" />
              <div className="absolute left-2 top-2 z-10 min-w-[2.7rem] rounded-md bg-black/50 px-1.5 py-1 text-center backdrop-blur-[2px] ring-1 ring-white/10">
                <p className={cn("font-display leading-none", compact ? "text-2xl" : "text-3xl", theme.ovr)}>{ovr}</p>
                <p className="mt-0.5 text-[10px] font-bold tracking-[0.18em] text-white/85">{pos}</p>
              </div>
              <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1">
                <Image
                  src={flagUrl(player.nationality_code, 40)}
                  alt={player.nationality}
                  width={22}
                  height={15}
                  className="h-[15px] w-[22px] rounded-[2px] object-cover ring-1 ring-black/40"
                  unoptimized
                />
                <span className={cn("rounded px-1 py-0.5 text-[8px] font-black uppercase tracking-wider text-ink-950", theme.gem)}>
                  {RARITY_LABEL[rarity]}
                </span>
              </div>
              <div className={cn("absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t to-transparent p-2 pt-10", theme.plate)}>
                <p className={cn("truncate font-display uppercase leading-tight tracking-wide text-white", compact ? "text-sm" : "text-base")}>
                  {player.name}
                </p>
                <p className="truncate text-[10px] text-white/65">
                  {player.versatile ? "Tüm mevkiler" : POSITION_LABEL[player.position] ?? player.position} · {player.age} yaş
                  {hurt ? ` · Sakat ${row?.injuryWeeks}h` : ""}
                  {growth > 0 ? ` · +${growth}` : growth < 0 ? ` · ${growth}` : ""}
                </p>
              </div>
              <button
                type="button"
                aria-label="3D model"
                className="absolute bottom-2 right-9 z-20 rounded-full bg-black/45 p-1 text-white/80 hover:bg-black/70"
                onClick={(e) => {
                  e.stopPropagation();
                  setInspect(true);
                }}
              >
                <Box className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Kartı çevir"
                className="absolute bottom-2 right-2 z-20 rounded-full bg-black/45 p-1 text-white/80 hover:bg-black/70"
                onClick={(e) => {
                  e.stopPropagation();
                  setFlipped((v) => !v);
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className={cn("ef-face ef-back overflow-hidden rounded-[1.05rem] bg-gradient-to-br p-[3px]", theme.frame, theme.glow)}>
            <div className={cn("flex h-full flex-col rounded-[0.92rem] bg-ink-950/95 px-3 py-3", compact && "px-2 py-2")}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-display text-sm uppercase tracking-wide">{player.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {RARITY_LABEL[rarity]} · {pos} · {ovr}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Karta dön"
                  className="rounded-full bg-white/10 p-1 text-white/80 hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFlipped(false);
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-1.5">
                <AttrRow label="Tempo" value={attrs.pace} tone="bg-amber-300" />
                <AttrRow label="Bitiricilik" value={attrs.finishing} tone="bg-rose-400" />
                <AttrRow label="Pas" value={attrs.passing} tone="bg-violet-400" />
                <AttrRow label="Markaj" value={attrs.marking} tone="bg-sky-400" />
                {player.position === "KL" ? (
                  <AttrRow label="Kalecilik" value={attrs.handling} tone="bg-lime-400" />
                ) : row ? (
                  <AttrRow label="Form" value={row.form} tone="bg-gold" />
                ) : (
                  <AttrRow label="Kalecilik" value={attrs.handling} tone="bg-lime-400" />
                )}
                {row && <AttrRow label="Enerji" value={row.energy} tone="bg-neon" />}
              </div>
              <p className="mt-auto pt-2 text-[10px] leading-snug text-slate-500">
                Değer {formatCoins(marketValue(player, row?.form))} ₡
                {row?.wage != null ? ` · Maaş ${formatCoins(row.wage)} ₡/h` : ""}
                {row?.contractYears != null && row.contractYears < 90 ? ` · Sözleşme ${row.contractYears}s` : ""}
                {player.potential && player.potential < 100 && rarity !== "legend" ? ` · Tavan ${player.potential}` : ""}
              </p>
            </div>
          </div>
        </div>
      </div>
      {footer}
      {inspect && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => {
            e.stopPropagation();
            setInspect(false);
          }}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-ink-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <p className="font-display text-xl">{player.name} · 3D</p>
              <button type="button" className="rounded-full p-1 text-slate-400 hover:text-white" onClick={() => setInspect(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <PlayerInspect
              player={player}
              kit={kit}
              kitSecondary={kitSecondary}
              kitStyle={kitStyle}
              className="h-80 w-full"
            />
            <p className="px-4 py-3 text-xs text-slate-500">
              {RARITY_LABEL[rarity]} kart · {pos} · {ovr} genel. Model oyuncunun tohumundan çizilir.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
