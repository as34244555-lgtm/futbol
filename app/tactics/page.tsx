"use client";

import { GameShell } from "@/components/GameShell";
import { KitMark } from "@/components/KitMark";
import { TacticsPitch } from "@/components/TacticsPitch";
import { Button } from "@/components/ui/Button";
import { TACTIC_MOD } from "@/lib/formations";
import { useGame } from "@/lib/game-context";
import { useI18n } from "@/lib/i18n";
import { chemistryOf, startersOf, teamGrade, teamProfile } from "@/lib/ratings";
import { trainingHint } from "@/lib/career";
import { FORMATIONS as FORMATION_LIST, KIT_STYLES, TACTIC_LABEL, TACTICS, TRAINING_LABEL, TRAININGS } from "@/lib/types";
import type { KitStyle, StadiumPrefs } from "@/lib/types";
import { HUMAN_KITS } from "@/lib/world";
import { rosterOf } from "@/lib/world";
import { useMemo } from "react";
import { StadiumSettings } from "@/components/StadiumSettings";
import { PlayerInspect } from "@/components/scene/PlayerInspect";
import { normalizeStadium } from "@/lib/stadium";

export default function TacticsPage() {
  const { world, userTeam, setFormation, setTactics, setTraining, setClub } = useGame();
  const { t } = useI18n();
  const roster = useMemo(() => (userTeam ? rosterOf(world, userTeam.id) : []), [world, userTeam]);
  if (!userTeam) return null;
  const mod = TACTIC_MOD[userTeam.tactics];
  const starters = startersOf(userTeam, roster);
  const profile = teamProfile(userTeam, starters, true);
  const grade = teamGrade(profile);
  const chem = Math.round(chemistryOf(userTeam, starters) * 100);
  const preview = roster.find((r) => r.is_starter) ?? roster[0];

  return (
    <GameShell>
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t("tactic.board")}</p>
      <h1 className="font-display mb-6 text-4xl sm:text-5xl">{t("tactic.title")}</h1>
      <div className="grid gap-8 lg:grid-cols-2">
        <TacticsPitch formation={userTeam.formation} roster={roster} kit={userTeam.kit_primary} />
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm text-slate-400">{t("tactic.formation")}</p>
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
            <p className="mb-2 text-sm text-slate-400">{t("tactic.style")}</p>
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
            <Mod label="Hücum gücü" value={`${grade.attack}`} />
            <Mod label="Savunma gücü" value={`${grade.defense}`} />
            <Mod label="Orta saha" value={`${grade.mid}`} />
            <Mod label="Mevki uyumu" value={`${chem}%`} />
            <Mod label="Tempo" value={mod.tempo.toFixed(2) + "x"} />
            <Mod label="Posesyon" value={mod.possession.toFixed(2) + "x"} />
          </div>
          <div>
            <p className="mb-2 text-sm text-slate-400">{t("tactic.train")}</p>
            <div className="flex flex-wrap gap-2">
              {TRAININGS.map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={(userTeam.training ?? "FITNESS") === t ? "outline" : "ghost"}
                  onClick={() => void setTraining(t)}
                >
                  {TRAINING_LABEL[t]}
                </Button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">{trainingHint(userTeam.training ?? "FITNESS")}</p>
          </div>
          <div>
            <p className="mb-2 text-sm text-slate-400">{t("tactic.kit")}</p>
            <div className="flex flex-wrap gap-2">
              {HUMAN_KITS.map((k) => (
                <button
                  key={k[0]}
                  type="button"
                  onClick={() => void setClub({ kit_primary: k[0], kit_secondary: k[1], kit_style: k[2] })}
                  className={`rounded-xl border p-2 ${userTeam.kit_primary === k[0] ? "border-neon" : "border-white/10"}`}
                >
                  <KitMark primary={k[0]} secondary={k[1]} style={k[2]} size={28} />
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {KIT_STYLES.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={(userTeam.kit_style ?? "solid") === s ? "outline" : "ghost"}
                  onClick={() => void setClub({ kit_style: s as KitStyle })}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
          <StadiumSettings
            value={normalizeStadium(userTeam.stadium)}
            onChange={(stadium: StadiumPrefs) => void setClub({ stadium })}
          />
          {preview && (
            <div>
              <p className="mb-2 text-sm text-slate-400">{t("tactic.model")}</p>
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <PlayerInspect
                  player={preview.player}
                  kit={userTeam.kit_primary}
                  kitSecondary={userTeam.kit_secondary}
                  kitStyle={userTeam.kit_style}
                  className="h-64 w-full"
                />
              </div>
            </div>
          )}
          <p className="text-sm text-slate-400">
            Skor önceden yazılmaz. Her şut, bitiricilik − markaj − kalecilik farkından xG üretir.
            Yanlış mevki, sakatlık, düşük enerji ve form gücü düşürür.
          </p>
        </div>
      </div>
    </GameShell>
  );
}

function Mod({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-ink-800 p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="font-display text-2xl">{value}</p>
    </div>
  );
}

