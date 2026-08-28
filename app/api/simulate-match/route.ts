import { NextResponse } from "next/server";
import { z } from "zod";
import { simulateMatch, type SimPlayer, type SimSide } from "@/lib/match-engine";
import type { Formation, Tactic } from "@/lib/types";

const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  nationality: z.string(),
  nationality_code: z.string(),
  position: z.enum(["KL", "DEF", "OS", "FV"]),
  age: z.number(),
  attack: z.number(),
  defense: z.number(),
  overall: z.number(),
  base_value: z.number(),
  energy: z.number(),
  form: z.number(),
  slotKey: z.string(),
});

const sideSchema = z.object({
  team: z.object({
    id: z.string(),
    user_id: z.string().nullable(),
    name: z.string(),
    coins: z.number(),
    division: z.number(),
    formation: z.string(),
    tactics: z.string(),
    points: z.number(),
    created_at: z.string(),
    kit_primary: z.string(),
    kit_secondary: z.string(),
    played: z.number(),
    won: z.number(),
    drawn: z.number(),
    lost: z.number(),
    goals_for: z.number(),
    goals_against: z.number(),
  }),
  starters: z.array(playerSchema).min(11).max(11),
});

const bodySchema = z.object({
  home: sideSchema,
  away: sideSchema,
  week: z.number().int().min(1),
  seed: z.number().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz simülasyon isteği", details: parsed.error.flatten() }, { status: 400 });
  }
  const { home, away, week, seed } = parsed.data;
  const toSide = (s: z.infer<typeof sideSchema>): SimSide => ({
    team: {
      ...s.team,
      formation: s.team.formation as Formation,
      tactics: s.team.tactics as Tactic,
    },
    starters: s.starters as SimPlayer[],
  });
  const started = performance.now();
  const result = simulateMatch(toSide(home), toSide(away), week, seed ?? Date.now());
  const ms = performance.now() - started;
  return NextResponse.json({ ...result, computeMs: Math.round(ms * 1000) / 1000 });
}
