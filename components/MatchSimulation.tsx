"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, FastForward, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MatchSimulationResult, Player, Team, TeamPlayer } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { PlayerCard } from "@/components/PlayerCard";
import { StadiumBowl } from "@/components/StadiumBowl";
import { StadiumMatch } from "@/components/scene/StadiumMatch";
import { normalizeStadium } from "@/lib/stadium";
import { delayForEvent, delayForHighlight, densifyTimeline, highlightEvents } from "@/lib/match-playback";
import { cn } from "@/lib/utils";
import { isMuted, playByEvent, playKick, setMuted, unlockAudio } from "@/lib/sfx";

type Roster = TeamPlayer & { player: Player };

const SPEEDS = [1, 2, 4] as const;

function cycleSpeed(s: (typeof SPEEDS)[number]): (typeof SPEEDS)[number] {
  const i = SPEEDS.indexOf(s);
  return SPEEDS[(i + 1) % SPEEDS.length]!;
}

export function MatchSimulation({
  result,
  home,
  away,
  homeRoster,
  awayRoster,
  onClose,
}: {
  result: MatchSimulationResult;
  home: Team;
  away: Team;
  homeRoster: Roster[];
  awayRoster: Roster[];
  onClose?: () => void;
}) {
  const fullEvents = useMemo(() => densifyTimeline(result, home.name, away.name), [result, home.name, away.name]);
  const [mode, setMode] = useState<"highlights" | "full">("highlights");
  const events = useMemo(
    () => (mode === "highlights" ? highlightEvents(fullEvents) : fullEvents),
    [mode, fullEvents],
  );
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [mute, setMute] = useState(false);
  const [shake, setShake] = useState(false);
  const [goalFlash, setGoalFlash] = useState(false);
  const lastSfx = useRef<string>("");

  useEffect(() => {
    setIdx(0);
    setPlaying(true);
    setSpeed(1);
    setMute(isMuted());
    lastSfx.current = "";
    void unlockAudio();
  }, [result.match.id]);

  const safeIdx = events.length ? Math.min(idx, events.length - 1) : 0;
  const event = events[safeIdx];

  useEffect(() => {
    if (!playing || events.length === 0) return;
    const current = events[Math.min(idx, events.length - 1)];
    const delay =
      mode === "highlights"
        ? delayForHighlight(current ?? events[0]!, speed)
        : delayForEvent(current ?? events[0]!, null, speed);
    const t = window.setTimeout(() => {
      setIdx((i) => {
        if (i >= events.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, delay);
    return () => window.clearTimeout(t);
  }, [playing, idx, speed, events, result.match.id, mode]);

  useEffect(() => {
    if (!event) return;
    const key = `${event.minute}-${event.eventType}-${event.actorId ?? ""}-${event.score.join(":")}`;
    if (lastSfx.current === key) return;
    lastSfx.current = key;
    if (event.minute === 1) playByEvent("kickoff");
    else if (event.eventType === "goal") {
      playByEvent("goal");
      setShake(true);
      setGoalFlash(true);
      window.setTimeout(() => setShake(false), 750);
      window.setTimeout(() => setGoalFlash(false), 3200);
    } else if (event.eventType === "shot" || event.eventType === "chance") playKick();
    else if (event.minute === 45 || event.minute === 90) playByEvent("whistle");
  }, [event]);

  const commentary = events.slice(Math.max(0, safeIdx - 12), safeIdx + 1).reverse();
  const homeStarters = useMemo(() => homeRoster.filter((r) => r.is_starter).slice(0, 11), [homeRoster]);
  const awayStarters = useMemo(() => awayRoster.filter((r) => r.is_starter).slice(0, 11), [awayRoster]);
  const scorer =
    event?.eventType === "goal" && event.actorId
      ? [...homeRoster, ...awayRoster].find((r) => r.player.id === event.actorId)
      : undefined;
  const stadium = `${home.name} Arena`;

  if (!event) {
    return (
      <div className="rounded-3xl border border-white/10 bg-ink-900 p-6 text-slate-400">
        Anlatım yüklenemedi. Maçı tekrar başlatın.
      </div>
    );
  }

  const onGoal = event.eventType === "goal" || goalFlash;

  return (
    <div className={cn("grid gap-4 lg:grid-cols-[1.4fr_0.8fr]", shake && "screen-shake")}>
      <div className="order-2 overflow-hidden rounded-3xl border border-white/10 bg-ink-900 lg:order-1">
        <div className="flex items-center justify-between gap-2 bg-black/40 px-3 py-3 sm:px-4">
          <TeamScore name={home.name} score={event.score[0]} kit={home.kit_primary} align="left" />
          <div className="shrink-0 text-center">
            <p className="font-display text-2xl tabular-nums text-white sm:text-3xl">
              {String(event.minute).padStart(2, "0")}&apos;
            </p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
              {mode === "highlights" ? "Özet" : "Canlı"} · {speed}x
            </p>
          </div>
          <TeamScore name={away.name} score={event.score[1]} kit={away.kit_primary} align="right" />
        </div>
        <div
          className={cn(
            "min-h-[3.5rem] border-b border-white/10 px-3 py-3 text-center text-sm font-medium sm:px-4 sm:text-base",
            event.eventType === "goal" ? "bg-gold/15 text-gold" : "bg-black/35 text-slate-100",
          )}
        >
          <span className="mr-2 font-mono text-sm text-slate-400">{String(event.minute).padStart(2, "0")}&apos;</span>
          {event.eventType === "goal" ? `GOOOL! ${event.description}` : event.description}
        </div>
        <StadiumBowl caption={stadium}>
          <div className="relative">
            <StadiumMatch
              home={home}
              away={away}
              homeStarters={homeStarters}
              awayStarters={awayStarters}
              event={event}
              prefs={normalizeStadium(home.stadium)}
            />
            <AnimatePresence>
              {onGoal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/45 px-3"
                >
                  <motion.p
                    initial={{ scale: 0.4, y: 24, rotate: -8 }}
                    animate={{ scale: 1, y: 0, rotate: 0 }}
                    className="font-display text-5xl uppercase tracking-[0.2em] text-gold drop-shadow-lg sm:text-7xl"
                  >
                    GOAL
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-display mt-1 text-3xl text-white sm:text-5xl"
                  >
                    GOOOL!
                  </motion.p>
                  {scorer && (
                    <motion.div
                      initial={{ y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="pointer-events-auto mt-3 w-full max-w-[220px]"
                    >
                      <PlayerCard
                        player={scorer.player}
                        row={scorer}
                        kit={homeRoster.some((r) => r.id === scorer.id) ? home.kit_primary : away.kit_primary}
                        kitSecondary={homeRoster.some((r) => r.id === scorer.id) ? home.kit_secondary : away.kit_secondary}
                        kitStyle={homeRoster.some((r) => r.id === scorer.id) ? home.kit_style : away.kit_style}
                        featured
                      />
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </StadiumBowl>
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-3 py-3 sm:px-4">
          <Button size="sm" variant="ghost" onClick={() => setPlaying((p) => !p)}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? "Duraklat" : "Oynat"}
          </Button>
          <Button
            size="sm"
            variant={mode === "highlights" ? "gold" : "ghost"}
            onClick={() => {
              setMode((m) => (m === "highlights" ? "full" : "highlights"));
              setIdx(0);
              setPlaying(true);
            }}
          >
            {mode === "highlights" ? "Tam maç" : "Özet"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSpeed((s) => cycleSpeed(s))}>
            <FastForward className="h-4 w-4" />
            {speed}x
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIdx(events.length - 1);
              setPlaying(false);
            }}
          >
            <SkipForward className="h-4 w-4" />
            Bitir
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const next = !mute;
              setMute(next);
              setMuted(next);
            }}
          >
            {mute ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {mute ? "Ses aç" : "Ses"}
          </Button>
          {onClose && (
            <Button size="sm" variant="outline" className="ml-auto" onClick={onClose}>
              Özet
            </Button>
          )}
        </div>
      </div>
      <div className="order-1 flex max-h-[52vh] min-h-[220px] flex-col overflow-hidden rounded-3xl border border-neon/30 bg-ink-900 lg:order-2 lg:max-h-[720px] lg:min-h-[280px]">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-neon">Canlı Anlatım</p>
          <p className="font-display text-3xl">
            {event.score[0]} - {event.score[1]}
          </p>
          <p className="mt-1 text-sm text-slate-200">
            {event.eventType === "goal" ? `GOOOL! ${event.description}` : event.description}
          </p>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {commentary.map((c, i) => (
            <div
              key={`${c.minute}-${c.eventType}-${c.description}-${i}`}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm",
                i === 0 ? "border-neon/40 bg-neon/10" : "border-white/10 bg-white/5",
                c.eventType === "goal" && "border-gold/40 bg-gold/10 text-gold",
              )}
            >
              <span className="mr-2 font-mono text-xs text-slate-400">{c.minute}&apos;</span>
              {c.eventType === "goal" ? `GOOOL! ${c.description}` : c.description}
            </div>
          ))}
        </div>
        {(result.motm || result.sheet || (result.ratings && result.ratings.length > 0)) && (
          <div className="border-t border-white/10 px-4 py-3 text-sm text-slate-300">
            {result.motm && (
              <p>
                Maçın adamı: <span className="text-neon">{result.motm.name}</span>
                {result.ratings && (
                  <span className="ml-2 text-xs text-slate-400">
                    {result.ratings.find((r) => r.playerId === result.motm?.playerId)?.rating.toFixed(1)}
                  </span>
                )}
              </p>
            )}
            {result.sheet && (
              <p className="mt-1 text-xs text-slate-400">
                xG {result.sheet.xg[0].toFixed(1)}–{result.sheet.xg[1].toFixed(1)} · şut {result.sheet.shots[0]}–
                {result.sheet.shots[1]} · isabet {result.sheet.shotsOn[0]}–{result.sheet.shotsOn[1]} · top %
                {result.sheet.possession[0]}–{result.sheet.possession[1]}
              </p>
            )}
            {result.ratings && result.ratings.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {result.ratings.slice(0, 8).map((r) => (
                  <div key={r.playerId} className="rounded-xl border border-white/10 bg-white/5 px-2 py-1.5">
                    <p className={cn("font-display text-lg leading-none", r.team === "home" ? "text-neon" : "text-gold")}>
                      {r.rating.toFixed(1)}
                    </p>
                    <p className="truncate text-[11px] text-slate-300">{r.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TeamScore({
  name,
  score,
  kit,
  align,
}: {
  name: string;
  score: number;
  kit: string;
  align: "left" | "right";
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2 sm:gap-3", align === "right" && "flex-row-reverse")}>
      <span className="h-7 w-7 shrink-0 rounded-lg border border-white/20 sm:h-8 sm:w-8" style={{ background: kit }} />
      <div className={align === "right" ? "min-w-0 text-right" : "min-w-0 text-left"}>
        <p className="truncate text-xs font-semibold sm:max-w-[140px] sm:text-sm">{name}</p>
        <p className="font-display text-3xl leading-none sm:text-4xl">{score}</p>
      </div>
    </div>
  );
}
