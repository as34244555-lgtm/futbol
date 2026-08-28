"use client";

import { GameShell } from "@/components/GameShell";
import { PlayerCard } from "@/components/PlayerCard";
import { TacticsPitch } from "@/components/TacticsPitch";
import { Button } from "@/components/ui/Button";
import { FORMATION_SLOTS } from "@/lib/formations";
import { useGame } from "@/lib/game-context";
import { POSITION_LABEL } from "@/lib/types";
import { rosterOf } from "@/lib/world";
import { useMemo, useState } from "react";

export default function SquadPage() {
  const { world, userTeam, assignSlot, autoPick, listForSale } = useGame();
  const roster = useMemo(() => (userTeam ? rosterOf(world, userTeam.id) : []), [world, userTeam]);
  const [slot, setSlot] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [price, setPrice] = useState(1000);
  const [msg, setMsg] = useState<string | null>(null);

  if (!userTeam) return null;
  const slots = FORMATION_SLOTS[userTeam.formation];
  const listed = new Set(
    world.listings.filter((l) => l.status === "active").map((l) => l.team_player_id),
  );

  return (
    <GameShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Kadro</p>
          <h1 className="font-display text-5xl">İlk 11 ve yedekler</h1>
        </div>
        <Button onClick={autoPick} variant="outline">
          Otomatik diziliş
        </Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <TacticsPitch
          formation={userTeam.formation}
          roster={roster}
          selectedId={roster.find((r) => r.squad_position === slot)?.id}
          onSelectSlot={setSlot}
          kit={userTeam.kit_primary}
        />
        <div>
          <p className="mb-3 text-sm text-slate-400">
            {slot
              ? `Saha noktası: ${slots.find((s) => s.key === slot)?.label}. Bir oyuncu seçin.`
              : "Oyuncu yerleştirmek için sahadaki bir noktaya tıklayın."}
          </p>
          {msg && <p className="mb-3 text-sm text-gold">{msg}</p>}
          <div className="max-h-[640px] space-y-3 overflow-y-auto pr-1">
            {roster.map((r) => (
              <div key={r.id} className="space-y-2">
                <PlayerCard
                  player={r.player}
                  row={r}
                  selected={selected === r.id}
                  onClick={() => {
                    setSelected(r.id);
                    if (slot) {
                      assignSlot(slot, r.id);
                      setSlot(null);
                    }
                  }}
                  footer={
                    <p className="mt-2 text-[11px] text-slate-500">
                      {r.is_starter ? `İlk 11 · ${r.squad_position}` : "Yedek"}
                      {listed.has(r.id) ? " · Listede" : ""}
                    </p>
                  }
                />
                {selected === r.id && (
                  <div className="flex items-center gap-2 px-1">
                    <input
                      type="number"
                      min={1}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-32 rounded-lg border border-white/10 bg-ink-800 px-2 py-1 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="gold"
                      onClick={() => {
                        const err = listForSale(r.id, price);
                        setMsg(err ?? `${r.player.name} transfer listesine eklendi.`);
                      }}
                    >
                      Satışa çıkar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap gap-2 text-xs text-slate-500">
        {(["KL", "DEF", "OS", "FV"] as const).map((p) => (
          <span key={p} className="rounded-full bg-white/5 px-3 py-1">
            {POSITION_LABEL[p]}: {roster.filter((r) => r.player.position === p).length}
          </span>
        ))}
      </div>
    </GameShell>
  );
}
