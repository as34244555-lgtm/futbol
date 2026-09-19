import { hash32 } from "./utils";

export const DRIBBLE_CLIPS = [
  "dribble_stepover",
  "dribble_cut",
  "dribble_elastico",
  "dribble_sprint",
  "dribble_feint",
] as const;

export const PASS_CLIPS = ["pass_ground", "pass_through", "pass_cross"] as const;
export const SHOT_CLIPS = ["shot_drive", "shot_chip"] as const;
export const TACKLE_CLIPS = ["tackle_slide"] as const;
export const SAVE_CLIPS = ["save_dive_l", "save_dive_r", "save_high", "save_low", "save_catch"] as const;

export type AnimClip =
  | "idle"
  | "run"
  | (typeof DRIBBLE_CLIPS)[number]
  | (typeof PASS_CLIPS)[number]
  | (typeof SHOT_CLIPS)[number]
  | (typeof TACKLE_CLIPS)[number]
  | (typeof SAVE_CLIPS)[number];

export function pickClip(kind: "dribble" | "pass" | "shot" | "tackle" | "save", seed: string): AnimClip {
  const h = hash32(seed);
  if (kind === "dribble") return DRIBBLE_CLIPS[h % DRIBBLE_CLIPS.length]!;
  if (kind === "pass") return PASS_CLIPS[h % PASS_CLIPS.length]!;
  if (kind === "shot") return SHOT_CLIPS[h % SHOT_CLIPS.length]!;
  if (kind === "tackle") return TACKLE_CLIPS[0]!;
  return SAVE_CLIPS[h % SAVE_CLIPS.length]!;
}

export function clipForEvent(opts: {
  eventType: string;
  minute: number;
  actorId?: string;
  playerId: string;
  gk: boolean;
  involved: boolean;
  attacking: boolean;
}): AnimClip {
  const seed = `${opts.playerId}:${opts.minute}:${opts.eventType}`;
  const shotty = opts.eventType === "goal" || opts.eventType === "shot" || opts.eventType === "chance";
  if (opts.gk && shotty && !opts.involved) return pickClip("save", seed);
  if (opts.involved) {
    if (opts.eventType === "goal" || opts.eventType === "shot") return pickClip("shot", seed);
    if (opts.eventType === "pass") return pickClip("pass", seed);
    if (opts.eventType === "card") return pickClip("tackle", seed);
    if (shotty) return pickClip("dribble", seed);
    return pickClip("dribble", seed);
  }
  if (opts.attacking) return "run";
  return "idle";
}

type Pose = Record<string, { x?: number; y?: number; z?: number }>;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function mix(a: Pose, b: Pose, t: number): Pose {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out: Pose = {};
  for (const k of keys) {
    const A = a[k] ?? {};
    const B = b[k] ?? {};
    out[k] = {
      x: lerp(A.x ?? 0, B.x ?? 0, t),
      y: lerp(A.y ?? 0, B.y ?? 0, t),
      z: lerp(A.z ?? 0, B.z ?? 0, t),
    };
  }
  return out;
}

const IDLE: Pose = {
  hips: { y: 0.04 },
  spine: { x: 0.06 },
  armL: { x: 0.25, z: 0.18 },
  armR: { x: 0.25, z: -0.18 },
  forearmL: { x: 0.35 },
  forearmR: { x: 0.35 },
  thighL: { x: 0.08 },
  thighR: { x: 0.08 },
  shinL: { x: 0.12 },
  shinR: { x: 0.12 },
};

