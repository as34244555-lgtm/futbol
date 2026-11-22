"use client";

import { ThreeCanvas } from "@/components/scene/ThreeCanvas";
import { createPlayerFigure, tickPlayerFigure } from "@/lib/three-player";
import type { Player } from "@/lib/types";
import { useCallback, useMemo, useRef } from "react";
import * as THREE from "three";

type Phase = "aim" | "shooting" | "done";

type Sim = {
  phase: Phase;
  aimX: number;
  power: number;
  t: number;
  ball: THREE.Mesh | null;
  gk: THREE.Group | null;
  taker: THREE.Group | null;
  netFlash: THREE.Mesh | null;
  result: "goal" | "save" | "miss" | null;
};

function stripePitch(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(56, 80);
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? "#1a9a4a" : "#12803c";
    ctx.fillRect(0, i * 8, 8, 8);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(18, 26);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.88, metalness: 0.05 }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}

function buildStadium(): THREE.Group {
  const root = new THREE.Group();
  const standMat = new THREE.MeshStandardMaterial({ color: 0x1a2233, roughness: 0.85 });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x2a6fd6, roughness: 0.7 });
  const seatMat2 = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.7 });

  // Behind goal
  const back = new THREE.Mesh(new THREE.BoxGeometry(48, 10, 6), standMat);
  back.position.set(0, 4.2, -30);
  root.add(back);
  const seatsBack = new THREE.Mesh(new THREE.BoxGeometry(46, 6.5, 3.2), seatMat);
  seatsBack.position.set(0, 4.5, -28.2);
  root.add(seatsBack);

  // Side stands
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(7, 9, 52), standMat);
    wall.position.set(side * 24, 3.8, -6);
    root.add(wall);
    const seats = new THREE.Mesh(new THREE.BoxGeometry(4.2, 6, 50), side < 0 ? seatMat : seatMat2);
    seats.position.set(side * 21.5, 4.2, -6);
    root.add(seats);
  }

  // Floodlights
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff4d2 });
  for (const [x, z] of [
    [-18, -18],
    [18, -18],
    [-18, 6],
    [18, 6],
  ] as const) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.18, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0x8899aa }),
    );
    pole.position.set(x, 6, z);
    root.add(pole);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 0.8), lightMat);
    lamp.position.set(x, 12.1, z);
    root.add(lamp);
  }

  return root;
}

function buildAds(): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0d4aa8,
    emissive: 0x1a5fcc,
    emissiveIntensity: 0.4,
    roughness: 0.4,
  });
  const board = new THREE.Mesh(new THREE.BoxGeometry(42, 0.85, 0.18), mat);
  board.position.set(0, 0.45, -24.2);
  g.add(board);
  const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.85, 28), mat);
  sideL.position.set(-16, 0.45, -8);
  const sideR = sideL.clone();
  sideR.position.x = 16;
  g.add(sideL, sideR);
  return g;
}

function buildGoal(): THREE.Group {
  const g = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xf5f7fa, roughness: 0.4, metalness: 0.2 });
  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.55, 14), white);
  postL.position.set(-3.66, 1.275, -22);
  postL.castShadow = true;
  const postR = postL.clone();
  postR.position.x = 3.66;
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 7.32, 14), white);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, 2.55, -22);
  bar.castShadow = true;
  g.add(postL, postR, bar);

  const net = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 2.5, 20, 12),
    new THREE.MeshBasicMaterial({
      color: 0xe8eef6,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
      wireframe: true,
    }),
  );
  net.position.set(0, 1.25, -22.55);
  g.add(net);

  const flash = new THREE.Mesh(
    new THREE.PlaneGeometry(7.1, 2.45),
    new THREE.MeshBasicMaterial({ color: 0xffe566, transparent: true, opacity: 0 }),
  );
  flash.position.set(0, 1.25, -22.35);
  flash.name = "netFlash";
  g.add(flash);
  return g;
}

function buildSky(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(90, 32, 16);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x1a2a48,
    side: THREE.BackSide,
  });
  // dusk gradient via vertex colors roughly simulated with darker top
  const sky = new THREE.Mesh(geo, mat);
  return sky;
}

