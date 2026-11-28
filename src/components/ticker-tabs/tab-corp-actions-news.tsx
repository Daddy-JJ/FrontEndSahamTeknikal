"use client";

import React from "react";
import Link from "next/link";
import type { TickerIntelligencePayload } from "@/lib/ticker-intelligence";

export function TabAksiKorporasi({ data }: { data: TickerIntelligencePayload }) {
  const { corporateActions } = data;

  return (
    <div className="st-intel-stack">
      <div className="st-subcard">
        <div className="st-card-header">
          <div>
            <div className="st-eyebrow">AKSI KORPORASI EMITEN · {data.ticker}</div>
            <h2 className="st-title-md">
              Jadwal Mendatang &amp; Historis Terkait ({corporateActions.events.length})
            </h2>
          </div>
          <div className="st-chip-row">
            <span className="st-badge st-badge-markup">● OBSERVED IDX/KSEI</span>
            <Link href="/calendar" className="st-btn" style={{ textDecoration: "none" }}>
              Lihat Kalender Pasar Penuh →
            </Link>
          </div>
        </div>

        <div className="st-table-wrap" tabIndex={0} role="region" aria-label="Aksi korporasi emiten">
          <table className="st-table st-table-fit">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Kategori</th>
                <th>Status</th>
                <th>Detail &amp; Jadwal</th>
              </tr>
            </thead>
            <tbody>
              {corporateActions.events.map((ev) => (
                <tr key={ev.id}>
                  <td className="st-tabular"><strong>{ev.dateDisplay}</strong></td>
                  <td>
                    <span className="st-badge st-badge-strategy">{ev.categoryLabel}</span>
                  </td>
                  <td>
                    <span className={`st-badge ${ev.status === "ACTIVE" ? "st-badge-markup" : ev.status === "UPCOMING" ? "st-badge-confirmed" : "st-badge-neutral"}`}>
                      {ev.status}
                    </span>
                  </td>
                  <td>
                    <div className="st-cal-detail-grid">
                      {ev.extraMetrics.map((m, i) => (
                        <div key={`am-${i}`} className="st-cal-detail-cell">
                          <div className="st-cal-detail-k">{m.label}</div>
                          <div className="st-cal-detail-v st-tabular">{m.value}</div>
                        </div>
                      ))}
                      {ev.timeline.map((t, i) => (
                        <div key={`at-${i}`} className="st-cal-detail-cell">
                          <div className="st-cal-detail-k">{t.label}</div>
                          <div className="st-cal-detail-v st-tabular">{t.value}</div>
                        </div>
                      ))}
                      {ev.extraMetrics.length === 0 && ev.timeline.length === 0 ? (
                        <span className="st-muted">{ev.detailSummary || "-"}</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {corporateActions.events.length === 0 ? (
                <tr>
                  <td colSpan={4} className="st-muted" style={{ textAlign: "center", padding: "24px" }}>
                    Belum ada jadwal aksi korporasi (Dividen, RUPS, Right Issue, Split) terbaru untuk {data.ticker}.
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

export function TabNews({ data }: { data: TickerIntelligencePayload }) {
  const { news } = data;

  return (
    <div className="st-intel-stack">
      <div className="st-subcard">
        <div className="st-card-header">
          <div>
            <div className="st-eyebrow">BERITA &amp; KATALIS PASAR · {data.ticker}</div>
            <h2 className="st-title-md">Headlines Emiten Terkini ({news.length})</h2>
          </div>
          <span className="st-badge st-badge-neutral">● OBSERVED RSS FEED</span>
        </div>

        <div className="st-news-list">
          {news.map((item, idx) => (
            <article key={`news-${idx}`} className="st-subcard st-news-card">
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "6px" }}>
                <span className="st-badge st-badge-strategy">{item.source}</span>
                <time className="st-muted st-tabular" dateTime={item.pubDateRaw}>
                  {item.pubDateDisplay}
                </time>
              </div>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="st-news-link"
              >
                {item.title} ↗
              </a>
            </article>
          ))}

          {news.length === 0 ? (
            <div className="st-subcard" style={{ textAlign: "center", padding: "24px" }}>
              <div className="st-muted">
                Berita emiten belum tersedia atau feed RSS upstream sedang tidak merespons.
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
