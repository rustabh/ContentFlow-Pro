import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { QueueItem } from "@/lib/types";

/**
 * The scheduling queue: every content item marked "Scheduled" is due to go
 * out at its date/time. This is the foundation for real auto-posting —
 * once a client connects a platform account, the POST handler below is
 * where the actual publish call (Meta Graph API, etc.) would happen instead
 * of just flipping the status to "Posted".
 */

function clientNameOf(clients: { id: string; name: string; brandName: string }[], id: string) {
  const c = clients.find((c) => c.id === id);
  return c?.brandName || c?.name || "Unknown";
}

export async function GET() {
  const db = await readDb();
  const nowStamp = new Date();
  const nowKey = `${nowStamp.getFullYear()}-${String(nowStamp.getMonth() + 1).padStart(2, "0")}-${String(
    nowStamp.getDate()
  ).padStart(2, "0")}T${String(nowStamp.getHours()).padStart(2, "0")}:${String(
    nowStamp.getMinutes()
  ).padStart(2, "0")}`;

  const items: QueueItem[] = db.content
    .filter((c) => c.status === "Scheduled")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .map((c) => ({ ...c, clientName: clientNameOf(db.clients, c.clientId) }));

  const dueNow = items.filter((i) => `${i.date}T${i.time}` <= nowKey).length;

  return NextResponse.json({ items, dueNow, serverTime: nowStamp.toISOString() });
}

/** POST { action: "process" } — mark every due "Scheduled" item as "Posted". */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body.action !== "process") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const db = await readDb();
  const now = new Date();
  const nowIso = now.toISOString();
  const nowKey = nowIso.slice(0, 16);

  const processed: string[] = [];
  db.content = db.content.map((c) => {
    if (c.status !== "Scheduled") return c;
    if (`${c.date}T${c.time}` > nowKey) return c;
    processed.push(c.id);
    return { ...c, status: "Posted", postedAt: nowIso };
  });

  if (processed.length > 0) await writeDb(db);
  return NextResponse.json({ processed: processed.length, ids: processed });
}
