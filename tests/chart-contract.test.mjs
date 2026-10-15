import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { chartFixture } from "../src/lib/chart-fixture.ts";
import {
  parseChartRequest,
  parseChartEnvelope,
  mergeChartPages,
} from "../src/lib/chart-contract.ts";

test("request defaults and contextual identity", () => {
  assert.deepEqual(parseChartRequest("ADRO", new URLSearchParams()), {
    ticker: "ADRO",
    context: "latest",
    view: "followup",
    timeframe: "1d",
    limit: 250,
  });
  assert.equal(
    parseChartRequest(
      "ADRO",
      new URLSearchParams("context=signal&context_id=" + "a".repeat(64)),
    ).view,
    "snapshot",
  );
  for (const query of [
    "owner=x",
    "limit=501",
    "limit=true",
    "limit=1.5",
    "timeframe=1h",
    "context_id=x",
    "context=paper",
    "context=actual&context_id=x",
    "view=snapshot",
    "from=2026-02-30",
    "from=2026-02-02&to=2026-02-01",
    "cursor=x&from=2026-01-01",
    "limit=2&limit=3",
  ])
    assert.equal(
      parseChartRequest("ADRO", new URLSearchParams(query)),
      null,
      query,
    );
  assert.equal(parseChartRequest("../secret", new URLSearchParams()), null);
});
test("canonical chart success and explicit backend errors", () => {
  const f = chartFixture();
  assert.equal(parseChartEnvelope(f, "fixture", "ADRO"), f);
  assert.equal(parseChartEnvelope(f, "live", "ADRO"), null);
  for (const code of [
    "INVALID_REQUEST",
    "UNAUTHENTICATED",
    "FORBIDDEN",
    "NOT_FOUND",
    "REVISION_UNAVAILABLE",
    "SNAPSHOT_UNAVAILABLE",
    "RATE_LIMITED",
    "BACKEND_NOT_READY",
    "DATA_UNAVAILABLE",
    "CONTRACT_ERROR",
    "UPSTREAM_ERROR",
    "INTERNAL_ERROR",
  ])
    assert.ok(
      parseChartEnvelope(
        {
          contract_version: "ticker-chart-v1",
          success: false,
          data: null,
          error: {
            code,
            message: "Unavailable",
            request_id: "test",
            retryable: false,
          },
        },
        "live",
        "ADRO",
      ),
    );
});

