"use client";

import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/game-context";
import { BATTLE_PASS, ensureTeamMeta } from "@/lib/meta";
import { formatCoins } from "@/lib/utils";
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
    <GameShell>
      <p className="text-[10px] uppercase tracking-[0.35em] text-[#d4af37]">Etkinlik</p>
      <h1 className="font-display mt-1 text-4xl">Görevler</h1>
      <div className="mt-3 flex gap-3 text-sm">
        <span>₡ {formatCoins(meta?.coins ?? 0)}</span>
        <span className="text-cyan-300">◆ {formatCoins(meta?.gems ?? 0)}</span>
        <span className="text-[#e7c56a]">BP {meta?.battleXp ?? 0}</span>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-[#101826] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Günlük giriş</p>
            <p className="text-sm text-slate-400">+400 coin · +5 gem</p>
          </div>
          <Button size="sm" onClick={() => void run(() => dailyLogin(), "Giriş ödülü alındı")}>
            Al
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {(meta?.quests ?? []).map((q) => (
          <div key={q.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-3">
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

      <h2 className="mt-8 text-lg font-semibold">Battle Pass (sade)</h2>
      <div className="mt-3 space-y-2">
        {BATTLE_PASS.map((tier, i) => {
          if (i === 0) return null;
          const claimed = (meta?.battleClaimed ?? []).includes(i);
          const ready = (meta?.battleXp ?? 0) >= tier.xp;
          return (
            <div key={i} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2">
              <p className="text-sm">
                Kademe {i} · {tier.xp} XP · +{tier.coins}₡ +{tier.gems}◆
              </p>
              <Button size="sm" disabled={!ready || claimed} onClick={() => void run(() => claimBattle(i), "BP ödülü")}>
                {claimed ? "Alındı" : "Al"}
              </Button>
            </div>
          );
        })}
      </div>
      {msg && <p className="mt-4 text-sm text-[#e7c56a]">{msg}</p>}
    </GameShell>
  );
}
