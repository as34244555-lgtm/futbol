"use client";

import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useState } from "react";

/** eFootball Goal odası — Şut ve Gol */
export default function GoalRoomPage() {
  const [power, setPower] = useState(62);
  const [angle, setAngle] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [flying, setFlying] = useState(false);

  const shoot = () => {
    if (flying) return;
    setFlying(true);
    setResult(null);
    window.setTimeout(() => {
      const aim = Math.abs(angle);
      const sweet = power > 48 && power < 86 && aim < 28;
      const near = power > 35 && power < 95 && aim < 42;
      setAttempts((n) => n + 1);
      if (sweet) {
        setScore((s) => s + 1);
        setResult("GOL!");
      } else if (near) {
        setResult(aim > 20 ? "DIREK!" : "KALECİ!");
      } else {
        setResult("AUT");
      }
      setFlying(false);
    }, 520);
  };

  return (
    <GameShell bare>
      <div className="relative flex h-full w-full">
        {/* Full-bleed goal scene */}
        <section className="relative min-w-0 flex-1 overflow-hidden bg-[#0a1a12]">
          <div
            className="absolute inset-0"
            style={{ background: "repeating-linear-gradient(90deg,#0f6b35 0 40px,#148a42 40px 80px)" }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,transparent_20%,rgba(0,0,0,0.45)_100%)]" />

          {/* Goal frame */}
          <div className="absolute inset-x-[16%] top-[8%] h-[52%] rounded-b-[2%] border-[3px] border-white/90 bg-black/15 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "8% 12%" }} />
            <div className="absolute inset-x-[18%] top-0 h-[55%] border-x-2 border-b-2 border-white/70" />
          </div>

          {/* Ball */}
          <div
            className={`absolute bottom-[14%] left-1/2 h-5 w-5 rounded-full bg-white shadow-[0_0_24px_rgba(255,255,255,0.85)] transition-transform duration-500 ${flying ? "scale-75" : ""}`}
            style={{
              transform: flying
                ? `translate(calc(-50% + ${angle * 3.2}px), -42vh) scale(0.55)`
                : `translate(calc(-50% + ${angle * 2.2}px), 0)`,
            }}
          />

          <div className="absolute left-4 top-4 rounded-xl bg-black/55 px-3 py-2 text-sm backdrop-blur">
            <span className="text-[#e7c56a]">{score}</span>
            <span className="text-white/50"> / {attempts}</span>
          </div>

          {result && (
            <div className="absolute left-1/2 top-[38%] -translate-x-1/2 rounded-2xl bg-black/75 px-8 py-3 font-display text-4xl text-[#e7c56a] shadow-2xl">
              {result}
            </div>
          )}

          {/* Bottom controls overlay */}
          <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-[clamp(0.75rem,2vw,1.5rem)] pb-4 pt-16">
            <button
              type="button"
              onClick={() => history.back()}
              className="flex min-h-11 items-center gap-1 rounded-r-xl rounded-l-md bg-[#1f8fff] px-5 text-sm font-bold text-white"
            >
              ‹ Geri
            </button>
            <div className="flex min-w-0 flex-1 flex-wrap items-end gap-4">
              <label className="min-w-[140px] flex-1 text-xs text-white/70">
                Açı {angle}
                <input
                  type="range"
                  min={-45}
                  max={45}
                  value={angle}
                  onChange={(e) => setAngle(Number(e.target.value))}
                  className="mt-1 w-full accent-[#1f8fff]"
                />
              </label>
              <label className="min-w-[140px] flex-1 text-xs text-white/70">
                Güç {power}
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={power}
                  onChange={(e) => setPower(Number(e.target.value))}
                  className="mt-1 w-full accent-[#ff7a12]"
                />
              </label>
            </div>
            <Button size="lg" className="min-w-[7rem] bg-[#ff7a12] text-white hover:bg-[#ff8c2e]" onClick={shoot} disabled={flying}>
              ŞUT
            </Button>
            <Link href="/match" className="hidden text-sm text-[#7eb6ff] sm:block">
              Maç →
            </Link>
          </div>
        </section>
      </div>
    </GameShell>
  );
}
