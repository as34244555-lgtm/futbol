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
  if (sky === "day") return 0x87b8e8;
  if (sky === "sunset") return 0xc45a32;
  return 0x061018;
}

function fogColor(sky: StadiumPrefs["sky"]): number {
  if (sky === "day") return 0xb8d4ea;
  if (sky === "sunset") return 0xd47848;
  return 0x0a1520;
}

export function applyStadiumLights(scene: THREE.Scene, prefs: StadiumPrefs) {
  scene.background = new THREE.Color(skyColor(prefs.sky));
  scene.fog = new THREE.Fog(fogColor(prefs.sky), 40, prefs.sky === "night" ? 160 : 220);

  const hemi = new THREE.HemisphereLight(
    prefs.sky === "night" ? 0x8899bb : prefs.sky === "sunset" ? 0xffc080 : 0xdeeeff,
    prefs.sky === "night" ? 0x112211 : 0x3a5a32,
    prefs.sky === "night" ? 0.45 : 0.85,
  );
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(
    prefs.sky === "night" ? 0xc8d8ff : prefs.sky === "sunset" ? 0xffaa55 : 0xfff4d2,
    prefs.sky === "night" ? 0.55 : 1.15,
  );
  sun.position.set(prefs.sky === "sunset" ? -40 : 28, 46, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  scene.add(sun);

  if (prefs.sky === "night") {
    for (const [x, z] of [
      [-38, -55],
      [38, -55],
      [-38, 55],
      [38, 55],
    ] as const) {
      const spot = new THREE.SpotLight(0xfff2c8, 38, 120, 0.55, 0.4, 1.1);
      spot.position.set(x, 28, z);
      spot.target.position.set(0, 0, 0);
      scene.add(spot);
      scene.add(spot.target);
    }
  }
}

export function createStadium(prefs: StadiumPrefs): THREE.Group {
  const root = new THREE.Group();

  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(PITCH_W, PITCH_L),
    new THREE.MeshStandardMaterial({ color: 0x147a36, roughness: 0.85 }),
  );
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  root.add(grass);

  const stripeMat = new THREE.MeshStandardMaterial({ color: 0x116f32, roughness: 0.85 });
  for (let i = -5; i <= 5; i += 2) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(PITCH_W, 4.8), stripeMat);
    s.rotation.x = -Math.PI / 2;
    s.position.set(0, 0.01, i * 4.8);
    s.receiveShadow = true;
    root.add(s);
  }

  const lineMat = new THREE.MeshBasicMaterial({ color: 0xf2f6f2 });
  const ring = new THREE.Mesh(new THREE.RingGeometry(8.9, 9.15, 48), lineMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  root.add(ring);
  const mid = new THREE.Mesh(new THREE.PlaneGeometry(0.18, PITCH_W), lineMat);
  mid.rotation.x = -Math.PI / 2;
  mid.rotation.z = Math.PI / 2;
  mid.position.y = 0.02;
  root.add(mid);

  const box = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(PITCH_W - 2, 0.02, PITCH_L - 2)),
    new THREE.LineBasicMaterial({ color: 0xffffff }),
  );
  box.position.y = 0.03;
  root.add(box);

  const goalMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.4, roughness: 0.3 });
  for (const z of [-PITCH_L / 2 + 1.2, PITCH_L / 2 - 1.2]) {
    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8), goalMat);
    postL.position.set(-3.66, 1.2, z);
    const postR = postL.clone();
    postR.position.x = 3.66;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 7.4, 8), goalMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 2.4, z);
    root.add(postL, postR, bar);
  }

  const seatColors = [0xc0392b, 0x1f3a93, 0xf4d03f, 0x1e8449];
  const rows = prefs.crowd === "full" ? 8 : 4;
  const dens = prefs.crowd === "full" ? 1 : 0.4;
  const dummy = new THREE.Object3D();
  const geo = new THREE.BoxGeometry(1.35, 0.62, 1.05);
  const mats = seatColors.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }));
  const packed: THREE.Vector3[][] = seatColors.map(() => []);
  for (let r = 0; r < rows; r++) {
    const radius = 42 + r * 3.5;
    const count = Math.round((28 + r * 7) * dens);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      if (Math.abs(Math.cos(a)) < 0.1 && Math.abs(Math.sin(a)) > 0.72) continue;
      packed[(i + r) % seatColors.length]!.push(
        new THREE.Vector3(Math.cos(a) * radius, 2.1 + r * 1.12, Math.sin(a) * (radius * 1.18)),
      );
    }
  }
  packed.forEach((pts, idx) => {
    if (!pts.length) return;
    const inst = new THREE.InstancedMesh(geo, mats[idx], pts.length);
    pts.forEach((p, i) => {
      dummy.position.copy(p);
      dummy.lookAt(0, 1, 0);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    });
    inst.instanceMatrix.needsUpdate = true;
    root.add(inst);
  });

  const towerMat = new THREE.MeshStandardMaterial({ color: 0x889099, metalness: 0.6, roughness: 0.3 });
  for (const [x, z] of [
    [-36, -52],
    [36, -52],
    [-36, 52],
    [36, 52],
  ] as const) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 26, 8), towerMat);
    pole.position.set(x, 13, z);
    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.6, 1.4),
      new THREE.MeshStandardMaterial({
        color: prefs.sky === "night" ? 0xfff4c2 : 0xdddddd,
        emissive: prefs.sky === "night" ? 0xffe9a0 : 0x000000,
        emissiveIntensity: prefs.sky === "night" ? 2.2 : 0,
      }),
    );
    lamp.position.set(x, 26, z);
    lamp.lookAt(0, 8, 0);
    root.add(pole, lamp);
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
