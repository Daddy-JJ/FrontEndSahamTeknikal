"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronRight, Command, Database, Filter, Layers3, LayoutDashboard, Moon, Search, ShieldCheck, SlidersHorizontal, Sparkles, Telescope, X } from "lucide-react";
import { Modal } from "@/components/modal";
import { PriceChart, Sparkline } from "@/components/price-chart";
import { dateLabel, fmt, strategies, type Signal, type Snapshot, type Strategy, type View } from "@/lib/types";

const navigation: { id: View; label: string; icon: typeof Activity }[] = [
  { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
  { id: "scanner", label: "Scanner", icon: Telescope },
  { id: "journal", label: "Jurnal", icon: BookOpen },
  { id: "analytics", label: "Analitik", icon: Activity },
  { id: "operations", label: "Operasional", icon: SlidersHorizontal },
];

function Badge({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "amber" | "neutral" }) {
  return <span className={`badge ${tone}`}><span className="dot" />{children}</span>;
}

function Empty({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="empty"><Telescope size={28} strokeWidth={1.3} /><h3>{title}</h3><p>{children}</p></div>;
}

export function Workspace({ snapshot: s }: { snapshot: Snapshot }) {
  const [view, setView] = useState<View>("overview");
  const [command, setCommand] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");
  const [query, setQuery] = useState("");
  const [strategy, setStrategy] = useState<Strategy | "all">("all");
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [latestOnly, setLatestOnly] = useState(false);
  const [selected, setSelected] = useState<Signal | null>(null);
  const [chartTicker, setChartTicker] = useState(Object.keys(s.charts)[0]);
  const [journalMode, setJournalMode] = useState<"paper" | "actual">("paper");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [statusPreview, setStatusPreview] = useState("complete");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCommand(v => !v); }
    };
    document.documentElement.dataset.hydrated = "true";
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const today = s.signals.filter(signal => signal.session === s.session);
  const visible = s.signals.filter(signal => (!latestOnly || signal.session === s.session)
    && (strategy === "all" || signal.candidate.strategy === strategy)
    && signal.ticker.toLowerCase().includes(query.toLowerCase())
    && (!onlyEligible || signal.candidate.reason === "eligible"));
  const chart = s.charts[chartTicker];
  const last = chart.at(-1)!;
  const previous = chart.at(-2)!;
  const change = (last.close / previous.close - 1)*100;
  const isOverview = view === "overview";

  function saveWatch(signal: Signal) {
    setWatchlist(old => old.includes(signal.id) ? old.filter(id => id !== signal.id) : [...old, signal.id]);
    setNotice("Watchlist demo diperbarui untuk sesi browser ini. Tidak membuat transaksi actual.");
  }

  function move(next: View) { setView(next); setCommand(false); setCommandSearch(""); }

  return <>
    <a href="#main" className="skip-link">Langsung ke konten</a>
    <header className="navbar"><div className="nav-inner">
      <button className="brand" onClick={() => move("overview")} aria-label="Ruang Sinyal, ringkasan"><span className="brand-mark"><Layers3 size={21} /></span><span>ruang<span className="brand-light">sinyal</span><small>IDX NIGHT SCANNER</small></span></button>
      <nav aria-label="Navigasi utama">{navigation.map(n => <button key={n.id} className={view===n.id ? "nav-link active" : "nav-link"} aria-current={view===n.id ? "page" : undefined} onClick={() => move(n.id)}><n.icon size={15} /><span>{n.label}</span></button>)}</nav>
      <button className="command-button" onClick={() => setCommand(true)} aria-label="Buka command menu"><Search size={15} /><span>Cari & navigasi</span><kbd>⌘ K</kbd></button>
      <Link className="auth-link" href="/login">Login owner</Link>
    </div></header>

    <main id="main" className="workspace">
      <div className="demo-strip"><span><Sparkles size={14} /><strong>Mode demo</strong><span className="demo-description">Data sintetis · bukan harga pasar atau anggota KOMPAS100</span></span><button onClick={() => move("operations")}>Tentang data <ArrowUpRight size={13} /></button></div>
      <section className="page-heading"><div><div className="eyebrow"><span className="live-dot" /> WORKSPACE RISET / EOD DAILY</div>
        <h1>{({ overview: "Lebih jernih melihat peluang.", scanner: "Temukan setup. Pahami alasannya.", journal: "Setiap transaksi, sebuah catatan.", analytics: "Ukur proses. Baca hasilnya.", operations: "Data yang jelas asal-usulnya." })[view]}</h1>
        <p>{view === "overview" ? "Empat strategi, satu ruang untuk meninjau sinyal dan menjaga disiplin." : "Aturan deterministik. Input dapat ditelusuri. Paper dan actual selalu terpisah."}</p></div>
        <div className="session-card"><Moon size={18} /><div><span>Sesi fixture terakhir</span><strong>{dateLabel(s.session)}</strong></div><Badge>Close selesai</Badge></div>
      </section>

      <section className="metric-grid" aria-label="Metrik utama">
        <article className="metric-card"><div className="metric-label">Coverage data <Database size={15} /></div><div className="metric-value">{s.coverage.valid}<span>/ {s.coverage.total}</span></div><div className="metric-foot"><span className="positive">● Lengkap</span><span>Universe sintetis</span></div><div className="progress-track"><i /></div></article>
        <article className="metric-card"><div className="metric-label">Sinyal sesi terakhir <Telescope size={16} /></div><div className="metric-value">{today.length}<span>setup</span></div><div className="metric-foot"><span>4 strategi aktif</span><button onClick={() => move("scanner")}>Tinjau <ArrowRight size={13} /></button></div></article>
        <article className="metric-card"><div className="metric-label">Paper terbuka <BookOpen size={15} /></div><div className="metric-value">{s.metrics.open}<span>trade</span></div><div className="metric-foot"><span>Baseline fixed 2R</span><span className="muted">Simulasi</span></div></article>
        <article className="metric-card accent-card"><div className="metric-label">Expectancy paper <Activity size={15} /></div><div className="metric-value">{fmt(s.metrics.expectancy_r,2)}<span>R</span></div><div className="metric-foot"><span>{s.metrics.closed} trade closed</span><span>Gross · fixture</span></div></article>
      </section>

      {(isOverview || view === "scanner") && <>
        <section className="bento-grid">
          <article className="panel chart-panel"><div className="panel-heading"><div><div className="eyebrow">MARKET LENS · SINTETIS</div><h2>Harga & struktur tren</h2></div><label className="select-label"><span className="sr-only">Ticker chart</span><select value={chartTicker} onChange={e => setChartTicker(e.target.value)}>{Object.keys(s.charts).map(t => <option key={t}>{t}</option>)}</select></label></div>
            <div className="chart-summary"><strong>{fmt(last.close,2)}</strong><span className={change >= 0 ? "positive" : "negative"}>{change >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}{change >= 0 ? "+" : ""}{fmt(change,2)}%</span><span className="muted">close referensi</span><Badge tone="neutral">1D</Badge></div>
            <PriceChart bars={chart} ticker={chartTicker} /><div className="chart-legend"><span><i className="legend-candle" />Harga sintetis</span><span><i className="legend-ma" />EMA20</span><span>60 sesi · volume di bawah</span></div>
          </article>
          <article className="panel strategy-panel"><div className="panel-heading"><div><div className="eyebrow">RULE ENGINE V1</div><h2>Empat sudut pandang</h2></div><ShieldCheck size={20} className="positive" /></div>
            {(Object.entries(strategies) as [Strategy, typeof strategies[Strategy]][]).map(([id,info],i) => <button className={`strategy-row ${strategy===id ? "chosen" : ""}`} key={id} onClick={() => { setStrategy(strategy===id ? "all" : id); setView("scanner"); }}>
              <span className="strategy-number">0{i+1}</span><span><strong>{info.label}</strong><small>{info.description}</small></span><span className="strategy-count">{today.filter(x => x.candidate.strategy===id).length}</span><ChevronRight size={14} />
            </button>)}<div className="strategy-note"><ShieldCheck size={16} /><p>Hanya candle selesai.<br />Entry paling cepat sesi berikutnya.</p></div>
          </article>
        </section>

        <section className="panel scanner-panel" aria-label="Daftar sinyal"><div className="panel-heading"><div><div className="eyebrow">SHORTLIST</div><h2>Sinyal untuk ditinjau <span className="count-bubble">{visible.length}</span></h2></div><span className="small muted">{watchlist.length} di watchlist demo</span></div>
          <div className="filters"><label className="search-field"><Search size={16} /><input aria-label="Cari ticker" placeholder="Cari ticker…" value={query} onChange={e => setQuery(e.target.value)} /></label>
            <label><span className="sr-only">Filter strategi</span><select aria-label="Filter strategi" value={strategy} onChange={e => setStrategy(e.target.value as Strategy | "all")}><option value="all">Semua strategi</option>{Object.entries(strategies).map(([key,value]) => <option value={key} key={key}>{value.label}</option>)}</select></label>
            <button className={`filter-toggle ${latestOnly ? "selected" : ""}`} aria-pressed={latestOnly} onClick={() => setLatestOnly(v => !v)}>Sesi terakhir</button>
            <button className={`filter-toggle ${onlyEligible ? "selected" : ""}`} aria-pressed={onlyEligible} onClick={() => setOnlyEligible(v => !v)}><Filter size={13} />Eligible saja</button>
          </div>
          {visible.length === 0 ? <Empty title="Tidak ada sinyal untuk filter ini.">Coba strategi lain atau nonaktifkan filter sesi terakhir. Ini bukan status data missing.</Empty> : <div className="signal-grid">{visible.slice(0,isOverview ? 6 : 30).map(signal => <article className="signal-card" key={signal.id}>
            <div className="signal-top"><span className="ticker-emblem">{signal.ticker.slice(-1)}</span><div><h3>{signal.ticker}</h3><small>{dateLabel(signal.session)}</small></div><Badge tone={signal.candidate.reason==="eligible" ? "green" : "amber"}>{signal.candidate.reason==="eligible" ? "Eligible" : "Tertahan"}</Badge></div>
            <div className="signal-mid"><div><span className="small muted">Close referensi</span><strong>{fmt(signal.candidate.reference_close,2)}</strong></div><Sparkline bars={s.charts[signal.ticker].filter(b => b.session <= signal.session)} /></div>
            <div className="setup-tag">{strategies[signal.candidate.strategy].label}<span>v1</span></div>
            <div className="signal-levels"><span>SL kandidat <strong>{fmt(signal.candidate.stop,2)}</strong></span><span>Entry <strong>Next open</strong></span></div>
            <div className="signal-actions"><button onClick={() => setSelected(signal)}>Lihat alasan <ArrowUpRight size={14} /></button><button className="watch-button" aria-label={`${watchlist.includes(signal.id) ? "Hapus" : "Simpan"} ${signal.ticker} ke watchlist demo`} aria-pressed={watchlist.includes(signal.id)} onClick={() => saveWatch(signal)}>{watchlist.includes(signal.id) ? <Check size={15} /> : "+"}</button></div>
          </article>)}</div>}
          {visible.length > (isOverview ? 6 : 30) && <p className="panel-note">Menampilkan {isOverview ? 6 : 30} dari {visible.length} sinyal. Persempit filter untuk meninjau hasil.</p>}
        </section>
      </>}

      {view === "journal" && <section className="panel"><div className="panel-heading"><div><div className="eyebrow">JOURNAL</div><h2>Riwayat & posisi</h2></div><div className="segmented" aria-label="Mode jurnal"><button aria-pressed={journalMode==="paper"} onClick={() => setJournalMode("paper")}>Paper</button><button aria-pressed={journalMode==="actual"} onClick={() => setJournalMode("actual")}>Actual</button></div></div>
        {journalMode === "actual" ? <Empty title="Belum ada transaksi actual.">Jurnal actual memerlukan akun owner dan database Supabase. Tidak ada transaksi demo yang masuk ke jurnal actual.</Empty> : <><p className="panel-note">Simulasi engine · {s.cost_label} · Initial risk tetap · satu unit hipotetis per trade</p><div className="table-scroll"><table><thead><tr><th>Ticker / setup</th><th>Status</th><th>Entry</th><th>Initial SL</th><th>TP 2R</th><th>Realized R</th></tr></thead><tbody>{s.paper.map(t => <tr key={t.id}><td><strong>{t.ticker}</strong><small>{strategies[t.strategy].short}</small></td><td><Badge tone={t.state==="skipped" ? "neutral" : t.alternate_r!==null ? "amber" : "green"}>{t.alternate_r!==null ? "Ambiguous" : t.state}</Badge></td><td>{fmt(t.entry,2)}</td><td>{fmt(t.stop,2)}</td><td>{fmt(t.target,2)}</td><td>{t.realized_r===null ? "—" : `${Number(t.realized_r)>0 ? "+" : ""}${fmt(t.realized_r,2)} R`}{t.alternate_r!==null && <small>Alternatif {fmt(t.alternate_r,2)} R</small>}</td></tr>)}</tbody></table></div></>}
      </section>}

      {view === "analytics" && <section className="panel"><div className="panel-heading"><div><div className="eyebrow">RESEARCH, NOT A PROMISE</div><h2>Hasil paper per strategi</h2></div><Badge tone="amber">Fixture · gross</Badge></div>
        <p className="panel-note">Baseline fixed 2R. Semua closed trades dalam jendela fixture. Setup saling berkaitan; jumlah R bukan profit portfolio yang dapat direplikasi.</p>
        <div className="analytics-grid">{(Object.keys(strategies) as Strategy[]).map(id => {
          const metric = s.strategy_metrics[id];
          return <article className="signal-card" key={id}><h3>{strategies[id].label}</h3><div className="metric-value">{metric.win_rate !== null ? fmt(Number(metric.win_rate)*100,1)+"%" : "—"}</div><p className="small muted">Win rate · {metric.closed} closed trades</p><div className="signal-levels"><span>Expectancy <strong>{metric.expectancy_r !== null ? `${fmt(metric.expectancy_r,2)} R` : "Belum tersedia"}</strong></span><span>Ambiguous <strong>{metric.ambiguous_count}</strong></span></div></article>;
        })}</div><div className="info-note">Breakeven masuk denominator win rate. Posisi open tidak dihitung loss. Kasus dual hit memakai SL-first dan menyimpan hasil alternatif TP-first.</div>
      </section>}

      {view === "operations" && <div className="bento-grid"><section className="panel"><div className="panel-heading"><div><div className="eyebrow">DATA & PROVENANCE</div><h2>Status koneksi</h2></div><Database size={20} /></div>
        <div className="connection"><div><strong>Fixture engine</strong><small>OHLCV sintetis → kalkulasi Python → snapshot UI</small></div><Badge>Aktif lokal</Badge></div>
        <div className="connection"><div><strong>Yahoo Finance / yfinance</strong><small>Adapter backend · tidak dipanggil dari browser</small></div><Badge tone="neutral">Belum terhubung</Badge></div>
        <div className="connection"><div><strong>EODHD</strong><small>EODHD_API_TOKEN di environment backend</small></div><Badge tone="amber">Menunggu key</Badge></div>
        <div className="connection"><div><strong>Supabase & GitHub</strong><small>Integrasi live dan jadwal belum aktif</small></div><Badge tone="neutral">Belum terhubung</Badge></div>
        <div className="info-note">Provider dipilih secara eksplisit. Tidak ada fallback tersembunyi. Harga, kalender, dan universe demo tidak digunakan pada mode live.</div>
      </section><section className="panel"><div className="panel-heading"><div><div className="eyebrow">DEVELOPMENT PREVIEW</div><h2>Kenali status data</h2></div></div>
        <label className="stack-label">Pratinjau state UI<select value={statusPreview} onChange={e => setStatusPreview(e.target.value)}><option value="complete">Lengkap</option><option value="partial">Parsial</option><option value="stale">Stale</option><option value="missing">Missing</option><option value="loading">Loading</option><option value="error">Gagal</option></select></label>
        <div className="state-preview" aria-live="polite">{statusPreview === "loading" ? <><div className="skeleton" /><p>Memuat data sesi…</p></> : <><Badge tone={statusPreview==="complete" ? "green" : "amber"}>{statusPreview}</Badge><p>{({ complete:"Semua 5 ticker sintetis telah dievaluasi.", partial:"Contoh: 4 dari 5 ticker tersedia. Ranking RS ditahan sampai cross-section lengkap.", stale:"Data terbaru belum mencapai sesi target. Tidak membuka paper trade baru.", missing:"Data tidak tersedia. Kondisi ini berbeda dari tidak ada sinyal.", error:"Pengambilan data gagal. Periksa run; jangan mengganti dengan data demo." } as Record<string,string>)[statusPreview]}</p></>}</div>
        <small className="muted">Kontrol ini hanya mendemonstrasikan tampilan; tidak mengubah status run.</small>
      </section></div>}

      <footer className="workspace-footer"><span><ShieldCheck size={14} /> Deterministik. Transparan. Dapat diaudit.</span><span>Daily EOD · Asia/Jakarta · Development v0.1</span></footer>
    </main>
    {notice && <div className="toast" role="status"><Check size={17} /><span>{notice}</span><button aria-label="Tutup notifikasi" onClick={() => setNotice("")}><X size={15} /></button></div>}
    {selected && <Modal title={`${selected.ticker} · ${strategies[selected.candidate.strategy].label}`} onClose={() => setSelected(null)}>
      <Badge tone="amber">Data sintetis · fixture</Badge><PriceChart bars={s.charts[selected.ticker].filter(b => b.session <= selected.session)} ticker={selected.ticker} />
      <div className="detail-grid"><div><span>Close referensi</span><strong>{fmt(selected.candidate.reference_close,2)}</strong></div><div><span>Initial SL kandidat</span><strong>{fmt(selected.candidate.stop,2)}</strong></div><div><span>Rencana sesi entry</span><strong>{dateLabel(selected.planned_entry_session)}</strong></div><div><span>Harga entry pada malam sinyal</span><strong>Belum tersedia</strong></div></div>
      <h3>Checklist aturan</h3><ul className="rule-list">{selected.candidate.rules.map(rule => <li key={rule.name}><Check size={15} /><span>{rule.name.replaceAll("_"," ")}</span><strong>{rule.passed ? "Lulus" : "Tidak"}</strong></li>)}</ul>
      {selected.candidate.available_session && <p className="info-note">Pivot: {dateLabel(selected.candidate.pivot_date!)} · Level baru tersedia: {dateLabel(selected.candidate.available_session)}. Chart tidak memundurkan waktu ketersediaan.</p>}
      <details><summary>Audit input & sumber</summary><dl className="audit"><dt>Provider</dt><dd>{selected.provider}</dd><dt>Basis harga</dt><dd>{selected.price_basis}</dd><dt>Input digest</dt><dd>{selected.input_digest}</dd><dt>Cohort</dt><dd>{selected.cohort}</dd></dl></details>
      <button className="primary-button" onClick={() => saveWatch(selected)}>{watchlist.includes(selected.id) ? "Hapus dari watchlist demo" : "Simpan ke watchlist demo"}</button>
    </Modal>}
    {command && <Modal title="Cari & navigasi" onClose={() => setCommand(false)}><label className="search-field command-search"><Command size={18} /><input autoFocus value={commandSearch} onChange={e => setCommandSearch(e.target.value)} placeholder="Cari halaman atau ticker…" aria-label="Pencarian command menu" /></label><div className="command-results">
      {navigation.filter(n => n.label.toLowerCase().includes(commandSearch.toLowerCase())).map(n => <button key={n.id} onClick={() => move(n.id)}><n.icon size={18} /><span>{n.label}</span><ArrowRight size={14} /></button>)}
      {Object.keys(s.charts).filter(t => t.toLowerCase().includes(commandSearch.toLowerCase())).map(t => <button key={t} onClick={() => { setChartTicker(t); setQuery(t); move("scanner"); }}><Telescope size={18} /><span>{t} <small>· sintetis</small></span><ArrowRight size={14} /></button>)}
    </div><p className="small muted">Tab untuk memilih · Enter untuk membuka · Esc untuk menutup</p></Modal>}
  </>;
}
