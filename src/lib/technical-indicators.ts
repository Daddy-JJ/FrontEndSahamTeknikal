import {
  computeATR,
  computeEMA,
  computeMACD,
  computeSupertrend,
  type MACDPoint,
  type OHLCVBar,
  type SupertrendPoint,
} from "./indicators.ts";

export {
  computeATR,
  computeEMA,
  computeMACD,
  computeSupertrend,
  type MACDPoint,
  type OHLCVBar,
  type SupertrendPoint,
};

export interface PivotPoints {
  date: string;
  p: number;
  r1: number;
  r2: number;
  s1: number;
  s2: number;
}

export interface FractalChannelPoint {
  time: string;
  ceiling: number | null;
  floor: number | null;
  confirmedHighAtBar: number | null;
  confirmedLowAtBar: number | null;
}

export type StockRegime = "MARKUP" | "CONSOLIDATING" | "MARKDOWN";
export type StockRegimeAction = "BUY" | "TUNGGU BREAKOUT" | "SELL / AVOID";
export type IhsgRegime = "BULL" | "NEUTRAL" | "BEAR";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Standard daily floor pivot levels derived strictly from the prior completed session bar.
 */
export function computePivotPoints(prevBar: OHLCVBar | null | undefined, currentDate?: string): PivotPoints | null {
  if (!prevBar) return null;
  const p = (prevBar.high + prevBar.low + prevBar.close) / 3;
  const spread = prevBar.high - prevBar.low;
  return {
    date: currentDate || prevBar.time,
    p: round2(p),
    r1: round2(2 * p - prevBar.low),
    r2: round2(p + spread),
    s1: round2(2 * p - prevBar.high),
    s2: round2(p - spread),
  };
}

/**
 * Compute strictly non-lookahead 5-bar fractal ceiling & floor series.
 * Pivot center bar k = t - 2 becomes known only at session t.
 */
export function computeFractalChannels(bars: OHLCVBar[]): FractalChannelPoint[] {
  const out: FractalChannelPoint[] = [];
  let activeCeiling: number | null = null;
  let activeFloor: number | null = null;

  for (let t = 0; t < bars.length; t++) {
    let confirmedHigh: number | null = null;
    let confirmedLow: number | null = null;

    if (t >= 4) {
      const k = t - 2;
      const center = bars[k];
      const isPeak =
        center.high > bars[k - 1].high &&
        center.high > bars[k - 2].high &&
        center.high > bars[k + 1].high &&
        center.high > bars[k + 2].high;
      const isTrough =
        center.low < bars[k - 1].low &&
        center.low < bars[k - 2].low &&
        center.low < bars[k + 1].low &&
        center.low < bars[k + 2].low;

      if (isPeak) {
        activeCeiling = center.high;
        confirmedHigh = center.high;
      }
      if (isTrough) {
        activeFloor = center.low;
        confirmedLow = center.low;
      }
    }

    out.push({
      time: bars[t].time,
      ceiling: activeCeiling,
      floor: activeFloor,
      confirmedHighAtBar: confirmedHigh,
      confirmedLowAtBar: confirmedLow,
    });
  }

  return out;
}

/**
 * Wilder RSI(period) aligned 1:1 with closes.
 */
export function computeRSI(closes: number[], period = 14): (number | null)[] {
  const res: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length <= period) return res;

  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gainSum += diff;
    else lossSum -= diff;
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  res[period] = avgLoss === 0 ? 100 : round2(100 - 100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const g = diff > 0 ? diff : 0;
    const l = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    res[i] = avgLoss === 0 ? 100 : round2(100 - 100 / (1 + avgGain / avgLoss));
  }

  return res;
}

/**
 * Classify individual ticker regime: MARKUP (BUY), MARKDOWN (SELL / AVOID), or CONSOLIDATING (TUNGGU BREAKOUT).
 */
