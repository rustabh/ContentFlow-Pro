import { NextRequest, NextResponse } from "next/server";
import { readDb, resetDb, writeDb } from "@/lib/db";

export async function GET() {
  const db = readDb();
  return NextResponse.json(db.settings);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const db = readDb();
  db.settings = { ...db.settings, ...body };
  writeDb(db);
  return NextResponse.json(db.settings);
}

/** POST { action: "reset" } — reset the local store to fresh sample data. */
export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.action === "reset") {
    resetDb();
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
