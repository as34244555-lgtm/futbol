"use client";

import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/game-context";
import { useI18n } from "@/lib/i18n";
import { flagUrl } from "@/lib/nations";
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

  useEffect(() => {
    if (!adOpen || adLeft <= 0) return;
    const timer = window.setTimeout(() => setAdLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [adOpen, adLeft]);

  const actions = [
    { href: "/match", label: t("menu.match"), color: "bg-[#1f6dff]", icon: <BallIcon />, alert: false },
    { href: "/match", label: t("menu.shoot"), color: "bg-[#ff7a12]", icon: <GoalIcon />, alert: !next },
    { href: "/tactics", label: t("menu.plan"), color: "bg-[#5eae2e]", icon: <PlanIcon />, alert: !userTeam?.training },
    { href: "/squad", label: t("menu.team"), color: "bg-[#e23b4a]", icon: <ShieldIcon />, alert: false },
    { href: "/transfer", label: t("menu.contract"), color: "bg-[#9b4dff]", icon: <SignIcon />, alert: false },
  ];

  const current = slides[slide];

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden text-white">
      <StadiumBackdrop />
      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1100px] flex-col px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.45rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3 px-1">
          {userTeam?.nation && (
            <img src={flagUrl(userTeam.nation, 80)} alt="" className="h-4 w-7 rounded-sm object-cover ring-1 ring-white/30" />
          )}
          <span className="flex items-center gap-1 text-sm font-semibold text-[#f5c542] drop-shadow">
            <GoldBallIcon />
            {formatCoins(userTeam?.points ?? 0)}
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold text-white drop-shadow">
            <Image src="/a-studio-icon.png" alt="Abdullah Studio" width={22} height={22} className="h-5 w-5 rounded-sm object-contain" />
            {formatCoins(userTeam?.coins ?? 0)}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <button type="button" aria-label={t("settings")} onClick={() => setSettings(true)} className="text-[#7eb6ff] drop-shadow">
              <Info className="h-6 w-6" />
            </button>
            <Link href="/inbox" className="relative text-[#8eb4ff] drop-shadow">
              <Mail className="h-6 w-6" />
              {news > 0 && <Badge n={news} />}
            </Link>
            <button type="button" className="relative text-[#49a2ff] drop-shadow" onClick={() => setSettings(true)} aria-label={t("settings")}>
              <Bell className="h-6 w-6" />
            </button>
          </div>
        </div>

        <nav className="mt-3 grid w-full grid-cols-4 gap-1 rounded-2xl bg-black/55 p-1 text-[12px] ring-1 ring-white/15 backdrop-blur-md sm:text-sm">
          {TABS.map((tab) => {
            const active = tab.href === "/dashboard";
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex min-h-9 items-center justify-center rounded-xl px-1 py-2 text-center leading-none tracking-wide ${
                  active
                    ? "bg-[#f3f4f6] font-semibold text-black shadow-[0_8px_18px_rgba(0,0,0,0.35)]"
                    : "text-white/90 hover:bg-white/10"
                }`}
              >
                {t(tab.key)}
              </Link>
            );
          })}
        </nav>

        <div className="mt-3 flex min-h-0 flex-1 items-stretch gap-2">
          <div className="my-5 w-2.5 shrink-0 rounded-r-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm" />
          {current?.id === "ad" ? (
            <button
              type="button"
              onClick={() => {
                setAdMsg(null);
                setAdLeft(8);
                setAdOpen(true);
              }}
              className="relative z-20 flex flex-1 cursor-pointer flex-col items-center justify-center rounded-[1.6rem] border border-[#f5c542]/50 bg-gradient-to-br from-[#3a2a08] via-[#1a1206] to-[#0c0c0c] px-6 text-center shadow-[0_22px_50px_rgba(0,0,0,0.45)]"
            >
              <span className="rounded-md bg-[#f5c542] px-2 py-0.5 text-[10px] font-black tracking-[0.2em] text-black">REKLAM</span>
              <span className="mt-3 block font-display text-4xl text-white sm:text-6xl">{current.title}</span>
              <span className="mt-2 block text-base text-[#f5c542]">{current.text}</span>
            </button>
          ) : (
            <Link
              href={current?.href ?? "/match"}
              className="relative z-20 flex flex-1 items-center justify-center overflow-hidden rounded-[1.6rem] border border-white/30 bg-black/35 px-6 text-center shadow-[0_22px_50px_rgba(0,0,0,0.4)]"
            >
              <span className="relative inline-block max-w-[92%] rounded-2xl bg-black/55 px-5 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                <span className="block font-display text-3xl leading-tight sm:text-5xl">{current?.title}</span>
                <span className="mt-2 block text-sm text-white/85">{current?.text}</span>
              </span>
            </Link>
          )}
          <div className="my-5 w-2.5 shrink-0 rounded-l-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm" />
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

        <p className="mb-2 mt-3 px-1 text-sm font-medium text-white/90 drop-shadow">{t("menu.play")}</p>
        <div className="grid grid-cols-5 gap-2">
          {actions.map((action) => (
            <Link key={action.label} href={action.href} className="flex flex-col items-center gap-1 text-center">
              <span
                className={`relative flex h-[4.35rem] w-full items-center justify-center overflow-hidden rounded-[1.15rem] ${action.color} shadow-[0_12px_18px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.5)]`}
              >
                <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent" />
                <span className="relative">{action.icon}</span>
                {action.alert && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff2d2d] text-xs font-bold ring-2 ring-black/40">
                    !
                  </span>
                )}
              </span>
              <span className="text-[11px] font-medium leading-tight drop-shadow">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {adOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#f5c542]/40 bg-[#120e08] p-6 text-center">
            <p className="text-xs font-bold tracking-[0.22em] text-[#f5c542]">ÖDÜLLÜ REKLAM</p>
            <p className="font-display mt-3 text-5xl">500 Coin</p>
            <p className="mt-2 text-sm text-white/70">İzleme bitince para, stüdyo logosunun yanına eklenir.</p>
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

const SEAT_COLORS = ["#c43446", "#1d4e9c", "#d4a017", "#0f6b45", "#1d4e9c", "#c43446", "#d4a017", "#7a2ea8"];

function pitchPoint(u: number, v: number) {
  const left = 260 + (-80 - 260) * v;
  const right = 1340 + (1680 - 1340) * v;
  const x = left + (right - left) * u;
  const y = 430 + (760 - 430) * v;
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}

function pitchBox(u0: number, u1: number, v0: number, v1: number) {
  return `M${pitchPoint(u0, v0)} L${pitchPoint(u1, v0)} L${pitchPoint(u1, v1)} L${pitchPoint(u0, v1)} Z`;
}

function StadiumBackdrop() {
  const stripes = Array.from({ length: 12 }, (_, i) => {
    const farL = 260 + (1080 * i) / 12;
    const farR = 260 + (1080 * (i + 1)) / 12;
    const nearL = -80 + (1760 * i) / 12;
    const nearR = -80 + (1760 * (i + 1)) / 12;
    return `M${farL} 430 L${farR} 430 L${nearR} 760 L${nearL} 760 Z`;
  });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#07111c]" aria-hidden>
      <style>{`@keyframes mlFlood { 0%,100% { opacity: .7 } 50% { opacity: 1 } }`}</style>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="bgSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d4d86" />
            <stop offset="40%" stopColor="#102844" />
            <stop offset="100%" stopColor="#07111c" />
          </linearGradient>
          <linearGradient id="bgBeam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff6d8" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#fff6d8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="bgShade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="68%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        <rect width="1600" height="900" fill="url(#bgSky)" />
        <g style={{ animation: "mlFlood 5s ease-in-out infinite" }}>
          <polygon points="30,30 210,30 560,470 -80,470" fill="url(#bgBeam)" />
          <polygon points="1390,30 1570,30 1680,470 1040,470" fill="url(#bgBeam)" />
        </g>
        <path d="M0 108 Q800 18 1600 108 V168 Q800 82 0 168 Z" fill="#0c1828" />
        <rect x="64" y="70" width="160" height="16" rx="3" fill="#f7f9ff" />
        <rect x="1376" y="70" width="160" height="16" rx="3" fill="#f7f9ff" />
        <path d="M0 160 H1600 L1500 430 H100 Z" fill="#10192b" />
        {SEAT_COLORS.map((color, i) =>
          Array.from({ length: 6 }, (_, row) => (
            <rect
              key={`${i}-${row}`}
              x={48 + i * 192}
              y={184 + row * 36}
              width="168"
              height="22"
              rx="4"
              fill={color}
              opacity={0.72}
            />
          )),
        )}
        {stripes.map((d, i) => (
          <path key={d} d={d} fill={i % 2 ? "#117a38" : "#1cb454"} />
        ))}
        <path d="M260 430 H1340 L1680 760 H-80 Z" fill="none" stroke="#fff" strokeWidth="5" />
        <line x1="800" y1="430" x2="800" y2="760" stroke="#fff" strokeWidth="4" />
        <ellipse cx="800" cy="620" rx="78" ry="28" fill="none" stroke="#fff" strokeWidth="4" />
        <circle cx="800" cy="620" r="5" fill="#fff" />
        <path d={pitchBox(0, 0.16, 0.22, 0.78)} fill="none" stroke="#fff" strokeWidth="4" />
        <path d={pitchBox(0.84, 1, 0.22, 0.78)} fill="none" stroke="#fff" strokeWidth="4" />
        <path d={pitchBox(0, 0.07, 0.36, 0.64)} fill="none" stroke="#fff" strokeWidth="3" />
        <path d={pitchBox(0.93, 1, 0.36, 0.64)} fill="none" stroke="#fff" strokeWidth="3" />
        <rect width="1600" height="900" fill="url(#bgShade)" />
      </svg>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.35) 100%)" }} />
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
    <svg viewBox="0 0 64 64" className="h-11 w-11" aria-hidden>
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
      <ellipse cx="32" cy="55" rx="12" ry="2.4" fill="#041018" opacity="0.28" />
      <g clipPath="url(#ballClip)">
        <circle cx="32" cy="32" r="20" fill="url(#matchBall)" />
        <g fill="#1a1c22">
          <polygon points="32.0,24.8 38.8,29.8 36.2,37.8 27.8,37.8 25.2,29.8" />
          <polygon points="32.0,9.1 38.1,13.5 35.8,20.7 28.2,20.7 25.9,13.5" />
          <polygon points="53.8,24.9 51.5,32.1 43.9,32.1 41.6,24.9 47.7,20.5" />
          <polygon points="45.5,50.5 37.9,50.5 35.6,43.4 41.7,38.9 47.8,43.4" />
          <polygon points="18.5,50.5 16.2,43.4 22.3,38.9 28.4,43.4 26.1,50.5" />
          <polygon points="10.2,24.9 16.3,20.5 22.4,24.9 20.1,32.1 12.5,32.1" />
        </g>
      </g>
      <circle cx="32" cy="32" r="20" fill="none" stroke="#d5dbe6" strokeWidth="1.2" />
      <ellipse cx="25" cy="24" rx="6" ry="2.6" fill="#fff" opacity="0.55" transform="rotate(-28 25 24)" />
    </svg>
  );
}

function GoalIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-11 w-11" aria-hidden>
      <path d="M46 16h12l-2 30H44z" fill="rgba(255,255,255,0.28)" />
      <path d="M46 16h12M58 16v30M44 46h12" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinejoin="round" />
      <g stroke="rgba(255,255,255,0.7)" strokeWidth="0.8">
        <path d="M48 20h8M47 26h9M46.5 32h10M46 38h11" />
        <path d="M50 16l-2 30M54 16v30" />
      </g>
      <rect x="8" y="16" width="38" height="30" rx="1.5" fill="rgba(255,255,255,0.12)" stroke="#fff" strokeWidth="3.2" />
      <g stroke="rgba(255,255,255,0.9)" strokeWidth="0.9">
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`n${i}`} x1={14 + i * 5.4} y1={16} x2={14 + i * 5.4} y2={46} />
        ))}
        {Array.from({ length: 4 }, (_, i) => (
          <line key={`m${i}`} x1={8} y1={22 + i * 6} x2={46} y2={22 + i * 6} />
        ))}
      </g>
      <path d="M8 16h38" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" />
      <circle cx="30" cy="36" r="6.2" fill="#fff" />
      <polygon points="30,32.2 32.2,33.8 31.4,36.2 28.6,36.2 27.8,33.8" fill="#1a1c22" />
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
