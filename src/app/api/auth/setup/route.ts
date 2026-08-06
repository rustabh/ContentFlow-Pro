import { NextRequest, NextResponse } from "next/server";
import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { uid } from "@/lib/utils";

/** GET — whether the app has no accounts yet (first-run state). */
export async function GET() {
  const db = await readDb();
  return NextResponse.json({ needsSetup: db.users.length === 0 });
}

/**
 * POST { username, password } — create the very first account. Only works
 * while no accounts exist; once one is created, use /api/users (authenticated)
 * to add teammates instead.
 */
export async function POST(req: NextRequest) {
  const db = await readDb();
  if (db.users.length > 0) {
    return NextResponse.json({ error: "Setup already completed" }, { status: 409 });
  }

  const { username, password } = await req.json().catch(() => ({}));
  const trimmed = String(username ?? "").trim();
  if (!trimmed) return NextResponse.json({ error: "Username is required" }, { status: 400 });
  if (!password || String(password).length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const user = {
    id: uid(),
    username: trimmed,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  await writeDb(db);

  const token = await createSession(user.id);
  const res = NextResponse.json({ ok: true, username: user.username });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
