export type OHLCVBar = {
  time: string; // "YYYY-MM-DD"
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type SupertrendPoint = {
  time: string;
  value: number;
  direction: "up" | "down";
  color: string;
};

export type MACDPoint = {
  time: string;
  macd: number | null;
  signal: number | null;
  histogram: number | null;
  color: string;
};

/**
 * Computes Exponential Moving Average (EMA) for an array of numbers.
 */
export function computeEMA(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period) return result;

  // Initial SMA as first EMA seed
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  let prevEMA = sum / period;
  result[period - 1] = prevEMA;

  const multiplier = 2 / (period + 1);
  for (let i = period; i < values.length; i++) {
    const currentEMA = (values[i] - prevEMA) * multiplier + prevEMA;
    result[i] = currentEMA;
    prevEMA = currentEMA;
  }

  return result;
}

/**
 * Computes Average True Range (ATR) using Wilder's RMA method.
 */
export function computeATR(bars: OHLCVBar[], period = 10): (number | null)[] {
  const atr: (number | null)[] = new Array(bars.length).fill(null);
  if (bars.length < period) return atr;

  // True Range calculation
  const tr: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    const current = bars[i];
    if (i === 0) {
      tr.push(current.high - current.low);
    } else {
      const prevClose = bars[i - 1].close;
      const hl = current.high - current.low;
      const hpc = Math.abs(current.high - prevClose);
      const lpc = Math.abs(current.low - prevClose);
      tr.push(Math.max(hl, hpc, lpc));
    }
  }

  // Initial SMA of TR
  let trSum = 0;
  for (let i = 0; i < period; i++) {
    trSum += tr[i];
  }
  let currentATR = trSum / period;
  atr[period - 1] = currentATR;

  // Wilder's smoothing: ATR_t = (ATR_{t-1} * (period - 1) + TR_t) / period
  for (let i = period; i < bars.length; i++) {
    currentATR = (currentATR * (period - 1) + tr[i]) / period;
    atr[i] = currentATR;
  }

  return atr;
}

/**
 * Computes Supertrend (TradingView Standard Formula).
 * ATR Period default: 10, Multiplier default: 3.0
 */
export function computeSupertrend(
  bars: OHLCVBar[],
  period = 10,
  multiplier = 3.0
): SupertrendPoint[] {
  if (bars.length < period) return [];

  const atrValues = computeATR(bars, period);
  const points: SupertrendPoint[] = [];

  let prevUpper = 0;
  let prevLower = 0;
  let prevSupertrend = 0;
  let prevTrend: "up" | "down" = "up";
  let initialized = false;

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    const atr = atrValues[i];

    if (atr === null) continue;

    const hl2 = (bar.high + bar.low) / 2;
    const basicUpper = hl2 + multiplier * atr;
    const basicLower = hl2 - multiplier * atr;

    let finalUpper = basicUpper;
    let finalLower = basicLower;

    if (!initialized) {
      prevUpper = basicUpper;
      prevLower = basicLower;
      prevTrend = bar.close >= basicLower ? "up" : "down";
      prevSupertrend = prevTrend === "up" ? basicLower : basicUpper;
      initialized = true;

      points.push({
        time: bar.time,
        value: Number(prevSupertrend.toFixed(2)),
        direction: prevTrend,
        color: prevTrend === "up" ? "#10b981" : "#ef4444",
      });
      continue;
    }

    // Final upper band logic
    const prevClose = bars[i - 1].close;
    if (basicUpper < prevUpper || prevClose > prevUpper) {
      finalUpper = basicUpper;
    } else {
      finalUpper = prevUpper;
    }

    // Final lower band logic
    if (basicLower > prevLower || prevClose < prevLower) {
      finalLower = basicLower;
    } else {
      finalLower = prevLower;
    }

    // Trend flipping logic
    let currentTrend: "up" | "down" = prevTrend;
    let currentSupertrend = prevSupertrend;

    if (prevSupertrend === prevUpper) {
      // Previously in downtrend
      if (bar.close > finalUpper) {
        currentTrend = "up";
        currentSupertrend = finalLower;
      } else {
        currentTrend = "down";
        currentSupertrend = finalUpper;
      }
    } else {
      // Previously in uptrend
      if (bar.close < finalLower) {
        currentTrend = "down";
        currentSupertrend = finalUpper;
      } else {
        currentTrend = "up";
        currentSupertrend = finalLower;
      }
    }

    prevUpper = finalUpper;
    prevLower = finalLower;
    prevTrend = currentTrend;
    prevSupertrend = currentSupertrend;

    points.push({
      time: bar.time,
      value: Number(currentSupertrend.toFixed(2)),
      direction: currentTrend,
      color: currentTrend === "up" ? "#10b981" : "#ef4444",
    });
  }

  return points;
}

/**
 * Computes MACD (12, 26, 9) standard formula.
 */
export function computeMACD(
  bars: OHLCVBar[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): MACDPoint[] {
  if (bars.length < slowPeriod) {
    return bars.map((b) => ({
      time: b.time,
      macd: null,
      signal: null,
      histogram: null,
      color: "#10b981",
    }));
  }

  const closes = bars.map((b) => b.close);
  const fastEMA = computeEMA(closes, fastPeriod);
  const slowEMA = computeEMA(closes, slowPeriod);

  // Raw MACD Line
  const macdLine: (number | null)[] = [];
  for (let i = 0; i < bars.length; i++) {
    const f = fastEMA[i];
    const s = slowEMA[i];
    if (f !== null && s !== null) {
      macdLine.push(f - s);
    } else {
      macdLine.push(null);
    }
  }

  // Extract non-null MACD values to compute Signal line
  const validMacdIndices: number[] = [];
  const validMacdValues: number[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] !== null) {
      validMacdIndices.push(i);
      validMacdValues.push(macdLine[i]!);
    }
  }

  const signalEMA = computeEMA(validMacdValues, signalPeriod);
  const signalMap = new Map<number, number>();
  for (let k = 0; k < validMacdIndices.length; k++) {
    const sig = signalEMA[k];
    if (sig !== null) {
      signalMap.set(validMacdIndices[k], sig);
    }
  }

  const result: MACDPoint[] = [];
  for (let i = 0; i < bars.length; i++) {
    const m = macdLine[i];
    const s = signalMap.get(i) ?? null;
    const hist = m !== null && s !== null ? m - s : null;

    result.push({
      time: bars[i].time,
      macd: m !== null ? Number(m.toFixed(2)) : null,
      signal: s !== null ? Number(s.toFixed(2)) : null,
      histogram: hist !== null ? Number(hist.toFixed(2)) : null,
      color: (hist ?? 0) >= 0 ? "#10b981" : "#ef4444",
    });
  }

  return result;
}
