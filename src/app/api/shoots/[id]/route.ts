import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const db = await readDb();
  const idx = db.shoots.findIndex((s) => s.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const prev = db.shoots[idx];
  const date: string = body.date ?? prev.date;
  db.shoots[idx] = {
    ...prev,
    ...body,
    id: prev.id,
    clientId: prev.clientId,
    date,
    month: date.slice(0, 7),
  };
  await writeDb(db);
  return NextResponse.json(db.shoots[idx]);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const db = await readDb();
  const before = db.shoots.length;
  db.shoots = db.shoots.filter((s) => s.id !== id);
  if (db.shoots.length === before) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
