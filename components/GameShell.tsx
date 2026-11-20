"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CircleDollarSign, Home, LogOut, Settings, ShoppingBag, Swords, Users, LayoutGrid } from "lucide-react";
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
}: {
  children: React.ReactNode;
  flush?: boolean;
  bare?: boolean;
}) {
  const { ready, userTeam, world, logout } = useGame();
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [settings, setSettings] = useState(false);

  const NAV = [
    { href: "/dashboard", label: t("nav.home"), icon: Home },
    { href: "/match", label: t("nav.match"), icon: Swords },
    { href: "/squad", label: t("nav.team"), icon: Users },
    { href: "/transfer", label: t("nav.shop"), icon: ShoppingBag },
    { href: "/extra", label: t("nav.extra"), icon: LayoutGrid },
  ];

  useEffect(() => {
    if (ready && !userTeam) router.replace("/");
  }, [ready, userTeam, router]);

  if (!ready || !userTeam) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#05070c] text-slate-400">
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#05070c] text-slate-100">
      {!bare && (
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center gap-3 bg-gradient-to-b from-black/80 via-black/35 to-transparent px-3 pb-8 pt-[max(0.6rem,env(safe-area-inset-top))] sm:px-5">
        <Link href="/dashboard" className="pointer-events-auto">
          <BrandLogo size={36} showWord />
        </Link>
        <div className="pointer-events-none ml-auto flex items-center gap-2 sm:gap-3">
          <span className="rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-300 sm:text-xs">
            {t("season")} {world.season || 1} · {t("week")} {weekInSeason(world.week)}/{SEASON_WEEKS}
          </span>
          <span className="flex items-center gap-1 rounded-full border border-gold/30 bg-black/50 px-2.5 py-1 text-xs font-semibold text-gold">
            <CircleDollarSign className="h-3.5 w-3.5" />
            {formatCoins(userTeam.coins)} GP
          </span>
          <button
            type="button"
            className="pointer-events-auto rounded-full border border-white/10 bg-black/45 p-2 text-slate-300 hover:text-white"
            aria-label={t("settings")}
            onClick={() => setSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>
      )}

      <main
        className={cn(
          "min-h-[100dvh]",
          bare
            ? ""
            : flush
              ? "pb-[calc(4.6rem+env(safe-area-inset-bottom))]"
              : "px-3 pb-[calc(5.2rem+env(safe-area-inset-bottom))] pt-16 sm:px-5 lg:px-8",
        )}
      >
        {children}
      </main>

      {!bare && (
      <nav className="ef-nav fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href === "/extra" && ["/league", "/tactics", "/inbox"].includes(pathname));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex min-h-[4.4rem] flex-col items-center justify-center gap-1 text-[9px] font-semibold uppercase tracking-[0.18em]",
                  active ? "text-[#e7c56a]" : "text-slate-500",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-2xl",
                    active && "bg-[#e7c56a] text-black shadow-[0_0_18px_rgba(231,197,106,0.45)]",
                  )}
                >
                  <Icon className={cn("h-5 w-5", active ? "text-black" : "text-slate-400")} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
      )}

      {settings && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          onClick={() => setSettings(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0b1018] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-display text-2xl">{t("settings")}</p>
            <p className="mt-4 text-[10px] uppercase tracking-wider text-slate-500">{t("language")}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant={lang === "tr" ? "gold" : "ghost"} onClick={() => setLang("tr")}>
                {t("lang.tr")}
              </Button>
              <Button size="sm" variant={lang === "en" ? "gold" : "ghost"} onClick={() => setLang("en")}>
                {t("lang.en")}
              </Button>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              {t("game")} · {t("studio")}
            </p>
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
