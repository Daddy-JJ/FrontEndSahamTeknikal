import { comparePlainDates } from "./temporal-dates.ts";

export type CalendarCategoryKey =
  | "dividend"
  | "stocksplit"
  | "reversesplit"
  | "rightissue"
  | "tenderoffer"
  | "rups"
  | "pubex"
  | "ipo";

export interface CalendarCategoryMeta {
  key: CalendarCategoryKey | "ALL";
  pillLabel: string;
  count: number;
  totalHistorical: number;
}

export interface CalendarTimelineField {
  key: string;
  label: string;
  value: string;
  isDate: boolean;
  isLink?: boolean;
}

export interface CalendarEventItem {
  id: string;
  ticker: string;
  companyName: string;
  category: CalendarCategoryKey;
  categoryLabel: string;
  date: string;
  dateDisplay: string;
  dateField: string;
  daysUntil: number | null;
  status: "ACTIVE" | "UPCOMING" | "HISTORICAL";
  detailSummary: string;
  timeline: CalendarTimelineField[];
  extraMetrics: { label: string; value: string; isLink?: boolean }[];
}

export interface CalendarPayload {
  status: "ok" | "fallback" | "unavailable";
  provenance: "observed" | "fallback";
  stale: boolean;
  fetchedAt: string | null;
  cacheFetchedAt: string | null;
  todayDate: string;
  upstreamNote?: string;
  kpiSummary: {
    upcomingEvents: number;
    dividends: number;
    rupsPubex: number;
    ipoActions: number;
  };
  categories: CalendarCategoryMeta[];
  events: CalendarEventItem[];
}

export const CALENDAR_CATEGORY_DEFS: {
  key: CalendarCategoryKey;
  pillLabel: string;
  upstreamLabel: string;
}[] = [
  { key: "dividend", pillLabel: "DIVIDEND", upstreamLabel: "DIVIDEND" },
  { key: "stocksplit", pillLabel: "STOCK SPLIT", upstreamLabel: "STOCK SPLIT" },
  { key: "reversesplit", pillLabel: "REVERSE SPLIT", upstreamLabel: "REVERSE SPLIT" },
  { key: "rightissue", pillLabel: "RIGHT ISSUE", upstreamLabel: "RIGHT ISSUE" },
  { key: "tenderoffer", pillLabel: "TENDER", upstreamLabel: "TENDER OFFER" },
  { key: "rups", pillLabel: "RUPS", upstreamLabel: "RUPS" },
  { key: "pubex", pillLabel: "PUBEX", upstreamLabel: "PUBEX" },
  { key: "ipo", pillLabel: "IPO", upstreamLabel: "IPO" },
];

export function filterAndSortCalendarEvents(
  events: CalendarEventItem[],
  opts: {
    category?: string | null;
    query?: string | null;
    ticker?: string | null;
    includeHistorical?: boolean;
  } = {}
): CalendarEventItem[] {
  const catFilter = (opts.category || "ALL").toLowerCase().replace(/[\s_-]+/g, "");
  const q = (opts.query || "").trim().toLowerCase();
  const tFilter = (opts.ticker || "").trim().toUpperCase();

  return events
    .filter((ev) => {
      if (!opts.includeHistorical && ev.status === "HISTORICAL") return false;
      if (tFilter && ev.ticker !== tFilter) return false;
      if (catFilter && catFilter !== "all") {
        const normalizedFilter = catFilter === "tender" ? "tenderoffer" : catFilter;
        if (ev.category !== normalizedFilter) return false;
      }
      if (q) {
        const hay = `${ev.ticker} ${ev.companyName} ${ev.categoryLabel} ${ev.detailSummary}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => comparePlainDates(a.date, b.date) || a.ticker.localeCompare(b.ticker));
}
