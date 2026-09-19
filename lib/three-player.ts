import * as THREE from "three";
import { shade } from "@/lib/portrait";
import type { KitStyle } from "@/lib/types";

function col(hex: string): THREE.Color {
  return new THREE.Color(hex || "#1d4ed8");
}

export type PlayerFigureOpts = {
  id: string;
  kit: string;
  kitSecondary?: string;
  kitStyle?: KitStyle;
  gk?: boolean;
  portraitUrl?: string;
};

/** Photoreal standee — the player's cinematic photo, not a capsule toy. */
export function createPlayerFigure(opts: PlayerFigureOpts): THREE.Group {
  const kit = opts.kit || "#1d4ed8";
  const sec = opts.kitSecondary ?? shade(kit, 40);
  const root = new THREE.Group();
  root.name = opts.id;

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.28, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.38 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  root.add(shadow);

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.2, 0.05, 16),
    new THREE.MeshStandardMaterial({ color: col(kit), metalness: 0.35, roughness: 0.4 }),
  );
  plinth.position.y = 0.03;
  plinth.castShadow = true;
  root.add(plinth);

  const frame = new THREE.Mesh(
    new THREE.PlaneGeometry(0.72, 1.02),
    new THREE.MeshStandardMaterial({
      color: col(sec),
      metalness: 0.55,
      roughness: 0.28,
      side: THREE.DoubleSide,
    }),
  );
  frame.position.set(0, 0.62, -0.012);
  root.add(frame);

  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.32,
    metalness: 0.06,
    side: THREE.DoubleSide,
  });
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.96), mat);
  photo.position.set(0, 0.62, 0);
  photo.castShadow = true;
  root.add(photo);

  if (opts.portraitUrl) {
    const loader = new THREE.TextureLoader();
    loader.load(opts.portraitUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      mat.map = tex;
      mat.needsUpdate = true;
    });
  }

  root.userData.idle = Math.random() * Math.PI * 2;
  return root;
}

export function tickPlayerFigure(group: THREE.Group, t: number, active = false) {
  const phase = (group.userData.idle as number) + t * (active ? 8 : 3.2);
  group.position.y = Math.sin(phase) * (active ? 0.06 : 0.02);
  group.rotation.y = Math.sin(phase * 0.5) * (active ? 0.18 : 0.05);
}
