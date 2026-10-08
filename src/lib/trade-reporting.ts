import type { JournalFilters } from "./journal-filters";
/** Strict owner RPC boundary; canonical money/statistics are never recomputed here. */
export const paperModelVersion = "close-signal-risk-v1";
export const reportingStrategies = ["MACD_EMA200_V1", "FRACTAL_BREAKOUT_V1", "RS_BREAKOUT_V1", "PULLBACK_RECLAIM_V1"] as const;
export const strategyLabels: Record<string, string> = {
  MACD_EMA200_V1: "MACD + EMA200", FRACTAL_BREAKOUT_V1: "Fractal Breakout",
  RS_BREAKOUT_V1: "RS Breakout", PULLBACK_RECLAIM_V1: "Pullback Reclaim",
};
export type Decimal = number | string;
export type ReportingFilters = JournalFilters & { exitKey: "fixed2r" | "ma10"; page: number };

export type ReportingSummary = {
  closed: number; wins: number; losses: number; breakeven: number;
  net_pnl_idr: Decimal; win_rate: Decimal | null; expectancy_idr: Decimal | null;
  expectancy_r: Decimal | null; max_drawdown_idr: Decimal;
};
export type ReportingTrade = {
  id: string; ticker: string; strategy: string; state: string;
  signal_id: string | null; signal_session: string | null; entry_session: string | null;
  entry_price: Decimal | null; initial_stop: Decimal | null; target_price: Decimal | null;
  lots: number | null; initial_price_risk_idr: Decimal | null; planned_loss_idr: Decimal | null;
  exit_session: string | null; exit_price: Decimal | null; fee_total_idr: Decimal | null;
  realized_pnl_idr: Decimal | null; realized_r: Decimal | null; reason: string | null;
  ambiguous: boolean; model_version: string | null;
};
export type ReportingCurvePoint = {
  sequence: number; trade_id: string; ticker: string; strategy: string; exit_session: string;
  realized_pnl_idr: Decimal; cumulative_pnl_idr: Decimal;
};
export type ReportingStrategy = Omit<ReportingSummary, "max_drawdown_idr"> & { strategy: string };
export type ScannerCoverage = {
  status: "complete" | "partial" | "failed" | "missing";
  session_date: string | null;
  coverage_valid: number | null;
  coverage_total: number | null;
};
type Metadata = {
  contract_version: 1; data_mode: "fixture" | "live"; model_version: string | null;
  from: string | null; to: string | null; primary_strategy: string | null;
  as_of_session: string | null; updated_at: string | null;
  coverage_status: "complete" | "partial" | "missing" | "stale";
  scanner_coverage?: ScannerCoverage | null;
  paging: { page: number; page_size: 25; has_more: boolean };
};
export type TradeReporting = Metadata & {
  mode: "paper" | "actual"; basis: "IDR"; cohort_date: "exit_session_Asia_Jakarta";
  exit_key: string | null; exit_version: string | null; exit_snapshot: Record<string, unknown> | null;
  summary: ReportingSummary; strategies: ReportingStrategy[]; curve: ReportingCurvePoint[];
  statuses: Record<"pending_entry" | "open" | "closed" | "skipped" | "expired" | "data_hold" | "ambiguous", number>;
  trades: ReportingTrade[];
  sensitivities?: { sl_first: ReportingSummary; tp_first: ReportingSummary };
};
export const evaluationKeys = ["target_1r", "target_2r", "net_5", "net_10"] as const;
export type EvaluationKey = typeof evaluationKeys[number];
export type EvaluationCell = {
  wins: number; assessed: number; pending: number; ambiguous: number; data_hold: number;
  excluded: number; excluded_reasons: Record<string, number>; win_rate: Decimal | null;
};
export type SignalEvaluation = Metadata & {
  mode: "signal_evaluation"; basis: "IDR"; cohort_date: "signal_session";
  exit_key: null; exit_version: null; exit_snapshot: null;
  strategies: { strategy: string; signals: number; cells: Record<EvaluationKey, EvaluationCell> }[];
  evaluations: {
    signal_id: string; ticker: string; strategy: string; signal_session: string;
    entry_session: string; entry_price: Decimal; initial_stop: Decimal;
    target_1r: Decimal; target_2r: Decimal; observed_sessions: number;
    results: Record<EvaluationKey, string>;
  }[];
};
export type PaperTradeDetail = {
  contract_version: 1; mode: "paper"; data_mode: "fixture" | "live"; model_version: string;
  trade: ReportingTrade & {
    current_stop: Decimal | null; entry_fee_idr: Decimal | null; exit_fee_idr: Decimal | null;
    exit_mode: string; exit_key: string; config_snapshot: Record<string, unknown>; source_digest: string | null;
  };
  events: { event_id: string; event_type: string; session_date: string; payload: Record<string, unknown> }[];
};
function record(v: unknown): v is Record<string, unknown> { return v !== null && typeof v === "object" && !Array.isArray(v); }
function count(v: unknown): v is number { return Number.isSafeInteger(v) && Number(v) >= 0; }
function decimal(v: unknown): v is Decimal {
  return typeof v === "number" ? Number.isFinite(v) : typeof v === "string" && /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(v) && Number.isFinite(Number(v));
}
function nullableDecimal(v: unknown) { return v === null || decimal(v); }
function nullableString(v: unknown) { return v === null || typeof v === "string"; }
function date(v: unknown) {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const parsed = new Date(v + "T00:00:00Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === v;
}
function nullableDate(v: unknown) { return v === null || date(v); }
function nullableTimestamp(v: unknown) {
  return v === null || typeof v === "string" && date(v.slice(0, 10))
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(v)
    && Number.isFinite(Date.parse(v));
}
function strategy(v: unknown) { return reportingStrategies.includes(v as typeof reportingStrategies[number]); }
function rate(v: unknown) { return v === null || decimal(v) && Number(v) >= 0 && Number(v) <= 1; }
function sameSnapshot(v: unknown, expected: Record<string, unknown> | null) {
  return expected === null ? v === null : record(v) && Object.keys(v).length === Object.keys(expected).length && Object.keys(expected).every(k => v[k] === expected[k]);
}
function scannerCoverage(v: unknown): boolean {
  // Optional for SQL009 compatibility. Null is used by actual ledger reporting.
  if (v === undefined || v === null) return true;
  if (!record(v) || !["complete", "partial", "failed", "missing"].includes(String(v.status))
    || !nullableDate(v.session_date)) return false;
  const valid = v.coverage_valid, total = v.coverage_total;
  if (valid === null || total === null) {
    return valid === null && total === null && (v.status === "missing" ? v.session_date === null : v.status === "failed" && date(v.session_date));
  }
  if (!count(valid) || !count(total) || total === 0 || valid > total || !date(v.session_date)) return false;
  if (v.status === "complete") return valid === total;
  if (v.status === "partial") return valid > 0 && valid < total;
  return v.status === "failed" && valid === 0;
}
function metadata(v: Record<string, unknown>, dataMode: string, f: ReportingFilters) {
  return v.contract_version === 1 && v.data_mode === dataMode && v.from === f.from && v.to === f.to
    && v.primary_strategy === f.strategy && nullableDate(v.as_of_session)
    && (v.mode !== "actual" || v.scanner_coverage == null) && scannerCoverage(v.scanner_coverage) && nullableTimestamp(v.updated_at) && ["complete", "partial", "missing", "stale"].includes(String(v.coverage_status))
    && record(v.paging) && v.paging.page === f.page && v.paging.page_size === 25 && typeof v.paging.has_more === "boolean";
}
function summary(v: unknown, withDrawdown = true): boolean {
  return record(v) && ["closed", "wins", "losses", "breakeven"].every(k => count(v[k]))
    && Number(v.closed) === Number(v.wins) + Number(v.losses) + Number(v.breakeven)
    && decimal(v.net_pnl_idr) && rate(v.win_rate) && nullableDecimal(v.expectancy_idr) && nullableDecimal(v.expectancy_r)
    && (Number(v.closed) === 0 ? v.win_rate === null && v.expectancy_idr === null && v.expectancy_r === null : v.win_rate !== null && v.expectancy_idr !== null)
    && (!withDrawdown || decimal(v.max_drawdown_idr) && Number(v.max_drawdown_idr) >= 0);
}
const tradeStates = ["pending_entry", "open", "closed", "data_hold", "skipped_budget", "skipped_position", "skipped", "expired", "ambiguous", "ambiguous_review", "draft"];
function trade(v: unknown): boolean {
  return record(v) && typeof v.id === "string" && v.id.length > 0 && typeof v.ticker === "string" && strategy(v.strategy)
    && tradeStates.includes(String(v.state)) && nullableString(v.signal_id) && nullableDate(v.signal_session)
    && nullableDate(v.entry_session) && nullableDate(v.exit_session) && nullableString(v.reason)
    && nullableString(v.model_version) && typeof v.ambiguous === "boolean" && (v.lots === null || count(v.lots))
    && ["entry_price", "initial_stop", "target_price", "initial_price_risk_idr", "planned_loss_idr", "exit_price", "fee_total_idr", "realized_pnl_idr", "realized_r"].every(k => nullableDecimal(v[k]));
}
export function parseTradeReporting(value: unknown, dataMode: "fixture" | "live", mode: "paper" | "actual", f: ReportingFilters): TradeReporting | null {
  if (!record(value) || !metadata(value, dataMode, f) || value.mode !== mode || value.basis !== "IDR" || value.cohort_date !== "exit_session_Asia_Jakarta"
    || (mode === "paper" ? value.model_version !== paperModelVersion || value.exit_key !== f.exitKey : value.model_version !== null || value.exit_key !== null)
    || value.exit_version !== (mode === "actual" ? f.exitVersion : null)
    || !sameSnapshot(value.exit_snapshot, mode === "actual" ? f.exitSnapshot : null)
    || !summary(value.summary) || !record(value.statuses)
    || !["pending_entry", "open", "closed", "skipped", "expired", "data_hold", "ambiguous"].every(k => count((value.statuses as Record<string, unknown>)[k]))
    || !Array.isArray(value.strategies) || !Array.isArray(value.curve) || !Array.isArray(value.trades) || value.trades.length > 25) return null;
  if (value.strategies.some(s => !record(s) || !strategy(s.strategy) || !summary(s, false))) return null;
  if (value.curve.some((p, i) => !record(p) || p.sequence !== i + 1 || typeof p.trade_id !== "string" || typeof p.ticker !== "string"
    || !strategy(p.strategy) || !date(p.exit_session) || !decimal(p.realized_pnl_idr) || !decimal(p.cumulative_pnl_idr))) return null;
  if (value.trades.some(t => !trade(t) || mode === "paper" && (t as ReportingTrade).model_version !== paperModelVersion)) return null;
  if (value.sensitivities !== undefined && (!record(value.sensitivities) || !summary(value.sensitivities.sl_first) || !summary(value.sensitivities.tp_first))) return null;
  return value as TradeReporting;
}
function cell(v: unknown): boolean {
  return record(v) && ["wins", "assessed", "pending", "ambiguous", "data_hold", "excluded"].every(k => count(v[k]))
    && Number(v.wins) <= Number(v.assessed) && rate(v.win_rate) && (v.assessed === 0 ? v.win_rate === null : v.win_rate !== null)
    && record(v.excluded_reasons) && Object.values(v.excluded_reasons).every(count);
}
export function parseSignalEvaluation(value: unknown, dataMode: "fixture" | "live", f: ReportingFilters): SignalEvaluation | null {
  if (!record(value) || !metadata(value, dataMode, f) || value.mode !== "signal_evaluation" || value.basis !== "IDR" || value.cohort_date !== "signal_session"
    || value.exit_key !== null || value.exit_version !== null || value.exit_snapshot !== null
    || value.model_version !== paperModelVersion || !Array.isArray(value.strategies) || !Array.isArray(value.evaluations) || value.evaluations.length > 25) return null;
  if (value.strategies.some(s => !record(s) || !strategy(s.strategy) || !count(s.signals) || !record(s.cells)
    || !evaluationKeys.every(k => cell((s.cells as Record<string, unknown>)[k])))) return null;
  const states = ["pending", "won", "lost", "ambiguous", "data_hold", "excluded"];
  if (value.evaluations.some(e => !record(e) || typeof e.signal_id !== "string" || typeof e.ticker !== "string" || !strategy(e.strategy)
    || !date(e.signal_session) || !date(e.entry_session) || !count(e.observed_sessions)
    || !["entry_price", "initial_stop", "target_1r", "target_2r"].every(k => decimal(e[k])) || !record(e.results)
    || !evaluationKeys.every(k => states.includes(String((e.results as Record<string, unknown>)[k]))))) return null;
  return value as SignalEvaluation;
}
export function parsePaperTradeDetail(value: unknown, dataMode: "fixture" | "live", id: string): PaperTradeDetail | null {
  if (!record(value) || value.contract_version !== 1 || value.mode !== "paper" || value.data_mode !== dataMode || value.model_version !== paperModelVersion
    || !trade(value.trade) || !record(value.trade) || value.trade.id !== id || value.trade.model_version !== paperModelVersion
    || !["current_stop", "entry_fee_idr", "exit_fee_idr"].every(k => nullableDecimal((value.trade as Record<string, unknown>)[k]))
    || !["fixed2r", "ma10"].includes(String(value.trade.exit_key)) || !["fixed_rr", "ma_close"].includes(String(value.trade.exit_mode))
    || (value.trade.exit_key === "ma10" ? value.trade.exit_mode !== "ma_close" : value.trade.exit_mode !== "fixed_rr")
    || !record(value.trade.config_snapshot) || !nullableString(value.trade.source_digest) || !Array.isArray(value.events)) return null;
  if (value.events.some(e => !record(e) || typeof e.event_id !== "string" || typeof e.event_type !== "string" || !date(e.session_date) || !record(e.payload))) return null;
  return value as PaperTradeDetail;
}
