import { NextResponse } from "next/server";
import { ActionError } from "@/lib/server/actions";
import * as actions from "@/lib/server/actions";
import { getSession } from "@/lib/server/session";
import { runWithRoom } from "@/lib/server/store";
import type { Formation, Player, Tactic } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body =
  | { type: "setFormation"; formation: Formation }
  | { type: "setTactics"; tactics: Tactic }
  | { type: "assignSlot"; slotKey: string; teamPlayerId: string }
  | { type: "autoPick" }
  | { type: "listForSale"; teamPlayerId: string; price: number }
  | { type: "cancelListing"; listingId: string }
  | { type: "buyListing"; listingId: string }
  | { type: "ensureFixtures" }
  | { type: "playMatch" }
  | { type: "importPlayers"; players: Player[]; mode: "merge" | "replace" };

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  return runWithRoom(session.roomCode, async () => {
    try {
      const body = (await req.json()) as Body;
      switch (body.type) {
        case "setFormation":
          return NextResponse.json(await actions.setFormation(session, body.formation));
        case "setTactics":
          return NextResponse.json(await actions.setTactics(session, body.tactics));
        case "assignSlot":
          return NextResponse.json(await actions.assignSlot(session, body.slotKey, body.teamPlayerId));
        case "autoPick":
          return NextResponse.json(await actions.autoPick(session));
        case "listForSale":
          return NextResponse.json(await actions.listForSale(session, body.teamPlayerId, body.price));
        case "cancelListing":
          return NextResponse.json(await actions.cancelListing(session, body.listingId));
        case "buyListing":
          return NextResponse.json(await actions.buyListing(session, body.listingId));
        case "ensureFixtures":
          return NextResponse.json(await actions.ensureFixtures(session));
        case "playMatch":
          return NextResponse.json(await actions.playMatch(session));
        case "importPlayers":
          return NextResponse.json(await actions.importPlayers(session, body.players, body.mode));
        default:
          return NextResponse.json({ error: "Bilinmeyen işlem" }, { status: 400 });
      }
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "İşlem başarısız" },
        { status: e instanceof ActionError ? 400 : 500 },
      );
    }
  });
}
