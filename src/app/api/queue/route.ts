import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";
import { publishToLinkedIn } from "@/lib/linkedinPublish";
import { publishToMeta } from "@/lib/metaPublish";
import type { ContentItem, PlatformConnection, QueueItem } from "@/lib/types";
import { publishToYouTube } from "@/lib/youtubePublish";

/**
 * The scheduling queue: every content item marked "Scheduled" is due to go
 * out at its date/time. If the client has connected the item's platform
 * (see ClientForm "Platform Connections"), processing attempts a real
 * publish; otherwise the item is just marked Posted (manual workflow).
 */

function clientNameOf(clients: { id: string; name: string; brandName: string }[], id: string) {
  const c = clients.find((c) => c.id === id);
  return c?.brandName || c?.name || "Unknown";
}

/** Dispatch a publish attempt to the right platform API, or null if the platform has no real integration yet. */
async function publishTo(
  platform: ContentItem["platform"],
  connection: PlatformConnection,
  item: ContentItem
): Promise<{ ok: true } | { ok: false; error: string } | null> {
  switch (platform) {
    case "Instagram":
    case "Facebook":
      return publishToMeta(platform, connection, item);
    case "LinkedIn":
      return publishToLinkedIn(connection, item);
    case "YouTube":
      return publishToYouTube(connection, item);
    default:
      return null;
  }
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

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
 * If the client has connected the item's platform (Instagram, Facebook,
 * LinkedIn or YouTube — see ClientForm "Platform Connections"), this
 * attempts a real publish first and only marks the item Posted on success;
 * a failed publish stays Scheduled with `postError` set so it's retried,
 * not silently dropped. Without a connection (or for platforms with no
 * real integration yet — Pinterest, TikTok, X, Threads), items are marked
 * Posted directly (manual posting workflow), same as before.
 */
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

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
    const result = connection ? await publishTo(item.platform, connection, item) : null;

    if (result === null) {
      db.content[i] = { ...item, status: "Posted", postedAt: nowIso };
      processed.push(item.id);
    } else if (result.ok) {
      db.content[i] = { ...item, status: "Posted", postedAt: nowIso, postError: undefined };
      processed.push(item.id);
    } else {
      db.content[i] = { ...item, postError: result.error };
      failed.push(item.id);
    }
  }

  if (processed.length > 0 || failed.length > 0) await writeDb(db);
  return NextResponse.json({ processed: processed.length, failed: failed.length, ids: processed });
}
