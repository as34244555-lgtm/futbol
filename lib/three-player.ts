import * as THREE from "three";
import { shade } from "@/lib/portrait";
import { poseForClip, type AnimClip } from "@/lib/player-anims";
import type { KitStyle } from "@/lib/types";

export type PlayerFigureOpts = {
  id: string;
  kit: string;
  kitSecondary?: string;
  kitStyle?: KitStyle;
  gk?: boolean;
  portraitUrl?: string;
  bodyUrl?: string;
};

/** Photoreal full-body footballer (photo mesh, not capsules). */
export function createPlayerFigure(opts: PlayerFigureOpts): THREE.Group {
  const kit = opts.kit || "#1d4ed8";
  const src = opts.bodyUrl || opts.portraitUrl;
  const root = new THREE.Group();
  root.name = opts.id;
  root.userData.gk = Boolean(opts.gk);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.38, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.42 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  root.add(shadow);

  const hips = new THREE.Group();
  hips.name = "hips";
  hips.position.y = 0.02;
  root.add(hips);

  const rim = new THREE.Mesh(
    new THREE.PlaneGeometry(0.86, 1.78),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(shade(kit, -20)),
      metalness: 0.2,
      roughness: 0.55,
      side: THREE.DoubleSide,
    }),
  );
  rim.position.set(0, 0.9, -0.02);
  hips.add(rim);

  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.32,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 1.72), mat);
  photo.name = "bodyPhoto";
  photo.position.set(0, 0.9, 0);
  photo.castShadow = true;
  hips.add(photo);

  if (src) {
    new THREE.TextureLoader().load(src, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      mat.map = tex;
      mat.needsUpdate = true;
    });
  }

  root.userData.idle = Math.random() * Math.PI * 2;
  root.userData.clip = "idle" as AnimClip;
  void opts.kitStyle;
  void opts.kitSecondary;
  return root;
}

export function applyPose(root: THREE.Group, clip: AnimClip, t: number) {
  const pose = poseForClip(clip, t);
  const hips = root.getObjectByName("hips");
  const r = pose.root ?? {};
  root.rotation.x = r.x ?? 0;
  root.rotation.z = r.z ?? 0;
  if (hips) {
    const h = pose.hips ?? {};
    hips.rotation.x = (h.x ?? 0) * 0.45;
    hips.rotation.y = h.y ?? 0;
    hips.rotation.z = (h.z ?? 0) * 0.45;
  }
}

export function tickPlayerFigure(group: THREE.Group, t: number, clip: AnimClip = "idle", active = false) {
  const phase = (group.userData.idle as number) + t * (active ? 1.35 : 0.55);
  applyPose(group, clip, phase);
  if (clip === "idle" || clip === "run" || clip.startsWith("dribble")) {
    group.position.y = Math.sin(phase * Math.PI * 2) * (active ? 0.05 : 0.018);
  }
}
