import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyIhsgRegime,
  classifyStockRegime,
  computeFractalChannels,
  computePivotPoints,
  computeRSI,
} from "../src/lib/technical-indicators.ts";
import {
  formatRupiahCompact,
  marketRegimeMeta,
  smartMoneyMeta,
  stockRegimeMeta,
} from "../src/lib/format-id.ts";

test("computePivotPoints calculates standard floor levels from prior completed session", () => {
  const pivots = computePivotPoints(
    { time: "2026-11-26", open: 980, high: 1030, low: 970, close: 1000, volume: 500000 },
    "2026-11-27"
  );
  assert.ok(pivots);
  assert.equal(pivots.date, "2026-11-27");
  assert.equal(pivots.p, 1000);
  assert.equal(pivots.r1, 1030);
  assert.equal(pivots.s1, 970);
  assert.equal(pivots.r2, 1060);
  assert.equal(pivots.s2, 940);
});

test("computeFractalChannels confirms 5-bar pivot at t = k + 2 without lookahead", () => {
  const bars = [
    { time: "2026-11-16", open: 100, high: 102, low: 98, close: 100, volume: 1000 },
    { time: "2026-11-17", open: 101, high: 105, low: 99, close: 103, volume: 1000 },
    { time: "2026-11-18", open: 104, high: 112, low: 101, close: 108, volume: 1500 }, // peak k=2 (112)
    { time: "2026-11-19", open: 107, high: 108, low: 100, close: 102, volume: 1000 },
    { time: "2026-11-20", open: 102, high: 104, low: 95, close: 99, volume: 1000 },  // confirms ceiling=112 only at t=4!
    { time: "2026-11-23", open: 100, high: 115, low: 99, close: 114, volume: 2500 }, // breakout above 112
  ];

  const channels = computeFractalChannels(bars);
  assert.equal(channels.length, 6);
  // Before bar 4, the peak at k=2 MUST NOT leak into t=2 or t=3
  assert.equal(channels[2].ceiling, null);
  assert.equal(channels[3].ceiling, null);
  assert.equal(channels[4].ceiling, 112);
  assert.equal(channels[4].confirmedHighAtBar, 112);
  assert.equal(channels[5].ceiling, 112);
});

test("classifyStockRegime maps MARKUP, CONSOLIDATING, and MARKDOWN with actions", () => {
  const markup = classifyStockRegime({
    close: 1200,
    ema21: 1150,
    ema50: 1100,
    ema21Prev5: 1120,
    accumulationDetected: true,
    distributionDetected: false,
  });
  assert.deepEqual(markup, { regime: "MARKUP", action: "BUY" });

  const markdown = classifyStockRegime({
    close: 900,
    ema21: 980,
    ema50: 1040,
    ema21Prev5: 1005,
    accumulationDetected: false,
    distributionDetected: true,
  });
  assert.deepEqual(markdown, { regime: "MARKDOWN", action: "SELL / AVOID" });

  const consolidating = classifyStockRegime({
    close: 1020,
    ema21: 1010,
    ema50: 1040,
    ema21Prev5: 1015,
    accumulationDetected: false,
    distributionDetected: false,
  });
  assert.deepEqual(consolidating, { regime: "CONSOLIDATING", action: "TUNGGU BREAKOUT" });
});

test("classifyIhsgRegime classifies BULL, BEAR, and NEUTRAL accurately", () => {
  assert.equal(
    classifyIhsgRegime({ close: 7600, ema21: 7450, ema50: 7300, ema200: 7100, supertrendDir: "up" }),
    "BULL"
  );
  assert.equal(
    classifyIhsgRegime({ close: 6900, ema21: 7200, ema50: 7350, ema200: 7250, supertrendDir: "down" }),
    "BEAR"
  );
  assert.equal(
    classifyIhsgRegime({ close: 7380, ema21: 7350, ema50: 7420, ema200: 7200, supertrendDir: "down" }),
    "NEUTRAL"
  );
});

test("computeRSI returns bounded 0..100 values after warmup period", () => {
  const closes = Array.from({ length: 30 }, (_, i) => 100 + i * 2);
  const rsi = computeRSI(closes, 14);
  assert.equal(rsi[13], null);
  assert.ok(rsi[14] !== null && rsi[14] >= 90 && rsi[14] <= 100);
});

test("format helpers produce signed Rupiah and non-color-only labels", () => {
  assert.equal(formatRupiahCompact(1_500_000_000, true), "+Rp 1,5 M");
  assert.equal(formatRupiahCompact(-2_500_000_000_000, true), "-Rp 2,5 T");
  assert.equal(smartMoneyMeta(3, "STRONG CONFIRMATION").text, "3/3 · STRONG CONFIRMATION");
  assert.equal(stockRegimeMeta("MARKUP", "BUY").text, "▲ MARKUP · BUY");
  assert.equal(marketRegimeMeta("NEUTRAL").text, "◆ NEUTRAL · SELEKTIF");
});
