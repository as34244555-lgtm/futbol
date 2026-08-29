"use client";

import { FORMATION_SLOTS } from "@/lib/formations";
import type { Formation, Player, TeamPlayer } from "@/lib/types";
import { cn } from "@/lib/utils";
import { StadiumBowl } from "@/components/StadiumBowl";

type Roster = TeamPlayer & { player: Player };

export function TacticsPitch({
  formation,
  roster,
  selectedId,
  onSelectSlot,
  kit = "#3dff8a",
}: {
  formation: Formation;
  roster: Roster[];
  selectedId?: string | null;
  onSelectSlot?: (slotKey: string) => void;
  kit?: string;
}) {
  const slots = FORMATION_SLOTS[formation];
  const bySlot = new Map(roster.filter((r) => r.squad_position).map((r) => [r.squad_position, r]));

  return (
    <StadiumBowl>
    <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-xl">
      <svg viewBox="0 0 100 68" className="h-auto w-full bg-[#147a36]">
        <defs>
          <pattern id="grass" width="10" height="68" patternUnits="userSpaceOnUse">
            <rect width="5" height="68" fill="#157f38" />
            <rect x="5" width="5" height="68" fill="#117433" />
          </pattern>
        </defs>
        <rect width="100" height="68" fill="url(#grass)" />
        <g fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.35">
          <rect x="2" y="2" width="96" height="64" />
          <line x1="50" y1="2" x2="50" y2="66" />
          <circle cx="50" cy="34" r="8" />
          <circle cx="50" cy="34" r="0.7" fill="white" stroke="none" />
          <rect x="2" y="20.5" width="14" height="27" />
          <rect x="2" y="26.5" width="6" height="15" />
          <rect x="84" y="20.5" width="14" height="27" />
          <rect x="92" y="26.5" width="6" height="15" />
        </g>
        {slots.map((s) => {
          const holder = bySlot.get(s.key);
          const cx = s.x;
          const cy = (s.y / 100) * 68;
          const selected = holder && holder.id === selectedId;
          return (
            <g
              key={s.key}
              className={onSelectSlot ? "cursor-pointer" : undefined}
              onClick={() => onSelectSlot?.(s.key)}
            >
              <circle
                cx={cx}
                cy={cy}
                r={selected ? 5.2 : 4.4}
                fill={holder ? kit : "rgba(0,0,0,0.25)"}
                stroke={selected ? "#f0c14b" : "white"}
                strokeWidth={selected ? 0.7 : 0.35}
              />
              <text
                x={cx}
                y={cy + 0.8}
                textAnchor="middle"
                fontSize="3.2"
                fontWeight="700"
                fill={holder ? "#04110a" : "#fff"}
              >
                {holder ? holder.player.overall : s.label}
              </text>
              <text x={cx} y={cy + 8} textAnchor="middle" fontSize="2.4" fill="white">
                {holder ? holder.player.name.split(" ").slice(-1)[0] : s.position}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="absolute left-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-white">
        {formation}
      </p>
    </div>
    </StadiumBowl>
  );
}

export function MiniPitchMark({ className }: { className?: string }) {
  return <div className={cn("rounded-xl bg-[#147a36]", className)} />;
}
