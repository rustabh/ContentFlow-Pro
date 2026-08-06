import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { publishToMeta } from "@/lib/metaPublish";
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

/**
 * POST { action: "process" } — mark every due "Scheduled" item as "Posted".
 * If the client has connected the item's platform (Instagram/Facebook via
 * the Meta Graph API — see ClientForm "Platform Connections"), this attempts
 * a real publish first and only marks the item Posted on success; a failed
 * publish stays Scheduled with `postError` set so it's retried, not silently
 * dropped. Without a connection, items are marked Posted directly (manual
 * posting workflow), same as before.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body.action !== "process") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const db = await readDb();
  const nowIso = new Date().toISOString();
  const nowKey = nowIso.slice(0, 16);

  const processed: string[] = [];
  const failed: string[] = [];

  for (let i = 0; i < db.content.length; i++) {
    const item = db.content[i];
    if (item.status !== "Scheduled") continue;
    if (`${item.date}T${item.time}` > nowKey) continue;

    const client = db.clients.find((c) => c.id === item.clientId);
    const connection = client?.connections?.[item.platform];

    if (connection && (item.platform === "Instagram" || item.platform === "Facebook")) {
      const result = await publishToMeta(item.platform, connection, item);
      if (result.ok) {
        db.content[i] = { ...item, status: "Posted", postedAt: nowIso, postError: undefined };
        processed.push(item.id);
      } else {
        db.content[i] = { ...item, postError: result.error };
        failed.push(item.id);
      }
    } else {
      db.content[i] = { ...item, status: "Posted", postedAt: nowIso };
      processed.push(item.id);
    }
  }

  if (processed.length > 0 || failed.length > 0) await writeDb(db);
  return NextResponse.json({ processed: processed.length, failed: failed.length, ids: processed });
}
