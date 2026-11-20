"use client";

import { GameProvider } from "@/lib/game-context";
import { I18nProvider } from "@/lib/i18n";
import { loadModelIndex, loadPlayerGlb } from "@/lib/player-glb";
import { useEffect, type ReactNode } from "react";

function GlbPreload() {
  useEffect(() => {
    void loadModelIndex().then(() => loadPlayerGlb()).catch(() => undefined);
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
