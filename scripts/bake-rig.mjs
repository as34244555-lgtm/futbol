/**
 * Fits a humanoid skeleton to a static player GLB and bakes CMU motion-capture
 * clips (walk, run, kick, idle). Source motions: mocap.cs.cmu.edu, NSF EIA-0196217.
 *
 * Usage: node scripts/bake-rig.mjs public/models/player.glb public/models/player.glb
 */
import fs from "node:fs";
import { Document, NodeIO } from "@gltf-transform/core";
import * as THREE from "three";

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error("usage: node scripts/bake-rig.mjs in.glb out.glb");
  process.exit(1);
}

const BVH = {
  idle: "/tmp/bvh/77_02.bvh",
  walk: "/tmp/bvh/02_01.bvh",
  run: "/tmp/bvh/02_03.bvh",
  kick: "/tmp/bvh/10_01.bvh",
  pass: "/tmp/bvh/74_03.bvh",
};

function parseBVH(text) {
  const lines = text.split(/\r?\n/);
  let i = 0;
  const joints = [];
  function parseJoint(parent) {
    const head = lines[i++].trim().split(/\s+/);
    const joint = { name: head[1] || "End", parent, offset: [0, 0, 0], channels: [], index: joints.length };
    joints.push(joint);
    i++;
    while (i < lines.length) {
      const l = lines[i].trim();
      if (l.startsWith("OFFSET")) {
        joint.offset = l.split(/\s+/).slice(1).map(Number);
        i++;
      } else if (l.startsWith("CHANNELS")) {
        joint.channels = l.split(/\s+/).slice(2);
        i++;
      } else if (l.startsWith("JOINT") || l.startsWith("ROOT")) parseJoint(joint);
      else if (l.startsWith("End Site")) i += 4;
      else if (l.startsWith("}")) {
        i++;
        break;
      } else i++;
    }
    return joint;
  }
  while (!lines[i].trim().startsWith("ROOT")) i++;
  parseJoint(null);
  while (!lines[i].trim().startsWith("MOTION")) i++;
  i++;
  const frames = Number(lines[i++].trim().split(/\s+/)[1]);
  const frameTime = Number(lines[i++].trim().split(/\s+/)[2]);
  const motionStart = i;
  const data = [];
  for (let f = 0; f < frames; f++) data.push(lines[motionStart + f].trim().split(/\s+/).map(Number));
  return { joints, frames, frameTime, data };
}

function sampleBVH(bvh, frame) {
  const vals = bvh.data[Math.max(0, Math.min(bvh.frames - 1, frame | 0))];
  let cursor = 0;
  const pos = bvh.joints.map(() => new THREE.Vector3());
  const quat = bvh.joints.map(() => new THREE.Quaternion());
  const worldM = bvh.joints.map(() => new THREE.Matrix4());
  function rec(j, parent) {
    let tx = j.offset[0];
    let ty = j.offset[1];
    let tz = j.offset[2];
    let ex = 0;
    let ey = 0;
    let ez = 0;
    for (const ch of j.channels) {
      const v = vals[cursor++];
      if (ch === "Xposition") tx = v;
      else if (ch === "Yposition") ty = v;
      else if (ch === "Zposition") tz = v;
      else if (ch === "Xrotation") ex = (v * Math.PI) / 180;
      else if (ch === "Yrotation") ey = (v * Math.PI) / 180;
      else if (ch === "Zrotation") ez = (v * Math.PI) / 180;
    }
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(ex, ey, ez, "ZYX"));
    const m = new THREE.Matrix4().compose(new THREE.Vector3(tx, ty, tz), q, new THREE.Vector3(1, 1, 1));
    if (parent) m.premultiply(worldM[parent.index]);
    worldM[j.index] = m;
    m.decompose(pos[j.index], quat[j.index], new THREE.Vector3());
    for (const child of bvh.joints) if (child.parent === j) rec(child, j);
  }
  rec(bvh.joints[0], null);
  return { pos, quat };
}