export function classifyStockRegime(params: {
  close: number;
  ema21: number | null;
  ema50: number | null;
  ema21Prev5?: number | null;
  accumulationDetected?: boolean;
  distributionDetected?: boolean;
}): { regime: StockRegime; action: StockRegimeAction } {
  const { close, ema21, ema50, ema21Prev5, accumulationDetected = false, distributionDetected = false } = params;
  if (ema21 === null || ema50 === null) {
    return { regime: "CONSOLIDATING", action: "TUNGGU BREAKOUT" };
  }

  const slopeUp = ema21Prev5 != null ? ema21 > ema21Prev5 : close > ema21;
  const slopeDown = ema21Prev5 != null ? ema21 < ema21Prev5 : close < ema21;

  if (close > ema21 && close > ema50 && (ema21 >= ema50 || slopeUp) && !distributionDetected) {
    return { regime: "MARKUP", action: "BUY" };
  }
  if (close < ema21 && close < ema50 && (distributionDetected || (slopeDown && !accumulationDetected))) {
    return { regime: "MARKDOWN", action: "SELL / AVOID" };
  }
  return { regime: "CONSOLIDATING", action: "TUNGGU BREAKOUT" };
}

/**
 * Classify IHSG market regime into BULL, NEUTRAL, or BEAR.
 */
export function classifyIhsgRegime(params: {
  close: number;
  ema21: number | null;
  ema50: number | null;
  ema200: number | null;
  supertrendDir?: "up" | "down" | null;
}): IhsgRegime {
  const { close, ema21, ema50, ema200, supertrendDir } = params;
  if (ema21 === null || ema50 === null) return "NEUTRAL";

  const aboveShort = close > ema21 && close > ema50;
  const belowShort = close < ema21 && close < ema50;
  const aboveLong = ema200 === null || close >= ema200;

  if (aboveShort && (aboveLong || supertrendDir === "up")) {
    return "BULL";
  }
  if (belowShort && (supertrendDir === "down" || (ema200 !== null && close < ema200))) {
    return "BEAR";
  }
  return "NEUTRAL";
}

export interface ADXPoint {
  time: string;
  adx: number | null;
  plusDi: number | null;
  minusDi: number | null;
  strength: "STRONG" | "MODERATE" | "WEAK";
}

export interface FibonacciLevel {
  ratio: "0.0" | "0.236" | "0.382" | "0.5" | "0.618" | "0.786" | "1.0";
  label: string;
  price: number;
}

export interface FibonacciLevels {
  lookback: number;
  high: number;
  low: number;
  levels: FibonacciLevel[];
}

/**
 * Snap a price value to valid IDX exchange tick size.
 */
export function roundIdxTick(value: number, mode: "nearest" | "down" | "up" = "nearest"): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const tick =
    value < 200 ? 1 : value < 500 ? 2 : value < 2000 ? 5 : value < 5000 ? 10 : 25;
  const ratio = value / tick;
  const snapped =
    mode === "down" ? Math.floor(ratio) : mode === "up" ? Math.ceil(ratio) : Math.round(ratio);
  return Math.max(tick, snapped * tick);
}

/**
 * Wilder ADX(period) with +DI / -DI and trend strength classification.
 */
