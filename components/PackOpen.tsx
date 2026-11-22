"use client";

import { PlayerCard } from "@/components/PlayerCard";
import { Button } from "@/components/ui/Button";
import { playPackReveal } from "@/lib/sfx";
import type { Player } from "@/lib/types";
import { useEffect, useState } from "react";

export function PackOpen({
  pulls,
  onClose,
}: {
  pulls: Array<{ player: Player; fromPool: string }>;
  onClose: () => void;
}) {
  const [i, setI] = useState(-1);
  const [shake, setShake] = useState(true);

  useEffect(() => {
    playPackReveal();
    const t1 = window.setTimeout(() => setShake(false), 900);
    const t2 = window.setTimeout(() => setI(0), 1000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    if (i < 0 || i >= pulls.length - 1) return;
    const t = window.setTimeout(() => {
      playPackReveal();
      setI((n) => n + 1);
    }, 1100);
    return () => window.clearTimeout(t);
  }, [i, pulls.length]);

  const current = i >= 0 ? pulls[i] : null;
  const poolLabel =
    current?.fromPool === "legend"
      ? "BIG TIME"
      : current?.fromPool === "special"
        ? "EPIC / ÖZEL"
        : "STANDART";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#e7c56a]/35 bg-gradient-to-b from-[#1a1230] via-[#0b1020] to-[#070a12] p-5 text-center text-white shadow-[0_0_80px_rgba(231,197,106,0.25)]">
        <div className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-[#7c3aed]/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-[#22d3ee]/20 blur-3xl" />
        <p className="relative text-[10px] uppercase tracking-[0.4em] text-[#e7c56a]">Özel paket açılışı</p>
        <div className={`relative mx-auto mt-4 flex min-h-[320px] items-center justify-center ${shake ? "animate-pulse" : ""}`}>
          {!current ? (
            <div className="relative h-48 w-32">
              <div className="absolute inset-0 rotate-[-8deg] rounded-2xl bg-gradient-to-br from-[#7c3aed] via-[#22d3ee] to-[#f472b6] opacity-70 blur-[2px]" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#e7c56a] via-[#7c3aed] to-[#22d3ee] shadow-[0_0_50px_rgba(124,58,237,0.65)]" />
              <p className="absolute inset-0 flex items-center justify-center font-display text-3xl text-black/80">?</p>
            </div>
          ) : (
            <div className="w-[220px] animate-[fadeIn_0.45s_ease] sm:w-[250px]">
              <PlayerCard player={current.player} featured />
              <p className="mt-3 text-xs font-bold tracking-[0.28em] text-[#a5b4fc]">{poolLabel}</p>
            </div>
          )}
        </div>
        <p className="relative mt-2 text-sm text-slate-300">
          {i < 0 ? "Paket sallanıyor…" : `${i + 1} / ${pulls.length}`}
        </p>
        <Button className="relative mt-4 w-full" onClick={onClose} disabled={i < pulls.length - 1 && i >= 0}>
          {i >= pulls.length - 1 ? "Kadroya ekle" : "Açılıyor…"}
        </Button>
      </div>
    </div>
  );
}
