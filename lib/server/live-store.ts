import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { kvConfigured, kvGetRaw, kvSetRaw } from "./remote-kv";
import { persistenceMode, supabaseAdmin } from "./supabase-admin";

export type LivePlayer = { id: string; x: number; y: number };
export type LiveBall = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  holder: string | null;
  touch: "home" | "away";
};
export type LiveSideName = "home" | "away";
export type LiveSideFrame = { teamId: string; players: LivePlayer[]; at: number };
export type LiveRoom = {
  home?: LiveSideFrame;
  away?: LiveSideFrame;
  ball?: LiveBall;
  ballAt?: number;
  score: [number, number];
};

const mem = new Map<string, LiveRoom>();
const locks = new Map<string, Promise<unknown>>();

function empty(): LiveRoom {
  return { score: [0, 0] };
}

function storageKey(room: string, matchId: string) {
  return `${room}:${matchId}`.replace(/[^a-zA-Z0-9:_-]/g, "").slice(0, 120);
}

function num(v: unknown, min: number, max: number, fallback: number) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function sanitizePlayers(raw: unknown): LivePlayer[] {
  if (!Array.isArray(raw)) return [];
  const out: LivePlayer[] = [];
  for (const row of raw.slice(0, 11)) {
    if (!row || typeof row !== "object") continue;
    const id = String((row as { id?: unknown }).id ?? "").slice(0, 80);
    if (!id) continue;
    out.push({
      id,
      x: num((row as { x?: unknown }).x, 0, 100, 50),
      y: num((row as { y?: unknown }).y, 0, 100, 50),
    });
  }
  return out;
}

function sanitizeBall(raw: unknown): LiveBall | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const b = raw as Partial<LiveBall>;
  const touch = b.touch === "away" ? "away" : "home";
  return {
    x: num(b.x, -8, 108, 50),
    y: num(b.y, -8, 108, 50),
    vx: num(b.vx, -80, 80, 0),
    vy: num(b.vy, -80, 80, 0),
    holder: b.holder ? String(b.holder).slice(0, 80) : null,
    touch,
  };
}

async function readPersistent(key: string): Promise<LiveRoom | null> {
  const mode = persistenceMode();
  if (mode === "kv" && kvConfigured()) {
    const raw = await kvGetRaw(`live:${key}`);
    if (raw) {
      try {
        return JSON.parse(raw) as LiveRoom;
      } catch {
        return null;
      }
    }
  }
  const sb = supabaseAdmin();
  if (sb && (mode === "supabase" || mode === "kv")) {
    try {
      const { data, error } = await sb.from("live_pitch").select("payload").eq("id", key).maybeSingle();
      if (!error && data?.payload) return data.payload as LiveRoom;
    } catch {
      /* table may not exist yet */
    }
  }
  try {
    const file = path.join(process.cwd(), "data", "live", `${key.replace(/:/g, "_")}.json`);
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw) as LiveRoom;
  } catch {
    return null;
  }
}

async function writePersistent(key: string, room: LiveRoom) {
  const raw = JSON.stringify(room);
  const mode = persistenceMode();
  if (mode === "kv" && kvConfigured()) {
    await kvSetRaw(`live:${key}`, raw);
  }
  const sb = supabaseAdmin();
  if (sb) {
    try {
      await sb.from("live_pitch").upsert({ id: key, payload: room, updated_at: new Date().toISOString() });
    } catch {
      /* optional table */
    }
  }
  const file = path.join(process.cwd(), "data", "live", `${key.replace(/:/g, "_")}.json`);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, raw, "utf8");
}

export async function pushLive(opts: {
  room: string;
  matchId: string;
  side: LiveSideName;
  teamId: string;
  players: unknown;
  ball?: unknown;
  ownsBall: boolean;
  score?: unknown;
}): Promise<LiveRoom> {
  const key = storageKey(opts.room, opts.matchId);
  const prev = locks.get(key) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((res) => {
    release = res;
  });
  locks.set(key, gate);
  await prev.catch(() => undefined);
  try {
    const current = mem.get(key) ?? (await readPersistent(key)) ?? empty();
    const next: LiveRoom = {
      home: current.home,
      away: current.away,
      ball: current.ball,
      ballAt: current.ballAt,
      score: [
        num(current.score?.[0], 0, 30, 0),
        num(current.score?.[1], 0, 30, 0),
      ],
    };
    const occupied = next[opts.side];
    if (!occupied || occupied.teamId === opts.teamId) {
      next[opts.side] = {
        teamId: opts.teamId,
        players: sanitizePlayers(opts.players),
        at: Date.now(),
      };
    }
    if (opts.ownsBall) {
      const ball = sanitizeBall(opts.ball);
      if (ball) {
        next.ball = ball;
        next.ballAt = Date.now();
      }
      if (Array.isArray(opts.score)) {
        next.score = [num(opts.score[0], 0, 30, next.score[0]), num(opts.score[1], 0, 30, next.score[1])];
      }
    }
    mem.set(key, next);
    await writePersistent(key, next);
    return next;
  } finally {
    release();
  }
}
