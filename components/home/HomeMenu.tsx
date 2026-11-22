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

type Slide = {
  id: string;
  kicker: string;
  title: string;
  sub: string;
  href: string;
  art: "login" | "potw" | "epic" | "match";
};

export function HomeMenu() {
  const { world, userTeam, logout, claimRewarded } = useGame();
  const { t, lang, setLang } = useI18n();
  const [settings, setSettings] = useState(false);
  const [slide, setSlide] = useState(0);
  const [adOpen, setAdOpen] = useState(false);
  const [adLeft, setAdLeft] = useState(0);
  const [adMsg, setMsg] = useState<string | null>(null);
  const news = world.news?.length ?? 0;

  const next = world.matches.find(
    (m) =>
      m.week === world.week &&
      m.status === "pending" &&
      (m.home_team_id === userTeam?.id || m.away_team_id === userTeam?.id),
  );
  const oppId = next ? (next.home_team_id === userTeam?.id ? next.away_team_id : next.home_team_id) : null;
  const opponent = world.teams.find((team) => team.id === oppId);

  const slides: Slide[] = [
    {
      id: "login",
      kicker: "GÜNLÜK ETKİNLİK",
      title: "Günlük Giriş",
      sub: "Her gün coin + gem · Bitmesine: 18 sa",
      href: "/events",
      art: "login",
    },
    {
      id: "potw",
      kicker: "POTW",
      title: "Haftanın Oyuncuları",
      sub: "Sınırlı çekiliş · Bitmesine: 3 gün 5 sa",
      href: "/packs",
      art: "potw",
    },
    {
      id: "epic",
      kicker: "EPIC",
      title: "Özel Kart Paketi",
      sub: "Yüksek OVR havuzu · Sınırlı: 50/50",
      href: "/packs",
      art: "epic",
    },
    {
      id: "match",
      kicker: "CANLI MAÇ",
      title: opponent ? `vs ${opponent.name}` : "Maça çık",
      sub: `Hafta ${weekInSeason(world.week)}/${SEASON_WEEKS}`,
      href: "/match",
      art: "match",
    },
  ];

  useEffect(() => {
    const timer = window.setInterval(() => setSlide((n) => (n + 1) % slides.length), 4800);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    if (!adOpen || adLeft <= 0) return;
    const timer = window.setTimeout(() => setAdLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [adOpen, adLeft]);

  const actions = [
    { href: "/match", label: t("menu.match"), color: "bg-[#3aa0ff]", icon: <BallIcon /> },
    { href: "/goal", label: "Şut ve Gol", color: "bg-[#ff7a12]", icon: <GoalIcon />, alert: true }, // günlük 3D penaltı
    { href: "/squad", label: "Oyun Planı", color: "bg-[#7bcf2e]", icon: <PlanIcon />, alert: true },
    { href: "/squad", label: t("menu.team"), color: "bg-[#e23b4a]", icon: <ShieldIcon /> },
    { href: "/transfer", label: "Sözleşme", color: "bg-[#9b4dff]", icon: <ContractIcon /> },
  ];

  const current = slides[slide];

  return (
    <div className="ef-home relative h-[100dvh] w-[100vw] overflow-hidden text-white">
      <HomeBackdrop />
      <div className="relative z-10 flex h-full w-full flex-col px-[clamp(0.5rem,1.6vw,1.25rem)] pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-[max(0.25rem,env(safe-area-inset-top))]">
        {/* Top currency / alerts */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#f5c542]">
            <GoldBallIcon />
            {formatCoins(userTeam?.points ?? 0)}
          </span>
          <span className="flex items-center gap-1.5 text-[13px] font-semibold">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2b7fff] text-[10px] font-black">A</span>
            {formatCoins(userTeam?.coins ?? 0)}
          </span>
          <span className="text-[13px] font-semibold text-cyan-300">◆ {formatCoins(userTeam?.gems ?? 0)}</span>
          <div className="ml-auto flex items-center gap-3 text-[#5aa8ff]">
            <button type="button" aria-label={t("settings")} onClick={() => setSettings(true)}>
              <Info className="h-6 w-6" />
            </button>
            <Link href="/inbox" className="relative">
              <Mail className="h-6 w-6" />
              {news > 0 && <Badge n={news} />}
            </Link>
            <button type="button" className="relative" onClick={() => setSettings(true)} aria-label="bildirim">
              <Bell className="h-6 w-6" />
              <Badge n={1} />
            </button>
          </div>
        </div>

        {/* Top tabs — eFootball dark pill bar */}
        <nav className="mt-2 flex w-full gap-0.5 rounded-[1.15rem] bg-[#232833] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          {TABS.map((tab) => {
            const active = tab.href === "/dashboard";
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex min-h-[2.35rem] flex-1 items-center justify-center rounded-[0.95rem] px-2 text-center text-[12px] font-semibold tracking-wide sm:text-[13px] ${
                  active
                    ? "bg-[#cfd5df] text-[#12151c] shadow-[0_2px_0_rgba(0,0,0,0.25)]"
                    : "text-white/88 hover:bg-white/8"
                }`}
              >
                {t(tab.key)}
              </Link>
            );
          })}
        </nav>

        {/* Event carousel — wide eFootball banners */}
        <div className="relative mt-2.5 flex min-h-0 flex-1 items-stretch">
          <button
            type="button"
            aria-label="önceki"
            className="absolute left-0 z-20 flex h-full w-[3%] items-center justify-center"
            onClick={() => setSlide((slide + slides.length - 1) % slides.length)}
          />
          <div className="flex h-full w-full items-stretch gap-[0.9%]">
            <BannerPeek slide={slides[(slide + slides.length - 1) % slides.length]} />
            <Link
              href={current.href}
              className="relative flex-[0_0_78%] overflow-hidden rounded-[1.15rem] shadow-[0_18px_42px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
            >
              <EventArt kind={current.art} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                <p className="text-[11px] font-bold tracking-[0.22em] text-[#9ad0ff]">{current.kicker}</p>
                <p className="font-display mt-1 text-3xl leading-none sm:text-5xl">{current.title}</p>
                <p className="mt-2 text-sm text-white/80">{current.sub}</p>
              </div>
            </Link>
            <BannerPeek slide={slides[(slide + 1) % slides.length]} />
          </div>
          <button
            type="button"
            aria-label="sonraki"
            className="absolute right-0 z-20 flex h-full w-[3%] items-center justify-center"
            onClick={() => setSlide((slide + 1) % slides.length)}
          />
        </div>

        <div className="mt-2 flex justify-center gap-1.5">
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

        {/* Bottom action strip — matches eFootball Maç Yap row */}
        <div className="mt-1.5 w-full">
          <p className="mb-1 px-1 text-[12px] font-medium text-white/70">{t("menu.play")}</p>
          <div className="grid grid-cols-5 gap-[clamp(0.4rem,1.1vw,0.75rem)]">
            {actions.map((action) => (
              <Link key={action.label + action.href} href={action.href} className="flex flex-col items-center gap-1 text-center">
                <span
                  className={`relative flex aspect-square w-full max-h-[min(5.6rem,18vh)] items-center justify-center overflow-hidden rounded-[1.05rem] ${action.color} shadow-[0_8px_14px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.45)]`}
                >
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-[48%] bg-gradient-to-b from-white/35 to-transparent" />
                  <span className="pointer-events-none absolute inset-x-[12%] bottom-[10%] h-[18%] rounded-full bg-black/15 blur-[2px]" />
                  <span className="relative scale-[0.92] sm:scale-100">{action.icon}</span>
                  {action.alert && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff2d2d] text-xs font-bold ring-2 ring-[#05070c]">
                      !
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-medium leading-tight text-white/95 sm:text-[12px]">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
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
                  setMsg(err ?? "500 coin eklendi.");
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
                setMsg(null);
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

function BannerPeek({ slide }: { slide: Slide }) {
  return (
    <div className="relative flex-[0_0_10%] overflow-hidden rounded-[1.15rem] opacity-60 ring-1 ring-white/8">
      <EventArt kind={slide.art} />
      <div className="absolute inset-0 bg-black/50" />
    </div>
  );
}

function EventArt({ kind }: { kind: Slide["art"] }) {
  if (kind === "potw") {
    return (
      <div className="absolute inset-0 bg-[#0a1a12]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,#3dff8a55,transparent_45%),radial-gradient(circle_at_70%_60%,#1a6b3a66,transparent_50%)]" />
        <div className="absolute inset-y-0 right-4 flex items-center gap-1 font-display text-[7rem] leading-none text-[#7CFF4A]/35 sm:text-[9rem]">
          <span>P</span>
          <span>O</span>
          <span>T</span>
          <span>W</span>
        </div>
        <Image src="/a-studio-icon.png" alt="" width={120} height={120} className="absolute bottom-10 left-10 h-24 w-24 rounded-xl opacity-90" />
      </div>
    );
  }
  if (kind === "epic") {
    return (
      <div className="absolute inset-0 bg-[#071820]">
        <div className="absolute left-1/2 top-1/2 h-[140%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#3dff8a33_0%,#0a2a18_45%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[repeating-radial-gradient(circle_at_center,#2bd67a22_0_2px,transparent_2px_18px)] opacity-70" />
        <Image src="/a-studio-192.png" alt="" width={140} height={140} className="absolute bottom-8 left-[12%] h-28 w-28 rounded-2xl ring-2 ring-[#e7c56a]/50" />
      </div>
    );
  }
  if (kind === "match") {
    return (
      <div className="absolute inset-0 bg-[#0a1f14]">
        <div className="absolute inset-0 opacity-80" style={{ background: "repeating-linear-gradient(90deg,#117a38 0 28px,#1cb454 28px 56px)" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/50" />
      </div>
    );
  }
  return (
    <div className="absolute inset-0 bg-[#102848]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,#4da3ff55,transparent_40%),linear-gradient(135deg,#143258,#0a1628)]" />
      <Image src="/liga-nova-splash.webp" alt="" fill className="object-cover opacity-35" />
    </div>
  );
}

function HomeBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 bg-[#05070c]" aria-hidden>
      <div className="absolute inset-0 bg-[linear-gradient(115deg,#0a1524_0%,#071018_40%,#0b1830_100%)]" />
      {/* Soft brand geometry — clipped under UI, not empty side pillars */}
      <div className="absolute inset-0 opacity-70 [mask-image:linear-gradient(90deg,transparent_0%,#000_8%,#000_92%,transparent_100%)]">
        <div className="absolute -left-[12%] top-[-18%] h-[78%] w-[42%] rotate-[-18deg] bg-[linear-gradient(180deg,#1e5fa888,#0a1a3088)]" />
        <div className="absolute -right-[10%] bottom-[-20%] h-[80%] w-[40%] rotate-[16deg] bg-[linear-gradient(180deg,#184a8888,#08122088)]" />
      </div>
    </div>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff2d2d] px-1 text-[10px] font-bold text-white">
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
    <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden>
      <circle cx="32" cy="32" r="20" fill="#f3f5f8" stroke="#1a1c22" strokeWidth="1.5" />
      <path d="M32 12l6 8-2 10h-8l-2-10z" fill="#1a1c22" />
      <path d="M20 28l8 4-2 10-10 2-4-8zm24 0l-8 4 2 10 10 2 4-8zM18 44l10-2 4 8-8 6zm28 0l-10-2-4 8 8 6z" fill="#1a1c22" />
    </svg>
  );
}

function GoalIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden>
      <rect x="8" y="16" width="38" height="30" rx="1.5" fill="rgba(255,255,255,0.12)" stroke="#fff" strokeWidth="3" />
      <path d="M46 16h12v30H44" fill="none" stroke="#fff" strokeWidth="2.2" />
      <circle cx="30" cy="36" r="6" fill="#fff" />
    </svg>
  );
}

function PlanIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden>
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
