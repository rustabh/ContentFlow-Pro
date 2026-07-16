"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearch } from "@/components/layout/SearchProvider";
import ContentEditModal from "@/components/planner/ContentEditModal";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  ProgressBar,
  Select,
  Spinner,
} from "@/components/ui";
import {
  PLATFORMS,
  PLATFORM_COLORS,
  STATUSES,
  STATUS_COLORS,
  TYPE_COLORS,
} from "@/lib/constants";
import type { Client, ContentItem } from "@/lib/types";
import { currentMonth, formatDate, formatTime, monthLabel, monthOptions } from "@/lib/utils";

export default function PlannerPage() {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [items, setItems] = useState<ContentItem[] | null>(null);
  const [clientId, setClientId] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [platform, setPlatform] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [generating, setGenerating] = useState(false);
  const { query } = useSearch();

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((list: Client[]) => {
        setClients(list);
        if (list.length > 0) setClientId((id) => id || list[0].id);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    if (!clientId) {
      setItems([]);
      return;
    }
    const params = new URLSearchParams({ clientId, month });
    if (platform) params.set("platform", platform);
    if (status) params.set("status", status);
    fetch(`/api/content?${params}`)
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {});
  }, [clientId, month, platform, status]);

  useEffect(load, [load]);

  const client = clients?.find((c) => c.id === clientId);

  const filtered = useMemo(() => {
    if (!items) return null;
    const q = query.toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      `${i.topic} ${i.caption} ${i.hashtags}`.toLowerCase().includes(q)
    );
  }, [items, query]);

  const generate = async () => {
    if (!clientId) return;
    if (
      items &&
      items.length > 0 &&
      !confirm(
        `Regenerate the ${monthLabel(month)} plan? Existing items (except Posted) will be replaced.`
      )
    )
      return;
    setGenerating(true);
    await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, month }),
    });
    setGenerating(false);
    load();
  };

  const progress = useMemo(() => {
    if (!client || !items) return null;
    const posted = (pred: (t: string) => boolean) =>
      items.filter((i) => pred(i.type) && i.status === "Posted").length;
    return [
      { label: "Posts", done: posted((t) => t === "Post" || t === "Carousel"), total: client.monthlyPosts },
      { label: "Reels", done: posted((t) => t === "Reel"), total: client.monthlyReels },
      { label: "Stories", done: posted((t) => t === "Story"), total: client.monthlyStories },
    ];
  }, [client, items]);

  if (!clients) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Monthly Content Planner"
        subtitle={client ? `${client.brandName || client.name} — ${monthLabel(month)}` : "Select a client to begin"}
        actions={
          <Button onClick={generate} disabled={!clientId || generating}>
            {generating ? "Generating…" : "⚡ Generate Plan"}
          </Button>
        }
      />

      {/* Filters */}
      <Card className="mb-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Select client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.brandName || c.name}
              </option>
            ))}
          </Select>
          <Select value={month} onChange={(e) => setMonth(e.target.value)}>
            {monthOptions().map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </Select>
          <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="">All platforms</option>
            {PLATFORMS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </div>
      </Card>

      {progress && progress.some((p) => p.total > 0) && (
        <Card className="mb-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {progress.map((p) => (
              <ProgressBar key={p.label} label={p.label} done={p.done} total={p.total} />
            ))}
          </div>
        </Card>
      )}

      {!filtered ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No content planned for this month"
          hint="Generate a plan to automatically distribute this client's package across the month with suggested times, topics and placeholder captions."
          action={
            clientId ? (
              <Button onClick={generate} disabled={generating}>
                {generating ? "Generating…" : "⚡ Generate Plan"}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                {["Date", "Time", "Platform", "Type", "Topic", "Caption", "Team", "Approval", "Status", ""].map(
                  (h, i) => (
                    <th key={i} className="px-4 py-3 font-semibold">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="cursor-pointer transition-colors hover:bg-primary-50/40"
                  onClick={() => setEditing(item)}
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-700">
                    {formatDate(item.date)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {formatTime(item.time)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={PLATFORM_COLORS[item.platform]}>
                      {item.platform}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={TYPE_COLORS[item.type]}>{item.type}</Badge>
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 font-medium text-gray-800">
                    {item.topic || "—"}
                  </td>
                  <td className="max-w-[260px] truncate px-4 py-3 text-gray-500">
                    {item.caption || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                    {[item.designer, item.editor, item.shooter].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      color={
                        item.approval === "Approved"
                          ? "bg-green-50 text-green-700"
                          : item.approval === "Rejected"
                            ? "bg-red-50 text-red-600"
                            : "bg-gray-100 text-gray-500"
                      }
                    >
                      {item.approval}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={STATUS_COLORS[item.status]}>{item.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">✎</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
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
