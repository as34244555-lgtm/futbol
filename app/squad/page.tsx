"use client";

import { GameShell } from "@/components/GameShell";
import { TacticsPitch } from "@/components/TacticsPitch";
import { Button } from "@/components/ui/Button";
import { FORMATION_SLOTS } from "@/lib/formations";
import { useGame } from "@/lib/game-context";
import { flagUrl } from "@/lib/nations";
import { cardLiveOverall, squadChemistry } from "@/lib/meta";
import { rosterOf } from "@/lib/world";
import { useMemo, useState } from "react";

export default function SquadPage() {
  const { world, userTeam, assignSlot, autoPick } = useGame();
  const roster = useMemo(() => (userTeam ? rosterOf(world, userTeam.id) : []), [world, userTeam]);
  const [slot, setSlot] = useState<string | null>(null);
  const chem = useMemo(() => squadChemistry(roster, userTeam?.nation), [roster, userTeam?.nation]);

  if (!userTeam) return null;
  const slots = FORMATION_SLOTS[userTeam.formation];
  const collective = roster.reduce((sum, r) => sum + cardLiveOverall(r.player, r), 0);
  const starters = roster.filter((r) => r.is_starter);

  return (
    <GameShell flush>
      <div className="flex h-[calc(100dvh-6.2rem)] w-full">
        {/* Left icon strip */}
        <aside className="flex w-16 shrink-0 flex-col items-center gap-3 border-r border-white/10 bg-black/40 py-4 sm:w-20">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/90 text-black">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z"/></svg>
          </div>
          {userTeam.nation && (
            <img src={flagUrl(userTeam.nation, 80)} alt="" className="h-8 w-12 rounded-md object-cover ring-1 ring-white/30" />
          )}
          <div className="h-10 w-10 rounded-lg" style={{ background: userTeam.kit_primary }} />
          <div className="h-10 w-10 rounded-lg" style={{ background: userTeam.kit_secondary || "#1d4e9c" }} />
        </aside>

        {/* Center pitch — fills remaining width */}
        <section className="relative min-w-0 flex-1 px-3 py-2">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-white/90">{userTeam.formation}</span>
            <span className="text-white/70">Hızlı Kontratak</span>
          </div>
          <div className="h-[calc(100%-2rem)] overflow-hidden rounded-xl">
            <TacticsPitch
              fill
              formation={userTeam.formation}
              roster={roster}
              selectedId={roster.find((r) => r.squad_position === slot)?.id}
              onSelectSlot={setSlot}
              kit={userTeam.kit_primary}
            />
          </div>
          {slot && (
            <div className="absolute bottom-4 left-1/2 z-20 flex max-w-[90%] -translate-x-1/2 gap-2 overflow-x-auto rounded-xl bg-black/80 p-2">
              {roster
                .filter((r) => !r.is_starter || r.squad_position === slot)
                .slice(0, 12)
                .map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="shrink-0 rounded-lg border border-white/15 bg-[#121820] px-2 py-1 text-left text-xs"
                    onClick={() => {
                      void assignSlot(slot, r.id);
                      setSlot(null);
                    }}
                  >
                    <span className="block font-semibold">{r.player.name.split(" ").slice(-1)[0]}</span>
                    <span className="text-[#e7c56a]">{cardLiveOverall(r.player, r)}</span>
                  </button>
                ))}
            </div>
          )}
        </section>

        {/* Right collective power */}
        <aside className="flex w-[min(26%,280px)] shrink-0 flex-col border-l border-white/10 bg-black/40 px-4 py-4">
          <p className="text-sm text-white/70">Kolektif Güç</p>
          <p className="font-display text-5xl text-[#e7c56a]">{collective}</p>
          <p className="mt-2 text-xs text-white/50">Chemistry {chem.score} · İlk 11 {starters.length}/11</p>
          <p className="mt-1 text-xs text-white/45">{slots.length} mevki · {userTeam.formation}</p>
          <div className="mt-auto space-y-2">
            <Button className="w-full" variant="outline" onClick={() => void autoPick()}>
              Otomatik Seç
            </Button>
          </div>
        </aside>
      </div>
    </GameShell>
  );
}
