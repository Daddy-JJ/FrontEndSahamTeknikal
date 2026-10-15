import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { workspaceChartFixture } from "../src/lib/workspace-chart-fixture.ts";
import { parseChartEnvelope } from "../src/lib/chart-contract.ts";
const snapshot = JSON.parse(readFileSync(new URL("../src/generated/demo.json", import.meta.url)));
test("Workspace fixture uses the chart contract and prepared EMA without inventing indicators", () => {
  const ticker = Object.keys(snapshot.charts)[0];
  const result = workspaceChartFixture(snapshot, { ticker, context: "latest", view: "followup", timeframe: "1d", limit: 250 });
  const parsed = parseChartEnvelope(result, "fixture", ticker);
  assert.ok(parsed?.success);
  assert.equal(parsed.data.source.scope, "fixture");
  assert.equal(parsed.data.overlays.status, "ready");
  assert.deepEqual(parsed.data.overlays.levels, []);
  assert.equal(parsed.data.indicators.macd.status, "unavailable");
  assert.equal(parsed.data.bars.at(-1).close, String(snapshot.charts[ticker].at(-1).close));
  assert.equal(parsed.data.indicators.ema200.points.at(-1).value, snapshot.charts[ticker].at(-1).ema200);
});
test("Workspace snapshot prevents future candles and preserves signal identity", () => {
  const signal = snapshot.signals.find(s => snapshot.charts[s.ticker].some(b => b.session <= s.session));
  const request = { ticker: signal.ticker, context: "signal", context_id: signal.id, view: "snapshot", timeframe: "1d", limit: 250 };
  const parsed = parseChartEnvelope(workspaceChartFixture(snapshot, request), "fixture", signal.ticker);
  assert.ok(parsed?.success);
  assert.equal(parsed.data.context.id, signal.id);
  assert.ok(parsed.data.bars.every(b => b.session <= signal.session));
  assert.equal(parsed.data.context.snapshot_cutoff, signal.session);
  assert.equal(parsed.data.overlays.markers[0].source_id, signal.id);
  assert.equal(parsed.data.signal_source.resolved_input_digest, signal.input_digest);
});
test("Workspace never supplies a fixture to unsupported contexts, missing tickers or unknown signal", () => {
  const ticker = Object.keys(snapshot.charts)[0];
  const request = { ticker, context: "latest", view: "followup", timeframe: "1d", limit: 250 };
  for (const change of [{ ticker: "NONE" }, { context: "actual" }, { context: "signal", context_id: "e".repeat(64) }, { limit: 0 }]) {
    assert.equal(workspaceChartFixture(snapshot, { ...request, ...change }).success, false);
  }
});
test("Workspace window bounds and missing historical fixture degrade explicitly without mutation", () => {
  const ticker = Object.keys(snapshot.charts)[0];
  const before = JSON.stringify(snapshot);
  const request = { ticker, context: "latest", view: "followup", timeframe: "1d", limit: 2 };
  const preview = workspaceChartFixture(snapshot, request);
  assert.equal(preview.data.sessions.length, 2);
  assert.deepEqual(preview.data.quality.warnings, ["fixture_preview_window_limited"]);
  const signal = { ...snapshot.signals[0], ticker, session: "2020-01-01", id: "f".repeat(64) };
  const input = { ...snapshot, signals: [signal] };
  assert.equal(workspaceChartFixture(input, { ...request, context: "signal", context_id: signal.id, view: "snapshot" }).error.code, "DATA_UNAVAILABLE");
  assert.equal(workspaceChartFixture(input, { ...request, context: "signal", context_id: signal.id }).error.code, "SNAPSHOT_UNAVAILABLE");
  assert.equal(workspaceChartFixture({ ...snapshot, data_mode: "live" }, request).success, false);
  assert.equal(JSON.stringify(snapshot), before);
});
