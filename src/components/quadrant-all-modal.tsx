"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { QUADRANT_LABELS, type QuadrantId, type QuadrantStockItem } from "@/lib/screener-types";
import {
  formatPctID,
  formatPriceID,
  formatRupiahCompact,
  smartMoneyMeta,
  stockRegimeMeta,
} from "@/lib/format-id";

interface QuadrantAllModalProps {
  quadrantId: QuadrantId | null;
  stocks: QuadrantStockItem[];
  onClose: () => void;
}

type SortKey = "smart_money_net" | "foreign_net" | "change_percent" | "turnover" | "smart_money_score" | "ticker";

export function QuadrantAllModal({ quadrantId, stocks, onClose }: QuadrantAllModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pointerDownInsideRef = useRef(false);

  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState<number>(0);
  const [sortKey, setSortKey] = useState<SortKey>("smart_money_net");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;

    if (quadrantId) {
      if (!dlg.open) {
        dlg.showModal();
      }
    } else if (dlg.open) {
      dlg.close();
    }
  }, [quadrantId]);

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toUpperCase();
    const list = stocks.filter((s) => {
      if (minScore > 0 && s.smart_money_score < minScore) return false;
      if (!q) return true;
      return s.ticker.includes(q) || s.sector.toUpperCase().includes(q);
    });

    return list.sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortKey === "ticker") return a.ticker.localeCompare(b.ticker) * mul;
      if (sortKey === "smart_money_net" || sortKey === "foreign_net") {
        return (Math.abs(a[sortKey]) - Math.abs(b[sortKey])) * mul;
      }
      return ((a[sortKey] ?? 0) - (b[sortKey] ?? 0)) * mul;
    });
  }, [stocks, search, minScore, sortKey, sortDir]);

  const toggleSort = (col: SortKey) => {
    if (sortKey === col) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(col);
      setSortDir("desc");
    }
  };

  const info = quadrantId ? QUADRANT_LABELS[quadrantId] : null;

  return (
    <dialog
      ref={dialogRef}
      className="st-dialog"
      closedby="any"
      aria-labelledby="quadrant-modal-title"
      onClose={onClose}
      onPointerDown={(e) => {
        if ("closedBy" in HTMLDialogElement.prototype) return;
        const dlg = e.currentTarget;
        const rect = dlg.getBoundingClientRect();
        pointerDownInsideRef.current =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
      }}
      onPointerUp={(e) => {
        if ("closedBy" in HTMLDialogElement.prototype) return;
        const dlg = e.currentTarget;
        const rect = dlg.getBoundingClientRect();
        const releasedInside =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        if (!pointerDownInsideRef.current && !releasedInside && e.target === dlg) {
          dlg.close();
        }
      }}
    >
      {info ? (
        <div className="st-dialog-inner">
          <div className="st-dialog-head">
            <div>
              <div className="st-eyebrow">{info.badge} · SEMUA SAHAM DI KUADRAN</div>
              <h3 id="quadrant-modal-title" className="st-title-md" style={{ marginTop: "2px" }}>
                {info.title} ({filteredAndSorted.length} dari {stocks.length} emiten)
              </h3>
              <p className="st-muted" style={{ margin: "2px 0 0" }}>
                {info.subtitle}
              </p>
            </div>
            <button type="button" className="st-btn" onClick={() => dialogRef.current?.close()}>
              Tutup (Esc)
            </button>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 16px",
              borderBottom: "1px solid rgba(148, 163, 184, 0.12)",
            }}
          >
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari ticker atau sektor..."
              aria-label="Filter saham dalam kuadran"
              className="st-input"
              style={{ minWidth: "240px" }}
            />
            <div className="st-chip-row" aria-label="Filter konfirmasi Smart Money">
              <button type="button" className="st-chip" aria-pressed={minScore === 0} onClick={() => setMinScore(0)}>
                Semua ({stocks.length})
              </button>
              <button type="button" className="st-chip" aria-pressed={minScore === 2} onClick={() => setMinScore(2)}>
                2/3+ Confirmed
              </button>
              <button type="button" className="st-chip" aria-pressed={minScore === 3} onClick={() => setMinScore(3)}>
                3/3 Strong Confirmation
              </button>
            </div>
          </div>

          <div className="st-dialog-body">
            <div className="st-table-wrap" tabIndex={0} role="region" aria-labelledby="quadrant-modal-title">
              <table className="st-table st-table-fit">
                <thead>
                  <tr>
                    <th scope="col" aria-sort={sortKey === "ticker" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
                      <button type="button" className="st-th-sort-btn" onClick={() => toggleSort("ticker")}>
                        Ticker {sortKey === "ticker" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th scope="col">Sektor</th>
                    <th scope="col" className="st-num">Harga</th>
                    <th scope="col" className="st-num" aria-sort={sortKey === "change_percent" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
                      <button type="button" className="st-th-sort-btn" onClick={() => toggleSort("change_percent")}>
                        Chg% {sortKey === "change_percent" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th scope="col" className="st-num" aria-sort={sortKey === "smart_money_net" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
                      <button type="button" className="st-th-sort-btn" onClick={() => toggleSort("smart_money_net")}>
                        Smart Money {sortKey === "smart_money_net" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th scope="col" className="st-num" aria-sort={sortKey === "foreign_net" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
                      <button type="button" className="st-th-sort-btn" onClick={() => toggleSort("foreign_net")}>
                        Net Foreign {sortKey === "foreign_net" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th scope="col" className="st-num" aria-sort={sortKey === "turnover" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
                      <button type="button" className="st-th-sort-btn" onClick={() => toggleSort("turnover")}>
                        Valuasi {sortKey === "turnover" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th scope="col" aria-sort={sortKey === "smart_money_score" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
                      <button type="button" className="st-th-sort-btn" onClick={() => toggleSort("smart_money_score")}>
                        Skor SM {sortKey === "smart_money_score" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th scope="col">Regime</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSorted.map((s) => {
                    const sm = smartMoneyMeta(s.smart_money_score, s.smart_money_label);
                    const reg = stockRegimeMeta(s.regime, s.regime_action);
                    return (
                      <tr key={s.ticker}>
                        <td>
                          <Link
                            href={`/ticker/${s.ticker}`}
                            onClick={() => dialogRef.current?.close()}
                            style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}
                          >
                            {s.ticker}
                          </Link>
                          {s.active_signals.length > 0 ? (
                            <div className="st-muted" style={{ fontSize: "10px", color: "#c7d2fe" }}>
                              {s.active_signals.slice(0, 2).join(", ")}
                            </div>
                          ) : null}
                        </td>
                        <td className="st-muted">{s.sector}</td>
                        <td className="st-num">{formatPriceID(s.close)}</td>
                        <td className={`st-num ${s.change_percent >= 0 ? "st-pos" : "st-neg"}`}>
                          {formatPctID(s.change_percent, true)}
                        </td>
                        <td className={`st-num ${s.smart_money_net >= 0 ? "st-pos" : "st-neg"}`}>
                          {formatRupiahCompact(s.smart_money_net, true)}
                        </td>
                        <td className={`st-num ${s.foreign_net >= 0 ? "st-pos" : "st-neg"}`}>
                          {formatRupiahCompact(s.foreign_net, true)}
                        </td>
                        <td className="st-num st-muted">{formatRupiahCompact(s.turnover)}</td>
                        <td>
                          <span className={`st-badge ${sm.cls}`}>{sm.text}</span>
                        </td>
                        <td>
                          <span className={`st-badge ${reg.cls}`}>{reg.text}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAndSorted.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="st-muted" style={{ textAlign: "center", padding: "24px" }}>
                        Tidak ada emiten yang cocok dengan filter di kuadran ini.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
