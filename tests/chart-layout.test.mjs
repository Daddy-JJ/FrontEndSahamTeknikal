import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chartPaneSizes } from '../src/lib/chart-layout.ts';

test('short panels retain readable price, volume and optional MACD minima', () => {
  assert.deepEqual(chartPaneSizes(180, false), { height: 340, price: 232, volume: 72 });
  assert.deepEqual(chartPaneSizes(180, true), { height: 440, price: 232, volume: 72, macd: 100 });
});
test('extra space belongs to price pane and fractional resize values are bounded', () => {
  assert.deepEqual(chartPaneSizes(600.8, true), { height: 600, price: 392, volume: 72, macd: 100 });
  assert.deepEqual(chartPaneSizes(800, false), { height: 800, price: 692, volume: 72 });
});
test('invalid dimensions fail safely to the minimum rather than creating an invalid canvas', () => {
  assert.equal(chartPaneSizes(NaN, true).height, 440);
  assert.equal(chartPaneSizes(Infinity, false).height, 340);
});
