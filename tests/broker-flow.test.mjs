import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_MARKET_SUMMARY,
  DEFAULT_TOP_ACCUMULATIONS,
  DEFAULT_TOP_DISTRIBUTIONS,
  DEFAULT_TOP_BROKERS,
  DEFAULT_SECTOR_FLOWS,
  TICKER_DETAILS_MAP,
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

test("Format rupiah utility behaves accurately", () => {
  assert.equal(formatRupiah(91200000000), "+91.2B");
  assert.equal(formatRupiah(-311600000000), "-311.6B");
  assert.equal(formatRupiah(13570000000000), "+13.57T");
});

test("Ticker details map provides accurate stock trader calculations", () => {
  const mbmaDetail = TICKER_DETAILS_MAP["MBMA"];
  assert.ok(mbmaDetail);
  assert.equal(mbmaDetail.bandar_avg_cost, 340.37);
  assert.equal(mbmaDetail.bandar_cost_gap_pct, 1.06);
  assert.equal(mbmaDetail.trade_plan.action, "BUY ON PULLBACK");
  assert.equal(mbmaDetail.trade_plan.rr_ratio, "1 : 3.1");

  const bbcaDetail = TICKER_DETAILS_MAP["BBCA"];
  assert.ok(bbcaDetail);
  assert.equal(bbcaDetail.trade_plan.action, "HARD AVOID");
});
