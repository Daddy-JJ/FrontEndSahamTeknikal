"use client";

import React, { useState } from "react";
import { QUADRANT_LABELS, type QuadrantId, type QuadrantStockItem } from "@/lib/screener-types";
import { formatPctID, formatRupiahCompact } from "@/lib/format-id";
import { QuadrantAllModal } from "@/components/quadrant-all-modal";

interface MarketQuadrantMapProps {
  counts: Record<QuadrantId, number>;
  stocksByQuadrant: Record<QuadrantId, QuadrantStockItem[]>;
}

const QUADRANT_ORDER: QuadrantId[] = [
  "markup_akumulasi",
  "markup_distribusi",
  "markdown_akumulasi",
  "markdown_distribusi",
];

function quadrantToneColor(id: QuadrantId): string {
  if (id === "markup_akumulasi") return "var(--green)";
  if (id === "markup_distribusi") return "var(--amber)";
  if (id === "markdown_akumulasi") return "var(--accent)";
  return "var(--red)";
}

export function MarketQuadrantMap({ counts, stocksByQuadrant }: MarketQuadrantMapProps) {
  const [selectedQuadrant, setSelectedQuadrant] = useState<QuadrantId | null>(null);
  const totalTickers = QUADRANT_ORDER.reduce((sum, q) => sum + (stocksByQuadrant[q]?.length ?? counts[q] ?? 0), 0);

  return (
    <section className="st-card" aria-label="Peta Kuadran Smart Money Pasar">
      <div className="st-card-header">
        <div>
          <div className="st-eyebrow">BANDARMOLOGY × PRICE ACTION ({totalTickers} SAHAM)</div>
          <h2 className="st-title-md">Market Quadrant Map — Klik Kuadran untuk Daftar Lengkap</h2>
        </div>
        <span className="st-muted">Menampilkan seluruh emiten (bukan top 8)</span>
      </div>

      <div className="st-quadrant-grid">
        {QUADRANT_ORDER.map((qId) => {
          const info = QUADRANT_LABELS[qId];
          const stocks = stocksByQuadrant[qId] ?? [];
          const count = stocks.length || counts[qId] || 0;
          const strongCount = stocks.filter((s) => s.smart_money_score >= 3).length;
          const netFlow = stocks.reduce((acc, s) => acc + (s.smart_money_net ?? 0), 0);
          const tone = quadrantToneColor(qId);

          return (
            <button
              key={qId}
              type="button"
              className="st-quadrant-card"
              onClick={() => setSelectedQuadrant(qId)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "8px" }}>
                <strong style={{ fontSize: "13px", color: tone }}>{info.title}</strong>
                <span className="st-badge" style={{ color: tone, borderColor: tone }}>
                  {count} emiten
                </span>
              </div>

              <div className="st-muted" style={{ fontSize: "11.5px", lineHeight: 1.35 }}>
                {info.subtitle}
              </div>

              <div className="st-muted st-tabular" style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <span>Arus Net Kuadran:</span>
                <strong className={netFlow >= 0 ? "st-pos" : "st-neg"}>
                  {formatRupiahCompact(netFlow, true)}
                </strong>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "2px" }}>
                {stocks.slice(0, 6).map((s) => (
                  <span
                    key={s.ticker}
                    className="st-badge"
                    style={{ fontSize: "10.5px", padding: "2px 6px", color: "#e2e8f0" }}
                  >
                    {s.ticker}{" "}
                    <span className={s.change_percent >= 0 ? "st-pos" : "st-neg"}>
                      {formatPctID(s.change_percent, true)}
                    </span>
                  </span>
                ))}
                {count > 6 ? (
                  <span className="st-muted" style={{ fontSize: "11px", alignSelf: "center" }}>
                    +{count - 6} lainnya →
                  </span>
                ) : null}
              </div>

              <div className="st-muted" style={{ fontSize: "10.5px", borderTop: "1px solid rgba(148,163,184,0.12)", paddingTop: "6px", width: "100%", display: "flex", justifyContent: "space-between" }}>
                <span>{info.badge}</span>
                <span>{strongCount} skor 3/3 · Lihat semua →</span>
              </div>
            </button>
          );
        })}
      </div>

      <QuadrantAllModal
        quadrantId={selectedQuadrant}
        stocks={selectedQuadrant ? (stocksByQuadrant[selectedQuadrant] ?? []) : []}
        onClose={() => setSelectedQuadrant(null)}
      />
    </section>
  );
}