export function PenaltyKick({
  taker,
  kit = "#1f8fff",
  aimX,
  power,
  shooting,
  onSettled,
  className = "h-full w-full",
}: {
  taker: Player;
  kit?: string;
  aimX: number;
  power: number;
  shooting: boolean;
  onSettled: (result: "goal" | "save" | "miss") => void;
  className?: string;
}) {
  const sim = useRef<Sim>({
    phase: "aim",
    aimX: 0,
    power: 0.7,
    t: 0,
    ball: null,
    gk: null,
    taker: null,
    netFlash: null,
    result: null,
  });
  const shootToken = useRef(0);
  const lastShoot = useRef(false);
  const settledOnce = useRef(false);

  const build = useCallback(
    (scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => {
      renderer.toneMappingExposure = 1.05;
      scene.background = new THREE.Color(0x142238);
      scene.fog = new THREE.FogExp2(0x142238, 0.018);
      scene.add(buildSky());

      scene.add(new THREE.HemisphereLight(0xffe6c8, 0x1a4030, 0.85));
      const sun = new THREE.DirectionalLight(0xfff0d2, 2.2);
      sun.position.set(8, 16, 5);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.camera.near = 1;
      sun.shadow.camera.far = 60;
      sun.shadow.camera.left = -22;
      sun.shadow.camera.right = 22;
      sun.shadow.camera.top = 22;
      sun.shadow.camera.bottom = -22;
      scene.add(sun);
      const fill = new THREE.DirectionalLight(0x6aa8ff, 0.7);
      fill.position.set(-6, 5, 4);
      scene.add(fill);
      const rim = new THREE.PointLight(0xffcc66, 1.4, 40);
      rim.position.set(0, 8, -20);
      scene.add(rim);

      scene.add(stripePitch());
      scene.add(buildStadium());
      scene.add(buildAds());
      const goal = buildGoal();
      scene.add(goal);
      sim.current.netFlash = goal.getObjectByName("netFlash") as THREE.Mesh;

      // center circle near camera
      const circle = new THREE.Mesh(
        new THREE.RingGeometry(9.1, 9.25, 64),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
      );
      circle.rotation.x = -Math.PI / 2;
      circle.position.set(0, 0.025, 16);
      scene.add(circle);

      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.115, 28, 20),
        new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.32, metalness: 0.08 }),
      );
      ball.castShadow = true;
      ball.position.set(0, 0.115, 0);
      scene.add(ball);
      sim.current.ball = ball;

      const mark = new THREE.Mesh(
        new THREE.CircleGeometry(0.2, 28),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }),
      );
      mark.rotation.x = -Math.PI / 2;
      mark.position.set(0, 0.02, 0);
      scene.add(mark);

      const box = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-9.15, 0.03, -22),
          new THREE.Vector3(9.15, 0.03, -22),
          new THREE.Vector3(9.15, 0.03, -5.5),
          new THREE.Vector3(-9.15, 0.03, -5.5),
        ]),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }),
      );
      scene.add(box);

      const gkFig = createPlayerFigure({
        id: "pk-gk",
        kit: "#111111",
        kitSecondary: "#f5c542",
        gk: true,
        modelSlot: 0,
      });
      gkFig.position.set(0, 0, -21.15);
      gkFig.rotation.y = Math.PI;
      gkFig.scale.setScalar(1.05);
      scene.add(gkFig);
      sim.current.gk = gkFig;

      const takerFig = createPlayerFigure({
        id: "pk-taker",
        kit,
        modelSlot: 1,
        portraitUrl: taker.portrait,
      });
      takerFig.position.set(0.35, 0, 3.35);
      takerFig.rotation.y = Math.PI;
      scene.add(takerFig);
      sim.current.taker = takerFig;

      camera.fov = 38;
      camera.updateProjectionMatrix();
      camera.position.set(0.15, 1.65, 8.4);
      camera.lookAt(0, 1.2, -18);

      sim.current.phase = "aim";
      sim.current.result = null;
      settledOnce.current = false;
      return () => {
        sim.current.ball = null;
        sim.current.gk = null;
        sim.current.taker = null;
        sim.current.netFlash = null;
      };
    },
    [kit, taker.portrait],
  );

  const onFrame = useCallback(
    (dt: number, _scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
      const s = sim.current;
      s.t += dt;
      s.aimX = aimX;
      s.power = power;

      if (s.taker) {
        tickPlayerFigure(s.taker, s.t, s.phase === "shooting" ? "shot_drive" : "set_penalty", true);
        s.taker.position.x = THREE.MathUtils.lerp(s.taker.position.x, 0.2 + s.aimX * 0.15, 0.08);
      }
      if (s.gk && s.phase === "aim") {
        tickPlayerFigure(s.gk, s.t, "idle", true);
        s.gk.position.x = Math.sin(s.t * 1.35) * 0.65;
        s.gk.rotation.z = 0;
      }

      if (shooting && !lastShoot.current && s.phase === "aim") {
        lastShoot.current = true;
        settledOnce.current = false;
        s.phase = "shooting";
        shootToken.current = s.t;
        s.result = null;
        if (s.ball) {
          s.ball.userData.start = s.ball.position.clone();
          const targetX = s.aimX * 3.25;
          const targetY = 0.5 + s.power * 1.6;
          const miss = Math.abs(s.aimX) > 0.93 || s.power < 0.36 || s.power > 0.98;
          const diveSide = Math.sign(targetX || (Math.random() > 0.5 ? 1 : -1)) || 1;
          const cover = !miss && Math.abs(targetX) < 1.05 + (1 - s.power) * 1.5 && Math.random() < 0.36;
          s.ball.userData.target = new THREE.Vector3(
            miss ? targetX * 1.4 : targetX,
            miss && s.power > 0.95 ? 3.2 : targetY,
            miss ? -20.1 : -22.05,
          );
          s.ball.userData.miss = miss;
          s.ball.userData.save = cover;
          if (s.gk) s.gk.userData.diveTo = diveSide * (cover ? Math.max(0.9, Math.abs(targetX)) : 2.0);
        }
      }
      if (!shooting) lastShoot.current = false;

      if (s.phase === "shooting" && s.ball) {
        const u = Math.min(1, (s.t - shootToken.current) / 0.9);
        const start = s.ball.userData.start as THREE.Vector3;
        const target = s.ball.userData.target as THREE.Vector3;
        const lift = Math.sin(u * Math.PI) * (0.6 + s.power * 0.95);
        s.ball.position.lerpVectors(start, target, u);
        s.ball.position.y += lift * (1 - u);
        s.ball.rotation.x -= dt * 16;
        if (s.taker) s.taker.position.z = THREE.MathUtils.lerp(3.35, 0.55, Math.min(1, u * 1.35));
        if (s.gk) {
          const dive = (s.gk.userData.diveTo as number) ?? 0;
          s.gk.position.x = THREE.MathUtils.lerp(s.gk.position.x, dive, 0.11);
          s.gk.rotation.z = THREE.MathUtils.lerp(s.gk.rotation.z, -Math.sign(dive) * 0.9, 0.1);
          tickPlayerFigure(s.gk, s.t, dive < 0 ? "save_dive_l" : "save_dive_r", true);
        }
        if (u >= 1 && !settledOnce.current) {
          settledOnce.current = true;
          const miss = Boolean(s.ball.userData.miss);
          const save = Boolean(s.ball.userData.save);
          const result = miss ? "miss" : save ? "save" : "goal";
          s.result = result;
          s.phase = "done";
          if (result === "goal" && s.netFlash) {
            (s.netFlash.material as THREE.MeshBasicMaterial).opacity = 0.6;
          }
          if (result === "save" && s.ball) {
            s.ball.position.z = -20.35;
          }
          onSettled(result);
        }
      }

      if (s.phase === "done" && s.netFlash) {
        const mat = s.netFlash.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, mat.opacity - dt * 0.5);
      }

      if (s.phase === "aim" && s.ball) {
        s.ball.position.x = THREE.MathUtils.lerp(s.ball.position.x, s.aimX * 0.12, 0.12);
        s.ball.position.y = 0.115;
        s.ball.position.z = 0;
      }

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, s.aimX * 0.4, 0.06);
      camera.lookAt(s.aimX * 1.3, 1.25, -18);
    },
    [aimX, power, shooting, onSettled],
  );

  const memoBuild = useMemo(() => build, [build]);
  return <ThreeCanvas className={className} build={memoBuild} onFrame={onFrame} />;
}
