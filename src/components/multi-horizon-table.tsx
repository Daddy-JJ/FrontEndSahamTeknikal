"use client";

import React, { useId } from "react";
import {
  HORIZON_ORDER,
  formatNumber,
  formatRupiah,
  getHorizonTop3NetValue,
  summarizeCrossHorizonOverlap,
  type HorizonPeriod,
  type TickerBrokerDetail,
} from "@/lib/broker-flow";

interface MultiHorizonTableProps {
  ticker: string;
  closePrice: number;
  horizons: Partial<Record<HorizonPeriod, TickerBrokerDetail>>;
  focusedHorizon: HorizonPeriod;
  onSelectFocusHorizon: (horizon: HorizonPeriod) => void;
  onRefreshTicker: () => void;
  isLoading?: boolean;
}

const PHASE_LABELS: Record<HorizonPeriod, string> = {
  "2D": "Inisiasi 48j",
  "5D": "Weekly 5D",
  "10D": "Structural 10D",
};

function getGapStatus(gapPct: number): { label: string; tone: string } {
  if (gapPct <= 0) return { label: "Diskon Modal", tone: "discount" };
  if (gapPct <= 3) return { label: "Zona Ideal", tone: "ideal" };
  if (gapPct <= 7) return { label: "Markup Sehat", tone: "healthy" };
  return { label: "Di Atas Modal", tone: "stretched" };
}

function getGroupShortTag(group: "FOREIGN" | "LOCAL" | "GOVERNMENT"): string {
  if (group === "FOREIGN") return "FRG";
  if (group === "GOVERNMENT") return "BUMN";
  return "LCL";
}

function getQuadrantShortTone(statusColor: TickerBrokerDetail["status_color"]): string {
  if (statusColor === "emerald") return "emerald";
  if (statusColor === "sky") return "sky";
  if (statusColor === "amber") return "amber";
  return "rose";
}

