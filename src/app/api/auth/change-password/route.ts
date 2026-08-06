import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  const sessionUser = await getUserFromRequest(req);
  if (!sessionUser) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json().catch(() => ({}));
  if (!newPassword || String(newPassword).length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const db = await readDb();
  const idx = db.users.findIndex((u) => u.id === sessionUser.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!verifyPassword(currentPassword ?? "", db.users[idx].passwordHash)) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  db.users[idx] = { ...db.users[idx], passwordHash: hashPassword(newPassword) };
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
