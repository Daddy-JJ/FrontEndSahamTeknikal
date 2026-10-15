export type ChartRequest = {
  ticker: string;
  context: "latest" | "signal" | "paper" | "actual";
  context_id?: string;
  view: "snapshot" | "followup";
  timeframe: "1d";
  from?: string;
  to?: string;
  limit: number;
  cursor?: string;
};
export type ChartSource = {
  series_id: string;
  input_digest: string;
  resolved_input_digest: string;
  resolved_cutoff: string;
  provider: string;
  provider_version: string;
  price_basis: string;
  scope: "forward" | "paper_recovery" | "fixture";
  fetched_at: string;
  stored_at: string;
  history_start: string;
  last_market_session: string;
};
export type ChartBar = {
  session: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
};
export type ChartIndicator = {
  status: "ready" | "unavailable";
  reason: string | null;
  definition_version: string;
  artifact_digest: string | null;
  history_count: number;
  eligible_from: string | null;
  points: { session: string; value: number | null }[];
};
export type ChartLevel = {
  id: string;
  kind:
    | "planned_entry"
    | "initial_stop"
    | "current_stop"
    | "target"
    | "fractal";
  price: string;
  starts_at: string;
  ends_at: string | null;
  available_session: string;
  origin_session: string | null;
  source_id: string;
  status: "planned" | "effective" | "ended";
};
export type ChartMarker = {
  id: string;
  kind: "signal" | "entry_fill" | "ma_exit_trigger" | "exit_fill" | "ambiguous";
  session: string;
  available_session: string;
  price: string | null;
  source_id: string;
  status: "confirmed" | "simulated" | "ambiguous";
};
export type ChartData = {
  ticker: string;
  data_mode: "live" | "fixture";
  timeframe: "1d";
  exchange: "XIDX";
  timezone: "Asia/Jakarta";
  currency: "IDR";
  volume_unit: "shares";
  context: {
    kind: ChartRequest["context"];
    id: string | null;
    view: ChartRequest["view"];
    signal_session: string | null;
    snapshot_cutoff: string | null;
    model_version: string | null;
    experiment: string | null;
    engine_source_revision: string | null;
  };
  revision: string;
  source: ChartSource;
  signal_source: ChartSource | null;
  quality: {
    completeness: "complete" | "partial";
    freshness: "current" | "stale" | "unknown";
    expected_session: string | null;
    reasons: string[];
    warnings: string[];
  };
  sessions: string[];
  bars: ChartBar[];
  gaps: { session: string; reason: string }[];
  indicators: Record<
    "sma10" | "ema200" | "macd" | "macd_signal" | "macd_histogram",
    ChartIndicator
  >;
  overlays: {
    status: "ready" | "partial" | "unavailable";
    reason: string | null;
    levels: ChartLevel[];
    markers: ChartMarker[];
    has_more: boolean;
    next_cursor: string | null;
  };
  pagination: {
    window_from: string;
    window_to: string;
    returned_slots: number;
    limit: number;
    has_more: boolean;
    next_cursor: string | null;
  };
};
export const chartErrorCodes = [
  "INVALID_REQUEST",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "REVISION_UNAVAILABLE",
  "SNAPSHOT_UNAVAILABLE",
  "RATE_LIMITED",
  "BACKEND_NOT_READY",
  "DATA_UNAVAILABLE",
  "CONTRACT_ERROR",
  "UPSTREAM_ERROR",
  "INTERNAL_ERROR",
] as const;
export type ChartErrorCode = (typeof chartErrorCodes)[number];
export type ChartEnvelope =
  | {
      contract_version: "ticker-chart-v1";
      success: true;
      data: ChartData;
      error: null;
    }
  | {
      contract_version: "ticker-chart-v1";
      success: false;
      data: null;
      error: {
        code: ChartErrorCode;
        message: string;
        request_id: string;
        retryable: boolean;
      };
    };

