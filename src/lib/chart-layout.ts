/** Pane minima keep OHLC, share volume and optional MACD readable on short screens. */
export function chartPaneSizes(availableHeight: number, macd: boolean) {
  const minimum = macd ? 440 : 340;
  const height = Number.isFinite(availableHeight)
    ? Math.max(minimum, Math.floor(availableHeight))
    : minimum;
  const volume = 72;
  const timeAxis = 36;
  return {
    height,
    price: height - volume - timeAxis - (macd ? 100 : 0),
    volume,
    ...(macd ? { macd: 100 } : {}),
  };
}
