import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { processDueQueue } from "@/lib/queueProcessor";
import type { QueueItem } from "@/lib/types";

/**
 * The scheduling queue: every content item marked "Scheduled" is due to go
 * out at its date/time. If the client has connected the item's platform
 * (see ClientForm "Platform Connections"), processing attempts a real
 * publish; otherwise the item is just marked Posted (manual workflow).
 * Due items are also auto-processed every 15 minutes by a Netlify scheduled
 * function (netlify/functions/auto-publish.ts) — the "Run Due Posts" button
 * below is for publishing immediately rather than waiting for that run.
 */

function clientNameOf(clients: { id: string; name: string; brandName: string }[], id: string) {
  const c = clients.find((c) => c.id === id);
  return c?.brandName || c?.name || "Unknown";
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
 * POST { action: "process" } — publish every due "Scheduled" item now
 * instead of waiting for the next scheduled auto-publish run. See
 * `processDueQueue` for the actual publish/fallback behavior.
 */
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body.action !== "process") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const result = await processDueQueue();
  return NextResponse.json(result);
}
