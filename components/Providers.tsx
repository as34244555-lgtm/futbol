"use client";

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
  if (!portrait) return null;
  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-3 bg-black px-8 text-center text-white">
      <p className="font-display text-4xl">Yatay oyna</p>
      <p className="text-sm text-white/70">Telefonu yan çevir.</p>
    </div>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <GlbPreload />
      <GameProvider>
        {children}
        <LandscapeGate />
      </GameProvider>
    </I18nProvider>
  );
}
