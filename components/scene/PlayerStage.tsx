"use client";

import { ThreeCanvas } from "@/components/scene/ThreeCanvas";
import { createPlayerFigure, tickPlayerFigure } from "@/lib/three-player";
import { useCallback, useMemo, useRef } from "react";
import * as THREE from "three";

/** Home-screen 3D player. Slot 1 is the second Drive model when that file exists. */
export function PlayerStage({ className = "h-full w-full", modelSlot = 1 }: { className?: string; modelSlot?: number }) {
  const t = useRef(0);
  const figure = useRef<THREE.Group | null>(null);

    const build = useCallback((scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => {
    renderer.toneMappingExposure = 1.2;
    scene.background = new THREE.Color(0x1a3148);
    scene.fog = new THREE.Fog(0x1a3148, 14, 28);
    scene.add(new THREE.HemisphereLight(0xf3f8ff, 0x6d8f6a, 1.05));

    const key = new THREE.DirectionalLight(0xfff6e8, 3.1);
    key.position.set(2.6, 4.4, 3.2);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    scene.add(new THREE.DirectionalLight(0x4aa3ff, 1.25).translateX(-3).translateY(2.2).translateZ(-2.2));
    scene.add(new THREE.DirectionalLight(0x8899aa, 0.4).translateX(-1).translateY(1.4).translateZ(3.2));

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(4.2, 72),
      new THREE.MeshStandardMaterial({ color: 0x243044, roughness: 0.35, metalness: 0.25 }),
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

    const fig = createPlayerFigure({ id: "home-hero", kit: "#111827", modelSlot });
    fig.rotation.y = 0.18;
    figure.current = fig;
    scene.add(fig);

    camera.position.set(0.55, 1.12, 3.15);
    camera.lookAt(0, 0.88, 0);
    return () => {
      figure.current = null;
    };
  }, [modelSlot]);

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
