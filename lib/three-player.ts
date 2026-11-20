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

  const glb = clonePlayerGlb(opts.modelSlot);
  glb.name = "glbBody";
  root.add(glb);

  const hips = bone("hips", 0.96);
  root.add(hips);
  hips.visible = false;

  root.userData.idle = Math.random() * Math.PI * 2;
  root.userData.clip = "idle" as AnimClip;
  void opts.kit;
  void opts.kitSecondary;
  void opts.kitStyle;
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

const MOCAP: Record<string, string> = {
  idle: "idle",
  run: "walk",
  dribble_stepover: "walk",
  dribble_cut: "walk",
  dribble_elastico: "walk",
  dribble_sprint: "walk",
  dribble_feint: "walk",
  pass_ground: "pass",
  pass_through: "pass",
  pass_cross: "kick",
  shot_drive: "kick",
  shot_chip: "kick",
  tackle_slide: "kick",
  save_dive_l: "kick",
  save_dive_r: "kick",
  save_high: "kick",
  save_low: "kick",
  save_catch: "pass",
};

function driveMocap(group: THREE.Group, clip: AnimClip, t: number) {
  const holder = group.getObjectByName("playerGlb");
  const mixer = holder?.userData.mixer as THREE.AnimationMixer | undefined;
  const clips = holder?.userData.clips as THREE.AnimationClip[] | undefined;
  if (!holder || !mixer || !clips?.length) return false;
  let want = MOCAP[clip] ?? "idle";
  if (want === "kick" || want === "pass") holder.userData.lock = { name: want, until: t + 0.85 };
  const lock = holder.userData.lock as { name: string; until: number } | undefined;
  if (lock && t < lock.until) want = lock.name;
  if (holder.userData.current !== want) {
    const found = THREE.AnimationClip.findByName(clips, want) ?? THREE.AnimationClip.findByName(clips, "idle");
    if (found) {
      const next = mixer.clipAction(found);
      const once = want === "kick" || want === "pass";
      next.reset();
      next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
      next.clampWhenFinished = once;
      next.fadeIn(0.18).play();
      const prev = holder.userData.prev as THREE.AnimationAction | undefined;
      prev?.fadeOut(0.18);
      holder.userData.prev = next;
      holder.userData.current = want;
    }
  }
  const last = holder.userData.lastT as number | undefined;
  let dt = last == null ? 1 / 60 : t - last;
  if (!(dt > 0 && dt < 0.08)) dt = 1 / 60;
  holder.userData.lastT = t;
  mixer.update(dt);
  return true;
}

export function tickPlayerFigure(group: THREE.Group, t: number, clip: AnimClip = "idle", active = false) {
  if (group.userData.glb && driveMocap(group, clip, t)) return;
  const phase = (group.userData.idle as number) + t * (active ? 1.35 : 0.55);
  if (group.userData.glb) {
    group.position.y = Math.sin(phase * Math.PI * 2) * (active ? 0.03 : 0.012);
    return;
  }
  applyPose(group, clip, phase);
  if (clip === "idle" || clip === "run" || clip.startsWith("dribble")) {
    group.position.y = Math.sin(phase * Math.PI * 2) * (active ? 0.04 : 0.014);
  }
}
