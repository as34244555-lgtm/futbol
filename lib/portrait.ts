import { hash32 } from "./utils";

const SKIN = ["#f3d1b0", "#e0b184", "#c68642", "#8d5524", "#f8e0c8", "#a36d43"];
const HAIR = ["#1a120c", "#3b2314", "#6b3a1f", "#111111", "#4a3728", "#2c1810", "#c9a227"];
const SHIRT = ["#3dff8a", "#1d4ed8", "#be123c", "#0f766e", "#a16207", "#7c3aed", "#0369a1"];

export type FaceSeed = {
  skin: string;
  hair: string;
  shirt: string;
  beard: boolean;
  hairStyle: 0 | 1 | 2;
  hue: number;
};

export function faceSeed(id: string): FaceSeed {
  const h = hash32(id);
  return {
    skin: SKIN[h % SKIN.length]!,
    hair: HAIR[(h >> 3) % HAIR.length]!,
    shirt: SHIRT[(h >> 7) % SHIRT.length]!,
    beard: (h >> 11) % 5 === 0,
    hairStyle: ((h >> 13) % 3) as 0 | 1 | 2,
    hue: h % 360,
  };
}

export function crestSeed(name: string): { hue: number; motif: 0 | 1 | 2 | 3; letter: string } {
  const h = hash32(name);
  const letter = (name.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g, "").trim()[0] || "N").toUpperCase();
  return { hue: h % 360, motif: ((h >> 5) % 4) as 0 | 1 | 2 | 3, letter };
}
