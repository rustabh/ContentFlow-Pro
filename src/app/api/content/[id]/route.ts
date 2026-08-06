import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { applyApproval } from "@/lib/approval";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { approvalNote, approvedBy, ...fields } = body;
  const db = await readDb();
  const idx = db.content.findIndex((c) => c.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const prev = db.content[idx];
  const date: string = fields.date ?? prev.date;
  const nextApproval = fields.approval ?? prev.approval;

  const merged = {
    ...prev,
    ...fields,
    id: prev.id,
    clientId: prev.clientId,
    date,
    month: date.slice(0, 7),
  };
  db.content[idx] = applyApproval(merged, nextApproval, approvalNote ?? "", approvedBy ?? "");
  await writeDb(db);
  return NextResponse.json(db.content[idx]);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const db = await readDb();
  const before = db.content.length;
  db.content = db.content.filter((c) => c.id !== id);
  if (db.content.length === before) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
