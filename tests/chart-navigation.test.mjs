import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chartPageHref, safeChartReturn, chartIndicators, chartPageRequest, chartViewRequest } from '../src/lib/chart-navigation.ts';

const request = { ticker: 'ADRO', context: 'signal', context_id: 'a'.repeat(64), view: 'snapshot', timeframe: '1d', limit: 250 };
test('chart links preserve exact canonical identity and a safe parent cohort', () => {
  const back = '/scanner?run=abc&section=signals&page=2&strategy=MACD_EMA200_V1';
  const url = new URL(chartPageHref(request, back), 'http://local');
  assert.equal(url.pathname, '/chart/ADRO');
  assert.equal(url.searchParams.get('return_to'), back);
  assert.deepEqual(chartPageRequest('ADRO', url.searchParams), { request, returnTo: back, initialIndicators: {} });
  assert.equal(chartPageHref({ ...request, ticker: '../secret' }, back), null);
  assert.equal(chartPageHref(request, 'https://evil.test'), null);
  assert.equal(chartPageRequest('ADRO', new URLSearchParams('return_to=/scanner&return_to=/analytics')), null);
  assert.equal(chartPageRequest('ADRO', new URLSearchParams('return_to=//evil.test')), null);
});
test('display-only indicators survive enlargement and never enter RPC parameters', () => {
  const url = new URL(chartPageHref(request, '/scanner', {ema200: true, macd: true}), 'http://local');
  const parsed = chartPageRequest('ADRO', url.searchParams);
  assert.deepEqual(parsed.initialIndicators, {ema200: true, macd: true});
  assert.deepEqual(parsed.request, request);
  assert.equal(chartPageRequest('ADRO', new URLSearchParams('indicators=unknown')), null);
  assert.equal(chartPageRequest('ADRO', new URLSearchParams('indicators=macd,macd')), null);
  assert.equal(chartPageRequest('ADRO', new URLSearchParams('indicators=macd&indicators=sma10')), null);
});
test('return navigation refuses redirects, traversal and hidden unsafe characters', () => {
  for (const value of ['https://evil.test', '//evil.test', '/\\evil.test', '/scanner/../login', '/scanner%2f..%2flogin', '/scanner?x=%0afoo', '/login?next=//evil', '/api/chart/ADRO', '/scanner?'+ 'a'.repeat(4096)])
    assert.equal(safeChartReturn(value), null, value);
  for (const value of ['/scanner?section=quality&page=3', '/analytics?tab=signals&strategy=MACD_EMA200_V1', '/journal?tab=paper&experiment=ma10', '/journal/paper/legacy-id', '/journal/11111111-1111-4111-8111-111111111111', '/'])
    assert.equal(safeChartReturn(value), value);
  assert.equal(safeChartReturn(undefined), '/scanner');
});
test('snapshot/followup switching drops cursor and window but preserves source identity', () => {
  assert.deepEqual(chartViewRequest({ ...request, from: '2026-10-08', to: '2026-10-09', cursor: 'old' }, 'followup'), { ...request, view: 'followup' });
  assert.equal(chartViewRequest({ ...request, context: 'actual' }, 'snapshot'), null);
  assert.equal(chartViewRequest({ ...request, context: 'latest', context_id: undefined }, 'snapshot'), null);
});
test('known strategy defaults remain independent from the exit experiment', () => {
  assert.deepEqual(chartIndicators('MACD_EMA200_V1', 'ma10'), { ema200: true, macd: true, sma10: true });
  assert.deepEqual(chartIndicators('FRACTAL_BREAKOUT_V1', 'fixed2r'), {});
  assert.deepEqual(chartIndicators(undefined, 'SMA10'), { sma10: true });
  assert.deepEqual(chartIndicators('not_MACD_EMA200_V1'), {});
});
