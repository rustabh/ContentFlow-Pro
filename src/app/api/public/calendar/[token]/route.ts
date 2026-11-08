import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { buildIcsCalendar } from "@/lib/ics";
import { todayISO } from "@/lib/utils";

type Params = { params: Promise<{ token: string }> };

const PAST_DAYS = 7;
const FUTURE_DAYS = 90;

/**
 * Public, unauthenticated, token-gated .ics feed of a client's content
 * calendar — subscribe from Google Calendar / Outlook / Apple Calendar using
 * the same share token as the approval page (Clients → Share Link).
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  const db = await readDb();
  const client = db.clients.find((c) => c.shareToken === token);
  if (!client) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });

  const today = todayISO();
  const past = new Date(today);
  past.setDate(past.getDate() - PAST_DAYS);
  const future = new Date(today);
  future.setDate(future.getDate() + FUTURE_DAYS);
  const pastKey = past.toISOString().slice(0, 10);
  const futureKey = future.toISOString().slice(0, 10);

  const items = db.content
    .filter((c) => c.clientId === client.id && c.date >= pastKey && c.date <= futureKey)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const ics = buildIcsCalendar(items, `${client.brandName || client.name} Content Calendar`);
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${(client.brandName || client.name).replace(/[^a-zA-Z0-9]+/g, "-")}-calendar.ics"`,
    },
  });
}