function readGLB(path) {
  const buf = fs.readFileSync(path);
  let off = 12;
  let json;
  let bin;
  while (off < buf.length) {
    const len = buf.readUInt32LE(off);
    const type = buf.readUInt32LE(off + 4);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 0x4e4f534a) json = JSON.parse(data.toString("utf8"));
    else bin = Buffer.from(data);
    off += 8 + len;
  }
  const prim = json.meshes[0].primitives[0];
  const view = (accIndex) => {
    const acc = json.accessors[accIndex];
    const bv = json.bufferViews[acc.bufferView];
    const start = (bv.byteOffset || 0) + (acc.byteOffset || 0);
    return { acc, start };
  };
  const p = view(prim.attributes.POSITION);
  const count = p.acc.count;
  const pos = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const u = view(prim.attributes.TEXCOORD_0);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = bin.readFloatLE(p.start + i * 12);
    pos[i * 3 + 1] = bin.readFloatLE(p.start + i * 12 + 4);
    pos[i * 3 + 2] = bin.readFloatLE(p.start + i * 12 + 8);
    uv[i * 2] = bin.readFloatLE(u.start + i * 8);
    uv[i * 2 + 1] = bin.readFloatLE(u.start + i * 8 + 4);
  }
  const ia = view(prim.indices);
  const ic = ia.acc.count;
  const idx = new Uint32Array(ic);
  const comp = ia.acc.componentType;
  for (let i = 0; i < ic; i++) {
    if (comp === 5123) idx[i] = bin.readUInt16LE(ia.start + i * 2);
    else if (comp === 5125) idx[i] = bin.readUInt32LE(ia.start + i * 4);
    else idx[i] = bin.readUInt8(ia.start + i);
  }
  const images = (json.images || []).map((img) => {
    const bv = json.bufferViews[img.bufferView];
    const start = bv.byteOffset || 0;
    return { mime: img.mimeType || "image/png", bytes: bin.subarray(start, start + bv.byteLength) };
  });
  return { pos, uv, idx, images };
}

function rescaleOnly(mesh) {
  const { pos, uv, idx } = mesh;
  const n = pos.length / 3;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    minY = Math.min(minY, pos[i * 3 + 1]);
    maxY = Math.max(maxY, pos[i * 3 + 1]);
  }
  const scale = 1.78 / Math.max(0.001, maxY - minY);
  const outP = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    outP[i * 3] = pos[i * 3] * scale;
    outP[i * 3 + 1] = (pos[i * 3 + 1] - minY) * scale;
    outP[i * 3 + 2] = pos[i * 3 + 2] * scale;
  }
  const normals = new Float32Array(outP.length);
  const tmp = new THREE.Vector3();
  const e1 = new THREE.Vector3();
  const e2 = new THREE.Vector3();
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3;
    const b = idx[i + 1] * 3;
    const c = idx[i + 2] * 3;
    e1.set(outP[b] - outP[a], outP[b + 1] - outP[a + 1], outP[b + 2] - outP[a + 2]);
    e2.set(outP[c] - outP[a], outP[c + 1] - outP[a + 1], outP[c + 2] - outP[a + 2]);
    tmp.crossVectors(e1, e2);
    for (const k of [a, b, c]) {
      normals[k] += tmp.x;
      normals[k + 1] += tmp.y;
      normals[k + 2] += tmp.z;
    }
  }
  for (let i = 0; i < normals.length; i += 3) {
    const len = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
    normals[i] /= len;
    normals[i + 1] /= len;
    normals[i + 2] /= len;
  }
  console.log("full mesh", n, "tris", idx.length / 3);
  return { pos: outP, uv, idx, normals };
}

