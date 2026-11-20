import * as THREE from "three";
import type { StadiumPrefs } from "./types";

const PITCH_W = 68;
const PITCH_L = 105;

export function pitchToWorld(x: number, y: number): { x: number; z: number } {
  return {
    x: ((y - 50) / 100) * PITCH_W,
    z: ((x - 50) / 100) * PITCH_L,
  };
}

function skyColor(sky: StadiumPrefs["sky"]): number {
  if (sky === "day") return 0x8ec8f5;
  if (sky === "sunset") return 0xe07a3a;
  return 0x1a2744;
}

function fogColor(sky: StadiumPrefs["sky"]): number {
  if (sky === "day") return 0xc5e4f8;
  if (sky === "sunset") return 0xe09058;
  return 0x243456;
}

export function applyStadiumLights(scene: THREE.Scene, prefs: StadiumPrefs) {
  const night = prefs.sky === "night";
  scene.background = new THREE.Color(skyColor(prefs.sky));
  scene.fog = new THREE.Fog(fogColor(prefs.sky), night ? 70 : 120, night ? 220 : 280);

  const hemi = new THREE.HemisphereLight(
    night ? 0xb9c8ee : prefs.sky === "sunset" ? 0xffc090 : 0xf4fbff,
    night ? 0x3d5a32 : 0x6aaf62,
    night ? 0.85 : 1.35,
  );
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(
    night ? 0xe8f0ff : prefs.sky === "sunset" ? 0xffb060 : 0xfff6df,
    night ? 1.15 : 2.6,
  );
  sun.position.set(prefs.sky === "sunset" ? -36 : 24, 52, 16);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -70;
  sun.shadow.camera.right = 70;
  sun.shadow.camera.top = 70;
  sun.shadow.camera.bottom = -70;
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(night ? 0x9eb4ff : 0xd7ecff, night ? 0.55 : 0.7);
  fill.position.set(-22, 18, -14);
  scene.add(fill);

  const flood = prefs.lights ?? "led";
  if (night && flood !== "off") {
    const hue = flood === "warm" ? 0xffe0b0 : 0xf7fbff;
    for (const [x, z] of [
      [-38, -55],
      [38, -55],
      [-38, 55],
      [38, 55],
    ] as const) {
      const spot = new THREE.SpotLight(hue, 80, 140, 0.7, 0.45, 1);
      spot.position.set(x, 32, z);
      spot.target.position.set(0, 0, 0);
      scene.add(spot);
      scene.add(spot.target);
    }
  }
}

function flat(w: number, d: number, x: number, z: number, mat: THREE.Material, y = 0.04) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  return mesh;
}

function skyDome(top: number, horizon: number) {
  const geo = new THREE.SphereGeometry(170, 28, 16);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const a = new THREE.Color(horizon);
  const b = new THREE.Color(top);
  const mix = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = THREE.MathUtils.clamp((pos.getY(i) + 30) / 150, 0, 1);
    mix.copy(a).lerp(b, t);
    colors[i * 3] = mix.r;
    colors[i * 3 + 1] = mix.g;
    colors[i * 3 + 2] = mix.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false }));
}

