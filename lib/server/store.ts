import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { AsyncLocalStorage } from "node:async_hooks";
import { createFreshWorld, ensureBotWorld } from "@/lib/world";
import type { LeagueDocument } from "@/lib/types";
import { normalizeRoom } from "@/lib/utils";
import { persistenceMode, supabaseAdmin } from "./supabase-admin";
import { readKv, writeKv } from "./remote-kv";

const DATA_DIR = path.join(process.cwd(), process.env.LEAGUE_DATA_DIR || "data");
const DEFAULT_FILE = path.join(DATA_DIR, process.env.LEAGUE_FILE || "league.json");

const roomAls = new AsyncLocalStorage<string>();

const g = globalThis as unknown as {
  __ligaDocs?: Record<string, LeagueDocument>;
  __ligaLock?: Promise<unknown>;
};

export function currentRoom(): string {
  return roomAls.getStore() || "NOVA";
}

export function runWithRoom<T>(room: string | null | undefined, fn: () => Promise<T>): Promise<T> {
  return roomAls.run(normalizeRoom(room) || "NOVA", fn);
}

function memDocs(): Record<string, LeagueDocument> {
  if (!g.__ligaDocs) g.__ligaDocs = {};
  return g.__ligaDocs;
}

function emptyDoc(): LeagueDocument {
  return {
    version: 1,
    world: createFreshWorld(),
    accounts: [],
    lastSim: {},
    lastSeen: {},
  };
}

function fileForRoom(room: string): string {
  if (room === "NOVA") return DEFAULT_FILE;
  return path.join(DATA_DIR, `liga-${room}.json`);
}

function tmpForRoom(room: string): string {
  return `/tmp/liga-${room}.json`;
}

async function readFileDoc(room: string): Promise<LeagueDocument> {
  const file = fileForRoom(room);
  try {
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw) as LeagueDocument;
  } catch {
    const doc = emptyDoc();
    await writeFileDoc(room, doc);
    return doc;
  }
}

async function writeFileDoc(room: string, doc: LeagueDocument) {
  const file = fileForRoom(room);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(doc), "utf8");
}

async function readTmp(room: string): Promise<LeagueDocument | null> {
  try {
    const raw = await readFile(tmpForRoom(room), "utf8");
    return JSON.parse(raw) as LeagueDocument;
  } catch {
    return null;
  }
}

async function writeTmp(room: string, doc: LeagueDocument) {
  try {
    await writeFile(tmpForRoom(room), JSON.stringify(doc), "utf8");
  } catch {
    /* /tmp may be unavailable locally */
  }
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

function withBots(doc: LeagueDocument): { doc: LeagueDocument; changed: boolean } {
  const world = ensureBotWorld(doc.world);
  if (world === doc.world) return { doc, changed: false };
  return { doc: { ...doc, world }, changed: true };
}

async function loadRaw(): Promise<LeagueDocument> {
  const mode = persistenceMode();
  const room = currentRoom();
  if (mode === "supabase" && room === "NOVA") return readSupabase();
  if (mode === "kv") {
    const remote = await readKv(room);
    if (remote) return remote;
    return emptyDoc();
  }
  if (mode === "file") return readFileDoc(room);
  const docs = memDocs();
  if (docs[room]) return structuredClone(docs[room]);
  const fromTmp = await readTmp(room);
  if (fromTmp) {
    docs[room] = fromTmp;
    return structuredClone(fromTmp);
  }
  const doc = emptyDoc();
  docs[room] = doc;
  return structuredClone(doc);
}

async function save(doc: LeagueDocument, expectedVersion: number): Promise<LeagueDocument> {
  const mode = persistenceMode();
  const room = currentRoom();
  if (mode === "supabase" && room === "NOVA") return writeSupabase(doc, expectedVersion);
  if (mode === "kv") return writeKv(room, doc, expectedVersion);
  const next = { ...doc, version: expectedVersion + 1 };
  if (mode === "file") await writeFileDoc(room, next);
  memDocs()[room] = next;
  if (mode === "memory" || process.env.VERCEL === "1") await writeTmp(room, next);
  return next;
}

export async function mutateLeague<T>(
  fn: (doc: LeagueDocument) => { doc: LeagueDocument; result: T } | Promise<{ doc: LeagueDocument; result: T }>,
): Promise<T> {
  const run = async () => {
    for (let attempt = 0; attempt < 4; attempt++) {
      const current = await loadRaw();
      const version = current.version;
      const hydrated = withBots(current).doc;
      const { doc, result } = await fn(structuredClone(hydrated));
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
  const current = await loadRaw();
  const { doc, changed } = withBots(current);
  if (!changed) return doc;
  try {
    return await save(doc, current.version);
  } catch {
    return doc;
  }
}

export { persistenceMode };