function cluster(mesh) {
  const { pos, uv, idx } = mesh;
  const n = pos.length / 3;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    minY = Math.min(minY, pos[i * 3 + 1]);
    maxY = Math.max(maxY, pos[i * 3 + 1]);
  }
  const h = Math.max(0.001, maxY - minY);
  const scale = 1.78 / h;
  const cell = 0.0065;
  const map = new Map();
  const remap = new Int32Array(n);
  const outP = [];
  const outU = [];
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3] * scale;
    const y = (pos[i * 3 + 1] - minY) * scale;
    const z = pos[i * 3 + 2] * scale;
    const key = `${Math.round(x / cell)}|${Math.round(y / cell)}|${Math.round(z / cell)}`;
    let id = map.get(key);
    if (id == null) {
      id = outP.length / 3;
      map.set(key, id);
      outP.push(x, y, z);
      outU.push(uv[i * 2], uv[i * 2 + 1]);
    }
    remap[i] = id;
  }
  const tris = [];
  for (let i = 0; i < idx.length; i += 3) {
    const a = remap[idx[i]];
    const b = remap[idx[i + 1]];
    const c = remap[idx[i + 2]];
    if (a !== b && b !== c && a !== c) tris.push(a, b, c);
  }
  const normals = new Float32Array(outP.length);
  const tmp = new THREE.Vector3();
  const e1 = new THREE.Vector3();
  const e2 = new THREE.Vector3();
  for (let i = 0; i < tris.length; i += 3) {
    const a = tris[i] * 3;
    const b = tris[i + 1] * 3;
    const c = tris[i + 2] * 3;
    e1.set(outP[b] - outP[a], outP[b + 1] - outP[a + 1], outP[b + 2] - outP[a + 2]);
    e2.set(outP[c] - outP[a], outP[c + 1] - outP[a + 1], outP[c + 2] - outP[a + 2]);
    tmp.crossVectors(e1, e2);
    for (const k of [a, b, c]) {
      normals[k] += tmp.x;
      normals[k + 1] += tmp.y;
      normals[k + 2] += tmp.z;
    }
  }
  for (let i = 0; i < normals.length; i += 3) {
    const len = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
    normals[i] /= len;
    normals[i + 1] /= len;
    normals[i + 2] /= len;
  }
  console.log("clustered", n, "->", outP.length / 3, "tris", tris.length / 3);
  return { pos: Float32Array.from(outP), uv: Float32Array.from(outU), idx: Uint32Array.from(tris), normals };
}

