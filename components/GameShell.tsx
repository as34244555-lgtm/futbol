"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  LayoutDashboard,
  LogOut,
  Shield,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { useEffect } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { useGame } from "@/lib/game-context";
import { formatCoins } from "@/lib/utils";
import { weekInSeason, SEASON_WEEKS } from "@/lib/titles";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/squad", label: "Kadro", icon: Users },
  { href: "/tactics", label: "Taktik", icon: Shield },
  { href: "/transfer", label: "Transfer", icon: ArrowLeftRight },
  { href: "/match", label: "Maç", icon: Swords },
  { href: "/league", label: "Lig", icon: Trophy },
];

export function GameShell({ children }: { children: React.ReactNode }) {
  const { ready, userTeam, me, world, backend, humans, logout, roomCode } = useGame();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !userTeam) router.replace("/");
  }, [ready, userTeam, router]);

  if (!ready || !userTeam) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-slate-400">
        Yükleniyor…
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-white/10 bg-ink-900/80 p-4 lg:flex lg:flex-col">
        <Link href="/dashboard" className="mb-8 px-1">
          <BrandLogo size={56} />
        </Link>
        <p className="mb-6 px-2 text-[10px] uppercase tracking-[0.25em] text-slate-500">Çoklu oyuncu</p>
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
          {backend === "supabase" || backend === "kv"
            ? "Paylaşılan lig"
            : backend === "file"
              ? "Yerel lig sunucusu"
              : "Bellek (cihazlar ayrışabilir)"}{" "}
          · {humans} insan
        </p>
        {backend === "memory" && (
          <p className="mt-2 px-3 text-[11px] leading-snug text-amber-300/90">
            İki telefon aynı para/puanı görmüyorsa Vercel → Storage → KV ekleyin; lig o zaman kalıcı paylaşılır.
          </p>
        )}
        <button
          className="mt-auto flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-500 hover:text-rose-300"
          onClick={async () => {
            await logout();
            router.push("/");
          }}
        >
          <LogOut className="h-4 w-4" />
          Çıkış
        </button>
      </aside>
      <div className="flex min-h-[100dvh] flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/10 bg-ink-950/90 px-3 py-2.5 backdrop-blur sm:px-4">
          <Link href="/dashboard" className="lg:hidden">
            <BrandLogo size={36} />
          </Link>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Kulüp</p>
            <p className="truncate font-semibold">{userTeam.name}</p>
          </div>
          <div className="ml-auto flex items-center gap-3 text-sm sm:gap-4">
            <Meta className="hidden sm:block" label="Oda" value={roomCode} />
            <Meta className="hidden md:block" label="Menajer" value={me?.username ?? "-"} />
            <Meta label="S" value={`${world.season || 1}`} />
            <Meta label="H" value={`${weekInSeason(world.week)}/${SEASON_WEEKS}`} />
            <Meta className="hidden xs:block sm:block" label="Puan" value={`${userTeam.points}`} />
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
