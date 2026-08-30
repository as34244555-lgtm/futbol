"use client";

import Image from "next/image";
import { OverallBadge, PositionChip, StatBar } from "@/components/ui/Stats";
import { flagUrl } from "@/lib/nations";
import { POSITION_LABEL } from "@/lib/types";
import type { Player, TeamPlayer } from "@/lib/types";
import { formatCoins } from "@/lib/utils";
import { marketValue } from "@/lib/ratings";
import { cn } from "@/lib/utils";

export function PlayerCard({
  player,
  row,
  selected,
  featured,
  onClick,
  footer,
}: {
  player: Player;
  row?: TeamPlayer;
  selected?: boolean;
  featured?: boolean;
  onClick?: () => void;
  footer?: React.ReactNode;
}) {
  const legend = Boolean(player.legend) || player.overall >= 100;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border bg-ink-800/80 p-3 text-left transition hover:border-neon/40",
        selected ? "border-neon shadow-glow" : "border-white/10",
        (featured || legend) && "border-gold bg-ink-900/95 p-4 shadow-gold",
      )}
    >
      <div className="flex items-start gap-3">
        {player.portrait ? (
          <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-gold/50">
            <Image src={player.portrait} alt={player.name} fill className="object-cover" sizes="44px" />
          </span>
        ) : (
          <OverallBadge overall={player.overall} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Image
              src={flagUrl(player.nationality_code, 40)}
              alt={player.nationality}
              width={20}
              height={14}
              className="h-3.5 w-5 rounded-sm object-cover"
              unoptimized
            />
            <p className="truncate font-semibold">{player.name}</p>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            {player.versatile ? "Tüm mevkiler" : POSITION_LABEL[player.position]} · {player.age} yaş · {player.nationality}
            {legend ? " · Efsane" : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {player.portrait && <OverallBadge overall={player.overall} />}
          <PositionChip position={player.position} versatile={player.versatile} />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <StatBar value={player.attack} label="Hücum" color="bg-rose-400" />
        <StatBar value={player.defense} label="Savunma" color="bg-sky-400" />
        {row && (
          <>
            <StatBar value={row.energy} label="Enerji" color="bg-neon" />
            <StatBar value={row.form} label="Form" color="bg-gold" />
          </>
        )}
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        Değer {formatCoins(marketValue(player, row?.form))} ₡
      </p>
      {footer}
    </button>
  );
}
