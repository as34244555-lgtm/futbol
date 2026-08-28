import { NextResponse } from "next/server";
import { parseCommunityCsv, parseCommunityJson } from "@/lib/community-import";

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  let text = "";
  let kind: "json" | "csv" = "json";

  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => null);
    if (typeof body === "string") text = body;
    else text = JSON.stringify(body);
    kind = "json";
  } else {
    text = await req.text();
    kind = text.trim().startsWith("{") || text.trim().startsWith("[") ? "json" : "csv";
  }

  const result = kind === "csv" ? parseCommunityCsv(text) : parseCommunityJson(text);
  if (!result.ok) {
    return NextResponse.json({ error: "İçe aktarma başarısız", ...result }, { status: 400 });
  }
  return NextResponse.json(result);
}
