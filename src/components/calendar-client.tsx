"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  CALENDAR_CATEGORY_DEFS,
  filterAndSortCalendarEvents,
  type CalendarEventItem,
  type CalendarPayload,
} from "@/lib/calendar-types";
import { comparePlainDates, ensureTemporalPolyfill } from "@/lib/temporal-dates";

type SortColumn = "date" | "ticker" | "event";
type SortDirection = "ascending" | "descending";

const CATEGORY_ICON: Record<string, string> = {
  dividend: "◆",
  stocksplit: "⇄",
  reversesplit: "⇅",
  rightissue: "＋",
  tenderoffer: "◈",
  rups: "●",
  pubex: "◎",
  ipo: "★",
};

function safeUrl(val: string): string | null {
  const m = /(https?:\/\/[^\s]+)/i.exec(val);
  return m ? m[1] : null;
}

export function CalendarClient({ initialData }: { initialData: CalendarPayload }) {
  const captionId = useId();
  const [payload, setPayload] = useState<CalendarPayload>(initialData);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [query, setQuery] = useState<string>("");
  const [includeHistorical, setIncludeHistorical] = useState<boolean>(false);
  const [loadingHistorical, setLoadingHistorical] = useState<boolean>(false);
  const [sortCol, setSortCol] = useState<SortColumn>("date");
  const [sortDir, setSortDir] = useState<SortDirection>("ascending");
  const [sortAnnouncement, setSortAnnouncement] = useState<string>("");

  useEffect(() => {
    void ensureTemporalPolyfill();
  }, []);

  const handleToggleHistorical = async () => {
    const nextVal = !includeHistorical;
    setIncludeHistorical(nextVal);
    if (nextVal && !payload.events.some((e) => e.status === "HISTORICAL")) {
      setLoadingHistorical(true);
      try {
        const res = await fetch("/api/calendar?upcoming=0", { cache: "no-store" });
        const json = (await res.json()) as { ok?: boolean; data?: CalendarPayload };
        if (json?.ok && json.data) {
          setPayload(json.data);
        }
      } catch {
        // Keep current payload silently; upstream banner already explains network state.
      } finally {
        setLoadingHistorical(false);
      }
    }
  };

  const collator = useMemo(
    () => new Intl.Collator("id", { numeric: true, sensitivity: "base" }),
    []
  );

  const visibleEvents = useMemo(() => {
    const base = filterAndSortCalendarEvents(payload.events, {
      category: selectedCategory,
      query,
      includeHistorical,
    });

    const factor = sortDir === "ascending" ? 1 : -1;
    return base.slice().sort((a, b) => {
      if (sortCol === "date") {
        const cmp = comparePlainDates(a.date, b.date);
        return cmp !== 0 ? cmp * factor : collator.compare(a.ticker, b.ticker);
      }
      if (sortCol === "ticker") {
        const cmp = collator.compare(a.ticker, b.ticker);
        return cmp !== 0 ? cmp * factor : comparePlainDates(a.date, b.date);
      }
      const cmp = collator.compare(a.categoryLabel, b.categoryLabel);
      return cmp !== 0 ? cmp * factor : comparePlainDates(a.date, b.date);
    });
  }, [payload.events, selectedCategory, query, includeHistorical, sortCol, sortDir, collator]);

  const handleSort = (col: SortColumn, colName: string) => {
    const nextDir: SortDirection =
      sortCol === col ? (sortDir === "ascending" ? "descending" : "ascending") : "ascending";
    setSortCol(col);
    setSortDir(nextDir);
    setSortAnnouncement(`Diurutkan berdasarkan ${colName}, ${nextDir === "ascending" ? "naik" : "turun"}, ${visibleEvents.length} jadwal`);
  };

  const pillCounts = useMemo(() => {
    const activeSet = payload.events.filter((e) => includeHistorical || e.status !== "HISTORICAL");
    const map: Record<string, number> = { ALL: activeSet.length };
    for (const def of CALENDAR_CATEGORY_DEFS) map[def.key] = 0;
    for (const ev of activeSet) {
      map[ev.category] = (map[ev.category] ?? 0) + 1;
    }
    return map;
  }, [payload.events, includeHistorical]);

  return (
    <div className="st-page">
      {/* Corporate Calendar Header & Filter Bar */}
      <section className="st-card" aria-label="Filter Kalender Korporasi IDX">
        <div className="st-card-header">
          <div>
            <div className="st-eyebrow">■ CORPORATE CALENDAR · IDX &amp; KSEI SCHEDULES</div>
            <h1 className="st-title-xl" style={{ marginTop: "4px" }}>
              Jadwal Aksi Korporasi Emiten
            </h1>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
            <span className="st-muted st-tabular">
              {visibleEvents.length} {includeHistorical ? "Events" : "Upcoming Events"} ·{" "}
              {selectedCategory === "ALL" ? "ALL CATEGORIES" : selectedCategory.toUpperCase()}
            </span>
            <span className={`st-badge ${payload.stale ? "st-badge-consolidating" : "st-badge-markup"}`}>
              {payload.stale ? "◐ CACHE SNAPSHOT" : "● OBSERVED KSEI/IDX"}
            </span>
          </div>
        </div>

        {payload.upstreamNote ? (
          <div className="st-provenance-banner" role="status">
            <span>{payload.upstreamNote}</span>
          </div>
        ) : null}

        <div className="st-cal-toolbar">
          <div className="st-chip-row" role="group" aria-label="Filter kategori aksi korporasi">
            <button
              type="button"
              className="st-chip"
              aria-pressed={selectedCategory === "ALL"}
              onClick={() => setSelectedCategory("ALL")}
            >
              ALL <span className="st-chip-count st-tabular">{pillCounts.ALL ?? 0}</span>
            </button>
            {CALENDAR_CATEGORY_DEFS.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className="st-chip"
                aria-pressed={selectedCategory === cat.key}
                onClick={() => setSelectedCategory(cat.key)}
              >
                <span aria-hidden="true">{CATEGORY_ICON[cat.key]}</span> {cat.pillLabel}{" "}
                <span className="st-chip-count st-tabular">{pillCounts[cat.key] ?? 0}</span>
              </button>
            ))}
          </div>

          <div className="st-cal-controls">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari ticker / emiten / venue..."
              aria-label="Cari ticker atau detail aksi korporasi"
              className="st-nav-search-input"
              style={{ minWidth: "210px" }}
            />
            <button
              type="button"
              className="st-chip"
              aria-pressed={includeHistorical}
              onClick={handleToggleHistorical}
              disabled={loadingHistorical}
            >
              {loadingHistorical ? "Memuat..." : includeHistorical ? "Tampilkan Riwayat: ON" : "Termasuk Riwayat"}
            </button>
          </div>
        </div>
      </section>

      {/* 4 KPI Summary Cards */}
      <section className="st-cal-kpi-grid" aria-label="Ringkasan jadwal aksi korporasi">
        <div className="st-card st-cal-kpi-card">
          <div className="st-eyebrow">UPCOMING EVENTS</div>
          <div className="st-cal-kpi-val st-tabular">{payload.kpiSummary.upcomingEvents}</div>
          <div className="st-muted">Corporate actions</div>
        </div>

        <div className="st-card st-cal-kpi-card">
          <div className="st-eyebrow">DIVIDEND</div>
          <div className="st-cal-kpi-val st-tabular" style={{ color: "var(--green)" }}>
            {payload.kpiSummary.dividends}
          </div>
          <div className="st-muted">Cum / Ex / Pay schedules</div>
        </div>

        <div className="st-card st-cal-kpi-card">
          <div className="st-eyebrow">RUPS / PUBEX</div>
          <div className="st-cal-kpi-val st-tabular" style={{ color: "var(--accent)" }}>
            {payload.kpiSummary.rupsPubex}
          </div>
          <div className="st-muted">RUPS &amp; Public Expose</div>
        </div>

        <div className="st-card st-cal-kpi-card">
          <div className="st-eyebrow">IPO / ACTIONS</div>
          <div className="st-cal-kpi-val st-tabular" style={{ color: "#fcd34d" }}>
            {payload.kpiSummary.ipoActions}
          </div>
          <div className="st-muted">IPO · Split · Right Issue · Tender</div>
        </div>
      </section>

      {/* Upcoming Corporate Actions Table */}
      <section className="st-card" aria-label="Tabel jadwal aksi korporasi">
        <div className="st-card-header">
          <div>
            <div className="st-eyebrow">UPCOMING CORPORATE ACTIONS</div>
            <h2 className="st-title-md">Daftar Jadwal Lengkap ({visibleEvents.length})</h2>
          </div>
          <div role="status" aria-live="polite" className="st-sr-only">
            {sortAnnouncement}
          </div>
        </div>

        <div
          className="st-table-wrap st-cal-table-region"
          tabIndex={0}
          role="region"
          aria-labelledby={captionId}
        >
          <table className="st-table st-cal-table">
            <caption id={captionId}>
              Jadwal dividen, RUPS, Public Expose, Right Issue, Stock Split, Tender Offer, dan IPO emiten IDX (waktu lokasi-agnostik WIB).
            </caption>
            <thead>
              <tr>
                <th scope="col" aria-sort={sortCol === "date" ? sortDir : undefined}>
                  <button type="button" className="st-th-sort-btn" onClick={() => handleSort("date", "Tanggal")}>
                    DATE <span aria-hidden="true" className="st-sort-icon" />
                  </button>
                </th>
                <th scope="col" aria-sort={sortCol === "event" ? sortDir : undefined}>
                  <button type="button" className="st-th-sort-btn" onClick={() => handleSort("event", "Kategori Event")}>
                    EVENT <span aria-hidden="true" className="st-sort-icon" />
                  </button>
                </th>
                <th scope="col" aria-sort={sortCol === "ticker" ? sortDir : undefined}>
                  <button type="button" className="st-th-sort-btn" onClick={() => handleSort("ticker", "Ticker")}>
                    TICKER <span aria-hidden="true" className="st-sort-icon" />
                  </button>
                </th>
                <th scope="col">COMPANY</th>
                <th scope="col">DETAIL</th>
              </tr>
            </thead>
            <tbody>
              {visibleEvents.map((ev) => (
                <CalendarRow key={ev.id} ev={ev} />
              ))}
              {visibleEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="st-muted" style={{ textAlign: "center", padding: "28px" }}>
                    Tidak ada jadwal aksi korporasi yang cocok dengan filter kategori / pencarian saat ini.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function CalendarRow({ ev }: { ev: CalendarEventItem }) {
  const badgeCls =
    ev.category === "dividend"
      ? "st-badge-markup"
      : ev.category === "rups" || ev.category === "pubex"
        ? "st-badge-strategy"
        : ev.category === "ipo" || ev.category === "stocksplit"
          ? "st-badge-confirmed"
          : "st-badge-neutral";

  return (
    <tr>
      <th scope="row" className="st-cal-rowhead st-tabular" data-label="DATE">
        <div>{ev.dateDisplay}</div>
        {ev.daysUntil !== null && ev.daysUntil >= 0 ? (
          <div className="st-muted" style={{ fontSize: "11px" }}>
            {ev.daysUntil === 0 ? "HARI INI" : `H-${ev.daysUntil}`}
          </div>
        ) : null}
      </th>
      <td data-label="EVENT">
        <span className={`st-badge ${badgeCls}`}>
          <span aria-hidden="true">{CATEGORY_ICON[ev.category] || "◆"}</span> {ev.categoryLabel}
        </span>
      </td>
      <td data-label="TICKER">
        <Link href={`/ticker/${ev.ticker}?tab=aksi`} className="st-ticker-link">
          {ev.ticker}
        </Link>
      </td>
      <td data-label="COMPANY" className="st-muted" style={{ minWidth: "150px" }}>
        {ev.companyName}
      </td>
      <td data-label="DETAIL">
        <div className="st-cal-detail-grid">
          {ev.extraMetrics.map((m, idx) => {
            const href = m.isLink ? safeUrl(m.value) : null;
            return (
              <div key={`m-${idx}-${m.label}`} className="st-cal-detail-cell">
                <div className="st-cal-detail-k">{m.label}</div>
                <div className="st-cal-detail-v st-tabular">
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="st-ext-link"
                    >
                      {m.value.replace(href, "").replace(/[•\s]+$/, "") || "Buka Tautan ↗"}
                    </a>
                  ) : (
                    m.value
                  )}
                </div>
              </div>
            );
          })}
          {ev.timeline.map((t, idx) => (
            <div key={`t-${idx}-${t.key}`} className="st-cal-detail-cell">
              <div className="st-cal-detail-k">{t.label}</div>
              <div className="st-cal-detail-v st-tabular">{t.value}</div>
            </div>
          ))}
          {ev.extraMetrics.length === 0 && ev.timeline.length === 0 ? (
            <div className="st-cal-detail-cell">
              <div className="st-cal-detail-k">KETERANGAN</div>
              <div className="st-cal-detail-v">{ev.detailSummary || "-"}</div>
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
