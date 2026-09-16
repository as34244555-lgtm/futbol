"use client";

import type { NewsItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const TONE: Record<NewsItem["kind"], string> = {
  injury: "border-rose-500/40 bg-rose-500/10 text-rose-100",
  wage: "border-amber-400/40 bg-amber-400/10 text-amber-100",
  contract: "border-slate-400/30 bg-slate-500/10 text-slate-200",
  transfer: "border-neon/40 bg-neon/10 text-neon",
  cup: "border-gold/40 bg-gold/10 text-gold",
  title: "border-gold/50 bg-gold/15 text-gold",
  form: "border-sky-400/30 bg-sky-400/10 text-sky-100",
  ready: "border-violet-400/40 bg-violet-400/10 text-violet-100",
  growth: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
  youth: "border-lime-400/40 bg-lime-400/10 text-lime-100",
  retire: "border-white/20 bg-white/5 text-slate-300",
};

const LABEL: Record<NewsItem["kind"], string> = {
  injury: "Sakatlık",
  wage: "Maaş",
  contract: "Sözleşme",
  transfer: "Transfer",
  cup: "Kupa",
  title: "Şampiyon",
  form: "Maç",
  ready: "Hazır",
  growth: "Gelişim",
  youth: "Altyapı",
  retire: "Emekli",
};

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <div className={cn("rounded-2xl border px-4 py-3", TONE[item.kind] ?? "border-white/10 bg-ink-800")}>
      <p className="text-[10px] uppercase tracking-wider opacity-70">
        Sezon {item.season} · Hafta {item.week} · {LABEL[item.kind] ?? item.kind}
      </p>
      <p className="mt-1 text-sm text-slate-100">{item.text}</p>
    </div>
  );
}
