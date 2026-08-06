import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { ContentItem } from "@/lib/types";
import { uid } from "@/lib/utils";

/** GET /api/content?clientId=&month=&platform=&status=&q= */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const db = await readDb();
  let items = db.content;

  const clientId = p.get("clientId");
  const month = p.get("month");
  const platform = p.get("platform");
  const status = p.get("status");
  const q = p.get("q")?.toLowerCase();

  if (clientId) items = items.filter((i) => i.clientId === clientId);
  if (month) items = items.filter((i) => i.month === month);
  if (platform) items = items.filter((i) => i.platform === platform);
  if (status) items = items.filter((i) => i.status === status);
  if (q) {
    const clientNames = new Map(db.clients.map((c) => [c.id, `${c.name} ${c.brandName}`.toLowerCase()]));
    items = items.filter(
      (i) =>
        i.topic.toLowerCase().includes(q) ||
        i.caption.toLowerCase().includes(q) ||
        (clientNames.get(i.clientId) ?? "").includes(q)
    );
  }

  items = [...items].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.clientId || !body.date) {
    return NextResponse.json({ error: "clientId and date are required" }, { status: 400 });
  }
  const db = await readDb();
  const item: ContentItem = {
    id: uid(),
    clientId: body.clientId,
    month: body.date.slice(0, 7),
    date: body.date,
    time: body.time ?? "11:00",
    platform: body.platform ?? "Instagram",
    type: body.type ?? "Post",
    topic: body.topic ?? "",
    caption: body.caption ?? "",
    hashtags: body.hashtags ?? "",
    cta: body.cta ?? "",
    designer: body.designer ?? "",
    editor: body.editor ?? "",
    shooter: body.shooter ?? "",
    approval: body.approval ?? "Pending",
    status: body.status ?? "Planned",
  };
  db.content.push(item);
  await writeDb(db);
  return NextResponse.json(item, { status: 201 });
}
