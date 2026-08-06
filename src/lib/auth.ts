import crypto from "crypto";
import type { NextRequest } from "next/server";
import { readDb, writeDb } from "./db";
import type { PublicUser } from "./types";

export const SESSION_COOKIE = "cfp_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Create a session for a user and return the opaque token to set as a cookie. */
export async function createSession(userId: string): Promise<string> {
  const db = await readDb();
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  db.sessions.push({
    token,
    userId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
  });
  // Drop expired sessions opportunistically so the list doesn't grow forever.
  db.sessions = db.sessions.filter((s) => s.expiresAt > now.toISOString());
  await writeDb(db);
  return token;
}

export async function deleteSession(token: string): Promise<void> {
  const db = await readDb();
  db.sessions = db.sessions.filter((s) => s.token !== token);
  await writeDb(db);
}

/** Resolve a session token to its user, or null if missing/expired/unknown. */
export async function getSessionUser(token: string | undefined): Promise<PublicUser | null> {
  if (!token) return null;
  const db = await readDb();
  const session = db.sessions.find((s) => s.token === token);
  if (!session || session.expiresAt <= new Date().toISOString()) return null;
  const user = db.users.find((u) => u.id === session.userId);
  if (!user) return null;
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

/** Resolve the logged-in user from a route handler's request cookies. */
export async function getUserFromRequest(req: NextRequest): Promise<PublicUser | null> {
  return getSessionUser(req.cookies.get(SESSION_COOKIE)?.value);
}
