import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseActualAnalytics,
  parseActualRCurve,
  parseActualAttribution,
  parseLivePaperJournal,
} from "../src/lib/actual-analytics.ts";
import { journalFilterParams, journalFilters } from "../src/lib/journal-filters.ts";

const filters = journalFilters({ from: "2026-09-01", to: "2026-10-02", strategy: "MACD_EMA200_V1", exit_snapshot: "fixed2r" });
const envelope = {
  mode: "actual", data_mode: "live", basis: "IDR", cohort_date: "exit_session_Asia_Jakarta",
  from: filters.from, to: filters.to, primary_strategy: filters.strategy,
  exit_version: filters.exitVersion, exit_snapshot: filters.exitSnapshot,
  closed: 1, open: 1, draft: 1, wins: 1, losses: 0, breakeven: 0,
  estimated_fee_trades: 0, fee_quality: "actual", net_pnl_idr: "1000.0000",
  win_rate: 1, expectancy_r: "0.833333333333", profit_factor: null,
  profit_factor_status: "no_losses", payoff_ratio: null, payoff_status: "no_losses",
};

test("analytics preserves canonical decimal values and validates exact cohort independently of JSON key order", () => {
  assert.equal(parseActualAnalytics(envelope, "live", filters), envelope);
  const reordered = { ...envelope, exit_snapshot: { target_r: 2, mode: "fixed_rr", version: "actual-fixed2r-v1" } };
  assert.equal(parseActualAnalytics(reordered, "live", filters), reordered);
  assert.equal(parseActualAnalytics({ ...envelope, data_mode: "fixture" }, "fixture", filters)?.expectancy_r, "0.833333333333");
});

test("analytics rejects mode, monetary basis, timezone and cohort drift instead of presenting metrics", () => {
  for (const change of [
    { mode: "paper" }, { data_mode: "fixture" }, { basis: "R" },
    { cohort_date: "entry_session_UTC" }, { from: null }, { to: "2026-10-03" },
    { primary_strategy: null }, { exit_version: "another-version" }, { exit_snapshot: null },
    { exit_snapshot: { ...filters.exitSnapshot, target_r: 1.5 } },
    { exit_snapshot: { ...filters.exitSnapshot, extra: true } },
  ]) assert.equal(parseActualAnalytics({ ...envelope, ...change }, "live", filters), null, JSON.stringify(change));
  for (const bad of [null, [], {}, "failure"]) assert.equal(parseActualAnalytics(bad, "live", filters), null);
});

test("analytics rejects missing, nonfinite and invalid metric or status fields", () => {
  for (const change of [
    { closed: -1 }, { open: 0.5 }, { draft: "1" }, { wins: undefined },
    { net_pnl_idr: "NaN" }, { net_pnl_idr: "0x10" }, { net_pnl_idr: Infinity },
    { win_rate: 2 }, { expectancy_r: undefined }, { profit_factor: -2 },
    { profit_factor: 2 }, { profit_factor_status: "defined" },
    { payoff_ratio: 2 }, { payoff_status: "defined" },
    { fee_quality: undefined }, { payoff_status: "infinite" },
  ]) assert.equal(parseActualAnalytics({ ...envelope, ...change }, "live", filters), null, JSON.stringify(change));
});

test("defined, no-closed, no-win and no-loss analytics retain explicit backend null semantics", () => {
  const all = journalFilters({});
  const base = { ...envelope, from: null, to: null, primary_strategy: null, exit_version: null, exit_snapshot: null };
  const empty = { ...base, closed: 0, wins: 0, net_pnl_idr: 0, win_rate: null, expectancy_r: null,
    fee_quality: "no_closed", profit_factor_status: "no_closed", payoff_status: "no_closed" };
  assert.equal(parseActualAnalytics(empty, "live", all), empty);
  const lossOnly = { ...base, wins: 0, losses: 1, net_pnl_idr: -100, win_rate: 0,
    expectancy_r: -1, profit_factor: 0, profit_factor_status: "defined", payoff_status: "no_wins" };
  assert.equal(parseActualAnalytics(lossOnly, "live", all), lossOnly);
  const defined = { ...base, closed: 2, wins: 1, losses: 1, win_rate: 0.5,
    profit_factor: "1.25", profit_factor_status: "defined", payoff_ratio: "1.25", payoff_status: "defined" };
  assert.equal(parseActualAnalytics(defined, "live", all), defined);
});

test("cohort navigation/export serialization roundtrips every filter without widening", () => {
  const selected = journalFilters({ from: "2026-09-01", to: "2026-10-02", strategy: "MACD_EMA200_V1",
    exit_version: "actual-fixed2r-v1", exit_snapshot: "fixed2r" });
  const params = journalFilterParams(selected);
  assert.deepEqual(journalFilters(Object.fromEntries(params)), selected);
  const strategyChange = { ...selected, strategy: "RS_BREAKOUT_V1" };
  assert.deepEqual(journalFilters(Object.fromEntries(journalFilterParams(strategyChange))), strategyChange);
  assert.equal(journalFilterParams(journalFilters({})).toString(), "");
});

