"use client";

import { GameShell } from "@/components/GameShell";
import { TacticsPitch } from "@/components/TacticsPitch";
import { Button } from "@/components/ui/Button";
import { TACTIC_MOD } from "@/lib/formations";
import { useGame } from "@/lib/game-context";
import { FORMATIONS as FORMATION_LIST, TACTIC_LABEL, TACTICS } from "@/lib/types";
import { rosterOf } from "@/lib/world";
import { useMemo } from "react";

export default function TacticsPage() {
  const { world, userTeam, setFormation, setTactics } = useGame();
  const roster = useMemo(() => (userTeam ? rosterOf(world, userTeam.id) : []), [world, userTeam]);
  if (!userTeam) return null;
  const mod = TACTIC_MOD[userTeam.tactics];

  return (
    <GameShell>
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Taktik tahtası</p>
      <h1 className="font-display mb-6 text-4xl sm:text-5xl">Diziliş ve oyun planı</h1>
      <div className="grid gap-8 lg:grid-cols-2">
        <TacticsPitch formation={userTeam.formation} roster={roster} kit={userTeam.kit_primary} />
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm text-slate-400">Formasyon</p>
            <div className="flex flex-wrap gap-2">
              {FORMATION_LIST.map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={userTeam.formation === f ? "primary" : "ghost"}
                  onClick={() => void setFormation(f)}
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm text-slate-400">Oyun stili</p>
            <div className="flex flex-wrap gap-2">
              {TACTICS.map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={userTeam.tactics === t ? "gold" : "ghost"}
                  onClick={() => void setTactics(t)}
                >
                  {TACTIC_LABEL[t]}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Mod label="Hücum" value={mod.attack} />
            <Mod label="Savunma" value={mod.defense} />
            <Mod label="Tempo" value={mod.tempo} />
            <Mod label="Posesyon" value={mod.possession} />
          </div>
          <p className="text-sm text-slate-400">
            Formasyon değişince ilk 11 mevkilere göre yeniden dizilir. Maç motoru bu çarpanları
            milisaniyede uygular.
          </p>
        </div>
      </div>
    </GameShell>
  );
}

function Mod({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-ink-800 p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="font-display text-2xl">{value.toFixed(2)}x</p>
    </div>
  );
}

