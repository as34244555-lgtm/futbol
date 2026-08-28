import { z } from "zod";
import { computeBaseValue, computeOverall } from "./catalog";
import { NATION_BY_CODE, NATION_BY_NAME, NATIONS } from "./nations";
import type { CommunityPlayerRow, Player, Position } from "./types";
import { catalogId, uid } from "./utils";

const positionSchema = z.enum(["KL", "DEF", "OS", "FV"]);

export const communityPlayerSchema = z.object({
  name: z.string().min(2).max(80),
  nationality: z.string().min(2).max(60),
  nationality_code: z.string().min(2).max(8).optional(),
  position: z.string().transform((v) => v.trim().toUpperCase()),
  age: z.coerce.number().int().min(16).max(45),
  attack: z.coerce.number().int().min(1).max(99),
  defense: z.coerce.number().int().min(1).max(99),
  overall: z.coerce.number().int().min(1).max(99).optional(),
  base_value: z.coerce.number().int().min(1).optional(),
});

export type ImportResult = {
  ok: boolean;
  players: Player[];
  errors: string[];
};

function resolveNation(nationality: string, code?: string): { name: string; code: string } {
  if (code) {
    const n = NATION_BY_CODE[code.toLowerCase()];
    if (n) return { name: n.name, code: n.code };
  }
  const n = NATION_BY_NAME[nationality.toLowerCase()];
  if (n) return { name: n.name, code: n.code };
  return { name: nationality, code: code?.toLowerCase() || "un" };
}

function toPlayer(row: z.infer<typeof communityPlayerSchema>, index: number): Player | string {
  const posParse = positionSchema.safeParse(row.position);
  if (!posParse.success) {
    return `${row.name}: geçersiz mevki (${row.position}). KL, DEF, OS veya FV olmalı.`;
  }
  const position = posParse.data as Position;
  const nation = resolveNation(row.nationality, row.nationality_code);
  const overall = row.overall ?? computeOverall(position, row.attack, row.defense);
  const base_value = row.base_value ?? computeBaseValue(overall, row.age, position);
  return {
    id: uid("imp") || catalogId(9000 + index),
    name: row.name.trim(),
    nationality: nation.name,
    nationality_code: nation.code,
    position,
    age: row.age,
    attack: row.attack,
    defense: row.defense,
    overall,
    base_value,
  };
}

export function parseCommunityJson(text: string): ImportResult {
  const errors: string[] = [];
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, players: [], errors: ["JSON ayrıştırılamadı."] };
  }
  const list = Array.isArray(raw) ? raw : Array.isArray((raw as { players?: unknown }).players)
    ? (raw as { players: unknown[] }).players
    : null;
  if (!list) return { ok: false, players: [], errors: ["JSON bir dizi veya { players: [] } olmalı."] };

  const players: Player[] = [];
  list.forEach((item, i) => {
    const parsed = communityPlayerSchema.safeParse(item);
    if (!parsed.success) {
      errors.push(`Satır ${i + 1}: ${parsed.error.issues[0]?.message ?? "geçersiz"}`);
      return;
    }
    const p = toPlayer(parsed.data, i);
    if (typeof p === "string") errors.push(p);
    else players.push(p);
  });
  return { ok: errors.length === 0 && players.length > 0, players, errors };
}

export function parseCommunityCsv(text: string): ImportResult {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { ok: false, players: [], errors: ["CSV başlık + en az bir satır içermeli."] };
  const header = splitCsv(lines[0]!).map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const required = ["name", "nationality", "position", "age", "attack", "defense"];
  const missing = required.filter((r) => idx(r) < 0);
  if (missing.length) {
    return {
      ok: false,
      players: [],
      errors: [`Eksik sütunlar: ${missing.join(", ")}. İsteğe bağlı: nationality_code, overall, base_value`],
    };
  }
  const errors: string[] = [];
  const players: Player[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsv(lines[i]!);
    const row: CommunityPlayerRow = {
      name: cols[idx("name")] ?? "",
      nationality: cols[idx("nationality")] ?? "",
      nationality_code: idx("nationality_code") >= 0 ? cols[idx("nationality_code")] : undefined,
      position: cols[idx("position")] ?? "",
      age: Number(cols[idx("age")]),
      attack: Number(cols[idx("attack")]),
      defense: Number(cols[idx("defense")]),
      overall: idx("overall") >= 0 ? Number(cols[idx("overall")]) : undefined,
      base_value: idx("base_value") >= 0 ? Number(cols[idx("base_value")]) : undefined,
    };
    const parsed = communityPlayerSchema.safeParse(row);
    if (!parsed.success) {
      errors.push(`Satır ${i + 1}: ${parsed.error.issues[0]?.message ?? "geçersiz"}`);
      continue;
    }
    const p = toPlayer(parsed.data, i);
    if (typeof p === "string") errors.push(p);
    else players.push(p);
  }
  return { ok: errors.length === 0 && players.length > 0, players, errors };
}

function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (c === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

export const SAMPLE_JSON = JSON.stringify(
  [
    {
      name: "Erlung Haland",
      nationality: "Almanya",
      nationality_code: "de",
      position: "FV",
      age: 24,
      attack: 94,
      defense: 48,
    },
    {
      name: "Lucas Silva",
      nationality: "Brezilya",
      nationality_code: "br",
      position: "OS",
      age: 27,
      attack: 88,
      defense: 76,
    },
  ],
  null,
  2,
);

export const SAMPLE_CSV = [
  "name,nationality,nationality_code,position,age,attack,defense",
  "Miko Vartan,Türkiye,tr,OS,23,86,71",
  "Sabri Koçhan,Türkiye,tr,DEF,29,62,90",
].join("\n");

export const SUPPORTED_NATIONS = NATIONS.map((n) => ({ code: n.code, name: n.name }));
