import test from "node:test";
import assert from "node:assert/strict";
import {
  computeADX,
  computeFibonacciLevels,
  roundIdxTick,
} from "../src/lib/technical-indicators.ts";

test("roundIdxTick snaps prices cleanly to IDX exchange tick tiers", () => {
  assert.equal(roundIdxTick(147.4, "nearest"), 147);
  assert.equal(roundIdxTick(315, "down"), 314);
  assert.equal(roundIdxTick(315, "up"), 316);
  assert.equal(roundIdxTick(1243, "nearest"), 1245);
  assert.equal(roundIdxTick(2173, "nearest"), 2170);
  assert.equal(roundIdxTick(6012, "up"), 6025);
});

test("computeADX yields directional +DI/-DI and bounded trend strength on uptrend bars", () => {
  const bars = Array.from({ length: 45 }, (_, i) => {
    const base = 1000 + i * 22;
    return {
      time: `2026-10-${String((i % 28) + 1).padStart(2, "0")}`,
      open: base - 8,
      high: base + 18,
      low: base - 12,
      close: base + 12,
      volume: 1_000_000 + i * 25_000,
    };
  });

  const adx = computeADX(bars, 14);
  assert.equal(adx.length, bars.length);
  assert.equal(adx[10].adx, null);

  const last = adx[adx.length - 1];
  assert.ok(last.adx !== null);
  assert.ok(last.adx >= 0 && last.adx <= 100);
  assert.ok((last.plusDi ?? 0) > (last.minusDi ?? 0));
  assert.equal(last.strength, "STRONG");

  const shortBars = bars.slice(0, 20);
  const shortAdx = computeADX(shortBars, 14);
  assert.equal(shortAdx[shortAdx.length - 1].adx, null);
});

test("computeFibonacciLevels orders retracements monotonically from high to low", () => {
  const bars = [
    { time: "2026-11-01", open: 2000, high: 2050, low: 1900, close: 2000, volume: 1000 },
    { time: "2026-11-02", open: 2010, high: 2400, low: 2000, close: 2350, volume: 1200 },
    { time: "2026-11-03", open: 2350, high: 2600, low: 2300, close: 2550, volume: 1500 },
    { time: "2026-11-04", open: 2550, high: 2580, low: 2200, close: 2280, volume: 1100 },
    { time: "2026-11-05", open: 2280, high: 2320, low: 2150, close: 2220, volume: 1000 },
  ];

  const fib = computeFibonacciLevels(bars, 90);
  assert.ok(fib);
  assert.equal(fib.high, 2600);
  assert.equal(fib.low, 1900);
  assert.equal(fib.levels.length, 7);
  for (let i = 1; i < fib.levels.length; i++) {
    assert.ok(fib.levels[i - 1].price >= fib.levels[i].price);
  }
});
