import type { ProcessingHealth } from "@/lib/trade-reporting";

export function ProcessingHealthNotice({ health, unavailable = false }: {
  health?: ProcessingHealth | null; unavailable?: boolean;
}) {
  if (!health) return <section className="journal-panel" role="status">
    <h2>{unavailable ? "Status pemrosesan belum dapat dibaca" : "Status pemrosesan backend belum tersedia"}</h2>
    <p>Coverage menunjukkan kelengkapan sampel, bukan bukti bahwa jurnal telah memproses sesi terbaru. Kapabilitas kesehatan pemrosesan diperlukan untuk memastikan jadwal dan checkpoint.</p>
  </section>;
  const labels = { ready: "Pemrosesan sesuai checkpoint", overdue: "Pemrosesan terlambat", missing: "Checkpoint belum tersedia",
    calendar_unknown: "Kalender pemrosesan belum terverifikasi", failed: "Pemrosesan gagal", running: "Pemrosesan sedang berjalan", data_hold: "Pemrosesan tertahan oleh data" };
  return <section className="journal-panel" data-processing-health={health.status} role={health.overdue || health.status === "failed" ? "alert" : "status"}>
    <h2>{labels[health.status]}</h2>
    <p>Rencana paper dicatat dari sinyal, kemudian fill simulasi dan evaluasi OHLC diproses oleh job EOD. Tampilan tidak menjalankan entry saat halaman dibuka.</p>
    <dl className="journal-facts">
      <div><dt>Sesi yang perlu diproses</dt><dd>{health.expected_session ?? "Belum diketahui"}</dd></div>
      <div><dt>Checkpoint jurnal</dt><dd>{health.processed_session ?? "Belum tersedia"}</dd></div>
      {health.next_eligible_processing_at !== undefined && <div><dt>Evaluasi berikutnya tersedia setelah close</dt><dd>{health.next_eligible_processing_at ? new Date(health.next_eligible_processing_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB" : "Kalender belum menyediakan sesi berikutnya"}</dd></div>}
      <div><dt>Rencana entry jatuh tempo</dt><dd>{health.pending_entry_due}</dd></div>
      <div><dt>Data tertahan</dt><dd>{health.data_hold_count}{health.held_since_session ? " · sejak " + health.held_since_session : ""}</dd></div>
      <div><dt>Status job terakhir</dt><dd>{health.latest_job_status ?? "Belum tersedia"}{health.latest_job_phase ? " · " + health.latest_job_phase : ""}</dd></div>
      {health.failure_code && <div><dt>Alasan kegagalan</dt><dd>{health.failure_code}</dd></div>}
    </dl>
    <p className="panel-note">{health.overdue ? "Job belum menyelesaikan sesi yang diwajibkan kalender backend. Rencana belum dipindahkan menjadi hasil yang dinilai." : "Tanggal dan status berasal dari kalender serta checkpoint backend."} Diperiksa {new Date(health.checked_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB.</p>
  </section>;
}
