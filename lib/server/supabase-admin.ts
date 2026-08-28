import { createClient } from "@supabase/supabase-js";
import { kvConfigured } from "./remote-kv";

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function persistenceMode(): "supabase" | "kv" | "file" | "memory" {
  if (supabaseAdmin()) return "supabase";
  if (kvConfigured()) return "kv";
  if (process.env.VERCEL === "1") return "memory";
  return "file";
}
