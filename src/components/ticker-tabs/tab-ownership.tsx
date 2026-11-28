"use client";

import React, { useId, useMemo, useState } from "react";
import type { TickerIntelligencePayload } from "@/lib/ticker-intelligence";
import { formatCalendarDateID, formatPlainYearMonthID } from "@/lib/temporal-dates";

type SortCol = "name" | "pct" | "chg" | "shares";

export function TabOwnership({ data }: { data: TickerIntelligencePayload }) {
  const { ownership } = data;
  const captionId = useId();
  const [sortCol, setSortCol] = useState<SortCol>("pct");
  const [sortDir, setSortDir] = useState<"ascending" | "descending">("descending");
  const [announcement, setAnnouncement] = useState("");

  const collator = useMemo(() => new Intl.Collator("id", { numeric: true, sensitivity: "base" }), []);

  const sortedHolders = useMemo(() => {
    const factor = sortDir === "ascending" ? 1 : -1;
    return ownership.holders.slice().sort((a, b) => {
      if (sortCol === "name") return collator.compare(a.investorName, b.investorName) * factor;
      if (sortCol === "chg") return ((a.changePct ?? 0) - (b.changePct ?? 0)) * factor;
      if (sortCol === "shares") return (a.totalShares - b.totalShares) * factor;
      return (a.percentage - b.percentage) * factor;
    });
  }, [ownership.holders, sortCol, sortDir, collator]);

  const toggleSort = (col: SortCol, label: string) => {
    const nextDir = sortCol === col ? (sortDir === "descending" ? "ascending" : "descending") : "descending";
    setSortCol(col);
    setSortDir(nextDir);
    setAnnouncement(`Diurutkan berdasarkan ${label} (${nextDir}), ${sortedHolders.length} pemegang saham.`);
  };

  return (
    <div className="st-intel-stack">
      {/* Ownership KPIs */}
      <div className="st-status-4grid">
        <div className="st-subcard">
          <div className="st-eyebrow">PERIODE DATA KSEI</div>
          <div className="st-cal-kpi-val st-tabular" style={{ fontSize: "20px", marginTop: "4px" }}>
            {ownership.latestPeriodDisplay}
          </div>
          <div className="st-muted">Cut-off {formatCalendarDateID(ownership.holdersDate, false)}</div>
        </div>

        <div className="st-subcard">
          <div className="st-eyebrow">KEPEMILIKAN ASING</div>
          <div className="st-cal-kpi-val st-tabular" style={{ fontSize: "20px", marginTop: "4px", color: "var(--accent)" }}>
            {ownership.foreignPct !== null ? `${ownership.foreignPct.toFixed(2)}%` : "-"}
          </div>
          <div className="st-muted st-tabular">
            Trend: {ownership.foreignTrend}
            {ownership.foreignChange !== null ? ` (${ownership.foreignChange >= 0 ? "+" : ""}${ownership.foreignChange.toFixed(2)}%)` : ""}
          </div>
        </div>

        <div className="st-subcard">
          <div className="st-eyebrow">JUMLAH PEMEGANG ≥1%/MAJOR</div>
          <div className="st-cal-kpi-val st-tabular" style={{ fontSize: "20px", marginTop: "4px" }}>
            {ownership.holders.length}
          </div>
          <div className="st-muted">{ownership.periodsAvailable.length} periode historis tersedia</div>
        </div>

        <div className="st-subcard">
          <div className="st-eyebrow">DISTRIBUSI TIPE INVESTOR</div>
          <div className="st-chip-row" style={{ marginTop: "6px" }}>
            {ownership.typeBreakdown.map((t) => (
              <span key={`tb-${t.code}`} className="st-badge st-badge-neutral st-tabular">
                {t.code}: {t.pct.toFixed(1)}%
              </span>
            ))}
            {ownership.typeBreakdown.length === 0 ? <span className="st-muted">-</span> : null}
          </div>
        </div>
      </div>

      {/* 4-Period Ownership Matrix Table */}
      <div className="st-subcard">
        <div className="st-card-header">
          <div>
            <div className="st-eyebrow">STRUKTUR PEMEGANG SAHAM KSEI (MULTI-PERIODE)</div>
            <h2 className="st-title-md">Komposisi &amp; Perubahan Bulanan ({ownership.holders.length})</h2>
          </div>
          <span className="st-badge st-badge-markup">● OBSERVED KSEI</span>
        </div>
        <div role="status" aria-live="polite" className="st-sr-only">{announcement}</div>

        <div className="st-table-wrap st-cal-table-region" tabIndex={0} role="region" aria-labelledby={captionId}>
          <table className="st-table st-table-fit">
            <caption id={captionId}>
              Daftar pemegang saham utama beserta persentase kepemilikan per periode KSEI.
            </caption>
            <thead>
              <tr>
                <th scope="col" aria-sort={sortCol === "name" ? sortDir : undefined}>
                  <button type="button" className="st-th-sort-btn" onClick={() => toggleSort("name", "Nama Pemegang Saham")}>
                    Pemegang Saham <span aria-hidden="true" className="st-sort-icon" />
                  </button>
                </th>
                <th scope="col">Tipe</th>
                <th scope="col">L/F</th>
                {ownership.periodsAvailable.map((p) => (
                  <th key={`ph-${p}`} scope="col" className="st-num">{formatPlainYearMonthID(p)}</th>
                ))}
                <th scope="col" className="st-num" aria-sort={sortCol === "pct" ? sortDir : undefined}>
                  <button type="button" className="st-th-sort-btn" onClick={() => toggleSort("pct", "Persentase Terbaru")}>
                    % Terbaru <span aria-hidden="true" className="st-sort-icon" />
                  </button>
                </th>
                <th scope="col" className="st-num" aria-sort={sortCol === "chg" ? sortDir : undefined}>
                  <button type="button" className="st-th-sort-btn" onClick={() => toggleSort("chg", "Perubahan MoM")}>
                    MoM Δ <span aria-hidden="true" className="st-sort-icon" />
                  </button>
                </th>
                <th scope="col" className="st-num" aria-sort={sortCol === "shares" ? sortDir : undefined}>
                  <button type="button" className="st-th-sort-btn" onClick={() => toggleSort("shares", "Jumlah Saham")}>
                    Saham <span aria-hidden="true" className="st-sort-icon" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedHolders.map((h) => (
                <tr key={`own-${h.investorName}`}>
                  <td><strong>{h.investorName}</strong></td>
                  <td className="st-muted">{h.investorType}</td>
                  <td>
                    <span className={`st-badge ${h.localForeign === "F" ? "st-badge-strategy" : "st-badge-neutral"}`} style={{ fontSize: "10px", padding: "1px 6px" }}>
                      {h.localForeign}
                    </span>
                  </td>
                  {ownership.periodsAvailable.map((p) => (
                    <td key={`own-p-${h.investorName}-${p}`} className="st-num st-muted">
                      {h.history[p] ? `${h.history[p].percentage.toFixed(2)}%` : "-"}
                    </td>
                  ))}
                  <td className="st-num"><strong>{h.percentage.toFixed(2)}%</strong></td>
                  <td className={`st-num ${(h.changePct ?? 0) > 0 ? "st-pos" : (h.changePct ?? 0) < 0 ? "st-neg" : "st-muted"}`}>
                    {h.changePct !== null ? `${h.changePct > 0 ? "+" : ""}${h.changePct.toFixed(2)}%` : "-"}
                  </td>
                  <td className="st-num st-muted">{h.totalShares.toLocaleString("id-ID")}</td>
                </tr>
              ))}
              {sortedHolders.length === 0 ? (
                <tr>
                  <td colSpan={6 + ownership.periodsAvailable.length} className="st-muted" style={{ textAlign: "center", padding: "22px" }}>
                    Data struktur kepemilikan KSEI belum tersedia untuk emiten ini.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
