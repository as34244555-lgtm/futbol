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
    roughness: 0.45,
    metalness: 0.02,
  });
  const hairMat = new THREE.MeshStandardMaterial({ color: col(f.hair), roughness: 0.7 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.35, metalness: 0.2 });
  const shortMat = new THREE.MeshStandardMaterial({ color: col(shade(kit, -30)), roughness: 0.55 });
  const sockMat = new THREE.MeshStandardMaterial({ color: col(sec), roughness: 0.6 });
  const shirtTex = kitTexture(kit, sec, opts.kitStyle ?? "solid");
  const shirtMat = new THREE.MeshStandardMaterial({
    map: shirtTex,
    color: 0xffffff,
    roughness: 0.55,
    metalness: 0.04,
  });

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    root.add(m);
    return m;
  };

  add(new THREE.CapsuleGeometry(0.11, 0.42, 4, 8), shortMat, -0.12, 0.48, 0);
  add(new THREE.CapsuleGeometry(0.11, 0.42, 4, 8), shortMat, 0.12, 0.48, 0);
  add(new THREE.CapsuleGeometry(0.09, 0.4, 4, 8), sockMat, -0.12, 0.18, 0);
  add(new THREE.CapsuleGeometry(0.09, 0.4, 4, 8), sockMat, 0.12, 0.18, 0);
  const bootL = add(new THREE.BoxGeometry(0.16, 0.09, 0.28), bootMat, -0.12, 0.05, 0.04);
  const bootR = add(new THREE.BoxGeometry(0.16, 0.09, 0.28), bootMat, 0.12, 0.05, 0.04);
  bootL.rotation.y = 0.08;
  bootR.rotation.y = -0.08;

  const torso = add(new THREE.CapsuleGeometry(0.28, 0.42, 6, 10), shirtMat, 0, 1.12, 0);
  torso.scale.set(1, 1, 0.72);
  add(new THREE.CapsuleGeometry(0.08, 0.38, 4, 8), shirtMat, -0.38, 1.18, 0);
  add(new THREE.CapsuleGeometry(0.08, 0.38, 4, 8), shirtMat, 0.38, 1.18, 0);
  add(new THREE.CapsuleGeometry(0.07, 0.32, 4, 8), skinMat, -0.4, 0.86, 0);
  add(new THREE.CapsuleGeometry(0.07, 0.32, 4, 8), skinMat, 0.4, 0.86, 0);
  if (opts.gk) {
    const glove = new THREE.MeshStandardMaterial({ color: col(sec), roughness: 0.4 });
    add(new THREE.SphereGeometry(0.09, 10, 8), glove, -0.42, 0.66, 0.04);
    add(new THREE.SphereGeometry(0.09, 10, 8), glove, 0.42, 0.66, 0.04);
  }

  add(new THREE.CylinderGeometry(0.09, 0.11, 0.14, 10), skinMat, 0, 1.42, 0);
  const head = add(new THREE.SphereGeometry(0.2, 18, 14), skinMat, 0, 1.62, 0);
  head.scale.set(f.faceW, 1.05, 0.92);

  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xf4efe8, roughness: 0.3 });
  const irisMat = new THREE.MeshStandardMaterial({ color: col(f.eye), roughness: 0.25 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  for (const side of [-1, 1]) {
    add(new THREE.SphereGeometry(0.035, 8, 8), eyeMat, side * 0.07, 1.64, 0.155);
    add(new THREE.SphereGeometry(0.018, 8, 8), irisMat, side * 0.07, 1.64, 0.18);
    add(new THREE.SphereGeometry(0.01, 6, 6), pupilMat, side * 0.07, 1.64, 0.192);
  }

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
