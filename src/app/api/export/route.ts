import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getUserFromRequest } from "@/lib/auth";
import { readDb } from "@/lib/db";
import type { ContentItem } from "@/lib/types";
import { formatTime, monthLabel } from "@/lib/utils";

const COLUMNS = [
  { header: "Date", key: "date", width: 14 },
  { header: "Time", key: "time", width: 10 },
  { header: "Platform", key: "platform", width: 12 },
  { header: "Type", key: "type", width: 10 },
  { header: "Topic", key: "topic", width: 32 },
  { header: "Caption", key: "caption", width: 50 },
  { header: "Hashtags", key: "hashtags", width: 36 },
  { header: "CTA", key: "cta", width: 30 },
  { header: "Status", key: "status", width: 14 },
] as const;

async function getItems(req: NextRequest): Promise<{
  items: ContentItem[];
  clientLabel: string;
  month: string;
  agencyLine: string;
}> {
  const p = req.nextUrl.searchParams;
  const clientId = p.get("clientId") ?? "";
  const month = p.get("month") ?? "";
  const db = await readDb();
  const agencyLine = `Prepared by ${db.settings.agencyName}${
    db.settings.agencyEmail ? ` · ${db.settings.agencyEmail}` : ""
  }`;

  let items = db.content;
  if (clientId) items = items.filter((c) => c.clientId === clientId);
  if (month) items = items.filter((c) => c.month === month);
  items = [...items].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const client = db.clients.find((c) => c.id === clientId);
  return {
    items,
    clientLabel: client ? client.brandName || client.name : "All Clients",
    month,
    agencyLine,
  };
}

function fileStem(clientLabel: string, month: string): string {
  const safe = clientLabel.replace(/[^a-zA-Z0-9]+/g, "-");
  return `ContentCalendar-${safe}${month ? `-${month}` : ""}`;
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const format = req.nextUrl.searchParams.get("format") ?? "csv";
  const { items, clientLabel, month, agencyLine } = await getItems(req);

  if (format === "csv") {
    const esc = (v: string) => `"${(v ?? "").replaceAll('"', '""')}"`;
    const rows = [
      COLUMNS.map((c) => c.header).join(","),
      ...items.map((i) =>
        COLUMNS.map((c) => esc(String(i[c.key as keyof ContentItem] ?? ""))).join(",")
      ),
    ];
    return new NextResponse(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileStem(clientLabel, month)}.csv"`,
      },
    });
  }

  // XLSX with professional formatting.
  const wb = new ExcelJS.Workbook();
  wb.creator = "Incinc Media — ContentFlow Pro";
  const ws = wb.addWorksheet("Content Calendar", {
    views: [{ state: "frozen", ySplit: 3 }],
  });
  ws.columns = COLUMNS.map((c) => ({ key: c.key, width: c.width }));

  // Title block.
  ws.mergeCells(1, 1, 1, COLUMNS.length);
  const title = ws.getCell(1, 1);
  title.value = `${clientLabel} — Content Calendar${month ? ` (${monthLabel(month)})` : ""}`;
  title.font = { bold: true, size: 16, color: { argb: "FF7E2FA8" } };
  ws.getRow(1).height = 28;
  ws.mergeCells(2, 1, 2, COLUMNS.length);
  const subtitle = ws.getCell(2, 1);
  subtitle.value = agencyLine;
  subtitle.font = { size: 10, color: { argb: "FF888888" } };

  // Header row.
  const header = ws.getRow(3);
  COLUMNS.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7E2FA8" } };
    cell.alignment = { vertical: "middle" };
    cell.border = { bottom: { style: "thin", color: { argb: "FF5B21B6" } } };
  });
  header.height = 22;

  items.forEach((item, idx) => {
    const row = ws.addRow({
      date: item.date,
      time: formatTime(item.time),
      platform: item.platform,
      type: item.type,
      topic: item.topic,
      caption: item.caption,
      hashtags: item.hashtags,
      cta: item.cta,
      status: item.status,
    });
    row.alignment = { vertical: "top", wrapText: true };
    if (idx % 2 === 1) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F1FB" } };
      });
    }
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = { bottom: { style: "hair", color: { argb: "FFDDDDDD" } } };
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileStem(clientLabel, month)}.xlsx"`,
    },
  });
}
