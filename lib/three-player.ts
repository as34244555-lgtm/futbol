import * as THREE from "three";
import { clonePlayerGlb } from "@/lib/player-glb";
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
  modelSlot?: number;
  modelUrl?: string;
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

/**
 * eFootball player: Drive GLB mesh standing on y = 0.
 */
export function createPlayerFigure(opts: PlayerFigureOpts): THREE.Group {
  const root = new THREE.Group();
  root.name = opts.id;
  root.userData.gk = Boolean(opts.gk);
  root.userData.glb = true;

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.32, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.42 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  root.add(shadow);

  const glb = clonePlayerGlb(
    opts.modelSlot,
    {
      kit: opts.kit,
      kitSecondary: opts.kitSecondary,
      kitStyle: opts.kitStyle,
      gk: opts.gk,
    },
    opts.modelUrl,
  );
  glb.name = "glbBody";
  root.add(glb);

  const hips = bone("hips", 0.96);
  root.add(hips);
  hips.visible = false;

  root.userData.idle = Math.random() * Math.PI * 2;
  root.userData.clip = "idle" as AnimClip;
  void opts.bodyUrl;
  void opts.portraitUrl;
  return root;
}

export function applyPose(root: THREE.Group, clip: AnimClip, t: number) {
  const pose = poseForClip(clip, t);
  for (const name of BONE_NAMES) {
    const obj = name === "root" ? root : (root.getObjectByName(name) as THREE.Object3D | undefined);
    if (!obj) continue;
    const p = pose[name];
    if (!p) continue;
    obj.rotation.set(p.x ?? 0, p.y ?? 0, p.z ?? 0);
  }
}

function movingClip(clip: AnimClip) {
  return clip === "run" || clip.startsWith("dribble") || clip.startsWith("pass") || clip.startsWith("shot") || clip.startsWith("tackle") || clip.startsWith("save");
}

export function tickPlayerFigure(group: THREE.Group, t: number, clip: AnimClip = "idle", active = false) {
  const phase = ((group.userData.idle as number) || 0) + t * (movingClip(clip) ? 2.15 : active ? 0.85 : 0.45);
  if (group.userData.glb) {
  const bounce = Math.sin(phase * Math.PI * 4);
    if (movingClip(clip)) group.position.y = Math.max(0, bounce) * 0.05;
    else group.position.y = (Math.sin(phase * Math.PI * 2) * 0.5 + 0.5) * 0.008;
    return;
  }
  applyPose(group, clip, phase);
  if (clip === "idle" || clip === "run" || clip.startsWith("dribble")) {
    group.position.y = Math.sin(phase * Math.PI * 2) * (active ? 0.04 : 0.014);
  }
}
