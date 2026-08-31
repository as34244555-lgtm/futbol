import { catalogId, pick, seededRandom } from "./utils";
import { NATIONS } from "./nations";
import type { Player, Position } from "./types";

export const ABDULLAH_ID = "00000000-0000-4000-8000-aaa999000001";

export function makeAbdullah(): Player {
  return {
    id: ABDULLAH_ID,
    name: "Abdullah Sarıyıldız",
    nationality: "Türkiye",
    nationality_code: "tr",
    position: "FV",
    age: 27,
    attack: 99,
    defense: 99,
    pace: 99,
    finishing: 99,
    passing: 99,
    marking: 99,
    handling: 99,
    overall: 999,
    base_value: 100_000,
    versatile: true,
    legend: true,
    portrait: "/abdullah-sariyildiz.webp",
  };
}

export function isLegend(p: Pick<Player, "id" | "name" | "legend">): boolean {
  return p.id === ABDULLAH_ID || Boolean(p.legend) || p.name === "Abdullah Sarıyıldız";
}

export function playsPosition(p: Player, position: Position): boolean {
  return Boolean(p.versatile) || p.position === position;
}

/** Simülasyon 0–99 bekler; 999 ekranda kalır. */
export function simOverall(p: { overall: number }): number {
  return Math.min(99, p.overall);
}

const STAR_PLAYERS: Array<Omit<Player, "id" | "overall" | "base_value"> & { overall?: number }> = [
  { name: "Erlung Haland", nationality: "Almanya", nationality_code: "de", position: "FV", age: 24, attack: 94, defense: 48 },
  { name: "Lucas Silva", nationality: "Brezilya", nationality_code: "br", position: "OS", age: 27, attack: 88, defense: 76 },
  { name: "Miko Vartan", nationality: "Türkiye", nationality_code: "tr", position: "OS", age: 23, attack: 86, defense: 71 },
  { name: "Nelo Prest", nationality: "Fransa", nationality_code: "fr", position: "FV", age: 26, attack: 91, defense: 42 },
  { name: "Sabri Koçhan", nationality: "Türkiye", nationality_code: "tr", position: "DEF", age: 29, attack: 62, defense: 90 },
  { name: "Yuto Hanari", nationality: "Japonya", nationality_code: "jp", position: "OS", age: 22, attack: 84, defense: 73 },
  { name: "Kaan Altuner", nationality: "Türkiye", nationality_code: "tr", position: "KL", age: 31, attack: 28, defense: 89 },
  { name: "Rafa Moreira", nationality: "Portekiz", nationality_code: "pt", position: "FV", age: 25, attack: 89, defense: 51 },
  { name: "Luka Peric", nationality: "Hırvatistan", nationality_code: "hr", position: "OS", age: 28, attack: 82, defense: 84 },
  { name: "Iker Navarro", nationality: "İspanya", nationality_code: "es", position: "DEF", age: 27, attack: 58, defense: 88 },
];

export function computeOverall(position: Position, attack: number, defense: number): number {
  const mix =
    position === "KL"
      ? defense * 0.88 + attack * 0.12
      : position === "DEF"
        ? defense * 0.72 + attack * 0.28
        : position === "OS"
          ? attack * 0.52 + defense * 0.48
          : attack * 0.82 + defense * 0.18;
  return Math.max(1, Math.min(99, Math.round(mix)));
}

export function computeBaseValue(overall: number, age: number, position: Position): number {
  const posMul = position === "FV" ? 1.15 : position === "OS" ? 1.08 : position === "KL" ? 0.92 : 1;
  const ageMul = age <= 21 ? 1.25 : age <= 24 ? 1.15 : age <= 28 ? 1 : age <= 32 ? 0.78 : 0.55;
  const curve = Math.pow(overall / 70, 3.2);
  return Math.max(200, Math.round(850 * curve * posMul * ageMul));
}

function statFor(rand: () => number, band: "star" | "good" | "avg" | "youth", position: Position): { attack: number; defense: number } {
  const bands = {
    star: [82, 94],
    good: [72, 84],
    avg: [62, 75],
    youth: [55, 70],
  } as const;
  const [lo, hi] = bands[band];
  const primary = Math.round(lo + rand() * (hi - lo));
  const secondary = Math.round(lo - 18 + rand() * (hi - lo - 6));
  if (position === "KL") return { attack: Math.max(15, secondary - 20), defense: primary };
  if (position === "DEF") return { attack: Math.max(30, secondary), defense: primary };
  if (position === "FV") return { attack: primary, defense: Math.max(28, secondary) };
  return { attack: primary, defense: Math.max(40, secondary + 4) };
}

