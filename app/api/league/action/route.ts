import { NextResponse } from "next/server";
import { ActionError } from "@/lib/server/actions";
import * as actions from "@/lib/server/actions";
import { getSession } from "@/lib/server/session";
import { runWithRoom } from "@/lib/server/store";
import type { Formation, Player, StadiumPrefs, Tactic, Training } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body =
  | { type: "setFormation"; formation: Formation }
  | { type: "setTactics"; tactics: Tactic }
  | { type: "assignSlot"; slotKey: string; teamPlayerId: string }
  | { type: "autoPick" }
  | { type: "listForSale"; teamPlayerId: string; price: number }
  | { type: "cancelListing"; listingId: string }
  | { type: "buyListing"; listingId: string; teamPlayerId?: string; playerId?: string; sellerTeamId?: string; price?: number }
  | { type: "ensureFixtures" }
  | { type: "playMatch" }
  | { type: "playLive"; homeScore: number; awayScore: number }
  | { type: "setTraining"; training: Training }
  | { type: "setReady" }
  | { type: "makeOffer"; listingId: string; price: number }
  | { type: "respondOffer"; offerId: string; accept: boolean }
  | { type: "setClub"; kit_primary?: string; kit_secondary?: string; kit_style?: string; stadium?: StadiumPrefs }
  | { type: "importPlayers"; players: Player[]; mode: "merge" | "replace" }
  | { type: "claimRewarded" }
  | { type: "claimGoalReward"; scored: boolean }
  | { type: "dailyLogin" }
  | { type: "claimQuest"; questId: string }
  | { type: "claimBattle"; tier: number }
  | { type: "openPack"; pay: "coins" | "gems" }
  | { type: "upgradeCard"; teamPlayerId: string; mode: "level" | "boost" | "train" }
  | { type: "advanceTutorial"; done?: boolean };

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
          return NextResponse.json(
            await actions.buyListing(session, {
              listingId: body.listingId,
              teamPlayerId: body.teamPlayerId,
              playerId: body.playerId,
              sellerTeamId: body.sellerTeamId,
              price: body.price,
            }),
          );
        case "ensureFixtures":
          return NextResponse.json(await actions.ensureFixtures(session));
        case "playMatch":
          return NextResponse.json(await actions.playMatch(session));
        case "playLive":
          return NextResponse.json(await actions.playLiveMatch(session, body.homeScore, body.awayScore));
        case "setTraining":
          return NextResponse.json(await actions.setTraining(session, body.training));
        case "setReady":
          return NextResponse.json(await actions.setReady(session));
        case "makeOffer":
          return NextResponse.json(await actions.makeOffer(session, body.listingId, body.price));
        case "respondOffer":
          return NextResponse.json(await actions.respondOffer(session, body.offerId, body.accept));
        case "setClub":
          return NextResponse.json(
            await actions.setClub(session, {
              kit_primary: body.kit_primary,
              kit_secondary: body.kit_secondary,
              kit_style: body.kit_style as import("@/lib/types").KitStyle | undefined,
              stadium: body.stadium,
            }),
          );
        case "claimRewarded":
          return NextResponse.json(await actions.claimRewarded(session));
        case "claimGoalReward":
          return NextResponse.json(await actions.claimGoalReward(session, Boolean(body.scored)));
        case "dailyLogin":
          return NextResponse.json(await actions.dailyLogin(session));
        case "claimQuest":
          return NextResponse.json(await actions.claimQuestReward(session, body.questId));
        case "claimBattle":
          return NextResponse.json(await actions.claimBattle(session, body.tier));
        case "openPack":
          return NextResponse.json(await actions.openPlayerPack(session, body.pay));
        case "upgradeCard":
          return NextResponse.json(await actions.upgradeCard(session, body.teamPlayerId, body.mode));
        case "advanceTutorial":
          return NextResponse.json(await actions.advanceTutorial(session, body.done));
        case "importPlayers":
          return NextResponse.json({ error: "Kapalı" }, { status: 404 });
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
