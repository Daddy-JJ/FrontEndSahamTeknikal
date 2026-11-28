/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, publicSupabaseConfig } from "@/lib/supabase/server";
import { fetchCorpActionsUpstream } from "@/lib/idx-upstream";
import { callMaxTradeMcp } from "@/lib/mcp-broker-flow";
import {
  CALENDAR_CATEGORY_DEFS,
  type CalendarCategoryKey,
  type CalendarCategoryMeta,
  type CalendarEventItem,
  type CalendarPayload,
  type CalendarTimelineField,
  filterAndSortCalendarEvents,
} from "@/lib/calendar-types";
import {
  comparePlainDates,
  diffPlainDays,
  ensureTemporalPolyfill,
  formatCalendarDateID,
  formatWallClockWIB,
  todayJakartaPlainDate,
} from "@/lib/temporal-dates";

export {
  CALENDAR_CATEGORY_DEFS,
  filterAndSortCalendarEvents,
  type CalendarCategoryKey,
  type CalendarCategoryMeta,
  type CalendarEventItem,
  type CalendarPayload,
  type CalendarTimelineField,
};

const FIELD_LABEL_OVERRIDES: Record<string, string> = {
  dividend_value_formatted: "AMOUNT",
  dividend_cumdate: "CUM DATE",
  dividend_exdate: "EX DATE",
  dividend_recdate: "RECORDING DATE",
  dividend_paydate: "PAYMENT DATE",
  rups_date: "RUPS DATE",
  rups_eligible_date: "ELIGIBLE DATE",
  rups_time: "TIME",
  rups_venue: "VENUE",
  puexp_date: "PUBEX DATE",
  puexp_time: "TIME",
  puexp_venue: "VENUE",
  stocksplit_ratio: "RATIO",
  stocksplit_cumdate: "CUM DATE",
  stocksplit_exdate: "EX DATE",
  reversesplit_ratio: "RATIO",
  reversesplit_cumdate: "CUM DATE",
  rightissue_ratio: "RATIO",
  rightissue_price: "EXERCISE PRICE",
  rightissue_cumdate: "CUM DATE",
  rightissue_exdate: "EX DATE",
  rightissue_trading_start: "TRADING START",
  rightissue_trading_end: "TRADING END",
  tender_price: "OFFER PRICE",
  tender_start: "OFFER START",
  tender_end: "OFFER END",
  ipo_listing_date: "LISTING DATE",
  ipo_price: "OFFER PRICE",
};

function looksLikeIsoDate(val: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(val.trim());
}

function normalizeUrlValue(val: string): string | null {
  const m = /(https?:\/\/[^\s]+)/i.exec(val);
  return m ? m[1] : null;
}

function buildTimelineAndMetrics(raw: Record<string, any>): {
  timeline: CalendarTimelineField[];
  extraMetrics: { label: string; value: string; isLink?: boolean }[];
} {
  const timelineRaw = Array.isArray(raw.timeline) ? raw.timeline : [];
  const valuesObj = (raw.values && typeof raw.values === "object" ? raw.values : {}) as Record<string, any>;
  const seenLabels = new Set<string>();
  const extraMetrics: { label: string; value: string; isLink?: boolean }[] = [];
  const timeline: CalendarTimelineField[] = [];

  if (valuesObj.dividend_value_formatted || valuesObj.dividend_value) {
    const amt = String(valuesObj.dividend_value_formatted || `Rp ${valuesObj.dividend_value}`);
    extraMetrics.push({ label: "AMOUNT", value: amt });
    seenLabels.add("AMOUNT");
  }

  for (const [k, v] of Object.entries(valuesObj)) {
    if (v === null || v === undefined || v === "") continue;
    if (k === "dividend_value" || k === "dividend_value_formatted" || k === "dividend_value_adjusted" || k === "lastprice" || k === "lastprice_formatted") {
      continue;
    }
    const label = FIELD_LABEL_OVERRIDES[k] || k.replace(/_/g, " ").toUpperCase();
    if (seenLabels.has(label)) continue;
    seenLabels.add(label);

    const strVal = String(v).trim();
    if (k.endsWith("_time")) {
      extraMetrics.push({ label, value: formatWallClockWIB(strVal) });
    } else if (looksLikeIsoDate(strVal)) {
      timeline.push({ key: k, label, value: formatCalendarDateID(strVal), isDate: true });
    } else {
      const linkUrl = normalizeUrlValue(strVal);
      extraMetrics.push({ label, value: strVal, isLink: Boolean(linkUrl) });
    }
  }

  for (const item of timelineRaw) {
    const key = String(item?.key || "");
    const rawVal = String(item?.value || "").trim();
    if (!rawVal) continue;
    const label = FIELD_LABEL_OVERRIDES[key] || String(item?.label || key || "DATE").toUpperCase();
    if (seenLabels.has(label)) continue;
    seenLabels.add(label);
    const isDate = looksLikeIsoDate(rawVal);
    timeline.push({
      key,
      label,
      value: isDate ? formatCalendarDateID(rawVal) : rawVal,
      isDate,
    });
  }

  return { timeline, extraMetrics };
}

