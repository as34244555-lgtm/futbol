"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Database,
  LayoutDashboard,
  LogOut,
  Shield,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { useEffect } from "react";
import { useGame } from "@/lib/game-context";
import { formatCoins } from "@/lib/utils";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/squad", label: "Kadro", icon: Users },
  { href: "/tactics", label: "Taktik", icon: Shield },
  { href: "/transfer", label: "Transfer", icon: ArrowLeftRight },
  { href: "/match", label: "Maç", icon: Swords },
  { href: "/league", label: "Lig", icon: Trophy },
  { href: "/import", label: "Topluluk DB", icon: Database },
];

export function GameShell({ children }: { children: React.ReactNode }) {
  const { ready, userTeam, me, world, backend, humans, logout } = useGame();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !userTeam) router.replace("/");
  }, [ready, userTeam, router]);

  if (!ready || !userTeam) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Yükleniyor…
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-white/10 bg-ink-900/80 p-4 lg:flex lg:flex-col">
        <Link href="/dashboard" className="mb-8 px-2">
          <p className="font-display text-3xl tracking-wide text-neon">LIGA NOVA</p>
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Çoklu oyuncu</p>
        </Link>
        <nav className="space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
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
          {backend === "supabase" ? "Vercel + Supabase" : backend === "file" ? "Yerel lig sunucusu" : "Bellek (dev)"} · {humans} insan
        </p>
        <button
          className="mt-auto flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-500 hover:text-rose-300"
          onClick={async () => {
            await logout();
            router.push("/");
          }}
        >
          <LogOut className="h-4 w-4" />
          Çıkış
        </button>
      </aside>
      <div>
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-white/10 bg-ink-950/80 px-4 py-3 backdrop-blur">
          <Link href="/dashboard" className="font-display text-xl text-neon lg:hidden">
            LN
          </Link>
          <div>
            <p className="text-xs text-slate-500">Kulüp</p>
            <p className="font-semibold">{userTeam.name}</p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-4 text-sm">
            <Meta label="Menajer" value={me?.username ?? "-"} />
            <Meta label="Hafta" value={`${world.week}`} />
            <Meta label="Lig" value={`Küme ${userTeam.division}`} />
            <Meta label="Puan" value={`${userTeam.points}`} />
            <span className="rounded-full bg-gold/15 px-3 py-1 font-semibold text-gold">
              {formatCoins(userTeam.coins)} ₡
            </span>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-white/10 px-2 py-2 lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1 text-xs",
                pathname === item.href ? "bg-neon text-ink-950" : "bg-white/5",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
