import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";
import { generateMonthlyPlan, generateShootPlan } from "@/lib/generator";
import type { Client } from "@/lib/types";
import { currentMonth } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const db = await readDb();
  const client = db.clients.find((c) => c.id === id);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const db = await readDb();
  const idx = db.clients.findIndex((c) => c.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const prev = db.clients[idx];
  const updated: Client = {
    ...prev,
    ...body,
    id: prev.id,
    createdAt: prev.createdAt,
    monthlyPosts: Number(body.monthlyPosts ?? prev.monthlyPosts) || 0,
    monthlyReels: Number(body.monthlyReels ?? prev.monthlyReels) || 0,
    monthlyStories: Number(body.monthlyStories ?? prev.monthlyStories) || 0,
    shootDays: Number(body.shootDays ?? prev.shootDays) || 0,
  };
  db.clients[idx] = updated;

  // Package logic: if deliverable counts changed, rebuild the current month's
  // plan automatically — keeping anything already posted or completed.
  const packageChanged =
    prev.monthlyPosts !== updated.monthlyPosts ||
    prev.monthlyReels !== updated.monthlyReels ||
    prev.monthlyStories !== updated.monthlyStories ||
    prev.shootDays !== updated.shootDays;

  if (packageChanged) {
    const month = currentMonth();
    const posted = db.content.filter(
      (c) => c.clientId === id && c.month === month && c.status === "Posted"
    );
    db.content = db.content.filter((c) => !(c.clientId === id && c.month === month));
    let fresh = generateMonthlyPlan(
      updated,
      month,
      db.settings.postingTimes,
      db.settings.team
    );
    // Count already-posted items against the new package, one per matching type.
    for (const done of posted) {
      const i = fresh.findIndex((f) => f.type === done.type);
      if (i !== -1) fresh = fresh.filter((_, j) => j !== i);
    }
    db.content.push(...posted, ...fresh);

    const doneShoots = db.shoots.filter(
      (s) => s.clientId === id && s.month === month && s.completed
    );
    db.shoots = db.shoots.filter((s) => !(s.clientId === id && s.month === month));
    const freshShoots = generateShootPlan(updated, month).slice(doneShoots.length);
    db.shoots.push(...doneShoots, ...freshShoots);
  }

  await writeDb(db);
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const db = await readDb();
  const exists = db.clients.some((c) => c.id === id);
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  db.clients = db.clients.filter((c) => c.id !== id);
  db.content = db.content.filter((c) => c.clientId !== id);
  db.shoots = db.shoots.filter((s) => s.clientId !== id);
  db.ideas = db.ideas.filter((i) => i.clientId !== id);
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
