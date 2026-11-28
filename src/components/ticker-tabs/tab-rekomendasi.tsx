"use client";

import React from "react";
import type { TickerIntelligencePayload } from "@/lib/ticker-intelligence";
import { formatPctID, formatPriceID } from "@/lib/format-id";
import type { TickerTabKey } from "@/components/ticker-tabs/types";

function toneClass(tone: string): string {
  if (tone === "bullish") return "st-pos";
  if (tone === "bearish") return "st-neg";
  if (tone === "caution") return "st-warn";
  return "";
}

function toneBorderClass(tone: string): string {
  if (tone === "bullish") return "st-tone-card-bull";
  if (tone === "bearish") return "st-tone-card-bear";
  if (tone === "caution") return "st-tone-card-caution";
  return "";
}

function toneBadgeClass(tone: string): string {
  if (tone === "bullish") return "st-badge-markup";
  if (tone === "bearish") return "st-badge-markdown";
  if (tone === "caution") return "st-badge-confirmed";
  return "st-badge-neutral";
}

export function TabRekomendasi({
  data,
  onSwitchTab,
}: {
  data: TickerIntelligencePayload;
  onSwitchTab: (tab: TickerTabKey) => void;
}) {
  const { recommendation: rec, technicalDetail: td } = data;

  return (
    <div className="st-intel-stack">
      {/* Hero Verdict Banner */}
      <div className={`st-subcard st-hero-verdict ${toneBorderClass(rec.tone)}`}>
        <div className="st-hero-verdict-main">
          <div className="st-eyebrow">REKOMENDASI TERPADU · 3-RULE + SMART MONEY + FLOW</div>
          <h2 className={`st-hero-verdict-title ${toneClass(rec.tone)}`}>{rec.verdict}</h2>
          <p className="st-hero-verdict-copy">{rec.headline}</p>
        </div>

        <div className="st-hero-price-box">
          <div className="st-hero-price-num st-tabular">{formatPriceID(td.close)}</div>
          <div className={`st-tabular ${td.change_pct >= 0 ? "st-pos" : "st-neg"}`} style={{ fontSize: "12.5px", fontWeight: 700 }}>
            {td.change_pct >= 0 ? "+" : ""}
            {formatPctID(td.change_pct, false)} vs prev
          </div>
          <div style={{ marginTop: "8px" }}>
            <span className={`st-badge ${toneBadgeClass(rec.tone)}`}>
              {rec.alignmentLabel === "SELARAS" ? "✓ " : rec.alignmentLabel === "PARSIAL" ? "◐ " : "◆ "}
              {rec.alignmentLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Kesimpulan Aksi Strip */}
      <div className="st-action-strip">
        <span className="st-eyebrow" style={{ color: "var(--muted)" }}>KESIMPULAN AKSI</span>
        <strong style={{ color: "#f8fafc", fontSize: "13px" }}>{rec.actionTitle}</strong>
        <span className="st-muted" style={{ marginLeft: "auto" }}>{rec.actionHint}</span>
      </div>

      {/* Evidence Drawer Block */}
      <div className="st-subcard">
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
          <div className="st-eyebrow">
            BUKTI PEMBENTUK REKOMENDASI{rec.evidenceAsOfDate ? ` · DATA ${rec.evidenceAsOfDate}` : ""}
          </div>
          <span className="st-badge st-badge-neutral">◐ DERIVED &amp; PROXY</span>
        </div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc", marginBottom: "4px" }}>
          {rec.evidenceHeadline}
        </div>
        <div className="st-muted" style={{ marginBottom: "12px" }}>{rec.evidenceDetail}</div>

        <div className="st-evidence-4grid">
          {rec.evidenceCards.map((ev, idx) => (
            <div key={`rec-ev-${idx}`} className={`st-ev-tile ${toneBorderClass(ev.tone)}`}>
              <div className="st-ev-tile-label">{ev.label}</div>
              <div className={`st-ev-tile-val st-tabular ${toneClass(ev.tone)}`}>{ev.value}</div>
              <div className="st-muted" style={{ fontSize: "10.5px" }}>{ev.meta}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Grid: BANDAR, BROKER, TEKNIKAL, SAHAMTEKNIKAL 3-RULE (Zero MaxV7!) */}
      <div className="st-status-4grid">
        {rec.statusCards.map((card) => (
          <div key={card.key} className={`st-subcard ${toneBorderClass(card.tone)}`}>
            <div className="st-eyebrow" style={{ fontSize: "10.5px" }}>{card.eyebrow}</div>
            <div className={toneClass(card.tone)} style={{ fontWeight: 800, fontSize: "14px", marginTop: "4px" }}>
              {card.title}
            </div>
            <div className="st-muted st-tabular" style={{ marginTop: "6px", lineHeight: 1.45 }}>
              {card.detail}
            </div>
          </div>
        ))}
      </div>

      {/* Supporting vs Holding Back 2-Column Decision Check */}
      <div className="st-contrib-columns">
        <div className="st-subcard st-tone-card-bull">
          <div className="st-eyebrow" style={{ color: "var(--green)", marginBottom: "8px" }}>
            ✓ YANG MENDUKUNG
          </div>
          <ul className="st-details-list" style={{ marginTop: 0 }}>
            {rec.supporting.map((item, idx) => (
              <li key={`sup-${idx}`}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="st-subcard st-tone-card-bear">
          <div className="st-eyebrow" style={{ color: "var(--red)", marginBottom: "8px" }}>
            ✕ YANG MASIH MENAHAN
          </div>
          <ul className="st-details-list" style={{ marginTop: 0 }}>
            {rec.holdingBack.map((item, idx) => (
              <li key={`hold-${idx}`}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Navigation Shortcuts */}
      <div className="st-chip-row">
        <button type="button" className="st-chip" onClick={() => onSwitchTab("bandar")}>
          Buka Tab Bandar →
        </button>
        <button type="button" className="st-chip" onClick={() => onSwitchTab("broker")}>
          Buka Tab Broker →
        </button>
        <button type="button" className="st-chip" onClick={() => onSwitchTab("teknikal")}>
          Buka Best Plan &amp; Chart →
        </button>
        <button type="button" className="st-chip" onClick={() => onSwitchTab("pro")}>
          Buka Pro Intel →
        </button>
      </div>
    </div>
  );
}
