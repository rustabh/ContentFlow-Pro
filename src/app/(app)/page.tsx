"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Card, PageHeader, ProgressBar, Spinner, StatCard } from "@/components/ui";
import { STATUS_COLORS, TYPE_COLORS } from "@/lib/constants";
import type { DashboardData } from "@/lib/types";
import { currentMonth, daysInMonth, formatDate, formatTime, monthLabel, todayISO } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Agency overview for ${monthLabel(currentMonth())}`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Clients"
          value={data.totalClients}
          icon={<UsersIcon />}
        />
        <StatCard
          label="Active Clients"
          value={data.activeClients}
          hint="within package dates"
          icon={<PulseIcon />}
        />
        <StatCard
          label="Posts Remaining"
          value={data.postsRemaining}
          hint="this month"
          icon={<GridIcon />}
        />
        <StatCard
          label="Reels Remaining"
          value={data.reelsRemaining}
          hint="this month"
          icon={<PlayIcon />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* This week */}
        <Card className="lg:col-span-2">
          <SectionTitle title="This Week's Schedule" href="/planner" />
          {data.thisWeek.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              Nothing scheduled in the next 7 days.
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.thisWeek.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-2.5">
                  <div className="w-24 shrink-0 text-xs font-medium text-gray-500">
                    {formatDate(item.date)}
                    <div className="text-[11px] text-gray-400">
                      {formatTime(item.time)}
                    </div>
                  </div>
                  <Badge color={TYPE_COLORS[item.type]}>{item.type}</Badge>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-800">
                      {item.topic || "Untitled"}
                    </div>
                    <div className="text-xs text-gray-400">
                      {item.clientName} · {item.platform}
                    </div>
                  </div>
                  <Badge color={STATUS_COLORS[item.status]}>{item.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming shoots */}
        <Card>
          <SectionTitle title="Upcoming Shoots" href="/shoots" />
          {data.upcomingShoots.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              No upcoming shoots.
            </p>
          ) : (
            <div className="space-y-3">
              {data.upcomingShoots.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5"
                >
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-white text-primary-600 shadow-sm">
                    <span className="text-sm font-bold leading-none">
                      {Number(s.date.slice(8, 10))}
                    </span>
                    <span className="text-[9px] uppercase text-gray-400">
                      {formatDate(s.date).split(" ")[1]}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-800">
                      {s.clientName}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatTime(s.time)}
                      {s.location ? ` · ${s.location}` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Progress */}
        <Card className="lg:col-span-2">
          <SectionTitle title="Monthly Progress" href="/planner" />
          {data.progress.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              Add a client to start tracking progress.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {data.progress.map((p) => (
                <div key={p.clientId} className="rounded-xl border border-gray-100 p-4">
                  <div className="mb-3 text-sm font-semibold text-gray-800">
                    {p.brandName || p.clientName}
                  </div>
                  <div className="space-y-2.5">
                    <ProgressBar label="Posts" done={p.posts.done} total={p.posts.total} />
                    <ProgressBar label="Reels" done={p.reels.done} total={p.reels.total} />
                    <ProgressBar label="Stories" done={p.stories.done} total={p.stories.total} />
                    <ProgressBar label="Shoot Days" done={p.shoots.done} total={p.shoots.total} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Calendar preview */}
        <Card>
          <SectionTitle title="Calendar Preview" href="/calendar" />
          <MiniCalendar counts={countByDay(data)} />
        </Card>
      </div>
    </div>
  );
}

function countByDay(data: DashboardData): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const item of data.monthItems) {
    const day = Number(item.date.slice(8, 10));
    counts[day] = (counts[day] ?? 0) + 1;
  }
  return counts;
}

function MiniCalendar({ counts }: { counts: Record<number, number> }) {
  const month = currentMonth();
  const [y, m] = month.split("-").map(Number);
  const firstDow = new Date(y, m - 1, 1).getDay();
  const total = daysInMonth(month);
  const today = Number(todayISO().slice(8, 10));

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-gray-400">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => (
          <Link
            href="/calendar"
            key={i}
            className={`relative flex aspect-square items-center justify-center rounded-lg text-xs ${
              day === null
                ? "pointer-events-none"
                : day === today
                  ? "bg-primary-500 font-bold text-white"
                  : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {day}
            {day !== null && (counts[day] ?? 0) > 0 && day !== today && (
              <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary-400" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      <Link
        href={href}
        className="text-xs font-medium text-primary-500 hover:text-primary-600"
      >
        View all →
      </Link>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M15 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PulseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M10 8.5l6 3.5-6 3.5v-7z" strokeLinejoin="round" />
    </svg>
  );
}
