import type { ScannerQuery } from "./scanner-contract.ts";
export type ScannerScroll = { windowY: number; matrixTop: number; matrixLeft: number };
/** This contains only viewport coordinates, never prices, trades or identities. */
export function scannerScrollKey(run: string, section: string, mode: "live" | "fixture", query: ScannerQuery) {
  return "scanner.ui.scroll.v1:" + JSON.stringify({ run, section, mode, page: query.page, date: query.date ?? null, strategy: query.strategy ?? null });
}
export function parseScannerScroll(raw: string | null): ScannerScroll | null {
  if (raw === null || raw.length > 256) return null;
  try {
    const value = JSON.parse(raw);
    const keys = ["windowY", "matrixTop", "matrixLeft"];
    return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === keys.length
      && keys.every(key => typeof value[key] === "number" && Number.isFinite(value[key]) && value[key] >= 0 && value[key] <= 10_000_000)
      ? { windowY: value.windowY, matrixTop: value.matrixTop, matrixLeft: value.matrixLeft } : null;
  } catch { return null; }
}
