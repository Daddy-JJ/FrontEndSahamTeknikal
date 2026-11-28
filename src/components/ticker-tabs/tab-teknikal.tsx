"use client";

import React from "react";
import type { TickerIntelligencePayload } from "@/lib/ticker-intelligence";
import { TickerChartCanvas } from "@/components/ticker-chart-canvas";
import { SIGNAL_DISPLAY_META } from "@/lib/screener-types";
import { formatPriceID, smartMoneyMeta, stockRegimeMeta } from "@/lib/format-id";

export function TabTeknikal({ data }: { data: TickerIntelligencePayload }) {
  const { technical, technicalDetail: td } = data;
  const { momentumStrip: ms, bestPlan: plan, emaStack, scenarios } = technical;
  const lastFractal = td.fractals[td.fractals.length - 1];

  return (
    <div className="st-intel-stack">
      {/* Interactive Full Technical Chart */}
      <TickerChartCanvas
        data={td}
        height={500}
        defaultRange={130}
        title={`Grafik Harga, EMA 21/50/200, Supertrend, Fractal, Fibonacci & MACD — ${data.ticker}`}
      />

      {/* Signal & Momentum Strip */}
      <div className="st-subcard">
        <div className="st-eyebrow" style={{ marginBottom: "8px" }}>
          ■ SIGNAL &amp; MOMENTUM · KONFLUENSI INDIKATOR
        </div>
        <div className="st-momentum-strip">
          <div className="st-mom-cell">
            <div className="st-ev-tile-label">SIGNAL SAHAMTEKNIKAL</div>
            <div className={`st-mom-val ${ms.activeSignalTone === "bullish" ? "st-pos" : ""}`}>
              {ms.activeSignalLabel}
            </div>
            <div className="st-muted" style={{ fontSize: "10.5px" }}>3-Rule Engine</div>
          </div>

          <div className="st-mom-cell">
            <div className="st-ev-tile-label">REGIME</div>
            <div className={`st-mom-val ${ms.regime === "MARKUP" ? "st-pos" : ms.regime === "MARKDOWN" ? "st-neg" : "st-warn"}`}>
              {ms.regime}
            </div>
            <div className="st-muted" style={{ fontSize: "10.5px" }}>{ms.regimeAction}</div>
          </div>

          <div className="st-mom-cell">
            <div className="st-ev-tile-label">RSI (14)</div>
            <div className="st-mom-val st-tabular">
              {ms.rsi14 !== null ? ms.rsi14.toFixed(1) : "-"}
            </div>
            <div className="st-muted" style={{ fontSize: "10.5px" }}>{ms.rsiZone}</div>
          </div>

          <div className="st-mom-cell">
            <div className="st-ev-tile-label">ADX (14)</div>
            <div className="st-mom-val st-tabular">
              {ms.adx14 !== null ? ms.adx14.toFixed(1) : "-"}
            </div>
            <div className="st-muted st-tabular" style={{ fontSize: "10.5px" }}>
              {ms.adxStrength} {ms.plusDi !== null && ms.minusDi !== null ? `(+DI ${ms.plusDi.toFixed(0)} / -DI ${ms.minusDi.toFixed(0)})` : ""}
            </div>
          </div>

          <div className="st-mom-cell">
            <div className="st-ev-tile-label">TREND SHORT / MED / LONG</div>
            <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
              <span className={`st-badge ${ms.trendShort === "UP" ? "st-badge-markup" : "st-badge-markdown"}`} style={{ fontSize: "10px", padding: "2px 6px" }}>
                S {ms.trendShort}
              </span>
              <span className={`st-badge ${ms.trendMedium === "UP" ? "st-badge-markup" : "st-badge-markdown"}`} style={{ fontSize: "10px", padding: "2px 6px" }}>
                M {ms.trendMedium}
              </span>
              <span className={`st-badge ${ms.trendLong === "UP" ? "st-badge-markup" : "st-badge-markdown"}`} style={{ fontSize: "10px", padding: "2px 6px" }}>
                L {ms.trendLong}
              </span>
            </div>
          </div>

          <div className="st-mom-cell">
            <div className="st-ev-tile-label">VOLUME RATIO</div>
            <div className={`st-mom-val st-tabular ${ms.volumeSignal === "HIGH" ? "st-warn" : ""}`}>
              {ms.volumeRatio !== null ? `${ms.volumeRatio.toFixed(2)}x` : "-"}
            </div>
            <div className="st-muted" style={{ fontSize: "10.5px" }}>{ms.volumeSignal}</div>
          </div>
        </div>
      </div>

      {/* Best Trading Plan Card */}
      <div className={`st-subcard ${plan.roleTone === "bullish" ? "st-tone-card-bull" : plan.roleTone === "bearish" ? "st-tone-card-bear" : "st-tone-card-caution"}`}>
        <div className="st-card-header">
          <div>
            <div className="st-eyebrow">{plan.modeLabel}</div>
            <h2 className="st-title-md" style={{ marginTop: "3px" }}>{plan.title}</h2>
            <div className="st-muted" style={{ marginTop: "4px" }}>{plan.subtitle}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span className={`st-badge ${plan.roleTone === "bullish" ? "st-badge-markup" : plan.roleTone === "bearish" ? "st-badge-markdown" : "st-badge-confirmed"}`}>
              {plan.roleLabel}
            </span>
            <div className="st-cal-kpi-val st-tabular" style={{ fontSize: "20px", marginTop: "6px" }}>
              {plan.confidenceScore}/100
            </div>
            <div className="st-muted" style={{ fontSize: "10.5px" }}>Kelayakan Setup</div>
          </div>
        </div>

        <div className="st-plan-6grid">
          <div className="st-ev-tile">
            <div className="st-ev-tile-label">{plan.entryLabel}</div>
            <div className="st-ev-tile-val st-tabular">{formatPriceID(plan.entryCenter)}</div>
            <div className="st-muted st-tabular" style={{ fontSize: "10.5px" }}>
              Band {formatPriceID(plan.entryBandLow)}–{formatPriceID(plan.entryBandHigh)} ({plan.entrySource})
            </div>
          </div>

          <div className="st-ev-tile">
            <div className="st-ev-tile-label">{plan.waitOnly ? "BATAS RISIKO PANTAU" : "INVALIDASI / SL"}</div>
            <div className="st-ev-tile-val st-tabular st-neg">{formatPriceID(plan.sl)}</div>
            <div className="st-muted" style={{ fontSize: "10.5px" }}>{plan.slSource}</div>
          </div>

          <div className="st-ev-tile">
            <div className="st-ev-tile-label">TARGET 1 (TP1)</div>
            <div className="st-ev-tile-val st-tabular st-pos">{formatPriceID(plan.tp1)}</div>
            <div className="st-muted" style={{ fontSize: "10.5px" }}>{plan.tp1Source}</div>
          </div>

          <div className="st-ev-tile">
            <div className="st-ev-tile-label">TARGET 2 (TP2)</div>
            <div className="st-ev-tile-val st-tabular st-pos">{formatPriceID(plan.tp2)}</div>
            <div className="st-muted" style={{ fontSize: "10.5px" }}>{plan.tp2Source}</div>
          </div>

          <div className="st-ev-tile">
            <div className="st-ev-tile-label">R:R TP1</div>
            <div className="st-ev-tile-val st-tabular" style={{ color: "var(--accent)" }}>
              {plan.rr1.toFixed(2)}x
            </div>
            <div className="st-muted" style={{ fontSize: "10.5px" }}>Reward vs risk SL</div>
          </div>

          <div className="st-ev-tile">
            <div className="st-ev-tile-label">R:R TP2</div>
            <div className="st-ev-tile-val st-tabular" style={{ color: "var(--accent)" }}>
              {plan.rr2.toFixed(2)}x
            </div>
            <div className="st-muted" style={{ fontSize: "10.5px" }}>Target lanjutan</div>
          </div>
        </div>

        <div className="st-plan-basis-3grid">
          <div className="st-subcard">
            <div className="st-eyebrow">BASIS LEVEL</div>
            <ul className="st-details-list">
              {plan.basis.map((b, i) => <li key={`pb-${i}`}>{b}</li>)}
            </ul>
          </div>
          <div className="st-subcard">
            <div className="st-eyebrow" style={{ color: "var(--green)" }}>KONFIRMASI WAJIB</div>
            <ul className="st-details-list">
              {plan.confirmations.map((c, i) => <li key={`pc-${i}`}>{c}</li>)}
            </ul>
          </div>
          <div className="st-subcard">
            <div className="st-eyebrow" style={{ color: "var(--red)" }}>BATALKAN / RISIKO</div>
            <ul className="st-details-list">
              {plan.risks.map((r, i) => <li key={`pr-${i}`}>{r}</li>)}
            </ul>
          </div>
        </div>
      </div>

      {/* EMA Structure + Pivot & Fibonacci Map */}
      <div className="st-contrib-columns">
        <div className="st-subcard">
          <div className="st-eyebrow">STRUKTUR EMA &amp; PIVOT HARIAN</div>
          <div style={{ fontWeight: 700, marginTop: "4px" }}>{emaStack.alignmentLabel}</div>
          <div className="st-muted" style={{ marginBottom: "10px" }}>{emaStack.priceVsEma}</div>
          <div className="st-table-wrap">
            <table className="st-table st-table-fit">
              <tbody>
                <tr><td>EMA 21 (Short)</td><td className="st-num">{formatPriceID(emaStack.ema21)}</td></tr>
                <tr><td>EMA 50 (Medium)</td><td className="st-num">{formatPriceID(emaStack.ema50)}</td></tr>
                <tr><td>EMA 200 (Long)</td><td className="st-num">{formatPriceID(emaStack.ema200)}</td></tr>
                <tr><td>Fractal Ceiling / Floor</td><td className="st-num">{formatPriceID(lastFractal?.ceiling)} / {formatPriceID(lastFractal?.floor)}</td></tr>
                {td.pivots ? (
                  <>
                    <tr><td>Pivot R2 / R1</td><td className="st-num st-pos">{formatPriceID(td.pivots.r2)} / {formatPriceID(td.pivots.r1)}</td></tr>
                    <tr><td>Pivot Harian (P)</td><td className="st-num">{formatPriceID(td.pivots.p)}</td></tr>
                    <tr><td>Pivot S1 / S2</td><td className="st-num st-neg">{formatPriceID(td.pivots.s1)} / {formatPriceID(td.pivots.s2)}</td></tr>
                  </>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="st-subcard">
          <div className="st-eyebrow">
            PETA FIBONACCI ({td.fibonacci ? `${td.fibonacci.lookback} HARI TERAKHIR` : "RETRACEMENT"})
          </div>
          {td.fibonacci ? (
            <>
              <div className="st-muted st-tabular" style={{ margin: "4px 0 10px" }}>
                Swing Low {formatPriceID(td.fibonacci.low)} → Swing High {formatPriceID(td.fibonacci.high)}
              </div>
              <div className="st-table-wrap">
                <table className="st-table st-table-fit">
                  <thead>
                    <tr><th>Rasio</th><th className="st-num">Harga</th><th className="st-num">Jarak vs Close</th></tr>
                  </thead>
                  <tbody>
                    {td.fibonacci.levels.map((lv) => {
                      const diffPct = td.close > 0 ? ((lv.price - td.close) / td.close) * 100 : 0;
                      return (
                        <tr key={`fibo-${lv.ratio}`}>
                          <td><strong>{lv.label}</strong></td>
                          <td className="st-num">{formatPriceID(lv.price)}</td>
                          <td className={`st-num ${diffPct >= 0 ? "st-pos" : "st-neg"}`}>
                            {diffPct >= 0 ? "+" : ""}{diffPct.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="st-muted" style={{ marginTop: "8px" }}>Histori harga belum cukup untuk Fibonacci retracement.</div>
          )}
        </div>
      </div>

      {/* Peta Skenario Teknikal (3 Scenarios) */}
      <div className="st-plan-basis-3grid">
        {scenarios.map((sc, idx) => (
          <div key={`sc-${idx}`} className={`st-subcard ${sc.tone === "bullish" ? "st-tone-card-bull" : sc.tone === "bearish" ? "st-tone-card-bear" : "st-tone-card-caution"}`}>
            <div className="st-eyebrow">{sc.title}</div>
            <div className="st-muted" style={{ marginTop: "6px", lineHeight: 1.5 }}>
              <div><strong>Pemicu:</strong> {sc.trigger}</div>
              <div style={{ marginTop: "4px" }}><strong>Target:</strong> {sc.target}</div>
              <div style={{ marginTop: "4px" }}><strong>Invalidasi:</strong> {sc.invalidation}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Historical Signals */}
      <div className="st-subcard">
        <div className="st-eyebrow" style={{ marginBottom: "8px" }}>
          RIWAYAT SINYAL 3-RULE SAHAMTEKNIKAL PADA {data.ticker} ({td.signals.length})
        </div>
        <div className="st-table-wrap" tabIndex={0} role="region" aria-label="Daftar sinyal screener emiten">
          <table className="st-table st-table-fit">
            <thead>
              <tr>
                <th>Tanggal</th><th>Strategi</th><th className="st-num">Entry</th><th className="st-num">SL</th><th className="st-num">TP1</th><th className="st-num">TP2</th><th>Smart Money</th><th>Regime</th>
              </tr>
            </thead>
            <tbody>
              {td.signals.map((s) => {
                const sm = smartMoneyMeta(s.smart_money_score, s.smart_money_label);
                const reg = stockRegimeMeta(s.regime, s.regime_action);
                return (
                  <tr key={`${s.signal_date}-${s.signal_type}`}>
                    <td className="st-muted">{s.signal_date}</td>
                    <td><span className="st-badge st-badge-strategy">{SIGNAL_DISPLAY_META[s.signal_type]?.label || s.signal_type}</span></td>
                    <td className="st-num">{formatPriceID(s.entry_price)}</td>
                    <td className="st-num st-neg">{formatPriceID(s.stop_loss)}</td>
                    <td className="st-num st-pos">{formatPriceID(s.tp1)}</td>
                    <td className="st-num" style={{ color: "var(--accent)" }}>{formatPriceID(s.tp2)}</td>
                    <td><span className={`st-badge ${sm.cls}`}>{sm.text}</span></td>
                    <td><span className={`st-badge ${reg.cls}`}>{reg.text}</span></td>
                  </tr>
                );
              })}
              {td.signals.length === 0 ? (
                <tr><td colSpan={8} className="st-muted" style={{ textAlign: "center", padding: "18px" }}>Belum ada sinyal breakout/akumulasi baru tercatat pada rentang arsip.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
