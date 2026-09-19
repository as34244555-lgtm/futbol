import { hash32 } from "./utils";

export const PHOTO_COUNT = 24;
/** Bump when the portrait files change so next/image and browsers drop stale busts. */
export const PHOTO_VER = "ef3d";

const ALL = Array.from({ length: PHOTO_COUNT }, (_, i) => i);

const OLDER = new Set([7, 13, 16, 20, 23]);

/** Nation → portrait indices (photoreal busts in /public/portraits). */
const NATION_POOL: Record<string, number[]> = {
  tr: [0, 5, 16, 12, 20],
  br: [1, 15, 22, 9, 6],
  de: [3, 7, 14, 23, 21, 8],
  ar: [6, 22, 1, 12, 15],
  fr: [17, 15, 3, 7, 19],
  es: [12, 20, 6, 0, 16],
  pt: [20, 6, 12, 1, 22],
  nl: [3, 21, 7, 14, 8],
  it: [12, 20, 0, 16, 6],
  "gb-eng": [7, 8, 3, 14, 23],
  ng: [2, 9, 13, 19],
  sn: [2, 9, 13, 19],
  jp: [4, 11],
  kr: [11, 4],
  hr: [18, 14, 3, 21],
  be: [3, 17, 14, 21, 8],
  co: [22, 6, 1, 15],
  uy: [6, 22, 12, 15],
};

export function photoPortrait(player: {
  id: string;
  portrait?: string;
  nationality_code?: string;
  age?: number;
}): string {
  if (player.portrait) return player.portrait;
  let pool = NATION_POOL[player.nationality_code ?? ""] ?? ALL;
  if ((player.age ?? 24) >= 31) {
    const older = pool.filter((i) => OLDER.has(i));
    if (older.length) pool = older;
  }
  const i = pool[hash32(player.id) % pool.length]!;
  return `/portraits/p${String(i).padStart(2, "0")}.webp?v=${PHOTO_VER}`;
}

/** Full-body photoreal figure used on the pitch and in 3D inspect. */
export function photoBody(player: {
  id: string;
  portrait?: string;
  nationality_code?: string;
  age?: number;
}): string {
  if (player.portrait?.includes("abdullah")) return `/bodies/abdullah.webp?v=${PHOTO_VER}`;
  const bust = photoPortrait({ ...player, portrait: undefined });
  const m = bust.match(/p(\d{2})/);
  return `/bodies/b${m?.[1] ?? "00"}.webp?v=${PHOTO_VER}`;
}
