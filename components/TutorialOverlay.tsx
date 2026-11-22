"use client";

import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/game-context";
import { TUTORIAL_STEPS } from "@/lib/meta";

export function TutorialOverlay() {
  const { userTeam, advanceTutorial } = useGame();
  if (!userTeam || userTeam.tutorialDone) return null;
  const step = userTeam.tutorialStep ?? 0;
  const text = TUTORIAL_STEPS[Math.min(step, TUTORIAL_STEPS.length - 1)];

  return (
    <div className="fixed inset-x-0 bottom-20 z-[60] mx-auto w-[min(92vw,420px)] rounded-2xl border border-[#d4af37]/40 bg-black/85 p-4 text-white shadow-2xl backdrop-blur">
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37]">Rehber {step + 1}/{TUTORIAL_STEPS.length}</p>
      <p className="mt-2 text-sm leading-relaxed">{text}</p>
      <div className="mt-3 flex gap-2">
        <Button className="flex-1" onClick={() => void advanceTutorial()}>
          İleri
        </Button>
        <Button variant="ghost" onClick={() => void advanceTutorial(true)}>
          Kapat
        </Button>
      </div>
    </div>
  );
}
