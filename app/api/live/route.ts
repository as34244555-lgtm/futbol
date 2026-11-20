import { NextResponse } from "next/server";
import { pushLive, type LiveSideName } from "@/lib/server/live-store";
import { getSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  const body = (await req.json()) as {
    matchId?: string;
    side?: string;
    players?: unknown;
    ball?: unknown;
    ownsBall?: boolean;
    score?: unknown;
  };
  const matchId = String(body.matchId ?? "").slice(0, 80);
  const side: LiveSideName | null = body.side === "home" || body.side === "away" ? body.side : null;
  if (!matchId || !side) return NextResponse.json({ error: "Maç kimliği gerekli" }, { status: 400 });
  const room = await pushLive({
    room: session.roomCode || "NOVA",
    matchId,
    side,
    teamId: session.teamId,
    players: body.players,
    ball: body.ball,
    ownsBall: Boolean(body.ownsBall),
    score: body.score,
  });
  const opp = side === "home" ? room.away : room.home;
  return NextResponse.json({
    opponent: opp ?? null,
    ball: room.ball ?? null,
    ballAt: room.ballAt ?? 0,
    score: room.score,
  });
}
