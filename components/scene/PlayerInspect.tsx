"use client";

import { ThreeCanvas } from "@/components/scene/ThreeCanvas";
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

  const build = useCallback(
    (scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
      scene.background = new THREE.Color(0x0b1018);
      scene.add(new THREE.HemisphereLight(0xdde8ff, 0x1a2218, 0.8));
      const keyLight = new THREE.DirectionalLight(0xfff1d0, 1.3);
      keyLight.position.set(2.4, 4.2, 3);
      keyLight.castShadow = true;
      scene.add(keyLight);
      scene.add(new THREE.DirectionalLight(0x88a0ff, 0.35).translateX(-3).translateY(1));
      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(2.2, 32),
        new THREE.MeshStandardMaterial({ color: 0x151b22, roughness: 0.9 }),
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
      });
      figure.current = fig;
      scene.add(fig);
      camera.position.set(0.9, 1.7, 3.2);
      camera.lookAt(0, 1.1, 0);
      return () => {
        figure.current = null;
      };
    },
    [player.id, player.position, kit, kitSecondary, kitStyle],
  );

  const onFrame = useCallback((dt: number, _scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
    t.current += dt;
    if (figure.current) tickPlayerFigure(figure.current, t.current, true);
    camera.position.x = Math.sin(t.current * 0.45) * 2.4;
    camera.position.z = Math.cos(t.current * 0.45) * 2.6;
    camera.position.y = 1.55;
    camera.lookAt(0, 1.15, 0);
  }, []);

  const memoBuild = useMemo(() => build, [build]);
  return <ThreeCanvas className={className} build={memoBuild} onFrame={onFrame} key={key} />;
}
