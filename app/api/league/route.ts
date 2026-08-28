import { NextResponse } from "next/server";
import { getSnapshot, ping } from "@/lib/server/actions";
import { getSession } from "@/lib/server/session";
import { runWithRoom } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  return runWithRoom(session?.roomCode, async () => {
    if (session) return NextResponse.json(await ping(session));
    return NextResponse.json(await getSnapshot(null));
  });
}
