import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { Shoot } from "@/lib/types";
import { uid } from "@/lib/utils";

/** GET /api/shoots?clientId=&month= */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const db = readDb();
  let shoots = db.shoots;
  const clientId = p.get("clientId");
  const month = p.get("month");
  if (clientId) shoots = shoots.filter((s) => s.clientId === clientId);
  if (month) shoots = shoots.filter((s) => s.month === month);
  shoots = [...shoots].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return NextResponse.json(shoots);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.clientId || !body.date) {
    return NextResponse.json({ error: "clientId and date are required" }, { status: 400 });
  }
  const db = readDb();
  const shoot: Shoot = {
    id: uid(),
    clientId: body.clientId,
    month: body.date.slice(0, 7),
    date: body.date,
    time: body.time ?? "10:00",
    location: body.location ?? "",
    products: body.products ?? "",
    models: body.models ?? "",
    equipment: body.equipment ?? "",
    shotList: body.shotList ?? "",
    referenceLink: body.referenceLink ?? "",
    completed: Boolean(body.completed),
  };
  db.shoots.push(shoot);
  writeDb(db);
  return NextResponse.json(shoot, { status: 201 });
}
