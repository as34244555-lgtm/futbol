"use client";

import { Button } from "@/components/ui/Button";
import { TutorialOverlay } from "@/components/TutorialOverlay";
import { useGame } from "@/lib/game-context";
import { useI18n } from "@/lib/i18n";
import { weekInSeason, SEASON_WEEKS } from "@/lib/titles";
import { formatCoins } from "@/lib/utils";
import { Bell, Info, LogOut, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const TABS = [
  { href: "/dashboard", key: "menu.world" as const },
  { href: "/events", key: "menu.tasks" as const },
  { href: "/transfer", key: "menu.shop" as const },
  { href: "/extra", key: "menu.extra" as const },
];

export function HomeMenu() {
  const { world, userTeam, logout, claimRewarded } = useGame();
  const { t, lang, setLang } = useI18n();
  const [settings, setSettings] = useState(false);
  const [slide, setSlide] = useState(0);
  const [adOpen, setAdOpen] = useState(false);
  const [adLeft, setAdLeft] = useState(0);
  const [adMsg, setAdMsg] = useState<string | null>(null);
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
    {
      id: "event-login",
      badge: "ETKİNLİK",
      title: "Günlük Giriş",
      text: "+400 coin · +5 gem — her gün ödülünü al",
      href: "/events",
      tone: "from-[#1a3a5c] via-[#0d2138] to-[#081018]",
    },
    {
      id: "event-bp",
      badge: "BATTLE PASS",
      title: "Sezon Görevleri",
      text: "Maç oyna, paket aç, BP puanı topla",
      href: "/events",
      tone: "from-[#3a2a08] via-[#1a1206] to-[#0c0c0c]",
    },
    {
      id: "event-ranked",
      badge: "DIVISION",
      title: "Ranked Etkinliği",
      text: "RP kazan, kademe yüksel — Bronz’dan Efsane’ye",
      href: "/ranked",
      tone: "from-[#2a1540] via-[#140a22] to-[#080610]",
    },
    {
      id: "event-match",
      badge: "MAÇ",
      title: opponent ? `${userTeam?.name} vs ${opponent.name}` : "Canlı Maç",
      text: `Hafta ${weekInSeason(world.week)}/${SEASON_WEEKS} · skill ve duran top`,
      href: "/match",
      tone: "from-[#0d3a28] via-[#0a1f18] to-[#06120e]",
    },
  ];

  useEffect(() => {
    const timer = window.setInterval(() => setSlide((n) => (n + 1) % slides.length), 4500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    if (!adOpen || adLeft <= 0) return;
    const timer = window.setTimeout(() => setAdLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [adOpen, adLeft]);

  const actions = [
    { href: "/match", label: t("menu.match"), color: "bg-[#3aa0ff]", icon: <BallIcon /> },
    { href: "/packs", label: "Şut ve Gol", color: "bg-[#ff7a12]", icon: <GoalIcon />, alert: true },
    { href: "/events", label: "Oyun Planı", color: "bg-[#7bcf2e]", icon: <PlanIcon />, alert: !userTeam?.dailyLoginAt },
    { href: "/squad", label: t("menu.team"), color: "bg-[#e23b4a]", icon: <ShieldIcon /> },
    { href: "/transfer", label: "Sözleşme", color: "bg-[#9b4dff]", icon: <ContractIcon /> },
  ];

  const current = slides[slide];
  const prev = slides[(slide + slides.length - 1) % slides.length];
  const nextSlide = slides[(slide + 1) % slides.length];

  return (
    <div className="ef-landscape relative h-[100dvh] w-full overflow-hidden text-white">
      <MenuBackdrop />
      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1200px] flex-col px-4 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-[max(0.35rem,env(safe-area-inset-top))] sm:px-6">
        {/* Top currencies + icons — eFootball bar */}
        <div className="flex items-center gap-3 px-1 pt-1">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-[#f5c542] drop-shadow">
            <GoldBallIcon />
            {formatCoins(userTeam?.points ?? 0)}
          </span>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-white drop-shadow">
            <Image src="/a-studio-icon.png" alt="" width={22} height={22} className="h-5 w-5 rounded-full object-contain ring-1 ring-white/30" />
            {formatCoins(userTeam?.coins ?? 0)}
          </span>
          <span className="text-sm font-semibold text-cyan-300 drop-shadow">◆ {formatCoins(userTeam?.gems ?? 0)}</span>
          <div className="ml-auto flex items-center gap-3">
            <button type="button" aria-label={t("settings")} onClick={() => setSettings(true)} className="text-[#6eb6ff] drop-shadow">
              <Info className="h-6 w-6" />
            </button>
            <Link href="/inbox" className="relative text-[#6eb6ff] drop-shadow">
              <Mail className="h-6 w-6" />
              {news > 0 && <Badge n={news} />}
            </Link>
            <button type="button" className="relative text-[#6eb6ff] drop-shadow" onClick={() => setSettings(true)} aria-label="bildirim">
              <Bell className="h-6 w-6" />
              <Badge n={1} />
            </button>
          </div>
        </div>

        {/* Top tabs */}
        <nav className="mt-2 grid w-full grid-cols-4 gap-1 rounded-2xl bg-black/55 p-1 text-[12px] ring-1 ring-white/15 backdrop-blur-md sm:text-sm">
          {TABS.map((tab) => {
            const active = tab.href === "/dashboard";
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex min-h-9 items-center justify-center rounded-xl px-1 py-2 text-center leading-none tracking-wide ${
                  active
                    ? "bg-[#dfe3ea] font-semibold text-black shadow-[0_8px_18px_rgba(0,0,0,0.35)]"
                    : "text-white/90 hover:bg-white/10"
                }`}
              >
                {t(tab.key)}
              </Link>
            );
          })}
        </nav>

        {/* Center carousel — ETKİNLİKLER (store listing uses this, not ad placeholder) */}
        <div className="mt-3 flex min-h-0 flex-1 items-stretch gap-2">
          <PeekCard slide={prev} side="left" onClick={() => setSlide((slide + slides.length - 1) % slides.length)} />
          <Link
            href={current.href}
            className={`relative z-20 flex flex-[1.35] flex-col items-center justify-center overflow-hidden rounded-[1.35rem] border border-white/20 bg-gradient-to-br ${current.tone} px-5 py-5 text-center shadow-[0_22px_50px_rgba(0,0,0,0.45)] sm:px-8 sm:py-6`}
          >
            <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_55%)]" />
            <span className="relative w-fit rounded-md bg-[#e7c56a] px-2.5 py-0.5 text-[10px] font-black tracking-[0.2em] text-black">
              {current.badge}
            </span>
            <span className="relative mt-4 block font-display text-4xl leading-none text-white sm:text-6xl">{current.title}</span>
            <span className="relative mt-3 block max-w-2xl text-sm text-white/85 sm:text-base">{current.text}</span>
            <span className="relative mt-5 inline-flex rounded-lg bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide ring-1 ring-white/25">
              Etkinliğe git →
            </span>
          </Link>
          <PeekCard slide={nextSlide} side="right" onClick={() => setSlide((slide + 1) % slides.length)} />
        </div>

        <div className="mt-2 flex justify-center gap-1.5">
          {slides.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={item.title}
              onClick={() => setSlide(i)}
              className={`h-1.5 rounded-full ${i === slide ? "w-5 bg-white" : "w-1.5 bg-white/40"}`}
            />
          ))}
        </div>

        {/* Bottom action row */}
        <p className="mb-1.5 mt-2 px-1 text-sm font-medium text-white/85 drop-shadow">{t("menu.play")}</p>
        <div className="grid grid-cols-5 gap-2 pb-1">
          {actions.map((action) => (
            <Link key={action.label} href={action.href} className="flex flex-col items-center gap-1 text-center">
              <span
                className={`relative flex h-[4.1rem] w-full items-center justify-center overflow-hidden rounded-[1.1rem] ${action.color} shadow-[0_12px_18px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.45)] sm:h-[4.6rem]`}
              >
                <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent" />
                <span className="relative">{action.icon}</span>
                {action.alert && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff2d2d] text-xs font-bold ring-2 ring-black/40">
                    !
                  </span>
                )}
              </span>
              <span className="text-[11px] font-medium leading-tight drop-shadow sm:text-xs">{action.label}</span>
            </Link>
          ))}
        </div>

        {/* Hidden rewarded entry — not the store carousel */}
        <button
          type="button"
          className="sr-only"
          onClick={() => {
            setAdMsg(null);
            setAdLeft(8);
            setAdOpen(true);
          }}
        >
          reklam
        </button>
      </div>

      {adOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#f5c542]/40 bg-[#120e08] p-6 text-center">
            <p className="text-xs font-bold tracking-[0.22em] text-[#f5c542]">ÖDÜLLÜ REKLAM</p>
            <p className="font-display mt-3 text-5xl">500 Coin</p>
            {adLeft > 0 ? (
              <p className="mt-6 font-display text-6xl text-[#f5c542]">{adLeft}</p>
            ) : (
              <button
                type="button"
                className="mt-6 w-full rounded-2xl bg-[#f5c542] px-4 py-4 text-lg font-bold text-black"
                onClick={async () => {
                  const err = await claimRewarded();
                  setAdMsg(err ?? "500 coin eklendi.");
                  if (!err) setAdOpen(false);
                }}
              >
                Ödülü al
              </button>
            )}
            {adMsg && <p className="mt-3 text-sm text-rose-300">{adMsg}</p>}
            <button type="button" className="mt-4 text-sm text-white/60" onClick={() => setAdOpen(false)}>
              Kapat
            </button>
          </div>
        </div>
      )}

      {settings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSettings(false)}>
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
            <button
              type="button"
              className="mt-3 w-full text-sm text-[#f5c542]"
              onClick={() => {
                setSettings(false);
                setAdMsg(null);
                setAdLeft(8);
                setAdOpen(true);
              }}
            >
              Ödüllü reklam (+500 coin)
            </button>
          </div>
        </div>
      )}
      <TutorialOverlay />
    </div>
  );
}

function PeekCard({
  slide,
  side,
  onClick,
}: {
  slide: { title: string; badge: string; tone: string };
  side: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`my-4 hidden w-[9%] shrink-0 overflow-hidden rounded-[1.1rem] border border-white/10 bg-gradient-to-br ${slide.tone} opacity-70 sm:block`}
      aria-label={side === "left" ? "Önceki etkinlik" : "Sonraki etkinlik"}
    >
      <span className="flex h-full items-center justify-center px-1 text-center text-[10px] font-semibold text-white/70">
        {slide.badge}
      </span>
    </button>
  );
}

function MenuBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#07111c]" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(900px_420px_at_15%_-10%,#1d4d86,transparent_55%),radial-gradient(700px_360px_at_90%_10%,#16325a,transparent_50%),linear-gradient(#0a1626,#07111c)]" />
      <div className="absolute -left-20 top-10 h-64 w-64 rotate-12 rounded-[40%] bg-[#1f5fa8]/25 blur-2xl" />
      <div className="absolute -right-16 bottom-8 h-72 w-72 -rotate-6 rounded-[45%] bg-[#245ea0]/20 blur-2xl" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
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
    </svg>
  );
}

function BallIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10 sm:h-11 sm:w-11" aria-hidden>
      <defs>
        <radialGradient id="matchBall" cx="32%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f3f5f8" />
          <stop offset="100%" stopColor="#c5ceda" />
        </radialGradient>
        <clipPath id="ballClip">
          <circle cx="32" cy="32" r="20" />
        </clipPath>
      </defs>
      <g clipPath="url(#ballClip)">
        <circle cx="32" cy="32" r="20" fill="url(#matchBall)" />
        <polygon points="32,24.8 38.8,29.8 36.2,37.8 27.8,37.8 25.2,29.8" fill="#1a1c22" />
      </g>
      <circle cx="32" cy="32" r="20" fill="none" stroke="#d5dbe6" strokeWidth="1.2" />
    </svg>
  );
}

function GoalIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10 sm:h-11 sm:w-11" aria-hidden>
      <rect x="8" y="16" width="38" height="30" rx="1.5" fill="rgba(255,255,255,0.12)" stroke="#fff" strokeWidth="3" />
      <path d="M46 16h12v30H44" fill="none" stroke="#fff" strokeWidth="2.2" />
      <circle cx="30" cy="36" r="6" fill="#fff" />
    </svg>
  );
}

function PlanIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-9 w-9 sm:h-10 sm:w-10" aria-hidden>
      <rect x="6" y="10" width="36" height="28" rx="2" fill="#157a38" stroke="white" strokeWidth="1.6" />
      <path d="M24 10v28M6 24h36" stroke="white" strokeWidth="1.2" />
      <circle cx="24" cy="24" r="5" fill="none" stroke="white" strokeWidth="1.2" />
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

function ContractIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden>
      <circle cx="20" cy="18" r="6" fill="none" stroke="white" strokeWidth="2.4" />
      <path d="M8 36c2-7 8-10 12-10s10 3 12 10" fill="none" stroke="white" strokeWidth="2.4" />
      <path d="M34 16h8M38 12v8" stroke="white" strokeWidth="2.4" />
    </svg>
  );
}