function classifyCategory(rawCat: unknown): CalendarCategoryKey {
  const c = String(rawCat || "").toLowerCase().replace(/[\s_-]+/g, "");
  if (c === "dividend") return "dividend";
  if (c === "stocksplit") return "stocksplit";
  if (c === "reversesplit") return "reversesplit";
  if (c === "rightissue" || c === "rightsissue") return "rightissue";
  if (c === "tenderoffer" || c === "tender") return "tenderoffer";
  if (c === "rups") return "rups";
  if (c === "pubex" || c === "publicexpose") return "pubex";
  if (c === "ipo") return "ipo";
  return "dividend";
}

function determineEventStatus(
  raw: Record<string, any>,
  today: string
): "ACTIVE" | "UPCOMING" | "HISTORICAL" {
  if (raw.active === true) return "ACTIVE";
  const d = String(raw.date || "").slice(0, 10);
  if (d && comparePlainDates(d, today) < 0 && raw.is_upcoming !== true) {
    return "HISTORICAL";
  }
  return "UPCOMING";
}

async function enrichCompanyNames(tickers: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = Array.from(new Set(tickers.map((t) => t.toUpperCase()).filter(Boolean)));
  if (unique.length === 0 || !publicSupabaseConfig()) return map;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("idx_ticker_master")
      .select("*")
      .in("ticker", unique.slice(0, 500));

    for (const row of (data ?? []) as Record<string, any>[]) {
      const code = String(row.ticker || "").toUpperCase();
      const cname = String(row.company_name || row.name || row.emiten_name || "").trim();
      if (code && cname && cname !== "-") {
        map.set(code, cname);
      }
    }
  } catch {
    // Non-fatal enrichment failure; leave upstream value untouched.
  }
  return map;
}

export function normalizeCorpActionRows(
  rawEvents: Record<string, any>[],
  companyMap: Map<string, string>,
  todayDate: string
): CalendarEventItem[] {
  return rawEvents
    .map((raw, idx): CalendarEventItem => {
      const ticker = String(raw.ticker || "").trim().toUpperCase();
      const cat = classifyCategory(raw.category);
      const catDef = CALENDAR_CATEGORY_DEFS.find((d) => d.key === cat);
      const rawDate = String(raw.date || "").slice(0, 10);
      const rawCompany = String(raw.company_name || raw.companyName || "").trim();
      const companyName = rawCompany || companyMap.get(ticker) || "-";
      const { timeline, extraMetrics } = buildTimelineAndMetrics(raw);

      return {
        id: `${cat}-${ticker}-${rawDate}-${raw.date_field || idx}`,
        ticker,
        companyName,
        category: cat,
        categoryLabel: catDef?.upstreamLabel || String(raw.category_label || cat.toUpperCase()),
        date: rawDate,
        dateDisplay: formatCalendarDateID(rawDate),
        dateField: String(raw.date_field || ""),
        daysUntil: diffPlainDays(rawDate, todayDate),
        status: determineEventStatus(raw, todayDate),
        detailSummary: String(raw.detail || "").trim(),
        timeline,
        extraMetrics,
      };
    })
    .filter((ev) => Boolean(ev.ticker));
}

/**
 * Load Corporate Calendar from upstream `/api/calendar/corpactions` with `idx_ticker_master`
 * company-name enrichment and `max-trade` MCP `get_dividend_history` fallback.
 */
