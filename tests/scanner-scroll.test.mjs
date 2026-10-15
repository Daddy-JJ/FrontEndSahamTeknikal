import { test } from "node:test";
import assert from "node:assert/strict";
import { scannerScrollKey, parseScannerScroll } from "../src/lib/scanner-scroll.ts";
test("scroll state is UI-only bounded and scoped to immutable cohort and data mode", () => {
  const query = { page: 2, date: "2026-10-08", strategy: "MACD_EMA200_V1" };
  const key = scannerScrollKey("run-qa", "signals", "live", query);
  for (const changed of [scannerScrollKey("other-run", "signals", "live", query), scannerScrollKey("run-qa", "quality", "live", query),
    scannerScrollKey("run-qa", "signals", "fixture", query), scannerScrollKey("run-qa", "signals", "live", { ...query, page: 1 })]) assert.notEqual(key, changed);
  assert.deepEqual(parseScannerScroll('{"windowY":125,"matrixTop":450,"matrixLeft":72}'), { windowY: 125, matrixTop: 450, matrixLeft: 72 });
  for (const invalid of [null, "invalid", "null", "{}", '{"windowY":-1,"matrixTop":0,"matrixLeft":0}',
    '{"windowY":0,"matrixTop":1e100,"matrixLeft":0}', '{"windowY":0,"matrixTop":0,"matrixLeft":"0"}',
    '{"windowY":0,"matrixTop":0,"matrixLeft":0,"price":1000}']) assert.equal(parseScannerScroll(invalid), null);
});