function fitBones(pos) {
  const n = pos.length / 3;
  const V = (i) => new THREE.Vector3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
  let cx = 0;
  let ccount = 0;
  for (let i = 0; i < n; i++) {
    if (pos[i * 3 + 1] > 1.15 && pos[i * 3 + 1] < 1.45 && Math.abs(pos[i * 3]) < 0.12) {
      cx += pos[i * 3];
      ccount++;
    }
  }
  cx = ccount ? cx / ccount : 0;
  const arm = { L: [], R: [] };
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3] - cx;
    const y = pos[i * 3 + 1];
    if (y > 0.85 && y < 1.45 && Math.abs(x) > 0.16) arm[x > 0 ? "R" : "L"].push(V(i));
  }
  const extremity = (pts, high) => {
    const pool = pts.filter((p) => (high ? p.y > 1.2 : p.y < 1.05));
    const use = pool.length ? pool : pts;
    use.sort((a, b) => Math.abs(b.x) - Math.abs(a.x));
    const top = use.slice(0, Math.max(1, Math.floor(use.length * 0.15)));
    const c = new THREE.Vector3();
    top.forEach((p) => c.add(p));
    return c.multiplyScalar(1 / top.length);
  };
  const shoulder = (side) => new THREE.Vector3(side * 0.18, 1.42, 0.02);
  const hip = (side) => new THREE.Vector3(cx + side * 0.09, 0.96, 0);
  const knee = (side) => new THREE.Vector3(cx + side * 0.07, 0.52, 0.03);
  const ankle = (side) => new THREE.Vector3(cx + side * 0.06, 0.08, 0.0);
  const toe = (side) => new THREE.Vector3(cx + side * 0.06, 0.03, 0.12);
  const L = -1;
  const R = 1;
  const bones = [
    ["hips", null, new THREE.Vector3(cx, 0.98, 0)],
    ["spine", "hips", new THREE.Vector3(cx, 1.14, 0)],
    ["chest", "spine", new THREE.Vector3(cx, 1.32, 0)],
    ["neck", "chest", new THREE.Vector3(cx, 1.5, 0)],
    ["head", "neck", new THREE.Vector3(cx, 1.66, 0.02)],
    ["lArm", "chest", shoulder(L)],
    ["lFore", "lArm", extremity(arm.L, false).setY(Math.min(extremity(arm.L, false).y, 1.08))],
    ["lHand", "lFore", extremity(arm.L, false).clone().setY(Math.max(0.72, extremity(arm.L, false).y - 0.22))],
    ["rArm", "chest", shoulder(R)],
    ["rFore", "rArm", extremity(arm.R, false)],
    ["rHand", "rFore", extremity(arm.R, false).clone().setY(Math.max(0.72, extremity(arm.R, false).y - 0.22))],
    ["lThigh", "hips", hip(L)],
    ["lShin", "lThigh", knee(L)],
    ["lFoot", "lShin", ankle(L)],
    ["lToe", "lFoot", toe(L)],
    ["rThigh", "hips", hip(R)],
    ["rShin", "rThigh", knee(R)],
    ["rFoot", "rShin", ankle(R)],
    ["rToe", "rFoot", toe(R)],
  ];
  // Recompute forearms once so we don't call extremity twice inconsistently.
  const lElbow = extremity(arm.L, false);
  const rElbow = extremity(arm.R, false);
  bones.find((b) => b[0] === "lFore")[2] = lElbow;
  bones.find((b) => b[0] === "rFore")[2] = rElbow;
  bones.find((b) => b[0] === "lHand")[2] = lElbow.clone().add(new THREE.Vector3(L * 0.02, -0.2, 0.04));
  bones.find((b) => b[0] === "rHand")[2] = rElbow.clone().add(new THREE.Vector3(R * 0.02, -0.2, 0.04));
  const byName = Object.fromEntries(bones.map(([name, parent, p]) => [name, { name, parent, p }]));
  console.log(
    "elbows",
    lElbow.toArray().map((n) => n.toFixed(2)),
    rElbow.toArray().map((n) => n.toFixed(2)),
    "arm verts",
    arm.L.length,
    arm.R.length,
  );
  return { bones, byName };
}

function skinWeights(pos, bones) {
  const byName = Object.fromEntries(bones.map((b) => [b[0], b]));
  const segs = [];
  for (const [name, parent] of bones) {
    if (!parent) continue;
    segs.push([name, byName[parent][2], byName[name][2]]);
  }
  const n = pos.length / 3;
  const joints = new Uint8Array(n * 4);
  const weights = new Float32Array(n * 4);
  const indexOf = Object.fromEntries(bones.map((b, i) => [b[0], i]));
  const group = {
    hips: "torso",
    spine: "torso",
    chest: "torso",
    neck: "head",
    head: "head",
    lArm: "armL",
    lFore: "armL",
    lHand: "armL",
    rArm: "armR",
    rFore: "armR",
    rHand: "armR",
    lThigh: "legL",
    lShin: "legL",
    lFoot: "legL",
    lToe: "legL",
    rThigh: "legR",
    rShin: "legR",
    rFoot: "legR",
    rToe: "legR",
  };
  for (let i = 0; i < n; i++) {
    const p = new THREE.Vector3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
    const scores = [];
    for (const [name, a, b] of segs) {
      const ab = b.clone().sub(a);
      const len2 = ab.lengthSq() || 1;
      const t = Math.max(0, Math.min(1, p.clone().sub(a).dot(ab) / len2));
      const d = p.distanceTo(a.clone().addScaledVector(ab, t));
      const g = group[name];
      const ax = Math.abs(p.x);
      let allowed = true;
      if (g === "armL") allowed = p.x < -0.11 && p.y > 0.68 && p.y < 1.52;
      if (g === "armR") allowed = p.x > 0.11 && p.y > 0.68 && p.y < 1.52;
      if (g === "legL") allowed = p.y < 0.84 && p.x < 0.04;
      if (g === "legR") allowed = p.y < 0.84 && p.x > -0.04;
      if (g === "head") allowed = p.y > 1.4 && ax < 0.16;
      if (g === "torso") allowed = p.y >= 0.9 && ax < 0.2;
      if (!allowed) continue;
      scores.push([indexOf[name], 1 / (d * d + 0.0004)]);
    }
    if (!scores.length) scores.push([0, 1]);
    scores.sort((a, b) => b[1] - a[1]);
    const best = scores[0][1];
    const top = scores.filter((s) => s[1] > best * 0.55).slice(0, 2);
    const sum = top.reduce((s, x) => s + x[1], 0) || 1;
    for (let k = 0; k < 4; k++) {
      joints[i * 4 + k] = top[k] ? top[k][0] : 0;
      weights[i * 4 + k] = top[k] ? top[k][1] / sum : 0;
    }
  }
  return { joints, weights };
}

