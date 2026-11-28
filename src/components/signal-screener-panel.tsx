"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  SIGNAL_DISPLAY_META,
  type ScreeningSignalRow,
  type WinRateMetricCell,
  type WinRatePayload,
  type WinRateStrategyRow,
} from "@/lib/screener-types";
import {
  formatPctID,
  formatPriceID,
  formatRupiahCompact,
  smartMoneyMeta,
  stockRegimeMeta,
} from "@/lib/format-id";

interface SignalScreenerPanelProps {
  initialSignals: ScreeningSignalRow[];
  initialLatestDate: string | null;
  availableDates: string[];
  initialWinRate: WinRatePayload;
}

type ActiveTab = "SIGNALS" | "WINRATE";
type SignalSortCol = "signal_date" | "ticker" | "close_price" | "rr_tp1" | "smart_money_score";

function formatShortTanggal(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function renderEvalStatusChip(status: string, prefix: string) {
  if (status === "win") {
    return <span className="st-badge st-badge-markup">{prefix} WIN</span>;
  }
  if (status === "loss") {
    return <span className="st-badge st-badge-markdown">{prefix} SL</span>;
  }
  if (status === "ambiguous" || status === "excluded") {
    return <span className="st-badge st-badge-partial">{prefix} EXCL</span>;
  }
  return <span className="st-muted">{prefix} WAIT</span>;
}

function WinRateCellView({ cell }: { cell: WinRateMetricCell }) {
  return (
    <td className="st-num">
      <div className="st-wr-rate st-tabular">
        {cell.rate_pct !== null ? formatPctID(cell.rate_pct) : "-"}
      </div>
      <div className="st-wr-sub st-tabular">
        {cell.wins} / {cell.evaluated} dinilai
      </div>
      <div className="st-wr-sub st-tabular" style={{ fontSize: "10.5px" }}>
        {cell.pending} menunggu · {cell.excluded} dikecualikan
      </div>
    </td>
  );
}

export function SignalScreenerPanel({
  initialSignals,
  initialLatestDate,
  availableDates,
  initialWinRate,
}: SignalScreenerPanelProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("SIGNALS");

  // Daftar Sinyal state
  const [signals, setSignals] = useState<ScreeningSignalRow[]>(initialSignals);
  const [selectedDate, setSelectedDate] = useState<string>(initialLatestDate ? "latest" : "all");
  const [signalType, setSignalType] = useState<string>("ALL");
  const [minScore, setMinScore] = useState<number>(0);
  const [regimeFilter, setRegimeFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortCol, setSortCol] = useState<SignalSortCol>("smart_money_score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [loadingSignals, setLoadingSignals] = useState<boolean>(false);

  // Win Rate state
  const [winRate, setWinRate] = useState<WinRatePayload>(initialWinRate);
  const [wrYear, setWrYear] = useState<string>(initialWinRate.year || "2026");
  const [wrMinScore, setWrMinScore] = useState<number>(initialWinRate.min_smart_money || 0);
  const [loadingWr, setLoadingWr] = useState<boolean>(false);

  const fetchSignals = async (overrides?: {
    date?: string;
    signalType?: string;
    minScore?: number;
    regime?: string;
  }) => {
    const nextDate = overrides?.date ?? selectedDate;
    const nextType = overrides?.signalType ?? signalType;
    const nextMin = overrides?.minScore ?? minScore;
    const nextRegime = overrides?.regime ?? regimeFilter;
    setLoadingSignals(true);
    try {
      const qs = new URLSearchParams({
        date: nextDate,
        signalType: nextType,
        minScore: String(nextMin),
        regime: nextRegime,
        limit: "300",
      });
      const res = await fetch(`/api/signals?${qs.toString()}`);
      const json = await res.json();
      if (json.ok && json.data?.rows) {
        setSignals(json.data.rows);
      }
    } finally {
      setLoadingSignals(false);
    }
  };

  const fetchWinRate = async (year = wrYear, minSm = wrMinScore) => {
    setLoadingWr(true);
    try {
      const qs = new URLSearchParams({ year, minScore: String(minSm) });
      const res = await fetch(`/api/signals/win-rate?${qs.toString()}`);
      const json = await res.json();
      if (json.ok && json.data) {
        setWinRate(json.data);
      }
    } finally {
      setLoadingWr(false);
    }
  };

  const displayedSignals = useMemo(() => {
    const q = searchTerm.trim().toUpperCase();
    const list = signals.filter((s) => {
      if (signalType !== "ALL" && s.signal_type !== signalType) return false;
      if (minScore > 0 && s.smart_money_score < minScore) return false;
      if (regimeFilter !== "ALL" && s.regime !== regimeFilter) return false;
      if (q && !s.ticker.includes(q) && !(s.sector || "").toUpperCase().includes(q)) return false;
      return true;
    });

    return list.sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortCol === "ticker") return a.ticker.localeCompare(b.ticker) * mul;
      if (sortCol === "signal_date") return a.signal_date.localeCompare(b.signal_date) * mul;
      return ((Number(a[sortCol] ?? 0)) - (Number(b[sortCol] ?? 0))) * mul;
    });
  }, [signals, signalType, minScore, regimeFilter, searchTerm, sortCol, sortDir]);

  const toggleSort = (col: SignalSortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  return (
    <section id="screener" className="st-card" aria-label="Screener Sinyal & Statistik Win Rate">
      <div className="st-card-header" style={{ marginBottom: "8px" }}>
        <div>
          <div className="st-eyebrow">DAILY SCREENER ENGINE · FRACTAL · MACD+MA200 · G ACC · SMART MONEY</div>
          <h2 className="st-title-md">Sinyal Trading Harian &amp; Evaluasi Win Rate</h2>
        </div>

        <div
          className="st-tablist"
          role="tablist"
          aria-label="Mode tampilan screener"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault();
              setActiveTab((prev) => (prev === "SIGNALS" ? "WINRATE" : "SIGNALS"));
            }
          }}
        >
          <button
            id="tab-signals"
            type="button"
            role="tab"
            className="st-tab"
            aria-selected={activeTab === "SIGNALS"}
            aria-controls="panel-signals"
            onClick={() => setActiveTab("SIGNALS")}
          >
            DAFTAR SINYAL ({displayedSignals.length})
          </button>
          <button
            id="tab-winrate"
            type="button"
            role="tab"
            className="st-tab"
            aria-selected={activeTab === "WINRATE"}
            aria-controls="panel-winrate"
            onClick={() => setActiveTab("WINRATE")}
          >
            WIN RATE ({winRate.archive_days} HARI ARSIP)
          </button>
        </div>
      </div>

      {activeTab === "SIGNALS" ? (
        <div id="panel-signals" role="tabpanel" aria-labelledby="tab-signals">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px", alignItems: "center" }}>
            <select
              aria-label="Pilih tanggal arsip sinyal"
              className="st-select"
              value={selectedDate}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedDate(v);
                fetchSignals({ date: v });
              }}
            >
              <option value="latest">Sesi Terbaru ({initialLatestDate || "-"})</option>
              <option value="all">Semua Arsip Terbaru (300 baris)</option>
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter jenis aturan entry"
              className="st-select"
              value={signalType}
              onChange={(e) => {
                const v = e.target.value;
                setSignalType(v);
                fetchSignals({ signalType: v });
              }}
            >
              <option value="ALL">Semua Strategi Entry</option>
              <option value="FRACTAL_BREAKOUT">Fractal Breakout</option>
              <option value="MACD_EMA200">MACD &amp; MA 200</option>
              <option value="G_ACC">G Acc / G Accumulation</option>
            </select>

            <select
              aria-label="Filter skor konfirmasi Smart Money"
              className="st-select"
              value={String(minScore)}
              onChange={(e) => {
                const v = Number(e.target.value);
                setMinScore(v);
                fetchSignals({ minScore: v });
              }}
            >
              <option value="0">Smart Money: Semua (0–3/3)</option>
              <option value="3">3/3 STRONG CONFIRMATION</option>
              <option value="2">2/3+ CONFIRMED</option>
              <option value="1">1/3+ PARTIAL</option>
            </select>

            <select
              aria-label="Filter Regime saham"
              className="st-select"
              value={regimeFilter}
              onChange={(e) => {
                const v = e.target.value;
                setRegimeFilter(v);
                fetchSignals({ regime: v });
              }}
            >
              <option value="ALL">Semua Regime</option>
              <option value="MARKUP">▲ MARKUP (BUY)</option>
              <option value="CONSOLIDATING">◆ CONSOLIDATING</option>
              <option value="MARKDOWN">▼ MARKDOWN (AVOID)</option>
            </select>

            <input
              type="search"
              className="st-input"
              placeholder="Cari ticker / sektor..."
              aria-label="Cari ticker di daftar sinyal"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <button type="button" className="st-btn" onClick={() => fetchSignals()} disabled={loadingSignals}>
              {loadingSignals ? "Memuat..." : "Muat Ulang"}
            </button>
          </div>

          <div role="status" className="st-muted" style={{ marginBottom: "8px" }}>
            Menampilkan {displayedSignals.length} sinyal · Urut berdasarkan Skor Smart Money &amp; R:R.
          </div>

          {loadingSignals ? (
            <div className="st-skeleton" style={{ height: "220px" }} aria-hidden="true" />
          ) : (
            <div className="st-table-wrap" tabIndex={0} role="region" aria-labelledby="screener-signals-caption">
              <table className="st-table">
                <caption id="screener-signals-caption">
                  Daftar sinyal trading teknikal &amp; konfirmasi 3-faktor Smart Money (① Broker Acc ≥60%, ② Foreign Inflow, ③ Bandarmology Alignment)
                </caption>
                <thead>
                  <tr>
                    <th scope="col" aria-sort={sortCol === "signal_date" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
                      <button type="button" className="st-th-sort-btn" onClick={() => toggleSort("signal_date")}>
                        Tanggal {sortCol === "signal_date" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th scope="col" aria-sort={sortCol === "ticker" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
                      <button type="button" className="st-th-sort-btn" onClick={() => toggleSort("ticker")}>
                        Emiten {sortCol === "ticker" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th scope="col">Strategi</th>
                    <th scope="col" className="st-num" aria-sort={sortCol === "close_price" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
                      <button type="button" className="st-th-sort-btn" onClick={() => toggleSort("close_price")}>
                        Close {sortCol === "close_price" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th scope="col" className="st-num">SL / TP1 / TP2</th>
                    <th scope="col" className="st-num" aria-sort={sortCol === "rr_tp1" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
                      <button type="button" className="st-th-sort-btn" onClick={() => toggleSort("rr_tp1")}>
                        R:R TP1 {sortCol === "rr_tp1" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th scope="col" aria-sort={sortCol === "smart_money_score" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
                      <button type="button" className="st-th-sort-btn" onClick={() => toggleSort("smart_money_score")}>
                        Smart Money 3-Faktor {sortCol === "smart_money_score" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th scope="col">Regime</th>
                    <th scope="col">Status Evaluasi</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedSignals.map((row) => {
                    const sm = smartMoneyMeta(row.smart_money_score, row.smart_money_label);
                    const reg = stockRegimeMeta(row.regime, row.regime_action);
                    const stratLabel = SIGNAL_DISPLAY_META[row.signal_type]?.label || row.signal_type;
                    const f1 = row.smart_money_factors?.broker_accumulation?.passed;
                    const f2 = row.smart_money_factors?.foreign_inflow?.passed;
                    const f3 = row.smart_money_factors?.bandarmology_alignment?.passed;
                    const fnVal = row.smart_money_factors?.foreign_inflow?.foreign_net;

                    return (
                      <tr key={`${row.signal_date}-${row.ticker}-${row.signal_type}`}>
                        <td className="st-muted">{row.signal_date}</td>
                        <td>
                          <Link
                            href={`/ticker/${row.ticker}`}
                            style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none", fontSize: "13px" }}
                          >
                            {row.ticker}
                          </Link>
                          <div className="st-muted" style={{ fontSize: "10.5px" }}>
                            {row.sector || "IDX"}
                          </div>
                        </td>
                        <td>
                          <span className="st-badge st-badge-strategy">{stratLabel}</span>
                          {row.notes ? (
                            <div className="st-muted" style={{ fontSize: "10.5px", maxWidth: "240px", marginTop: "3px" }}>
                              {row.notes}
                            </div>
                          ) : null}
                        </td>
                        <td className="st-num">
                          <div style={{ fontWeight: 700 }}>{formatPriceID(row.close_price)}</div>
                          <div className={Number(row.change_pct ?? 0) >= 0 ? "st-pos" : "st-neg"} style={{ fontSize: "11px" }}>
                            {formatPctID(row.change_pct, true)}
                          </div>
                        </td>
                        <td className="st-num" style={{ fontSize: "11px" }}>
                          <div>
                            <span className="st-neg">SL {formatPriceID(row.stop_loss)}</span>
                          </div>
                          <div>
                            <span className="st-pos">TP1 {formatPriceID(row.tp1)}</span> ·{" "}
                            <span style={{ color: "var(--accent)" }}>TP2 {formatPriceID(row.tp2)}</span>
                          </div>
                        </td>
                        <td className="st-num" style={{ fontWeight: 700 }}>
                          {row.rr_tp1 ? `1 : ${row.rr_tp1.toFixed(1)}` : "-"}
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span className={`st-badge ${sm.cls}`}>{sm.text}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span className="st-sm-pips" title="① Broker Acc ≥60% · ② Foreign Net > 0 · ③ Bandarmology Align">
                                <span className={`st-pip ${f1 ? "st-pip-on" : ""}`} />
                                <span className={`st-pip ${f2 ? "st-pip-on" : ""}`} />
                                <span className={`st-pip ${f3 ? "st-pip-on" : ""}`} />
                              </span>
                              <span className="st-muted" style={{ fontSize: "10.5px" }}>
                                Asing: {formatRupiahCompact(fnVal, true)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`st-badge ${reg.cls}`}>{reg.text}</span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                            {renderEvalStatusChip(row.eval_tp1_status, "TP1")}
                            {renderEvalStatusChip(row.eval_up_5d_status, "5H")}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {displayedSignals.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="st-muted" style={{ textAlign: "center", padding: "26px" }}>
                        Tidak ada sinyal yang memenuhi filter saat ini. Coba turunkan filter skor Smart Money atau ubah tanggal.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div id="panel-winrate" role="tabpanel" aria-labelledby="tab-winrate">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
            <label className="st-muted" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              Tahun sinyal
              <select
                className="st-select"
                value={wrYear}
                onChange={(e) => {
                  const y = e.target.value;
                  setWrYear(y);
                  fetchWinRate(y, wrMinScore);
                }}
              >
                <option value="2026">2026</option>
                <option value="ALL">Semua Tahun</option>
              </select>
            </label>

            <label className="st-muted" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              Filter Smart Money
              <select
                className="st-select"
                value={String(wrMinScore)}
                onChange={(e) => {
                  const s = Number(e.target.value);
                  setWrMinScore(s);
                  fetchWinRate(wrYear, s);
                }}
              >
                <option value="0">Semua Sinyal (0–3/3)</option>
                <option value="2">Konfirmasi 2/3+ (CONFIRMED)</option>
                <option value="3">Konfirmasi 3/3 (STRONG CONFIRMATION)</option>
              </select>
            </label>

            <button
              type="button"
              className="st-btn"
              onClick={() => fetchWinRate(wrYear, wrMinScore)}
              disabled={loadingWr}
            >
              {loadingWr ? "Memuat..." : "MUAT ULANG"}
            </button>
          </div>

          <p className="st-muted st-tabular" style={{ margin: "0 0 12px" }}>
            {winRate.archive_days} arsip tanggal · {formatShortTanggal(winRate.date_from)}–{formatShortTanggal(winRate.date_to)} · Harga sampai{" "}
            {formatShortTanggal(winRate.evaluated_until)}. Hanya tanggal yang memiliki arsip dihitung.
          </p>

          {loadingWr ? (
            <div className="st-skeleton" style={{ height: "240px" }} aria-hidden="true" />
          ) : (
            <div className="st-table-wrap" tabIndex={0} role="region" aria-labelledby="winrate-table-caption">
              <table className="st-table st-table-fit">
                <caption id="winrate-table-caption">
                  WIN RATE PER JENIS SINYAL (MENANG / DINILAI) — perbandingan TP1 sebelum SL, TP2 sebelum SL, dan Naik Tanpa SL 5H/10H/Terbaru
                </caption>
                <thead>
                  <tr>
                    <th scope="col">JENIS SINYAL</th>
                    <th scope="col" className="st-num">TP1 SEBELUM SL</th>
                    <th scope="col" className="st-num">TP2 SEBELUM SL</th>
                    <th scope="col" className="st-num">NAIK TANPA SL · 5 HARI</th>
                    <th scope="col" className="st-num">NAIK TANPA SL · 10 HARI</th>
                    <th scope="col" className="st-num">NAIK TANPA SL · SAMPAI TERBARU</th>
                  </tr>
                </thead>
                <tbody>
                  {winRate.rows.map((r: WinRateStrategyRow) => (
                    <tr key={r.signal_type}>
                      <td>
                        <strong style={{ color: "#f8fafc", fontSize: "13px" }}>{r.display_name}</strong>
                        <div className="st-muted" style={{ fontSize: "11px" }}>
                          {r.total_occurrences} kemunculan
                        </div>
                        <div className="st-muted" style={{ fontSize: "10.5px", maxWidth: "240px" }}>
                          {r.description}
                        </div>
                      </td>
                      <WinRateCellView cell={r.tp1_before_sl} />
                      <WinRateCellView cell={r.tp2_before_sl} />
                      <WinRateCellView cell={r.up_no_sl_5d} />
                      <WinRateCellView cell={r.up_no_sl_10d} />
                      <WinRateCellView cell={r.up_no_sl_latest} />
                    </tr>
                  ))}
                  {winRate.overall_row ? (
                    <tr style={{ background: "rgba(107, 213, 237, 0.06)", borderTop: "1px solid rgba(148, 163, 184, 0.25)" }}>
                      <td>
                        <strong style={{ color: "var(--accent)", fontSize: "13px" }}>{winRate.overall_row.display_name}</strong>
                        <div className="st-muted" style={{ fontSize: "11px" }}>
                          {winRate.overall_row.total_occurrences} kemunculan unik
                        </div>
                      </td>
                      <WinRateCellView cell={winRate.overall_row.tp1_before_sl} />
                      <WinRateCellView cell={winRate.overall_row.tp2_before_sl} />
                      <WinRateCellView cell={winRate.overall_row.up_no_sl_5d} />
                      <WinRateCellView cell={winRate.overall_row.up_no_sl_10d} />
                      <WinRateCellView cell={winRate.overall_row.up_no_sl_latest} />
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}

          <p className="st-muted" style={{ margin: "12px 0 6px", lineHeight: 1.5 }}>
            <strong>Naik tanpa SL:</strong> pernah lebih tinggi dari harga saat sinyal dan tidak menyentuh SL selama periode yang dinilai. Sempat naik lalu kena SL tetap tidak dihitung menang. Persentase memakai sinyal yang sudah dapat dinilai.
          </p>

          <details className="st-details-box" open>
            <summary>▼ Cara menghitung dan batas data</summary>
            <ul className="st-details-list">
              <li>
                <strong>TP1 / TP2:</strong> target tersentuh sebelum SL, mulai hari setelah sinyal. TP1 lalu SL dihitung menang untuk TP1 dan kalah untuk TP2. Level awal harus SL &lt; harga saat sinyal &lt; TP1 ≤ TP2.
              </li>
              <li>
                <strong>Naik tanpa SL:</strong> harga tertinggi setelah hari sinyal pernah lebih tinggi daripada penutupan saat sinyal. Menyentuh SL dalam periode pengamatan membuat hasil tidak menang, baik SL terjadi sebelum maupun setelah kenaikan. SL dan kenaikan pada hari yang sama juga tidak menang.
              </li>
              <li>
                <strong>5 / 10 hari:</strong> hari bursa setelah tanggal sinyal. Seluruh jendela pengamatan harus tersedia, meskipun harga sudah naik lebih awal. SL pada hari ke-6 memengaruhi ukuran 10 hari dan sampai terbaru, bukan ukuran 5 hari.
              </li>
              <li>
                <strong>Sampai terbaru:</strong> minimal satu hari bursa sesudah sinyal; lama pengamatan tiap sinyal berbeda. Hasil menang sementara bisa berubah jika kemudian terkena SL. Belum naik masih bisa berubah jika kemudian naik tanpa SL.
              </li>
              <li>
                <strong>Sinyal gabungan:</strong> dihitung pada masing-masing jenis. Baris semua sinyal menghitung setiap saham/tanggal sekali. Sinyal berulang bisa memiliki masa pengamatan yang tumpang tindih.
              </li>
              <li>
                <strong>Kualitas data:</strong> Data tidak lengkap, dugaan perubahan skala harga, dan urutan SL/TP yang tidak pasti dipisahkan (dikecualikan). Angka ini statistik sentuhan harga, bukan hasil transaksi setelah biaya.
              </li>
            </ul>
          </details>
        </div>
      )}
    </section>
  );
}
