import { NextResponse } from "next/server";
import { ActionError, loginManager } from "@/lib/server/actions";
import { setSessionCookie } from "@/lib/server/session";
import { runWithRoom } from "@/lib/server/store";
import { normalizeRoom } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { username?: string; password?: string; roomCode?: string };
    const room = normalizeRoom(body.roomCode) || "NOVA";
    const session = await runWithRoom(room, () => loginManager(body.username ?? "", body.password ?? ""));
    await setSessionCookie({
      sub: session.userId,
      name: session.username,
      teamId: session.teamId,
      teamName: session.teamName,
      roomCode: room,
    });
    return NextResponse.json({ ok: true, ...session, roomCode: room });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Giriş başarısız" },
      { status: e instanceof ActionError ? 400 : 500 },
    );
  }
}
