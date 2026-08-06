import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { PLATFORMS } from "@/lib/constants";
import type { AnalyticsData, ClientAnalytics, MonthlyTrendPoint, PlatformCount } from "@/lib/types";
import { currentMonth, toMonthKey } from "@/lib/utils";

function platformBreakdownOf(items: { platform: string }[]): PlatformCount[] {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item.platform, (counts.get(item.platform) ?? 0) + 1);
  return PLATFORMS.map((platform) => ({ platform, count: counts.get(platform) ?? 0 })).filter(
    (p) => p.count > 0
  );
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const db = await readDb();
  const month = currentMonth();

  const monthItems = db.content.filter((c) => c.month === month);
  const plannedThisMonth = monthItems.length;
  const postedThisMonth = monthItems.filter((c) => c.status === "Posted").length;
  const totalPostedAllTime = db.content.filter((c) => c.status === "Posted").length;

  const monthlyTrend: MonthlyTrendPoint[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const key = toMonthKey(new Date(now.getFullYear(), now.getMonth() - i, 1));
    const items = db.content.filter((c) => c.month === key);
    monthlyTrend.push({
      month: key,
      planned: items.length,
      posted: items.filter((c) => c.status === "Posted").length,
    });
  }

  const clientAnalytics: ClientAnalytics[] = db.clients.map((client) => {
    const items = monthItems.filter((c) => c.clientId === client.id);
    const posted = items.filter((c) => c.status === "Posted");
    return {
      clientId: client.id,
      clientName: client.name,
      brandName: client.brandName,
      industry: client.industry,
      plannedThisMonth: items.length,
      postedThisMonth: posted.length,
      consistencyPct: items.length > 0 ? Math.round((posted.length / items.length) * 100) : 0,
      platformBreakdown: platformBreakdownOf(posted),
    };
  });

  const data: AnalyticsData = {
    totalPostedAllTime,
    plannedThisMonth,
    postedThisMonth,
    overallConsistencyPct:
      plannedThisMonth > 0 ? Math.round((postedThisMonth / plannedThisMonth) * 100) : 0,
    monthlyTrend,
    platformBreakdown: platformBreakdownOf(monthItems.filter((c) => c.status === "Posted")),
    clientAnalytics: clientAnalytics.sort((a, b) => b.postedThisMonth - a.postedThisMonth),
  };

  return NextResponse.json(data);
}
