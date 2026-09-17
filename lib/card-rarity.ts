import type { Player, Position } from "./types";

export type CardRarity = "bronze" | "silver" | "gold" | "featured" | "epic" | "showtime" | "legend";

export const EF_POS: Record<Position, string> = {
  KL: "GK",
  STP: "CB",
  SLB: "LB",
  SĞB: "RB",
  MOS: "CMF",
  KANAT: "LWF",
  FV: "CF",
};

export const RARITY_LABEL: Record<CardRarity, string> = {
  bronze: "Standart",
  silver: "Nadir",
  gold: "Altın",
  featured: "Öne Çıkan",
  epic: "Epik",
  showtime: "Show Time",
  legend: "Big Time",
};

export const RARITY_THEME: Record<
  CardRarity,
  { frame: string; glow: string; plate: string; ovr: string; gem: string }
> = {
  bronze: {
    frame: "from-[#5c3418] via-[#d4a06a] to-[#3a1f0c]",
    glow: "shadow-[0_16px_36px_rgba(140,80,30,0.35)]",
    plate: "from-[#2a160a]/95 to-[#120804]/95",
    ovr: "text-[#f0d0b0]",
    gem: "bg-gradient-to-br from-[#c48a4a] to-[#6b3f1a]",
  },
  silver: {
    frame: "from-[#6a7380] via-[#e8eef6] to-[#3d4450]",
    glow: "shadow-[0_16px_36px_rgba(160,180,210,0.28)]",
    plate: "from-[#1c222c]/95 to-[#0b0e14]/95",
    ovr: "text-[#e8eef6]",
    gem: "bg-gradient-to-br from-[#d5dee8] to-[#6a7380]",
  },
  gold: {
    frame: "from-[#8a6a12] via-[#f5e08a] to-[#5a4208]",
    glow: "shadow-[0_16px_40px_rgba(240,193,75,0.38)]",
    plate: "from-[#2a220c]/95 to-[#120e04]/95",
    ovr: "text-[#ffe9a8]",
    gem: "bg-gradient-to-br from-[#f0c14b] to-[#8a6a12]",
  },
  featured: {
    frame: "from-[#0e5aa0] via-[#7ad4ff] to-[#062848]",
    glow: "shadow-[0_16px_42px_rgba(80,190,255,0.4)]",
    plate: "from-[#062030]/95 to-[#031018]/95",
    ovr: "text-[#b8ecff]",
    gem: "bg-gradient-to-br from-[#5ec8ff] to-[#0e5aa0]",
  },
  epic: {
    frame: "from-[#5b1fa8] via-[#d4a8ff] to-[#2a0c58]",
    glow: "shadow-[0_16px_44px_rgba(180,90,255,0.42)]",
    plate: "from-[#1a0c30]/95 to-[#0a0418]/95",
    ovr: "text-[#ebd6ff]",
    gem: "bg-gradient-to-br from-[#c084fc] to-[#5b1fa8]",
  },
  showtime: {
    frame: "from-[#9b1232] via-[#ff7a9a] to-[#4a0818]",
    glow: "shadow-[0_18px_48px_rgba(255,70,110,0.45)]",
    plate: "from-[#2a0812]/95 to-[#120408]/95",
    ovr: "text-[#ffd0dc]",
    gem: "bg-gradient-to-br from-[#ff5a7a] to-[#9b1232]",
  },
  legend: {
    frame: "from-[#c9a227] via-[#fff4c2] to-[#6b4a08]",
    glow: "shadow-[0_20px_56px_rgba(240,193,75,0.55)]",
    plate: "from-[#1a1404]/95 to-[#080601]/95",
    ovr: "text-[#fff4c2]",
    gem: "bg-gradient-to-br from-[#fff4c2] to-[#c9a227]",
  },
};

export function cardRarity(player: Pick<Player, "overall" | "legend">): CardRarity {
  if (player.legend || player.overall >= 100) return "legend";
  if (player.overall >= 93) return "showtime";
  if (player.overall >= 87) return "epic";
  if (player.overall >= 82) return "featured";
  if (player.overall >= 75) return "gold";
  if (player.overall >= 65) return "silver";
  return "bronze";
}

export function displayOvr(overall: number): string {
  return overall >= 100 ? "99+" : String(overall);
}
