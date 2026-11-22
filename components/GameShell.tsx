"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CircleDollarSign, LogOut, Settings, ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/game-context";
import { useI18n } from "@/lib/i18n";
import { formatCoins } from "@/lib/utils";
import { weekInSeason, SEASON_WEEKS } from "@/lib/titles";
import { cn } from "@/lib/utils";

export function GameShell({
  children,
  flush = false,
  bare = false,
  title,
}: {
  children: React.ReactNode;
  flush?: boolean;
  bare?: boolean;
  title?: string;
}) {
  const { ready, userTeam, world, logout } = useGame();
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [settings, setSettings] = useState(false);

  useEffect(() => {
    if (ready && !userTeam) router.replace("/");
  }, [ready, userTeam, router]);

  if (!ready || !userTeam) {
    return (
      <div className="flex h-[100dvh] w-[100vw] items-center justify-center bg-[#05070c] text-slate-400">
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="ef-shell relative flex h-[100dvh] w-[100vw] flex-col overflow-hidden bg-[#05070c] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,#0a1524,#071018_45%,#0c1830)]" />
      <div className="pointer-events-none absolute inset-0 opacity-55 [mask-image:linear-gradient(90deg,transparent_0%,#000_6%,#000_94%,transparent_100%)]">
        <div className="absolute -left-[10%] top-0 h-[70%] w-[34%] rotate-[-16deg] bg-[#1a4d88]/40" />
        <div className="absolute -right-[8%] bottom-0 h-[65%] w-[32%] rotate-[14deg] bg-[#163a6a]/35" />
      </div>

      {!bare && (
        <header className="relative z-30 flex shrink-0 items-center gap-3 px-[clamp(0.6rem,1.8vw,1.35rem)] py-2">
          <BrandLogo size={28} showWord />
          {title && <p className="font-display text-xl text-[#5aa8ff] sm:text-2xl">{title}</p>}
          <div className="ml-auto flex items-center gap-2">
            <span className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-300">
              S{world.season || 1} · H{weekInSeason(world.week)}/{SEASON_WEEKS}
            </span>
            <span className="flex items-center gap-1 rounded-full border border-[#2b7fff]/40 bg-black/45 px-2.5 py-1 text-xs font-semibold text-[#7eb6ff]">
              <CircleDollarSign className="h-3.5 w-3.5" />
              {formatCoins(userTeam.coins)}
            </span>
            <span className="rounded-full border border-cyan-400/30 bg-black/45 px-2.5 py-1 text-xs font-semibold text-cyan-300">
              ◆ {formatCoins(userTeam.gems ?? 0)}
            </span>
            <Link href="/dashboard" className="rounded-full border border-[#2b7fff]/35 bg-[#12365c]/70 p-2 text-[#7eb6ff]" aria-label="Ana sayfa">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3l9-8z"/></svg>
            </Link>
            <button
              type="button"
              className="rounded-full border border-white/10 bg-black/45 p-2 text-slate-300"
              aria-label={t("settings")}
              onClick={() => setSettings(true)}
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </header>
      )}

      <main className={cn("relative z-20 min-h-0 flex-1", bare || flush ? "overflow-hidden p-0" : "overflow-y-auto px-[clamp(0.6rem,1.8vw,1.35rem)] pb-3")}>
        {children}
      </main>

      {!bare && (
        <footer className="relative z-30 flex shrink-0 items-center gap-3 px-[clamp(0.6rem,1.8vw,1.35rem)] pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-1">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex min-h-11 items-center gap-1 rounded-r-xl rounded-l-md bg-[#1f8fff] px-5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(31,143,255,0.35)]"
          >
            <ChevronLeft className="h-5 w-5" />
            Geri
          </button>
          <div className="ml-auto truncate text-[10px] text-white/35">{pathname}</div>
        </footer>
      )}

      {settings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSettings(false)}>
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0b1018] p-5" onClick={(e) => e.stopPropagation()}>
            <p className="font-display text-2xl">{t("settings")}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant={lang === "tr" ? "gold" : "ghost"} onClick={() => setLang("tr")}>
                {t("lang.tr")}
              </Button>
              <Button size="sm" variant={lang === "en" ? "gold" : "ghost"} onClick={() => setLang("en")}>
                {t("lang.en")}
              </Button>
            </div>
            <Button
              className="mt-5 w-full"
              variant="outline"
              onClick={async () => {
                await logout();
                router.push("/");
              }}
            >
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </Button>
            <Button className="mt-2 w-full" variant="ghost" onClick={() => setSettings(false)}>
              {t("champ.continue")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
