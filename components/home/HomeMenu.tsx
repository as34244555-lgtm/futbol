"use client";

import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/game-context";
import { useI18n } from "@/lib/i18n";
import { weekInSeason, SEASON_WEEKS } from "@/lib/titles";
import { formatCoins } from "@/lib/utils";
import { Bell, Info, LogOut, Mail } from "lucide-react";
import Image from "next/image";
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
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1100px] flex-col bg-black px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.45rem,env(safe-area-inset-top))] text-white">
      <div className="flex items-center gap-3 px-1">
        <span className="flex items-center gap-1 text-sm font-semibold text-[#f5c542]">
          <GoldBallIcon />
          {formatCoins(userTeam?.points ?? 0)}
        </span>
        <span className="flex items-center gap-1 text-sm font-semibold text-white">
          <Image src="/a-studio-icon.png" alt="Abdullah Studio" width={22} height={22} className="h-5 w-5 rounded-sm object-contain" />
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

function GoldBallIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <defs>
        <radialGradient id="goldball" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fff4c2" />
          <stop offset="45%" stopColor="#f5c542" />
          <stop offset="100%" stopColor="#a56b12" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="9" fill="url(#goldball)" />
      <path d="M12 4.5l2.2 3.2h-4.4L12 4.5zM12 19.5l-2.2-3.2h4.4L12 19.5zM5 12l2.6-1.8v3.6L5 12zm14 0l-2.6 1.8v-3.6L19 12z" fill="#7a4e08" />
    </svg>
  );
}
function BallIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden>
      <circle cx="24" cy="24" r="14" fill="white" />
      <path d="M24 13.5l3.6 2.6 1.4 4.2-2.2 3.8h-5.6l-2.2-3.8 1.4-4.2L24 13.5z" fill="#111827" />
      <path d="M24 13.5V10M20.4 20.3l-4.2-1.4M27.6 20.3l4.2-1.4M21.8 24.1l-2.4 5.2M26.2 24.1l2.4 5.2" stroke="#111827" strokeWidth="1.5" fill="none" />
    </svg>
  );
}
function GoalIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden>
      <path d="M6 18h36v16H6z" fill="none" stroke="white" strokeWidth="2.2" />
      <path d="M6 14h36M12 18v16M18 18v16M24 18v16M30 18v16M36 18v16" stroke="white" strokeWidth="1.2" />
      <circle cx="34" cy="32" r="5" fill="white" />
      <path d="M34 28.5l1.4 1 .5 1.6-.9 1.5h-2l-.9-1.5.5-1.6 1.4-1z" fill="#ff8a1e" />
    </svg>
  );
}
function PlanIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden>
      <rect x="6" y="10" width="36" height="28" rx="2" fill="#157a38" stroke="white" strokeWidth="1.6" />
      <path d="M24 10v28M6 24h36" stroke="white" strokeWidth="1.2" />
      <circle cx="24" cy="24" r="5" fill="none" stroke="white" strokeWidth="1.2" />
      <rect x="6" y="16" width="7" height="16" fill="none" stroke="white" strokeWidth="1" />
      <rect x="35" y="16" width="7" height="16" fill="none" stroke="white" strokeWidth="1" />
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
