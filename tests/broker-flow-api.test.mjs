import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { formatNumber, formatRupiah } from "../src/lib/broker-flow.ts";
import {
  normalizeTicker,
  resolveBrokerFlowRequest,
} from "../src/lib/broker-flow-service.ts";
import {
  clearMcpCachesForTest,
  fetchOnDemandTickerHorizons,
  synthesizeTickerHorizonDetail,
} from "../src/lib/mcp-broker-flow.ts";

test("normalizeTicker rejects malformed tickers and normalizes valid IDX codes", () => {
  assert.equal(normalizeTicker(" bbca "), "BBCA");
  assert.equal(normalizeTicker("TLKM"), "TLKM");
  assert.equal(normalizeTicker("A"), null);
  assert.equal(normalizeTicker("BBCA;DROP"), null);
  assert.equal(normalizeTicker("B B C A"), null);
});

test("formatRupiah and formatNumber guard against non-finite values instead of returning NaN", () => {
  assert.equal(formatRupiah(Number.NaN), "-");
  assert.equal(formatRupiah(undefined), "-");
  assert.equal(formatNumber(Number.NaN), "-");
  assert.equal(formatNumber(undefined), "-");
});

test("synthesizeTickerHorizonDetail classifies heavy distribution honestly instead of accumulation", () => {
  const detail = synthesizeTickerHorizonDetail({
    ticker: "BBRI",
    closePrice: 3070,
    changePct: -1.5,
    period: "5D",
    label: "5 Hari",
    range: "23 - 27 Nov 2026",
    buyersResp: {
      records: [
        {
          code: "XL",
          name: "Stockbit",
          investorGroups: ["LOCAL"],
          netSide: "BUY",
          netValue: 40_000_000_000,
          netVolume: 130_000,
          buyAvgPrice: 3070,
        },
      ],
    },
    sellersResp: {
      records: [
        {
          code: "ZP",
          name: "Maybank",
          investorGroups: ["FOREIGN"],
          netSide: "SELL",
          netValue: -250_000_000_000,
          netVolume: -810_000,
          sellAvgPrice: 3080,
        },
      ],
    },
    signalResp: {
      label: "STRONG_DISTRIBUTION",
      score: -42,
      summary: { foreignNetValue: -210_000_000_000 },
    },
  });

  assert.equal(detail.quadrant, "markdown_distribusi");
  assert.equal(detail.trade_plan.action, "HARD AVOID");
  assert.ok(detail.net_value < 0);
});

test("resolveBrokerFlowRequest rejects invalid ticker with 400 and never yields NaN in snapshot fallback", async () => {
  const snapshotPath = fileURLToPath(
    new URL("../src/data/broker_flow_snapshot_latest.json", import.meta.url)
  );
  const snapshotBundle = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));

  const baseDeps = {
    snapshotBundle,
    fetchLiveOverview: async () => {
      throw new Error("offline");
    },
    fetchOnDemandTicker: async () => {
      throw new Error("offline");
    },
  };

  const invalid = await resolveBrokerFlowRequest({ rawTicker: "BAD TICKER!" }, baseDeps);
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.error, "INVALID_TICKER");

  const fallbackOverview = await resolveBrokerFlowRequest(
    { rawHorizon: "5D", preferLive: false },
    baseDeps
  );
  assert.equal(fallbackOverview.status, 200);
  assert.equal(fallbackOverview.body.source, "snapshot-fallback");
  const data = fallbackOverview.body.data;
  for (const row of [...data.top_accumulations, ...data.top_distributions]) {
    assert.equal(Number.isFinite(row.smart_money_net), true);
    assert.notEqual(formatRupiah(row.smart_money_net), "NaN");
  }
});

test("resolveBrokerFlowRequest prioritizes Supabase before static snapshot fallback", async () => {
  const supabaseDetail = {
    ticker: "BBCA",
    close: 6000,
    change_percent: 1.5,
    quadrant: "markup_akumulasi",
    quadrant_label: "[MA] Markup + Akumulasi",
    status_color: "emerald",
    horizon: "5D",
    top_accumulators: [],
    top_distributors: [],
    net_value: 100_000_000_000,
    net_volume_lots: 166_666,
    concentration_pct: 25,
    bandar_avg_cost: 5950,
    bandar_cost_gap_pct: 0.84,
    counterparty_note: "Supabase row",
    why_insight: "Supabase live sync",
    trade_plan: {
      action: "BUY ON PULLBACK",
      entry_zone: "5950 - 6000",
      stop_loss: "5700",
      target_price: "6600",
      rr_ratio: "1 : 2.8",
      note: "From Supabase",
    },
  };

  const res = await resolveBrokerFlowRequest(
    { rawTicker: "BBCA", rawHorizon: "5D", preferLive: false },
    {
      snapshotBundle: {
        ticker_horizons: {
          BBCA: { "5D": { ...supabaseDetail, close: 5500, counterparty_note: "Old JSON" } },
        },
      },
      fetchLiveOverview: async () => {
        throw new Error("skip");
      },
      fetchOnDemandTicker: async () => {
        throw new Error("skip");
      },
      querySupabaseTicker: async () => ({ "5D": supabaseDetail }),
    }
  );

  assert.equal(res.status, 200);
  assert.equal(res.body.source, "supabase");
  assert.equal(res.body.data.close, 6000);
});

test("fetchOnDemandTickerHorizons fails explicitly without MAX_TRADE_MCP_TOKEN and enforces refresh cooldown", async () => {
  clearMcpCachesForTest();
  const prevToken = process.env.MAX_TRADE_MCP_TOKEN;
  delete process.env.MAX_TRADE_MCP_TOKEN;

  await assert.rejects(
    () => fetchOnDemandTickerHorizons("BBCA", true),
    /MAX_TRADE_MCP_TOKEN/
  );

  process.env.MAX_TRADE_MCP_TOKEN = "test-token";
  const origFetch = globalThis.fetch;
  let fetchCalls = 0;

  globalThis.fetch = async (_url, init) => {
    fetchCalls++;
    const body = JSON.parse(String(init?.body || "{}"));
    const tool = body.params?.name;
    let payload = { records: [] };
    if (tool === "get_eod_history") {
      payload = {
        records: [
          { date: "2026-11-27", close: 5800, changePercent: 1.2 },
          { date: "2026-11-26", close: 5730, changePercent: 0.5 },
        ],
      };
    } else if (tool === "get_broksum_ticker_brokers") {
      payload = {
        records: [
          { code: "BK", netSide: "BUY", netValue: 50_000_000_000, netVolume: 86_000, buyAvgPrice: 5800 },
        ],
      };
    } else if (tool === "get_broksum_signal") {
      payload = { label: "ACCUMULATION", score: 40, summary: { foreignNetValue: 50_000_000_000 } };
    }
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: payload }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const first = await fetchOnDemandTickerHorizons("BBCA", true);
    assert.equal(first["5D"].ticker, "BBCA");
    const callsAfterFirst = fetchCalls;
    assert.equal(callsAfterFirst, 10);

    // Within 60s cooldown, repeated forceRefresh=true must serve cached result without hitting fetch
    const second = await fetchOnDemandTickerHorizons("BBCA", true);
    assert.equal(second["5D"].ticker, "BBCA");
    assert.equal(fetchCalls, callsAfterFirst);
  } finally {
    globalThis.fetch = origFetch;
    clearMcpCachesForTest();
    if (prevToken === undefined) {
      delete process.env.MAX_TRADE_MCP_TOKEN;
    } else {
      process.env.MAX_TRADE_MCP_TOKEN = prevToken;
    }
  }
});
