"use client";

import React from "react";
import type { TickerIntelligencePayload } from "@/lib/ticker-intelligence";
import { formatPriceID, formatRupiahCompact } from "@/lib/format-id";

export function TabBroker({ data }: { data: TickerIntelligencePayload }) {
  const { broker } = data;
  const { zones15d, pressure, groupBattle, rotation, fingerprint } = broker;
  const accTop = Math.abs(broker.topAccumulators30d[0]?.netValue || 0);
  const distTop = Math.abs(broker.topDistributors30d[0]?.netValue || 0);
  const duelSum = Math.max(1, accTop + distTop);
  const buyPct = Math.round((accTop / duelSum) * 100);

  return (
    <div className="st-intel-stack">
      {/* Broker Verdict Banner */}
      <div className="st-subcard">
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
          <div>
            <div className="st-eyebrow">BROKER INTEL · {broker.dailySignal} · {broker.day30Signal}</div>
            <h2
              className={broker.tone === "bullish" ? "st-pos" : broker.tone === "bearish" ? "st-neg" : "st-warn"}
              style={{ margin: "4px 0", fontSize: "20px", fontWeight: 800 }}
            >
              {broker.verdict}
            </h2>
            <p className="st-muted" style={{ margin: 0 }}>{broker.headline}</p>
          </div>
          <span className="st-badge st-badge-neutral st-tabular">Confidence {broker.confidencePct.toFixed(1)}%</span>
        </div>
      </div>

      {/* Avg Buyer vs Seller Accumulation Zones (15D) */}
      <div className="st-contrib-columns">
        <div className="st-subcard st-tone-card-bull">
          <div className="st-eyebrow" style={{ color: "var(--green)" }}>
            AREA AKUMULASI BROKER ({zones15d.periodDays}D)
          </div>
          {zones15d.accumulation ? (
            <>
              <div style={{ fontSize: "20px", fontWeight: 800, marginTop: "6px" }} className="st-tabular">
                Avg {formatPriceID(zones15d.accumulation.avg)}
              </div>
              <div className="st-muted st-tabular" style={{ marginTop: "4px" }}>
                Band {formatPriceID(zones15d.accumulation.low)}–{formatPriceID(zones15d.accumulation.high)} · {zones15d.accumulation.activeBrokers} broker ({zones15d.accumulation.strength})
              </div>
              <div className="st-pos st-tabular" style={{ fontWeight: 700, fontSize: "13px", marginTop: "6px" }}>
                Total Net Buy: {formatRupiahCompact(zones15d.accumulation.totalNetValue, true)}
              </div>
            </>
          ) : (
            <div className="st-muted" style={{ marginTop: "8px" }}>Zona akumulasi 15D belum terbentuk kuat.</div>
          )}
        </div>

        <div className="st-subcard st-tone-card-bear">
          <div className="st-eyebrow" style={{ color: "var(--red)" }}>
            AREA DISTRIBUSI BROKER ({zones15d.periodDays}D)
          </div>
          {zones15d.distribution ? (
            <>
              <div style={{ fontSize: "20px", fontWeight: 800, marginTop: "6px" }} className="st-tabular">
                Avg {formatPriceID(zones15d.distribution.avg)}
              </div>
              <div className="st-muted st-tabular" style={{ marginTop: "4px" }}>
                Band {formatPriceID(zones15d.distribution.low)}–{formatPriceID(zones15d.distribution.high)} · {zones15d.distribution.activeBrokers} broker ({zones15d.distribution.strength})
              </div>
              <div className="st-neg st-tabular" style={{ fontWeight: 700, fontSize: "13px", marginTop: "6px" }}>
                Total Net Sell: {formatRupiahCompact(zones15d.distribution.totalNetValue, true)}
              </div>
            </>
          ) : (
            <div className="st-muted" style={{ marginTop: "8px" }}>Zona distribusi 15D belum terbentuk kuat.</div>
          )}
        </div>
      </div>

      {/* 30D Top Buyer vs Top Seller Duel Bar */}
      <div className="st-subcard">
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
          <strong className="st-pos st-tabular">
            Top Accumulator 30D: {broker.topAccumulators30d[0]?.code || "-"} ({formatRupiahCompact(accTop, true)})
          </strong>
          <strong className="st-neg st-tabular">
            Top Distributor 30D: {broker.topDistributors30d[0]?.code || "-"} ({formatRupiahCompact(-distTop, true)})
          </strong>
        </div>
        <div className="st-duel-bar" aria-label={`Dominasi Top Buyer ${buyPct}% vs Seller ${100 - buyPct}%`}>
          <div className="st-duel-buy" style={{ width: `${buyPct}%` }} />
          <div className="st-duel-sell" style={{ width: `${100 - buyPct}%` }} />
        </div>
      </div>

      {/* Daily Buyers vs Daily Sellers Quick Tables */}
      <div className="st-contrib-columns">
        <div className="st-subcard">
          <div className="st-eyebrow" style={{ color: "var(--green)", marginBottom: "6px" }}>Daily Buyers (1D)</div>
          <div className="st-table-wrap">
            <table className="st-table st-table-fit">
              <thead>
                <tr><th>Broker</th><th className="st-num">Net Value</th><th className="st-num">Avg</th></tr>
              </thead>
              <tbody>
                {broker.dailyBuyers.map((b, i) => (
                  <tr key={`db-${b.code}-${i}`}>
                    <td><strong>{b.code}</strong></td>
                    <td className="st-num st-pos">{formatRupiahCompact(b.netValue, true)}</td>
                    <td className="st-num st-muted">{b.avgPrice ? formatPriceID(b.avgPrice) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="st-subcard">
          <div className="st-eyebrow" style={{ color: "var(--red)", marginBottom: "6px" }}>Daily Sellers (1D)</div>
          <div className="st-table-wrap">
            <table className="st-table st-table-fit">
              <thead>
                <tr><th>Broker</th><th className="st-num">Net Value</th><th className="st-num">Avg</th></tr>
              </thead>
              <tbody>
                {broker.dailySellers.map((s, i) => (
                  <tr key={`ds-${s.code}-${i}`}>
                    <td><strong>{s.code}</strong></td>
                    <td className="st-num st-neg">{formatRupiahCompact(s.netValue, true)}</td>
                    <td className="st-num st-muted">{s.avgPrice ? formatPriceID(s.avgPrice) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Collapsible Bukti Broker Lanjutan (Accordion) */}
      <details className="st-accordion-details">
        <summary className="st-accordion-summary">
          Bukti Broker Lanjutan — Top Duel 30D, Absorption vs Distribution, Group Battle &amp; Rotasi
        </summary>
        <div className="st-accordion-body">
          {/* Group Battle & Pressure Strip */}
          <div className="st-status-4grid" style={{ marginBottom: "12px" }}>
            <div className="st-subcard">
              <div className="st-eyebrow">GROUP BATTLE</div>
              <div style={{ fontWeight: 700, marginTop: "4px" }}>{groupBattle.dominantGroup}</div>
              <div className="st-muted st-tabular" style={{ marginTop: "4px" }}>
                Asing {formatRupiahCompact(groupBattle.asingNet, true)} · BUMN {formatRupiahCompact(groupBattle.bumnNet, true)}
              </div>
            </div>
            <div className="st-subcard">
              <div className="st-eyebrow">ABSORPTION SCORE</div>
              <div style={{ fontWeight: 700, marginTop: "4px" }} className="st-tabular">
                {pressure.avgAbsorptionScore.toFixed(1)} · {pressure.latestLabel}
              </div>
              <div className="st-muted st-tabular">Acc {pressure.accumulationDays}H · Dist {pressure.distributionDays}H · Abs {pressure.absorptionDays}H</div>
            </div>
            <div className="st-subcard">
              <div className="st-eyebrow">ROTASI BROKER</div>
              <div style={{ fontWeight: 700, marginTop: "4px" }}>{rotation.verdict}</div>
              <div className="st-muted">{rotation.notable.length} perubahan peran signifikan</div>
            </div>
            <div className="st-subcard">
              <div className="st-eyebrow">FINGERPRINT</div>
              <div style={{ fontWeight: 700, marginTop: "4px" }}>{fingerprint.actorClass}</div>
              <div className="st-muted">Buyer {fingerprint.topBuyerCode} vs Seller {fingerprint.topSellerCode}</div>
            </div>
          </div>

          {/* 30D Accumulators vs Distributors Tables */}
          <div className="st-contrib-columns" style={{ marginBottom: "12px" }}>
            <div className="st-table-wrap">
              <table className="st-table st-table-fit">
                <caption>Top Accumulators (30D)</caption>
                <thead><tr><th>Broker</th><th>Grup</th><th className="st-num">Net 30D</th><th className="st-num">Hari</th></tr></thead>
                <tbody>
                  {broker.topAccumulators30d.map((r) => (
                    <tr key={`a30-${r.code}`}>
                      <td><strong>{r.code}</strong></td>
                      <td className="st-muted">{r.group}</td>
                      <td className="st-num st-pos">{formatRupiahCompact(r.netValue, true)}</td>
                      <td className="st-num st-muted">{r.activeDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="st-table-wrap">
              <table className="st-table st-table-fit">
                <caption>Top Distributors (30D)</caption>
                <thead><tr><th>Broker</th><th>Grup</th><th className="st-num">Net 30D</th><th className="st-num">Hari</th></tr></thead>
                <tbody>
                  {broker.topDistributors30d.map((r) => (
                    <tr key={`d30-${r.code}`}>
                      <td><strong>{r.code}</strong></td>
                      <td className="st-muted">{r.group}</td>
                      <td className="st-num st-neg">{formatRupiahCompact(r.netValue, true)}</td>
                      <td className="st-num st-muted">{r.activeDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rotation Flips */}
          {rotation.notable.length > 0 ? (
            <div className="st-table-wrap">
              <table className="st-table st-table-fit">
                <caption>Perubahan Peran Broker (Rotation Evidence)</caption>
                <thead>
                  <tr><th>Broker</th><th>Transisi</th><th>Label Rotasi</th><th className="st-num">Delta Net</th><th className="st-num">Konsistensi</th></tr>
                </thead>
                <tbody>
                  {rotation.notable.map((rot, idx) => (
                    <tr key={`rot-${rot.brokerCode}-${idx}`}>
                      <td><strong>{rot.brokerCode}</strong></td>
                      <td className="st-muted">{rot.fromStatus} → {rot.toStatus}</td>
                      <td>
                        <span className={`st-badge ${rot.rotationLabel.includes("ACCUM") ? "st-badge-markup" : rot.rotationLabel.includes("DIST") ? "st-badge-markdown" : "st-badge-neutral"}`}>
                          {rot.rotationLabel}
                        </span>
                      </td>
                      <td className={`st-num ${rot.deltaNetValue >= 0 ? "st-pos" : "st-neg"}`}>
                        {formatRupiahCompact(rot.deltaNetValue, true)}
                      </td>
                      <td className="st-num st-muted">{rot.toConsistencyScore.toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </details>
    </div>
  );
}
