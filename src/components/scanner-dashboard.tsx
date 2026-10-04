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
  const { run, section } = state, window = scanWindow(run, state.checkedAt);
  const rsHeld = run.ranking_status !== "complete";
  const storedWib = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta",
    dateStyle: "medium", timeStyle: "medium", hourCycle: "h23" }).format(new Date(run.stored_at));
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
        <div><dt>Snapshot tersimpan (WIB)</dt><dd><time dateTime={run.stored_at}>{storedWib} WIB</time></dd></div>
        <div><dt>Timestamp backend (UTC)</dt><dd>{run.stored_at}</dd></div>
        <div><dt>RS cross-section</dt><dd>{rsHeld ? "RS ditahan: cross-section belum lengkap" : "Lengkap menurut backend"}</dd></div>
        <div><dt>Window entry kalender backend</dt><dd>{window === "elapsed" ? "Berakhir · hasil historis" : window === "open" ? "Belum berakhir" : "Belum tersedia"}</dd></div>
      </dl>
      <p className="journal-help">Tanggal target dan waktu penyimpanan/publikasi snapshot bukan bukti freshness provider. Fetch provider yang gagal kualitas tidak otomatis menjadi snapshot terbaru. Freshness input belum dapat diverifikasi dari metadata run yang tersedia. Halaman ini tidak menebak kalender bursa dari hari kerja atau gap harga. Window entry bukan harga fill; next-open belum diketahui.</p>
      {window === "elapsed" && <p role="status" className="scanner-notice">Window entry sudah berakhir. Hasil ini tidak dinyatakan sebagai sinyal terkini.</p>}
      {rsHeld && <p role="status" className="scanner-notice">Ranking RS ditahan untuk seluruh cross-section. Strategi lain hanya ditampilkan sesuai evaluasi backend.</p>}
      {run.status === "partial" && <p role="status" className="scanner-notice">Evaluasi parsial: {run.coverage_valid} dari {run.coverage_total} ticker dievaluasi; {run.coverage_total - run.coverage_valid} ticker belum lolos evaluasi. Nol sinyal yang diterbitkan bukan kesimpulan lengkap seluruh universe. Alasan hold tersimpan ditampilkan per ticker pada halaman quality.</p>}
      {run.status === "failed" && <p role="alert" className="scanner-notice">Run gagal: tidak ada ticker yang lolos evaluasi kualitas. Entry ditahan; ini bukan hasil tidak ada sinyal. Baca status hold setiap ticker di bagian quality.</p>}
    </section>
    <section className="journal-panel scanner-results">
      <nav className="journal-history-tabs" aria-label="Bagian scanner">
        <Link prefetch={false} aria-current={section === "signals" ? "page" : undefined} href={scannerHref(run.id, "signals")}>Sinyal diterbitkan</Link>
        <Link prefetch={false} aria-current={section === "quality" ? "page" : undefined} href={scannerHref(run.id, "quality")}>Quality dan alasan skip</Link>
      </nav>
      {section === "quality" ? <>
        <div className="journal-toolbar">
          <div>
            <span className="eyebrow">MATRIKS KUALITAS &amp; STRATEGI</span>
            <h2>Evaluasi Konstituen Universe</h2>
          </div>
          <span className="muted small">Coverage {run.coverage_valid} / {run.coverage_total}</span>
        </div>
        <div className="table-scroll">
          <table className="dense-table">
            <thead>
              <tr>
                <th className="text-left">Ticker</th>
                <th className="text-left">Status Data</th>
                <th className="text-right">Ref Close</th>
                <th className="text-center">MACD+EMA200</th>
                <th className="text-center">Fractal BO</th>
                <th className="text-center">RS Breakout</th>
                <th className="text-center">Pullback Rec</th>
                <th className="text-left">Diagnosa</th>
              </tr>
            </thead>
            <tbody>
              {state.items.map(item => {
                const macd = item.candidates.find(c => c.strategy === "MACD_EMA200_V1");
                const fractal = item.candidates.find(c => c.strategy === "FRACTAL_BREAKOUT_V1");
                const rs = item.candidates.find(c => c.strategy === "RS_BREAKOUT_V1");
                const pullback = item.candidates.find(c => c.strategy === "PULLBACK_RECLAIM_V1");
                const refClose = item.candidates[0]?.reference_close;
                const isEval = item.status === "evaluated";

                const renderCell = (c: typeof macd, isRs = false) => {
                  if (!isEval) return <span style={{ color: "var(--muted)" }}>—</span>;
                  if (isRs && rsHeld) return <span className="subtle-badge amber">RS Hold</span>;
                  if (!c) return <span style={{ color: "var(--muted)" }}>—</span>;
                  if (c.triggered) return <span className="subtle-badge emerald font-bold">✓ Triggered</span>;
                  return <span style={{ color: "var(--muted)" }}>—</span>;
                };

                return (
                  <tr key={item.ticker}>
                    <td className="text-left font-bold">{item.ticker}</td>
                    <td className="text-left">
                      <span className={"subtle-badge " + (isEval ? "emerald" : "amber")}>
                        {scanReasonLabels[item.status] ?? item.status}
                      </span>
                    </td>
                    <td className="text-right mono">
                      {refClose ? `Rp${new Intl.NumberFormat("id-ID").format(refClose)}` : "—"}
                    </td>
                    <td className="text-center">{renderCell(macd)}</td>
                    <td className="text-center">{renderCell(fractal)}</td>
                    <td className="text-center">{renderCell(rs, true)}</td>
                    <td className="text-center">{renderCell(pullback)}</td>
                    <td className="text-left" style={{ fontSize: "11px", color: "var(--muted)" }}>
                      {isEval
                        ? (rs && rs.reason === "cross_section_incomplete" ? "RS ditahan: cross-section incomplete" : "Evaluasi lengkap; kriteria teknikal aktif")
                        : `Ditahan: ${scanReasonLabels[item.status] ?? item.status}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {state.items.length === 0 && <p role="status">Tidak ada item pada halaman ini. Coverage run tetap {run.coverage_valid} / {run.coverage_total}.</p>}
      </> : <>
        <div className="journal-toolbar">
          <div>
            <span className="eyebrow">FORWARD SIGNALS</span>
            <h2>Sinyal Diterbitkan</h2>
          </div>
          <span className="muted small">{state.signals.length} sinyal pada halaman ini</span>
        </div>
        {state.signals.length > 0 ? (
          <div className="table-scroll">
            <table className="dense-table">
              <thead>
                <tr>
                  <th className="text-left">Ticker</th>
                  <th className="text-left">Strategi</th>
                  <th className="text-right">Ref Close</th>
                  <th className="text-right">Plan Stop</th>
                  <th className="text-right">Risk Buffer (ΔR)</th>
                  <th className="text-left">Target Entry</th>
                  <th className="text-center">Cohort</th>
                  <th className="text-left">Keputusan</th>
                </tr>
              </thead>
              <tbody>
                {state.signals.map(signal => {
                  const refClose = signal.candidate.reference_close;
                  const stop = signal.candidate.stop;
                  const riskIdr = stop ? refClose - stop : null;
                  const riskPct = stop && refClose > 0 ? ((refClose - stop) / refClose) * 100 : null;
                  return (
                    <tr key={signal.id}>
                      <td className="text-left font-bold" style={{ fontSize: "14px" }}>{signal.ticker}</td>
                      <td className="text-left">
                        <span className="subtle-badge purple">{signal.strategy}</span>
                      </td>
                      <td className="text-right mono font-bold">
                        Rp{new Intl.NumberFormat("id-ID").format(refClose)}
                      </td>
                      <td className="text-right mono" style={{ color: "var(--red)" }}>
                        {stop ? `Rp${new Intl.NumberFormat("id-ID").format(stop)}` : "—"}
                      </td>
                      <td className="text-right mono">
                        {riskIdr !== null && riskPct !== null ? (
                          <span style={{ color: "var(--red)" }}>
                            -Rp{new Intl.NumberFormat("id-ID").format(riskIdr)} (-{riskPct.toFixed(1)}%)
                          </span>
                        ) : "—"}
                      </td>
                      <td className="text-left">
                        <span className="mono" style={{ fontSize: "11px" }}>{signal.planned_entry_session}</span>
                        <small style={{ display: "block", color: "var(--muted)" }}>Next-Open</small>
                      </td>
                      <td className="text-center">
                        <span className={"subtle-badge " + (signal.cohort === "forward" ? "emerald" : "gray")}>
                          {signal.cohort === "forward" ? "FORWARD" : "LATE"}
                        </span>
                      </td>
                      <td className="text-left" style={{ fontSize: "11px", color: "var(--muted)" }}>
                        {scanReasonLabels[signal.candidate.reason] ?? signal.candidate.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="journal-empty" style={{ padding: "40px 20px" }}>
            <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>
              {run.status === "complete"
                ? `Tidak Ada Sinyal Baru untuk Sesi ${run.session_date}`
                : run.status === "failed"
                ? "Publikasi sinyal ditahan: run gagal dan quality hold tetap berlaku."
                : "Evaluasi parsial: beberapa saham belum lolos evaluasi kualitas."}
            </h3>
            <p style={{ maxWidth: "560px", margin: "0 auto 16px" }}>
              {run.status === "complete"
                ? `Seluruh ${run.coverage_valid} saham universe telah dievaluasi lengkap oleh engine deterministik. Tidak ada emiten yang memenuhi seluruh kriteria entry setup malam ini. Disiplin trading: nol sinyal adalah hasil valid yang melindungi modal.`
                : "Periksa status hold setiap ticker pada tab 'Quality dan alasan skip'."}
            </p>
            <Link
              href={scannerHref(run.id, "quality")}
              style={{
                display: "inline-block",
                padding: "8px 16px",
                borderRadius: "8px",
                background: "var(--green)",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Lihat Matriks Evaluasi Konstituen →
            </Link>
          </div>
        )}
      </>}
      <nav className="journal-pagination" aria-label="Halaman scanner">
        {query.page > 1 && <Link prefetch={false} href={scannerHref(run.id, section, query.page - 1)}>← Sebelumnya</Link>}
        <span>Halaman {query.page} · maksimal 25 baris</span>
        {state.hasMore && query.page < 40 && <Link prefetch={false} href={scannerHref(run.id, section, query.page + 1)}>Berikutnya →</Link>}
      </nav>
    </section>
    <p className="journal-footnote">Run {run.id} · digest {run.run_digest}. Halaman lanjutan memakai run immutable yang sama.</p>
  </JournalShell>;
}
