import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

export const PLAYER_GLB_URL = "/models/player.glb";

const templates = new Map<string, THREE.Group>();
const pending = new Map<string, Promise<THREE.Group>>();
let slots: Set<number> | null = null;
let slotsPromise: Promise<Set<number>> | null = null;

function pad(slot: number) {
  return String(slot).padStart(2, "0");
}

function normalizeFigure(root: THREE.Group) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const height = Math.max(0.01, size.y);
  root.scale.multiplyScalar(1.78 / height);
  root.updateMatrixWorld(true);
  const box2 = new THREE.Box3().setFromObject(root);
  root.position.y -= box2.min.y;
  root.updateMatrixWorld(true);
}

function prepareScene(scene: THREE.Group, clips: THREE.AnimationClip[]) {
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      const std = mat as THREE.MeshStandardMaterial;
      if (!std) continue;
      std.side = THREE.FrontSide;
      std.envMapIntensity = 1.1;
    }
  });
  const group = new THREE.Group();
  group.name = "playerGlbTemplate";
  group.userData.clips = clips;
  group.add(scene);
  normalizeFigure(group);
  return group;
}

function loadUrl(url: string): Promise<THREE.Group> {
  const cached = templates.get(url);
  if (cached) return Promise.resolve(cached);
  let task = pending.get(url);
  if (!task) {
    task = new Promise((resolve, reject) => {
      new GLTFLoader().load(
        url,
        (gltf) => {
          const group = prepareScene(gltf.scene, gltf.animations);
          templates.set(url, group);
          pending.delete(url);
          resolve(group);
        },
        undefined,
        (err) => {
          pending.delete(url);
          reject(err);
        },
      );
    });
    pending.set(url, task);
  }
  return task;
}

/** Which p00–p23 files exist. Missing slots use the shared Drive model. */
export function loadModelIndex(): Promise<Set<number>> {
  if (slots) return Promise.resolve(slots);
  if (!slotsPromise) {
    slotsPromise = fetch("/api/models", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { slots?: number[] }) => {
        slots = new Set(json.slots ?? []);
        return slots;
      })
      .catch(() => {
        slots = new Set();
        return slots;
      });
  }
  return slotsPromise;
}

function urlForSlot(slot?: number) {
  if (slot != null && slots?.has(slot)) return `/models/p${pad(slot)}.glb`;
  return PLAYER_GLB_URL;
}

export function loadPlayerGlb(): Promise<THREE.Group> {
  return loadUrl(PLAYER_GLB_URL);
}

/** Shared-geometry clone. Optional slot uses /models/pXX.glb when that file exists. */
export function clonePlayerGlb(slot?: number): THREE.Group {
  const holder = new THREE.Group();
  holder.name = "playerGlb";
  holder.userData.glb = true;
  const mount = (tpl: THREE.Group) => {
    const clips = tpl.userData.clips as THREE.AnimationClip[] | undefined;
    const copy = clips?.length ? cloneSkeleton(tpl) : tpl.clone(true);
    holder.add(copy);
    if (clips?.length) {
      holder.userData.mixer = new THREE.AnimationMixer(copy);
      holder.userData.clips = clips;
    }
  };
  const loadInto = (url: string) => {
    const cached = templates.get(url);
    if (cached) {
      if (holder.children.length === 0) mount(cached);
      return;
    }
    void loadUrl(url)
      .catch(() => loadUrl(PLAYER_GLB_URL))
      .then((tpl) => {
        if (holder.children.length === 0) mount(tpl);
      })
      .catch(() => undefined);
  };
  if (slots) loadInto(urlForSlot(slot));
  else {
    void loadModelIndex().then(() => {
      if (holder.children.length === 0) loadInto(urlForSlot(slot));
    });
  }
  return holder;
}
