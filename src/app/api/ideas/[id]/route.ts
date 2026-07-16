import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const db = readDb();
  const idx = db.ideas.findIndex((i) => i.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.ideas[idx] = { ...db.ideas[idx], ...body, id };
  writeDb(db);
  return NextResponse.json(db.ideas[idx]);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const db = readDb();
  const before = db.ideas.length;
  db.ideas = db.ideas.filter((i) => i.id !== id);
  if (db.ideas.length === before) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  writeDb(db);
  return NextResponse.json({ ok: true });
}
