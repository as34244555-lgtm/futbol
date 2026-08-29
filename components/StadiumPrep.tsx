"use client";

import { motion } from "framer-motion";

export function StadiumPrep({
  home,
  away,
  stadium,
}: {
  home: string;
  away: string;
  stadium: string;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-gold/30 bg-ink-900">
      <div className="relative aspect-[16/10] min-h-[220px] sm:min-h-[280px]">
        <div className="pitch-stripes absolute inset-0 opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/50" />
        <span className="absolute left-[18%] top-4 h-24 w-1 rotate-12 bg-gradient-to-b from-amber-50 to-transparent blur-[1px]" />
        <span className="absolute right-[18%] top-4 h-24 w-1 -rotate-12 bg-gradient-to-b from-amber-50 to-transparent blur-[1px]" />
        <div className="absolute inset-x-8 top-8 rounded-sm border border-white/30" />
        <div className="absolute left-1/2 top-8 h-[calc(100%-4rem)] w-px -translate-x-1/2 bg-white/30" />
        <motion.div
          className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-900 to-transparent"
          animate={{ opacity: [0.6, 1, 0.7] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gold">Stadyum hazırlanıyor</p>
          <p className="font-display mt-2 text-3xl sm:text-5xl">{stadium}</p>
          <p className="mt-3 text-sm text-slate-300 sm:text-lg">
            {home} <span className="text-slate-500">vs</span> {away}
          </p>
          <p className="mt-4 animate-pulse text-xs uppercase tracking-[0.28em] text-neon">Işıklar · tribün · düdük</p>
        </div>
      </div>
    </div>
  );
}
