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
  profit_factor_idr?: Decimal | null; payoff_ratio_idr?: Decimal | null;
  profit_factor_state?: RatioState; payoff_ratio_state?: RatioState;
};
export type RatioState = "finite" | "no_closed" | "no_losses" | "no_wins" | "no_directional_results";
export type ProcessingHealth = {
  contract_version: 1; data_mode: "fixture" | "live"; model_version: string;
  expected_session: string | null; processed_session: string | null;
  status: "ready" | "overdue" | "missing" | "calendar_unknown" | "failed" | "running" | "data_hold";
  overdue: boolean; pending_entry_due: number; calendar_version: string; checked_at: string;
  latest_job_status: string | null; latest_job_phase: string | null; failure_code: string | null;
  last_attempt_at: string | null;
  next_eligible_processing_at?: string | null;
  data_hold_count: number; held_since_session: string | null;
};
export type ReportingTrade = {
  id: string; ticker: string; strategy: string; state: string;
  signal_id: string | null; signal_session: string | null; entry_session: string | null;
  entry_price: Decimal | null; initial_stop: Decimal | null; target_price: Decimal | null;
  lots: number | null; initial_price_risk_idr: Decimal | null; planned_loss_idr: Decimal | null;
  exit_session: string | null; exit_price: Decimal | null; fee_total_idr: Decimal | null;
  realized_pnl_idr: Decimal | null; realized_r: Decimal | null; reason: string | null;
  ambiguous: boolean; model_version: string | null;
  metric_eligible?: boolean; exclusion_reason?: string | null; cohort?: string | null;
  holding_sessions?: number | null; holding_calendar_days?: number | null;
  open_quantity?: number; current_stop?: Decimal | null; revision?: number;
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
  processing_health?: ProcessingHealth | null;
  paging: { page: number; page_size: 25; has_more: boolean };
};
export type TradeReporting = Metadata & {
  mode: "paper" | "actual"; basis: "IDR"; cohort_date: "exit_session_Asia_Jakarta";
  exit_key: string | null; exit_version: string | null; exit_snapshot: Record<string, unknown> | null;
  summary: ReportingSummary; strategies: ReportingStrategy[]; curve: ReportingCurvePoint[];
  statuses: Record<"pending_entry" | "open" | "closed" | "skipped" | "expired" | "data_hold" | "ambiguous", number> & { draft?: number };
  trades: ReportingTrade[];
  sensitivities?: { sl_first: ReportingSummary; tp_first: ReportingSummary };
  exclusions?: { closed_excluded: number; reasons: Record<string, number> };
  status_scope?: "all_history";
  experiment_comparison?: ExperimentComparison | null;
};
type ComparisonSide = {
  signals: number; entered: number; closed_assessed: number; open: number; pending_entry: number;
  skipped: number; excluded: number; summary: ReportingSummary; mean_holding_sessions: Decimal | null;
};
type PairedTrade = { trade_id: string; state: string; metric_eligible: boolean; pnl_idr: Decimal | null; holding_sessions: number | null };
export type ExperimentComparison = {
  cohort_basis: "exit_session_and_active";
  common_entry_signal_ids: string[]; fixed_only_entry_signal_ids: string[]; sma_only_entry_signal_ids: string[];
  fixed2r: ComparisonSide; ma10: ComparisonSide;
  paired: { signal_id: string; ticker: string; strategy: string; fixed2r: PairedTrade; ma10: PairedTrade }[];
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
// Compare redundant contract values only; official results remain backend-owned.
function consistentRate(value: unknown, wins: number, assessed: number) {
  return assessed === 0 ? value === null : decimal(value)
    && Math.abs(Number(value) - wins / assessed) <= 1e-12;
}
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
    && (v.processing_health === undefined || v.processing_health === null || parseProcessingHealth(v.processing_health, dataMode as "fixture" | "live") !== null)
    && record(v.paging) && v.paging.page === f.page && v.paging.page_size === 25 && typeof v.paging.has_more === "boolean";
}
export function parseProcessingHealth(value: unknown, dataMode: "fixture" | "live"): ProcessingHealth | null {
  if (!record(value) || value.contract_version !== 1 || value.data_mode !== dataMode || value.model_version !== paperModelVersion
    || !nullableDate(value.expected_session) || !nullableDate(value.processed_session)
    || !["ready", "overdue", "missing", "calendar_unknown", "failed", "running", "data_hold"].includes(String(value.status))
    || typeof value.overdue !== "boolean" || !count(value.pending_entry_due) || typeof value.calendar_version !== "string"
    || value.checked_at === null || !nullableTimestamp(value.checked_at) || !nullableTimestamp(value.last_attempt_at)
    || !count(value.data_hold_count) || !nullableDate(value.held_since_session)
    || value.next_eligible_processing_at !== undefined && !nullableTimestamp(value.next_eligible_processing_at)
    || !["latest_job_status", "latest_job_phase", "failure_code"].every(key => nullableString(value[key]))) return null;
  if (value.latest_job_status !== null && !["running", "succeeded", "failed", "skipped"].includes(String(value.latest_job_status))
    || value.latest_job_phase !== null && !["scanner", "publication", "paper", "job"].includes(String(value.latest_job_phase))) return null;
  if (value.status === "ready" && (value.overdue || value.expected_session === null || value.processed_session === null
    || String(value.processed_session) < String(value.expected_session))) return null;
  if (value.status === "overdue" && (!value.overdue || value.expected_session === null)) return null;
  if (value.status === "calendar_unknown" && value.expected_session !== null) return null;
  if (value.status === "data_hold" && (value.data_hold_count === 0 || value.held_since_session === null)) return null;
  if (value.status === "ready" && value.data_hold_count !== 0) return null;
  return value as ProcessingHealth;
}
function ratioFields(v: Record<string, unknown>) {
  const states = ["finite", "no_closed", "no_losses", "no_wins", "no_directional_results"];
  return (["profit_factor", "payoff_ratio"] as const).every(key => {
    const val = v[key + "_idr"], state = v[key + "_state"];
    if (val === undefined && state === undefined) return true; // Older backend: UI explicitly reports unavailable capability.
    if (!states.includes(String(state)) || !nullableDecimal(val) || val !== null && Number(val) < 0) return false;
    const closed = Number(v.closed), wins = Number(v.wins), losses = Number(v.losses);
    if (state === "finite") return val !== null && losses > 0 && (key === "profit_factor" || wins > 0);
    if (state === "no_wins") return wins === 0 && losses > 0 && (key === "profit_factor" ? val !== null && Number(val) === 0 : val === null);
    if (state === "no_closed") return val === null && closed === 0;
    if (state === "no_losses") return val === null && losses === 0 && wins > 0;
    return val === null && closed > 0 && wins === 0 && losses === 0;
  });
}
function summary(v: unknown, withDrawdown = true): boolean {
  return record(v) && ["closed", "wins", "losses", "breakeven"].every(k => count(v[k]))
    && Number(v.closed) === Number(v.wins) + Number(v.losses) + Number(v.breakeven)
    && decimal(v.net_pnl_idr) && rate(v.win_rate) && nullableDecimal(v.expectancy_idr) && nullableDecimal(v.expectancy_r)
    && consistentRate(v.win_rate, Number(v.wins), Number(v.closed))
    && (Number(v.closed) === 0 ? v.win_rate === null && v.expectancy_idr === null && v.expectancy_r === null : v.win_rate !== null && v.expectancy_idr !== null)
    && ratioFields(v) && (!withDrawdown || decimal(v.max_drawdown_idr) && Number(v.max_drawdown_idr) >= 0);
}
const tradeStates = ["pending_entry", "open", "closed", "data_hold", "skipped_budget", "skipped_position", "skipped", "expired", "ambiguous", "ambiguous_review", "draft"];
function trade(v: unknown): boolean {
  return record(v) && typeof v.id === "string" && v.id.length > 0 && typeof v.ticker === "string" && strategy(v.strategy)
    && tradeStates.includes(String(v.state)) && nullableString(v.signal_id) && nullableDate(v.signal_session)
    && nullableDate(v.entry_session) && nullableDate(v.exit_session) && nullableString(v.reason)
    && nullableString(v.model_version) && typeof v.ambiguous === "boolean" && (v.lots === null || count(v.lots))
    && ["entry_price", "initial_stop", "target_price", "initial_price_risk_idr", "planned_loss_idr", "exit_price", "fee_total_idr", "realized_pnl_idr", "realized_r"].every(k => nullableDecimal(v[k]))
    && (v.metric_eligible === undefined || typeof v.metric_eligible === "boolean" && nullableString(v.exclusion_reason)
      && nullableString(v.cohort) && (v.holding_sessions === null || count(v.holding_sessions))
      && (v.holding_calendar_days === null || count(v.holding_calendar_days))
      && (!v.metric_eligible || v.state === "closed" && v.ambiguous === false && v.exclusion_reason === null && v.realized_pnl_idr !== null));
}
function comparison(v: unknown) {
  if (!record(v) || v.cohort_basis !== "exit_session_and_active") return false;
  const names = ["common_entry_signal_ids", "fixed_only_entry_signal_ids", "sma_only_entry_signal_ids"];
  if (!names.every(key => Array.isArray(v[key]) && (v[key] as unknown[]).every(id => typeof id === "string")
    && new Set(v[key] as string[]).size === (v[key] as string[]).length)) return false;
  const all = names.flatMap(key => v[key] as string[]);
  if (new Set(all).size !== all.length) return false;
  for (const key of ["fixed2r", "ma10"]) {
    const side = v[key];
    if (!record(side) || !["signals", "entered", "closed_assessed", "open", "pending_entry", "skipped", "excluded"].every(k => count(side[k]))
      || !summary(side.summary) || (side.summary as ReportingSummary).closed !== side.closed_assessed
      || !nullableDecimal(side.mean_holding_sessions) || side.mean_holding_sessions !== null && Number(side.mean_holding_sessions) < 0) return false;
  }
  if (!Array.isArray(v.paired) || v.paired.length !== (v.common_entry_signal_ids as string[]).length) return false;
  return v.paired.every(p => record(p) && typeof p.signal_id === "string" && (v.common_entry_signal_ids as string[]).includes(p.signal_id)
    && typeof p.ticker === "string" && strategy(p.strategy) && ["fixed2r", "ma10"].every(k => {
      const t = p[k]; return record(t) && typeof t.trade_id === "string" && tradeStates.includes(String(t.state))
        && typeof t.metric_eligible === "boolean" && nullableDecimal(t.pnl_idr) && (t.holding_sessions === null || count(t.holding_sessions))
        && (!t.metric_eligible || t.state === "closed" && t.pnl_idr !== null);
    })) && new Set(v.paired.map(p => (p as {signal_id: string}).signal_id)).size === v.paired.length;
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
  if (new Set(value.strategies.map(s => s.strategy)).size !== value.strategies.length
    || value.strategies.reduce((total, s) => total + s.closed, 0) !== (value.summary as ReportingSummary).closed) return null;
  if (value.curve.some((p, i) => !record(p) || p.sequence !== i + 1 || typeof p.trade_id !== "string" || typeof p.ticker !== "string"
    || !strategy(p.strategy) || !date(p.exit_session) || !decimal(p.realized_pnl_idr) || !decimal(p.cumulative_pnl_idr))) return null;
  if (value.trades.some(t => !trade(t) || mode === "paper" && (t as ReportingTrade).model_version !== paperModelVersion)) return null;
  if (value.curve.length !== (value.summary as ReportingSummary).closed || new Set(value.curve.map(p => p.trade_id)).size !== value.curve.length) return null;
  if (f.strategy && [...value.trades, ...value.curve, ...value.strategies].some(t => t.strategy !== f.strategy)) return null;
  if (mode === "paper" && value.trades.some(t => value.exit_key === "ma10" ? t.target_price !== null
    : t.target_price !== null && Number(t.target_price) <= Number(t.entry_price))) return null;
  if (mode === "actual" && value.trades.some(t => !["draft", "open", "closed"].includes(t.state)
    || !count(t.open_quantity) || !nullableDecimal(t.current_stop) || !count(t.revision) || t.revision === 0)) return null;
  if (value.statuses.draft !== undefined && !count(value.statuses.draft)) return null;
  const curve = value.curve as ReportingCurvePoint[];
  if (value.trades.some(t => (t.metric_eligible === false || t.ambiguous) && curve.some(p => p.trade_id === t.id))) return null;
  if (value.exclusions !== undefined && (!record(value.exclusions) || !count(value.exclusions.closed_excluded)
    || !record(value.exclusions.reasons) || !Object.values(value.exclusions.reasons).every(count)
    || Object.values(value.exclusions.reasons).reduce<number>((sum, n) => sum + Number(n), 0) !== value.exclusions.closed_excluded)) return null;
  if (value.status_scope !== undefined && value.status_scope !== "all_history") return null;
  if (value.experiment_comparison !== undefined && value.experiment_comparison !== null && (mode !== "paper" || !comparison(value.experiment_comparison))) return null;
  if (value.sensitivities !== undefined && (!record(value.sensitivities) || !summary(value.sensitivities.sl_first) || !summary(value.sensitivities.tp_first))) return null;
  return value as TradeReporting;
}
function cell(v: unknown, signals: number): boolean {
  return record(v) && ["wins", "assessed", "pending", "ambiguous", "data_hold", "excluded"].every(k => count(v[k]))
    && Number(v.wins) <= Number(v.assessed) && rate(v.win_rate) && (v.assessed === 0 ? v.win_rate === null : v.win_rate !== null)
    && consistentRate(v.win_rate, Number(v.wins), Number(v.assessed))
    && ["assessed", "pending", "ambiguous", "data_hold", "excluded"].reduce((total, key) => total + Number(v[key]), 0) === signals
    && record(v.excluded_reasons) && Object.values(v.excluded_reasons).every(count)
    && Object.values(v.excluded_reasons).reduce<number>((total, value) => total + Number(value), 0) === v.excluded;
}
export function parseSignalEvaluation(value: unknown, dataMode: "fixture" | "live", f: ReportingFilters): SignalEvaluation | null {
  if (!record(value) || !metadata(value, dataMode, f) || value.mode !== "signal_evaluation" || value.basis !== "IDR" || value.cohort_date !== "signal_session"
    || value.exit_key !== null || value.exit_version !== null || value.exit_snapshot !== null
    || value.model_version !== paperModelVersion || !Array.isArray(value.strategies) || !Array.isArray(value.evaluations) || value.evaluations.length > 25) return null;
  if (value.strategies.some(s => !record(s) || !strategy(s.strategy) || !count(s.signals) || !record(s.cells)
    || !evaluationKeys.every(k => cell((s.cells as Record<string, unknown>)[k], Number(s.signals))))) return null;
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
    || (value.trade.exit_key === "ma10" ? value.trade.target_price !== null
      : value.trade.target_price !== null && Number(value.trade.target_price) <= Number(value.trade.entry_price))
    || !record(value.trade.config_snapshot) || !nullableString(value.trade.source_digest) || !Array.isArray(value.events)) return null;
  if (value.events.some(e => !record(e) || typeof e.event_id !== "string" || typeof e.event_type !== "string" || !date(e.session_date) || !record(e.payload))) return null;
  return value as PaperTradeDetail;
}
