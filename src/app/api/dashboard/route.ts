import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { readDb } from "@/lib/db";
import type { ClientProgress, DashboardData, Notification } from "@/lib/types";
import { currentMonth, formatDate, isClientActive, todayISO } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const db = await readDb();
  const month = currentMonth();
  const today = todayISO();
  const clientName = (id: string) =>
    db.clients.find((c) => c.id === id)?.brandName ||
    db.clients.find((c) => c.id === id)?.name ||
    "Unknown";

  const monthItems = db.content.filter((c) => c.month === month);
  const monthShoots = db.shoots.filter((s) => s.month === month);

  // Remaining = planned this month but not yet posted.
  const postsRemaining = monthItems.filter(
    (c) => (c.type === "Post" || c.type === "Carousel") && c.status !== "Posted"
  ).length;
  const reelsRemaining = monthItems.filter(
    (c) => c.type === "Reel" && c.status !== "Posted"
  ).length;

  const in7 = new Date();
  in7.setDate(in7.getDate() + 7);
  const week = `${in7.getFullYear()}-${String(in7.getMonth() + 1).padStart(2, "0")}-${String(in7.getDate()).padStart(2, "0")}`;

  const upcomingShoots = db.shoots
    .filter((s) => !s.completed && s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)
    .map((s) => ({ ...s, clientName: clientName(s.clientId) }));

  const thisWeek = db.content
    .filter((c) => c.date >= today && c.date <= week && c.status !== "Posted")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 8)
    .map((c) => ({ ...c, clientName: clientName(c.clientId) }));

  const progress: ClientProgress[] = db.clients.map((client) => {
    const items = monthItems.filter((c) => c.clientId === client.id);
    const shoots = monthShoots.filter((s) => s.clientId === client.id);
    const done = (pred: (t: string) => boolean) =>
      items.filter((c) => pred(c.type) && c.status === "Posted").length;
    return {
      clientId: client.id,
      clientName: client.name,
      brandName: client.brandName,
      posts: {
        done: done((t) => t === "Post" || t === "Carousel"),
        total: client.monthlyPosts,
      },
      reels: { done: done((t) => t === "Reel"), total: client.monthlyReels },
      stories: { done: done((t) => t === "Story"), total: client.monthlyStories },
      shoots: {
        done: shoots.filter((s) => s.completed).length,
        total: client.shootDays,
      },
    };
  });

  const notifications: Notification[] = [];
  const overdueScheduled = db.content.filter(
    (c) => c.status === "Scheduled" && `${c.date}T${c.time}` < new Date().toISOString().slice(0, 16)
  ).length;
  if (overdueScheduled > 0) {
    notifications.push({
      id: "overdue-queue",
      title: `${overdueScheduled} scheduled post${overdueScheduled > 1 ? "s" : ""} overdue`,
      detail: "Past their scheduled time and still waiting in the queue",
      href: "/queue",
    });
  }
  for (const s of upcomingShoots.slice(0, 3)) {
    notifications.push({
      id: `shoot-${s.id}`,
      title: `Shoot: ${s.clientName}`,
      detail: `${formatDate(s.date)} at ${s.time}${s.location ? ` — ${s.location}` : ""}`,
      href: "/shoots",
    });
  }
  const pendingApproval = monthItems.filter((c) => c.status === "Approval").length;
  if (pendingApproval > 0) {
    notifications.push({
      id: "approvals",
      title: `${pendingApproval} item${pendingApproval > 1 ? "s" : ""} awaiting approval`,
      detail: "Review and approve to keep the schedule on track",
      href: "/planner",
    });
  }
  const in14 = new Date();
  in14.setDate(in14.getDate() + 14);
  const soon = `${in14.getFullYear()}-${String(in14.getMonth() + 1).padStart(2, "0")}-${String(in14.getDate()).padStart(2, "0")}`;
  for (const c of db.clients) {
    if (c.packageEnd && c.packageEnd >= today && c.packageEnd <= soon) {
      notifications.push({
        id: `pkg-${c.id}`,
        title: `${c.brandName || c.name} package ends soon`,
        detail: `Ends ${formatDate(c.packageEnd)} — time to discuss renewal`,
        href: "/clients",
      });
    }
  }

  const data: DashboardData = {
    totalClients: db.clients.length,
    activeClients: db.clients.filter((c) =>
      isClientActive(c.packageStart, c.packageEnd)
    ).length,
    postsRemaining,
    reelsRemaining,
    upcomingShoots,
    thisWeek,
    monthItems,
    progress,
    notifications,
  };
  return NextResponse.json(data);
}
