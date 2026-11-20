import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export const PLAYER_GLB_URL = "/models/player.glb";

let template: THREE.Group | null = null;
let pending: Promise<THREE.Group> | null = null;

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

export function loadPlayerGlb(): Promise<THREE.Group> {
  if (template) return Promise.resolve(template);
  if (!pending) {
    pending = new Promise((resolve, reject) => {
      new GLTFLoader().load(
        PLAYER_GLB_URL,
        (gltf) => {
          const scene = gltf.scene;
          scene.traverse((obj) => {
            const mesh = obj as THREE.Mesh;
            if (mesh.isMesh) {
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (mat) {
                mat.side = THREE.FrontSide;
                mat.envMapIntensity = 1.1;
              }
            }
          });
          const group = new THREE.Group();
          group.name = "playerGlbTemplate";
          group.add(scene);
          normalizeFigure(group);
          template = group;
          resolve(group);
        },
        undefined,
        (err) => {
          pending = null;
          reject(err);
        },
      );
    });
  }
  return pending;
}

/** Shared-geometry clone of the Drive GLB, standing on y = 0 at ~1.78 m. */
export function clonePlayerGlb(): THREE.Group {
  const holder = new THREE.Group();
  holder.name = "playerGlb";
  holder.userData.glb = true;
  if (template) {
    holder.add(template.clone(true));
    return holder;
  }
  void loadPlayerGlb().then((tpl) => {
    holder.add(tpl.clone(true));
  });
  return holder;
}
