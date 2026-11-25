import test from "node:test";
import assert from "node:assert/strict";
import {
  aggregateBrokerFootprint,
  computeHorizonWindow,
  formatDateRangeID,
  synthesizeLiveMarketOverview,
} from "../src/lib/live-broker-flow.ts";

test("computeHorizonWindow resolves rolling trading windows without weekend gaps", () => {
  const dates = [
    "2026-11-11",
    "2026-11-12",
    "2026-11-13",
    "2026-11-16",
    "2026-11-17",
    "2026-11-18",
    "2026-11-19",
    "2026-11-20",
    "2026-11-23",
    "2026-11-24",
  ];

  const w2 = computeHorizonWindow(dates, "2D");
  assert.equal(w2.startDate, "2026-11-23");
  assert.equal(w2.endDate, "2026-11-24");
  assert.equal(w2.tradingDays, 2);

  const w5 = computeHorizonWindow(dates, "5D");
  assert.equal(w5.startDate, "2026-11-18");
  assert.equal(w5.endDate, "2026-11-24");
  assert.equal(w5.tradingDays, 5);

  const w10 = computeHorizonWindow(dates, "10D");
  assert.equal(w10.startDate, "2026-11-11");
  assert.equal(w10.endDate, "2026-11-24");
  assert.equal(w10.tradingDays, 10);
});

test("formatDateRangeID formats same-month and cross-month spans accurately", () => {
  assert.equal(formatDateRangeID("2026-11-18", "2026-11-24"), "18 - 24 Nov 2026");
  assert.equal(formatDateRangeID("2026-10-29", "2026-11-04"), "29 Okt - 04 Nov 2026");
  assert.equal(formatDateRangeID("2026-11-24", "2026-11-24"), "24 Nov 2026");
});

test("aggregateBrokerFootprint sums multi-day per-ticker flows without duplicate tickers", () => {
  const fp = aggregateBrokerFootprint("XL", [
    { ticker: "CUAN", date: "2026-11-23", netValue: -12_000_000_000 },
    { ticker: "CUAN", date: "2026-11-24", netValue: 15_500_000_000 }, // Net +3.5B over 2D
    { ticker: "BMRI", date: "2026-11-24", netValue: -72_100_000_000 },
    { ticker: "CDIA", date: "2026-11-24", netValue: 8_900_000_000 },
  ]);

  assert.equal(fp.broker_code, "XL");
  assert.equal(fp.broker_name, "Stockbit Sekuritas");
  assert.equal(fp.top_bought[0].ticker, "CDIA");
  assert.equal(fp.top_bought[1].ticker, "CUAN");
  assert.equal(fp.top_bought[1].net_val, 3_500_000_000);
  assert.equal(fp.top_sold[0].ticker, "BMRI");
  assert.equal(fp.total_net, -59_700_000_000);
});

test("synthesizeLiveMarketOverview cleanly splits accumulations/distributions and tracks EOD freshness", () => {
  const overview = synthesizeLiveMarketOverview({
    horizon: "5D",
    availDates: ["2026-11-18", "2026-11-19", "2026-11-20", "2026-11-23", "2026-11-24"],
    snapshotResp: {
      date: "2026-11-24",
      totalTradeValue: 22_020_398_618_100,
    },
    quadrantResp: {
      date: "2026-11-24",
      summary: {
        markup_akumulasi: 156,
        markup_distribusi: 139,
        markdown_akumulasi: 99,
        markdown_distribusi: 203,
      },
      totalTickers: 597,
      records: [],
    },
    accRankingResp: {
      records: [
        {
          ticker: "BBCA",
          close: 5800,
          changePercent: 2.2,
          foreignNetValue: 256_500_000_000,
          governmentNetValue: -93_700_000_000,
          topBuyerNetValueTopN: 676_400_000_000,
          topSellerNetValueTopN: 589_400_000_000,
          accumulationStrengthPct: 49.45,
          topNetBuyer: { code: "BK", investorGroups: ["FOREIGN"], netValue: 238_200_000_000, buyAvgPrice: 5802.9 },
          topNetSeller: { code: "CC", netValue: -216_800_000_000 },
          bandarSignal: { label: "MIXED_NEUTRAL", score: 10.16 },
        },
        {
          ticker: "BBNI",
          close: 3570,
          changePercent: 0.85,
          foreignNetValue: -34_300_000_000,
          governmentNetValue: 31_800_000_000,
          topBuyerNetValueTopN: 125_200_000_000,
          topSellerNetValueTopN: 127_500_000_000,
          distributionStrengthPct: 53.52,
          topNetBuyer: { code: "ZP", netValue: 38_700_000_000 },
          topNetSeller: { code: "RX", netValue: -74_300_000_000, sellAvgPrice: 3568.8 },
          bandarSignal: { label: "MIXED_NEUTRAL", score: -14.66 },
        },
      ],
    },
    foreignSellResp: {
      records: [
        {
          ticker: "TPIA",
          close: 1225,
          changePercent: -5.41,
          foreignNetValue: -26_600_000_000,
          governmentNetValue: 1_600_000_000,
          topBuyerNetValueTopN: 40_500_000_000,
          topSellerNetValueTopN: 54_300_000_000,
          distributionStrengthPct: 24.96,
          topNetBuyer: { code: "SQ", netValue: 20_600_000_000 },
          topNetSeller: { code: "AK", netValue: -20_300_000_000, sellAvgPrice: 1255.8 },
          bandarSignal: { label: "MIXED_NEUTRAL", score: -6.07 },
        },
      ],
    },
    retailHistories: {
      XL: [{ ticker: "CDIA", netValue: 8_891_000_000 }],
      XC: [{ ticker: "BBRI", netValue: 5_000_000_000 }],
      YP: [{ ticker: "TPIA", netValue: 12_000_000_000 }],
    },
    // Fixed instant: 2026-11-25 19:51 WIB (12:51 UTC) -> 25 Nov not released yet
    now: new Date("2026-11-25T12:51:00Z"),
  });

  assert.equal(overview.snapshot_date, "2026-11-24");
  assert.equal(overview.data_freshness.today_wib, "2026-11-25");
  assert.equal(overview.data_freshness.is_today_published, false);
  assert.ok(overview.data_freshness.message.includes("25 Nov 2026 belum rilis"));
  assert.equal(overview.market_summary.quadrant_counts.markup_akumulasi, 156);
  assert.equal(overview.market_summary.total_classified, 597);
  assert.equal(overview.daily_insight.date_range, "18 - 24 Nov 2026 (5D)");

  // BBCA is accumulated (should not appear in top_distributions)
  assert.ok(overview.top_accumulations.some((x) => x.ticker === "BBCA"));
  assert.ok(!overview.top_distributions.some((x) => x.ticker === "BBCA"));

  // BBNI & TPIA are distributed
  assert.ok(overview.top_distributions.some((x) => x.ticker === "BBNI"));
  assert.ok(overview.top_distributions.some((x) => x.ticker === "TPIA"));

  // Assert zero ticker overlap between accumulation and distribution lists or sweet spots and traps
  const accSet = new Set(overview.top_accumulations.map((x) => x.ticker));
  for (const d of overview.top_distributions) {
    assert.equal(accSet.has(d.ticker), false, `${d.ticker} must not overlap in distributions`);
  }
  const sweetSet = new Set(overview.daily_insight.sweet_spots.map((s) => s.ticker));
  for (const tr of overview.daily_insight.traps) {
    assert.equal(sweetSet.has(tr.ticker), false, `${tr.ticker} must not overlap in traps`);
  }
});
