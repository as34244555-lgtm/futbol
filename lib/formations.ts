import type { Formation, SquadSlot } from "./types";

const slot = (
  key: string,
  position: SquadSlot["position"],
  label: string,
  x: number,
  y: number,
): SquadSlot => ({ key, position, label, x, y });

export const FORMATION_SLOTS: Record<Formation, SquadSlot[]> = {
  "4-3-3": [
    slot("gk", "KL", "KL", 10, 50),
    slot("rb", "DEF", "SĞB", 26, 16),
    slot("rcb", "DEF", "STP", 24, 38),
    slot("lcb", "DEF", "STP", 24, 62),
    slot("lb", "DEF", "SLB", 26, 84),
    slot("cmr", "OS", "MO", 48, 28),
    slot("cdm", "OS", "GO", 42, 50),
    slot("cml", "OS", "MO", 48, 72),
    slot("rw", "FV", "SĞK", 74, 20),
    slot("st", "FV", "SAN", 80, 50),
    slot("lw", "FV", "SLK", 74, 80),
  ],
  "4-4-2": [
    slot("gk", "KL", "KL", 10, 50),
    slot("rb", "DEF", "SĞB", 26, 16),
    slot("rcb", "DEF", "STP", 24, 38),
    slot("lcb", "DEF", "STP", 24, 62),
    slot("lb", "DEF", "SLB", 26, 84),
    slot("rm", "OS", "SĞK", 52, 18),
    slot("cmr", "OS", "MO", 46, 38),
    slot("cml", "OS", "MO", 46, 62),
    slot("lm", "OS", "SLK", 52, 82),
    slot("st1", "FV", "SAN", 78, 38),
    slot("st2", "FV", "SAN", 78, 62),
  ],
  "3-5-2": [
    slot("gk", "KL", "KL", 10, 50),
    slot("rcb", "DEF", "STP", 24, 28),
    slot("cb", "DEF", "STP", 22, 50),
    slot("lcb", "DEF", "STP", 24, 72),
    slot("rwb", "OS", "KNB", 50, 14),
    slot("cmr", "OS", "MO", 46, 36),
    slot("cdm", "OS", "GO", 40, 50),
    slot("cml", "OS", "MO", 46, 64),
    slot("lwb", "OS", "KNB", 50, 86),
    slot("st1", "FV", "SAN", 78, 38),
    slot("st2", "FV", "SAN", 78, 62),
  ],
  "4-2-3-1": [
    slot("gk", "KL", "KL", 10, 50),
    slot("rb", "DEF", "SĞB", 26, 16),
    slot("rcb", "DEF", "STP", 24, 38),
    slot("lcb", "DEF", "STP", 24, 62),
    slot("lb", "DEF", "SLB", 26, 84),
    slot("cdm1", "OS", "GO", 40, 36),
    slot("cdm2", "OS", "GO", 40, 64),
    slot("cam", "OS", "OF", 60, 50),
    slot("rw", "FV", "SĞK", 68, 20),
    slot("st", "FV", "SAN", 82, 50),
    slot("lw", "FV", "SLK", 68, 80),
  ],
  "5-3-2": [
    slot("gk", "KL", "KL", 10, 50),
    slot("rwb", "DEF", "KNB", 30, 12),
    slot("rcb", "DEF", "STP", 22, 32),
    slot("cb", "DEF", "STP", 20, 50),
    slot("lcb", "DEF", "STP", 22, 68),
    slot("lwb", "DEF", "KNB", 30, 88),
    slot("cmr", "OS", "MO", 50, 32),
    slot("cdm", "OS", "GO", 44, 50),
    slot("cml", "OS", "MO", 50, 68),
    slot("st1", "FV", "SAN", 78, 38),
    slot("st2", "FV", "SAN", 78, 62),
  ],
  "3-4-3": [
    slot("gk", "KL", "KL", 10, 50),
    slot("rcb", "DEF", "STP", 24, 28),
    slot("cb", "DEF", "STP", 22, 50),
    slot("lcb", "DEF", "STP", 24, 72),
    slot("rm", "OS", "SĞK", 50, 16),
    slot("cmr", "OS", "MO", 46, 38),
    slot("cml", "OS", "MO", 46, 62),
    slot("lm", "OS", "SLK", 50, 84),
    slot("rw", "FV", "SĞK", 76, 22),
    slot("st", "FV", "SAN", 82, 50),
    slot("lw", "FV", "SLK", 76, 78),
  ],
};

export function requiredCounts(formation: Formation): Record<SquadSlot["position"], number> {
  const counts = { KL: 0, DEF: 0, OS: 0, FV: 0 };
  for (const s of FORMATION_SLOTS[formation]) counts[s.position] += 1;
  return counts;
}

export const TACTIC_MOD = {
  BALANCED: { attack: 1, defense: 1, tempo: 1, possession: 1, conversion: 1 },
  ATTACKING: { attack: 1.12, defense: 0.88, tempo: 1.16, possession: 1.04, conversion: 1.02 },
  DEFENSIVE: { attack: 0.88, defense: 1.14, tempo: 0.86, possession: 0.96, conversion: 0.94 },
  POSSESSION: { attack: 0.96, defense: 1.04, tempo: 0.82, possession: 1.18, conversion: 0.98 },
  COUNTER: { attack: 1.08, defense: 1.02, tempo: 1.2, possession: 0.86, conversion: 1.1 },
} as const;
