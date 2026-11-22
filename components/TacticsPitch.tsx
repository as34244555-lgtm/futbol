"use client";

import { FORMATION_SLOTS } from "@/lib/formations";
import type { Formation, Player, TeamPlayer } from "@/lib/types";
import { cardLiveOverall } from "@/lib/meta";
import { cn } from "@/lib/utils";
import { Portrait } from "@/components/Portrait";

type Roster = TeamPlayer & { player: Player };

export function TacticsPitch({
  formation,
  roster,
  selectedId,
  onSelectSlot,
  kit = "#3dff8a",
  fill = false,
}: {
  formation: Formation;
  roster: Roster[];
  selectedId?: string | null;
  onSelectSlot?: (slotKey: string) => void;
  kit?: string;
  /** Fill parent height for landscape eFootball game-plan */
  fill?: boolean;
}) {
  const slots = FORMATION_SLOTS[formation];
  const bySlot = new Map(roster.filter((r) => r.squad_position).map((r) => [r.squad_position, r]));

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/10 bg-[#147a36] shadow-xl",
        fill ? "h-full w-full" : "aspect-[100/68] w-full",
      )}
    >
      <div
        className="absolute inset-0 opacity-90"
        style={{ background: "repeating-linear-gradient(0deg,#157f38 0 28px,#117433 28px 56px)" }}
      />
      {/* Vertical pitch markings (attack up) */}
      <div className="pointer-events-none absolute inset-[2.5%] rounded-sm border border-white/40">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/40" />
        <div className="absolute left-1/2 top-1/2 h-[10%] w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" />
        <div className="absolute bottom-0 left-1/2 h-[18%] w-[55%] -translate-x-1/2 border border-b-0 border-white/40" />
        <div className="absolute top-0 left-1/2 h-[18%] w-[55%] -translate-x-1/2 border border-t-0 border-white/40" />
      </div>

      {slots.map((s) => {
        const holder = bySlot.get(s.key);
        const selected = holder && holder.id === selectedId;
        const ovr = holder ? cardLiveOverall(holder.player, holder) : null;
        // Formation x = attack depth (10 GK … 80 ST), y = lateral (0–100)
        const left = s.y;
        const top = 100 - s.x;
        return (
          <button
            key={s.key}
            type="button"
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${left}%`, top: `${top}%` }}
            onClick={() => onSelectSlot?.(s.key)}
          >
            {holder ? (
              <span
                className={cn(
                  "flex w-[clamp(3.2rem,6.5vw,4.8rem)] flex-col overflow-hidden rounded-md border bg-black/55 shadow-lg backdrop-blur-sm",
                  selected ? "border-[#e7c56a] ring-2 ring-[#e7c56a]/60" : "border-white/25",
                )}
              >
                <span className="relative flex aspect-[4/5] w-full items-center justify-center bg-gradient-to-b from-[#1a2433] to-[#0a1018]">
                  <Portrait
                    id={holder.player.id}
                    size={56}
                    kit={kit}
                    nation={holder.player.nationality_code}
                    age={holder.player.age}
                    portrait={holder.player.portrait}
                  />
                  <span
                    className="absolute left-0.5 top-0.5 rounded px-1 text-[9px] font-black text-black sm:text-[10px]"
                    style={{ background: kit }}
                  >
                    {s.label}
                  </span>
                  <span className="absolute bottom-0.5 right-0.5 rounded bg-black/75 px-1 text-[10px] font-bold text-[#e7c56a] sm:text-[11px]">
                    {ovr}
                  </span>
                </span>
                <span className="truncate px-0.5 py-0.5 text-center text-[9px] font-semibold leading-tight text-white sm:text-[10px]">
                  {holder.player.name.split(" ").slice(-1)[0]}
                </span>
              </span>
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-white/40 bg-black/30 text-[10px] font-bold text-white/80 sm:h-12 sm:w-12">
                {s.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function MiniPitchMark({ className }: { className?: string }) {
  return <div className={cn("rounded-xl bg-[#147a36]", className)} />;
}
