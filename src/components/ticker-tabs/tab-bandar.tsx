"use client";

import React, { useState } from "react";
import type { TickerIntelligencePayload } from "@/lib/ticker-intelligence";
import { formatPctID, formatPriceID, formatRupiahCompact } from "@/lib/format-id";

function flowToneClass(val: number): string {
  if (val > 0) return "st-pos";
  if (val < 0) return "st-neg";
  return "";
}

export function TabBandar({ data }: { data: TickerIntelligencePayload }) {
  const { bandar, technicalDetail: td } = data;
  const [selectedWin, setSelectedWin] = useState<"1D" | "3D" | "5D" | "30D">(bandar.primaryWindow);
  const wList = [
    bandar.windows["1D"],
    bandar.windows["3D"],
    bandar.windows["5D"],
    bandar.windows["30D"],
  ];
  const activeW = bandar.windows[selectedWin];

  return (
    <div className="st-intel-stack">
      {/* Bandar Hero & Primary Gauges */}
      <div className="st-status-4grid">
        <div className="st-subcard">
          <div className="st-eyebrow">VERDICT BANDAR ({bandar.primaryWindow})</div>
          <div
            className={bandar.tone === "bullish" ? "st-pos" : bandar.tone === "bearish" ? "st-neg" : "st-warn"}
            style={{ fontSize: "20px", fontWeight: 800, marginTop: "6px" }}
          >
            {bandar.verdict}
          </div>
          <div className="st-muted st-tabular" style={{ marginTop: "4px" }}>
            Skor {bandar.score.toFixed(2)} · Confidence {bandar.confidencePct.toFixed(1)}%
          </div>
        </div>

        <div className="st-subcard">
          <div className="st-eyebrow">KONSENTRASI TOP BROKER</div>
          <div className="st-cal-kpi-val st-tabular" style={{ fontSize: "22px", marginTop: "6px" }}>
            {bandar.concentrationPct.toFixed(1)}%
          </div>
          <div className="st-muted">Level konsentrasi: {bandar.concentrationLabel}</div>
        </div>

        <div className="st-subcard">
          <div className="st-eyebrow">KONSISTENSI AKSI</div>
          <div className="st-cal-kpi-val st-tabular" style={{ fontSize: "22px", marginTop: "6px", color: "var(--accent)" }}>
            {bandar.consistencyPct.toFixed(0)}%
          </div>
          <div className="st-muted">Ketekunan broker utama</div>
        </div>

        <div className="st-subcard">
          <div className="st-eyebrow">ESTIMASI MODAL BANDAR</div>
          <div className="st-cal-kpi-val st-tabular" style={{ fontSize: "22px", marginTop: "6px" }}>
            {td.smart_money.bandar_avg_cost ? formatPriceID(td.smart_money.bandar_avg_cost) : "-"}
          </div>
          <div className="st-muted st-tabular">Vs harga {formatPriceID(td.close)}</div>
        </div>
      </div>

      {bandar.conflictWarning ? (
        <div className="st-provenance-banner" role="status">
          <strong>⚠ Perbedaan Horizon Flow:</strong> {bandar.conflictWarning}
        </div>
      ) : null}

      {/* Evidence Headline */}
      <div className="st-subcard">
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <div className="st-eyebrow">RINGKASAN ARUS SMART MONEY · 1D / 3D / 5D / 30D</div>
          <span className="st-badge st-badge-neutral">◎ PROXY INSTITUSI</span>
        </div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc", marginTop: "6px" }}>
          {bandar.evidenceHeadline}
        </div>
        <div className="st-muted" style={{ marginTop: "4px" }}>{bandar.evidenceDetail}</div>

        {/* 4 Horizon Cards */}
        <div className="st-evidence-4grid" style={{ marginTop: "12px" }}>
          {wList.map((w) => (
            <button
              key={w.key}
              type="button"
              onClick={() => setSelectedWin(w.key)}
              className={`st-ev-tile st-ev-btn ${selectedWin === w.key ? "st-ev-tile-active" : ""}`}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="st-ev-tile-label">{w.key} ({w.tradingDays}H)</span>
                <span className={`st-badge ${w.tone === "bullish" ? "st-badge-markup" : w.tone === "bearish" ? "st-badge-markdown" : "st-badge-neutral"}`} style={{ fontSize: "10px", padding: "1px 6px" }}>
                  {w.verdict}
                </span>
              </div>
              <div className={`st-ev-tile-val st-tabular ${flowToneClass(w.smartNet)}`}>
                {formatRupiahCompact(w.smartNet, true)}
              </div>
              <div className="st-muted st-tabular" style={{ fontSize: "10.5px" }}>
                Asing {formatRupiahCompact(w.foreignNet, true)} · BUMN {formatRupiahCompact(w.governmentNet, true)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Window Investor Composition + Top Buyers / Sellers */}
      <div className="st-subcard">
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "8px", marginBottom: "10px" }}>
          <div>
            <div className="st-eyebrow">DETAIL WINDOW {activeW.key} · KOMPOSISI PELAKU PASAR</div>
            <div className="st-muted">Klik kartu horizon di atas untuk membandingkan flow 1D, 3D, 5D, atau 30D.</div>
          </div>
          <div className="st-chip-row">
            <span className="st-badge st-badge-neutral st-tabular">Asing: {formatRupiahCompact(activeW.foreignNet, true)}</span>
            <span className="st-badge st-badge-neutral st-tabular">BUMN: {formatRupiahCompact(activeW.governmentNet, true)}</span>
            <span className="st-badge st-badge-neutral st-tabular">Lokal/Ritel: {formatRupiahCompact(activeW.localNet, true)}</span>
          </div>
        </div>

        <div className="st-contrib-columns">
          <div className="st-subcard">
            <div className="st-eyebrow" style={{ color: "var(--green)", marginBottom: "6px" }}>
              Top Buyers ({activeW.key})
            </div>
            <div className="st-table-wrap">
              <table className="st-table st-table-fit">
                <thead>
                  <tr>
                    <th>Broker</th>
                    <th>Grup</th>
                    <th className="st-num">Net Buy</th>
                    <th className="st-num">Konsistensi</th>
                  </tr>
                </thead>
                <tbody>
                  {activeW.topBuyers.map((b) => (
                    <tr key={`bb-${b.code}`}>
                      <td><strong>{b.code}</strong></td>
                      <td className="st-muted">{b.group}</td>
                      <td className="st-num st-pos">{formatRupiahCompact(b.netValue, true)}</td>
                      <td className="st-num st-muted">{b.consistency.toFixed(0)}%</td>
                    </tr>
                  ))}
                  {activeW.topBuyers.length === 0 ? (
                    <tr><td colSpan={4} className="st-muted">Data belum tersedia.</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="st-subcard">
            <div className="st-eyebrow" style={{ color: "var(--red)", marginBottom: "6px" }}>
              Top Sellers ({activeW.key})
            </div>
            <div className="st-table-wrap">
              <table className="st-table st-table-fit">
                <thead>
                  <tr>
                    <th>Broker</th>
                    <th>Grup</th>
                    <th className="st-num">Net Sell</th>
                    <th className="st-num">Konsistensi</th>
                  </tr>
                </thead>
                <tbody>
                  {activeW.topSellers.map((s) => (
                    <tr key={`bs-${s.code}`}>
                      <td><strong>{s.code}</strong></td>
                      <td className="st-muted">{s.group}</td>
                      <td className="st-num st-neg">{formatRupiahCompact(s.netValue, true)}</td>
                      <td className="st-num st-muted">{s.consistency.toFixed(0)}%</td>
                    </tr>
                  ))}
                  {activeW.topSellers.length === 0 ? (
                    <tr><td colSpan={4} className="st-muted">Data belum tersedia.</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Advanced Daily Matrix Accordion (modern-web-guidance accordion) */}
      <details className="st-accordion-details">
        <summary className="st-accordion-summary">
          Bukti Bandar Lanjutan — Timeline Harian ({activeW.dailyTimeline.length} hari) &amp; Alert Bandar
        </summary>
        <div className="st-accordion-body">
          {bandar.alerts.length > 0 ? (
            <div className="st-chip-row" style={{ marginBottom: "10px" }}>
              {bandar.alerts.map((al, i) => (
                <div key={`al-${i}`} className="st-subcard" style={{ flex: "1 1 260px" }}>
                  <div className="st-eyebrow">{al.type}</div>
                  <div style={{ fontWeight: 700, fontSize: "13px", marginTop: "3px" }}>{al.title}</div>
                  <div className="st-muted" style={{ marginTop: "3px" }}>{al.detail}</div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="st-table-wrap" tabIndex={0} role="region" aria-label="Timeline arus bandar harian">
            <table className="st-table st-table-fit">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th className="st-num">Close</th>
                  <th className="st-num">Chg%</th>
                  <th className="st-num">Smart Money</th>
                  <th className="st-num">Asing</th>
                  <th className="st-num">BUMN</th>
                  <th>Top B / S</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                {activeW.dailyTimeline.slice().reverse().map((row) => (
                  <tr key={`tl-${row.date}`}>
                    <td className="st-muted">{row.date}</td>
                    <td className="st-num">{formatPriceID(row.close)}</td>
                    <td className={`st-num ${row.changePct >= 0 ? "st-pos" : "st-neg"}`}>
                      {formatPctID(row.changePct, true)}
                    </td>
                    <td className={`st-num ${flowToneClass(row.smartMoneyNet)}`}>
                      {formatRupiahCompact(row.smartMoneyNet, true)}
                    </td>
                    <td className={`st-num ${flowToneClass(row.foreignNet)}`}>
                      {formatRupiahCompact(row.foreignNet, true)}
                    </td>
                    <td className={`st-num ${flowToneClass(row.governmentNet)}`}>
                      {formatRupiahCompact(row.governmentNet, true)}
                    </td>
                    <td className="st-muted">
                      {row.topBuyerCode || "-"} / {row.topSellerCode || "-"}
                    </td>
                    <td className="st-muted">{row.state || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </div>
  );
}
