import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { applyApproval } from "@/lib/approval";
import type { PublicApprovalItem } from "@/lib/types";
import { currentMonth } from "@/lib/utils";

type Params = { params: Promise<{ token: string }> };

function toPublicItem(c: {
  id: string;
  date: string;
  time: string;
  platform: PublicApprovalItem["platform"];
  type: PublicApprovalItem["type"];
  topic: string;
  caption: string;
  hashtags: string;
  cta: string;
  approval: PublicApprovalItem["approval"];
  status: PublicApprovalItem["status"];
  mediaKey?: string;
  mediaContentType?: string;
}): PublicApprovalItem {
  const { id, date, time, platform, type, topic, caption, hashtags, cta, approval, status, mediaKey, mediaContentType } = c;
  return { id, date, time, platform, type, topic, caption, hashtags, cta, approval, status, mediaKey, mediaContentType };
}

/** Public, unauthenticated, token-gated read of a client's current month plan. */
export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  const db = await readDb();
  const client = db.clients.find((c) => c.shareToken === token);
  if (!client) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });

  const month = currentMonth();
  const items = db.content
    .filter((c) => c.clientId === client.id && c.month === month)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .map(toPublicItem);

  return NextResponse.json({
    clientName: client.brandName || client.name,
    agencyName: db.settings.agencyName,
    month,
    items,
  });
}

/** Public, unauthenticated, token-gated approval decision on one content item. */
export async function PUT(req: NextRequest, { params }: Params) {
  const { token } = await params;
  const body = await req.json().catch(() => ({}));
  const { itemId, approval, note } = body;
  if (!itemId || !approval) {
    return NextResponse.json({ error: "itemId and approval are required" }, { status: 400 });
  }

  const db = await readDb();
  const client = db.clients.find((c) => c.shareToken === token);
  if (!client) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });

  const idx = db.content.findIndex((c) => c.id === itemId && c.clientId === client.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  db.content[idx] = applyApproval(db.content[idx], approval, note ?? "", "Client");
  await writeDb(db);
  return NextResponse.json(toPublicItem(db.content[idx]));
}
