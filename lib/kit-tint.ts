import * as THREE from "three";
import type { KitStyle } from "./types";

export type KitTint = {
  kit: string;
  kitSecondary?: string;
  kitStyle?: KitStyle;
  gk?: boolean;
};

const STYLE: Record<KitStyle, number> = {
  solid: 0,
  stripes: 1,
  hoops: 2,
  sash: 3,
};

/** Recolors the baked grey shirt and shorts. Skin, socks, boots and hair stay. */
export function applyKitTint(root: THREE.Object3D, tint: KitTint) {
  const primary = new THREE.Color(tint.gk ? tint.kitSecondary || "#f4f7fb" : tint.kit);
  const secondary = new THREE.Color(tint.gk ? tint.kit : tint.kitSecondary || "#f4f4f5");
  const style = STYLE[tint.kitStyle ?? "solid"] ?? 0;
  const key = `${primary.getHexString()}-${secondary.getHexString()}-${style}`;

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const sources = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const next = sources.map((source) => {
      const mat = (source as THREE.MeshStandardMaterial).clone();
      mat.customProgramCacheKey = () => `kit-${key}`;
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uKitA = { value: primary };
        shader.uniforms.uKitB = { value: secondary };
        shader.uniforms.uKitStyle = { value: style };
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vKitWorld;")
          .replace("#include <project_vertex>", "#include <project_vertex>\nvKitWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            "#include <common>\nuniform vec3 uKitA;\nuniform vec3 uKitB;\nuniform float uKitStyle;\nvarying vec3 vKitWorld;",
          )
          .replace(
            "#include <map_fragment>",
            `#include <map_fragment>
            {
              vec3 src = diffuseColor.rgb;
              float mx = max(src.r, max(src.g, src.b));
              float mn = min(src.r, min(src.g, src.b));
              float sat = mx - mn;
              float luma = dot(src, vec3(0.299, 0.587, 0.114));
              float warm = src.r - src.b;
              float inKit = step(0.58, vKitWorld.y) * step(vKitWorld.y, 1.52);
              float cloth = step(sat, 0.30) * step(0.08, luma) * step(luma, 0.82);
              float skin = step(0.07, warm) * step(src.g, src.r);
              cloth *= (1.0 - skin) * inKit;
              float shade = clamp(luma / 0.46, 0.38, 1.25);
              float band = 0.0;
              if (uKitStyle > 0.5 && uKitStyle < 1.5) band = step(0.5, fract(vKitWorld.x * 8.0));
              else if (uKitStyle < 2.5 && uKitStyle > 1.5) band = step(0.5, fract(vKitWorld.y * 7.0));
              else if (uKitStyle > 2.5) band = step(0.5, fract((vKitWorld.x + vKitWorld.y) * 4.5));
              vec3 dyed = mix(uKitA, uKitB, band) * shade;
              diffuseColor.rgb = mix(src, dyed, cloth);
            }`,
          );
      };
      mat.needsUpdate = true;
      return mat;
    });
    mesh.material = Array.isArray(mesh.material) ? next : next[0]!;
  });
}
