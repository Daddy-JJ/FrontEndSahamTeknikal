import Link from "next/link";
import { JournalShell } from "@/components/journal-shell";
import { readScanner } from "@/lib/scanner-server";
import { scannerQuery, scannerHref, scanWindow, scanReasonLabels } from "@/lib/scanner-contract";

export async function ScannerDashboard({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = scannerQuery(await searchParams);
  if (!query) return <JournalShell mode={null}><section className="journal-panel">
    <h1>Halaman scanner tidak valid</h1><Link href="/scanner">Buka run terbaru</Link>
  </section></JournalShell>;
  const state = await readScanner(query);
  if (state.kind !== "scan") {
    const heading = state.kind === "preparing" ? "Pemindaian live sedang disiapkan."
      : state.kind === "missing-run" ? "Run tidak ditemukan"
      : state.kind === "read-error" ? "Pembacaan scanner gagal"
      : state.kind === "contract-error" ? "Kontrak scanner belum dapat diverifikasi"
      : state.kind === "forbidden" ? "Akses scanner ditolak" : "Akses scanner belum tersedia";
    return <JournalShell mode={"mode" in state ? state.mode ?? null : null}>
      <section className="journal-panel"><h1>{heading}</h1>
        <p role={state.kind.endsWith("error") ? "alert" : "status"}>
          {state.kind === "preparing" ? "Belum ada run forward yang diterbitkan. Ini bukan hasil no signal; tidak ada data demo sebagai pengganti."
            : state.kind === "unauthenticated" ? "Masuk dengan akun owner untuk membaca hasil scan melalui RLS."
            : state.kind === "forbidden" ? "Akun ini tidak memiliki keanggotaan owner aktif."
            : "Data tidak ditampilkan sampai akses, mode, dan kontrak backend dapat diverifikasi. Kegagalan baca bukan hasil kosong."}
        </p><Link className="primary-button" href="/login">Masuk sebagai owner</Link>
        <Link href="/scanner">Coba baca kembali</Link>
      </section></JournalShell>;
  }
  const { run } = state, window = scanWindow(run, state.checkedAt);
  const rsHeld = run.ranking_status !== "complete";
  return <JournalShell mode={state.mode}>
    <section className="journal-hero"><div><span className="eyebrow">SCANNER / FORWARD / READ-ONLY</span>
      <h1>{run.status === "complete" ? "Hasil scan diterbitkan" : run.status === "partial" ? "Scan parsial" : "Scan gagal"}</h1>
      <p>Hasil dan alasan berasal dari backend. Tidak ada perhitungan sinyal atau transaksi di browser.</p>
    </div><Link href="/scanner">Baca run terbaru →</Link></section>
    <section className="journal-panel">
      <dl className="journal-facts">
        <div><dt>Sesi target run</dt><dd>{run.session_date}</dd></div>
        <div><dt>Coverage dievaluasi / universe</dt><dd>{run.coverage_valid} / {run.coverage_total}</dd></div>
        <div><dt>Run terakhir complete/partial</dt><dd>{state.lastSuccessful?.session_date ?? "Belum ada"}</dd></div>
        <div><dt>Run tersimpan (UTC)</dt><dd>{run.stored_at}</dd></div>
        <div><dt>RS cross-section</dt><dd>{rsHeld ? "RS ditahan: cross-section belum lengkap" : "Lengkap menurut backend"}</dd></div>
        <div><dt>Window entry kalender backend</dt><dd>{window === "elapsed" ? "Berakhir · hasil historis" : window === "open" ? "Belum berakhir" : "Belum tersedia"}</dd></div>
      </dl>
      <p className="journal-help">Tanggal run bukan bukti freshness sesi bursa terkini. Halaman ini tidak menebak kalender bursa dari hari kerja atau gap harga. Window entry bukan harga fill; next-open belum diketahui.</p>
      {window === "elapsed" && <p role="status" className="scanner-notice">Window entry sudah berakhir. Hasil ini tidak dinyatakan sebagai sinyal terkini.</p>}
      {rsHeld && <p role="status" className="scanner-notice">Ranking RS ditahan untuk seluruh cross-section. Strategi lain hanya ditampilkan sesuai evaluasi backend.</p>}
    </section>
    <section className="journal-panel scanner-results">
      <nav className="journal-history-tabs" aria-label="Bagian scanner">
        <Link prefetch={false} aria-current={query.section === "signals" ? "page" : undefined} href={scannerHref(run.id, "signals")}>Sinyal diterbitkan</Link>
        <Link prefetch={false} aria-current={query.section === "quality" ? "page" : undefined} href={scannerHref(run.id, "quality")}>Quality dan alasan skip</Link>
      </nav>
      {query.section === "quality" ? <>
        <h2>Quality dan evaluasi ticker</h2>
        {state.items.map(item => <article className="scanner-row" key={item.ticker}>
          <h3>{item.ticker}</h3><p>{scanReasonLabels[item.status] ?? item.status} <code>{item.status}</code></p>
          {item.candidates.map(c => <p key={c.strategy}><strong>{c.strategy}</strong> · {c.strategy === "RS_BREAKOUT_V1" && rsHeld ? "RS ditahan: cross-section belum lengkap" : scanReasonLabels[c.reason] ?? c.reason}</p>)}
          {item.status !== "evaluated" && <p>Entry baru ditahan. Alasan tersimpan: {item.status}. Rincian tambahan tidak tersedia dalam snapshot run.</p>}
        </article>)}
        {state.items.length === 0 && <p role="status">Tidak ada item pada halaman ini. Coverage run tetap {run.coverage_valid} / {run.coverage_total}.</p>}
      </> : <>
        <h2>Sinyal diterbitkan untuk run ini</h2>
        {state.signals.map(signal => <article className="scanner-row" key={signal.id}>
          <h3>{signal.ticker} · {signal.strategy}</h3>
          <p>{signal.cohort === "late_model_only" ? "LATE / MODEL ONLY · bukan forward entry" : "FORWARD · snapshot backend"}</p>
          <p>Keputusan backend: {scanReasonLabels[signal.candidate.reason] ?? signal.candidate.reason}</p>
          <dl className="journal-facts">
            <div><dt>Reference close · bukan fill</dt><dd>{signal.candidate.reference_close}</dd></div>
            <div><dt>Stop rencana backend</dt><dd>{signal.candidate.stop ?? "Belum tersedia"}</dd></div>
            <div><dt>Sesi entry yang direncanakan</dt><dd>{signal.planned_entry_session}</dd></div>
            <div><dt>Provider / universe / kalender</dt><dd>{signal.provider} / {signal.universe_version} / {signal.calendar_version}</dd></div>
          </dl><p>Harga next-open dan biaya transaksi belum diketahui. Tidak membuat trade actual atau paper.</p>
        </article>)}
        {state.signals.length === 0 && <p role="status">{run.status === "complete" && query.page === 1
          ? "Tidak ada sinyal yang diterbitkan untuk run ini."
          : "Tidak ada sinyal pada halaman ini; status parsial/gagal dan quality hold tetap berlaku."}</p>}
      </>}
      <nav className="journal-pagination" aria-label="Halaman scanner">
        {query.page > 1 && <Link prefetch={false} href={scannerHref(run.id, query.section, query.page - 1)}>← Sebelumnya</Link>}
        <span>Halaman {query.page} · maksimal 25 baris</span>
        {state.hasMore && query.page < 40 && <Link prefetch={false} href={scannerHref(run.id, query.section, query.page + 1)}>Berikutnya →</Link>}
      </nav>
    </section>
    <p className="journal-footnote">Run {run.id} · digest {run.run_digest}. Halaman lanjutan memakai run immutable yang sama.</p>
  </JournalShell>;
}
