import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_MARKET_SUMMARY,
  DEFAULT_TOP_ACCUMULATIONS,
  DEFAULT_TOP_DISTRIBUTIONS,
  DEFAULT_TOP_BROKERS,
  DEFAULT_SECTOR_FLOWS,
  TICKER_DETAILS_MAP,
  QUADRANT_MAPS,
  synthesizeTickerDetail,
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

test("Synthesize ticker detail works gracefully for unknown tickers", () => {
  const custom = synthesizeTickerDetail("PGAS");
  assert.equal(custom.ticker, "PGAS");
  assert.ok(custom.trade_plan);
  assert.ok(custom.top_accumulators.length > 0);
});

test("Format rupiah utility behaves accurately", () => {
  assert.equal(formatRupiah(91200000000), "+91.2B");
  assert.equal(formatRupiah(-311600000000), "-311.6B");
  assert.equal(formatRupiah(13570000000000), "+13.57T");
});
