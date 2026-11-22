"use client";

import { Button } from "@/components/ui/Button";
import { TutorialOverlay } from "@/components/TutorialOverlay";
import { useGame } from "@/lib/game-context";
import { useI18n } from "@/lib/i18n";
import { flagUrl } from "@/lib/nations";
import { weekInSeason, SEASON_WEEKS } from "@/lib/titles";
import { formatCoins } from "@/lib/utils";
import { Bell, Info, LogOut, Mail, Swords, Users, ShoppingBag, Package, Trophy, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const RAIL = [
  { href: "/match", label: "Maç", icon: Swords },
  { href: "/squad", label: "Kadro", icon: Users },
  { href: "/transfer", label: "Pazar", icon: ShoppingBag },
  { href: "/packs", label: "Paket", icon: Package },
  { href: "/ranked", label: "Ranked", icon: Trophy },
  { href: "/events", label: "Etkinlik", icon: Sparkles },
] as const;

export function HomeMenu() {
  const { world, userTeam, logout, claimRewarded } = useGame();
  const { t, lang, setLang } = useI18n();
  const [settings, setSettings] = useState(false);
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

  useEffect(() => {
    if (!adOpen || adLeft <= 0) return;
    const timer = window.setTimeout(() => setAdLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [adOpen, adLeft]);

  return (
    <div className="ef-landscape relative h-[100dvh] w-full overflow-hidden text-white">
      <StadiumBackdrop />
      <div className="relative z-10 flex h-full w-full">
        {/* Left mode rail — eFootball style */}
        <aside className="flex w-[4.75rem] shrink-0 flex-col items-center gap-1 border-r border-white/10 bg-black/55 py-3 backdrop-blur-md sm:w-24">
          <Image src="/a-studio-icon.png" alt="" width={36} height={36} className="mb-2 h-9 w-9 rounded-md object-contain" />
          {RAIL.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex w-full flex-col items-center gap-1 px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-white/75 hover:bg-white/10 hover:text-white"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 group-hover:bg-[#e7c56a] group-hover:text-black">
                  <Icon className="h-5 w-5" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </aside>

        {/* Main stage */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 px-4 py-2">
            <p className="font-display text-2xl tracking-wide text-white drop-shadow sm:text-3xl">e-futbol</p>
            {userTeam?.nation && (
              <img src={flagUrl(userTeam.nation, 80)} alt="" className="h-4 w-7 rounded-sm object-cover ring-1 ring-white/30" />
            )}
            <span className="flex items-center gap-1 text-sm font-semibold text-[#f5c542]">
              <GoldBallIcon />
              {formatCoins(userTeam?.points ?? 0)}
            </span>
            <span className="flex items-center gap-1 text-sm font-semibold">
              <Image src="/a-studio-icon.png" alt="" width={18} height={18} className="h-4 w-4 rounded-sm" />
              {formatCoins(userTeam?.coins ?? 0)}
            </span>
            <span className="text-sm font-semibold text-cyan-300">◆ {formatCoins(userTeam?.gems ?? 0)}</span>
            <div className="ml-auto flex items-center gap-3">
              <button type="button" aria-label={t("settings")} onClick={() => setSettings(true)} className="text-[#7eb6ff]">
                <Info className="h-5 w-5" />
              </button>
              <Link href="/inbox" className="relative text-[#8eb4ff]">
                <Mail className="h-5 w-5" />
                {news > 0 && <Badge n={news} />}
              </Link>
              <button type="button" className="text-[#49a2ff]" onClick={() => setSettings(true)} aria-label="bildirim">
                <Bell className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.4fr)_minmax(220px,0.85fr)] gap-3 px-4 pb-4">
            {/* Center: match hub */}
            <section className="relative flex flex-col overflow-hidden rounded-2xl border border-white/15 bg-black/40 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              <div className="relative z-10 mt-auto p-5 sm:p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#e7c56a]">Game Plan</p>
                <h1 className="font-display mt-1 text-3xl sm:text-5xl">
                  {opponent ? `${userTeam?.name} vs ${opponent.name}` : "Canlı maç"}
                </h1>
                <p className="mt-2 max-w-xl text-sm text-white/75">
                  Hafta {weekInSeason(world.week)}/{SEASON_WEEKS} · skill, duran top ve taktikle sahaya çık.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/match"
                    className="rounded-xl bg-[#e7c56a] px-5 py-3 text-sm font-bold uppercase tracking-wide text-black shadow-[0_0_24px_rgba(231,197,106,0.35)]"
                  >
                    Maça git
                  </Link>
                  <Link
                    href="/friendly"
                    className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold uppercase tracking-wide"
                  >
                    Friendly / CPU
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setAdMsg(null);
                      setAdLeft(8);
                      setAdOpen(true);
                    }}
                    className="rounded-xl border border-[#f5c542]/40 bg-[#3a2a08]/80 px-4 py-3 text-sm font-semibold text-[#f5c542]"
                  >
                    +500 Coin
                  </button>
                </div>
              </div>
            </section>

            {/* Right panels */}
            <aside className="flex min-h-0 flex-col gap-3">
              <Link
                href="/transfer"
                className="flex flex-1 flex-col justify-between rounded-2xl border border-white/12 bg-gradient-to-br from-[#0c1a2e] to-[#071018] p-4"
              >
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">Contract</p>
                  <p className="font-display mt-1 text-2xl">Oyuncu Pazarı</p>
                  <p className="mt-1 text-xs text-white/60">Kart al, boost uygula, chemistry kur.</p>
                </div>
                <span className="mt-3 text-xs font-semibold text-[#e7c56a]">Pazara git →</span>
              </Link>
              <Link
                href="/packs"
                className="flex flex-1 flex-col justify-between rounded-2xl border border-orange-400/25 bg-gradient-to-br from-[#2a1508] to-[#120a06] p-4"
              >
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-300">Gacha</p>
                  <p className="font-display mt-1 text-2xl">Oyuncu Paketi</p>
                  <p className="mt-1 text-xs text-white/60">Coin veya gem ile 3 kart çek.</p>
                </div>
                <span className="mt-3 text-xs font-semibold text-orange-300">Paket aç →</span>
              </Link>
              <Link
                href="/ranked"
                className="flex flex-1 flex-col justify-between rounded-2xl border border-violet-400/25 bg-gradient-to-br from-[#1a0f2a] to-[#0a0614] p-4"
              >
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-300">Division</p>
                  <p className="font-display mt-1 text-2xl">Ranked</p>
                  <p className="mt-1 text-xs text-white/60">RP kazan, kademe yüksel.</p>
                </div>
                <span className="mt-3 text-xs font-semibold text-violet-300">Sıralama →</span>
              </Link>
            </aside>
          </div>
        </div>
      </div>

      {adOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#f5c542]/40 bg-[#120e08] p-6 text-center">
            <p className="text-xs font-bold tracking-[0.22em] text-[#f5c542]">ÖDÜLLÜ REKLAM</p>
            <p className="font-display mt-3 text-5xl">500 Coin</p>
            <p className="mt-2 text-sm text-white/70">İzleme bitince coin hesabına eklenir.</p>
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
          </div>
        </div>
      )}
      <TutorialOverlay />
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
        <path d="M0 160 H1600 L1500 430 H100 Z" fill="#10192b" />
        {SEAT_COLORS.map((color, i) =>
          Array.from({ length: 6 }, (_, row) => (
            <rect key={`${i}-${row}`} x={48 + i * 192} y={184 + row * 36} width="168" height="22" rx="4" fill={color} opacity={0.72} />
          )),
        )}
        {stripes.map((d, i) => (
          <path key={d} d={d} fill={i % 2 ? "#117a38" : "#1cb454"} />
        ))}
        <path d="M260 430 H1340 L1680 760 H-80 Z" fill="none" stroke="#fff" strokeWidth="5" />
        <line x1="800" y1="430" x2="800" y2="760" stroke="#fff" strokeWidth="4" />
        <ellipse cx="800" cy="620" rx="78" ry="28" fill="none" stroke="#fff" strokeWidth="4" />
        <path d={pitchBox(0, 0.16, 0.22, 0.78)} fill="none" stroke="#fff" strokeWidth="4" />
        <path d={pitchBox(0.84, 1, 0.22, 0.78)} fill="none" stroke="#fff" strokeWidth="4" />
        <rect width="1600" height="900" fill="url(#bgShade)" />
      </svg>
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
