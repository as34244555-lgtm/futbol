import * as THREE from "three";
import { faceSeed, shade } from "@/lib/portrait";
import type { KitStyle } from "@/lib/types";

function col(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

function kitTexture(primary: string, secondary: string, style: KitStyle): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = primary;
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = secondary;
  if (style === "stripes") {
    for (let x = 0; x < 128; x += 22) ctx.fillRect(x, 0, 10, 128);
  } else if (style === "hoops") {
    for (let y = 0; y < 128; y += 22) ctx.fillRect(0, y, 128, 10);
  } else if (style === "sash") {
    ctx.save();
    ctx.translate(64, 64);
    ctx.rotate(-0.6);
    ctx.fillRect(-90, -12, 180, 24);
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export type PlayerFigureOpts = {
  id: string;
  kit: string;
  kitSecondary?: string;
  kitStyle?: KitStyle;
  gk?: boolean;
};

export function createPlayerFigure(opts: PlayerFigureOpts): THREE.Group {
  const f = faceSeed(opts.id);
  const kit = opts.kit || f.shirt;
  const sec = opts.kitSecondary ?? shade(kit, 40);
  const root = new THREE.Group();
  root.name = opts.id;

  const skinMat = new THREE.MeshStandardMaterial({
    color: col(f.skin),
    roughness: 0.38,
    metalness: 0.04,
  });
  const hairMat = new THREE.MeshStandardMaterial({ color: col(f.hair), roughness: 0.62, metalness: 0.02 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.28, metalness: 0.35 });
  const shortMat = new THREE.MeshStandardMaterial({ color: col(shade(kit, -30)), roughness: 0.5 });
  const sockMat = new THREE.MeshStandardMaterial({ color: col(sec), roughness: 0.55 });
  const shirtTex = kitTexture(kit, sec, opts.kitStyle ?? "solid");
  const shirtMat = new THREE.MeshStandardMaterial({
    map: shirtTex,
    color: 0xffffff,
    roughness: 0.48,
    metalness: 0.06,
  });

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    root.add(m);
    return m;
  };

  add(new THREE.CapsuleGeometry(0.1, 0.38, 5, 10), shortMat, -0.11, 0.52, 0);
  add(new THREE.CapsuleGeometry(0.1, 0.38, 5, 10), shortMat, 0.11, 0.52, 0);
  add(new THREE.CapsuleGeometry(0.08, 0.36, 5, 10), sockMat, -0.11, 0.2, 0);
  add(new THREE.CapsuleGeometry(0.08, 0.36, 5, 10), sockMat, 0.11, 0.2, 0);
  add(new THREE.BoxGeometry(0.15, 0.08, 0.3), bootMat, -0.11, 0.045, 0.05);
  add(new THREE.BoxGeometry(0.15, 0.08, 0.3), bootMat, 0.11, 0.045, 0.05);

  const hips = add(new THREE.SphereGeometry(0.18, 12, 10), shortMat, 0, 0.78, 0);
  hips.scale.set(1.15, 0.7, 0.85);
  const chest = add(new THREE.CapsuleGeometry(0.22, 0.32, 6, 12), shirtMat, 0, 1.16, 0);
  chest.scale.set(1.2, 1, 0.68);
  add(new THREE.SphereGeometry(0.13, 10, 8), shirtMat, -0.26, 1.34, 0);
  add(new THREE.SphereGeometry(0.13, 10, 8), shirtMat, 0.26, 1.34, 0);
  add(new THREE.CapsuleGeometry(0.07, 0.3, 5, 8), shirtMat, -0.36, 1.12, 0);
  add(new THREE.CapsuleGeometry(0.07, 0.3, 5, 8), shirtMat, 0.36, 1.12, 0);
  add(new THREE.CapsuleGeometry(0.065, 0.28, 5, 8), skinMat, -0.38, 0.84, 0);
  add(new THREE.CapsuleGeometry(0.065, 0.28, 5, 8), skinMat, 0.38, 0.84, 0);
  if (opts.gk) {
    const glove = new THREE.MeshStandardMaterial({ color: col(sec), roughness: 0.4 });
    add(new THREE.SphereGeometry(0.085, 10, 8), glove, -0.4, 0.66, 0.04);
    add(new THREE.SphereGeometry(0.085, 10, 8), glove, 0.4, 0.66, 0.04);
  }

  add(new THREE.CylinderGeometry(0.08, 0.1, 0.12, 10), skinMat, 0, 1.44, 0);
  const head = add(new THREE.SphereGeometry(0.19, 20, 16), skinMat, 0, 1.64, 0);
  head.scale.set(f.faceW, 1.08, 0.9);

  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xf6f1ea, roughness: 0.22 });
  const irisMat = new THREE.MeshStandardMaterial({ color: col(f.eye), roughness: 0.18 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  for (const side of [-1, 1]) {
    add(new THREE.SphereGeometry(0.032, 10, 8), eyeWhite, side * 0.065, 1.66, 0.15);
    add(new THREE.SphereGeometry(0.016, 10, 8), irisMat, side * 0.065, 1.66, 0.175);
    add(new THREE.SphereGeometry(0.008, 8, 8), pupilMat, side * 0.065, 1.66, 0.188);
  }
  const nose = add(new THREE.SphereGeometry(0.03, 8, 8), skinMat, 0, 1.6, 0.16);
  nose.scale.set(0.7, 1.1, 1.2);

  paintHair3d(root, f.hairStyle, hairMat);

  root.userData.idle = Math.random() * Math.PI * 2;
  return root;
}

function paintHair3d(root: THREE.Group, style: number, mat: THREE.Material) {
  const add = (geo: THREE.BufferGeometry, y: number, z: number, sx = 1, sy = 1, sz = 1) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(0, y, z);
    m.scale.set(sx, sy, sz);
    m.castShadow = true;
    root.add(m);
    return m;
  };
  if (style === 0) add(new THREE.SphereGeometry(0.21, 12, 10), 1.74, 0, 1.05, 0.55, 1);
  else if (style === 1) add(new THREE.SphereGeometry(0.23, 12, 10), 1.7, -0.02, 1.1, 0.7, 1.1);
  else if (style === 2) {
    const m = add(new THREE.BoxGeometry(0.38, 0.08, 0.32), 1.78, 0);
    m.rotation.x = -0.1;
  } else if (style === 3) {
    add(new THREE.SphereGeometry(0.22, 12, 10), 1.72, -0.04, 1.15, 0.65, 1.15);
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.22, 4, 6), mat);
    tail.position.set(-0.16, 1.52, -0.08);
    tail.rotation.z = 0.5;
    root.add(tail);
  } else if (style === 4) {
    const m = add(new THREE.ConeGeometry(0.2, 0.22, 10), 1.8, 0);
    m.rotation.x = 0.15;
  } else add(new THREE.SphereGeometry(0.12, 10, 8), 1.78, 0);
}

export function tickPlayerFigure(group: THREE.Group, t: number, active = false) {
  const phase = (group.userData.idle as number) + t * (active ? 8 : 3.2);
  group.position.y = Math.sin(phase) * (active ? 0.06 : 0.02);
  group.rotation.y = Math.sin(phase * 0.5) * (active ? 0.25 : 0.08);
}
