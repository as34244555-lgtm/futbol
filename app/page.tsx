"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/Button";
import { PlayerStage } from "@/components/scene/PlayerStage";
import { useGame } from "@/lib/game-context";
import { useI18n } from "@/lib/i18n";

export default function LandingPage() {
  const { ready, userTeam } = useGame();
  const { t, lang, setLang } = useI18n();
  const hasSave = ready && Boolean(userTeam);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#05070c]">
      <PlayerStage className="absolute inset-0 h-full w-full" modelSlot={1} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black via-black/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent" />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <BrandLogo size={48} showWord />
        <div className="flex gap-2">
          <Button size="sm" variant={lang === "tr" ? "gold" : "ghost"} onClick={() => setLang("tr")}>
            TR
          </Button>
          <Button size="sm" variant={lang === "en" ? "gold" : "ghost"} onClick={() => setLang("en")}>
            EN
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex min-h-[calc(100dvh-6rem)] flex-col justify-end px-5 pb-16 sm:max-w-xl sm:px-8 sm:pb-20">
        <p className="text-[11px] uppercase tracking-[0.42em] text-[#d4af37]">{t("land.kicker")}</p>
        <h1 className="font-display mt-3 text-5xl leading-[0.9] sm:text-7xl">
          {t("land.h1a")}
          <span className="mt-1 block text-white/90">{t("land.h1b")}</span>
        </h1>
        <p className="mt-5 max-w-md text-slate-300">{t("land.body")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={hasSave ? "/dashboard" : "/play"}>
            <Button size="lg" variant="gold">
              {hasSave ? t("land.back") : t("land.join")}
            </Button>
          </Link>
          {!hasSave && (
            <Link href="/login">
              <Button size="lg" variant="outline">
                {t("land.login")}
              </Button>
            </Link>
          )}
        </div>
        <div className="mt-8 flex gap-4 text-xs text-slate-500">
          <Link href="/gizlilik">{t("privacy")}</Link>
          <Link href="/kosullar">{t("terms")}</Link>
        </div>
      </main>
    </div>
  );
}
