import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";
import { generateIdeas, generateMonthlyPlan, generateShootPlan } from "@/lib/generator";
import type { Client } from "@/lib/types";
import { currentMonth, uid } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const db = await readDb();
  return NextResponse.json(db.clients);
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Client name is required" }, { status: 400 });
  }

  const db = await readDb();
  const client: Client = {
    id: uid(),
    name: body.name.trim(),
    brandName: body.brandName ?? "",
    industry: body.industry ?? "Other",
    contactPerson: body.contactPerson ?? "",
    phone: body.phone ?? "",
    email: body.email ?? "",
    packageStart: body.packageStart ?? "",
    packageEnd: body.packageEnd ?? "",
    monthlyPosts: Number(body.monthlyPosts) || 0,
    monthlyReels: Number(body.monthlyReels) || 0,
    monthlyStories: Number(body.monthlyStories) || 0,
    shootDays: Number(body.shootDays) || 0,
    shootFrequency: body.shootFrequency ?? "Monthly",
    platforms: body.platforms?.length ? body.platforms : ["Instagram"],
    notes: body.notes ?? "",
    createdAt: new Date().toISOString(),
  };
  db.clients.push(client);

  // Auto-generate this month's plan, shoots and starter ideas for the new client.
  const month = currentMonth();
  db.content.push(
    ...generateMonthlyPlan(client, month, db.settings.postingTimes, db.settings.team)
  );
  db.shoots.push(...generateShootPlan(client, month));
  db.ideas.push(...generateIdeas(client, 4));

  await writeDb(db);
  return NextResponse.json(client, { status: 201 });
}
