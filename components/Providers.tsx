"use client";

import { GameProvider } from "@/lib/game-context";
import { I18nProvider } from "@/lib/i18n";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <GameProvider>{children}</GameProvider>
    </I18nProvider>
  );
}
