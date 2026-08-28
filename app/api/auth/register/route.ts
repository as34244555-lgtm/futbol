import { NextResponse } from "next/server";
import { ActionError, registerManager } from "@/lib/server/actions";
import { setSessionCookie } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { username?: string; password?: string; teamName?: string };
    const session = await registerManager(body.username ?? "", body.password ?? "", body.teamName ?? "");
    await setSessionCookie({ sub: session.userId, name: session.username, teamId: session.teamId, teamName: session.teamName });
    return NextResponse.json({ ok: true, ...session });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Kayıt başarısız" },
      { status: e instanceof ActionError ? 400 : 500 },
    );
  }
}
