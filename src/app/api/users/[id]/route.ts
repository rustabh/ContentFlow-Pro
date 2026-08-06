import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";
import { hashPassword } from "@/lib/password";

type Params = { params: Promise<{ id: string }> };

/** PUT { password } — reset a teammate's password (no email-reset flow exists, so this is admin-assisted). */
export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const { password } = await req.json().catch(() => ({}));
  if (!password || String(password).length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const db = await readDb();
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  db.users[idx] = { ...db.users[idx], passwordHash: hashPassword(password) };
  await writeDb(db);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const db = await readDb();
  if (db.users.length <= 1) {
    return NextResponse.json({ error: "Can't remove the last remaining login" }, { status: 400 });
  }
  const before = db.users.length;
  db.users = db.users.filter((u) => u.id !== id);
  if (db.users.length === before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  db.sessions = db.sessions.filter((s) => s.userId !== id);
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