test("canonical Python artifact through applied PGlite SQL reader matches frontend contract", () => {
  const fixture = JSON.parse(
    readFileSync(
      new URL("./fixtures/ticker-chart-v1.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(fixture.data.data_mode, "fixture");
  assert.equal(fixture.data.source.scope, "fixture");
  assert.equal(
    parseChartEnvelope(fixture, "fixture", fixture.data.ticker),
    fixture,
  );
  assert.equal(parseChartEnvelope(fixture, "live", fixture.data.ticker), null);
});

test("snapshot, paper and actual context identity and overlay-only pages", () => {
  const signal = chartFixture();
  signal.data.context = {
    ...signal.data.context,
    kind: "signal",
    id: "c".repeat(64),
    view: "snapshot",
    signal_session: "2026-10-12",
    snapshot_cutoff: "2026-10-12",
  };
  signal.data.signal_source = { ...signal.data.source };
  assert.ok(parseChartEnvelope(signal, "fixture", "ADRO"));
  const future = structuredClone(signal);
  future.data.overlays.markers = [
    {
      id: "late",
      kind: "entry_fill",
      session: "2026-10-12",
      available_session: "2026-10-13",
      price: "1000",
      source_id: "signal",
      status: "simulated",
    },
  ];
  assert.equal(parseChartEnvelope(future, "fixture", "ADRO"), null);
  const wrong = structuredClone(signal);
  wrong.data.signal_source.resolved_input_digest = "e".repeat(64);
  assert.equal(parseChartEnvelope(wrong, "fixture", "ADRO"), null);
  const paper = structuredClone(signal);
  paper.data.context.kind = "paper";
  paper.data.context.id = "legacy-paper";
  assert.ok(parseChartEnvelope(paper, "fixture", "ADRO"));
  const actual = chartFixture();
  actual.data.context = {
    ...actual.data.context,
    kind: "actual",
    id: "00000000-0000-4000-8000-000000000002",
  };
  actual.data.overlays.markers = [
    {
      id: "fill",
      kind: "entry_fill",
      session: "2026-10-08",
      available_session: "2026-10-08",
      price: "1000",
      source_id: "actual-fill",
      status: "confirmed",
    },
  ];
  assert.ok(parseChartEnvelope(actual, "fixture", "ADRO"));
  const page = structuredClone(actual);
  page.data.sessions = [];
  page.data.bars = [];
  page.data.gaps = [];
  page.data.pagination.returned_slots = 0;
  for (const key of Object.keys(page.data.indicators))
    page.data.indicators[key] = {
      ...page.data.indicators[key],
      status: "unavailable",
      reason: "overlay_page",
      points: [],
    };
  assert.ok(parseChartEnvelope(page, "fixture", "ADRO"));
  assert.ok(mergeChartPages(actual.data, page.data));
});

test("immutable pagination rejects marker, level, indicator and gap conflicts", () => {
  for (const change of [
    (d) => (d.overlays.levels[0].price = "926"),
    (d) => (d.indicators.sma10.points[0].value = 123),
    (d) => (d.gaps[0].reason = "different"),
    (d) => (d.indicators.sma10.artifact_digest = "different"),
  ]) {
    const a = chartFixture().data,
      b = structuredClone(a);
    change(b);
    assert.equal(mergeChartPages(a, b), null);
  }
  const a = chartFixture().data,
    b = structuredClone(a);
  b.bars = [
    ...b.bars,
    {
      session: "2026-10-09",
      open: "1000",
      high: "1000",
      low: "1000",
      close: "1000",
      volume: "0",
    },
  ];
  b.gaps = [];
  assert.equal(mergeChartPages(a, b), null);
});
test("provider identity cannot masquerade as live through forward scope", () => {
  const f = chartFixture();
  f.data.data_mode = "live";
  f.data.source.scope = "forward";
  assert.equal(parseChartEnvelope(f, "live", "ADRO"), null);
  f.data.source.provider = "yfinance";
  assert.ok(parseChartEnvelope(f, "live", "ADRO"));
  f.data.data_mode = "fixture";
  f.data.source.scope = "fixture";
  assert.equal(parseChartEnvelope(f, "fixture", "ADRO"), null);
});
test("pending overlay page must finish before older bars can replace its cursor", () => {
  const a = chartFixture().data;
  a.overlays = { ...a.overlays, has_more: true, next_cursor: "window-events" };
  const older = structuredClone(a);
  older.overlays = { ...older.overlays, has_more: false, next_cursor: null };
  assert.equal(mergeChartPages(a, older), null);
  const events = structuredClone(older);
  events.sessions = [];
  events.bars = [];
  events.gaps = [];
  events.pagination.returned_slots = 0;
  for (const key of Object.keys(events.indicators))
    events.indicators[key] = {
      ...events.indicators[key],
      status: "unavailable",
      reason: "overlay_page",
      points: [],
    };
  const finished = mergeChartPages(a, events);
  assert.ok(finished);
  assert.equal(finished.overlays.has_more, false);
  assert.ok(mergeChartPages(finished, older));
});
test("strict temporal, price, gap and pagination invariants", () => {
  const changes = [
    (f) => {
      f.unknown = 1;
    },
    (f) => {
      f.data.source.token = "private";
    },
    (f) => {
      f.data.ticker = "INDY";
    },
    (f) => {
      f.data.bars[0].close = "1e3";
    },
    (f) => {
      f.data.bars[0].low = "2000";
    },
    (f) => {
      f.data.bars[0].volume = "-1";
    },
    (f) => {
      f.data.sessions.reverse();
    },
    (f) => {
      f.data.gaps = [];
    },
    (f) => {
      f.data.bars.push(f.data.bars[0]);
    },
    (f) => {
      f.data.pagination.returned_slots = 2;
    },
    (f) => {
      f.data.pagination.next_cursor = "bad";
    },
    (f) => {
      f.data.indicators.sma10.points[0].value = Infinity;
    },
    (f) => {
      f.data.indicators.sma10.points = [];
    },
    (f) => {
      f.data.overlays.levels[0].available_session = "2026-10-14";
    },
    (f) => {
      f.data.source.scope = "paper_recovery";
    },
    (f) => {
      f.data.quality.expected_session = "not-date";
    },
  ];
  for (const change of changes) {
    const f = chartFixture();
    change(f);
    assert.equal(parseChartEnvelope(f, "fixture", "ADRO"), null);
  }
});
test("merge requires immutable revision and refuses conflicting overlap", () => {
  const a = chartFixture().data;
  assert.equal(mergeChartPages(a, { ...a, revision: "changed" }), null);
  const changed = structuredClone(a);
  changed.bars[0].close = "1001";
  assert.equal(mergeChartPages(a, changed), null);
  const merged = mergeChartPages(a, a);
  assert.equal(merged.bars.length, a.bars.length);
  assert.equal(merged.sessions.length, a.sessions.length);
});

test("paging retains the pinned prices but adopts newly reported freshness", () => {
  const current = chartFixture().data;
  const page = {...current, quality: {...current.quality, freshness: "stale", expected_session: "2026-10-13"}};
  const merged = mergeChartPages(current, page);
  assert.equal(merged.revision, current.revision);
  assert.equal(merged.quality.freshness, "stale");
  assert.equal(merged.quality.expected_session, "2026-10-13");
  assert.equal(current.quality.freshness, "current");
});
