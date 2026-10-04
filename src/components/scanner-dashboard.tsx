import Link from "next/link";
import { JournalShell } from "@/components/journal-shell";
import { readScanner } from "@/lib/scanner-server";
import { scannerQuery, scannerHref, scanWindow, scanReasonLabels, scannerStrategies } from "@/lib/scanner-contract";

export async function ScannerDashboard({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = scannerQuery(await searchParams);
  if (!query) return (
    <JournalShell mode={null}>
      <section className="journal-panel">
        <span className="eyebrow">SCANNER</span>
        <h1>Halaman scanner tidak valid</h1>
        <p style={{ marginTop: "8px" }}>Parameter kueri atau nomor halaman tidak valid.</p>
        <div className="journal-actions">
          <Link className="primary-button" href="/scanner">Buka run terbaru</Link>
        </div>
      </section>
    </JournalShell>
  );

  const state = await readScanner(query);
  if (state.kind !== "scan") {
    const heading = state.kind === "preparing" ? "Pemindaian live sedang disiapkan."
      : state.kind === "missing-run" ? "Run tidak ditemukan"
      : state.kind === "read-error" ? "Pembacaan scanner gagal"
      : state.kind === "contract-error" ? "Kontrak scanner belum dapat diverifikasi"
      : state.kind === "forbidden" ? "Akses scanner ditolak" : "Akses scanner belum tersedia";
    return (
      <JournalShell mode={"mode" in state ? state.mode ?? null : null}>
        <section className="journal-panel">
          <span className="eyebrow">OTENTIKASI &amp; AKSES</span>
          <h1>{heading}</h1>
          <p role={state.kind.endsWith("error") ? "alert" : "status"} style={{ maxWidth: "680px", marginTop: "8px" }}>
            {state.kind === "preparing" ? "Belum ada run forward yang diterbitkan. Ini bukan hasil no signal; tidak ada data demo sebagai pengganti."
              : state.kind === "unauthenticated" ? "Masuk dengan akun owner untuk membaca hasil scan melalui RLS."
              : state.kind === "forbidden" ? "Akun ini tidak memiliki keanggotaan owner aktif."
              : "Data tidak ditampilkan sampai akses, mode, dan kontrak backend dapat diverifikasi. Kegagalan baca bukan hasil kosong."}
          </p>
          <div className="journal-actions">
            <Link className="primary-button" href="/login">Masuk sebagai owner</Link>
            <Link className="secondary-link" href="/scanner">Coba baca kembali</Link>
          </div>
        </section>
      </JournalShell>
    );
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
      <form method="get" action="/scanner" className="journal-form" aria-label="Filter scanner">
        <input type="hidden" name="section" value={section} />
        <label>Sesi target<input name="date" type="date" defaultValue={query.date ?? ""} /></label>
        <label>Strategi sinyal<select name="strategy" defaultValue={query.strategy ?? ""}>
          <option value="">Semua strategi</option>
          {scannerStrategies.map(strategy => <option key={strategy} value={strategy}>{strategy}</option>)}
        </select></label>
        <button className="primary-button" type="submit">Terapkan filter</button>
      </form>
      <p className="journal-help">Tanggal memilih run terbaru pada sesi tersebut. Filter strategi hanya membatasi sinyal diterbitkan; matriks quality tetap menunjukkan universe run.</p>
      <nav className="journal-history-tabs" aria-label="Bagian scanner">
        <Link prefetch={false} aria-current={section === "signals" ? "page" : undefined} href={scannerHref(run.id, "signals", 1, query)}>Sinyal diterbitkan</Link>
        <Link prefetch={false} aria-current={section === "quality" ? "page" : undefined} href={scannerHref(run.id, "quality", 1, query)}>Quality dan alasan skip</Link>
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
          <table className="dense-table" aria-label="Quality dan evaluasi ticker">
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
                  <tr key={item.ticker} data-status={item.status}>
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
                      {isEval ? item.candidates.map(c => <div key={c.strategy}>{c.strategy}: {scanReasonLabels[c.reason] ?? c.reason}</div>)
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
            <table className="dense-table" aria-label="Sinyal diterbitkan">
              <thead>
                <tr>
                  <th className="text-left">Ticker</th>
                  <th className="text-left">Strategi</th>
                  <th className="text-right">Reference close · bukan fill</th>
                  <th className="text-right">Plan Stop</th>
                  <th className="text-left">Target Entry</th>
                  <th className="text-center">Cohort</th>
                  <th className="text-left">Keputusan</th>
                </tr>
              </thead>
              <tbody>
                {state.signals.map(signal => {
                  const refClose = signal.candidate.reference_close;
                  const stop = signal.candidate.stop;
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
                        {stop !== null ? `Rp${new Intl.NumberFormat("id-ID").format(stop)}` : "Belum tersedia"}
                      </td>
                      <td className="text-left">
                        <span className="mono" style={{ fontSize: "11px" }}>{signal.planned_entry_session}</span>
                        <small style={{ display: "block", color: "var(--muted)" }}>Harga next-open dan biaya transaksi belum diketahui.</small>
                      </td>
                      <td className="text-center">
                        <span className={"subtle-badge " + (signal.cohort === "forward" ? "emerald" : "gray")}>
                          {signal.cohort === "forward" ? "FORWARD" : "LATE / MODEL ONLY"}
                        </span>
                        {signal.cohort === "late_model_only" && <small style={{ display: "block" }}>Bukan entry forward yang dapat dieksekusi.</small>}
                      </td>
                      <td className="text-left" style={{ fontSize: "11px", color: "var(--muted)" }}>
                        {scanReasonLabels[signal.candidate.reason] ?? signal.candidate.reason}
                        <details style={{ whiteSpace: "normal", maxWidth: "24rem" }}>
                          <summary>Detail {signal.ticker}</summary>
                          <dl style={{ maxWidth: "24rem", overflowWrap: "anywhere" }}>
                            <dt>Tanggal sinyal</dt><dd>{signal.session_date}</dd>
                            <dt>Pivot date</dt><dd>{signal.candidate.pivot_date ?? "Tidak tersedia pada snapshot"}</dd>
                            <dt>Available-at session</dt><dd>{signal.candidate.available_session ?? "Tidak tersedia pada snapshot"}</dd>
                            <dt>Level backend</dt><dd>{signal.candidate.level ?? "Tidak tersedia pada snapshot"}</dd>
                            <dt>Dipublikasikan (UTC)</dt><dd><time dateTime={signal.published_at}>{signal.published_at}</time></dd>
                            <dt>Provider / versi</dt><dd>{signal.provider} / {signal.provider_version ?? "Tidak tersedia"}</dd>
                            <dt>Price basis</dt><dd>{signal.price_basis ?? "Tidak tersedia"}</dd>
                            <dt>Universe / kalender</dt><dd>{signal.universe_version} / {signal.calendar_version}</dd>
                            <dt>Engine / source revision</dt><dd>{signal.engine_version ?? "Tidak tersedia"} / {signal.source_revision ?? "Tidak tersedia"}</dd>
                            <dt>Config hash</dt><dd>{signal.config_hash ?? "Tidak tersedia"}</dd>
                            <dt>Input digest</dt><dd>{signal.input_digest ?? "Tidak tersedia"}</dd>
                          </dl>
                          <p>Pivot date berbeda dari waktu informasi tersedia. Metadata publikasi bukan bukti freshness input.</p>
                          {signal.candidate.rules?.length ? <ul aria-label="Rule checklist backend">
                            {signal.candidate.rules.map((rule, index) => <li key={`${rule.name}-${index}`}>{rule.passed ? "✓" : "✗"} {rule.name}</li>)}
                          </ul> : <p>Rule checklist tidak tersedia pada snapshot.</p>}
                          {signal.cohort === "forward" && <>
                            <Link prefetch={false} href={`/journal?signal_id=${signal.id}`}>Buat draft aktual</Link>
                            <p>Draft membutuhkan konfirmasi owner; tidak membuat fill atau order broker. Reference close bukan harga transaksi.</p>
                          </>}
                        </details>
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
              {query.page > 1 ? "Tidak ada sinyal pada halaman lanjutan ini."
                : run.status === "complete"
                ? query.strategy ? "Tidak ada sinyal yang diterbitkan untuk strategi ini pada run terpilih." : "Tidak ada sinyal yang diterbitkan untuk run ini."
                : run.status === "failed"
                ? "Publikasi sinyal ditahan: run gagal dan quality hold tetap berlaku."
                : "Nol sinyal diterbitkan; ini bukan hasil lengkap seluruh universe."}
            </h3>
            <p style={{ maxWidth: "560px", margin: "0 auto 16px" }}>
              {query.page > 1 ? "Halaman kosong tidak mengubah hasil run atau menyimpulkan bahwa seluruh run tidak memiliki setup. Gunakan halaman sebelumnya untuk membaca sinyal yang telah diterbitkan."
                : run.status === "complete"
                ? `Coverage evaluasi ${run.coverage_valid} / ${run.coverage_total}. Nol sinyal dipublikasikan tidak membuktikan bahwa tidak ada kandidat triggered; keputusan dan alasan tetap berasal dari backend.`
                : "Periksa status hold setiap ticker pada tab 'Quality dan alasan skip'."}
            </p>
            <Link
              prefetch={false}
              href={scannerHref(run.id, "quality", 1, query)}
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
        {query.page > 1 && <Link prefetch={false} href={scannerHref(run.id, section, query.page - 1, query)}>← Sebelumnya</Link>}
        <span>Halaman {query.page} · maksimal 25 baris</span>
        {state.hasMore && query.page < 40 && <Link prefetch={false} href={scannerHref(run.id, section, query.page + 1, query)}>Berikutnya →</Link>}
      </nav>
    </section>
    <p className="journal-footnote">Run {run.id} · digest {run.run_digest}. Halaman lanjutan memakai run immutable yang sama.</p>
  </JournalShell>;
}
