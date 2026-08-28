import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { createFreshWorld } from "@/lib/world";
import type { LeagueDocument } from "@/lib/types";
import { persistenceMode, supabaseAdmin } from "./supabase-admin";

const FILE = path.join(process.cwd(), "data", "league.json");

const g = globalThis as unknown as {
  __ligaDoc?: LeagueDocument;
  __ligaLock?: Promise<unknown>;
};

function emptyDoc(): LeagueDocument {
  return {
    version: 1,
    world: createFreshWorld(),
    accounts: [],
    lastSim: {},
    lastSeen: {},
  };
}

async function readFileDoc(): Promise<LeagueDocument> {
  try {
    const raw = await readFile(FILE, "utf8");
    return JSON.parse(raw) as LeagueDocument;
  } catch {
    const doc = emptyDoc();
    await writeFileDoc(doc);
    return doc;
  }
}

async function writeFileDoc(doc: LeagueDocument) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(doc), "utf8");
}

async function readSupabase(): Promise<LeagueDocument> {
  const sb = supabaseAdmin()!;
  const { data, error } = await sb.from("league_state").select("version, payload").eq("id", 1).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    const doc = emptyDoc();
    const { error: ins } = await sb.from("league_state").insert({ id: 1, version: 1, payload: doc });
    if (ins && !ins.message.toLowerCase().includes("duplicate")) throw new Error(ins.message);
    return doc;
  }
  const payload = data.payload as LeagueDocument;
  payload.version = data.version as number;
  return payload;
}

async function writeSupabase(doc: LeagueDocument, expectedVersion: number) {
  const sb = supabaseAdmin()!;
  const next = { ...doc, version: expectedVersion + 1 };
  const { data, error } = await sb
    .from("league_state")
    .update({ version: next.version, payload: next, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .eq("version", expectedVersion)
    .select("version")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    const err = new Error("VERSION_CONFLICT");
    throw err;
  }
  return next;
}

async function load(): Promise<LeagueDocument> {
  const mode = persistenceMode();
  if (mode === "supabase") return readSupabase();
  if (mode === "file") return readFileDoc();
  if (!g.__ligaDoc) g.__ligaDoc = emptyDoc();
  return structuredClone(g.__ligaDoc);
}

async function save(doc: LeagueDocument, expectedVersion: number): Promise<LeagueDocument> {
  const mode = persistenceMode();
  if (mode === "supabase") return writeSupabase(doc, expectedVersion);
  const next = { ...doc, version: expectedVersion + 1 };
  if (mode === "file") await writeFileDoc(next);
  g.__ligaDoc = next;
  return next;
}

export async function mutateLeague<T>(
  fn: (doc: LeagueDocument) => { doc: LeagueDocument; result: T } | Promise<{ doc: LeagueDocument; result: T }>,
): Promise<T> {
  const run = async () => {
    for (let attempt = 0; attempt < 4; attempt++) {
      const current = await load();
      const version = current.version;
      const { doc, result } = await fn(structuredClone(current));
      try {
        await save(doc, version);
        return result;
      } catch (e) {
        if (e instanceof Error && e.message === "VERSION_CONFLICT" && attempt < 3) continue;
        throw e;
      }
    }
    throw new Error("Lig kaydı kilitli, tekrar deneyin.");
  };

  const prev = g.__ligaLock ?? Promise.resolve();
  let release!: () => void;
  g.__ligaLock = new Promise<void>((res) => {
    release = res;
  });
  await prev.catch(() => undefined);
  try {
    return await run();
  } finally {
    release();
  }
}

export async function readLeague(): Promise<LeagueDocument> {
  return load();
}

export { persistenceMode };
