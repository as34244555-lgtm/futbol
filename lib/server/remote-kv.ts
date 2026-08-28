import { gunzipSync, gzipSync } from "node:zlib";
import type { LeagueDocument } from "../types";

function kvUrl(): string {
  return (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "").replace(/\/$/, "");
}

function kvToken(): string {
  return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
}

export function kvConfigured(): boolean {
  return Boolean(kvUrl() && kvToken());
}

function keyFor(room: string): string {
  return `liga:${room}`;
}

async function redis(command: unknown[]): Promise<unknown> {
  const res = await fetch(kvUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${kvToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const json = (await res.json()) as { result?: unknown; error?: string };
  if (!res.ok || json.error) throw new Error(json.error || `KV ${res.status}`);
  return json.result;
}

function encode(doc: LeagueDocument): string {
  return gzipSync(Buffer.from(JSON.stringify(doc), "utf8"), { level: 6 }).toString("base64");
}

export function packLeague(doc: LeagueDocument): string {
  return encode(doc);
}

export function unpackLeague(raw: string): LeagueDocument {
  return decode(raw);
}

function decode(raw: string): LeagueDocument {
  const buf = Buffer.from(raw, "base64");
  const json = gunzipSync(buf).toString("utf8");
  return JSON.parse(json) as LeagueDocument;
}

export async function readKv(room: string): Promise<LeagueDocument | null> {
  const result = await redis(["GET", keyFor(room)]);
  if (result == null || result === "") return null;
  if (typeof result !== "string") return null;
  try {
    return decode(result);
  } catch {
    try {
      return JSON.parse(result) as LeagueDocument;
    } catch {
      return null;
    }
  }
}

export async function writeKv(room: string, doc: LeagueDocument, expectedVersion: number): Promise<LeagueDocument> {
  const current = await readKv(room);
  if (current && current.version !== expectedVersion) {
    throw new Error("VERSION_CONFLICT");
  }
  const next = { ...doc, version: expectedVersion + 1 };
  await redis(["SET", keyFor(room), encode(next)]);
  return next;
}
