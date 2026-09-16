import { NextResponse } from "next/server";
import { ActionError, registerManager } from "@/lib/server/actions";
import { setSessionCookie } from "@/lib/server/session";
import { runWithRoom } from "@/lib/server/store";
import type { KitStyle } from "@/lib/types";
import { KIT_STYLES } from "@/lib/types";
import { makeRoomCode, normalizeRoom } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      username?: string;
      password?: string;
      teamName?: string;
      roomCode?: string;
      career?: boolean;
      kit_primary?: string;
      kit_secondary?: string;
      kit_style?: string;
    };
    const career = Boolean(body.career) && !normalizeRoom(body.roomCode);
    const room = career
      ? makeRoomCode(`${body.username ?? ""}-${Date.now()}`)
      : normalizeRoom(body.roomCode) || "NOVA";
    const style = KIT_STYLES.includes(body.kit_style as KitStyle) ? (body.kit_style as KitStyle) : undefined;
    const session = await runWithRoom(room, () =>
      registerManager(body.username ?? "", body.password ?? "", body.teamName ?? "", {
        kit_primary: body.kit_primary,
        kit_secondary: body.kit_secondary,
        kit_style: style,
      }),
    );
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
      { error: e instanceof Error ? e.message : "Kayıt başarısız" },
      { status: e instanceof ActionError ? 400 : 500 },
    );
  }
}
