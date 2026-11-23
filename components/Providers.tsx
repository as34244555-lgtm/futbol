"use client";

import { HideNextBadge } from "@/components/HideNextBadge";
import { GameProvider } from "@/lib/game-context";
import { I18nProvider } from "@/lib/i18n";
import { loadModelIndex, loadPlayerGlb } from "@/lib/player-glb";
import { useEffect, useState, type ReactNode } from "react";

function GlbPreload() {
  useEffect(() => {
    void loadModelIndex().then(() => loadPlayerGlb()).catch(() => undefined);
  }, []);
  return null;
}

function LandscapeGate() {
  const [portrait, setPortrait] = useState(false);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const check = () => setPortrait(window.innerHeight > window.innerWidth + 40);
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    const lock = () => {
      const orientation = screen.orientation as ScreenOrientation & { lock?: (mode: string) => Promise<void> };
      void orientation?.lock?.("landscape").catch(() => undefined);
    };
    window.addEventListener("pointerdown", lock, { once: true });
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);
  if (!portrait || hidden) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center px-3 pb-[max(0.8rem,env(safe-area-inset-bottom))]">
      <button
        type="button"
        className="pointer-events-auto rounded-full bg-black/75 px-4 py-2 text-sm text-white shadow-lg ring-1 ring-white/20"
        onClick={() => setHidden(true)}
      >
        Yatay daha rahat · kapat
      </button>
    </div>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <HideNextBadge />
      <GlbPreload />
      <GameProvider>
        {children}
        <LandscapeGate />
      </GameProvider>
    </I18nProvider>
  );
}
