import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chartLabel, chartReason, chartFailureClearsData } from '../src/lib/chart-presentation.ts';
test('chart state and reasons use Indonesian labels without hiding canonical audit codes', () => {
  assert.equal(chartLabel('current'), 'Terkini');
  assert.equal(chartLabel('snapshot'), 'Saat sinyal');
  assert.equal(chartReason('missing_bar'), 'Harga sesi belum tersedia');
  assert.equal(chartReason('actual_price_basis_unverified'), 'Basis harga transaksi aktual belum terverifikasi');
  assert.equal(chartReason('newer_receipt_unusable'), 'Sumber terbaru belum layak; harga memakai revisi sebelumnya');
  assert.equal(chartReason('new_unknown_code'), 'Data memerlukan pemeriksaan; lihat rincian sumber');
});
test('auth denial and expiry clear previously rendered prices including a paging failure', () => {
  assert.equal(chartFailureClearsData('UNAUTHENTICATED'), true);
  assert.equal(chartFailureClearsData('FORBIDDEN'), true);
  assert.equal(chartFailureClearsData('REVISION_UNAVAILABLE'), false);
});