function loopRange(bvh, jointName) {
  const id = bvh.joints.find((j) => j.name === jointName).index;
  const ys = [];
  for (let f = 0; f < bvh.frames; f += 2) ys.push(sampleBVH(bvh, f).pos[id].y);
  let best = { i: 10, len: 40, score: 1e9 };
  for (let len = 20; len < 80; len++) {
    for (let i = 8; i < ys.length - len - 2; i += 2) {
      const score = Math.abs(ys[i] - ys[i + len]) + Math.abs(ys[i + 2] - ys[i + len + 2]);
      if (score < best.score) best = { i, len, score };
    }
  }
  return { start: best.i * 2, length: best.len * 2 };
}

function kickRange(bvh) {
  const feet = ["LeftFoot", "RightFoot"].map((name) => bvh.joints.find((j) => j.name === name).index);
  let bestF = 0;
  let bestY = -1e9;
  for (let f = 0; f < bvh.frames; f += 2) {
    const s = sampleBVH(bvh, f);
    const y = Math.max(s.pos[feet[0]].y, s.pos[feet[1]].y);
    if (y > bestY) {
      bestY = y;
      bestF = f;
    }
  }
  const start = Math.max(0, bestF - Math.round(0.45 / bvh.frameTime));
  const end = Math.min(bvh.frames - 1, bestF + Math.round(0.55 / bvh.frameTime));
  return { start, length: end - start };
}

