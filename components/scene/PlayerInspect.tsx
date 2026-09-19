"use client";

import { ThreeCanvas } from "@/components/scene/ThreeCanvas";
import { photoPortrait } from "@/lib/player-photo";
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
  const card = useRef<THREE.Group | null>(null);
  const key = `${player.id}-${kit ?? ""}-${kitStyle ?? ""}`;
  const src = photoPortrait(player);
  const frameHex = kit || "#c9a227";

  const build = useCallback(
    (scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
      scene.background = new THREE.Color(0x05080d);
      scene.add(new THREE.HemisphereLight(0xffe8c4, 0x0a1a12, 0.55));
      const keyLight = new THREE.DirectionalLight(0xffe2a8, 1.55);
      keyLight.position.set(2.2, 3.6, 2.4);
      keyLight.castShadow = true;
      scene.add(keyLight);
      scene.add(new THREE.DirectionalLight(0x3dff9a, 0.45).translateX(-2.8).translateY(1.2).translateZ(-1));
      scene.add(new THREE.PointLight(0xffd27a, 1.1, 8).translateY(2.4).translateZ(1.4));

      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(2.4, 48),
        new THREE.MeshStandardMaterial({ color: 0x0b1210, roughness: 0.85, metalness: 0.08 }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);

      const group = new THREE.Group();
      const frame = new THREE.Mesh(
        new THREE.PlaneGeometry(1.28, 1.78),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(frameHex),
          metalness: 0.62,
          roughness: 0.22,
          side: THREE.DoubleSide,
        }),
      );
      frame.position.z = -0.02;
      group.add(frame);

      const photoMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.28,
        metalness: 0.08,
      });
      const photo = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 1.66), photoMat);
      group.add(photo);
      new THREE.TextureLoader().load(src, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        photoMat.map = tex;
        photoMat.needsUpdate = true;
      });

      group.position.set(0, 1.18, 0);
      card.current = group;
      scene.add(group);

      camera.position.set(0, 1.25, 2.55);
      camera.lookAt(0, 1.18, 0);
      void kitSecondary;
      return () => {
        card.current = null;
      };
    },
    [src, frameHex, kitSecondary],
  );

  const onFrame = useCallback((_dt: number, _scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
    t.current += _dt;
    if (card.current) {
      card.current.rotation.y = Math.sin(t.current * 0.55) * 0.28;
      card.current.position.y = 1.18 + Math.sin(t.current * 1.4) * 0.03;
    }
    camera.position.x = Math.sin(t.current * 0.35) * 0.55;
    camera.position.z = 2.45 + Math.cos(t.current * 0.35) * 0.15;
    camera.lookAt(0, 1.18, 0);
  }, []);

  const memoBuild = useMemo(() => build, [build]);
  return <ThreeCanvas className={className} build={memoBuild} onFrame={onFrame} key={key} />;
}
