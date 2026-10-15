import { chartFixture } from './chart-fixture.ts';
import type { ChartIndicator } from './chart-contract.ts';

/** Synthetic load benchmark only. These are not exchange sessions or market prices. */
export function chartPerformanceFixture() {
  const envelope = chartFixture();
  if (!envelope.success) return envelope;
  const syntheticDates = Array.from({length: 750}, (_, index) => {
    const date = new Date(Date.UTC(2024, 9, 1 + index));
    return date.getUTCDay() === 0 || date.getUTCDay() === 6 ? null : date.toISOString().slice(0, 10);
  }).filter((date): date is string => date !== null).slice(-500);
  const first = syntheticDates[0], last = syntheticDates.at(-1)!;
  const indicator = (base: ChartIndicator, offset: number): ChartIndicator => ({
    ...base, history_count: 600, eligible_from: first,
    points: syntheticDates.map((session, index) => ({session, value: offset + index / 100})),
  });
  const data = envelope.data;
  return {...envelope, data: {...data,
    source: {...data.source, history_start: first, last_market_session: last, resolved_cutoff: last},
    quality: {...data.quality, completeness: 'complete' as const, expected_session: last, reasons: []},
    sessions: syntheticDates,
    bars: syntheticDates.map((session, index) => ({session, open: String(1000+index), high: String(1020+index), low: String(990+index), close: String(1010+index), volume: '120000'})),
    gaps: [],
    indicators: {sma10: indicator(data.indicators.sma10, 1000), ema200: indicator(data.indicators.ema200, 990),
      macd: indicator(data.indicators.macd, 2), macd_signal: indicator(data.indicators.macd_signal, 1), macd_histogram: indicator(data.indicators.macd_histogram, 1)},
    overlays: {...data.overlays, levels: [], markers: syntheticDates.map((session, index) => ({id: `synthetic-${index}`, kind: 'signal' as const, session, available_session: session, price: String(1010+index), source_id: 'synthetic-benchmark', status: 'confirmed' as const}))},
    pagination: {...data.pagination, window_from: first, window_to: last, limit: 500, returned_slots: 500},
  }};
}
