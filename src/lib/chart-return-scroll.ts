import { safeChartReturn } from "./chart-navigation.ts";
export type ScrollRegion = { index: number; left: number; top: number };
export type ScrollRecord = { version: 1; mode: "live" | "fixture"; page: string; y: number; regions: ScrollRegion[]; recordedAt: number };
const maxPosition = 10_000_000;
const bounded = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= maxPosition;
export function scrollStorageKey(mode: "live" | "fixture") { return "chart-return-ui-v1:" + mode; }
/** Cohort identity only; never store chart payloads, prices, sessions, JWT or account data. */
export function returnPage(value: string): string | null {
  if (!safeChartReturn(value)) return null;
  const url = new URL(value, "https://chart.internal");
  if (!["/journal", "/analytics"].includes(url.pathname)) return null;
  const query = new URLSearchParams(url.searchParams);
  query.sort();
  return url.pathname + (query.size ? "?" + query : "");
}
export function scrollRecord(mode: "live" | "fixture", page: string, y: number, regions: ScrollRegion[], recordedAt: number): ScrollRecord | null {
  const canonical = returnPage(page);
  if (!canonical || !bounded(y) || !Number.isSafeInteger(recordedAt) || recordedAt < 0 || regions.length > 24
      || regions.some(r => !Number.isSafeInteger(r.index) || r.index < 0 || r.index > 23 || !bounded(r.left) || !bounded(r.top))) return null;
  return { version: 1, mode, page: canonical, y: Math.floor(y),
    regions: regions.map(r => ({ index: r.index, left: Math.floor(r.left), top: Math.floor(r.top) })), recordedAt };
}
function exactKeys(value: unknown, keys: string[]): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}
export function parseScrollRecord(raw: string | null, mode: "live" | "fixture", page: string, now: number): ScrollRecord | null {
  if (!raw || raw.length > 4096) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!exactKeys(value, ["version", "mode", "page", "y", "regions", "recordedAt"]) || value.version !== 1 || value.mode !== mode
        || typeof value.page !== "string" || value.page !== returnPage(page) || !bounded(value.y) || !Number.isInteger(value.y)
        || !Array.isArray(value.regions) || value.regions.some(r => !exactKeys(r, ["index", "left", "top"]))
        || typeof value.recordedAt !== "number" || !Number.isSafeInteger(value.recordedAt)
        || now < value.recordedAt || now - value.recordedAt > 30 * 60_000) return null;
    const record = scrollRecord(mode, value.page, value.y, value.regions as ScrollRegion[], value.recordedAt);
    return record && new Set(record.regions.map(r => r.index)).size === record.regions.length ? record : null;
  } catch { return null; }
}