import {
  ensure,
  object,
  text,
  one,
  integer,
  date,
} from "./chart-validation.ts";
import { validateData } from "./chart-payload.ts";
export function parseChartRequest(
  ticker: string,
  query: URLSearchParams,
): ChartRequest | null {
  try {
    ensure(/^[A-Z0-9_-]{1,20}$/.test(ticker));
    const allowed = [
      "context",
      "context_id",
      "view",
      "timeframe",
      "from",
      "to",
      "limit",
      "cursor",
    ];
    for (const key of query.keys())
      ensure(allowed.includes(key) && query.getAll(key).length === 1);
    const context = query.get("context") ?? "latest";
    one(context, ["latest", "signal", "paper", "actual"]);
    const id = query.get("context_id");
    if (context === "latest") ensure(id === null);
    else {
      text(id, 256);
      if (context === "signal") ensure(/^[0-9a-f]{64}$/.test(id));
      if (context === "actual")
        ensure(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            id,
          ),
        );
    }
    const view =
      query.get("view") ?? (context === "signal" ? "snapshot" : "followup");
    one(view, ["snapshot", "followup"]);
    ensure(!(["latest", "actual"].includes(context) && view === "snapshot"));
    const timeframe = query.get("timeframe") ?? "1d";
    ensure(timeframe === "1d");
    const raw = query.get("limit") ?? "250";
    ensure(/^\d+$/.test(raw));
    const limit = Number(raw);
    integer(limit, 1, 500);
    const from = query.get("from"),
      to = query.get("to"),
      next = query.get("cursor");
    if (from !== null) date(from);
    if (to !== null) date(to);
    ensure(!from || !to || from <= to);
    if (next !== null) {
      text(next, 2048);
      ensure(from === null && to === null);
    }
    return {
      ticker,
      context: context as ChartRequest["context"],
      view: view as ChartRequest["view"],
      timeframe,
      limit,
      ...(id ? { context_id: id } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(next ? { cursor: next } : {}),
    };
  } catch {
    return null;
  }
}

export function parseChartEnvelope(
  value: unknown,
  mode: "live" | "fixture",
  ticker: string,
): ChartEnvelope | null {
  try {
    const e = object(value, ["contract_version", "success", "data", "error"]);
    ensure(e.contract_version === "ticker-chart-v1");
    if (e.success === false) {
      ensure(e.data === null);
      const err = object(e.error, [
        "code",
        "message",
        "request_id",
        "retryable",
      ]);
      one(err.code, chartErrorCodes);
      text(err.message);
      text(err.request_id, 128);
      ensure(typeof err.retryable === "boolean");
    } else {
      ensure(e.success === true && e.error === null);
      validateData(e.data, mode, ticker);
    }
    return value as ChartEnvelope;
  } catch {
    return null;
  }
}
function mergeUnique<T>(a: T[], b: T[], key: (value: T) => string): T[] | null {
  const result = new Map(a.map((value) => [key(value), value]));
  for (const value of b) {
    const existing = result.get(key(value));
    if (existing && JSON.stringify(existing) !== JSON.stringify(value))
      return null;
    result.set(key(value), value);
  }
  return [...result.values()];
}
function mergeIndicators(current: ChartData, page: ChartData) {
  const result = { ...current.indicators };
  if (!page.sessions.length) return result;
  for (const key of Object.keys(result) as (keyof typeof result)[]) {
    const a = result[key],
      b = page.indicators[key];
    if (a.status !== b.status || a.artifact_digest !== b.artifact_digest)
      return null;
    const points = mergeUnique(a.points, b.points, (value) => value.session);
    if (!points) return null;
    result[key] = {
      ...a,
      points: points.sort((x, y) => x.session.localeCompare(y.session)),
    };
  }
  return result;
}
export function mergeChartPages(
  current: ChartData,
  page: ChartData,
): ChartData | null {
  if (current.overlays.has_more && page.sessions.length) return null;
  if (
    current.revision !== page.revision ||
    current.ticker !== page.ticker ||
    current.data_mode !== page.data_mode ||
    JSON.stringify(current.context) !== JSON.stringify(page.context) ||
    JSON.stringify(current.source) !== JSON.stringify(page.source)
  )
    return null;
  const sessions = [...new Set([...page.sessions, ...current.sessions])].sort();
  const bars = mergeUnique(current.bars, page.bars, (value) => value.session);
  const gaps = mergeUnique(current.gaps, page.gaps, (value) => value.session);
  const indicators = mergeIndicators(current, page);
  const levels = mergeUnique(
    current.overlays.levels,
    page.overlays.levels,
    (value) => value.id,
  );
  const markers = mergeUnique(
    current.overlays.markers,
    page.overlays.markers,
    (value) => value.id,
  );
  if (
    !bars ||
    !gaps ||
    !indicators ||
    !levels ||
    !markers ||
    gaps.some((g) => bars.some((b) => b.session === g.session))
  )
    return null;
  return {
    ...current,
    quality: page.quality,
    sessions,
    bars: bars.sort((a, b) => a.session.localeCompare(b.session)),
    gaps: gaps.sort((a, b) => a.session.localeCompare(b.session)),
    indicators,
    overlays: { ...page.overlays, levels, markers },
    pagination: page.sessions.length
      ? {
          ...page.pagination,
          window_to: current.pagination.window_to,
          returned_slots: sessions.length,
        }
      : current.pagination,
  };
}
