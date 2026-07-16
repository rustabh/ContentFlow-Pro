import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { generateIdeas } from "@/lib/generator";

/** GET /api/ideas?clientId= */
export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("clientId");
  const db = readDb();
  let ideas = db.ideas;
  if (clientId) ideas = ideas.filter((i) => i.clientId === clientId);
  return NextResponse.json(ideas);
}

/** POST { clientId } — generate a fresh batch of ideas for the client's industry. */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = readDb();
  const client = db.clients.find((c) => c.id === body.clientId);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const ideas = generateIdeas(client, Number(body.count) || 6);
  db.ideas.push(...ideas);
  writeDb(db);
  return NextResponse.json(ideas, { status: 201 });
}
