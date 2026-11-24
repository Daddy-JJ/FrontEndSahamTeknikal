import test from "node:test";
import assert from "node:assert/strict";
import {
  computeEMA,
  computeATR,
  computeSupertrend,
  computeMACD,
} from "../src/lib/indicators.ts";

function generateMockBars(count = 50, startPrice = 100) {
  const bars = [];
  let price = startPrice;

  for (let i = 0; i < count; i++) {
    const dateStr = new Date(Date.UTC(2026, 0, 1 + i))
      .toISOString()
      .slice(0, 10);
    const change = i % 3 === 0 ? -1 : 1.5;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + 1;
    const low = Math.min(open, close) - 1;
    const volume = 10000 + i * 500;

    bars.push({
      time: dateStr,
      open,
      high,
      low,
      close,
      volume,
    });
    price = close;
  }
  return bars;
}

test("computeEMA returns correct array length and initial nulls", () => {
  const values = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const ema = computeEMA(values, 5);

  assert.equal(ema.length, values.length);
  assert.equal(ema[0], null);
  assert.equal(ema[3], null);
  // 5th element (index 4) should be SMA: (10+11+12+13+14)/5 = 12
  assert.equal(ema[4], 12);
  assert.ok(ema[5] !== null && ema[5] > 12);
});

test("computeATR returns proper Wilder's smoothed values", () => {
  const bars = generateMockBars(30, 200);
  const atr = computeATR(bars, 10);

  assert.equal(atr.length, bars.length);
  assert.equal(atr[0], null);
  assert.equal(atr[8], null);
  assert.ok(atr[9] !== null && atr[9] > 0);
  assert.ok(atr[29] !== null && atr[29] > 0);
});

test("computeSupertrend calculates direction and price boundaries", () => {
  const bars = generateMockBars(40, 300);
  const st = computeSupertrend(bars, 10, 3.0);

  // Bars length is 40, atr becomes available at index 9, so st should have 31 points
  assert.equal(st.length, 31);
  for (const point of st) {
    assert.ok(["up", "down"].includes(point.direction));
    assert.ok(["#10b981", "#ef4444"].includes(point.color));
    assert.ok(point.value > 0);
    assert.ok(point.time.length === 10);
  }
});

test("computeMACD generates MACD line, signal line and histogram", () => {
  const bars = generateMockBars(60, 100);
  const macd = computeMACD(bars, 12, 26, 9);

  assert.equal(macd.length, 60);
  // First 25 points have null MACD
  assert.equal(macd[0].macd, null);
  assert.equal(macd[24].macd, null);
  // At index 25 (26th bar), MACD becomes non-null
  assert.ok(macd[25].macd !== null);

  // Later points should have non-null histogram and signal
  const last = macd[59];
  assert.ok(last.macd !== null);
  assert.ok(last.signal !== null);
  assert.ok(last.histogram !== null);
  assert.ok(["#10b981", "#ef4444"].includes(last.color));
});
