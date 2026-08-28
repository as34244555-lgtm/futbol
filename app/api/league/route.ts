import { NextResponse } from "next/server";
import { getSnapshot, ping } from "@/lib/server/actions";
import { getSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (session) return NextResponse.json(await ping(session));
  return NextResponse.json(await getSnapshot(null));
}
