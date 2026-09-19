"use client";

import { ThreeCanvas } from "@/components/scene/ThreeCanvas";
import { photoBody } from "@/lib/player-photo";
import { createPlayerFigure, tickPlayerFigure } from "@/lib/three-player";
import type { KitStyle, Player } from "@/lib/types";
import { useCallback, useMemo, useRef } from "react";
import * as THREE from "three";

export function PlayerInspect({
  player,
  kit,
  kitSecondary,
  kitStyle,
  className = "h-72 w-full",
}: {
  player: Player;
  kit?: string;
  kitSecondary?: string;
  kitStyle?: KitStyle;
  className?: string;
}) {
  const t = useRef(0);
  const figure = useRef<THREE.Group | null>(null);
  const key = `${player.id}-${kit ?? ""}-${kitStyle ?? ""}`;
  const clip = player.position === "KL" ? "save_catch" : "dribble_stepover";

  const build = useCallback(
    (scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
      scene.background = new THREE.Color(0x050608);
      scene.fog = new THREE.Fog(0x050608, 6, 16);
      scene.add(new THREE.HemisphereLight(0xffe8d2, 0x0b1220, 0.55));

      const keyLight = new THREE.DirectionalLight(0xfff1d6, 2.05);
      keyLight.position.set(2.4, 4.2, 3.1);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      scene.add(keyLight);

      const rim = new THREE.DirectionalLight(0x8ecbff, 1.15);
      rim.position.set(-2.6, 2.2, -2.4);
      scene.add(rim);

      const fill = new THREE.DirectionalLight(0x6a7c99, 0.45);
      fill.position.set(-1.4, 1.6, 3.4);
      scene.add(fill);

      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(2.6, 64),
        new THREE.MeshStandardMaterial({
          color: 0x0a0d12,
          roughness: 0.28,
          metalness: 0.55,
        }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.55, 0.62, 48),
        new THREE.MeshBasicMaterial({ color: 0x3dff9a, transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.015;
      scene.add(ring);

      const fig = createPlayerFigure({
        id: player.id,
        kit: kit ?? "#1d4ed8",
        kitSecondary,
        kitStyle,
        gk: player.position === "KL",
        bodyUrl: photoBody(player),
        portraitUrl: player.portrait,
      });
      fig.rotation.y = 0.12;
      fig.scale.setScalar(1.18);
      figure.current = fig;
      scene.add(fig);

      camera.position.set(0.12, 1.02, 2.55);
      camera.lookAt(0, 0.9, 0);
      return () => {
        figure.current = null;
      };
    },
    [player, kit, kitSecondary, kitStyle],
  );

  const onFrame = useCallback(
    (dt: number, _scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
      t.current += dt;
      if (figure.current) {
        tickPlayerFigure(figure.current, t.current, clip, true);
        figure.current.rotation.y = 0.1 + Math.sin(t.current * 0.35) * 0.55;
      }
      camera.lookAt(0, 0.9, 0);
    },
    [clip],
  );

  const memoBuild = useMemo(() => build, [build]);
  return <ThreeCanvas className={className} build={memoBuild} onFrame={onFrame} key={key} />;
}
