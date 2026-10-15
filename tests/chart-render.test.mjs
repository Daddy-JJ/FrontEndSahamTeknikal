import assert from "node:assert/strict";
import { parseChartRequest } from '../src/lib/chart-contract.ts';
test('optional undefined fields do not turn a latest chart into an invalid contextual request', () => {
  const request = {ticker: 'ADRO', context: 'latest', context_id: undefined, view: 'followup', timeframe: '1d', limit: 250, from: undefined, to: undefined, cursor: undefined};
  const url = new URL(chartRequestUrl(request), 'http://local');
  assert.equal(url.searchParams.has('context_id'), false);
  assert.deepEqual(parseChartRequest('ADRO', url.searchParams), {ticker: 'ADRO', context: 'latest', view: 'followup', timeframe: '1d', limit: 250});
});
test('a future plan remains in canonical data but is not drawn before its execution interval', () => {
  const data = chartFixture().data;
  const plan = {...data.overlays.levels[0], kind: 'planned_entry', status: 'planned', starts_at: '2026-10-13', available_session: '2026-10-08'};
  assert.deepEqual(levelSegments(plan, data), []);
  assert.equal(plan.starts_at, '2026-10-13');
  assert.deepEqual(levelSegments({...plan, available_session: '2026-10-12'}, data), []);
  assert.deepEqual(levelSegments({...plan, status: 'effective'}, data), []);
});
import { test } from "node:test";
import { chartFixture } from "../src/lib/chart-fixture.ts";
import {
  indicatorSegments,
  levelSegments,
  chartRequestUrl,
  formatChartMoney,
  candleMarkers,
} from "../src/lib/chart-render.ts";
test("line segmentation cannot bridge missing sessions or warmup", () => {
  const d = chartFixture().data;
  const segments = indicatorSegments(d.indicators.sma10.points);
  assert.deepEqual(
    segments.map((s) => s.map((p) => p.time)),
    [["2026-10-08"], ["2026-10-12"]],
  );
  assert.deepEqual(
    levelSegments(d.overlays.levels[0], d).map((s) => s.map((p) => p.time)),
    [["2026-10-08"], ["2026-10-12"]],
  );
  const future = {
    ...d.overlays.levels[0],
    starts_at: "2026-10-14",
    available_session: "2026-10-08",
    status: "planned",
  };
  assert.deepEqual(levelSegments(future, d), []);
});
test("money uses canonical decimal text and query context survives paging", () => {
  assert.equal(formatChartMoney("2550.25"), "Rp2.550,25");
  assert.equal(formatChartMoney(null), "—");
  const request = {
    ticker: "ADRO",
    context: "paper",
    context_id: "a/b",
    view: "followup",
    timeframe: "1d",
    from: "2026-10-01",
    to: "2026-10-12",
    limit: 250,
  };
  const url = new URL(chartRequestUrl(request, "opaque/+"), "http://localhost");
  assert.equal(url.pathname, "/api/chart/ADRO");
  assert.equal(url.searchParams.get("context_id"), "a/b");
  assert.equal(url.searchParams.get("cursor"), "opaque/+");
  assert.equal(url.searchParams.has("from"), false);
});

test("an event on a missing candle stays in the audit instead of moving to a neighbouring session", () => {
  const data = chartFixture().data;
  const event = {id: "filled", kind: "entry_fill", session: "2026-10-08", available_session: "2026-10-08", price: "1200", source_id: "trade", status: "simulated"};
  const held = {...event, id: "held", session: "2026-10-09", available_session: "2026-10-12"};
  const original = {...data, overlays: {...data.overlays, markers: [event, held]}};
  assert.deepEqual(candleMarkers(original), [event]);
  assert.equal(candleMarkers(original)[0].price, "1200");
  assert.deepEqual(original.overlays.markers, [event, held]);
});