export async function getCorporateCalendar(options: {
  ticker?: string;
  upcomingOnly?: boolean;
  limit?: number;
} = {}): Promise<CalendarPayload> {
  await ensureTemporalPolyfill();
  const todayDate = todayJakartaPlainDate();

  const up = await fetchCorpActionsUpstream({
    ticker: options.ticker,
    upcomingOnly: options.upcomingOnly,
    limit: options.limit ?? 600,
  });

  if (up.ok && up.data && Array.isArray(up.data.events)) {
    const rawEvents = up.data.events as Record<string, any>[];
    const companyMap = await enrichCompanyNames(rawEvents.map((e) => String(e.ticker || "")));
    const events = normalizeCorpActionRows(rawEvents, companyMap, todayDate);

    const rawCats = (up.data.categories && typeof up.data.categories === "object" ? up.data.categories : {}) as Record<
      string,
      { count?: number; total?: number }
    >;

    const counts: Record<CalendarCategoryKey, number> = {
      dividend: 0,
      stocksplit: 0,
      reversesplit: 0,
      rightissue: 0,
      tenderoffer: 0,
      rups: 0,
      pubex: 0,
      ipo: 0,
    };
    for (const ev of events) {
      counts[ev.category] = (counts[ev.category] ?? 0) + 1;
    }

    const categories: CalendarCategoryMeta[] = [
      {
        key: "ALL",
        pillLabel: "ALL",
        count: events.length,
        totalHistorical: Object.values(rawCats).reduce((s, c) => s + Number(c?.total ?? 0), 0),
      },
      ...CALENDAR_CATEGORY_DEFS.map((def) => ({
        key: def.key,
        pillLabel: def.pillLabel,
        count: rawCats[def.key]?.count !== undefined ? Number(rawCats[def.key].count) : counts[def.key],
        totalHistorical: Number(rawCats[def.key]?.total ?? counts[def.key]),
      })),
    ];

    const dividendsCount = counts.dividend;
    const rupsPubexCount = counts.rups + counts.pubex;
    const ipoActionsCount =
      counts.ipo + counts.stocksplit + counts.reversesplit + counts.rightissue + counts.tenderoffer;

    return {
      status: "ok",
      provenance: "observed",
      stale: Boolean(up.data.stale) || up.staleFromCache,
      fetchedAt: String(up.data.fetched_at || up.fetchedAt || "") || null,
      cacheFetchedAt: String(up.data.cache_fetched_at || up.fetchedAt || "") || null,
      todayDate,
      upstreamNote: up.staleFromCache
        ? `Menampilkan cache sementara karena upstream terlambat (${up.error || "timeout"}).`
        : up.data.stale
          ? "Upstream menandai snapshot cache periodik."
          : undefined,
      kpiSummary: {
        upcomingEvents: events.length,
        dividends: dividendsCount,
        rupsPubex: rupsPubexCount,
        ipoActions: ipoActionsCount,
      },
      categories,
      events,
    };
  }

  // Fallback: pull bounded official dividends from max-trade MCP so the page stays functional.
  try {
    const divRes = (await callMaxTradeMcp(
      "get_dividend_history",
      {
        ticker: options.ticker ? options.ticker.toUpperCase() : undefined,
        limit: 20,
      },
      10_000
    )) as { records?: Record<string, any>[]; events?: Record<string, any>[] } | null;

    const rows = (divRes?.records ?? divRes?.events ?? []) as Record<string, any>[];
    const syntheticRaw = rows.map((r) => ({
      ticker: String(r.ticker || r.symbol || options.ticker || "").toUpperCase(),
      company_name: String(r.companyName || r.company_name || ""),
      category: "dividend",
      category_label: "DIVIDEND",
      date: String(r.cumDate || r.exDate || r.paymentDate || r.date || todayDate).slice(0, 10),
      date_field: r.cumDate ? "dividend_cumdate" : "dividend_exdate",
      detail: r.amountFormatted || (r.amount ? `Rp ${r.amount}` : "Dividen KSEI"),
      is_upcoming: true,
      values: {
        dividend_value: r.amount ?? r.cashDividend ?? "",
        dividend_cumdate: r.cumDate ?? "",
        dividend_exdate: r.exDate ?? "",
        dividend_recdate: r.recordingDate ?? "",
        dividend_paydate: r.paymentDate ?? "",
      },
      timeline: [],
    }));
    const companyMap = await enrichCompanyNames(syntheticRaw.map((e) => e.ticker));
    const events = normalizeCorpActionRows(syntheticRaw, companyMap, todayDate);

    return {
      status: "fallback",
      provenance: "fallback",
      stale: true,
      fetchedAt: new Date().toISOString(),
      cacheFetchedAt: null,
      todayDate,
      upstreamNote: `Sumber kalender lengkap tidak terjangkau (${up.error || "unavailable"}); menampilkan jadwal dividen fallback dari max-trade MCP.`,
      kpiSummary: {
        upcomingEvents: events.length,
        dividends: events.length,
        rupsPubex: 0,
        ipoActions: 0,
      },
      categories: [
        { key: "ALL", pillLabel: "ALL", count: events.length, totalHistorical: events.length },
        ...CALENDAR_CATEGORY_DEFS.map((def) => ({
          key: def.key,
          pillLabel: def.pillLabel,
          count: def.key === "dividend" ? events.length : 0,
          totalHistorical: def.key === "dividend" ? events.length : 0,
        })),
      ],
      events,
    };
  } catch (err) {
    return {
      status: "unavailable",
      provenance: "fallback",
      stale: true,
      fetchedAt: null,
      cacheFetchedAt: null,
      todayDate,
      upstreamNote: `Kalender tidak dapat dimuat (${up.error || (err instanceof Error ? err.message : "unknown")}).`,
      kpiSummary: { upcomingEvents: 0, dividends: 0, rupsPubex: 0, ipoActions: 0 },
      categories: [
        { key: "ALL", pillLabel: "ALL", count: 0, totalHistorical: 0 },
        ...CALENDAR_CATEGORY_DEFS.map((def) => ({
          key: def.key,
          pillLabel: def.pillLabel,
          count: 0,
          totalHistorical: 0,
        })),
      ],
      events: [],
    };
  }
}
