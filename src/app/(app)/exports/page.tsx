"use client";

import { useEffect, useState } from "react";
import { Button, Card, PageHeader, Select, Spinner } from "@/components/ui";
import type { Client } from "@/lib/types";
import { currentMonth, monthLabel, monthOptions } from "@/lib/utils";

export default function ExportsPage() {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [clientId, setClientId] = useState("");
  const [month, setMonth] = useState(currentMonth());

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((list: Client[]) => {
        setClients(list);
        if (list.length > 0) setClientId((id) => id || list[0].id);
      })
      .catch(() => {});
  }, []);

  if (!clients) return <Spinner />;

  const qs = new URLSearchParams({ month });
  if (clientId) qs.set("clientId", clientId);

  const download = (format: "xlsx" | "csv") => {
    window.location.href = `/api/export?${qs}&format=${format}`;
  };

  const openPrint = () => {
    window.open(`/print?${qs}`, "_blank");
  };

  return (
    <div>
      <PageHeader
        title="Exports"
        subtitle="Deliver the monthly content calendar to your client"
      />

      <Card className="mb-4">
        <div className="grid grid-cols-2 gap-3 lg:max-w-lg">
          <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">All clients</option>
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
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <ExportCard
          title="Excel (.xlsx)"
          description="Professionally formatted spreadsheet with branded headers — Date, Time, Platform, Type, Topic, Caption, Hashtags and CTA."
          icon="📊"
          action={<Button onClick={() => download("xlsx")}>Download .xlsx</Button>}
        />
        <ExportCard
          title="CSV"
          description="Plain comma-separated file for importing into any scheduling or reporting tool."
          icon="📄"
          action={
            <Button variant="secondary" onClick={() => download("csv")}>
              Download .csv
            </Button>
          }
        />
        <ExportCard
          title="Printable PDF"
          description="Clean print layout of the calendar. Opens in a new tab — use your browser's Print → Save as PDF."
          icon="🖨️"
          action={
            <Button variant="secondary" onClick={openPrint}>
              Open Print View
            </Button>
          }
        />
      </div>
    </div>
  );
}

function ExportCard({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description: string;
  icon: string;
  action: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-xl">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-gray-500">
        {description}
      </p>
      <div className="mt-4">{action}</div>
    </Card>
  );
}
