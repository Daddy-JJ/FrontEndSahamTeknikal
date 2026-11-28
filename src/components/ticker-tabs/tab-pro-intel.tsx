"use client";

import React from "react";
import type { TickerIntelligencePayload } from "@/lib/ticker-intelligence";
import { formatPriceID, formatRupiahCompact } from "@/lib/format-id";

export function TabProIntel({ data }: { data: TickerIntelligencePayload }) {
  const { proIntel, technical, broker } = data;
  const z = broker.zones15d;

  return (
    <div className="st-intel-stack">
      {/* Pro Conclusion Card (Synthesized without MaxV7) */}
      <div className={`st-subcard ${proIntel.conclusionTone === "bullish" ? "st-tone-card-bull" : proIntel.conclusionTone === "bearish" ? "st-tone-card-bear" : "st-tone-card-caution"}`}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <div className="st-eyebrow">PRO INTEL · ANALISA TERSTRUKTUR HARGA VS SMART MONEY</div>
          <span className="st-badge st-badge-neutral">◐ DERIVED &amp; PROXY</span>
        </div>
        <h2 style={{ margin: "6px 0 4px", fontSize: "19px", fontWeight: 800, color: "#f8fafc" }}>
          {proIntel.conclusionTitle}
        </h2>
        <p className="st-muted" style={{ margin: 0, lineHeight: 1.55 }}>{proIntel.conclusionDetail}</p>
      </div>

      {/* Why Moved + Flow Story 1D / 5D / 30D */}
      <div className="st-contrib-columns">
        <div className="st-subcard">
          <div className="st-eyebrow">{proIntel.whyMoved.title}</div>
          <div style={{ fontWeight: 700, fontSize: "15px", marginTop: "4px" }}>
            Pola Pasar: {proIntel.whyMoved.verdict}
          </div>
          <p className="st-muted" style={{ marginTop: "6px", lineHeight: 1.5 }}>{proIntel.whyMoved.narrative}</p>
          {proIntel.whyMoved.drivers.length > 0 ? (
            <div className="st-chip-row" style={{ marginTop: "8px" }}>
              {proIntel.whyMoved.drivers.map((drv, idx) => (
                <span key={`drv-${idx}`} className="st-badge st-badge-neutral">{drv}</span>
              ))}
            </div>
          ) : null}
          <div className="st-muted" style={{ fontSize: "10.5px", marginTop: "8px" }}>{proIntel.whyMoved.source}</div>
        </div>

        <div className="st-subcard">
          <div className="st-eyebrow">FLOW STORY 1D / 5D / 30D · {proIntel.flowStory.divergenceNote}</div>
          <div className="st-evidence-4grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginTop: "8px" }}>
            <div className="st-ev-tile">
              <div className="st-ev-tile-label">1D FLOW</div>
              <div className={`st-ev-tile-val st-tabular ${proIntel.flowStory.net1d >= 0 ? "st-pos" : "st-neg"}`}>
                {formatRupiahCompact(proIntel.flowStory.net1d, true)}
              </div>
            </div>
            <div className="st-ev-tile">
              <div className="st-ev-tile-label">5D FLOW</div>
              <div className={`st-ev-tile-val st-tabular ${proIntel.flowStory.net5d >= 0 ? "st-pos" : "st-neg"}`}>
                {formatRupiahCompact(proIntel.flowStory.net5d, true)}
              </div>
            </div>
            <div className="st-ev-tile">
              <div className="st-ev-tile-label">30D FLOW</div>
              <div className={`st-ev-tile-val st-tabular ${proIntel.flowStory.net30d >= 0 ? "st-pos" : "st-neg"}`}>
                {formatRupiahCompact(proIntel.flowStory.net30d, true)}
              </div>
            </div>
          </div>
          <div className="st-muted" style={{ marginTop: "8px", lineHeight: 1.5 }}>{proIntel.flowStory.summary}</div>
        </div>
      </div>

      {/* S1 Confluence + Retail Proxy + 15D Area */}
      <div className="st-plan-basis-3grid">
        <div className="st-subcard">
          <div className="st-eyebrow">S1 CONFLUENCE (WEEKLY / MONTHLY)</div>
          {proIntel.s1Confluence ? (
            <>
              <div style={{ fontWeight: 700, fontSize: "15px", marginTop: "6px" }}>
                {proIntel.s1Confluence.position}
              </div>
              <div className="st-muted st-tabular" style={{ marginTop: "4px" }}>
                Weekly S1 {formatPriceID(proIntel.s1Confluence.weeklyS1)} · Monthly S1 {formatPriceID(proIntel.s1Confluence.monthlyS1)}
              </div>
              <div className="st-muted" style={{ marginTop: "6px" }}>{proIntel.s1Confluence.summary}</div>
            </>
          ) : (
            <div className="st-muted" style={{ marginTop: "6px" }}>
              Pivot S1 Harian {formatPriceID(data.technicalDetail.pivots?.s1)} · EMA21 {formatPriceID(technical.emaStack.ema21)}
            </div>
          )}
        </div>

        <div className="st-subcard">
          <div className="st-eyebrow">RETAIL CROWD PROXY (RESIDUAL)</div>
          {proIntel.retailProxy ? (
            <>
              <div style={{ fontWeight: 700, fontSize: "15px", marginTop: "6px" }}>
                {proIntel.retailProxy.label}
              </div>
              <div className={`st-tabular ${proIntel.retailProxy.netValue >= 0 ? "st-pos" : "st-neg"}`} style={{ fontWeight: 700, marginTop: "4px" }}>
                Net Proxy: {formatRupiahCompact(proIntel.retailProxy.netValue, true)}
              </div>
              <div className="st-muted" style={{ fontSize: "11px", marginTop: "6px" }}>{proIntel.retailProxy.source}</div>
            </>
          ) : (
            <div className="st-muted" style={{ marginTop: "6px" }}>Estimasi residual ritel tidak tersedia pada mode fallback.</div>
          )}
        </div>

        <div className="st-subcard">
          <div className="st-eyebrow">AREA BROKER / BANDAR ({z.periodDays}D)</div>
          <div style={{ fontWeight: 700, fontSize: "15px", marginTop: "6px" }}>{z.smartMoneyPosition}</div>
          <div className="st-muted st-tabular" style={{ marginTop: "4px" }}>
            {z.accumulation ? `Area Beli ${formatPriceID(z.accumulation.low)}–${formatPriceID(z.accumulation.high)}` : "Belum ada zona beli kuat"}
          </div>
          <div className="st-muted st-tabular" style={{ marginTop: "4px" }}>
            {z.distribution ? `Area Jual ${formatPriceID(z.distribution.low)}–${formatPriceID(z.distribution.high)}` : ""}
          </div>
        </div>
      </div>

      {/* Risk Radar + Bandar Alerts + Data Consistency */}
      <div className="st-contrib-columns">
        <div className="st-subcard">
          <div className="st-eyebrow">RISK RADAR &amp; ALERT BANDAR</div>
          <div style={{ fontWeight: 700, marginTop: "4px" }}>Status: {proIntel.riskRadar.verdict}</div>
          <div className="st-muted" style={{ fontSize: "11px", marginTop: "4px" }}>{proIntel.riskRadar.caveat}</div>
          <ul className="st-details-list">
            {proIntel.bandarAlerts.map((a, i) => (
              <li key={`pa-${i}`}><strong>{a.title}:</strong> {a.detail}</li>
            ))}
            {proIntel.riskRadar.flags.map((f, i) => (
              <li key={`pf-${i}`}>{f}</li>
            ))}
            {proIntel.bandarAlerts.length === 0 && proIntel.riskRadar.flags.length === 0 ? (
              <li>Tidak ada anomali atau flip ekstrem yang terdeteksi hari ini.</li>
            ) : null}
          </ul>
        </div>

        <div className="st-subcard">
          <div className="st-eyebrow">DATA STATUS &amp; KONSISTENSI</div>
          <div style={{ fontWeight: 700, marginTop: "4px" }}>{proIntel.dataConsistency.coverageLabel}</div>
          <ul className="st-details-list">
            {proIntel.dataConsistency.warnings.map((w, i) => (
              <li key={`dw-${i}`} className="st-warn">{w}</li>
            ))}
            {proIntel.dataConsistency.warnings.length === 0 ? (
              <li>Seluruh panel sinkron terhadap penutupan pasar terbaru ({data.technicalDetail.latest_date}).</li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
