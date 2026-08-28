import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SALT_LEN = 16;
const KEY_LEN = 32;

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

export function sessionSecret(): string {
  return process.env.AUTH_SECRET || process.env.SESSION_SECRET || "liga-nova-dev-secret-change-me";
}

export function signSession(payload: { sub: string; name: string; teamId: string }): string {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 14 * 24 * 60 * 60 * 1000 })).toString(
    "base64url",
  );
  const sig = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readSession(token: string | undefined): { sub: string; name: string; teamId: string } | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      sub: string;
      name: string;
      teamId: string;
      exp: number;
    };
    if (data.exp < Date.now()) return null;
    return { sub: data.sub, name: data.name, teamId: data.teamId };
  } catch {
    return null;
  }
}
