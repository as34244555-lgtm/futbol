"use client";

import { GameShell } from "@/components/GameShell";
import { PlayerCard } from "@/components/PlayerCard";
import { TacticsPitch } from "@/components/TacticsPitch";
import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/game-context";
import { TACTIC_LABEL } from "@/lib/types";
import { rosterOf } from "@/lib/world";
import { formatCoins } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function DashboardPage() {
  const { world, userTeam, managers, ensureWeekFixtures, humans, bots, roomCode } = useGame();
  const [copied, setCopied] = useState(false);
  const roster = useMemo(
    () => (userTeam ? rosterOf(world, userTeam.id) : []),
    [world, userTeam],
  );
  const starters = roster.filter((r) => r.is_starter);
  const next = world.matches.find(
    (m) =>
      m.week === world.week &&
      m.status === "pending" &&
      (m.home_team_id === userTeam?.id || m.away_team_id === userTeam?.id),
  );
  const oppId = next
    ? next.home_team_id === userTeam?.id
      ? next.away_team_id
      : next.home_team_id
    : null;
  const opponent = world.teams.find((t) => t.id === oppId);

  return (
    <GameShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Kulüp paneli</p>
          <h1 className="font-display text-4xl sm:text-5xl">{userTeam?.name}</h1>
        </div>
        <Button variant="ghost" onClick={() => void ensureWeekFixtures()}>
          Fikstürü hazırla
        </Button>
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-neon/20 bg-neon/5 px-4 py-3 text-sm">
        <span className="text-slate-400">Arkadaş odası</span>
        <span className="font-mono text-lg tracking-[0.3em] text-neon">{roomCode}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(roomCode);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "Kopyalandı" : "Kodu kopyala"}
        </Button>
        <span className="text-slate-500">Arkadaşın kayıt/girişte aynı kodu yazsın.</span>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat title="Bütçe" value={`${formatCoins(userTeam?.coins ?? 0)} ₡`} />
        <Stat title="Puan / Küme" value={`${userTeam?.points} · ${userTeam?.division}`} />
        <Stat title="Kadro" value={`${roster.length} oyuncu`} />
        <Stat title="Taktik" value={`${userTeam?.formation} · ${userTeam ? TACTIC_LABEL[userTeam.tactics] : ""}`} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-ink-800/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-2xl">Sıradaki maç</h2>
            <Link href="/match" prefetch={false}>
              <Button size="sm">Maça git</Button>
            </Link>
          </div>
          {opponent ? (
            <p className="text-slate-300">
              Hafta {world.week}: {next?.home_team_id === userTeam?.id ? "Ev sahibi" : "Deplasman"} —{" "}
              <span className="text-neon">{opponent.name}</span>
              {opponent.user_id ? " · insan menajer" : " · bot menajer"}
            </p>
          ) : (
            <p className="text-slate-400">Fikstür henüz yok. Maç ekranından haftayı başlatın.</p>
          )}
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-slate-500">G</p>
              <p className="font-display text-3xl">{userTeam?.won}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-slate-500">B</p>
              <p className="font-display text-3xl">{userTeam?.drawn}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-slate-500">M</p>
              <p className="font-display text-3xl">{userTeam?.lost}</p>
            </div>
          </div>
        </div>
        {userTeam && (
          <TacticsPitch formation={userTeam.formation} roster={starters} kit={userTeam.kit_primary} />
        )}
      </div>
      <h2 className="font-display mt-10 text-2xl">Menajer odası</h2>
      <p className="mt-1 text-sm text-slate-500">
        {humans} gerçek menajer · {bots} bot. Botlar her hafta kendi aralarında oynar; iki gerçek menajer varsa
        onlar eşleşir.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {managers.map((m) => (
          <div
            key={m.userId}
            className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
              m.kind === "bot" ? "border-white/5 bg-ink-800/50" : "border-white/10 bg-ink-800"
            }`}
          >
            <div>
              <p className="font-medium">{m.username}</p>
              <p className="text-xs text-slate-500">{m.teamName}</p>
            </div>
            <div className="text-right">
              <span
                className={
                  m.kind === "human"
                    ? "text-[10px] uppercase tracking-wider text-gold"
                    : "text-[10px] uppercase tracking-wider text-slate-500"
                }
              >
                {m.kind === "human" ? "insan" : "bot"}
              </span>
              <p className={m.online ? "text-xs text-neon" : "text-xs text-slate-500"}>
                {m.kind === "bot" ? "hazır" : m.online ? "çevrimiçi" : "çevrimdışı"}
              </p>
            </div>
          </div>
        ))}
        {managers.length === 0 && <p className="text-sm text-slate-500">Henüz menajer yok.</p>}
      </div>
      <h2 className="font-display mt-10 text-2xl">Yıldızlar</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {starters.slice(0, 6).map((r) => (
          <PlayerCard key={r.id} player={r.player} row={r} />
        ))}
      </div>
    </GameShell>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-800/70 p-4">
      <p className="text-xs uppercase tracking-wider text-slate-500">{title}</p>
      <p className="mt-1 font-display text-3xl">{value}</p>
    </div>
  );
}