function retargetClip(bvh, range, bones, byName, gain = 0.45) {
  const step = Math.max(1, Math.round((1 / 30) / bvh.frameTime));
  const frames = [];
  for (let f = range.start; f <= range.start + range.length; f += step) frames.push(f);
  if (frames[frames.length - 1] !== range.start + range.length) frames.push(range.start + range.length);
  const nameOf = {
    lThigh: ["LeftUpLeg", "LeftLeg"],
    lShin: ["LeftLeg", "LeftFoot"],
    lFoot: ["LeftFoot", "LeftToeBase"],
    rThigh: ["RightUpLeg", "RightLeg"],
    rShin: ["RightLeg", "RightFoot"],
    rFoot: ["RightFoot", "RightToeBase"],
    lArm: ["LeftArm", "LeftForeArm"],
    lFore: ["LeftForeArm", "LeftHand"],
    lHand: ["LeftHand", "LeftHandIndex1"],
    rArm: ["RightArm", "RightForeArm"],
    rFore: ["RightForeArm", "RightHand"],
    rHand: ["RightHand", "RightHandIndex1"],
    spine: ["Spine", "Spine1"],
    chest: ["Spine1", "Neck1"],
    neck: ["Neck1", "Head"],
    head: ["Head", null],
  };
  const id = Object.fromEntries(bvh.joints.map((j) => [j.name, j.index]));
  const rest0 = sampleBVH(bvh, frames[0]);
  const times = [];
  const quats = Object.fromEntries(bones.map((b) => [b[0], []]));
  const hipY = [];
  const hip0 = rest0.pos[id.Hips].y;
  bones.forEach((b) => {
    const parent = b[1] ? byName[b[1]].p : new THREE.Vector3();
    const dir = b[2].clone().sub(parent);
    if (dir.lengthSq() < 1e-6) dir.set(0, 1, 0);
    byName[b[0]].restDir = dir.normalize();
  });
  frames.forEach((f, fi) => {
    const s = sampleBVH(bvh, f);
    times.push((fi * step * bvh.frameTime));
    hipY.push(byName.hips.p.y + (s.pos[id.Hips].y - hip0) * (0.98 / hip0));
    const parentQuat = { hips: new THREE.Quaternion() };
    const hipDelta = s.quat[id.Hips].clone().multiply(rest0.quat[id.Hips].clone().invert());
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(hipDelta);
    fwd.y = 0;
    const yaw = Math.max(-0.35, Math.min(0.35, Math.atan2(fwd.x, fwd.z || 1)));
    const hipQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    quats.hips.push(hipQ.x, hipQ.y, hipQ.z, hipQ.w);
    parentQuat.hips = hipQ;
    const order = bones.map((b) => b[0]).filter((n) => n !== "hips");
    for (const name of order) {
      const spec = nameOf[name];
      const bone = byName[name];
      const parentName = bone.parent;
      const pq = parentQuat[parentName] || new THREE.Quaternion();
      let q = new THREE.Quaternion();
      if (spec && id[spec[0]] != null && spec[1] && id[spec[1]] != null) {
        const worldDir = s.pos[id[spec[1]]].clone().sub(s.pos[id[spec[0]]]).normalize();
        const localDir = worldDir.applyQuaternion(pq.clone().invert());
        if (localDir.lengthSq() > 0) {
          const dir = localDir.normalize();
          const upBone = bone.restDir.y > 0.5;
          const pitch = Math.atan2(dir.z, upBone ? dir.y : -dir.y);
          const side = Math.atan2(dir.x, upBone ? dir.y : -dir.y);
          const arm = name.endsWith("Arm") || name.includes("Fore") || name.includes("Hand");
          const limb = name.includes("Shin") || name.includes("Foot") || name.includes("Toe");
          const maxP = arm ? 0.32 : name.includes("Shin") ? 1.2 : limb ? 0.9 : upBone ? 0.22 : 0.7;
          const maxS = arm ? 0.06 : upBone ? 0.12 : limb ? 0.12 : 0.2;
          const pAng = Math.max(-maxP, Math.min(maxP, (upBone ? pitch : -pitch) * gain));
          const sAng = Math.max(-maxS, Math.min(maxS, side * gain));
          q.setFromEuler(new THREE.Euler(pAng, 0, sAng, "XYZ"));
        }
      }
      if (name.endsWith("Arm") || name.includes("Fore") || name.includes("Hand")) q.identity();
      quats[name].push(q.x, q.y, q.z, q.w);
      parentQuat[name] = pq.clone().multiply(q);
    }
  });
  times[times.length - 1] = Math.max(times[times.length - 1], times[0] + 0.05);
  return { times: Float32Array.from(times), quats, hipY: Float32Array.from(hipY) };
}