export function poseForClip(clip: AnimClip, t: number): Pose {
  const u = ((t % 1) + 1) % 1;
  const s = Math.sin(u * Math.PI * 2);
  const s2 = Math.sin(u * Math.PI * 4);
  const k = Math.sin(Math.min(1, u) * Math.PI);

  if (clip === "idle") {
    return mix(IDLE, { hips: { y: 0.08 * s }, armL: { x: 0.2, z: 0.2 }, armR: { x: 0.2, z: -0.2 } }, 0.5 + 0.5 * s);
  }
  if (clip === "run") {
    return {
      spine: { x: 0.22 },
      hips: { y: 0.12 * s },
      armL: { x: 0.9 * s, z: 0.1 },
      armR: { x: -0.9 * s, z: -0.1 },
      forearmL: { x: 0.7 },
      forearmR: { x: 0.7 },
      thighL: { x: -0.95 * s },
      thighR: { x: 0.95 * s },
      shinL: { x: 0.55 + 0.5 * Math.max(0, s) },
      shinR: { x: 0.55 + 0.5 * Math.max(0, -s) },
    };
  }
  if (clip === "dribble_stepover") {
    return {
      hips: { y: 0.45 * s, x: 0.08 },
      spine: { y: 0.35 * s },
      armL: { x: 0.4, z: 0.45 },
      armR: { x: -0.2 + 0.6 * s, z: -0.2 },
      thighL: { x: 0.25 },
      thighR: { x: -0.15 + 1.15 * k, z: 0.55 * s },
      shinR: { x: 0.2 + 0.9 * k },
    };
  }
  if (clip === "dribble_cut") {
    return {
      hips: { y: -0.5 * k, z: 0.15 * s },
      spine: { y: -0.4 * k, z: 0.2 },
      thighL: { x: 0.7 * k, z: 0.35 },
      thighR: { x: -0.4 },
      armL: { x: 0.8, z: 0.4 },
      armR: { x: -0.3, z: -0.5 },
    };
  }
  if (clip === "dribble_elastico") {
    return {
      hips: { y: 0.7 * s2 },
      spine: { y: 0.55 * s2 },
      thighR: { x: 0.2, z: 0.8 * s },
      shinR: { x: 0.6 },
      armL: { z: 0.5 * s },
      armR: { z: -0.5 * s },
    };
  }
  if (clip === "dribble_sprint") {
    return mix(poseForClip("run", t * 1.4), { spine: { x: 0.38 }, armL: { x: 1.1 * s } }, 0.55);
  }
  if (clip === "dribble_feint") {
    return {
      hips: { y: 0.6 * Math.sin(u * Math.PI * 3) },
      spine: { x: 0.1, y: 0.5 * s },
      thighL: { x: 0.45 * k },
      thighR: { x: -0.2 },
      armL: { z: 0.55 },
      armR: { z: -0.15 },
    };
  }
  if (clip === "pass_ground") {
    return {
      spine: { y: -0.35 * k, x: 0.12 },
      armR: { x: -0.2 + 1.1 * k, z: -0.25 },
      forearmR: { x: 0.2 + 0.7 * k },
      thighR: { x: -0.15 + 0.85 * k },
      shinR: { x: 0.4 },
      thighL: { x: 0.25 },
    };
  }
  if (clip === "pass_through") {
    return {
      spine: { x: 0.18, y: -0.2 * k },
      armR: { x: 0.9 * k, z: -0.15 },
      thighR: { x: 1.05 * k },
      shinR: { x: 0.15 },
      hips: { y: 0.1 * k },
    };
  }
  if (clip === "pass_cross") {
    return {
      spine: { z: -0.25 * k, y: -0.45 * k },
      armR: { x: -0.4 + 1.3 * k, z: -0.7 * k },
      thighR: { x: 0.35, z: -0.4 * k },
      shinR: { x: 0.5 },
    };
  }
  if (clip === "shot_drive") {
    const plant = u < 0.35 ? u / 0.35 : 1;
    const swing = u < 0.35 ? 0 : Math.sin(((u - 0.35) / 0.65) * Math.PI);
    return {
      spine: { x: lerp(-0.15, 0.45, swing), y: -0.2 * swing },
      armL: { z: 0.6, x: -0.3 },
      armR: { z: -0.4, x: 0.4 },
      thighL: { x: 0.35 * plant },
      thighR: { x: lerp(0.9, -1.35, swing) },
      shinR: { x: lerp(1.1, 0.15, swing) },
      hips: { y: 0.15 * swing },
    };
  }
  if (clip === "shot_chip") {
    return {
      spine: { x: 0.28 * k },
      thighR: { x: 0.55 * k },
      shinR: { x: 0.85 * k },
      armL: { z: 0.35 },
      armR: { x: 0.5 * k },
    };
  }
  if (clip === "tackle_slide") {
    return {
      root: { z: -1.05 * k, x: 0.15 * k },
      thighL: { x: 0.2, z: 0.4 },
      thighR: { x: 1.2 * k, z: -0.2 },
      shinR: { x: 0.2 },
      armL: { x: 0.8, z: 0.6 },
      armR: { x: 0.4, z: -0.5 },
      spine: { x: 0.4 },
    };
  }
  if (clip === "save_dive_l") {
    return {
      root: { z: 1.15 * k, y: 0.2 * k },
      armL: { x: -1.2 * k, z: 0.9 * k },
      armR: { x: -0.6 * k, z: 0.4 },
      thighL: { x: 0.5, z: 0.4 },
      thighR: { x: 0.2 },
    };
  }
  if (clip === "save_dive_r") {
    return {
      root: { z: -1.15 * k, y: -0.2 * k },
      armR: { x: -1.2 * k, z: -0.9 * k },
      armL: { x: -0.6 * k, z: -0.4 },
      thighR: { x: 0.5, z: -0.4 },
      thighL: { x: 0.2 },
    };
  }
  if (clip === "save_high") {
    return {
      armL: { x: -2.2 * k, z: 0.25 },
      armR: { x: -2.2 * k, z: -0.25 },
      spine: { x: -0.25 * k },
      thighL: { x: 0.15 },
      thighR: { x: 0.15 },
    };
  }
  if (clip === "save_low") {
    return {
      hips: { x: 0.55 * k },
      spine: { x: 0.7 * k },
      thighL: { x: 1.1 * k },
      thighR: { x: 1.1 * k },
      shinL: { x: 1.2 * k },
      shinR: { x: 1.2 * k },
      armL: { x: 0.8 * k, z: 0.4 },
      armR: { x: 0.8 * k, z: -0.4 },
    };
  }
  // save_catch
  return {
    armL: { x: -0.9 * k, z: 0.35 },
    armR: { x: -0.9 * k, z: -0.35 },
    forearmL: { x: 0.9 * k },
    forearmR: { x: 0.9 * k },
    spine: { x: 0.15 },
    thighL: { x: 0.25 },
    thighR: { x: 0.2 },
  };
}