export function computeADX(bars: OHLCVBar[], period = 14): ADXPoint[] {
  const n = bars.length;
  const out: ADXPoint[] = bars.map((b) => ({
    time: b.time,
    adx: null,
    plusDi: null,
    minusDi: null,
    strength: "WEAK",
  }));
  if (n <= period * 2) return out;

  const tr = new Array<number>(n).fill(0);
  const plusDm = new Array<number>(n).fill(0);
  const minusDm = new Array<number>(n).fill(0);

  for (let i = 1; i < n; i++) {
    const cur = bars[i];
    const prev = bars[i - 1];
    tr[i] = Math.max(
      cur.high - cur.low,
      Math.abs(cur.high - prev.close),
      Math.abs(cur.low - prev.close)
    );
    const upMove = cur.high - prev.high;
    const downMove = prev.low - cur.low;
    plusDm[i] = upMove > downMove && upMove > 0 ? upMove : 0;
    minusDm[i] = downMove > upMove && downMove > 0 ? downMove : 0;
  }

  let smTr = 0;
  let smPlusDm = 0;
  let smMinusDm = 0;
  for (let i = 1; i <= period; i++) {
    smTr += tr[i];
    smPlusDm += plusDm[i];
    smMinusDm += minusDm[i];
  }

  const dxArr = new Array<number | null>(n).fill(null);
  for (let i = period; i < n; i++) {
    if (i > period) {
      smTr = smTr - smTr / period + tr[i];
      smPlusDm = smPlusDm - smPlusDm / period + plusDm[i];
      smMinusDm = smMinusDm - smMinusDm / period + minusDm[i];
    }
    const pdi = smTr > 0 ? (smPlusDm / smTr) * 100 : 0;
    const mdi = smTr > 0 ? (smMinusDm / smTr) * 100 : 0;
    out[i].plusDi = round2(pdi);
    out[i].minusDi = round2(mdi);
    const diSum = pdi + mdi;
    dxArr[i] = diSum > 0 ? (Math.abs(pdi - mdi) / diSum) * 100 : 0;
  }

  const firstAdxIdx = period * 2 - 1;
  if (firstAdxIdx >= n) return out;

  let dxSum = 0;
  for (let i = period; i <= firstAdxIdx; i++) {
    dxSum += dxArr[i] ?? 0;
  }
  let adxVal = dxSum / period;
  const toStrength = (val: number): "STRONG" | "MODERATE" | "WEAK" =>
    val >= 25 ? "STRONG" : val >= 18 ? "MODERATE" : "WEAK";

  out[firstAdxIdx].adx = round2(adxVal);
  out[firstAdxIdx].strength = toStrength(adxVal);

  for (let i = firstAdxIdx + 1; i < n; i++) {
    adxVal = (adxVal * (period - 1) + (dxArr[i] ?? 0)) / period;
    out[i].adx = round2(adxVal);
    out[i].strength = toStrength(adxVal);
  }

  return out;
}

/**
 * Compute swing-high to swing-low Fibonacci retracement levels over recent bars, snapped to IDX ticks.
 */
export function computeFibonacciLevels(bars: OHLCVBar[], lookback = 90): FibonacciLevels | null {
  if (!bars || bars.length < 5) return null;
  const slice = bars.slice(-Math.max(5, Math.min(bars.length, lookback)));
  let high = -Infinity;
  let low = Infinity;
  for (const b of slice) {
    if (b.high > high) high = b.high;
    if (b.low < low) low = b.low;
  }
  if (!Number.isFinite(high) || !Number.isFinite(low) || high <= low) return null;

  const span = high - low;
  const defs: { ratio: FibonacciLevel["ratio"]; label: string; factor: number }[] = [
    { ratio: "0.0", label: "0.0% (Swing High)", factor: 0.0 },
    { ratio: "0.236", label: "23.6%", factor: 0.236 },
    { ratio: "0.382", label: "38.2%", factor: 0.382 },
    { ratio: "0.5", label: "50.0% (Mid)", factor: 0.5 },
    { ratio: "0.618", label: "61.8% (Golden)", factor: 0.618 },
    { ratio: "0.786", label: "78.6%", factor: 0.786 },
    { ratio: "1.0", label: "100.0% (Swing Low)", factor: 1.0 },
  ];

  return {
    lookback: slice.length,
    high: roundIdxTick(high, "nearest"),
    low: roundIdxTick(low, "nearest"),
    levels: defs.map((d) => ({
      ratio: d.ratio,
      label: d.label,
      price: roundIdxTick(high - span * d.factor, "nearest"),
    })),
  };
}
