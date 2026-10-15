import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chartPerformanceFixture } from '../src/lib/chart-perf-fixture.ts';
import { parseChartEnvelope } from '../src/lib/chart-contract.ts';
test('the performance scenario is explicitly synthetic and exactly 500 bounded slots', () => {
  const raw = chartPerformanceFixture();
  const result = parseChartEnvelope(raw, 'fixture', 'ADRO');
  assert.ok(result?.success);
  assert.equal(result.data.sessions.length, 500);
  assert.equal(result.data.bars.length, 500);
  assert.equal(result.data.overlays.markers.length, 500);
  assert.equal(result.data.indicators.macd.points.length, 500);
  assert.equal(parseChartEnvelope(raw, 'live', 'ADRO'), null);
  assert.ok(Buffer.byteLength(JSON.stringify(raw)) < 1024*1024);
});
