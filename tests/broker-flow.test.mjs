import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_MARKET_SUMMARY,
  DEFAULT_TOP_ACCUMULATIONS,
  DEFAULT_TOP_DISTRIBUTIONS,
  DEFAULT_TOP_BROKERS,
  DEFAULT_SECTOR_FLOWS,
  TICKER_DETAILS_MAP,
  TICKER_HORIZON_DETAILS_MAP,
  getTickerDetailByHorizon,
  QUADRANT_MAPS,
  fetchTickerDetail,
  formatRupiah,
} from "../src/lib/broker-flow.ts";

test("Broker flow snapshot data integrity", () => {
  assert.equal(DEFAULT_MARKET_SUMMARY.date, "2026-11-20");
  assert.equal(DEFAULT_MARKET_SUMMARY.quadrant_counts.markup_akumulasi, 111);
  assert.equal(DEFAULT_MARKET_SUMMARY.quadrant_counts.markup_distribusi, 86);
  assert.equal(DEFAULT_MARKET_SUMMARY.quadrant_counts.markdown_akumulasi, 142);
  assert.equal(DEFAULT_MARKET_SUMMARY.quadrant_counts.markdown_distribusi, 287);
  assert.equal(DEFAULT_MARKET_SUMMARY.total_classified, 626);
  assert.equal(DEFAULT_MARKET_SUMMARY.smart_money_net, -87800000000);
});

test("Top accumulations contains verified ticker MBMA", () => {
  const mbma = DEFAULT_TOP_ACCUMULATIONS.find((t) => t.ticker === "MBMA");
  assert.ok(mbma);
  assert.equal(mbma.close, 344);
  assert.equal(mbma.change_percent, 15.4);
  assert.equal(mbma.top_buyers, "BK NI AT TP RG");
  assert.equal(mbma.sum_buy, 91200000000);
});

test("Top distributions contains verified ticker BBCA", () => {
  const bbca = DEFAULT_TOP_DISTRIBUTIONS.find((t) => t.ticker === "BBCA");
  assert.ok(bbca);
  assert.equal(bbca.close, 5550);
  assert.equal(bbca.change_percent, -1.8);
  assert.equal(bbca.sum_sell, -311600000000);
});

test("All 18 table tickers have verified detailed profiles in TICKER_DETAILS_MAP", () => {
  const allTableTickers = [
    ...DEFAULT_TOP_ACCUMULATIONS.map((i) => i.ticker),
    ...DEFAULT_TOP_DISTRIBUTIONS.map((i) => i.ticker),
  ];
  assert.equal(allTableTickers.length, 18);

  for (const ticker of allTableTickers) {
    const detail = TICKER_DETAILS_MAP[ticker];
    assert.ok(detail, `Ticker ${ticker} must have a detailed profile`);
    assert.equal(detail.ticker, ticker);
    assert.ok(detail.bandar_avg_cost > 0, `Ticker ${ticker} must have bandar average cost`);
    assert.ok(detail.trade_plan, `Ticker ${ticker} must have an actionable trade plan`);
    assert.ok(detail.trade_plan.action, `Ticker ${ticker} must have trade action`);
  }
});

test("Quadrant maps contain 4 Wyckoff-Smart Money quadrants", () => {
  assert.ok(QUADRANT_MAPS.markup_akumulasi);
  assert.equal(QUADRANT_MAPS.markup_akumulasi.stocks_count, 111);
  assert.ok(QUADRANT_MAPS.markup_akumulasi.stocks.length > 0);

  assert.ok(QUADRANT_MAPS.markup_distribusi);
  assert.equal(QUADRANT_MAPS.markup_distribusi.stocks_count, 86);

  assert.ok(QUADRANT_MAPS.markdown_akumulasi);
  assert.equal(QUADRANT_MAPS.markdown_akumulasi.stocks_count, 142);

  assert.ok(QUADRANT_MAPS.markdown_distribusi);
  assert.equal(QUADRANT_MAPS.markdown_distribusi.stocks_count, 287);
});

test("NAYZ has verified genuine EOD data from MCP Max", () => {
  const nayz = TICKER_DETAILS_MAP.NAYZ;
  assert.ok(nayz);
  assert.equal(nayz.ticker, "NAYZ");
  assert.equal(nayz.close, 90);
  assert.equal(nayz.top_accumulators[0].code, "GR");
  assert.equal(nayz.top_distributors[0].code, "SQ");
});

test("Unknown tickers return null honestly without fabricating data", async () => {
  const unknown = await fetchTickerDetail("UNKNOWN_STOCK_XYZ");
  assert.equal(unknown, null);
});

test("Format rupiah utility behaves accurately", () => {
  assert.equal(formatRupiah(91200000000), "+91.2B");
  assert.equal(formatRupiah(-311600000000), "-311.6B");
  assert.equal(formatRupiah(13570000000000), "+13.57T");
});

