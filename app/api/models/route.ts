import { readdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Lists optional per-player GLBs: public/models/p00.glb … p23.glb. */
export async function GET() {
  try {
    const names = await readdir(path.join(process.cwd(), "public", "models"));
    const slots = names
      .map((name) => /^p(\d{2})\.glb$/i.exec(name)?.[1])
      .filter((n): n is string => Boolean(n))
      .map((n) => Number(n));
    return NextResponse.json({ slots, fallback: names.some((n) => n.toLowerCase() === "player.glb") });
  } catch {
    return NextResponse.json({ slots: [], fallback: false });
  }
}
