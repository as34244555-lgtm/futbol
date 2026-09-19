import * as THREE from "three";
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

function heroShellGeo() {
  const w = 0.72;
  const h = 1.78;
  const geo = new THREE.PlaneGeometry(w, h, 24, 44);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const u = x / (w * 0.5);
    const v = (y + h * 0.5) / h;
    let depth = 0.22 * Math.cos(Math.min(1, Math.abs(u)) * Math.PI * 0.5);
    if (v > 0.84) depth *= 0.88;
    else if (v > 0.52) depth *= 1.22;
    else if (v > 0.36) depth *= 0.95;
    else depth *= 0.7;
    pos.setZ(i, Math.max(0.04, depth));
  }
  geo.translate(0, h * 0.5, 0.02);
  geo.computeVertexNormals();
  return geo;
}

function makeHeroMat(): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.05,
    clearcoat: 0.16,
    transparent: true,
    alphaTest: 0.16,
    depthWrite: true,
    side: THREE.DoubleSide,
    map: whiteTex(),
  });
  mat.customProgramCacheKey = () => "ml-hero-shell-v3";
  mat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_fragment>",
      `#include <map_fragment>
       float mag = min(diffuseColor.r, diffuseColor.b) - diffuseColor.g;
       if (mag > 0.22 || diffuseColor.a < 0.14) discard;
       if (!gl_FrontFacing) diffuseColor.rgb *= 0.42;`,
    );
  };
  return mat;
}

/**
 * eFootball / FC Mobile footballer: photoreal 3D-character relief plus a light bone rig.
 * Capsule mannequins are not rendered — they read as toys next to the MetaHuman shell.
 */
export function createPlayerFigure(opts: PlayerFigureOpts): THREE.Group {
  const src = opts.bodyUrl || opts.portraitUrl;
  const root = new THREE.Group();
  root.name = opts.id;
  root.userData.gk = Boolean(opts.gk);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.32, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.42 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  root.add(shadow);

  const hips = bone("hips", 0.96);
  root.add(hips);
  const spine = bone("spine", 0.1);
  hips.add(spine);
  const chest = bone("chest", 0.16);
  spine.add(chest);
  chest.add(bone("head", 0.4));

  const armL = bone("armL");
  armL.position.set(-0.28, 0.14, 0);
  armL.add(bone("forearmL", -0.29));
  chest.add(armL);
  const armR = bone("armR");
  armR.position.set(0.28, 0.14, 0);
  armR.add(bone("forearmR", -0.29));
  chest.add(armR);

  const thighL = bone("thighL");
  thighL.position.set(-0.11, -0.02, 0);
  thighL.add(bone("shinL", -0.38));
  hips.add(thighL);
  const thighR = bone("thighR");
  thighR.position.set(0.11, -0.02, 0);
  thighR.add(bone("shinR", -0.38));
  hips.add(thighR);

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
      heroMat.map = tex;
      heroMat.needsUpdate = true;
    });
  }

  root.userData.idle = Math.random() * Math.PI * 2;
  root.userData.clip = "idle" as AnimClip;
  void opts.kit;
  void opts.kitSecondary;
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
    // Keep limb swings modest so the photoreal shell does not tear.
    const damp = name.startsWith("arm") || name.startsWith("fore") || name.startsWith("thigh") || name.startsWith("shin") ? 0.35 : 1;
    obj.rotation.x = (r.x ?? 0) * damp;
    obj.rotation.y = (r.y ?? 0) * (name === "hips" || name === "spine" ? 1 : damp);
    obj.rotation.z = (r.z ?? 0) * damp;
  }
}

export function tickPlayerFigure(group: THREE.Group, t: number, clip: AnimClip = "idle", active = false) {
  const phase = (group.userData.idle as number) + t * (active ? 1.35 : 0.55);
  applyPose(group, clip, phase);
  if (clip === "idle" || clip === "run" || clip.startsWith("dribble")) {
    group.position.y = Math.sin(phase * Math.PI * 2) * (active ? 0.04 : 0.014);
  }
}
