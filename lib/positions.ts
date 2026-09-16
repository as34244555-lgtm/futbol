import type { Position } from "./types";
import { POSITIONS } from "./types";

const ALIAS: Record<string, Position> = {
  KL: "KL",
  GK: "KL",
  KALECİ: "KL",
  KALECI: "KL",
  DEF: "STP",
  CB: "STP",
  STP: "STP",
  STOPER: "STP",
  LB: "SLB",
  SLB: "SLB",
  LWB: "SLB",
  RB: "SĞB",
  RWB: "SĞB",
  SGB: "SĞB",
  "SĞB": "SĞB",
  OS: "MOS",
  CM: "MOS",
  CDM: "MOS",
  CAM: "MOS",
  MOS: "MOS",
  MID: "MOS",
  KANAT: "KANAT",
  LW: "KANAT",
  RW: "KANAT",
  WING: "KANAT",
  LM: "KANAT",
  RM: "KANAT",
  FV: "FV",
  ST: "FV",
  CF: "FV",
  SAN: "FV",
};

export function isPosition(v: string): v is Position {
  return (POSITIONS as readonly string[]).includes(v);
}

export function normalizePosition(raw: string | null | undefined): Position {
  if (!raw) return "MOS";
  const key = raw.trim().toUpperCase().replace(/\s+/g, "");
  return ALIAS[key] ?? (isPosition(key) ? key : "MOS");
}

/** Komşu mevkiler: bek stoper, kanat forvet vb. */
export function neighborPositions(pos: Position): Position[] {
  switch (pos) {
    case "KL":
      return [];
    case "STP":
      return ["SLB", "SĞB", "MOS"];
    case "SLB":
      return ["STP", "KANAT", "MOS"];
    case "SĞB":
      return ["STP", "KANAT", "MOS"];
    case "MOS":
      return ["STP", "KANAT", "SLB", "SĞB"];
    case "KANAT":
      return ["MOS", "FV", "SLB", "SĞB"];
    case "FV":
      return ["KANAT", "MOS"];
  }
}

export function playsNear(natural: Position, slot: Position, versatile?: boolean): boolean {
  if (versatile || natural === slot) return true;
  return neighborPositions(natural).includes(slot);
}

export function lineOf(pos: Position): "gk" | "def" | "mid" | "atk" {
  if (pos === "KL") return "gk";
  if (pos === "STP" || pos === "SLB" || pos === "SĞB") return "def";
  if (pos === "MOS" || pos === "KANAT") return "mid";
  return "atk";
}
