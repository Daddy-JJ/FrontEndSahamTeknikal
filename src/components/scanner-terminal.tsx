"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  scannerHref, scannerStrategies, scanReasonLabels,
  type ScanRun, type ScanItem, type PublishedSignal, type ScanCandidate, type ScannerQuery,
} from "@/lib/scanner-contract";

type Selection = { kind: "quality"; item: ScanItem } | { kind: "signal"; signal: PublishedSignal };
type Props = {
  run: ScanRun; query: ScannerQuery; section: "quality" | "signals";
  items: ScanItem[]; signals: PublishedSignal[]; hasMore: boolean;
  entryWindow: "open" | "elapsed" | "unknown"; lastSuccessful: string | null;
};
const label = (reason: string) => scanReasonLabels[reason] ?? reason;
const price = (value: number | null | undefined) => value == null ? "Belum tersedia" : "Rp" + new Intl.NumberFormat("id-ID").format(value);
const strategyLabels: Record<string, string> = {
  MACD_EMA200_V1: "MACD + EMA200", FRACTAL_BREAKOUT_V1: "Fractal BO",
  RS_BREAKOUT_V1: "RS Breakout", PULLBACK_RECLAIM_V1: "Pullback Rec",
};

function Rules({ candidate, named = false }: { candidate: ScanCandidate; named?: boolean }) {
  return candidate.rules?.length ? <ul className="terminal-rules" aria-label={named ? "Rule checklist backend " + candidate.strategy : "Rule checklist backend"}>
    {candidate.rules.map((rule, index) => <li key={rule.name + index} data-passed={rule.passed}>
      <span>{rule.passed ? "Lulus" : "Gagal"}</span> {rule.name}
    </li>)}
  </ul> : <p className="terminal-muted">Rule checklist tidak tersedia pada snapshot.</p>;
}
function CandidateDetail({ candidate, named = false }: { candidate: ScanCandidate; named?: boolean }) {
  return <section className="terminal-candidate">
    <h3>{candidate.strategy}</h3>
    <p className={candidate.triggered ? "terminal-positive" : "terminal-muted"}>{candidate.triggered ? "Triggered" : "Tidak terpicu"} · {label(candidate.reason)}</p>
    <dl className="terminal-audit">
      <dt>Reference close · bukan fill</dt><dd>{price(candidate.reference_close)}</dd>
      <dt>Plan Stop</dt><dd>{price(candidate.stop)}</dd>
      <dt>Level backend</dt><dd>{candidate.level ?? "Tidak tersedia pada snapshot"}</dd>
      <dt>Pivot date</dt><dd>{candidate.pivot_date ?? "Tidak tersedia pada snapshot"}</dd>
      <dt>Available-at session</dt><dd>{candidate.available_session ?? "Tidak tersedia pada snapshot"}</dd>
    </dl>
    <Rules candidate={candidate} named={named} />
  </section>;
}
function Detail({ selection, run }: { selection: Selection; run: ScanRun }) {
  if (selection.kind === "quality") return <>
    <p className="terminal-muted">Status data: {label(selection.item.status)}</p>
    {selection.item.candidates.length ? selection.item.candidates.map(candidate =>
      <CandidateDetail key={candidate.strategy} candidate={candidate} named />
    ) : <p className="terminal-hold">Ditahan: {label(selection.item.status)}. Evaluasi strategi tidak tersedia pada snapshot.</p>}
    <details className="terminal-source-audit"><summary>Audit snapshot</summary><dl className="terminal-audit"><dt>Sesi target run</dt><dd>{run.session_date}</dd><dt>Run</dt><dd>{run.id}</dd><dt>Run digest</dt><dd>{run.run_digest}</dd></dl>
    <p className="terminal-muted">Alasan dan aturan adalah snapshot backend. Tidak ada indikator yang dihitung ulang di browser.</p></details>
  </>;
  const signal = selection.signal;
  return <>
    <p className={signal.cohort === "forward" ? "terminal-positive" : "terminal-hold"}>{signal.cohort === "forward" ? "FORWARD" : "LATE / MODEL ONLY"}</p>
    {signal.cohort === "late_model_only" && <p>Bukan entry forward yang dapat dieksekusi.</p>}
    <CandidateDetail candidate={signal.candidate} />
    <dl className="terminal-audit">
      <dt>Tanggal sinyal</dt><dd>{signal.session_date}</dd>
      <dt>Target Entry</dt><dd>{signal.planned_entry_session}</dd>
      <dt>Dipublikasikan (UTC)</dt><dd><time dateTime={signal.published_at}>{signal.published_at}</time></dd>
      <dt>Provider / versi</dt><dd>{signal.provider} / {signal.provider_version ?? "Tidak tersedia"}</dd>
      <dt>Price basis</dt><dd>{signal.price_basis ?? "Tidak tersedia"}</dd>
      <dt>Universe / kalender</dt><dd>{signal.universe_version} / {signal.calendar_version}</dd>
      <dt>Engine / source revision</dt><dd>{signal.engine_version ?? "Tidak tersedia"} / {signal.source_revision ?? "Tidak tersedia"}</dd>
      <dt>Config hash</dt><dd>{signal.config_hash ?? "Tidak tersedia"}</dd>
      <dt>Input digest</dt><dd>{signal.input_digest ?? "Tidak tersedia"}</dd>
    </dl>
    <p className="terminal-muted">Pivot date berbeda dari waktu informasi tersedia. Metadata publikasi bukan bukti freshness input.</p>
    {signal.cohort === "forward" && <>
      <Link prefetch={false} className="terminal-action" href={"/journal?signal_id=" + signal.id}>Buat draft aktual</Link>
      <p className="terminal-muted">Draft membutuhkan konfirmasi owner; tidak membuat fill atau order broker. Reference close bukan harga transaksi aktual.</p>
    </>}
  </>;
}
export function ScannerTerminal({ run, query, section, items, signals, hasMore, entryWindow, lastSuccessful }: Props) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [drawer, setDrawer] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const rsHeld = run.ranking_status !== "complete";
  const storedWib = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "medium", hourCycle: "h23" }).format(new Date(run.stored_at));
  const close = () => { dialog.current?.close(); setSelection(null); opener.current?.focus(); };
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    const change = () => setDrawer(!media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (!selection) { dialog.current?.close(); return; }
    if (drawer) dialog.current?.showModal();
    else { dialog.current?.close(); detailHeading.current?.focus(); }
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !drawer) { setSelection(null); opener.current?.focus(); }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [selection, drawer]);
  const select = (value: Selection, button: HTMLButtonElement) => {
    opener.current = button;
    setDrawer(!window.matchMedia("(min-width: 1280px)").matches);
    setSelection(value);
  };
  const ticker = selection?.kind === "quality" ? selection.item.ticker : selection?.signal.ticker;
  const selectedKey = selection?.kind === "quality" ? selection.item.ticker : selection?.signal.id;
  const cell = (item: ScanItem, strategy: string) => {
    const candidate = item.candidates.find(value => value.strategy === strategy);
    const held = item.status !== "evaluated";
    const rs = strategy === "RS_BREAKOUT_V1" && rsHeld;
    return <span className={"terminal-cell-state " + (held || rs ? "hold" : candidate?.triggered ? "trigger" : "quiet")}>
      {held ? "Data hold" : rs ? "RS Hold" : !candidate ? "N/A" : candidate.triggered ? "✓ Triggered" : candidate.reason === "insufficient_history" ? "History hold" : "Tidak terpicu"}
    </span>;
  };
  const detailContent = selection && <>
    <div className="terminal-detail-heading">
      <div><span className="terminal-kicker">SNAPSHOT BACKEND</span><h2 ref={drawer ? undefined : detailHeading} tabIndex={-1} id={drawer ? "scanner-drawer-title" : "scanner-pane-title"}>Detail {ticker}</h2></div>
      <button type="button" onClick={close} aria-label={"Tutup detail " + ticker}>Tutup <span aria-hidden="true">×</span></button>
    </div>
    <Detail selection={selection} run={run} />
  </>;
  return <div className="scanner-terminal">
    <section className="terminal-run" aria-label="Ringkasan run">
      <div className="terminal-run-line">
        <span className="terminal-kicker">SCANNER / EOD</span>
        <h1>{run.status === "complete" ? "Hasil scan diterbitkan" : run.status === "partial" ? "Scan parsial" : "Scan gagal"}</h1>
        <span className={"terminal-tag " + (run.status === "complete" ? "good" : "warn")}>{run.status.toUpperCase()}</span>
        <span>Sesi <strong className="terminal-mono">{run.session_date}</strong></span>
        <span>Coverage <strong className="terminal-mono">{run.coverage_valid} / {run.coverage_total}</strong></span>
        <span className={rsHeld ? "terminal-hold" : "terminal-positive"}>RS {rsHeld ? "ditahan" : "lengkap"}</span>
        <Link href="/scanner" prefetch={false}>Run terbaru ↗</Link>
      </div>
      <div className="terminal-run-line terminal-muted">
        <span>Snapshot <time dateTime={run.stored_at}>{storedWib} WIB</time></span>
        <span>Window entry: {entryWindow === "elapsed" ? "berakhir · historis" : entryWindow === "open" ? "belum berakhir" : "belum tersedia"}</span>
        <details className="terminal-run-detail"><summary>Detail run &amp; sumber</summary>
          <div className="terminal-run-audit">
            <dl className="terminal-audit">
              <dt>Sesi target run</dt><dd>{run.session_date}</dd>
              <dt>Run terakhir complete/partial</dt><dd>{lastSuccessful ?? "Belum ada"}</dd>
              <dt>Snapshot tersimpan (WIB)</dt><dd>{storedWib} WIB</dd>
              <dt>Timestamp backend (UTC)</dt><dd>{run.stored_at}</dd>
              <dt>RS cross-section</dt><dd>{rsHeld ? "RS ditahan: cross-section belum lengkap" : "Lengkap menurut backend"}</dd>
              <dt>Run</dt><dd>{run.id}</dd><dt>Run digest</dt><dd>{run.run_digest}</dd>
            </dl>
            <p>Tanggal target dan waktu penyimpanan/publikasi snapshot bukan bukti freshness provider. Fetch provider yang gagal kualitas tidak otomatis menjadi snapshot terbaru. Freshness input belum dapat diverifikasi dari metadata run yang tersedia.</p>
            <p>Kalender dan window entry berasal dari backend, bukan tebakan hari kerja. Harga next-open dan biaya transaksi belum diketahui untuk draft aktual. Paper memakai asumsi fill close sinyal sesuai versi model jurnal. Halaman lanjutan memakai run immutable yang sama.</p>
          </div>
        </details>
      </div>
    </section>
    <form method="get" action="/scanner" className="terminal-filters" aria-label="Filter scanner">
      <input type="hidden" name="section" value={section} />
      <label>Sesi target<input name="date" type="date" defaultValue={query.date ?? ""} /></label>
      <label>Strategi sinyal<select name="strategy" defaultValue={query.strategy ?? ""}>
        <option value="">Semua strategi</option>{scannerStrategies.map(strategy => <option key={strategy} value={strategy}>{strategy}</option>)}
      </select></label>
      <button type="submit" className="terminal-action">Terapkan filter</button>
      <span className="terminal-filter-scope">Strategi memfilter sinyal saja; quality tetap seluruh universe run.</span>
    </form>
    <nav className="terminal-tabs" aria-label="Bagian scanner">
      <Link prefetch={false} aria-current={section === "signals" ? "page" : undefined} href={scannerHref(run.id, "signals", 1, query)}>Sinyal diterbitkan</Link>
      <Link prefetch={false} aria-current={section === "quality" ? "page" : undefined} href={scannerHref(run.id, "quality", 1, query)}>Quality dan alasan skip</Link>
    </nav>
    <p className="terminal-notice" role={run.status === "failed" ? "alert" : "status"}>
      {run.status === "failed" ? "Run gagal: entry ditahan; ini bukan hasil tidak ada sinyal. " : run.status === "partial" ? "Evaluasi parsial: " + run.coverage_valid + " dari " + run.coverage_total + " ticker dievaluasi. " : ""}
      {rsHeld && "Ranking RS ditahan untuk seluruh cross-section. "}
      {entryWindow === "elapsed" && "Publikasi forward berakhir. Rencana paper tetap diproses EOD. "}
      Freshness input belum dapat diverifikasi.
    </p>
    <div className={"terminal-workspace " + (selection && !drawer ? "has-detail" : "")}>
      <section className="terminal-results" aria-label="Hasil scanner">
        <div className="terminal-results-heading">
          <h2>{section === "quality" ? "Evaluasi Konstituen Universe" : "Sinyal Diterbitkan"}</h2>
          <span>{section === "quality" ? "Matriks kualitas & strategi" : signals.length + " sinyal pada halaman ini"}</span>
        </div>
        {section === "quality" ? <>
          <div className="terminal-matrix" tabIndex={0} role="region" aria-label="Matriks quality, geser untuk kolom lain">
            <table aria-label="Quality dan evaluasi ticker">
              <thead><tr><th>Ticker / detail</th><th>Status Data</th><th className="number">Ref Close</th>{scannerStrategies.map(strategy => <th key={strategy}>{strategyLabels[strategy]}</th>)}</tr></thead>
              <tbody>{items.map(item => <tr key={item.ticker} data-status={item.status} aria-selected={selectedKey === item.ticker}>
                <td><button className="terminal-ticker" type="button" aria-label={"Detail " + item.ticker} aria-expanded={selectedKey === item.ticker} aria-controls="scanner-detail" onClick={event => select({ kind: "quality", item }, event.currentTarget)}>{item.ticker}<span aria-hidden="true"> ↗</span></button></td>
                <td><span className={item.status === "evaluated" ? "terminal-positive" : "terminal-hold"}>{label(item.status)}</span></td>
                <td className="number">{item.candidates[0] ? price(item.candidates[0].reference_close) : "—"}</td>
                {scannerStrategies.map(strategy => <td key={strategy}>{cell(item, strategy)}</td>)}
              </tr>)}</tbody>
            </table>
          </div>
          {items.length === 0 && <p className="terminal-empty" role="status">Tidak ada item pada halaman ini. Coverage run tetap {run.coverage_valid} / {run.coverage_total}.</p>}
          <p className="terminal-legend">✓ Triggered = aturan terpenuhi · Tidak terpicu = aturan belum terpenuhi · Hold = evaluasi tertahan · N/A = snapshot tidak tersedia. Pilih ticker untuk alasan dan aturan lengkap.</p>
        </> : signals.length ? <div className="terminal-matrix" tabIndex={0} role="region" aria-label="Matriks sinyal, geser untuk kolom lain">
          <table aria-label="Sinyal diterbitkan"><thead><tr><th>Ticker / detail</th><th>Strategi</th><th className="number">Reference close · bukan fill</th><th className="number">Plan Stop</th><th>Target Entry</th><th>Cohort</th><th>Keputusan</th></tr></thead>
            <tbody>{signals.map(signal => <tr key={signal.id} aria-selected={selectedKey === signal.id}>
              <td><button type="button" className="terminal-ticker" aria-label={"Detail " + signal.ticker} aria-expanded={selectedKey === signal.id} aria-controls="scanner-detail" onClick={event => select({ kind: "signal", signal }, event.currentTarget)}>{signal.ticker}<span aria-hidden="true"> ↗</span></button></td>
              <td><span title={signal.strategy}>{strategyLabels[signal.strategy]}</span></td>
              <td className="number">{price(signal.candidate.reference_close)}</td><td className="number">{price(signal.candidate.stop)}</td>
              <td className="terminal-mono">{signal.planned_entry_session}</td>
              <td><span className={signal.cohort === "forward" ? "terminal-positive" : "terminal-hold"}>{signal.cohort === "forward" ? "FORWARD" : "LATE / MODEL ONLY"}</span></td>
              <td>{label(signal.candidate.reason)}</td>
            </tr>)}</tbody>
          </table>
        </div> : <div className="terminal-empty">
          <h3>{query.page > 1 ? "Tidak ada sinyal pada halaman lanjutan ini." : run.status === "complete" ? query.strategy ? "Tidak ada sinyal yang diterbitkan untuk strategi ini pada run terpilih." : "Tidak ada sinyal yang diterbitkan untuk run ini." : run.status === "failed" ? "Publikasi sinyal ditahan: run gagal dan quality hold tetap berlaku." : "Nol sinyal diterbitkan; ini bukan hasil lengkap seluruh universe."}</h3>
          <p>{query.page > 1 ? "Halaman kosong tidak mengubah hasil run atau menyimpulkan bahwa seluruh run tidak memiliki setup." : run.status === "complete" ? "Nol sinyal dipublikasikan tidak membuktikan bahwa tidak ada kandidat triggered; keputusan dan alasan tetap berasal dari backend." : "Periksa status hold setiap ticker pada tab Quality dan alasan skip."}</p>
          <Link prefetch={false} className="terminal-action" href={scannerHref(run.id, "quality", 1, query)}>Lihat Matriks Evaluasi Konstituen →</Link>
        </div>}
        <nav className="terminal-pagination" aria-label="Halaman scanner">
          {query.page > 1 && <Link prefetch={false} href={scannerHref(run.id, section, query.page - 1, query)}>← Sebelumnya</Link>}
          <span>Halaman {query.page} · maksimal 25 baris</span>
          {hasMore && query.page < 40 && <Link prefetch={false} href={scannerHref(run.id, section, query.page + 1, query)}>Berikutnya →</Link>}
        </nav>
      </section>
      {selection && !drawer && <aside id="scanner-detail" className="terminal-detail" aria-labelledby="scanner-pane-title">{detailContent}</aside>}
    </div>
    <dialog ref={dialog} id={drawer ? "scanner-detail" : undefined} className="terminal-detail terminal-dialog" aria-labelledby="scanner-drawer-title" onKeyDown={event => {
      if (event.key !== "Tab") return;
      const elements = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],summary,[tabindex="0"]')).filter(element => element.getClientRects().length > 0);
      const first = elements[0], last = elements.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !event.currentTarget.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !event.currentTarget.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    }} onCancel={event => { event.preventDefault(); close(); }}>{drawer && detailContent}</dialog>
  </div>;
}
