import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Kapalı" }, { status: 404 });
}

export async function GET() {
  return NextResponse.json({ error: "Kapalı" }, { status: 404 });
}