const rCurveEnvelope = {
  mode: "actual",
  data_mode: "live",
  basis: "IDR",
  cohort_date: "exit_session_Asia_Jakarta",
  from: filters.from,
  to: filters.to,
  primary_strategy: filters.strategy,
  exit_version: filters.exitVersion,
  exit_snapshot: filters.exitSnapshot,
  total_closed: 2,
  final_cumulative_r: "2.500000000000",
  max_drawdown_r: "0.500000000000",
  points: [
    {
      sequence: 1,
      trade_id: "33333333-3333-4333-8333-333333333333",
      ticker: "BBCA",
      strategy: "MACD_EMA200_V1",
      exit_session: "2026-09-15",
      closed_at: "2026-09-15T09:00:00Z",
      realized_r: "1.500000000000",
      cumulative_r: "1.500000000000",
      drawdown_r: "0.000000000000",
      realized_pnl_idr: "1500000.0000",
      cumulative_pnl_idr: "1500000.0000",
    },
    {
      sequence: 2,
      trade_id: "44444444-4444-4444-8444-444444444444",
      ticker: "TLKM",
      strategy: "MACD_EMA200_V1",
      exit_session: "2026-09-20",
      closed_at: "2026-09-20T09:00:00Z",
      realized_r: "1.000000000000",
      cumulative_r: "2.500000000000",
      drawdown_r: "0.000000000000",
      realized_pnl_idr: "1000000.0000",
      cumulative_pnl_idr: "2500000.0000",
    },
  ],
};

test("parseActualRCurve validates canonical schema and cohort match", () => {
  assert.equal(parseActualRCurve(rCurveEnvelope, "live", filters), rCurveEnvelope);
  // Rejects invalid basis or mismatching mode
  assert.equal(parseActualRCurve({ ...rCurveEnvelope, basis: "R" }, "live", filters), null);
  assert.equal(parseActualRCurve({ ...rCurveEnvelope, data_mode: "fixture" }, "live", filters), null);
  assert.equal(parseActualRCurve({ ...rCurveEnvelope, final_cumulative_r: "invalid" }, "live", filters), null);
  assert.equal(parseActualRCurve({ ...rCurveEnvelope, max_drawdown_r: -1 }, "live", filters), null);
  // Rejects invalid points
  const badPoint = { ...rCurveEnvelope, points: [{ ...rCurveEnvelope.points[0], trade_id: 123 }] };
  assert.equal(parseActualRCurve(badPoint, "live", filters), null);
});

const attributionEnvelope = {
  mode: "actual",
  data_mode: "live",
  basis: "IDR",
  cohort_date: "exit_session_Asia_Jakarta",
  from: filters.from,
  to: filters.to,
  exit_version: filters.exitVersion,
  exit_snapshot: filters.exitSnapshot,
  strategies: [
    {
      strategy: "MACD_EMA200_V1",
      closed: 2,
      wins: 2,
      losses: 0,
      breakeven: 0,
      win_rate: 1,
      net_pnl_idr: "2000000.0000",
      expectancy_r: "1.250000000000",
      profit_factor: null,
      profit_factor_status: "no_losses",
      payoff_ratio: null,
      payoff_status: "no_losses",
    },
  ],
};

test("parseActualAttribution validates canonical schema and strategy list", () => {
  assert.equal(parseActualAttribution(attributionEnvelope, "live", filters), attributionEnvelope);
  assert.equal(parseActualAttribution({ ...attributionEnvelope, mode: "paper" }, "live", filters), null);
  assert.equal(parseActualAttribution({ ...attributionEnvelope, strategies: "not-array" }, "live", filters), null);
  const badStrat = {
    ...attributionEnvelope,
    strategies: [{ ...attributionEnvelope.strategies[0], profit_factor_status: "invalid_status" }],
  };
  assert.equal(parseActualAttribution(badStrat, "live", filters), null);
});

const livePaperEnvelope = {
  mode: "paper",
  data_mode: "live",
  trades_count: 2,
  closed_count: 1,
  open_count: 1,
  data_hold_count: 0,
  ambiguous_count: 0,
  wins: 1,
  losses: 0,
  win_rate: 1,
  expectancy_r: "2.000000000000",
  cumulative_r: "2.000000000000",
  trades: [
    {
      id: "paper-1",
      ticker: "BBCA",
      strategy: "MACD_EMA200_V1",
      state: "closed",
      entry_price: 10000,
      initial_stop: 9500,
      current_stop: 9500,
      target_price: 11000,
      realized_r: "2.000000000000",
      alternate_r: null,
      reason: "take_profit",
    },
    {
      id: "paper-2",
      ticker: "TLKM",
      strategy: "FRACTAL_BREAKOUT_V1",
      state: "open",
      entry_price: 3200,
      initial_stop: 3000,
      current_stop: 3000,
      target_price: 3600,
      realized_r: null,
      alternate_r: null,
      reason: "entry_filled",
    },
  ],
};

test("parseLivePaperJournal validates paper payload and rejects actual bleed", () => {
  assert.equal(parseLivePaperJournal(livePaperEnvelope, "live"), livePaperEnvelope);
  // Rejects actual mode
  assert.equal(parseLivePaperJournal({ ...livePaperEnvelope, mode: "actual" }, "live"), null);
  // Rejects mode mismatch
  assert.equal(parseLivePaperJournal(livePaperEnvelope, "fixture"), null);
  // Rejects non-integer counts
  assert.equal(parseLivePaperJournal({ ...livePaperEnvelope, closed_count: -1 }, "live"), null);
  assert.equal(parseLivePaperJournal({ ...livePaperEnvelope, trades_count: 1.5 }, "live"), null);
  // Rejects missing trades
  assert.equal(parseLivePaperJournal({ ...livePaperEnvelope, trades: null }, "live"), null);
});
