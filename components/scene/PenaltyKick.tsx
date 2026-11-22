"use client";

import { ThreeCanvas } from "@/components/scene/ThreeCanvas";
import { createPlayerFigure, tickPlayerFigure } from "@/lib/three-player";
import type { Player } from "@/lib/types";
import { useCallback, useMemo, useRef } from "react";
import * as THREE from "three";

type Phase = "aim" | "shooting" | "done";

type Sim = {
  phase: Phase;
  aimX: number; // -1 .. 1
  power: number; // 0.35 .. 1
  t: number;
  ball: THREE.Mesh | null;
  gk: THREE.Group | null;
  taker: THREE.Group | null;
  netFlash: THREE.Mesh | null;
  result: "goal" | "save" | "miss" | null;
  onResult?: (r: "goal" | "save" | "miss") => void;
};

function stripePitch(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(42, 68);
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? "#148a42" : "#0f6b35";
    ctx.fillRect(0, i * 8, 8, 8);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 22);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92 }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}

function buildGoal(): THREE.Group {
  const g = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xf5f7fa, roughness: 0.45, metalness: 0.15 });
  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.55, 12), white);
  postL.position.set(-3.66, 1.275, -22);
  const postR = postL.clone();
  postR.position.x = 3.66;
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 7.32, 12), white);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, 2.55, -22);
  g.add(postL, postR, bar);

  const netMat = new THREE.MeshBasicMaterial({
    color: 0xdfe6ef,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    wireframe: true,
  });
  const net = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 2.5, 18, 10), netMat);
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

  const build = useCallback(
    (scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => {
      renderer.toneMappingExposure = 1.15;
      scene.background = new THREE.Color(0x6eb7ff);
      scene.fog = new THREE.Fog(0x6eb7ff, 28, 70);

      scene.add(new THREE.HemisphereLight(0xfff8ea, 0x3d6b45, 1.05));
      const sun = new THREE.DirectionalLight(0xfff2d6, 2.6);
      sun.position.set(6, 14, 4);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.camera.near = 1;
      sun.shadow.camera.far = 50;
      sun.shadow.camera.left = -18;
      sun.shadow.camera.right = 18;
      sun.shadow.camera.top = 18;
      sun.shadow.camera.bottom = -18;
      scene.add(sun);
      scene.add(new THREE.DirectionalLight(0x88aacc, 0.55).translateX(-5).translateY(4).translateZ(-3));

      scene.add(stripePitch());
      const goal = buildGoal();
      scene.add(goal);
      sim.current.netFlash = goal.getObjectByName("netFlash") as THREE.Mesh;

      // Penalty spot ~11m; place ball at z=0, goal at z=-22
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 24, 18),
        new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.35, metalness: 0.05 }),
      );
      ball.castShadow = true;
      ball.position.set(0, 0.11, 0);
      scene.add(ball);
      sim.current.ball = ball;

      const mark = new THREE.Mesh(
        new THREE.CircleGeometry(0.18, 24),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 }),
      );
      mark.rotation.x = -Math.PI / 2;
      mark.position.set(0, 0.02, 0);
      scene.add(mark);

      const boxLine = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-9, 0.03, -22),
          new THREE.Vector3(9, 0.03, -22),
          new THREE.Vector3(9, 0.03, -5.5),
          new THREE.Vector3(-9, 0.03, -5.5),
        ]),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }),
      );
      scene.add(boxLine);

      const gkFig = createPlayerFigure({
        id: "pk-gk",
        kit: "#ffcc00",
        kitSecondary: "#111",
        gk: true,
        modelSlot: 0,
      });
      gkFig.position.set(0, 0, -21.15);
      gkFig.rotation.y = Math.PI;
      gkFig.scale.setScalar(1.02);
      scene.add(gkFig);
      sim.current.gk = gkFig;

      const takerFig = createPlayerFigure({
        id: "pk-taker",
        kit,
        modelSlot: 1,
        portraitUrl: taker.portrait,
      });
      takerFig.position.set(0.35, 0, 3.2);
      takerFig.rotation.y = Math.PI;
      scene.add(takerFig);
      sim.current.taker = takerFig;

      camera.position.set(0.2, 1.55, 7.2);
      camera.lookAt(0, 1.1, -18);

      sim.current.phase = "aim";
      sim.current.result = null;
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
        s.gk.position.x = Math.sin(s.t * 1.4) * 0.55;
      }

      // Start shot once
      if (shooting && !lastShoot.current && s.phase === "aim") {
        lastShoot.current = true;
        s.phase = "shooting";
        shootToken.current = s.t;
        s.result = null;
        if (s.ball) {
          s.ball.userData.start = s.ball.position.clone();
          const targetX = s.aimX * 3.2;
          const targetY = 0.55 + s.power * 1.55;
          const miss = Math.abs(s.aimX) > 0.92 || s.power < 0.38 || s.power > 0.97;
          const diveSide = Math.sign(targetX || (Math.random() > 0.5 ? 1 : -1));
          const cover = Math.abs(targetX) < 1.15 + (1 - s.power) * 1.4 && !miss && Math.random() < 0.38;
          s.ball.userData.target = new THREE.Vector3(
            miss ? targetX * 1.35 : targetX,
            miss && s.power > 0.95 ? 3.1 : targetY,
            miss ? -20.2 : -22.05,
          );
          s.ball.userData.miss = miss;
          s.ball.userData.save = cover;
          s.ball.userData.dive = diveSide;
          if (s.gk) s.gk.userData.diveTo = diveSide * (cover ? Math.abs(targetX) * 0.85 : 1.8);
        }
      }
      if (!shooting) lastShoot.current = false;

      if (s.phase === "shooting" && s.ball) {
        const u = Math.min(1, (s.t - shootToken.current) / 0.85);
        const start = s.ball.userData.start as THREE.Vector3;
        const target = s.ball.userData.target as THREE.Vector3;
        const lift = Math.sin(u * Math.PI) * (0.55 + s.power * 0.9);
        s.ball.position.lerpVectors(start, target, u);
        s.ball.position.y += lift * (1 - u);
        s.ball.rotation.x -= dt * 14;
        if (s.taker) s.taker.position.z = THREE.MathUtils.lerp(3.2, 0.6, Math.min(1, u * 1.4));
        if (s.gk) {
          const dive = (s.gk.userData.diveTo as number) ?? 0;
          s.gk.position.x = THREE.MathUtils.lerp(s.gk.position.x, dive, 0.12);
          s.gk.rotation.z = THREE.MathUtils.lerp(s.gk.rotation.z, -Math.sign(dive) * 0.85, 0.1);
          tickPlayerFigure(s.gk, s.t, dive < 0 ? "save_dive_l" : "save_dive_r", true);
        }
        if (u >= 1 && s.phase === "shooting") {
          const miss = Boolean(s.ball.userData.miss);
          const save = Boolean(s.ball.userData.save);
          const result = miss ? "miss" : save ? "save" : "goal";
          s.result = result;
          s.phase = "done";
          if (result === "goal" && s.netFlash) {
            (s.netFlash.material as THREE.MeshBasicMaterial).opacity = 0.55;
          }
          if (result === "save" && s.ball) {
            s.ball.position.x += (s.gk?.position.x ?? 0) * 0.15;
            s.ball.position.z = -20.4;
          }
          s.onResult?.(result);
          onSettled(result);
        }
      }

      if (s.phase === "done" && s.netFlash) {
        const mat = s.netFlash.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, mat.opacity - dt * 0.55);
      }

      // Aim preview: nudge ball slightly
      if (s.phase === "aim" && s.ball) {
        s.ball.position.x = THREE.MathUtils.lerp(s.ball.position.x, s.aimX * 0.12, 0.12);
        s.ball.position.y = 0.11;
        s.ball.position.z = 0;
      }

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, s.aimX * 0.35, 0.06);
      camera.lookAt(s.aimX * 1.2, 1.15, -18);
    },
    [aimX, power, shooting, onSettled],
  );

  const memoBuild = useMemo(() => build, [build]);
  return <ThreeCanvas className={className} build={memoBuild} onFrame={onFrame} />;
}
