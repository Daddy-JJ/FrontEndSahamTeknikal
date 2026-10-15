const labels: Record<string, string> = {
  current: 'Terkini', stale: 'Belum terkini', unknown: 'Belum terverifikasi',
  complete: 'Lengkap', partial: 'Parsial', ready: 'Tersedia', unavailable: 'Belum tersedia',
  latest: 'Harga terbaru', signal: 'Sinyal', paper: 'Paper', actual: 'Aktual',
  snapshot: 'Saat sinyal', followup: 'Perkembangan', planned: 'Rencana',
  effective: 'Aktif', ended: 'Selesai', confirmed: 'Terkonfirmasi', simulated: 'Simulasi',
  ambiguous: 'Ambigu', planned_entry: 'Rencana entry', initial_stop: 'SL awal',
  current_stop: 'SL terakhir', target: 'Target harga', fractal: 'Level fractal',
  entry_fill: 'Fill entry', ma_exit_trigger: 'Close pemicu exit MA', exit_fill: 'Fill exit',
};
const reasons: Record<string, string> = {
  missing_bar: 'Harga sesi belum tersedia',
  actual_price_basis_unverified: 'Basis harga transaksi aktual belum terverifikasi',
  overlay_price_basis_mismatch: 'Basis harga chart dan transaksi berbeda',
  newer_receipt_unusable: 'Sumber terbaru belum layak; harga memakai revisi sebelumnya',
  calendar_current_unknown: 'Kalender belum membuktikan sesi harga terkini',
  calendar_unavailable: 'Kalender bursa terverifikasi belum tersedia',
  corporate_actions_unknown: 'Aksi korporasi belum terverifikasi',
  insufficient_history: 'Histori belum cukup untuk indikator',
  history_unavailable: 'Histori indikator belum tersedia',
  missing_history: 'Histori indikator belum lengkap',
  data_hold: 'Data tertahan', invalid_bar: 'Harga sesi tidak lolos validasi',
  payload_budget_exceeded: 'Data melebihi batas baca; pilih rentang yang lebih kecil',
};
export function chartLabel(code: string): string { return labels[code] ?? code; }
export function chartReason(code: string): string {
  return reasons[code] ?? 'Data memerlukan pemeriksaan; lihat rincian sumber';
}
export function chartFailureClearsData(code: string): boolean {
  return code === 'UNAUTHENTICATED' || code === 'FORBIDDEN';
}
