"use client";

import { GameProvider } from "@/lib/game-context";
import { I18nProvider } from "@/lib/i18n";
import { loadPlayerGlb } from "@/lib/player-glb";
import { useEffect, type ReactNode } from "react";

function GlbPreload() {
  useEffect(() => {
    void loadPlayerGlb().catch(() => undefined);
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <GlbPreload />
      <GameProvider>{children}</GameProvider>
    </I18nProvider>
  );
}
