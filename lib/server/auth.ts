import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { kvConfigured, kvGetRaw, kvSetNx } from "./remote-kv";

const SALT_LEN = 16;
const KEY_LEN = 32;
const FILE_SECRET_PATH = path.join(process.cwd(), "data", "auth-secret");

function readFileSecret(): string | null {
  try {
    if (!existsSync(FILE_SECRET_PATH)) return null;
    const existing = readFileSync(FILE_SECRET_PATH, "utf8").trim();
    return existing.length >= 32 ? existing : null;
  } catch {
    return null;
  }
}

function writeFileSecret(secret: string): void {
  try {
    mkdirSync(path.dirname(FILE_SECRET_PATH), { recursive: true });
    writeFileSync(FILE_SECRET_PATH, secret, { encoding: "utf8", mode: 0o600 });
  } catch {
    /* ignore — memory secret still works for this process */
  }
}

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN).toString("hex");
  const hash = scryptSync(password, salt, KEY_LEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, KEY_LEN);
  const prev = Buffer.from(hash, "hex");
  if (prev.length !== next.length) return false;
  return timingSafeEqual(prev, next);
}

let runtimeSecret: string | undefined;

async function sharedSecret(): Promise<string> {
  if (runtimeSecret) return runtimeSecret;
  if (kvConfigured()) {
    const existing = await kvGetRaw("auth:secret");
    if (existing && existing.length >= 32) {
      runtimeSecret = existing;
      return existing;
    }
    const created = randomBytes(32).toString("hex");
    const won = await kvSetNx("auth:secret", created);
    if (!won) {
      const winner = await kvGetRaw("auth:secret");
      runtimeSecret = winner && winner.length >= 32 ? winner : created;
      return runtimeSecret;
    }
    runtimeSecret = created;
    return created;
  }
  const fromDisk = readFileSecret();
  if (fromDisk) {
    runtimeSecret = fromDisk;
    return fromDisk;
  }
  const created = randomBytes(32).toString("hex");
  writeFileSecret(created);
  runtimeSecret = created;
  return created;
}

export async function sessionSecret(): Promise<string> {
  const configured = process.env.AUTH_SECRET || process.env.SESSION_SECRET;
  if (configured) return configured;
  return sharedSecret();
}

export type SessionPayload = { sub: string; name: string; teamId: string; teamName?: string; roomCode?: string };

export async function signSession(payload: SessionPayload): Promise<string> {
  const secret = await sessionSecret();
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Date.now() + 14 * 24 * 60 * 60 * 1000 }),
  ).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export async function readSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const secret = await sessionSecret();
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      sub: string;
      name: string;
      teamId: string;
      teamName?: string;
      roomCode?: string;
      exp: number;
    };
    if (data.exp < Date.now()) return null;
    return {
      sub: data.sub,
      name: data.name,
      teamId: data.teamId,
      teamName: data.teamName,
      roomCode: data.roomCode,
    };
  } catch {
    return null;
  }
}
