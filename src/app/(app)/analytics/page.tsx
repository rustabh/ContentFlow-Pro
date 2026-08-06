"use client";

import { useEffect, useState } from "react";
import { Card, PageHeader, ProgressBar, Spinner, StatCard } from "@/components/ui";
import { PLATFORM_COLORS } from "@/lib/constants";
import type { AnalyticsData } from "@/lib/types";
import { monthLabel } from "@/lib/utils";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return <Spinner />;

  const trendMax = Math.max(1, ...data.monthlyTrend.map((t) => t.planned));

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Posting consistency and performance across all clients" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Posted All-Time" value={data.totalPostedAllTime} />
        <StatCard label="Planned This Month" value={data.plannedThisMonth} />
        <StatCard label="Posted This Month" value={data.postedThisMonth} />
        <StatCard
          label="Consistency"
          value={`${data.overallConsistencyPct}%`}
          hint="posted vs planned, this month"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">6-Month Trend</h2>
          <div className="flex h-40 items-end justify-between gap-3">
            {data.monthlyTrend.map((t) => (
              <div key={t.month} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-32 w-full items-end justify-center gap-1">
                  <div
                    className="w-3 rounded-t-md bg-gray-200"
                    style={{ height: `${Math.max(4, (t.planned / trendMax) * 100)}%` }}
                    title={`Planned: ${t.planned}`}
                  />
                  <div
                    className="w-3 rounded-t-md bg-gradient-to-t from-brand-violet to-brand-magenta"
                    style={{ height: `${Math.max(4, (t.posted / trendMax) * 100)}%` }}
                    title={`Posted: ${t.posted}`}
                  />
                </div>
                <div className="text-[10px] font-medium text-gray-400">
                  {monthLabel(t.month).split(" ")[0].slice(0, 3)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gray-200" /> Planned
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-brand-violet to-brand-magenta" />{" "}
              Posted
            </span>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-gray-800">Platform Mix (Posted, This Month)</h2>
          {data.platformBreakdown.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">Nothing posted yet this month.</p>
          ) : (
            <div className="space-y-3">
              {data.platformBreakdown.map((p) => {
                const max = Math.max(...data.platformBreakdown.map((x) => x.count));
                return (
                  <div key={p.platform}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-600">{p.platform}</span>
                      <span className="tabular-nums text-gray-400">{p.count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-violet to-brand-magenta"
                        style={{ width: `${(p.count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="mb-4 text-sm font-semibold text-gray-800">Client Performance (This Month)</h2>
        {data.clientAnalytics.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">Add a client to see performance data.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.clientAnalytics.map((c) => (
              <div key={c.clientId} className="rounded-xl border border-gray-100 p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">
                    {c.brandName || c.clientName}
                  </span>
                  <span className="text-xs font-medium text-primary-500">{c.consistencyPct}%</span>
                </div>
                <div className="mb-3 text-xs text-gray-400">{c.industry}</div>
                <ProgressBar done={c.postedThisMonth} total={c.plannedThisMonth} label="Posted" />
                {c.platformBreakdown.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.platformBreakdown.map((p) => (
                      <span
                        key={p.platform}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PLATFORM_COLORS[p.platform]}`}
                      >
                        {p.platform} · {p.count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