export function MultiHorizonTable({
  ticker,
  closePrice,
  horizons,
  focusedHorizon,
  onSelectFocusHorizon,
  onRefreshTicker,
  isLoading = false,
}: MultiHorizonTableProps) {
  const headingId = useId();
  const crossSummary = summarizeCrossHorizonOverlap(horizons);

  return (
    <div className="bf-mh-section">
      <div className="bf-mh-bar">
        <div className="bf-mh-heading-group">
          <h3 id={headingId} className="bf-mh-title">
            KOMPARASI BROKER FLOW MULTI-HORIZON (2D • 5D • 10D SEKALIGUS)
          </h3>
          <span className="bf-mh-subtitle">
            Bandingkan akumulator, harga modal, jarak modal &amp; alasan 3 periode dalam 1 layar — pilih{" "}
            <strong>Fokus Plan</strong> untuk ubah Trade Plan &amp; garis chart secara instan (0ms).
          </span>
        </div>
        {isLoading && (
          <span className="bf-mh-loading-pill" role="status">
            ⏳ Memuat 2D / 5D / 10D...
          </span>
        )}
      </div>

      {/* Cross-Horizon Persistence & Modal Progression Strip */}
      <div className="bf-mh-consistency-strip">
        <div className="bf-mh-consistency-brokers">
          <span className="bf-mh-consistency-label">KONSISTENSI AKUMULATOR:</span>
          {crossSummary.consistentAccumulators.length > 0 ? (
            <div className="bf-mh-consistency-pills">
              {crossSummary.consistentAccumulators.slice(0, 4).map((b) => (
                <span key={b.code} className="bf-mh-persist-pill">
                  <strong>{b.code}</strong>
                  <span className="bf-mh-persist-days">
                    {b.horizonsPresent.join("+")} ({b.horizonsPresent.length}/3)
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <span className="bf-mh-consistency-empty">
              {crossSummary.availableHorizons.length <= 1
                ? "Menunggu kelengkapan data lintas horizon"
                : "Rotasi broker dominan antar-horizon (belum ada pengulangan top-3)"}
            </span>
          )}
        </div>
        <div className="bf-mh-cost-trend-note">{crossSummary.costTrendNote}</div>
      </div>

      {/* Responsive Semantic Table Container */}
      <div
        tabIndex={0}
        role="region"
        aria-labelledby={headingId}
        className="bf-mh-table-wrap"
      >
        <table className="bf-mh-table">
          <caption className="bf-visually-hidden">
            Tabel komparasi aliran broker multi-horizon 2D, 5D, dan 10D untuk {ticker}
          </caption>
          <thead>
            <tr>
              <th scope="col">Horizon &amp; Status</th>
              <th scope="col">Siapa Akumulator &amp; Modal Broker</th>
              <th scope="col" className="num">Value &amp; Volume</th>
              <th scope="col" className="num">Modal Bandar</th>
              <th scope="col" className="num">Jarak ke Modal</th>
              <th scope="col">Why (Analisa &amp; Alasan)</th>
            </tr>
          </thead>
          <tbody>
            {HORIZON_ORDER.map((h) => {
              const entry = horizons[h];
              const isFocused = focusedHorizon === h;

              if (!entry) {
                return (
                  <tr key={h} className="bf-mh-row missing">
                    <th scope="row" className="bf-mh-horizon-cell">
                      <div className="bf-mh-horizon-inner">
                        <div className="bf-mh-horizon-top">
                          <span className="bf-mh-period-badge">{h}</span>
                          <span className="bf-mh-phase">{PHASE_LABELS[h]}</span>
                        </div>
                        <button
                          type="button"
                          className="bf-mh-focus-btn"
                          disabled={isLoading}
                          onClick={onRefreshTicker}
                        >
                          ⚡ Tarik Live
                        </button>
                      </div>
                    </th>
                    <td data-label="Akumulator & Modal" className="bf-mh-muted-cell">
                      Data {h} belum tersedia pada fallback lokal.
                    </td>
                    <td data-label="Value & Volume" className="num bf-mh-muted-cell">
                      —
                    </td>
                    <td data-label="Modal Bandar" className="num bf-mh-muted-cell">
                      —
                    </td>
                    <td data-label="Jarak ke Modal" className="num bf-mh-muted-cell">
                      —
                    </td>
                    <td data-label="Why (Analisa)" className="bf-mh-muted-cell">
                      Tekan ⚡ Refresh On-Demand atau ⚡ Tarik Live untuk mengambil agregasi broker {h} langsung dari Max MCP.
                    </td>
                  </tr>
                );
              }

              const top3Net = getHorizonTop3NetValue(entry);
              const primaryValue = top3Net !== 0 ? top3Net : entry.net_value;
              const gapMeta = getGapStatus(entry.bandar_cost_gap_pct);
              const qTone = getQuadrantShortTone(entry.status_color);

              return (
                <tr key={h} className={`bf-mh-row ${isFocused ? "focused" : ""}`}>
                  <th scope="row" className="bf-mh-horizon-cell">
                    <div className="bf-mh-horizon-inner">
                      <div className="bf-mh-horizon-top">
                        <span className={`bf-mh-period-badge ${isFocused ? "active" : ""}`}>
                          {h}
                        </span>
                        <span className="bf-mh-phase">{PHASE_LABELS[h]}</span>
                      </div>
                      <div className="bf-mh-date-range">
                        {entry.date_range || entry.horizon_label || "-"}
                      </div>
                      <div className="bf-mh-status-row">
                        <span className={`bf-mh-quad-chip ${qTone}`}>
                          {entry.quadrant_label}
                        </span>
                        {typeof entry.signal_score === "number" && (
                          <span className="bf-mh-score-chip">
                            Score {Math.round(entry.signal_score)}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className={`bf-mh-focus-btn ${isFocused ? "active" : ""}`}
                        aria-pressed={isFocused}
                        onClick={() => onSelectFocusHorizon(h)}
                      >
                        {isFocused ? "✓ Plan & Chart Aktif" : `Fokus Plan ${h}`}
                      </button>
                    </div>
                  </th>

                  <td data-label="Akumulator & Modal Broker" className="bf-mh-acc-cell">
                    {entry.top_accumulators.length > 0 ? (
                      <ul className="bf-mh-broker-list">
                        {entry.top_accumulators.slice(0, 3).map((acc) => (
                          <li key={acc.code} className="bf-mh-broker-row">
                            <span className="bf-mh-broker-code">{acc.code}</span>
                            <span
                              className={`bf-mh-group-tag ${acc.investor_group.toLowerCase()}`}
                              title={acc.investor_group}
                            >
                              {getGroupShortTag(acc.investor_group)}
                            </span>
                            <span className="bf-mh-broker-val pos">
                              {formatRupiah(acc.net_value)}
                            </span>
                            <span className="bf-mh-broker-avg">
                              @ Rp {formatNumber(acc.avg_price)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="bf-mh-muted-cell">
                        Tidak ada akumulasi bersih dominan pada periode {h}.
                      </div>
                    )}
                    <div className="bf-mh-counterparty">
                      <span className="bf-mh-counterparty-lbl">Lawan:</span>{" "}
                      {entry.top_distributors.length > 0
                        ? entry.top_distributors
                            .slice(0, 2)
                            .map((d) => `${d.code} (${formatRupiah(d.net_value)})`)
                            .join(", ")
                        : entry.counterparty_note}
                    </div>
                  </td>

                  <td data-label="Value & Volume" className="num bf-mh-val-cell">
                    <div className={`bf-mh-main-val ${primaryValue >= 0 ? "pos" : "neg"}`}>
                      {formatRupiah(primaryValue)}
                    </div>
                    <div className="bf-mh-val-sub">
                      {top3Net !== 0 ? "Total Top-3 Akum" : "Net Flow Utama"}
                    </div>
                    <div className="bf-mh-val-meta">
                      {top3Net !== 0 && entry.top_accumulators[0] && (
                        <span>
                          Lead #{1} {entry.top_accumulators[0].code}:{" "}
                          {formatRupiah(entry.top_accumulators[0].net_value)}
                        </span>
                      )}
                      {typeof entry.foreign_net_value === "number" &&
                        entry.foreign_net_value !== 0 && (
                          <span
                            className={entry.foreign_net_value >= 0 ? "pos" : "neg"}
                          >
                            Foreign: {formatRupiah(entry.foreign_net_value)}
                          </span>
                        )}
                      <span>{formatNumber(entry.net_volume_lots)} Lot</span>
                    </div>
                  </td>

                  <td data-label="Modal Bandar" className="num bf-mh-cost-cell">
                    <div className="bf-mh-cost-val amber">
                      Rp {formatNumber(entry.bandar_avg_cost)}
                    </div>
                    <div className="bf-mh-val-sub">Weighted Avg {h}</div>
                    {closePrice > 0 && (
                      <div className="bf-mh-close-ref">
                        Close: Rp {formatNumber(closePrice)}
                      </div>
                    )}
                  </td>

                  <td data-label="Jarak ke Modal" className="num bf-mh-gap-cell">
                    <div
                      className={`bf-mh-gap-pct ${
                        entry.bandar_cost_gap_pct >= 0 ? "pos" : "neg"
                      }`}
                    >
                      {entry.bandar_cost_gap_pct >= 0 ? "+" : ""}
                      {entry.bandar_cost_gap_pct.toFixed(2)}%
                    </div>
                    <span className={`bf-mh-gap-pill ${gapMeta.tone}`}>
                      {gapMeta.label}
                    </span>
                  </td>

                  <td data-label="Why (Analisa & Alasan)" className="bf-mh-why-cell">
                    <p className="bf-mh-why-text">{entry.why_insight}</p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MultiHorizonTable;