function grandstand(span: number, rows: number, color: number) {
  const g = new THREE.Group();
  const depth = 3 + rows * 0.82;
  const concrete = new THREE.MeshStandardMaterial({ color: 0xd5dbe2, roughness: 0.82 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(span, 1.15, depth), concrete);
  base.position.set(0, 0.55, depth / 2);
  base.castShadow = true;
  base.receiveShadow = true;
  g.add(base);
  const seat = new THREE.MeshStandardMaterial({ color, roughness: 0.62 });
  for (let r = 0; r < rows; r++) {
    const row = new THREE.Mesh(new THREE.BoxGeometry(span - 0.6, 0.36, 0.58), seat);
    row.position.set(0, 1.28 + r * 0.42, 0.7 + r * 0.78);
    row.receiveShadow = true;
    g.add(row);
  }
  const fascia = new THREE.Mesh(
    new THREE.BoxGeometry(span, 2.4, 0.35),
    new THREE.MeshStandardMaterial({ color: 0x2a313b, roughness: 0.55 }),
  );
  fascia.position.set(0, 2.4, depth);
  g.add(fascia);
  return g;
}

export function createStadium(prefs: StadiumPrefs): THREE.Group {
  const root = new THREE.Group();
  const night = prefs.sky === "night";
  root.add(skyDome(night ? 0x24365c : prefs.sky === "sunset" ? 0xf08a48 : 0x4aa4ee, night ? 0x8aa0c8 : 0xd7f0ff));

  const apron = flat(150, 190, 0, 0, new THREE.MeshStandardMaterial({ color: 0x8d9a78, roughness: 1 }), -0.02);
  root.add(apron);

  const pitch = prefs.pitch ?? "lush";
  const grassA = pitch === "dry" ? 0xb5b85a : pitch === "worn" ? 0x6a9a48 : 0x3cba55;
  const grassB = pitch === "dry" ? 0xa3a64e : pitch === "worn" ? 0x5c8a3e : 0x2fa348;
  const stripe = 4.25;
  for (let x = -PITCH_W / 2; x < PITCH_W / 2 - 0.01; x += stripe) {
    const w = Math.min(stripe, PITCH_W / 2 - x);
    const alt = Math.round((x + PITCH_W / 2) / stripe) % 2 === 0;
    root.add(
      flat(
        w,
        PITCH_L,
        x + w / 2,
        0,
        new THREE.MeshStandardMaterial({ color: alt ? grassA : grassB, roughness: 0.9 }),
        0.01,
      ),
    );
  }

  const lineMat = new THREE.MeshBasicMaterial({ color: 0xf7f7f2 });
  const lw = 0.14;
  const halfL = PITCH_L / 2;
  const halfW = PITCH_W / 2;
  root.add(flat(PITCH_W, lw, 0, halfL - lw / 2, lineMat));
  root.add(flat(PITCH_W, lw, 0, -halfL + lw / 2, lineMat));
  root.add(flat(lw, PITCH_L, halfW - lw / 2, 0, lineMat));
  root.add(flat(lw, PITCH_L, -halfW + lw / 2, 0, lineMat));
  root.add(flat(PITCH_W, lw, 0, 0, lineMat));
  const ring = new THREE.Mesh(new THREE.RingGeometry(9.05, 9.15, 64), lineMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.045;
  root.add(ring);
  const spot = new THREE.Mesh(new THREE.CircleGeometry(0.18, 16), lineMat);
  spot.rotation.x = -Math.PI / 2;
  spot.position.y = 0.046;
  root.add(spot);

  const boxW = 40.32;
  const boxD = 16.5;
  const sixW = 18.32;
  const sixD = 5.5;
  for (const sign of [1, -1] as const) {
    const gz = sign * (halfL - boxD / 2);
    root.add(flat(boxW, lw, 0, sign * (halfL - boxD), lineMat));
    root.add(flat(lw, boxD, boxW / 2, gz, lineMat));
    root.add(flat(lw, boxD, -boxW / 2, gz, lineMat));
    const sz = sign * (halfL - sixD / 2);
    root.add(flat(sixW, lw, 0, sign * (halfL - sixD), lineMat));
    root.add(flat(lw, sixD, sixW / 2, sz, lineMat));
    root.add(flat(lw, sixD, -sixW / 2, sz, lineMat));
    const pen = spot.clone();
    pen.position.set(0, 0.046, sign * (halfL - 11));
    root.add(pen);
  }

  const goalMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f4, metalness: 0.25, roughness: 0.35 });
  const netMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28, side: THREE.DoubleSide });
  for (const z of [-halfL, halfL] as const) {
    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.44, 10), goalMat);
    postL.position.set(-3.66, 1.22, z);
    const postR = postL.clone();
    postR.position.x = 3.66;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 7.32, 10), goalMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 2.44, z);
    const net = new THREE.Mesh(new THREE.PlaneGeometry(7.32, 2.44), netMat);
    net.position.set(0, 1.22, z + (z > 0 ? 0.8 : -0.8));
    root.add(postL, postR, bar, net);
  }

  const boardMat = [
    new THREE.MeshStandardMaterial({ color: 0xf4f7fb, roughness: 0.4 }),
    new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.45 }),
    new THREE.MeshStandardMaterial({ color: 0xe7c56a, roughness: 0.4 }),
  ];
  const board = (len: number, x: number, z: number, rot: number) => {
    const g = new THREE.Group();
    const panels = 8;
    for (let i = 0; i < panels; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(len / panels - 0.08, 0.9, 0.12), boardMat[i % 3]);
      p.position.x = -len / 2 + (i + 0.5) * (len / panels);
      g.add(p);
    }
    g.position.set(x, 0.55, z);
    g.rotation.y = rot;
    root.add(g);
  };
  board(96, 0, halfL + 1.6, 0);
  board(96, 0, -halfL - 1.6, 0);
  board(96, halfW + 1.8, 0, Math.PI / 2);
  board(96, -halfW - 1.8, 0, Math.PI / 2);

  const seat = prefs.seats ?? "mixed";
  const sideColor =
    seat === "blue" ? 0x2563eb : seat === "gold" ? 0xd4a017 : seat === "green" ? 0x15803d : 0xd7263d;
  const endColor = seat === "red" ? 0x991b1b : seat === "blue" ? 0x1e3a8a : 0x1e3a5f;
  const rows = prefs.crowd === "low" ? 6 : 11;
  const long = grandstand(108, rows, sideColor);
  long.position.set(halfW + 8, 0, 0);
  long.rotation.y = Math.PI / 2;
  const long2 = grandstand(108, rows, sideColor);
  long2.position.set(-halfW - 8, 0, 0);
  long2.rotation.y = -Math.PI / 2;
  const end = grandstand(72, rows, endColor);
  end.position.set(0, 0, halfL + 8);
  const end2 = grandstand(72, rows, endColor);
  end2.position.set(0, 0, -halfL - 8);
  end2.rotation.y = Math.PI;
  root.add(long, long2, end, end2);

  const towerMat = new THREE.MeshStandardMaterial({ color: 0x889099, metalness: 0.6, roughness: 0.3 });
  const floodOn = (prefs.lights ?? "led") !== "off" && prefs.sky === "night";
  const lampHex = (prefs.lights ?? "led") === "warm" ? 0xffd89a : 0xe8f4ff;
  for (const [x, z] of [
    [-48, -62],
    [48, -62],
    [-48, 62],
    [48, 62],
  ] as const) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 26, 8), towerMat);
    pole.position.set(x, 13, z);
    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.6, 1.4),
      new THREE.MeshStandardMaterial({
        color: floodOn ? lampHex : 0xdddddd,
        emissive: floodOn ? lampHex : 0x000000,
        emissiveIntensity: floodOn ? 2.2 : 0,
      }),
    );
    lamp.position.set(x, 26, z);
    lamp.lookAt(0, 8, 0);
    root.add(pole, lamp);
  }

  const roof = prefs.roof ?? "open";
  if (roof !== "open") {
    const cover = new THREE.Mesh(
      new THREE.TorusGeometry(52, roof === "closed" ? 14 : 7, 8, 48, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x1a222b, metalness: 0.35, roughness: 0.45, side: THREE.DoubleSide }),
    );
    cover.rotation.x = Math.PI / 2;
    cover.position.y = roof === "closed" ? 22 : 18;
    root.add(cover);
  }

  return root;
}

export function createRain(count = 900): THREE.Points {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 90;
    pos[i * 3 + 1] = Math.random() * 28;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 130;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xa8c4e0, size: 0.12, transparent: true, opacity: 0.65 });
  const pts = new THREE.Points(geo, mat);
  pts.name = "rain";
  return pts;
}

export function tickRain(pts: THREE.Points, dt: number) {
  const attr = pts.geometry.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < attr.count; i++) {
    let y = attr.getY(i) - dt * 22;
    if (y < 0) y = 26;
    attr.setY(i, y);
  }
  attr.needsUpdate = true;
}

export function cameraFor(prefs: StadiumPrefs, camera: THREE.PerspectiveCamera) {
  if (prefs.camera === "tactical") {
    camera.position.set(0, 78, 0.01);
    camera.lookAt(0, 0, 0);
    camera.fov = 50;
  } else if (prefs.camera === "sideline") {
    camera.position.set(48, 12, 8);
    camera.lookAt(0, 1, 0);
    camera.fov = 40;
  } else {
    camera.position.set(22, 18, 48);
    camera.lookAt(0, 1.2, 0);
    camera.fov = 38;
  }
  camera.updateProjectionMatrix();
}
