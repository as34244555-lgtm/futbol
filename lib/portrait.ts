import { hash32 } from "./utils";

const SKIN = ["#f6d5b8", "#e8be96", "#d1a074", "#c68642", "#8d5524", "#f3c7a3", "#a36d43", "#6b3c22"];
const HAIR = ["#1a120c", "#2b1810", "#3b2314", "#5c3317", "#111111", "#4a3728", "#6b4a2b", "#c9a227", "#3d2b1f"];
const EYE = ["#3b2314", "#2a1a10", "#1d4e3a", "#355c7d", "#4a3728"];
const SHIRT = ["#1d4ed8", "#be123c", "#0f766e", "#15803d", "#a16207", "#7c3aed", "#0369a1", "#111827"];

export type FaceSeed = {
  skin: string;
  hair: string;
  shirt: string;
  eye: string;
  beard: 0 | 1 | 2;
  hairStyle: 0 | 1 | 2 | 3 | 4 | 5;
  faceW: number;
  brow: number;
  nose: number;
  hue: number;
};

export function faceSeed(id: string): FaceSeed {
  const h = hash32(id);
  return {
    skin: SKIN[h % SKIN.length]!,
    hair: HAIR[(h >> 3) % HAIR.length]!,
    shirt: SHIRT[(h >> 7) % SHIRT.length]!,
    eye: EYE[(h >> 9) % EYE.length]!,
    beard: ((h >> 11) % 6 === 0 ? 2 : (h >> 11) % 4 === 0 ? 1 : 0) as 0 | 1 | 2,
    hairStyle: ((h >> 13) % 6) as 0 | 1 | 2 | 3 | 4 | 5,
    faceW: 0.92 + ((h >> 17) % 18) / 100,
    brow: 0.7 + ((h >> 19) % 8) / 20,
    nose: 0.85 + ((h >> 21) % 12) / 40,
    hue: h % 360,
  };
}

export function svgSafeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || "face";
}

export function shade(hex: string, amt: number): string {
  if (!hex) hex = "#000000";
  const n = hex.replace("#", "");
  const num = parseInt(n.length === 3 ? n.split("").map((c) => c + c).join("") : n, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function crestSeed(name: string): { hue: number; motif: 0 | 1 | 2 | 3; letter: string } {
  const h = hash32(name);
  const letter = (name.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g, "").trim()[0] || "N").toUpperCase();
  return { hue: h % 360, motif: ((h >> 5) % 4) as 0 | 1 | 2 | 3, letter };
}
