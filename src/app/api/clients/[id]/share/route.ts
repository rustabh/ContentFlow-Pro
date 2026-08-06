import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

/** POST — return the client's existing share token, or mint one. Pass { rotate: true } to replace it. */
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const db = await readDb();
  const idx = db.clients.findIndex((c) => c.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const client = db.clients[idx];
  if (!client.shareToken || body.rotate) {
    db.clients[idx] = { ...client, shareToken: crypto.randomBytes(24).toString("hex") };
    await writeDb(db);
  }
  return NextResponse.json({ shareToken: db.clients[idx].shareToken });
}
