import type { ActualAnalytics, ActualRCurve, ActualAttribution, LivePaperJournal } from "./journal-server";
import type { JournalFilters } from "./journal-filters";

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function decimal(value: unknown): value is number | string {
  return typeof value === "number" ? Number.isFinite(value)
    : typeof value === "string" && /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value)
      && Number.isFinite(Number(value));
}

function sameSnapshot(value: unknown, expected: JournalFilters["exitSnapshot"]) {
  if (expected === null) return value === null;
  if (!record(value)) return false;
  const keys = Object.keys(expected);
  return Object.keys(value).length === keys.length
    && keys.every(key => value[key] === expected[key as keyof typeof expected]);
}

/** Validate the RPC boundary; canonical monetary/statistical values stay untouched. */
export function parseActualAnalytics(
  value: unknown, expectedMode: "fixture" | "live", filters: JournalFilters,
): ActualAnalytics | null {
  if (!record(value) || value.mode !== "actual" || value.data_mode !== expectedMode
    || value.basis !== "IDR" || value.cohort_date !== "exit_session_Asia_Jakarta"
    || value.from !== filters.from || value.to !== filters.to
    || value.primary_strategy !== filters.strategy || value.exit_version !== filters.exitVersion
    || !sameSnapshot(value.exit_snapshot, filters.exitSnapshot)) return null;

  const counts = ["closed", "open", "draft", "wins", "losses", "breakeven", "estimated_fee_trades"] as const;
  if (counts.some(key => !Number.isSafeInteger(value[key]) || Number(value[key]) < 0)
    || !decimal(value.net_pnl_idr)) return null;

  for (const key of ["win_rate", "expectancy_r", "profit_factor", "payoff_ratio"] as const) {
    if (value[key] !== null && !decimal(value[key])) return null;
  }
  if (value.win_rate !== null && (Number(value.win_rate) < 0 || Number(value.win_rate) > 1)
    || value.profit_factor !== null && Number(value.profit_factor) < 0
    || value.payoff_ratio !== null && Number(value.payoff_ratio) < 0) return null;

  if (!["defined", "no_losses", "no_closed"].includes(String(value.profit_factor_status))
    || !["defined", "no_wins", "no_losses", "no_closed"].includes(String(value.payoff_status))
    || !["actual", "includes_estimates", "no_closed"].includes(String(value.fee_quality))) return null;
  if ((value.profit_factor_status === "defined") !== (value.profit_factor !== null)
    || (value.payoff_status === "defined") !== (value.payoff_ratio !== null)) return null;
  return value as ActualAnalytics;
}

export function parseActualRCurve(
  value: unknown, expectedMode: "fixture" | "live", filters: JournalFilters,
): ActualRCurve | null {
  if (!record(value) || value.mode !== "actual" || value.data_mode !== expectedMode
    || value.basis !== "IDR" || value.cohort_date !== "exit_session_Asia_Jakarta"
    || value.from !== filters.from || value.to !== filters.to
    || value.primary_strategy !== filters.strategy || value.exit_version !== filters.exitVersion
    || !sameSnapshot(value.exit_snapshot, filters.exitSnapshot)) return null;

  if (!Number.isSafeInteger(value.total_closed) || Number(value.total_closed) < 0
    || !decimal(value.final_cumulative_r) || !decimal(value.max_drawdown_r)
    || Number(value.max_drawdown_r) < 0
    || !Array.isArray(value.points)) return null;

  for (const p of value.points) {
    if (!record(p) || !Number.isSafeInteger(p.sequence) || typeof p.trade_id !== "string"
      || typeof p.ticker !== "string" || typeof p.strategy !== "string"
      || typeof p.exit_session !== "string" || !decimal(p.realized_r)
      || !decimal(p.cumulative_r) || !decimal(p.drawdown_r)
      || !decimal(p.realized_pnl_idr) || !decimal(p.cumulative_pnl_idr)) return null;
  }
  return value as ActualRCurve;
}

export function parseActualAttribution(
  value: unknown, expectedMode: "fixture" | "live", filters: JournalFilters,
): ActualAttribution | null {
  if (!record(value) || value.mode !== "actual" || value.data_mode !== expectedMode
    || value.basis !== "IDR" || value.cohort_date !== "exit_session_Asia_Jakarta"
    || value.from !== filters.from || value.to !== filters.to
    || value.exit_version !== filters.exitVersion
    || !sameSnapshot(value.exit_snapshot, filters.exitSnapshot)) return null;

  if (!Array.isArray(value.strategies)) return null;

  for (const s of value.strategies) {
    if (!record(s) || typeof s.strategy !== "string"
      || !Number.isSafeInteger(s.closed) || Number(s.closed) < 0
      || !Number.isSafeInteger(s.wins) || Number(s.wins) < 0
      || !Number.isSafeInteger(s.losses) || Number(s.losses) < 0
      || !Number.isSafeInteger(s.breakeven) || Number(s.breakeven) < 0
      || !decimal(s.net_pnl_idr)) return null;

    if (s.expectancy_r !== null && !decimal(s.expectancy_r)) return null;
    if (s.win_rate !== null && (!decimal(s.win_rate) || Number(s.win_rate) < 0 || Number(s.win_rate) > 1)) return null;
    if (s.profit_factor !== null && (!decimal(s.profit_factor) || Number(s.profit_factor) < 0)) return null;
    if (s.payoff_ratio !== null && (!decimal(s.payoff_ratio) || Number(s.payoff_ratio) < 0)) return null;

    if (!["defined", "no_losses", "no_closed"].includes(String(s.profit_factor_status))
      || !["defined", "no_wins", "no_losses", "no_closed"].includes(String(s.payoff_status))) return null;
  }
  return value as ActualAttribution;
}

export function parseLivePaperJournal(
  value: unknown, expectedMode: "fixture" | "live",
): LivePaperJournal | null {
  if (!record(value) || value.mode !== "paper" || value.data_mode !== expectedMode) return null;

  const counts = ["trades_count", "closed_count", "open_count", "data_hold_count", "ambiguous_count", "wins", "losses"] as const;
  if (counts.some(key => !Number.isSafeInteger(value[key]) || Number(value[key]) < 0)
    || !decimal(value.cumulative_r) || !Array.isArray(value.trades)) return null;

  if (value.win_rate !== null && (!decimal(value.win_rate) || Number(value.win_rate) < 0 || Number(value.win_rate) > 1)) return null;
  if (value.expectancy_r !== null && !decimal(value.expectancy_r)) return null;

  for (const t of value.trades) {
    if (!record(t) || typeof t.id !== "string" || typeof t.ticker !== "string"
      || typeof t.strategy !== "string" || typeof t.state !== "string") return null;
  }
  return value as LivePaperJournal;
}
