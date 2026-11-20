"use client";

import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/game-context";
import { useI18n } from "@/lib/i18n";
import { weekInSeason, SEASON_WEEKS } from "@/lib/titles";
import { formatCoins } from "@/lib/utils";
import { Bell, Info, LogOut, Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const TABS = [
  { href: "/dashboard", key: "menu.world" },
  { href: "/inbox", key: "menu.tasks" },
  { href: "/transfer", key: "menu.shop" },
  { href: "/extra", key: "menu.extra" },
] as const;

export function HomeMenu() {
  const { world, userTeam, logout } = useGame();
  const { t, lang, setLang } = useI18n();
  const [settings, setSettings] = useState(false);
  const [slide, setSlide] = useState(0);
  const news = world.news?.length ?? 0;
  const next = world.matches.find(
    (m) =>
      m.week === world.week &&
      m.status === "pending" &&
      (m.home_team_id === userTeam?.id || m.away_team_id === userTeam?.id),
  );
  const oppId = next ? (next.home_team_id === userTeam?.id ? next.away_team_id : next.home_team_id) : null;
  const opponent = world.teams.find((team) => team.id === oppId);
  const slides = [
    { id: "ad", title: t("menu.ad"), text: t("menu.adHint"), href: "/match" },
    {
      id: "match",
      title: opponent ? `${userTeam?.name} · ${opponent.name}` : t("menu.match"),
      text: `${t("week")} ${weekInSeason(world.week)}/${SEASON_WEEKS}`,
      href: "/match",
    },
    {
      id: "shop",
      title: t("menu.shop"),
      text: t("menu.shopHint"),
      href: "/transfer",
    },
  ];

  useEffect(() => {
    const timer = window.setInterval(() => setSlide((n) => (n + 1) % slides.length), 4200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const actions = [
    { href: "/match", label: t("menu.match"), color: "bg-[#2f7bff]", icon: <BallIcon />, alert: false },
    { href: "/match", label: t("menu.shoot"), color: "bg-[#ff8a1e]", icon: <GoalIcon />, alert: !next },
    { href: "/tactics", label: t("menu.plan"), color: "bg-[#6fbf3a]", icon: <PlanIcon />, alert: !userTeam?.training },
    { href: "/squad", label: t("menu.team"), color: "bg-[#e23b4a]", icon: <ShieldIcon />, alert: false },
    { href: "/transfer", label: t("menu.contract"), color: "bg-[#9b4dff]", icon: <SignIcon />, alert: false },
  ];

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col bg-black px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.6rem,env(safe-area-inset-top))] text-white">
      <div className="flex items-center gap-3 px-1">
        <span className="flex items-center gap-1 text-sm font-semibold text-[#f5c542]">
          <CoinIcon />
          {formatCoins(userTeam?.points ?? 0)}
        </span>
        <span className="flex items-center gap-1 text-sm font-semibold text-[#7eb6ff]">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3b82f6] text-[10px] font-bold text-white">A</span>
          {formatCoins(userTeam?.coins ?? 0)}
        </span>
        <div className="ml-auto flex items-center gap-3">
          <button type="button" aria-label={t("settings")} onClick={() => setSettings(true)} className="text-[#3b82f6]">
            <Info className="h-6 w-6" />
          </button>
          <Link href="/inbox" className="relative text-[#8eb4ff]">
            <Mail className="h-6 w-6" />
            {news > 0 && <Badge n={news} />}
          </Link>
          <button type="button" className="relative text-[#49a2ff]" onClick={() => setSettings(true)} aria-label={t("settings")}>
            <Bell className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex gap-1 overflow-x-auto rounded-full bg-[#2a2a2a] p-1 text-sm">
        {TABS.map((tab) => {
          const active = tab.href === "/dashboard";
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`shrink-0 rounded-full px-3 py-1.5 ${active ? "bg-[#d9d9d9] font-semibold text-black" : "text-white/80"}`}
            >
              {t(tab.key)}
            </Link>
          );
        })}
      </div>

      <div className="mt-5 flex min-h-[15rem] flex-1 items-stretch gap-2">
        <div className="my-8 w-2 shrink-0 rounded-r-xl bg-[#2c2c2c]" />
        <Link
          href={slides[slide]?.href ?? "/match"}
          className="flex flex-1 items-center justify-center rounded-[1.6rem] bg-[#4a4a4a] px-6 text-center"
        >
          <span>
            <span className="block font-display text-3xl leading-tight sm:text-4xl">{slides[slide]?.title}</span>
            <span className="mt-2 block text-sm text-white/70">{slides[slide]?.text}</span>
          </span>
        </Link>
        <div className="my-8 w-2 shrink-0 rounded-l-xl bg-[#2c2c2c]" />
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
          {slides.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={item.title}
              onClick={() => setSlide(i)}
              className={`h-1.5 rounded-full ${i === slide ? "w-5 bg-white" : "w-1.5 bg-white/35"}`}
            />
          ))}
      </div>

      <p className="mb-2 mt-6 px-1 text-sm text-white/80">{t("menu.play")}</p>
      <div className="grid grid-cols-5 gap-2">
        {actions.map((action) => (
          <Link key={action.label} href={action.href} className="flex flex-col items-center gap-1 text-center">
            <span className={`relative flex h-[4.2rem] w-full items-center justify-center rounded-2xl ${action.color} shadow-md`}>
              {action.icon}
              {action.alert && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff2d2d] text-xs font-bold">
                  !
                </span>
              )}
            </span>
            <span className="text-[11px] leading-tight">{action.label}</span>
          </Link>
        ))}
      </div>

      {settings && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={() => setSettings(false)}>
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#121212] p-5" onClick={(e) => e.stopPropagation()}>
            <p className="font-display text-2xl">{t("settings")}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant={lang === "tr" ? "gold" : "ghost"} onClick={() => setLang("tr")}>
                TR
              </Button>
              <Button size="sm" variant={lang === "en" ? "gold" : "ghost"} onClick={() => setLang("en")}>
                EN
              </Button>
            </div>
            <Button
              className="mt-5 w-full"
              variant="outline"
              onClick={async () => {
                await logout();
                window.location.href = "/";
              }}
            >
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff2d2d] px-1 text-[10px] font-bold">
      {n > 9 ? "9" : n}
    </span>
  );
}

function CoinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="#f5c542" />
      <path d="M9 8h6M9 12h6M9 16h4" stroke="#7a5a10" strokeWidth="1.6" />
    </svg>
  );
}
function BallIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden>
      <circle cx="24" cy="24" r="16" fill="none" stroke="white" strokeWidth="2.4" />
      <path d="M24 10l5 8h-10l5-8zm0 28l-5-8h10l-5 8zM10 24l8-5v10l-8-5zm28 0l-8 5V19l8 5z" fill="white" />
    </svg>
  );
}
function GoalIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden>
      <path d="M8 16h32v18H8z" fill="none" stroke="white" strokeWidth="2.4" />
      <path d="M8 16v-4h32v4M14 16v18M22 16v18M30 16v18M38 16v18" stroke="white" strokeWidth="1.4" />
      <circle cx="30" cy="30" r="4" fill="white" />
    </svg>
  );
}
function PlanIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden>
      <rect x="8" y="12" width="32" height="24" rx="3" fill="none" stroke="white" strokeWidth="2.4" />
      <circle cx="18" cy="24" r="3" fill="white" />
      <circle cx="30" cy="20" r="3" fill="white" />
      <circle cx="30" cy="28" r="3" fill="white" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden>
      <path d="M24 8l14 6v10c0 8-6 13-14 16-8-3-14-8-14-16V14l14-6z" fill="none" stroke="white" strokeWidth="2.4" />
      <circle cx="24" cy="22" r="4" fill="white" />
    </svg>
  );
}
function SignIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden>
      <circle cx="20" cy="18" r="6" fill="none" stroke="white" strokeWidth="2.4" />
      <path d="M8 36c2-7 8-10 12-10s10 3 12 10" fill="none" stroke="white" strokeWidth="2.4" />
      <path d="M34 16h8M38 12v8" stroke="white" strokeWidth="2.4" />
    </svg>
  );
}
