import type { ContentItem } from "./types";

function escapeIcsText(text: string): string {
  return text.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  // RFC 5545 requires folding lines longer than 75 octets, continued with a leading space.
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    chunks.push(rest.slice(0, 75));
    rest = " " + rest.slice(75);
  }
  chunks.push(rest);
  return chunks.join("\r\n");
}

function toIcsDateTime(date: string, time: string): string {
  return `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;
}

/**
 * Build an RFC 5545 .ics feed of a client's content calendar, so it can be
 * subscribed to from Google Calendar / Outlook / Apple Calendar via the
 * public, token-gated URL (no login required — same share token as the
 * approval page).
 */
export function buildIcsCalendar(
  items: ContentItem[],
  calendarName: string
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ContentFlow Pro//Content Calendar//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];

  for (const item of items) {
    const start = toIcsDateTime(item.date, item.time);
    const summary = `${item.platform} ${item.type}${item.topic ? `: ${item.topic}` : ""}`;
    const description = [item.caption, item.hashtags].filter(Boolean).join("\n\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${item.id}@contentflowpro`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `DTSTART:${start}`,
      `DTEND:${start}`,
      foldLine(`SUMMARY:${escapeIcsText(summary)}`),
      foldLine(`DESCRIPTION:${escapeIcsText(description)}`),
      `STATUS:${item.status === "Posted" ? "CONFIRMED" : "TENTATIVE"}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
