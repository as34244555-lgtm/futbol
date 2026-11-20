"use client";

import { ThreeCanvas } from "@/components/scene/ThreeCanvas";
import { FORMATION_SLOTS } from "@/lib/formations";
import { modelSlotOf } from "@/lib/player-photo";
import { createPitch, tickPitch, type PitchBall, type PitchState, type RemotePitch, type Side, type Stick } from "@/lib/pitch-sim";
import { createPlayerFigure } from "@/lib/three-player";
import { applyStadiumLights, cameraFor, createStadium, pitchToWorld } from "@/lib/three-stadium";
import { normalizeStadium } from "@/lib/stadium";
import type { Player, Team, TeamPlayer } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const stick = useRef<Stick>({ x: 0, y: 0, sprint: false, pass: false, through: false, shoot: false, tackle: false });
  const remote = useRef<RemotePitch>(null);
  const ended = useRef(false);
  const syncing = useRef(false);
  const syncAcc = useRef(0);
  const peer = useRef(false);
  const [hud, setHud] = useState({ minute: 0, score: [0, 0] as [number, number], peer: false, full: false });
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const joy = useRef({ id: -1, ox: 0, oy: 0 });

  const build = useCallback(
    (scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
      const prefs = normalizeStadium({ ...(home.stadium ?? {}), camera: "broadcast", sky: home.stadium?.sky ?? "night" });
      applyStadiumLights(scene, prefs);
      scene.add(createStadium(prefs));
      cam.current = camera;
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
      const out = tickPitch(state, dt, control, stick.current, remote.current);
      for (const p of state.players) {
        const fig = figures.current.get(p.id);
        if (!fig) continue;
        const w = pitchToWorld(p.x, p.y);
        fig.position.x = w.x;
        fig.position.z = w.z;
        fig.position.y = 0;
        const atk = p.side === "home" ? 1 : -1;
        fig.rotation.y = atk > 0 ? 0 : Math.PI;
      }
      if (ballMesh.current) {
        const w = pitchToWorld(state.ball.x, state.ball.y);
        ballMesh.current.position.set(w.x, 0.18, w.z);
      }
      const focus = pitchToWorld(state.ball.x, state.ball.y);
      const atk = control === "home" ? 1 : -1;
      const camera = cam.current;
      if (camera) {
        const desired = new THREE.Vector3(focus.x, 8.4, focus.z - atk * 16);
        camera.position.lerp(desired, 1 - Math.pow(0.001, dt));
        camera.lookAt(focus.x, 0.6, focus.z + atk * 6);
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
      if (Math.floor(state.minute) !== hud.minute || state.score[0] !== hud.score[0] || state.score[1] !== hud.score[1] || peer.current !== hud.peer) {
        setHud({ minute: Math.floor(state.minute), score: [state.score[0], state.score[1]], peer: peer.current, full: false });
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

  const tap = (key: "pass" | "through" | "shoot" | "tackle") => {
    stick.current[key] = true;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <ThreeCanvas className="h-full w-full" build={build} onFrame={onFrame} />
      <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center px-3">
        <div className="ef-card flex items-center gap-4 px-4 py-2 text-white">
          <span className="max-w-[28vw] truncate text-xs uppercase tracking-wider">{home.name}</span>
          <span className="font-display text-3xl leading-none">
            {hud.score[0]} <span className="text-lg text-[#e7c56a]">{hud.minute}&apos;</span> {hud.score[1]}
          </span>
          <span className="max-w-[28vw] truncate text-xs uppercase tracking-wider">{away.name}</span>
        </div>
      </div>
      <button
        type="button"
        className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-xs text-white"
        onClick={onExit}
      >
        Çık
      </button>
      <p className="pointer-events-none absolute right-3 top-3 text-[10px] uppercase tracking-[0.2em] text-[#e7c56a]">
        {hud.full ? "Maç bitti" : hud.peer ? "Rakip bağlı" : "Konumlar yazılıyor"}
      </p>

      <div
        className="absolute bottom-8 left-4 h-32 w-32 touch-none rounded-full border border-[#e7c56a]/40 bg-black/35"
        onPointerDown={onJoyDown}
        onPointerMove={onJoyMove}
        onPointerUp={onJoyUp}
        onPointerCancel={onJoyUp}
      >
        <span
          className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e7c56a]/80"
          style={{ transform: `translate(calc(-50% + ${knob.x * 36}px), calc(-50% + ${-knob.y * 36}px))` }}
        />
      </div>

      <div className="absolute bottom-6 right-4 grid grid-cols-2 gap-2">
        <Pad label="ARA" onClick={() => tap("through")} />
        <Pad label="ŞUT" gold onClick={() => tap("shoot")} />
        <Pad label="PAS" onClick={() => tap("pass")} />
        <Pad label="MÜDAHAL" onClick={() => tap("tackle")} />
        <button
          type="button"
          className="col-span-2 rounded-full border border-white/20 bg-white/10 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white"
          onPointerDown={() => {
            stick.current.sprint = true;
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

function Pad({ label, onClick, gold }: { label: string; onClick: () => void; gold?: boolean }) {
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`h-16 w-16 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
        gold ? "border-[#e7c56a] bg-[#e7c56a] text-black" : "border-white/30 bg-black/50 text-white"
      }`}
    >
      {label}
    </button>
  );
}
