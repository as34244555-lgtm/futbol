import * as THREE from "three";
import { faceSeed, shade } from "@/lib/portrait";
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

function col(hex: string): THREE.Color {
  return new THREE.Color(hex || "#1d4ed8");
}

function bone(name: string, y = 0): THREE.Group {
  const g = new THREE.Group();
  g.name = name;
  g.position.y = y;
  return g;
}

function whiteTex() {
  const t = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  t.needsUpdate = true;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function cloth(color: THREE.Color, roughness = 0.46): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness,
    metalness: 0.05,
    clearcoat: 0.08,
    sheen: 0.28,
    sheenColor: color,
    side: THREE.DoubleSide,
  });
}

function skinMat(color: THREE.Color): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.44,
    metalness: 0.02,
    clearcoat: 0.22,
    clearcoatRoughness: 0.55,
  });
}

function limb(mat: THREE.Material, r: number, len: number, name: string): THREE.Group {
  const g = bone(name);
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 8, 16), mat);
  mesh.position.y = -len / 2 - r * 0.18;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
  return g;
}

function heroShellGeo() {
  const w = 0.64;
  const h = 1.78;
  const geo = new THREE.PlaneGeometry(w, h, 22, 40);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const u = x / (w * 0.5);
    const v = (y + h * 0.5) / h;
    let depth = 0.18 * Math.cos(Math.min(1, Math.abs(u)) * Math.PI * 0.5);
    if (v > 0.84) depth *= 0.82;
    else if (v > 0.52) depth *= 1.18;
    else if (v > 0.36) depth *= 0.92;
    else depth *= 0.68;
    pos.setZ(i, Math.max(0.03, depth));
  }
  geo.translate(0, h * 0.5, 0.04);
  geo.computeVertexNormals();
  return geo;
}

function makeHeroMat(): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.32,
    metalness: 0.04,
    clearcoat: 0.12,
    transparent: true,
    alphaTest: 0.16,
    depthWrite: true,
    side: THREE.FrontSide,
    map: whiteTex(),
  });
  mat.customProgramCacheKey = () => "ml-hero-shell-v2";
  mat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_fragment>",
      `#include <map_fragment>
       float mag = min(diffuseColor.r, diffuseColor.b) - diffuseColor.g;
       if (mag > 0.22 || diffuseColor.a < 0.14) discard;`,
    );
  };
  return mat;
}

/**
 * eFootball / FC Mobile footballer: volumetric rig for motion + photoreal 3D-character shell.
 */
export function createPlayerFigure(opts: PlayerFigureOpts): THREE.Group {
  const f = faceSeed(opts.id);
  const kitHex = opts.kit || "#1d4ed8";
  const kit = col(kitHex);
  const sec = col(opts.kitSecondary ?? shade(kitHex, 36));
  const skin = col(f.skin);
  const src = opts.bodyUrl || opts.portraitUrl;

  const root = new THREE.Group();
  root.name = opts.id;
  root.userData.gk = Boolean(opts.gk);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.34, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  root.add(shadow);

  const shirtMat = cloth(kit);
  const shortMat = cloth(col(shade(kitHex, -26)), 0.5);
  const sockMat = cloth(sec, 0.52);
  const flesh = skinMat(skin);
  const bootMat = new THREE.MeshPhysicalMaterial({ color: 0x141414, roughness: 0.28, metalness: 0.4, clearcoat: 0.4 });
  const hairMat = new THREE.MeshStandardMaterial({ color: col(f.hair), roughness: 0.74 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: sec, roughness: 0.4 });

  const hips = bone("hips", 0.96);
  root.add(hips);

  const shorts = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 16), shortMat);
  shorts.scale.set(1.16, 0.66, 0.9);
  shorts.castShadow = true;
  hips.add(shorts);

  const makeLeg = (side: number, thighName: string, shinName: string) => {
    const thigh = limb(shortMat, 0.086, 0.33, thighName);
    thigh.position.set(side * 0.112, -0.02, 0);
    const shin = limb(sockMat, 0.066, 0.3, shinName);
    shin.position.y = -0.38;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.065, 0.24), bootMat);
    foot.position.set(0, -0.38, 0.05);
    foot.castShadow = true;
    shin.add(foot);
    thigh.add(shin);
    hips.add(thigh);
  };
  makeLeg(-1, "thighL", "shinL");
  makeLeg(1, "thighR", "shinR");

  const spine = bone("spine", 0.1);
  hips.add(spine);
  const chest = bone("chest", 0.16);
  spine.add(chest);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.35, 8, 18), shirtMat);
  torso.scale.set(1.2, 1, 0.7);
  torso.castShadow = true;
  chest.add(torso);

  const makeArm = (side: number, armName: string, forearmName: string) => {
    const arm = limb(shirtMat, 0.058, 0.24, armName);
    arm.position.set(side * 0.285, 0.14, 0);
    const forearm = limb(flesh, 0.05, 0.22, forearmName);
    forearm.position.y = -0.29;
    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(opts.gk ? 0.078 : 0.05, 12, 10),
      opts.gk ? gloveMat : flesh,
    );
    hand.position.y = -0.27;
    hand.castShadow = true;
    forearm.add(hand);
    arm.add(forearm);
    chest.add(arm);
  };
  makeArm(-1, "armL", "forearmL");
  makeArm(1, "armR", "forearmR");

  const head = bone("head", 0.4);
  chest.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.136, 28, 22), flesh);
  skull.scale.set(f.faceW, 1.06, 0.94);
  skull.castShadow = true;
  head.add(skull);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.144, 16, 12), hairMat);
  hair.scale.set(1.05, 0.5, 1.06);
  hair.position.set(0, 0.072, -0.012);
  head.add(hair);

  const heroMat = makeHeroMat();
  const hero = new THREE.Mesh(heroShellGeo(), heroMat);
  hero.name = "bodyPhoto";
  hero.position.y = -0.96;
  hero.castShadow = true;
  hero.renderOrder = 2;
  hips.add(hero);

  if (src) {
    new THREE.TextureLoader().load(src, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      tex.premultiplyAlpha = false;
      heroMat.map = tex;
      heroMat.needsUpdate = true;
    });
  }

  root.userData.idle = Math.random() * Math.PI * 2;
  root.userData.clip = "idle" as AnimClip;
  void opts.kitStyle;
  return root;
}

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
    group.position.y = Math.sin(phase * Math.PI * 2) * (active ? 0.045 : 0.016);
  }
}
