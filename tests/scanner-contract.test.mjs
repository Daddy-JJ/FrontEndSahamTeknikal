import { test } from "node:test";
import assert from "node:assert/strict";
import { parseScanRun, parseScanItem, parsePublishedSignal, scannerQuery, scannerHref, scanWindow } from "../src/lib/scanner-contract.ts";

const run = { id: "11111111-1111-4111-8111-111111111111", namespace: "forward", data_mode: "live",
  session_date: "2026-09-28", status: "complete", coverage_valid: 100, coverage_total: 100,
  stored_at: "2026-09-28T14:00:00Z", run_digest: "a".repeat(64), ranking_status: "complete",
  publication_deadline: "2026-09-29T02:00:00Z" };
const c = { strategy: "FRACTAL_BREAKOUT_V1", triggered: true, reason: "eligible", reference_close: 100, stop: 95 };
const signal = { signals: { id: "b".repeat(64), namespace: "forward", data_mode: "live", ticker: "TEST",
  strategy: c.strategy, session_date: run.session_date, planned_entry_session: "2026-09-29",
  cohort: "forward", published_at: run.stored_at, provider: "yfinance", universe_version: "test-only",
  calendar_version: "test-only", candidate: c } };

test("mixed modes, malformed coverage and contradictory RS fail closed", () => {
  assert.ok(parseScanRun(run, "live"));
  for (const change of [{ data_mode: "fixture" }, { namespace: "backtest" }, { session_date: "2026-02-30" },
    { status: "partial" }, { status: "partial", coverage_valid: 99 }, { coverage_total: 0 }]) {
    assert.equal(parseScanRun({ ...run, ...change }, "live"), null);
  }
  assert.ok(parseScanRun({ ...run, status: "partial", coverage_valid: 99, ranking_status: "cross_section_incomplete" }, "live"));
});
test("published signals cannot cross run, provider mode or incomplete RS", () => {
  assert.ok(parsePublishedSignal(signal, run));
  for (const change of [{ data_mode: "fixture" }, { provider: "fixture" }, { session_date: "2026-09-29" },
    { planned_entry_session: "2026-09-28" }, { cohort: "backtest" }]) {
    assert.equal(parsePublishedSignal({ signals: { ...signal.signals, ...change } }, run), null);
  }
  const rs = { ...c, strategy: "RS_BREAKOUT_V1" };
  assert.equal(parsePublishedSignal({ signals: { ...signal.signals, strategy: rs.strategy, candidate: rs } },
    { ...run, ranking_status: "cross_section_incomplete" }), null);
  // Preserve backend decisions; do not recreate execution eligibility arithmetic.
  assert.ok(parsePublishedSignal({ signals: { ...signal.signals, candidate: { ...c, stop: null, reason: "missing_stop" } } }, run));
});
test("skip snapshots cannot masquerade as evaluated candidates", () => {
  const skip = { ticker: "TEST", status: "corporate_action_hold", snapshot: { ticker: "TEST", status: "corporate_action_hold", candidates: [] } };
  assert.ok(parseScanItem(skip));
  assert.equal(parseScanItem({ ...skip, snapshot: { ...skip.snapshot, candidates: [c] } }), null);
  assert.equal(parseScanItem({ ...skip, snapshot: { ...skip.snapshot, ticker: "OTHER" } }), null);
});

test("optional signal detail metadata is validated without inventing unavailable values", () => {
  const detailed = { ...signal.signals, config_hash: "c".repeat(64), input_digest: "d".repeat(64),
    price_basis: "unadjusted", provider_version: "synthetic-test-only", engine_version: "synthetic-test-only",
    source_revision: "synthetic-test-only", candidate: { ...c, rules: [{ name: "close_above_fractal", passed: true }],
      level: 98, pivot_date: "2026-09-23", available_session: "2026-09-25" } };
  const parsed = parsePublishedSignal({ signals: detailed }, run);
  assert.equal(parsed.candidate.pivot_date, "2026-09-23");
  assert.equal(parsed.candidate.available_session, "2026-09-25");
  assert.deepEqual(parsed.candidate.rules, detailed.candidate.rules);
  assert.equal(parsePublishedSignal(signal, run).candidate.pivot_date, undefined);
  for (const change of [{ config_hash: "guessed" }, { input_digest: 42 }, { provider_version: [] }]) {
    assert.equal(parsePublishedSignal({ signals: { ...detailed, ...change } }, run), null);
  }
  for (const change of [{ pivot_date: "2026-09-26" }, { available_session: "2026-09-29" },
    { level: -1 }, { rules: [{ name: "rule", passed: "yes" }] }]) {
    assert.equal(parsePublishedSignal({ signals: { ...detailed, candidate: { ...detailed.candidate, ...change } } }, run), null);
  }
});
test("bounded pages reject repeated query values and retain explicit deadline state", () => {
  assert.deepEqual(scannerQuery({}), { run: undefined, section: "auto", page: 1 });
  for (const query of [{ page: "0" }, { page: "41" }, { page: ["1", "2"] }, { run: "guessed" }, { section: "all" },
    { date: "2026-02-30" }, { date: ["2026-09-28", "2026-09-29"] }, { strategy: "UNKNOWN" }]) {
    assert.equal(scannerQuery(query), null);
  }
  assert.equal(scanWindow(run, Date.parse(run.publication_deadline) - 1), "open");
  assert.equal(scanWindow(run, Date.parse(run.publication_deadline)), "elapsed");
  assert.equal(scanWindow({ ...run, publication_deadline: null }, Date.now()), "unknown");
  const filtered = scannerQuery({ date: "2026-09-28", strategy: "FRACTAL_BREAKOUT_V1" });
  assert.equal(filtered.date, "2026-09-28");
  const href = new URL(scannerHref(run.id, "signals", 2, filtered), "https://test.invalid");
  assert.equal(href.searchParams.get("strategy"), "FRACTAL_BREAKOUT_V1");
  assert.equal(href.searchParams.get("date"), "2026-09-28");
  assert.equal(href.searchParams.get("run"), run.id);
});
