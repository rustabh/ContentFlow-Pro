import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { generateMonthlyPlan, generateShootPlan } from "@/lib/generator";

/**
 * POST { clientId, month } — (re)generate the monthly content plan and shoot
 * plan for a client. Existing items for that month are replaced, except
 * anything already Posted / completed.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clientId, month } = body;
  if (!clientId || !month) {
    return NextResponse.json({ error: "clientId and month are required" }, { status: 400 });
  }

  const db = readDb();
  const client = db.clients.find((c) => c.id === clientId);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const posted = db.content.filter(
    (c) => c.clientId === clientId && c.month === month && c.status === "Posted"
  );
  db.content = db.content.filter((c) => !(c.clientId === clientId && c.month === month));
  let fresh = generateMonthlyPlan(client, month, db.settings.postingTimes, db.settings.team);
  for (const done of posted) {
    const i = fresh.findIndex((f) => f.type === done.type);
    if (i !== -1) fresh = fresh.filter((_, j) => j !== i);
  }
  db.content.push(...posted, ...fresh);

  const doneShoots = db.shoots.filter(
    (s) => s.clientId === clientId && s.month === month && s.completed
  );
  db.shoots = db.shoots.filter((s) => !(s.clientId === clientId && s.month === month));
  const freshShoots = generateShootPlan(client, month).slice(doneShoots.length);
  db.shoots.push(...doneShoots, ...freshShoots);

  writeDb(db);
  return NextResponse.json({
    content: posted.length + fresh.length,
    shoots: doneShoots.length + freshShoots.length,
  });
}
