"use client";

import { JoinScreen } from "@/components/JoinScreen";
import { useGame } from "@/lib/game-context";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const { ready, userTeam } = useGame();
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (ready && userTeam) router.replace("/dashboard");
  }, [ready, userTeam, router]);

  if (!ready || userTeam) {
    return <div className="flex min-h-[100dvh] items-center justify-center text-slate-400">{t("loading")}</div>;
  }

  return <JoinScreen />;
}
