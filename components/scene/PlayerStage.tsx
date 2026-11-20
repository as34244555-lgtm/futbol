"use client";

import { ThreeCanvas } from "@/components/scene/ThreeCanvas";
import { createPlayerFigure, tickPlayerFigure } from "@/lib/three-player";
import { useCallback, useMemo, useRef } from "react";
import * as THREE from "three";

/** eFootball home-screen 3D player stage. */
export function PlayerStage({ className = "h-full w-full" }: { className?: string }) {
  const t = useRef(0);
  const figure = useRef<THREE.Group | null>(null);

  const build = useCallback((scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
    scene.background = new THREE.Color(0x05070c);
    scene.fog = new THREE.Fog(0x05070c, 8, 18);
    scene.add(new THREE.HemisphereLight(0xe8f0ff, 0x10141c, 0.55));

    const key = new THREE.DirectionalLight(0xfff4e5, 2.2);
    key.position.set(2.6, 4.4, 3.2);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    scene.add(new THREE.DirectionalLight(0x4aa3ff, 1.25).translateX(-3).translateY(2.2).translateZ(-2.2));
    scene.add(new THREE.DirectionalLight(0x8899aa, 0.4).translateX(-1).translateY(1.4).translateZ(3.2));

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(4.2, 72),
      new THREE.MeshStandardMaterial({ color: 0x07090e, roughness: 0.22, metalness: 0.62 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.72, 0.78, 64),
      new THREE.MeshBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    scene.add(ring);

    const fig = createPlayerFigure({ id: "home-hero", kit: "#111827" });
    fig.rotation.y = 0.18;
    figure.current = fig;
    scene.add(fig);

    camera.position.set(0.55, 1.12, 3.15);
    camera.lookAt(0, 0.88, 0);
    return () => {
      figure.current = null;
    };
  }, []);

  const onFrame = useCallback((_dt: number, _scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
    t.current += _dt;
    if (figure.current) {
      tickPlayerFigure(figure.current, t.current, "idle", true);
      figure.current.rotation.y = 0.42 + Math.sin(t.current * 0.35) * 0.22;
    }
    camera.lookAt(0, 0.88, 0);
  }, []);

  const memoBuild = useMemo(() => build, [build]);
  return <ThreeCanvas className={className} build={memoBuild} onFrame={onFrame} />;
}
