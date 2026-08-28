import { NextResponse } from "next/server";
import { ActionError, loginManager } from "@/lib/server/actions";
import { setSessionCookie } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { username?: string; password?: string };
    const session = await loginManager(body.username ?? "", body.password ?? "");
    await setSessionCookie({ sub: session.userId, name: session.username, teamId: session.teamId });
    return NextResponse.json({ ok: true, ...session });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Giriş başarısız" },
      { status: e instanceof ActionError ? 400 : 500 },
    );
  }
}
