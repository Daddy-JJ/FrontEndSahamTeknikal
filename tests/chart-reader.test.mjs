import assert from "node:assert/strict";
import { test } from "node:test";
import { chartFixture } from "../src/lib/chart-fixture.ts";
import {
  readChartResult,
  chartHttpStatus,
  chartFailure,
} from "../src/lib/chart-reader.ts";
const request = {
  ticker: "ADRO",
  context: "latest",
  view: "followup",
  timeframe: "1d",
  limit: 250,
};
test("reader keeps owner mode, context and error boundaries strict", async () => {
  const rpc = async (name, args) => {
    assert.equal(name, "read_ticker_chart_v1");
    assert.deepEqual(args, { p_request: request });
    return { data: chartFixture(), error: null };
  };
  assert.equal(
    (await readChartResult(request, "fixture", rpc, "unit")).success,
    true,
  );
  assert.equal(
    (await readChartResult(request, "live", rpc, "unit")).error.code,
    "CONTRACT_ERROR",
  );
  const f = chartFixture();
  f.data.context = { ...f.data.context, kind: "paper", id: "wrong" };
  assert.equal(
    (
      await readChartResult(
        request,
        "fixture",
        async () => ({ data: f, error: null }),
        "unit",
      )
    ).error.code,
    "CONTRACT_ERROR",
  );
  assert.equal(
    (
      await readChartResult(
        request,
        "live",
        async () => ({ data: null, error: { code: "PGRST202" } }),
        "unit",
      )
    ).error.code,
    "BACKEND_NOT_READY",
  );
  assert.equal(
    (
      await readChartResult(
        request,
        "live",
        async () => {
          throw Error("secret");
        },
        "unit",
      )
    ).error.message.includes("secret"),
    false,
  );
});
test("HTTP status and sanitized error envelopes", () => {
  for (const [code, status] of [
    ["INVALID_REQUEST", 400],
    ["UNAUTHENTICATED", 401],
    ["FORBIDDEN", 403],
    ["NOT_FOUND", 404],
    ["RATE_LIMITED", 429],
    ["REVISION_UNAVAILABLE", 409],
    ["SNAPSHOT_UNAVAILABLE", 409],
    ["BACKEND_NOT_READY", 503],
    ["DATA_UNAVAILABLE", 503],
    ["CONTRACT_ERROR", 502],
    ["UPSTREAM_ERROR", 502],
    ["INTERNAL_ERROR", 500],
  ])
    assert.equal(chartHttpStatus(chartFailure(code, "unit")), status);
});
test("known upstream failures remain sanitized and explicit RPC error is preserved", async () => {
  const upstream = await readChartResult(
    request,
    "live",
    async () => ({ data: null, error: { code: "XX000" } }),
    "unit",
  );
  assert.equal(upstream.error.code, "UPSTREAM_ERROR");
  const error = chartFailure("RATE_LIMITED", "sql-request");
  assert.deepEqual(
    await readChartResult(
      request,
      "live",
      async () => ({ data: error, error: null }),
      "unit",
    ),
    error,
  );
});
