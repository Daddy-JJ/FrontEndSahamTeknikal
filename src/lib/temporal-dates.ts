const MONTHS_SHORT_ID = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MEI",
  "JUN",
  "JUL",
  "AGU",
  "SEP",
  "OKT",
  "NOV",
  "DES",
] as const;

const MONTHS_DISPLAY_IDX = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MEI",
  "JUN",
  "JUL",
  "AGU",
  "SEP",
  "OKT",
  "NOV",
  "DES",
] as const;

export interface PlainYmd {
  year: number;
  month: number;
  day: number;
}

interface TemporalPlainDateLike {
  year: number;
  month: number;
  day: number;
  toString(): string;
  until(other: unknown): { days?: number };
}

interface TemporalApiLike {
  PlainDate: {
    from(input: string | PlainYmd): TemporalPlainDateLike;
    compare(a: unknown, b: unknown): number;
  };
  PlainTime?: {
    from(input: string): { hour: number; minute: number; toString(): string };
  };
  Now?: {
    plainDateISO(timeZone?: string): TemporalPlainDateLike;
  };
}

function getGlobalTemporal(): TemporalApiLike | null {
  const g = globalThis as unknown as { Temporal?: TemporalApiLike };
  return g.Temporal && g.Temporal.PlainDate ? g.Temporal : null;
}

let polyfillPromise: Promise<TemporalApiLike | null> | null = null;

/**
 * Dynamically load `temporal-polyfill` only when native `globalThis.Temporal` is unavailable.
 */
export async function ensureTemporalPolyfill(): Promise<TemporalApiLike | null> {
  const existing = getGlobalTemporal();
  if (existing) return existing;
  if (!polyfillPromise) {
    polyfillPromise = import("temporal-polyfill")
      .then((mod) => {
        const g = globalThis as unknown as { Temporal?: unknown };
        if (!g.Temporal && mod?.Temporal) {
          g.Temporal = mod.Temporal;
        }
        return getGlobalTemporal();
      })
      .catch(() => null);
  }
  return polyfillPromise;
}

/**
 * Parse a location-agnostic YYYY-MM-DD calendar string into explicit year/month/day
 * using Temporal.PlainDate when loaded, without ever instantiating `new Date("YYYY-MM-DD")`.
 */
export function parsePlainDate(isoDate: string | null | undefined): PlainYmd | null {
  if (!isoDate) return null;
  const trimmed = String(isoDate).trim().slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return null;

  const t = getGlobalTemporal();
  if (t) {
    try {
      const pd = t.PlainDate.from(trimmed);
      return { year: pd.year, month: pd.month, day: pd.day };
    } catch {
      return null;
    }
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/**
 * Format an ISO calendar date (`2026-11-30`) as location-agnostic `30 NOV 2026`.
 */
export function formatCalendarDateID(isoDate: string | null | undefined, uppercase = true): string {
  const ymd = parsePlainDate(isoDate);
  if (!ymd) return isoDate ? String(isoDate) : "-";
  const mon = MONTHS_DISPLAY_IDX[ymd.month - 1] ?? String(ymd.month).padStart(2, "0");
  const monOut = uppercase ? mon : `${mon[0]}${mon.slice(1).toLowerCase()}`;
  return `${ymd.day} ${monOut} ${ymd.year}`;
}

/**
 * Format YYYY-MM year-month period (e.g. `2026-10` -> `Okt 2026`).
 */
export function formatPlainYearMonthID(ym: string | null | undefined): string {
  if (!ym) return "-";
  const m = /^(\d{4})-(\d{2})$/.exec(String(ym).trim());
  if (!m) return String(ym);
  const monthIdx = Number(m[2]) - 1;
  const mon = MONTHS_SHORT_ID[monthIdx] ?? m[2];
  return `${mon[0]}${mon.slice(1).toLowerCase()} ${m[1]}`;
}

/**
 * Compare two YYYY-MM-DD plain calendar dates (-1, 0, +1) without Date timestamp construction.
 */
export function comparePlainDates(a: string | null | undefined, b: string | null | undefined): number {
  const pa = parsePlainDate(a);
  const pb = parsePlainDate(b);
  if (!pa && !pb) return 0;
  if (!pa) return 1;
  if (!pb) return -1;

  const t = getGlobalTemporal();
  if (t) {
    return t.PlainDate.compare(
      `${String(pa.year).padStart(4, "0")}-${String(pa.month).padStart(2, "0")}-${String(pa.day).padStart(2, "0")}`,
      `${String(pb.year).padStart(4, "0")}-${String(pb.month).padStart(2, "0")}-${String(pb.day).padStart(2, "0")}`
    );
  }
  if (pa.year !== pb.year) return pa.year - pb.year;
  if (pa.month !== pb.month) return pa.month - pb.month;
  return pa.day - pb.day;
}

/**
 * Return current Jakarta calendar date (`YYYY-MM-DD`) via Temporal.Now or Intl parts.
 */
export function todayJakartaPlainDate(): string {
  const t = getGlobalTemporal();
  if (t?.Now?.plainDateISO) {
    try {
      return t.Now.plainDateISO("Asia/Jakarta").toString();
    } catch {
      // Fallback below
    }
  }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "2026";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

/**
 * Compute calendar day difference (target - reference) without timezone offset distortion.
 */
export function diffPlainDays(targetIso: string | null | undefined, refIso?: string): number | null {
  const target = parsePlainDate(targetIso);
  const ref = parsePlainDate(refIso ?? todayJakartaPlainDate());
  if (!target || !ref) return null;

  const t = getGlobalTemporal();
  if (t) {
    const a = t.PlainDate.from(ref);
    const b = t.PlainDate.from(target);
    return Number(a.until(b).days ?? 0);
  }

  const msA = Date.UTC(ref.year, ref.month - 1, ref.day);
  const msB = Date.UTC(target.year, target.month - 1, target.day);
  return Math.round((msB - msA) / 86_400_000);
}

/**
 * Normalize wall-clock time string (`13:30:00` -> `13:30 WIB`).
 */
export function formatWallClockWIB(rawTime: string | null | undefined): string {
  if (!rawTime) return "-";
  const trimmed = String(rawTime).trim();
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(trimmed);
  if (!m) return trimmed;
  return `${m[1].padStart(2, "0")}:${m[2]} WIB`;
}

/**
 * Format an instant timestamp string (e.g., RSS `pubDate` or ISO cached timestamp) cleanly in Asia/Jakarta.
 */
export function formatWibTimestamp(rawInstant: string | null | undefined): string {
  if (!rawInstant) return "-";
  const d = new Date(rawInstant);
  if (Number.isNaN(d.getTime())) return String(rawInstant);
  return (
    new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d) + " WIB"
  );
}
