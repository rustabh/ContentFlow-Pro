import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { generateAiCaption } from "@/lib/ai";
import { readDb } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

/** AI-rewrite a content item's caption/hashtags/CTA via Claude. Returns the suggestion without saving it — the editor applies it to the draft and the user still has to hit Save. */
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const db = await readDb();
  const item = db.content.find((c) => c.id === id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const client = db.clients.find((c) => c.id === item.clientId);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const result = await generateAiCaption(client, item);
  if (!result) {
    return NextResponse.json(
      { error: "AI rewrite unavailable — check ANTHROPIC_API_KEY is set" },
      { status: 503 }
    );
  }
  return NextResponse.json(result);
}
