/** Shared date/format helpers used on both server and client. */

export function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  ).toLowerCase();
}

/** Current month key, e.g. "2026-07". */
export function currentMonth(): string {
  return toMonthKey(new Date());
}

export function toMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Today's date as YYYY-MM-DD (local time). */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

/** Build a YYYY-MM-DD string for a day within a month key. */
export function dateInMonth(month: string, day: number): string {
  return `${month}-${String(day).padStart(2, "0")}`;
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatTime(time: string): string {
  if (!time) return "—";
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** List of month keys around today: `past` months back through `future` months ahead. */
export function monthOptions(past = 3, future = 6): string[] {
  const now = new Date();
  const list: string[] = [];
  for (let i = -past; i <= future; i++) {
    list.push(toMonthKey(new Date(now.getFullYear(), now.getMonth() + i, 1)));
  }
  return list;
}

export function isClientActive(
  packageStart: string,
  packageEnd: string
): boolean {
  const today = todayISO();
  return packageStart <= today && (!packageEnd || packageEnd >= today);
}
