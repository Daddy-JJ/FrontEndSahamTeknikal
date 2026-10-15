import { test } from "node:test";
import assert from "node:assert/strict";
import { scannerQuery } from "../src/lib/scanner-contract.ts";
import { scannerDetailHref, resolveScannerSelection, scannerChartRequest } from "../src/lib/scanner-detail.ts";

const run = "11111111-1111-4111-8111-111111111111";
const signal = { id: "a".repeat(64), ticker: "ADRO", strategy: "MACD_EMA200_V1" };
const quality = { ticker: "ADRO", candidates: [] };
const parent = { run, section: "signals", page: 2, date: "2026-10-08", strategy: "MACD_EMA200_V1" };

test("scanner detail query validates coupled identity and tab without relaxing parent filters", () => {
  const input = { run, section: "signals", page: "2", date: parent.date, strategy: parent.strategy,
    detail: signal.id, detail_kind: "signal", panel: "chart" };
  assert.equal(scannerQuery(input).detail, signal.id);
  for (const change of [{ detail: "guessed" }, { detail: [signal.id] }, { detail_kind: "actual" },
    { panel: "invalid" }, { panel: ["chart"] }, { page: "41" }, { date: "2026-02-30" },
    { detail_kind: undefined }, { detail: undefined }, { section: "quality" }]) {
    assert.equal(scannerQuery({ ...input, ...change }), null);
  }
  assert.equal(scannerQuery({ panel: "chart" }), null);
  assert.equal(scannerQuery({ detail: "ADRO", detail_kind: "quality", section: "quality" }).panel, "reasons");
  assert.equal(scannerQuery({ detail: "../ADRO", detail_kind: "quality" }), null);
});
test("detail URLs keep run section pagination and filters; close removes only detail parameters", () => {
  const href = scannerDetailHref(run, "signals", parent, { kind: "signal", signal }, "chart");
  const url = new URL(href, "https://local.invalid");
  for (const name of ["run", "section", "page", "date", "strategy"]) assert.equal(url.searchParams.get(name), String(parent[name]));
  assert.equal(url.searchParams.get("detail"), signal.id);
  assert.equal(url.searchParams.get("detail_kind"), "signal");
  assert.equal(url.searchParams.get("panel"), "chart");
  const closed = new URL(scannerDetailHref(run, "signals", parent, null), "https://local.invalid");
  assert.equal(closed.searchParams.get("detail"), null);
  assert.equal(closed.searchParams.get("page"), "2");
});
test("selection resolves only a current-page canonical identity; quality never guesses signal snapshot", () => {
  assert.deepEqual(resolveScannerSelection({ ...parent, detail: signal.id, detail_kind: "signal" }, [], [signal]), { kind: "signal", signal });
  assert.equal(resolveScannerSelection({ ...parent, detail: "b".repeat(64), detail_kind: "signal" }, [], [signal]), null);
  assert.deepEqual(resolveScannerSelection({ detail: "ADRO", detail_kind: "quality" }, [quality], []), { kind: "quality", item: quality });
  assert.deepEqual(scannerChartRequest({ kind: "signal", signal }), { ticker: "ADRO", context: "signal", context_id: signal.id, view: "snapshot", timeframe: "1d", limit: 250 });
  assert.deepEqual(scannerChartRequest({ kind: "quality", item: quality }), { ticker: "ADRO", context: "latest", view: "followup", timeframe: "1d", limit: 250 });
});
