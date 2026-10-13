import type { ProcessingHealth } from "@/lib/trade-reporting";

const failureLabels: Record<string, string> = {
  zero_usable_coverage: "Tidak ada ticker dengan OHLC valid pada sesi target",
  provider_missing_bar: "Candle sesi yang diperlukan belum tersedia",
  unresolved_paper_data: "Masih ada posisi atau observasi dengan data tertahan",
  paper_data_hold: "Data untuk pemrosesan paper belum lengkap",
  heartbeat_stalled: "Heartbeat pemrosesan berhenti; pemulihan masih diperlukan",
};
const wib = (value: string) => new Date(value).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB";

export function ProcessingHealthNotice({ health, unavailable = false }: {
  health?: ProcessingHealth | null; unavailable?: boolean;
}) {
  if (!health) return <section className="journal-panel" role="status">
    <h2>{unavailable ? "Status pemrosesan belum dapat dibaca" : "Status pemrosesan backend belum tersedia"}</h2>
    <p>Coverage menunjukkan kelengkapan sampel, bukan bukti bahwa jurnal telah memproses sesi terbaru. Kapabilitas kesehatan pemrosesan diperlukan untuk memastikan jadwal dan checkpoint.</p>
  </section>;
  const labels = { ready: "Pemrosesan sesuai kalender", overdue: "Pemrosesan terlambat", missing: "State jurnal belum tersedia",
    calendar_unknown: "Kalender pemrosesan belum terverifikasi", failed: "Pemrosesan gagal", running: "Pemrosesan sedang berjalan", data_hold: "Pemrosesan tertahan oleh data" };
  return <section className="journal-panel" data-processing-health={health.status} role={health.overdue || health.status === "failed" ? "alert" : "status"}>
    <h2>{labels[health.status]}</h2>
    <p>Rencana paper dicatat dari sinyal, kemudian fill simulasi dan evaluasi OHLC diproses oleh job EOD. Tampilan tidak menjalankan entry saat halaman dibuka.</p>
    <p className="panel-note">Status pemrosesan mencakup seluruh strategi, kedua eksperimen exit, dan observasi sinyal. Filter tabel tidak membatasi jumlah di panel ini.</p>
    <dl className="journal-facts">
      <div><dt>Sesi closed yang wajib diproses</dt><dd>{health.expected_session ?? "Belum diketahui"}</dd></div>
      <div><dt>Sesi state terakhir tersimpan · bukan bukti seluruh data selesai</dt><dd>{health.attempt_session ?? health.processed_session ?? "Belum tersedia"}</dd></div>
      <div><dt>Sesi terakhir seluruh objek selesai</dt><dd>{health.last_fully_resolved_session === undefined ? "Belum tersedia dari backend" : health.last_fully_resolved_session ?? "Belum ada sesi selesai yang terverifikasi"}</dd></div>
      <div><dt>Sesi paling awal yang masih memerlukan data</dt><dd>{health.earliest_unresolved_session === undefined ? health.held_since_session ?? "Belum tersedia dari backend" : health.earliest_unresolved_session ?? "Tidak ada sesi tertahan yang dilaporkan"}</dd></div>
      {health.next_eligible_processing_at !== undefined && <div><dt>Waktu close untuk data yang diperlukan · bukan jadwal job</dt><dd>{health.next_eligible_processing_at ? wib(health.next_eligible_processing_at) : "Kalender belum menyediakan waktu close"}</dd></div>}
      <div><dt>Rencana entry jatuh tempo</dt><dd>{health.pending_entry_due}</dd></div>
      <div><dt>Total objek dengan data tertahan</dt><dd>{health.data_hold_count}{health.held_since_session ? " · sejak " + health.held_since_session : ""}</dd></div>
      {health.scope && <>
        <div><dt>Trade dengan data tertahan</dt><dd>{health.trade_data_hold_count}</dd></div>
        <div><dt>Trade sudah entry, evaluasi tertahan</dt><dd>{health.filled_trade_data_hold_count}</dd></div>
        <div><dt>Trade belum entry, data tertahan</dt><dd>{health.unfilled_trade_data_hold_count}</dd></div>
        <div><dt>Observasi sinyal dengan data tertahan</dt><dd>{health.evaluation_data_hold_count}</dd></div>
      </>}
      <div><dt>Status job terakhir</dt><dd>{health.latest_job_status ?? "Belum tersedia"}{health.latest_job_phase ? " · " + health.latest_job_phase : ""}</dd></div>
      {health.latest_scanner_status !== undefined && <div><dt>Tahap scanner · job yang sama</dt><dd>{health.latest_scanner_status ?? "Belum dicatat"}</dd></div>}
      {health.latest_publication_status !== undefined && <div><dt>Tahap publikasi · job yang sama</dt><dd>{health.latest_publication_status ?? "Belum dicatat"}</dd></div>}
      {health.latest_paper_status !== undefined && <div><dt>Tahap paper · job yang sama</dt><dd>{health.latest_paper_status ?? "Belum dicatat"}</dd></div>}
      {health.latest_job_run_id && <div><dt>GitHub run · job terakhir</dt><dd>{health.latest_job_run_id}</dd></div>}
      {health.latest_job_source_sha && <div><dt>Source SHA · job terakhir</dt><dd>{health.latest_job_source_sha}</dd></div>}
      {health.last_attempt_at && <div><dt>Pencatatan status job terakhir</dt><dd>{wib(health.last_attempt_at)}</dd></div>}
      {health.runtime_heartbeat_at && <div><dt>Heartbeat runtime terakhir</dt><dd>{wib(health.runtime_heartbeat_at)}</dd></div>}
      {health.runtime_stalled && <div><dt>Kendala operasional</dt><dd>{failureLabels.heartbeat_stalled}<small>heartbeat_stalled · status job tetap sesuai event tersimpan</small></dd></div>}
      {health.failure_code && <div><dt>Alasan kegagalan</dt><dd>{failureLabels[health.failure_code] ?? health.failure_code}<small>{failureLabels[health.failure_code] && health.failure_code}</small></dd></div>}
    </dl>
    {health.watchdog && <details><summary>Pemantauan cloud</summary><dl className="journal-facts">
      <div><dt>Watchdog</dt><dd>{health.watchdog.enabled ? "Aktif" : "Nonaktif"}</dd></div>
      <div><dt>Pemeriksaan terakhir</dt><dd>{health.watchdog.last_checked_at ? wib(health.watchdog.last_checked_at) : "Belum tersedia"}</dd></div>
      <div><dt>Dispatch terakhir</dt><dd>{health.watchdog.last_dispatch_at ? wib(health.watchdog.last_dispatch_at) : "Belum ada"}</dd></div>
      <div><dt>Status dispatch</dt><dd>{health.watchdog.last_dispatch_status ?? "Belum ada"}</dd></div>
    </dl></details>}
    <p className="panel-note">{health.runtime_stalled ? "Runtime terakhir belum mencatat penyelesaian dan heartbeat telah kedaluwarsa. Sesi ekonomi yang selesai tetap dipertahankan; pemantauan operasional belum pulih." : health.overdue ? "Masih ada sesi wajib atau objek yang belum selesai. State tersimpan tidak berarti data tertahan sudah pulih; hasil yang belum tersedia tetap di luar statistik utama." : "Tanggal dan status berasal dari kalender serta state backend."} Diperiksa {wib(health.checked_at)}.</p>
  </section>;
}
