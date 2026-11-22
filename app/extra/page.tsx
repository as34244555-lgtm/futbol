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
    { href: "/ranked", icon: Shield, title: "Ranked", text: "Division · RP tablosu" },
    { href: "/friendly", icon: Flag, title: "Friendly", text: "vs CPU / dostluk lobisi" },
    { href: "/tactics", icon: Shield, title: t("nav.tactics"), text: t("extra.tactics") },
    { href: "/inbox", icon: Inbox, title: t("nav.inbox"), text: t("extra.inbox") },
    { href: "/gizlilik", icon: Flag, title: t("privacy"), text: t("extra.legal") },
    { href: "/kosullar", icon: FileText, title: t("terms"), text: t("extra.legal") },
  ];

  return (
    <GameShell>
      <p className="text-[10px] uppercase tracking-[0.35em] text-[#d4af37]">{t("nav.extra")}</p>
      <h1 className="font-display mt-1 text-4xl">{t("extra.title")}</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.href}
              href={tile.href}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-[#101826] to-[#0a1018] px-4 py-4 hover:border-[#d4af37]/40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-[#d4af37]">
                <Icon className="h-6 w-6" />
              </span>
              <span>
                <p className="font-semibold">{tile.title}</p>
                <p className="text-sm text-slate-400">{tile.text}</p>
              </span>
            </Link>
          );
        })}
      </div>
    </GameShell>
  );
}
