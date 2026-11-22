"use client";

import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/game-context";
import { BATTLE_PASS, ensureTeamMeta } from "@/lib/meta";
import { formatCoins } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

const QUEST_LABEL: Record<string, string> = {
  login: "Günlük giriş",
  play_match: "1 maç oyna",
  open_pack: "1 paket aç",
  train_card: "Kart antrenmanı / boost",
  win_match: "1 maç kazan",
};

export default function EventsPage() {
  const { userTeam, dailyLogin, claimQuest, claimBattle } = useGame();
  const [msg, setMsg] = useState<string | null>(null);
  const meta = userTeam ? ensureTeamMeta(userTeam) : null;

  const run = async (fn: () => Promise<string | null>, ok = "Tamam") => {
    const err = await fn();
    setMsg(err ?? ok);
  };

  return (
    <GameShell flush>
      <div className="flex h-[calc(100dvh-6.2rem)] w-full flex-col px-[clamp(0.6rem,1.8vw,1.35rem)]">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#5aa8ff]">Görevler</p>
            <h1 className="font-display text-3xl sm:text-4xl">Etkinlikler</h1>
          </div>
          <div className="flex gap-3 text-sm">
            <span>₡ {formatCoins(meta?.coins ?? 0)}</span>
            <span className="text-cyan-300">◆ {formatCoins(meta?.gems ?? 0)}</span>
            <span className="text-[#e7c56a]">BP {meta?.battleXp ?? 0}</span>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto md:grid-cols-3">
          <Link
            href="/packs"
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a1a12] p-4 ring-1 ring-white/5"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,#3dff8a44,transparent_50%)]" />
            <div className="relative">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#9dffb0]">POTW</p>
              <p className="font-display mt-1 text-2xl">Haftanın Oyuncuları</p>
              <p className="mt-2 text-xs text-white/60">Bitmesine: 3 gün 5 sa</p>
            </div>
          </Link>

          <div className="rounded-2xl border border-white/10 bg-[#101826] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Günlük giriş</p>
                <p className="text-sm text-slate-400">+400 coin · +5 gem</p>
              </div>
              <Button size="sm" onClick={() => void run(() => dailyLogin(), "Giriş ödülü alındı")}>
                Al
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              {(meta?.quests ?? []).map((q) => (
                <div key={q.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{QUEST_LABEL[q.id] ?? q.id}</p>
                    <p className="text-xs text-slate-400">
                      {q.progress}/{q.target} · +{q.rewardCoins}₡ +{q.rewardGems}◆
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={q.claimed || q.progress < q.target}
                    onClick={() => void run(() => claimQuest(q.id), "Görev alındı")}
                  >
                    {q.claimed ? "Alındı" : "Al"}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101826] p-4">
            <p className="font-semibold">Battle Pass</p>
            <div className="mt-3 space-y-2">
              {BATTLE_PASS.map((tier, i) => {
                if (i === 0) return null;
                const claimed = (meta?.battleClaimed ?? []).includes(i);
                const ready = (meta?.battleXp ?? 0) >= tier.xp;
                return (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2">
                    <p className="text-sm">
                      Kademe {i} · {tier.xp} XP
                    </p>
                    <Button size="sm" disabled={!ready || claimed} onClick={() => void run(() => claimBattle(i), "BP ödülü")}>
                      {claimed ? "Alındı" : "Al"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {msg && <p className="mt-2 text-sm text-[#e7c56a]">{msg}</p>}
      </div>
    </GameShell>
  );
}
