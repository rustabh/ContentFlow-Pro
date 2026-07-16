"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearch } from "@/components/layout/SearchProvider";
import ContentEditModal from "@/components/planner/ContentEditModal";
import { Button, Card, PageHeader, Select, Spinner } from "@/components/ui";
import { TYPE_COLORS } from "@/lib/constants";
import type { Client, ContentItem, Shoot } from "@/lib/types";
import { currentMonth, daysInMonth, formatTime, monthLabel, todayISO } from "@/lib/utils";

export default function CalendarPage() {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [items, setItems] = useState<ContentItem[] | null>(null);
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [clientId, setClientId] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const { query } = useSearch();

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then(setClients)
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    const params = new URLSearchParams({ month });
    if (clientId) params.set("clientId", clientId);
    fetch(`/api/content?${params}`)
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {});
    fetch(`/api/shoots?${params}`)
      .then((r) => r.json())
      .then(setShoots)
      .catch(() => {});
  }, [clientId, month]);

  useEffect(load, [load]);

  const shiftMonth = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const byDay = useMemo(() => {
    const map = new Map<number, ContentItem[]>();
    if (!items) return map;
    const q = query.toLowerCase();
    for (const item of items) {
      if (q && !`${item.topic} ${item.caption}`.toLowerCase().includes(q)) continue;
      const day = Number(item.date.slice(8, 10));
      map.set(day, [...(map.get(day) ?? []), item]);
    }
    return map;
  }, [items, query]);

  const shootDays = useMemo(
    () => new Set(shoots.map((s) => Number(s.date.slice(8, 10)))),
    [shoots]
  );

  if (!clients || !items) return <Spinner />;

  const [y, m] = month.split("-").map(Number);
  const firstDow = new Date(y, m - 1, 1).getDay();
  const total = daysInMonth(month);
  const today = todayISO();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Click any item to edit it"
        actions={
          <div className="flex items-center gap-2">
            <Select value={clientId} onChange={(e) => setClientId(e.target.value)} className="!w-44">
              <option value="">All clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.brandName || c.name}
                </option>
              ))}
            </Select>
            <Button variant="secondary" onClick={() => shiftMonth(-1)}>
              ←
            </Button>
            <div className="w-36 text-center text-sm font-semibold text-gray-800">
              {monthLabel(month)}
            </div>
            <Button variant="secondary" onClick={() => shiftMonth(1)}>
              →
            </Button>
          </div>
        }
      />

      <Card className="overflow-x-auto p-0">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-7 border-b border-gray-100 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-2.5">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const dateStr = day ? `${month}-${String(day).padStart(2, "0")}` : "";
              const isToday = dateStr === today;
              return (
                <div
                  key={i}
                  className={`min-h-28 border-b border-r border-gray-50 p-1.5 ${
                    day === null ? "bg-gray-50/50" : ""
                  }`}
                >
                  {day !== null && (
                    <>
                      <div className="mb-1 flex items-center justify-between px-0.5">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                            isToday ? "bg-primary-500 text-white" : "text-gray-500"
                          }`}
                        >
                          {day}
                        </span>
                        {shootDays.has(day) && (
                          <span
                            title="Shoot day"
                            className="rounded bg-amber-100 px-1 text-[9px] font-bold uppercase text-amber-700"
                          >
                            🎬 Shoot
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {(byDay.get(day) ?? []).slice(0, 4).map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setEditing(item)}
                            className={`block w-full truncate rounded-md px-1.5 py-1 text-left text-[11px] font-medium transition-opacity hover:opacity-75 ${TYPE_COLORS[item.type]}`}
                            title={`${item.topic} · ${formatTime(item.time)}`}
                          >
                            {item.type} · {item.topic || "Untitled"}
                          </button>
                        ))}
                        {(byDay.get(day) ?? []).length > 4 && (
                          <div className="px-1.5 text-[10px] text-gray-400">
                            +{(byDay.get(day) ?? []).length - 4} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded ${color.split(" ")[0]}`} />
            {type}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-amber-100" /> Shoot day
        </span>
      </div>

      <ContentEditModal
        item={editing}
        onClose={() => setEditing(null)}
        onSaved={() => load()}
        onDeleted={() => load()}
      />
    </div>
  );
}
