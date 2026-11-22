"use client";

import { ThreeCanvas } from "@/components/scene/ThreeCanvas";
import { FORMATION_SLOTS } from "@/lib/formations";
import { modelSlotOf } from "@/lib/player-photo";
import { createPitch, tickPitch, type PitchBall, type PitchState, type PitchTactics, type RemotePitch, type Side, type Stick } from "@/lib/pitch-sim";
import { createPlayerFigure, tickPlayerFigure } from "@/lib/three-player";
import type { AnimClip } from "@/lib/player-anims";
import { applyStadiumLights, cameraFor, createStadium, pitchToWorld } from "@/lib/three-stadium";
import { normalizeStadium } from "@/lib/stadium";
import { playByEvent } from "@/lib/sfx";
import { speakComment } from "@/lib/commentary";
import type { Player, Team, TeamPlayer } from "@/lib/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type Roster = TeamPlayer & { player: Player };

type RemotePayload = {
  opponent: { players: { id: string; x: number; y: number }[]; at: number } | null;
  ball: PitchBall | null;
  ballAt: number;
  score: [number, number];
};

export function LiveMatch({
  matchId,
  home,
  away,
  homeStarters,
  awayStarters,
  control,
  onFullTime,
  onExit,
}: {
  matchId: string;
  home: Team;
  away: Team;
  homeStarters: Roster[];
  awayStarters: Roster[];
  control: Side;
  onFullTime: (homeScore: number, awayScore: number) => void;
  onExit: () => void;
}) {
  const stateRef = useRef<PitchState | null>(null);
  const figures = useRef<Map<string, THREE.Group>>(new Map());
  const ballMesh = useRef<THREE.Mesh | null>(null);
  const cam = useRef<THREE.PerspectiveCamera | null>(null);
  const stick = useRef<Stick>({
    x: 0,
    y: 0,
    sprint: false,
    pass: false,
    through: false,
    shoot: false,
    tackle: false,
    skill: false,
    setpiece: false,
  });
  const remote = useRef<RemotePitch>(null);
  const ended = useRef(false);
  const syncing = useRef(false);
  const syncAcc = useRef(0);
  const peer = useRef(false);
  const [hud, setHud] = useState({
    minute: 0,
    score: [0, 0] as [number, number],
    peer: false,
    full: false,
    energy: 1,
    dots: [] as { x: number; y: number; mine: boolean }[],
    ball: { x: 50, y: 50 },
    phase: "play",
    comment: "",
  });
  const energy = useRef(1);
  const hudAcc = useRef(0);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const joy = useRef({ id: -1, ox: 0, oy: 0 });
  const clock = useRef(0);
  const [line, setLine] = useState(0);
  const [press, setPress] = useState(1);
  const [benchOpen, setBenchOpen] = useState(false);
  const tactics = useRef<PitchTactics>({ line: 0, press: 1 });
  const homeAll = useMemo(() => (control === "home" ? homeStarters : awayStarters), [awayStarters, control, homeStarters]);
  const [onPitchIds, setOnPitchIds] = useState<string[]>(() => homeAll.slice(0, 11).map((r) => r.id));
  useEffect(() => {
    tactics.current = { line, press };
  }, [line, press]);

  const build = useCallback(
    (scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => {
      renderer.toneMappingExposure = 1.35;
      const prefs = normalizeStadium({ ...(home.stadium ?? {}), camera: "broadcast", sky: "day", weather: "clear" });
      applyStadiumLights(scene, prefs);
      scene.add(createStadium(prefs));
      cam.current = camera;
      camera.fov = 50;
      camera.updateProjectionMatrix();
      cameraFor(prefs, camera);

      const toPitch = (rows: Roster[], team: Team, side: Side) => {
        const slots = FORMATION_SLOTS[team.formation];
        return rows.slice(0, 11).map((row, i) => {
          const slot = slots.find((s) => s.key === row.squad_position) ?? slots[i] ?? slots[0]!;
          const x = side === "home" ? slot.x : 100 - slot.x;
          const y = side === "home" ? slot.y : 100 - slot.y;
          const fig = createPlayerFigure({
            id: row.player.id,
            kit: team.kit_primary,
            kitSecondary: team.kit_secondary,
            kitStyle: team.kit_style,
            gk: row.player.position === "KL",
            modelSlot: modelSlotOf(row.player),
          });
          figures.current.set(row.id, fig);
          scene.add(fig);
          return {
            id: row.id,
            side,
            gk: row.player.position === "KL",
            slotX: x,
            slotY: y,
            x,
            y,
            pace: row.player.pace ?? row.player.overall,
            finish: row.player.finishing ?? row.player.attack ?? row.player.overall,
          };
        });
      };

      const players = [...toPitch(homeStarters, home, "home"), ...toPitch(awayStarters, away, "away")];
      stateRef.current = createPitch(players, 150);

      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.35 }),
      );
      ballMesh.current = sphere;
      scene.add(sphere);
      return () => {
        figures.current.clear();
        ballMesh.current = null;
        stateRef.current = null;
      };
    },
    [away, awayStarters, home, homeStarters],
  );

  const onFrame = useCallback(
    (dt: number) => {
      const state = stateRef.current;
      if (!state || ended.current) return;
      if (stick.current.sprint && energy.current > 0) energy.current = Math.max(0, energy.current - dt * 0.28);
      else energy.current = Math.min(1, energy.current + dt * 0.14);
      if (energy.current <= 0) stick.current.sprint = false;
      clock.current += dt;
      const moving = Math.hypot(stick.current.x, stick.current.y) > 0.12;
      const gesture: AnimClip = stick.current.skill
        ? "dribble_rainbow"
        : stick.current.setpiece
          ? "set_freekick"
          : stick.current.shoot
            ? "shot_drive"
            : stick.current.pass || stick.current.through
              ? "pass_ground"
              : stick.current.tackle
                ? "tackle_stand"
                : "idle";
      const out = tickPitch(state, dt, control, stick.current, remote.current, Date.now(), tactics.current);
      if (out.event) {
        playByEvent(out.event);
        const line = speakComment(out.event) ?? "";
        if (line) setHud((h) => ({ ...h, comment: line }));
      }
      for (const p of state.players) {
        const fig = figures.current.get(p.id);
        if (!fig) continue;
        const w = pitchToWorld(p.x, p.y);
        fig.position.x = w.x;
        fig.position.z = w.z;
        fig.position.y = 0;
        const atkDir = p.side === "home" ? 1 : -1;
        fig.rotation.y = atkDir > 0 ? 0 : Math.PI;
        const clip: AnimClip =
          state.ball.holder === p.id && gesture !== "idle"
            ? gesture
            : (state.lastClip as AnimClip) && state.ball.holder === p.id
              ? ((state.lastClip as AnimClip) ?? "idle")
              : p.side === control && moving
                ? "run"
                : "idle";
        tickPlayerFigure(fig, clock.current, clip, true);
      }
      if (ballMesh.current) {
        const w = pitchToWorld(state.ball.x, state.ball.y);
        ballMesh.current.position.set(w.x, 0.18, w.z);
      }
      const focus = pitchToWorld(state.ball.x, state.ball.y);
      const atk = control === "home" ? 1 : -1;
      const camera = cam.current;
      if (camera) {
        const desired = new THREE.Vector3(focus.x * 0.28, 7.2, focus.z - atk * 13);
        camera.position.lerp(desired, Math.min(1, dt * 3.2));
        camera.lookAt(focus.x * 0.45, 0.7, focus.z + atk * 12);
      }
      syncAcc.current += dt;
      if (syncAcc.current > 0.22 && !syncing.current) {
        syncAcc.current = 0;
        syncing.current = true;
        const mine = state.players.filter((p) => p.side === control).map((p) => ({ id: p.id, x: p.x, y: p.y }));
        const owns = state.ball.touch === control || state.players.find((p) => p.id === state.ball.holder)?.side === control;
        void fetch("/api/live", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            matchId,
            side: control,
            players: mine,
            ball: state.ball,
            ownsBall: owns,
            score: state.score,
          }),
        })
          .then((r) => r.json())
          .then((data: RemotePayload) => {
            const opp = data.opponent;
            peer.current = Boolean(opp && Date.now() - opp.at < 1200);
            remote.current = opp
              ? {
                  players: opp.players,
                  at: opp.at,
                  ball: data.ball ?? undefined,
                  ballAt: data.ballAt,
                  score: data.score,
                }
              : null;
          })
          .catch(() => undefined)
          .finally(() => {
            syncing.current = false;
          });
      }
      hudAcc.current += dt;
      if (
        hudAcc.current > 0.2 ||
        Math.floor(state.minute) !== hud.minute ||
        state.score[0] !== hud.score[0] ||
        state.score[1] !== hud.score[1]
      ) {
        hudAcc.current = 0;
        setHud((h) => ({
          ...h,
          minute: Math.floor(state.minute),
          score: [state.score[0], state.score[1]],
          peer: peer.current,
          full: false,
          energy: energy.current,
          ball: { x: state.ball.x, y: state.ball.y },
          phase: state.phase,
          dots: state.players.map((p) => ({ x: p.x, y: p.y, mine: p.side === control })),
        }));
      }
      if (out.done && !ended.current) {
        ended.current = true;
        setHud((h) => ({ ...h, full: true, minute: 90, score: [state.score[0], state.score[1]] }));
        onFullTime(state.score[0], state.score[1]);
      }
    },
    [control, hud.minute, hud.peer, hud.score, matchId, onFullTime],
  );

  useEffect(() => {
    const up = () => {
      stick.current.sprint = false;
    };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  const onJoyDown = (e: React.PointerEvent) => {
    joy.current = { id: e.pointerId, ox: e.clientX, oy: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onJoyMove = (e: React.PointerEvent) => {
    if (e.pointerId !== joy.current.id) return;
    const dx = e.clientX - joy.current.ox;
    const dy = e.clientY - joy.current.oy;
    const len = Math.hypot(dx, dy) || 1;
    const mag = Math.min(1, len / 56);
    const x = (dx / len) * mag;
    const y = (-dy / len) * mag;
    stick.current.x = x;
    stick.current.y = y;
    setKnob({ x, y });
  };
  const onJoyUp = (e: React.PointerEvent) => {
    if (e.pointerId !== joy.current.id) return;
    joy.current.id = -1;
    stick.current.x = 0;
    stick.current.y = 0;
    setKnob({ x: 0, y: 0 });
  };

  const tap = (key: "pass" | "through" | "shoot" | "tackle" | "skill" | "setpiece") => {
    stick.current[key] = true;
  };

  const subIn = (benchId: string) => {
    const state = stateRef.current;
    if (!state) return;
    const mine = state.players.filter((p) => p.side === control && !p.gk);
    const out = mine.sort((a, b) => a.pace - b.pace)[0];
    if (!out) return;
    const oldId = out.id;
    const fig = figures.current.get(oldId);
    const row = homeAll.find((r) => r.id === benchId);
    if (!row || !fig || onPitchIds.includes(benchId)) return;
    out.id = row.id;
    out.pace = row.player.pace ?? row.player.overall;
    out.finish = row.player.finishing ?? row.player.attack ?? row.player.overall;
    figures.current.delete(oldId);
    figures.current.set(row.id, fig);
    setOnPitchIds((ids) => ids.map((id) => (id === oldId ? row.id : id)));
    setBenchOpen(false);
    setHud((h) => ({ ...h, comment: `Değişiklik: ${row.player.name}` }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <ThreeCanvas className="h-full w-full" build={build} onFrame={onFrame} />
      <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center px-16">
        <div className="flex items-center gap-3 rounded-full border border-white/15 bg-black/70 px-3 py-1.5 shadow-2xl">
          <CrestDot color={home.kit_primary} name={home.name} />
          <span className="font-display text-3xl leading-none">{hud.score[0]}</span>
          <span className="min-w-10 text-center text-sm font-semibold text-[#e7c56a]">{hud.minute}&apos;</span>
          <span className="font-display text-3xl leading-none">{hud.score[1]}</span>
          <CrestDot color={away.kit_primary} name={away.name} />
        </div>
      </div>
      <button
        type="button"
        className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/55 px-3 py-1 text-xs text-white"
        onClick={onExit}
      >
        Çık
      </button>
      <p className="pointer-events-none absolute right-3 top-4 text-[10px] uppercase tracking-[0.18em] text-[#e7c56a]">
        {hud.full ? "Maç bitti" : hud.peer ? "Rakip bağlı" : hud.phase !== "play" ? hud.phase : "Canlı"}
      </p>
      {hud.comment && (
        <p className="pointer-events-none absolute inset-x-0 top-16 mx-auto max-w-lg rounded-full bg-black/55 px-4 py-1 text-center text-xs text-[#f8e7a8]">
          {hud.comment}
        </p>
      )}
      <div className="absolute left-3 top-14 flex flex-col gap-1">
        <button type="button" className="rounded bg-black/55 px-2 py-1 text-[10px] text-white" onClick={() => setLine((n) => Math.max(-1, n - 0.25))}>
          Savun −
        </button>
        <button type="button" className="rounded bg-black/55 px-2 py-1 text-[10px] text-white" onClick={() => setLine((n) => Math.min(1, n + 0.25))}>
          Hücum +
        </button>
        <button type="button" className="rounded bg-black/55 px-2 py-1 text-[10px] text-white" onClick={() => setPress((n) => (n > 1.1 ? 0.85 : 1.25))}>
          Pres {press > 1.1 ? "AÇ" : "KAPALI"}
        </button>
        <button type="button" className="rounded bg-black/55 px-2 py-1 text-[10px] text-white" onClick={() => setBenchOpen((v) => !v)}>
          Değişiklik
        </button>
      </div>
      {benchOpen && (
        <div className="absolute left-3 top-44 max-h-40 w-44 overflow-auto rounded-xl border border-white/15 bg-black/80 p-2 text-xs text-white">
          {homeAll
            .filter((r) => !onPitchIds.includes(r.id))
            .slice(0, 7)
            .map((r) => (
              <button key={r.id} type="button" className="block w-full rounded px-2 py-1 text-left hover:bg-white/10" onClick={() => subIn(r.id)}>
                {r.player.name}
              </button>
            ))}
        </div>
      )}

      <svg viewBox="0 0 68 105" className="pointer-events-none absolute bottom-24 left-1/2 h-28 w-16 -translate-x-1/2 rounded border border-white/20 bg-black/45">
        <rect x="1" y="1" width="66" height="103" fill="none" stroke="white" strokeOpacity="0.35" />
        <line x1="1" y1="52.5" x2="67" y2="52.5" stroke="white" strokeOpacity="0.35" />
        {hud.dots.map((d, i) => (
          <circle
            key={i}
            cx={(d.y / 100) * 68}
            cy={((control === "home" ? 100 - d.x : d.x) / 100) * 105}
            r={d.mine ? 1.7 : 1.4}
            fill={d.mine ? "#3dff8a" : "#ff5a6a"}
          />
        ))}
        <circle
          cx={(hud.ball.y / 100) * 68}
          cy={((control === "home" ? 100 - hud.ball.x : hud.ball.x) / 100) * 105}
          r="1.5"
          fill="white"
        />
      </svg>

      <div className="absolute bottom-8 left-4 w-36">
        <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-white/15">
          <div className="h-full bg-[#3dff8a]" style={{ width: `${Math.round(hud.energy * 100)}%` }} />
        </div>
        <div
          className="relative h-36 w-36 touch-none rounded-full border-2 border-white/25 bg-black/30"
          onPointerDown={onJoyDown}
          onPointerMove={onJoyMove}
          onPointerUp={onJoyUp}
          onPointerCancel={onJoyUp}
        >
          <span
            className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full bg-white/80"
            style={{ transform: `translate(calc(-50% + ${knob.x * 40}px), calc(-50% + ${-knob.y * 40}px))` }}
          />
        </div>
      </div>

      <div className="absolute bottom-8 right-4 h-56 w-56">
        <Pad className="absolute right-2 top-0 h-12 w-12 bg-fuchsia-400 text-black" label="SKILL" onClick={() => tap("skill")} />
        <Pad className="absolute right-16 top-0 h-12 w-12 bg-amber-300 text-black" label="DURAN" onClick={() => tap("setpiece")} />
        <Pad className="absolute right-2 top-14 h-14 w-14 bg-emerald-400 text-black" label="ARA" onClick={() => tap("through")} />
        <Pad className="absolute left-2 top-14 h-14 w-14 bg-white/15 text-white" label="MÜD" onClick={() => tap("tackle")} />
        <Pad className="absolute bottom-10 left-0 h-[4.5rem] w-[4.5rem] bg-sky-500 text-white" label="PAS" onClick={() => tap("pass")} />
        <Pad className="absolute bottom-0 right-0 h-20 w-20 bg-orange-500 text-black" label="ŞUT" onClick={() => tap("shoot")} />
        <button
          type="button"
          className="absolute bottom-0 left-16 rounded-full border border-white/30 bg-black/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
          onPointerDown={() => {
            if (energy.current > 0) stick.current.sprint = true;
          }}
          onPointerUp={() => {
            stick.current.sprint = false;
          }}
          onPointerLeave={() => {
            stick.current.sprint = false;
          }}
        >
          Koş
        </button>
      </div>
    </div>
  );
}

function CrestDot({ color, name }: { color: string; name: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-6 w-6 rounded-full border border-white/40" style={{ background: color }} />
      <span className="max-w-[18vw] truncate text-[10px] uppercase tracking-wider">{name}</span>
    </span>
  );
}

function Pad({ label, onClick, className }: { label: string; onClick: () => void; className: string }) {
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex items-center justify-center rounded-full border border-white/20 text-[10px] font-bold uppercase tracking-wider shadow-lg ${className}`}
    >
      {label}
    </button>
  );
}
