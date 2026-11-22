"use client";

import { GameShell } from "@/components/GameShell";
import { useI18n } from "@/lib/i18n";
import { Inbox, Shield, Trophy, Flag, FileText } from "lucide-react";
import Link from "next/link";

export default function ExtraPage() {
  const { t } = useI18n();
  const tiles = [
    { href: "/league", icon: Trophy, title: t("nav.league"), text: t("extra.league") },
    { href: "/packs", icon: Trophy, title: "Paketler", text: "Gacha · coin/gem paket açılışı" },
    { href: "/events", icon: Inbox, title: "Görevler", text: "Günlük login · battle pass" },
    { href: "/goal", icon: Flag, title: "Şut ve Gol", text: "Goal odası · şut antrenmanı" },
    { href: "/ranked", icon: Shield, title: "Ranked", text: "Division · RP tablosu" },
    { href: "/friendly", icon: Flag, title: "Friendly", text: "vs CPU / dostluk lobisi" },
    { href: "/tactics", icon: Shield, title: t("nav.tactics"), text: t("extra.tactics") },
    { href: "/inbox", icon: Inbox, title: t("nav.inbox"), text: t("extra.inbox") },
    { href: "/gizlilik", icon: Flag, title: t("privacy"), text: t("extra.legal") },
    { href: "/kosullar", icon: FileText, title: t("terms"), text: t("extra.legal") },
  ];

  return (
    <GameShell flush>
      <div className="flex h-[calc(100dvh-6.2rem)] w-full flex-col px-[clamp(0.6rem,1.8vw,1.35rem)]">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#5aa8ff]">{t("nav.extra")}</p>
        <h1 className="font-display text-3xl sm:text-4xl">{t("extra.title")}</h1>
        <div className="mt-4 grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto lg:grid-cols-4 xl:grid-cols-5">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.href}
                href={tile.href}
                className="flex min-h-[5.5rem] items-center gap-3 rounded-2xl border border-white/10 bg-[#101826]/90 px-3 py-3 hover:border-[#5aa8ff]/45"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[#5aa8ff]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <p className="truncate font-semibold">{tile.title}</p>
                  <p className="truncate text-xs text-slate-400">{tile.text}</p>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
}
