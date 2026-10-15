import { scannerHref, type ScannerQuery, type ScanItem, type PublishedSignal } from "./scanner-contract.ts";
import type { ChartRequest } from "./chart-contract.ts";

export type ScannerSelection = { kind: "quality"; item: ScanItem } | { kind: "signal"; signal: PublishedSignal };
export type ScannerPanel = "reasons" | "chart" | "source";

export function resolveScannerSelection(query: Pick<ScannerQuery, "detail" | "detail_kind">,
  items: ScanItem[], signals: PublishedSignal[]): ScannerSelection | null {
  if (query.detail_kind === "quality") {
    const item = items.find(item => item.ticker === query.detail);
    return item ? { kind: "quality", item } : null;
  }
  if (query.detail_kind === "signal") {
    const signal = signals.find(signal => signal.id === query.detail);
    return signal ? { kind: "signal", signal } : null;
  }
  return null;
}
export function scannerDetailHref(run: string, section: ScannerQuery["section"], query: ScannerQuery,
  selection: ScannerSelection | null, panel: ScannerPanel = "reasons") {
  const href = scannerHref(run, section, query.page, query);
  if (!selection) return href;
  const params = new URLSearchParams(href.split("?")[1]);
  params.set("detail", selection.kind === "quality" ? selection.item.ticker : selection.signal.id);
  params.set("detail_kind", selection.kind);
  params.set("panel", panel);
  return `/scanner?${params}`;
}
export function scannerChartRequest(selection: ScannerSelection): ChartRequest {
  return selection.kind === "quality"
    ? { ticker: selection.item.ticker, context: "latest", view: "followup", timeframe: "1d", limit: 250 }
    : { ticker: selection.signal.ticker, context: "signal", context_id: selection.signal.id, view: "snapshot", timeframe: "1d", limit: 250 };
}
