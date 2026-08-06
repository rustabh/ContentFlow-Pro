"use client";

import { use, useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { PLATFORM_COLORS, STATUS_COLORS, TYPE_COLORS } from "@/lib/constants";
import type { PublicApprovalItem } from "@/lib/types";
import { formatDate, formatTime, monthLabel } from "@/lib/utils";

interface ApproveData {
  clientName: string;
  agencyName: string;
  month: string;
  items: PublicApprovalItem[];
}

export default function ApprovePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<ApproveData | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = () => {
    fetch(`/api/public/approve/${token}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Failed to load");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  };

  useEffect(load, [token]);

  const decide = async (itemId: string, approval: "Approved" | "Rejected") => {
    setBusyId(itemId);
    const res = await fetch(`/api/public/approve/${token}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, approval, note: notes[itemId] ?? "" }),
    });
    setBusyId(null);
    if (res.ok) {
      const updated: PublicApprovalItem = await res.json();
      setData((d) =>
        d ? { ...d, items: d.items.map((i) => (i.id === itemId ? updated : i)) } : d
      );
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500">{error}</p>
          <p className="mt-1 text-xs text-gray-400">
            This link may have been reset. Ask your agency for a fresh one.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="border-b border-gray-100 bg-white px-4 py-4 sm:px-8">
        <Logo />
      </header>
      <main className="mx-auto max-w-3xl px-4 pt-6 sm:px-8">
        <h1 className="text-lg font-bold text-gray-900">
          {data.clientName} — {monthLabel(data.month)}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Review this month&apos;s content plan from {data.agencyName}. Approve or request
          changes on each item below.
        </p>

        {data.items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white py-14 text-center text-sm text-gray-400">
            Nothing planned for this month yet.
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {data.items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PLATFORM_COLORS[item.platform]}`}>
                    {item.platform}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[item.type]}`}>
                    {item.type}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[item.status]}`}>
                    {item.status}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">
                    {formatDate(item.date)} · {formatTime(item.time)}
                  </span>
                </div>

                {item.mediaKey && (
                  <div className="mt-3">
                    {item.mediaContentType?.startsWith("video/") ? (
                      <video src={`/api/media/${item.mediaKey}`} controls className="max-h-64 rounded-xl" />
                    ) : (
                      <img
                        src={`/api/media/${item.mediaKey}`}
                        alt={item.topic}
                        className="max-h-64 rounded-xl object-cover"
                      />
                    )}
                  </div>
                )}

                <div className="mt-3 text-sm font-semibold text-gray-800">{item.topic || "Untitled"}</div>
                {item.caption && <p className="mt-1 text-sm text-gray-600">{item.caption}</p>}
                {item.hashtags && <p className="mt-1 text-xs text-primary-500">{item.hashtags}</p>}

                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      item.approval === "Approved"
                        ? "bg-green-50 text-green-700"
                        : item.approval === "Rejected"
                          ? "bg-red-50 text-red-600"
                          : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {item.approval}
                  </span>
                </div>

                <input
                  type="text"
                  placeholder="Add a note (optional)…"
                  value={notes[item.id] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [item.id]: e.target.value }))}
                  className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => decide(item.id, "Approved")}
                    disabled={busyId === item.id}
                    className="flex-1 rounded-xl bg-gradient-to-r from-brand-violet to-brand-magenta px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => decide(item.id, "Rejected")}
                    disabled={busyId === item.id}
                    className="flex-1 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Request Changes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
