import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import type { PublicUser, User } from "@/lib/types";
import { uid } from "@/lib/utils";

function toPublicUser({ passwordHash: _passwordHash, ...user }: User): PublicUser {
  return user;
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const db = await readDb();
  return NextResponse.json(db.users.map(toPublicUser));
}

/** POST { username, password } — add a teammate login. */
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { username, password } = await req.json().catch(() => ({}));
  const trimmed = String(username ?? "").trim();
  if (!trimmed) return NextResponse.json({ error: "Username is required" }, { status: 400 });
  if (!password || String(password).length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const db = await readDb();
  if (db.users.some((u) => u.username.toLowerCase() === trimmed.toLowerCase())) {
    return NextResponse.json({ error: "That username is already taken" }, { status: 409 });
  }

  const newUser = {
    id: uid(),
    username: trimmed,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  db.users.push(newUser);
  await writeDb(db);
  return NextResponse.json(toPublicUser(newUser), { status: 201 });
}
