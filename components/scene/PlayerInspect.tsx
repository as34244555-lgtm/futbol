"use client";

import { ThreeCanvas } from "@/components/scene/ThreeCanvas";
import { photoPortrait } from "@/lib/player-photo";
import { clipForEvent } from "@/lib/player-anims";
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
  const clip = clipForEvent({
    eventType: player.position === "KL" ? "shot" : "pass",
    minute: 12,
    playerId: player.id,
    gk: player.position === "KL",
    involved: player.position !== "KL",
    attacking: true,
  });

  const build = useCallback(
    (scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
      scene.background = new THREE.Color(0x05080d);
      scene.add(new THREE.HemisphereLight(0xffe8c4, 0x0a1a12, 0.55));
      const keyLight = new THREE.DirectionalLight(0xffe2a8, 1.45);
      keyLight.position.set(2.2, 3.6, 2.4);
      keyLight.castShadow = true;
      scene.add(keyLight);
      scene.add(new THREE.DirectionalLight(0x3dff9a, 0.4).translateX(-2.8).translateY(1.2).translateZ(-1));

      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(2.4, 48),
        new THREE.MeshStandardMaterial({ color: 0x0b1210, roughness: 0.85, metalness: 0.08 }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);

      const fig = createPlayerFigure({
        id: player.id,
        kit: kit ?? "#1d4ed8",
        kitSecondary,
        kitStyle,
        gk: player.position === "KL",
        portraitUrl: photoPortrait(player),
      });
      fig.scale.setScalar(1.35);
      figure.current = fig;
      scene.add(fig);

      camera.position.set(0.4, 1.55, 3.1);
      camera.lookAt(0, 1.05, 0);
      return () => {
        figure.current = null;
      };
    },
    [player, kit, kitSecondary, kitStyle],
  );

  const onFrame = useCallback(
    (dt: number, _scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
      t.current += dt;
      if (figure.current) tickPlayerFigure(figure.current, t.current, clip, true);
      camera.position.x = Math.sin(t.current * 0.4) * 1.6;
      camera.position.z = 2.6 + Math.cos(t.current * 0.4) * 0.4;
      camera.lookAt(0, 1.05, 0);
    },
    [clip],
  );

  const memoBuild = useMemo(() => build, [build]);
  return <ThreeCanvas className={className} build={memoBuild} onFrame={onFrame} key={key} />;
}
