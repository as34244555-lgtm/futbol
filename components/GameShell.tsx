"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { Crest } from "@/components/Crest";
import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/game-context";
import { useI18n } from "@/lib/i18n";
import { formatCoins } from "@/lib/utils";
import { weekInSeason, SEASON_WEEKS } from "@/lib/titles";
import { cn } from "@/lib/utils";

export function GameShell({ children }: { children: React.ReactNode }) {
  const { ready, userTeam, me, world, backend, humans, logout, roomCode } = useGame();
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [settings, setSettings] = useState(false);

  const NAV = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/squad", label: t("nav.squad"), icon: Users },
    { href: "/tactics", label: t("nav.tactics"), icon: Shield },
    { href: "/transfer", label: t("nav.transfer"), icon: ArrowLeftRight },
    { href: "/match", label: t("nav.match"), icon: Swords },
    { href: "/league", label: t("nav.league"), icon: Trophy },
  ];

  useEffect(() => {
    if (ready && !userTeam) router.replace("/");
  }, [ready, userTeam, router]);

  if (!ready || !userTeam) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-slate-400">
        {t("loading")}
      </div>
    );
  }

  const backendLabel =
    backend === "supabase" || backend === "kv"
      ? t("multi.shared")
      : backend === "file"
        ? t("multi.file")
        : t("multi.memory");

  return (
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-white/10 bg-ink-900/80 p-4 lg:flex lg:flex-col">
        <Link href="/dashboard" className="mb-8 px-1">
          <BrandLogo size={56} showWord />
        </Link>
        <p className="mb-6 px-2 text-[10px] uppercase tracking-[0.25em] text-slate-500">{t("shared.backend")}</p>
        <nav className="space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                  active ? "bg-neon/15 text-neon" : "text-slate-300 hover:bg-white/5",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-6 px-3 text-[10px] uppercase tracking-wider text-slate-500">
          {backendLabel} · {humans} {t("multi.humans")}
        </p>
        <button
          className="mt-3 flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 hover:text-white"
          onClick={() => setSettings(true)}
        >
          <Settings className="h-4 w-4" />
          {t("settings")}
        </button>
        <button
          className="mt-auto flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-500 hover:text-rose-300"
          onClick={async () => {
            await logout();
            router.push("/");
          }}
        >
          <LogOut className="h-4 w-4" />
          {t("logout")}
        </button>
      </aside>
      <div className="flex min-h-[100dvh] flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/10 bg-ink-950/90 px-3 py-2.5 backdrop-blur sm:px-4">
          <Link href="/dashboard" className="lg:hidden">
            <BrandLogo size={36} />
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <Crest name={userTeam.name} primary={userTeam.kit_primary} secondary={userTeam.kit_secondary} size={36} />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">{t("club")}</p>
              <p className="truncate font-semibold">{userTeam.name}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3 text-sm sm:gap-4">
            <Meta className="hidden sm:block" label={t("room")} value={roomCode} />
            <Meta className="hidden md:block" label={t("manager")} value={me?.username ?? "-"} />
            <Meta label={t("season")} value={`${world.season || 1}`} />
            <Meta label={t("week")} value={`${weekInSeason(world.week)}/${SEASON_WEEKS}`} />
            <Meta className="hidden xs:block sm:block" label={t("points")} value={`${userTeam.points}`} />
            <Link href="/inbox" className="text-xs text-slate-400 hover:text-neon">
              {t("nav.inbox")}
            </Link>
            <button
              type="button"
              className="rounded-full p-1.5 text-slate-400 hover:text-white lg:hidden"
              aria-label={t("settings")}
              onClick={() => setSettings(true)}
            >
              <Settings className="h-4 w-4" />
            </button>
            <span className="rounded-full bg-gold/15 px-2.5 py-1 text-xs font-semibold text-gold sm:px-3 sm:text-sm">
              {formatCoins(userTeam.coins)} ₡
            </span>
          </div>
        </header>
        <main className="flex-1 p-3 sm:p-4 lg:p-8">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-white/10 bg-ink-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                active ? "text-neon" : "text-slate-400",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {settings && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={() => setSettings(false)}>
          <div
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-ink-900 p-5 shadow-2xl"
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
            <Button className="mt-5 w-full" variant="outline" onClick={() => setSettings(false)}>
              {t("champ.continue")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Meta({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
