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
    }, 900);
    return () => window.clearTimeout(t);
  }, [i, pulls.length]);

  const current = i >= 0 ? pulls[i] : null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1230] to-[#070a12] p-5 text-center text-white shadow-2xl">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#d4af37]">Paket açılışı</p>
        <div className={`mx-auto mt-4 flex min-h-[280px] items-center justify-center ${shake ? "animate-pulse" : ""}`}>
          {!current ? (
            <div className="h-40 w-28 rounded-2xl bg-gradient-to-br from-[#7c3aed] via-[#22d3ee] to-[#f472b6] shadow-[0_0_40px_rgba(124,58,237,0.55)]" />
          ) : (
            <div className="w-[200px] animate-[fadeIn_0.4s_ease]">
              <PlayerCard player={current.player} featured compact />
              <p className="mt-2 text-xs uppercase tracking-wider text-[#a5b4fc]">{current.fromPool}</p>
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-slate-300">
          {i < 0 ? "Paket sallanıyor…" : `${i + 1} / ${pulls.length}`}
        </p>
        <Button className="mt-4 w-full" onClick={onClose} disabled={i < pulls.length - 1 && i >= 0}>
          {i >= pulls.length - 1 ? "Tamam" : "Açılıyor…"}
        </Button>
      </div>
    </div>
  );
}