test("Multi-horizon ticker detail returns distinct genuine MCP data across 2D, 5D, and 10D", async () => {
  // Test NAYZ across 2D, 5D, 10D
  const nayz2D = getTickerDetailByHorizon("NAYZ", "2D");
  const nayz5D = getTickerDetailByHorizon("NAYZ", "5D");
  const nayz10D = getTickerDetailByHorizon("NAYZ", "10D");

  assert.ok(nayz2D);
  assert.ok(nayz5D);
  assert.ok(nayz10D);

  // 2D: GR buy avg 88.05
  assert.equal(nayz2D.bandar_avg_cost, 88.05);
  assert.equal(nayz2D.horizon, "2D");
  assert.equal(nayz2D.top_accumulators[0].code, "GR");

  // 5D: GR buy avg 86.64
  assert.equal(nayz5D.bandar_avg_cost, 86.64);
  assert.equal(nayz5D.horizon, "5D");
  assert.equal(nayz5D.top_accumulators[0].code, "GR");

  // 10D: GR buy avg 79.78
  assert.equal(nayz10D.bandar_avg_cost, 79.78);
  assert.equal(nayz10D.horizon, "10D");
  assert.equal(nayz10D.top_accumulators[0].code, "GR");

  // Also test async fetchTickerDetail with horizon parameter
  const mbma2D = await fetchTickerDetail("MBMA", "2D");
  const mbma5D = await fetchTickerDetail("MBMA", "5D");
  assert.ok(mbma2D);
  assert.ok(mbma5D);
  assert.equal(mbma2D.bandar_avg_cost, 339.97);
  assert.equal(mbma5D.bandar_avg_cost, 339.04);

  // Test LOPI penny stock across horizons
  const lopi5D = await fetchTickerDetail("LOPI", "5D");
  assert.ok(lopi5D);
  assert.equal(lopi5D.close, 34);
  assert.equal(lopi5D.bandar_avg_cost, 38.25);
  assert.equal(lopi5D.top_accumulators[0].code, "CC");
});

test("AMMN multi-horizon bug fix: 2D, 5D, and 10D must have distinct authentic MCP Max values", () => {
  const ammn2D = getTickerDetailByHorizon("AMMN", "2D");
  const ammn5D = getTickerDetailByHorizon("AMMN", "5D");
  const ammn10D = getTickerDetailByHorizon("AMMN", "10D");

  assert.ok(ammn2D);
  assert.ok(ammn5D);
  assert.ok(ammn10D);

  // Assert zero identity bug: net_value, volume, and bandar modal cost MUST diverge
  assert.notEqual(ammn2D.net_value, ammn5D.net_value, "AMMN 2D and 5D net_value must not be identical");
  assert.notEqual(ammn5D.net_value, ammn10D.net_value, "AMMN 5D and 10D net_value must not be identical");
  assert.notEqual(ammn2D.bandar_avg_cost, ammn5D.bandar_avg_cost, "AMMN 2D and 5D modal must not be identical");
  assert.notEqual(ammn5D.bandar_avg_cost, ammn10D.bandar_avg_cost, "AMMN 5D and 10D modal must not be identical");

  // Exact MCP values check
  assert.equal(ammn2D.bandar_avg_cost, 3156.62);
  assert.equal(ammn2D.net_value, 12505960000);
  assert.equal(ammn5D.bandar_avg_cost, 3313.12);
  assert.equal(ammn5D.net_value, 29148977500);
  assert.equal(ammn10D.bandar_avg_cost, 3455.05);
  assert.equal(ammn10D.net_value, 46149067500);
});

test("Zero-identity safeguard across all tickers in TICKER_HORIZON_DETAILS_MAP", () => {
  const tickers = Object.keys(TICKER_HORIZON_DETAILS_MAP);
  assert.ok(tickers.length >= 20, "Must have at least 20 tickers with full multi-horizon profiles");

  for (const ticker of tickers) {
    const horizons = TICKER_HORIZON_DETAILS_MAP[ticker];
    assert.ok(horizons["2D"], `Ticker ${ticker} must have 2D profile`);
    assert.ok(horizons["5D"], `Ticker ${ticker} must have 5D profile`);
    assert.ok(horizons["10D"], `Ticker ${ticker} must have 10D profile`);

    const h2 = horizons["2D"];
    const h5 = horizons["5D"];
    const h10 = horizons["10D"];

    // Assert that 2D, 5D, 10D are NOT copy-pasted clones
    assert.notEqual(h2.net_value, h10.net_value, `Ticker ${ticker} 2D and 10D net_value must not be identical`);
    assert.notEqual(h2.bandar_avg_cost, h10.bandar_avg_cost, `Ticker ${ticker} 2D and 10D bandar_avg_cost must not be identical`);
  }
});

test("Daily snapshot bundle contains expanded market tickers with multi-horizon data", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const snapshotPath = path.resolve("src/data/broker_flow_snapshot_latest.json");

  assert.ok(fs.existsSync(snapshotPath), "Snapshot JSON must exist");
  const raw = fs.readFileSync(snapshotPath, "utf8");
  const snapshot = JSON.parse(raw);

  assert.equal(snapshot.snapshot_date, "2026-11-20");
  assert.ok(snapshot.total_tickers_indexed >= 30, "Must index at least 30 tickers in expanded snapshot");

  // Verify BBNI in snapshot horizons
  const bbni = snapshot.ticker_horizons["BBNI"];
  assert.ok(bbni, "BBNI must be indexed in expanded snapshot");
  assert.ok(bbni["2D"]);
  assert.ok(bbni["5D"]);
  assert.ok(bbni["10D"]);
  assert.equal(bbni["2D"].ticker, "BBNI");
  assert.equal(bbni["5D"].ticker, "BBNI");
  assert.equal(bbni["10D"].ticker, "BBNI");
});