async function main() {
  const src = readGLB(inPath);
  const mesh = process.env.FULL === "1" ? rescaleOnly(src) : cluster(src);
  const { bones, byName } = fitBones(mesh.pos);
  const skin = skinWeights(mesh.pos, bones);
  const gain = { idle: 0.12, walk: 0.4, run: 0.36, kick: 0.5, pass: 0.46 };
  const clips = {};
  for (const [name, file] of Object.entries(BVH)) {
    const bvh = parseBVH(fs.readFileSync(file, "utf8"));
    const range = name === "kick" || name === "pass" ? kickRange(bvh) : name === "idle" ? { start: 0, length: Math.min(bvh.frames - 1, Math.round(2 / bvh.frameTime)) } : loopRange(bvh, "LeftFoot");
    clips[name] = retargetClip(bvh, range, bones, byName, gain[name] ?? 0.45);
    console.log(name, "frames", clips[name].times.length, "dur", clips[name].times.at(-1).toFixed(2));
  }

  const doc = new Document();
  const buffer = doc.createBuffer();
  const acc = (arr, type) => doc.createAccessor().setArray(arr).setType(type).setBuffer(buffer);
  const prim = doc
    .createPrimitive()
    .setAttribute("POSITION", acc(mesh.pos, "VEC3"))
    .setAttribute("NORMAL", acc(mesh.normals, "VEC3"))
    .setAttribute("TEXCOORD_0", acc(mesh.uv, "VEC2"))
    .setAttribute("JOINTS_0", acc(skin.joints, "VEC4"))
    .setAttribute("WEIGHTS_0", acc(skin.weights, "VEC4"))
    .setIndices(acc(mesh.idx, "SCALAR"));
  const colorTex = doc.createTexture().setImage(src.images[0].bytes).setMimeType(src.images[0].mime);
  const mrTex = src.images[1]
    ? doc.createTexture().setImage(src.images[1].bytes).setMimeType(src.images[1].mime)
    : null;
  const mat = doc.createMaterial().setRoughnessFactor(1).setMetallicFactor(mrTex ? 1 : 0).setBaseColorTexture(colorTex);
  if (mrTex) mat.setMetallicRoughnessTexture(mrTex);
  prim.setMaterial(mat);
  const meshNode = doc.createNode("body").setMesh(doc.createMesh().addPrimitive(prim));

  const nodes = {};
  for (const [name, parent, p] of bones) {
    const local = parent ? p.clone().sub(byName[parent].p) : p.clone();
    nodes[name] = doc.createNode(name).setTranslation([local.x, local.y, local.z]);
    if (parent) nodes[parent].addChild(nodes[name]);
  }
  const world = {};
  const worldOf = (name) => {
    if (world[name]) return world[name];
    const parent = byName[name].parent;
    const local = new THREE.Matrix4().makeTranslation(...nodes[name].getTranslation());
    world[name] = parent ? worldOf(parent).clone().multiply(local) : local;
    return world[name];
  };
  const ibm = new Float32Array(bones.length * 16);
  bones.forEach((b, i) => {
    const inv = worldOf(b[0]).clone().invert();
    ibm.set(inv.elements, i * 16);
  });
  const skinDef = doc.createSkin().setInverseBindMatrices(acc(ibm, "MAT4"));
  bones.forEach((b) => skinDef.addJoint(nodes[b[0]]));
  meshNode.setSkin(skinDef);

  for (const [clipName, clip] of Object.entries(clips)) {
    const anim = doc.createAnimation(clipName);
    const timeAcc = acc(clip.times, "SCALAR");
    for (const [name] of bones) {
      const out = acc(Float32Array.from(clip.quats[name]), "VEC4");
      const sampler = doc.createAnimationSampler().setInput(timeAcc).setOutput(out).setInterpolation("LINEAR");
      anim.addSampler(sampler);
      anim.addChannel(doc.createAnimationChannel().setTargetNode(nodes[name]).setTargetPath("rotation").setSampler(sampler));
    }
    const hipT = new Float32Array(clip.times.length * 3);
    const rest = nodes.hips.getTranslation();
    for (let i = 0; i < clip.times.length; i++) {
      hipT[i * 3] = rest[0];
      hipT[i * 3 + 1] = clip.hipY[i];
      hipT[i * 3 + 2] = rest[2];
    }
    const tSampler = doc.createAnimationSampler().setInput(timeAcc).setOutput(acc(hipT, "VEC3")).setInterpolation("LINEAR");
    anim.addSampler(tSampler);
    anim.addChannel(doc.createAnimationChannel().setTargetNode(nodes.hips).setTargetPath("translation").setSampler(tSampler));
  }

  const scene = doc.createScene();
  scene.addChild(nodes.hips);
  scene.addChild(meshNode);
  const io = new NodeIO();
  await io.write(outPath, doc);
  console.log("wrote", outPath, fs.statSync(outPath).size);
}

await main();
