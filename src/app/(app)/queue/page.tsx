"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ContentEditModal from "@/components/planner/ContentEditModal";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Spinner,
} from "@/components/ui";
import { PLATFORM_COLORS, TYPE_COLORS } from "@/lib/constants";
import type { ContentItem, QueueItem } from "@/lib/types";
import { formatDate, formatTime, todayISO } from "@/lib/utils";

type Bucket = "overdue" | "today" | "upcoming";

export default function QueuePage() {
  const [items, setItems] = useState<QueueItem[] | null>(null);
  const [dueNow, setDueNow] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [editing, setEditing] = useState<ContentItem | null>(null);

  const load = useCallback(() => {
    fetch("/api/queue")
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items);
        setDueNow(data.dueNow);
      })
      .catch(() => {});
  }, []);

  useEffect(load, [load]);

  const runDue = async () => {
    setProcessing(true);
    await fetch("/api/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "process" }),
    });
    setProcessing(false);
    load();
  };

  const grouped = useMemo(() => {
    if (!items) return null;
    const today = todayISO();
    const buckets: Record<Bucket, QueueItem[]> = { overdue: [], today: [], upcoming: [] };
    for (const item of items) {
      const bucket: Bucket = item.date < today ? "overdue" : item.date === today ? "today" : "upcoming";
      buckets[bucket].push(item);
    }
    return buckets;
  }, [items]);

  if (!items || !grouped) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Scheduling Queue"
        subtitle="Everything marked Scheduled, in the order it's due to go out"
        actions={
          <Button onClick={runDue} disabled={processing || dueNow === 0}>
            {processing ? "Processing…" : `▶ Run Due Posts${dueNow > 0 ? ` (${dueNow})` : ""}`}
          </Button>
        }
      />

      <Card className="mb-4 flex items-start gap-3 border-primary-100 bg-primary-50/40">
        <span className="mt-0.5 text-primary-500">ℹ️</span>
        <p className="text-xs leading-relaxed text-gray-600">
          <strong>Run Due Posts</strong> publishes due items automatically for any client with a
          connected Instagram, Facebook, LinkedIn or YouTube account (set this up per-client under
          Clients → Edit → Platform Connections). Clients without a connection — or platforms with
          no connection set — just get marked Posted, for a manual workflow. A failed publish stays
          in the queue with the error shown below — nothing is silently dropped.
        </p>
      </Card>

      {items.length === 0 ? (
        <EmptyState
          title="Nothing in the queue"
          hint="Move a content item to 'Scheduled' status in the Planner to see it here."
        />
      ) : (
        <div className="space-y-6">
          <QueueSection
            title="Overdue"
            hint="Past their scheduled time and not yet posted"
            items={grouped.overdue}
            tone="danger"
            onEdit={setEditing}
          />
          <QueueSection
            title="Due Today"
            items={grouped.today}
            tone="warning"
            onEdit={setEditing}
          />
          <QueueSection
            title="Upcoming"
            items={grouped.upcoming}
            tone="default"
            onEdit={setEditing}
          />
        </div>
      )}

      <ContentEditModal
        item={editing}
        onClose={() => setEditing(null)}
        onSaved={() => load()}
        onDeleted={() => load()}
      />
    </div>
  );
}

function QueueSection({
  title,
  hint,
  items,
  tone,
  onEdit,
}: {
  title: string;
  hint?: string;
  items: QueueItem[];
  tone: "danger" | "warning" | "default";
  onEdit: (item: ContentItem) => void;
}) {
  if (items.length === 0) return null;
  const dot = { danger: "bg-red-500", warning: "bg-amber-500", default: "bg-teal-500" }[tone];
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <h2 className="text-sm font-semibold text-gray-800">
          {title} <span className="font-normal text-gray-400">({items.length})</span>
        </h2>
        {hint && <span className="text-xs text-gray-400">— {hint}</span>}
      </div>
      <Card className="divide-y divide-gray-50 p-0">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-primary-50/40"
            onClick={() => onEdit(item)}
          >
            <div className="w-28 shrink-0 text-xs font-medium text-gray-500">
              {formatDate(item.date)}
              <div className="text-[11px] text-gray-400">{formatTime(item.time)}</div>
            </div>
            <Badge color={PLATFORM_COLORS[item.platform]}>{item.platform}</Badge>
            <Badge color={TYPE_COLORS[item.type]}>{item.type}</Badge>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-gray-800">
                {item.topic || "Untitled"}
              </div>
              <div className="text-xs text-gray-400">{item.clientName}</div>
              {item.postError && (
                <div className="mt-0.5 truncate text-xs text-red-500">
                  Publish failed: {item.postError}
                </div>
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