export function generateCatalog(count = 240): Player[] {
  const rand = seededRandom(20260828);
  const players: Player[] = [];

  players.push(makeAbdullah());

  STAR_PLAYERS.forEach((p, i) => {
    const overall = p.overall ?? computeOverall(p.position, p.attack, p.defense);
    players.push({
      id: catalogId(i + 1),
      name: p.name,
      nationality: p.nationality,
      nationality_code: p.nationality_code,
      position: p.position,
      age: p.age,
      attack: p.attack,
      defense: p.defense,
      overall,
      base_value: computeBaseValue(overall, p.age, p.position),
    });
  });

  const positions: Position[] = [
    ...Array(42).fill("KL"),
    ...Array(74).fill("DEF"),
    ...Array(70).fill("OS"),
    ...Array(54).fill("FV"),
  ];

  for (let i = STAR_PLAYERS.length; i < count; i++) {
    const nation = NATIONS[i % NATIONS.length]!;
    const position = positions[(i - STAR_PLAYERS.length) % positions.length]!;
    const roll = rand();
    const band = roll > 0.92 ? "star" : roll > 0.62 ? "good" : roll > 0.28 ? "avg" : "youth";
    const { attack, defense } = statFor(rand, band, position);
    const overall = computeOverall(position, attack, defense);
    const age =
      band === "youth"
        ? 17 + Math.floor(rand() * 4)
        : band === "star"
          ? 22 + Math.floor(rand() * 8)
          : 19 + Math.floor(rand() * 16);
    const first = pick(rand, nation.first);
    const last = pick(rand, nation.last);
    players.push({
      id: catalogId(i + 1),
      name: `${first} ${last}`,
      nationality: nation.name,
      nationality_code: nation.code,
      position,
      age,
      attack: Math.max(1, Math.min(99, attack)),
      defense: Math.max(1, Math.min(99, defense)),
      overall,
      base_value: computeBaseValue(overall, age, position),
    });
  }

  return players;
}

export function generateExtraPlayers(count: number, startIndex = 2000): Player[] {
  const sample = generateCatalog(Math.max(50, count + 12))
    .filter((p) => !isLegend(p))
    .slice(10, 10 + count);
  return sample.map((p, i) => ({ ...p, id: catalogId(startIndex + i + 1) }));
}

export const AI_CLUBS: Array<{
  name: string;
  kit_primary: string;
  kit_secondary: string;
  strength: number;
  manager: string;
}> = [
  { name: "Bosphorus FC", kit_primary: "#1d4ed8", kit_secondary: "#f8fafc", strength: 0.92, manager: "Bot Kaya" },
  { name: "Anatolia United", kit_primary: "#b45309", kit_secondary: "#111827", strength: 0.88, manager: "Bot Deniz" },
  { name: "Karadeniz Storm", kit_primary: "#0f766e", kit_secondary: "#ecfeff", strength: 0.84, manager: "Bot Yaman" },
  { name: "Aegean Wolves", kit_primary: "#4338ca", kit_secondary: "#e0e7ff", strength: 0.8, manager: "Bot Ege" },
  { name: "Cappadocia SK", kit_primary: "#9f1239", kit_secondary: "#fff1f2", strength: 0.78, manager: "Bot Peri" },
  { name: "Golden Horn", kit_primary: "#a16207", kit_secondary: "#0f172a", strength: 0.74, manager: "Bot Haliç" },
  { name: "Taurus Lions", kit_primary: "#b45309", kit_secondary: "#fffbeb", strength: 0.7, manager: "Bot Toros" },
  { name: "Marmara City", kit_primary: "#0369a1", kit_secondary: "#f0f9ff", strength: 0.68, manager: "Bot Mavi" },
  { name: "Galata North", kit_primary: "#be123c", kit_secondary: "#fef2f2", strength: 0.66, manager: "Bot Kuzey" },
  { name: "Smyrna Athletic", kit_primary: "#365314", kit_secondary: "#ecfccb", strength: 0.62, manager: "Bot İzmir" },
  { name: "Thrace United", kit_primary: "#7c3aed", kit_secondary: "#ede9fe", strength: 0.76, manager: "Bot Trakya" },
  { name: "Pontus Rovers", kit_primary: "#0e7490", kit_secondary: "#cffafe", strength: 0.64, manager: "Bot Pontus" },
  { name: "Lycian Stars", kit_primary: "#c2410c", kit_secondary: "#ffedd5", strength: 0.72, manager: "Bot Likya" },
  { name: "Hatti Warriors", kit_primary: "#b91c1c", kit_secondary: "#fee2e2", strength: 0.69, manager: "Bot Hatti" },
  { name: "Ionia Coast", kit_primary: "#0369a1", kit_secondary: "#e0f2fe", strength: 0.61, manager: "Bot Ionia" },
  { name: "Phrygia FC", kit_primary: "#a21caf", kit_secondary: "#fae8ff", strength: 0.67, manager: "Bot Frig" },
  { name: "Troy Athletic", kit_primary: "#854d0e", kit_secondary: "#fef9c3", strength: 0.73, manager: "Bot Truva" },
  { name: "Ankara Volt", kit_primary: "#15803d", kit_secondary: "#dcfce7", strength: 0.65, manager: "Bot Volt" },
];

export function botManagerName(teamName: string): string {
  return AI_CLUBS.find((c) => c.name === teamName)?.manager ?? `Bot ${teamName.split(" ")[0]}`;
}
