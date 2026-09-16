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
    slot("rb", "SĞB", "SĞB", 26, 16),
    slot("rcb", "STP", "STP", 24, 38),
    slot("lcb", "STP", "STP", 24, 62),
    slot("lb", "SLB", "SLB", 26, 84),
    slot("cmr", "MOS", "MOS", 48, 28),
    slot("cdm", "MOS", "MOS", 42, 50),
    slot("cml", "MOS", "MOS", 48, 72),
    slot("rw", "KANAT", "SĞK", 74, 20),
    slot("st", "FV", "SAN", 80, 50),
    slot("lw", "KANAT", "SLK", 74, 80),
  ],
  "4-4-2": [
    slot("gk", "KL", "KL", 10, 50),
    slot("rb", "SĞB", "SĞB", 26, 16),
    slot("rcb", "STP", "STP", 24, 38),
    slot("lcb", "STP", "STP", 24, 62),
    slot("lb", "SLB", "SLB", 26, 84),
    slot("rm", "KANAT", "SĞK", 52, 18),
    slot("cmr", "MOS", "MOS", 46, 38),
    slot("cml", "MOS", "MOS", 46, 62),
    slot("lm", "KANAT", "SLK", 52, 82),
    slot("st1", "FV", "SAN", 78, 38),
    slot("st2", "FV", "SAN", 78, 62),
  ],
  "3-5-2": [
    slot("gk", "KL", "KL", 10, 50),
    slot("rcb", "STP", "STP", 24, 28),
    slot("cb", "STP", "STP", 22, 50),
    slot("lcb", "STP", "STP", 24, 72),
    slot("rwb", "SĞB", "SĞB", 50, 14),
    slot("cmr", "MOS", "MOS", 46, 36),
    slot("cdm", "MOS", "MOS", 40, 50),
    slot("cml", "MOS", "MOS", 46, 64),
    slot("lwb", "SLB", "SLB", 50, 86),
    slot("st1", "FV", "SAN", 78, 38),
    slot("st2", "FV", "SAN", 78, 62),
  ],
  "4-2-3-1": [
    slot("gk", "KL", "KL", 10, 50),
    slot("rb", "SĞB", "SĞB", 26, 16),
    slot("rcb", "STP", "STP", 24, 38),
    slot("lcb", "STP", "STP", 24, 62),
    slot("lb", "SLB", "SLB", 26, 84),
    slot("cdm1", "MOS", "MOS", 40, 36),
    slot("cdm2", "MOS", "MOS", 40, 64),
    slot("cam", "MOS", "MOS", 60, 50),
    slot("rw", "KANAT", "SĞK", 68, 20),
    slot("st", "FV", "SAN", 82, 50),
    slot("lw", "KANAT", "SLK", 68, 80),
  ],
  "5-3-2": [
    slot("gk", "KL", "KL", 10, 50),
    slot("rwb", "SĞB", "SĞB", 30, 12),
    slot("rcb", "STP", "STP", 22, 32),
    slot("cb", "STP", "STP", 20, 50),
    slot("lcb", "STP", "STP", 22, 68),
    slot("lwb", "SLB", "SLB", 30, 88),
    slot("cmr", "MOS", "MOS", 50, 32),
    slot("cdm", "MOS", "MOS", 44, 50),
    slot("cml", "MOS", "MOS", 50, 68),
    slot("st1", "FV", "SAN", 78, 38),
    slot("st2", "FV", "SAN", 78, 62),
  ],
  "3-4-3": [
    slot("gk", "KL", "KL", 10, 50),
    slot("rcb", "STP", "STP", 24, 28),
    slot("cb", "STP", "STP", 22, 50),
    slot("lcb", "STP", "STP", 24, 72),
    slot("rm", "KANAT", "SĞK", 50, 16),
    slot("cmr", "MOS", "MOS", 46, 38),
    slot("cml", "MOS", "MOS", 46, 62),
    slot("lm", "KANAT", "SLK", 50, 84),
    slot("rw", "KANAT", "SĞK", 76, 22),
    slot("st", "FV", "SAN", 82, 50),
    slot("lw", "KANAT", "SLK", 76, 78),
  ],
};

export function requiredCounts(formation: Formation): Record<SquadSlot["position"], number> {
  const counts: Record<SquadSlot["position"], number> = {
    KL: 0,
    STP: 0,
    SLB: 0,
    SĞB: 0,
    MOS: 0,
    KANAT: 0,
    FV: 0,
  };
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
