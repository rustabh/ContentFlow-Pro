"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import type { Client, ContentItem } from "@/lib/types";
import { formatDate, formatTime, monthLabel } from "@/lib/utils";

/** Standalone printable view — Exports → "Printable PDF" opens this page. */
export default function PrintPage() {
  return (
    <Suspense>
      <PrintContent />
    </Suspense>
  );
}

function PrintContent() {
  const params = useSearchParams();
  const clientId = params.get("clientId") ?? "";
  const month = params.get("month") ?? "";
  const [items, setItems] = useState<ContentItem[] | null>(null);
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (clientId) qs.set("clientId", clientId);
    if (month) qs.set("month", month);
    fetch(`/api/content?${qs}`)
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {});
    if (clientId) {
      fetch(`/api/clients/${clientId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then(setClient)
        .catch(() => {});
    }
  }, [clientId, month]);

  useEffect(() => {
    if (items && items.length > 0) {
      // Give the table a moment to paint before the print dialog opens.
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [items]);

  if (!items) {
    return <div className="p-10 text-sm text-gray-400">Preparing print view…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl bg-white p-8">
      <div className="mb-6 flex items-start justify-between border-b-2 border-primary-500 pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {client ? client.brandName || client.name : "All Clients"} — Content
            Calendar
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {month ? monthLabel(month) : "All months"} · Prepared by Incinc Media
          </p>
        </div>
        <Logo />
      </div>

      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="bg-primary-500 text-white">
            {["Date", "Time", "Platform", "Type", "Topic", "Caption", "Hashtags", "CTA", "Status"].map(
              (h) => (
                <th key={h} className="px-2.5 py-2 font-semibold">
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr
              key={item.id}
              className={i % 2 === 1 ? "bg-primary-50/50" : ""}
              style={{ breakInside: "avoid" }}
            >
              <td className="whitespace-nowrap border-b border-gray-100 px-2.5 py-2 font-medium">
                {formatDate(item.date)}
              </td>
              <td className="whitespace-nowrap border-b border-gray-100 px-2.5 py-2">
                {formatTime(item.time)}
              </td>
              <td className="border-b border-gray-100 px-2.5 py-2">{item.platform}</td>
              <td className="border-b border-gray-100 px-2.5 py-2">{item.type}</td>
              <td className="border-b border-gray-100 px-2.5 py-2">{item.topic}</td>
              <td className="border-b border-gray-100 px-2.5 py-2">{item.caption}</td>
              <td className="border-b border-gray-100 px-2.5 py-2 text-primary-600">
                {item.hashtags}
              </td>
              <td className="border-b border-gray-100 px-2.5 py-2">{item.cta}</td>
              <td className="whitespace-nowrap border-b border-gray-100 px-2.5 py-2">
                {item.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {items.length === 0 && (
        <p className="py-10 text-center text-sm text-gray-400">
          No content found for this selection.
        </p>
      )}

      <div className="mt-8 border-t border-gray-100 pt-3 text-center text-[10px] text-gray-400">
        Designed by Incinc Media · ContentFlow Pro
      </div>
    </div>
  );
}
