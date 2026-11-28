import test from "node:test";
import assert from "node:assert/strict";
import {
  comparePlainDates,
  diffPlainDays,
  ensureTemporalPolyfill,
  formatCalendarDateID,
  formatPlainYearMonthID,
  formatWallClockWIB,
  parsePlainDate,
} from "../src/lib/temporal-dates.ts";
import { filterAndSortCalendarEvents } from "../src/lib/calendar-types.ts";

test("Temporal PlainDate helpers avoid UTC day-shift across all calendar formats", async () => {
  const api = await ensureTemporalPolyfill();
  assert.ok(api, "Expected native or polyfilled Temporal API to be available");

  const parsed = parsePlainDate("2026-11-30");
  assert.deepEqual(parsed, { year: 2026, month: 11, day: 30 });
  assert.equal(formatCalendarDateID("2026-11-30"), "30 NOV 2026");
  assert.equal(formatCalendarDateID("2026-12-01"), "1 DES 2026");
  assert.equal(formatCalendarDateID("2026-12-09", false), "9 Des 2026");
  assert.equal(parsePlainDate("invalid-date"), null);
});

test("comparePlainDates and diffPlainDays calculate exact day spans", async () => {
  await ensureTemporalPolyfill();
  assert.equal(comparePlainDates("2026-11-30", "2026-12-01"), -1);
  assert.equal(comparePlainDates("2026-11-30", "2026-11-30"), 0);
  assert.equal(comparePlainDates("2026-12-03", "2026-11-28"), 1);

  assert.equal(diffPlainDays("2026-12-03", "2026-11-28"), 5);
  assert.equal(diffPlainDays("2026-11-28", "2026-11-28"), 0);
  assert.equal(diffPlainDays("2026-11-27", "2026-11-28"), -1);
});

test("formatPlainYearMonthID and formatWallClockWIB format partial dates cleanly", () => {
  assert.equal(formatPlainYearMonthID("2026-10"), "Okt 2026");
  assert.equal(formatPlainYearMonthID("2026-08"), "Agu 2026");
  assert.equal(formatWallClockWIB("13:30:00"), "13:30 WIB");
  assert.equal(formatWallClockWIB("9:05"), "09:05 WIB");
});

test("filterAndSortCalendarEvents filters categories, hides historical by default, and sorts ascending", () => {
  const mk = (overrides) => ({
    id: "1",
    ticker: "BBCA",
    companyName: "Bank Central Asia Tbk",
    category: "dividend",
    categoryLabel: "DIVIDEND",
    date: "2026-12-01",
    dateDisplay: "1 DES 2026",
    dateField: "dividend_cumdate",
    daysUntil: 3,
    status: "UPCOMING",
    detailSummary: "Rp 35",
    timeline: [],
    extraMetrics: [],
    ...overrides,
  });

  const rows = [
    mk({ id: "3", ticker: "TGRA", category: "rups", categoryLabel: "RUPS", date: "2026-12-28" }),
    mk({ id: "2", ticker: "ASGR", category: "dividend", date: "2026-11-30" }),
    mk({ id: "1", ticker: "OLD1", category: "dividend", date: "2026-10-01", status: "HISTORICAL" }),
  ];

  const upcomingAll = filterAndSortCalendarEvents(rows);
  assert.deepEqual(upcomingAll.map((r) => r.ticker), ["ASGR", "TGRA"]);

  const divOnly = filterAndSortCalendarEvents(rows, { category: "dividend" });
  assert.deepEqual(divOnly.map((r) => r.ticker), ["ASGR"]);

  const withHist = filterAndSortCalendarEvents(rows, { includeHistorical: true, category: "dividend" });
  assert.deepEqual(withHist.map((r) => r.ticker), ["OLD1", "ASGR"]);
});
