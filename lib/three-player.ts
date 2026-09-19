import * as THREE from "three";
import { faceSeed, shade } from "@/lib/portrait";
import { poseForClip, type AnimClip } from "@/lib/player-anims";
import type { KitStyle } from "@/lib/types";

function col(hex: string): THREE.Color {
  return new THREE.Color(hex || "#1d4ed8");
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
  portraitUrl?: string;
};

function bone(name: string, y = 0): THREE.Group {
  const g = new THREE.Group();
  g.name = name;
  g.position.y = y;
  return g;
}

function limb(
  mat: THREE.Material,
  r: number,
  len: number,
  name: string,
): THREE.Group {
  const g = bone(name);
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 5, 10), mat);
  mesh.position.y = -len / 2 - r * 0.2;
  mesh.castShadow = true;
  g.add(mesh);
  return g;
}

/** Articulated photoreal-faced footballer (kit + portrait, not a card standee). */
export function createPlayerFigure(opts: PlayerFigureOpts): THREE.Group {
  const f = faceSeed(opts.id);
  const kit = opts.kit || f.shirt;
  const sec = opts.kitSecondary ?? shade(kit, 40);
  const root = new THREE.Group();
  root.name = opts.id;
  root.userData.gk = Boolean(opts.gk);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.32, 18),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  root.add(shadow);

  const skinMat = new THREE.MeshStandardMaterial({ color: col(f.skin), roughness: 0.42, metalness: 0.04 });
  const hairMat = new THREE.MeshStandardMaterial({ color: col(f.hair), roughness: 0.62 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.28, metalness: 0.35 });
  const shortMat = new THREE.MeshStandardMaterial({ color: col(shade(kit, -28)), roughness: 0.5 });
  const sockMat = new THREE.MeshStandardMaterial({ color: col(sec), roughness: 0.55 });
  const shirtTex = kitTexture(kit, sec, opts.kitStyle ?? "solid");
  const shirtMat = new THREE.MeshStandardMaterial({ map: shirtTex, roughness: 0.48, metalness: 0.06 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: col(sec), roughness: 0.4 });

  const hips = bone("hips", 0.94);
  root.add(hips);

  const shorts = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), shortMat);
  shorts.scale.set(1.2, 0.72, 0.9);
  shorts.castShadow = true;
  hips.add(shorts);

  const makeLeg = (side: number, thighName: string, shinName: string) => {
    const thigh = limb(shortMat, 0.09, 0.34, thighName);
    thigh.position.set(side * 0.11, -0.02, 0);
    const shin = limb(sockMat, 0.07, 0.32, shinName);
    shin.position.y = -0.38;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.26), bootMat);
    foot.position.set(0, -0.4, 0.05);
    foot.castShadow = true;
    shin.add(foot);
    thigh.add(shin);
    hips.add(thigh);
  };
  makeLeg(-1, "thighL", "shinL");
  makeLeg(1, "thighR", "shinR");

  const spine = bone("spine", 0.12);
  hips.add(spine);
  const chest = bone("chest", 0.16);
  spine.add(chest);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.34, 6, 12), shirtMat);
  torso.scale.set(1.18, 1, 0.7);
  torso.castShadow = true;
  chest.add(torso);

  const makeArm = (side: number, armName: string, forearmName: string) => {
    const arm = limb(shirtMat, 0.065, 0.26, armName);
    arm.position.set(side * 0.28, 0.16, 0);
    const forearm = limb(skinMat, 0.055, 0.24, forearmName);
    forearm.position.y = -0.3;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(opts.gk ? 0.08 : 0.055, 10, 8), opts.gk ? gloveMat : skinMat);
    hand.position.y = -0.3;
    hand.castShadow = true;
    forearm.add(hand);
    arm.add(forearm);
    chest.add(arm);
  };
  makeArm(-1, "armL", "forearmL");
  makeArm(1, "armR", "forearmR");

  const head = bone("head", 0.42);
  chest.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.145, 18, 14), skinMat);
  skull.scale.set(f.faceW, 1.08, 0.92);
  skull.castShadow = true;
  head.add(skull);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.155, 12, 10), hairMat);
  hair.scale.set(1.05, 0.55, 1.05);
  hair.position.set(0, 0.08, -0.02);
  head.add(hair);

  if (opts.portraitUrl) {
    const loader = new THREE.TextureLoader();
    loader.load(opts.portraitUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(0.22, 0.28),
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.02 }),
      );
      face.position.set(0, 0.02, 0.13);
      head.add(face);
    });
  }

  root.userData.idle = Math.random() * Math.PI * 2;
  root.userData.clip = "idle" as AnimClip;
  return root;
}

const BONE_NAMES = [
  "root",
  "hips",
  "spine",
  "chest",
  "head",
  "armL",
  "armR",
  "forearmL",
  "forearmR",
  "thighL",
  "thighR",
  "shinL",
  "shinR",
] as const;

export function applyPose(root: THREE.Group, clip: AnimClip, t: number) {
  const pose = poseForClip(clip, t);
  for (const name of BONE_NAMES) {
    const obj = name === "root" ? root : (root.getObjectByName(name) as THREE.Object3D | undefined);
    if (!obj) continue;
    const r = pose[name] ?? {};
    if (name === "root") {
      obj.rotation.x = r.x ?? 0;
      obj.rotation.z = r.z ?? 0;
      continue;
    }
    obj.rotation.x = r.x ?? 0;
    obj.rotation.y = r.y ?? 0;
    obj.rotation.z = r.z ?? 0;
  }
}

export function tickPlayerFigure(group: THREE.Group, t: number, clip: AnimClip = "idle", active = false) {
  const phase = (group.userData.idle as number) + t * (active ? 1.35 : 0.55);
  applyPose(group, clip, phase);
  if (clip === "idle" || clip === "run" || clip.startsWith("dribble")) {
    group.position.y = Math.sin(phase * Math.PI * 2) * (active ? 0.04 : 0.015);
  }
}
