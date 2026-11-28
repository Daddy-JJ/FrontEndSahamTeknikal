"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { TickerIntelligencePayload } from "@/lib/ticker-intelligence";
import { TickerChartCanvas } from "@/components/ticker-chart-canvas";
import { TICKER_TABS, type TickerTabKey } from "@/components/ticker-tabs/types";
import { TabRekomendasi } from "@/components/ticker-tabs/tab-rekomendasi";
import { TabBandar } from "@/components/ticker-tabs/tab-bandar";
import { TabBroker } from "@/components/ticker-tabs/tab-broker";
import { TabTeknikal } from "@/components/ticker-tabs/tab-teknikal";
import { TabProIntel } from "@/components/ticker-tabs/tab-pro-intel";
import { TabOwnership } from "@/components/ticker-tabs/tab-ownership";
import { TabAksiKorporasi, TabNews } from "@/components/ticker-tabs/tab-corp-actions-news";
import {
  formatPctID,
  formatPriceID,
  formatRupiahCompact,
  smartMoneyMeta,
  stockRegimeMeta,
} from "@/lib/format-id";
import { ensureTemporalPolyfill } from "@/lib/temporal-dates";

const TAB_TO_SOURCE_KEY = {
  rekomendasi: "rekomendasi",
  bandar: "bandar",
  broker: "broker",
  teknikal: "analisisTeknikal",
  pro: "proIntel",
  ownership: "ownership",
  aksi: "aksiKorporasi",
  news: "news",
} as const;

export function TickerDetailClient({
  data,
  initialTab = "rekomendasi",
}: {
  data: TickerIntelligencePayload;
  initialTab?: TickerTabKey;
}) {
  const [activeTab, setActiveTab] = useState<TickerTabKey>(initialTab);
  const [showQuickChart, setShowQuickChart] = useState<boolean>(false);
  const tablistRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Partial<Record<TickerTabKey, HTMLButtonElement | null>>>({});
  const panelRefs = useRef<Partial<Record<TickerTabKey, HTMLDivElement | null>>>({});

  const td = data.technicalDetail;
  const smBadge = smartMoneyMeta(td.smart_money.score, td.smart_money.label);
  const regBadge = stockRegimeMeta(td.regime, td.regime_action);
  const lastRsi = td.rsi14[td.rsi14.length - 1];
  const lastAdx = td.adx14[td.adx14.length - 1];
  const lastE200 = td.ema200[td.ema200.length - 1];

  useEffect(() => {
    void ensureTemporalPolyfill();
  }, []);

  // Reveal inactive hidden="until-found" tab when browser Find-in-page matches text inside it.
  useEffect(() => {
    const handlers: Array<{ el: HTMLDivElement; fn: () => void }> = [];
    for (const tab of TICKER_TABS) {
      const el = panelRefs.current[tab.key];
      if (!el) continue;
      const onMatch = () => {
        setActiveTab(tab.key);
      };
      el.addEventListener("beforematch", onMatch);
      handlers.push({ el, fn: onMatch });
    }
    return () => {
      for (const h of handlers) {
        h.el.removeEventListener("beforematch", h.fn);
      }
    };
  }, []);

  // Scrollability edge fade fallback via IntersectionObserver when scroll-driven animations are absent.
  useEffect(() => {
    const scroller = tablistRef.current;
    if (!scroller || typeof CSS === "undefined") return;
    if (CSS.supports("animation-timeline", "scroll()")) return;
    const first = scroller.firstElementChild;
    const last = scroller.lastElementChild;
    if (!first || !last) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === first) {
            scroller.classList.toggle("more-start", entry.intersectionRatio < 1);
          } else if (entry.target === last) {
            scroller.classList.toggle("more-end", entry.intersectionRatio < 1);
          }
        }
      },
      { root: scroller, threshold: 1, rootMargin: "1px" }
    );
    io.observe(first);
    io.observe(last);
    return () => io.disconnect();
  }, []);

  const activateTab = (tabKey: TickerTabKey) => {
    setActiveTab(tabKey);
    const btn = tabRefs.current[tabKey];
    btn?.scrollIntoView({ block: "nearest", inline: "nearest" });
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tabKey);
      window.history.replaceState(null, "", url.toString());
    }
  };

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIdx = TICKER_TABS.findIndex((t) => t.key === activeTab);
    if (currentIdx === -1) return;
    let nextIdx: number | null = null;
    if (e.key === "ArrowRight") nextIdx = (currentIdx + 1) % TICKER_TABS.length;
    else if (e.key === "ArrowLeft") nextIdx = (currentIdx - 1 + TICKER_TABS.length) % TICKER_TABS.length;
    else if (e.key === "Home") nextIdx = 0;
    else if (e.key === "End") nextIdx = TICKER_TABS.length - 1;

    if (nextIdx !== null) {
      e.preventDefault();
      const targetTab = TICKER_TABS[nextIdx];
      tabRefs.current[targetTab.key]?.focus();
      activateTab(targetTab.key);
    }
  };

  const activeSource = data.sources[TAB_TO_SOURCE_KEY[activeTab]];

  return (
    <div className="st-page">
      {/* Top Breadcrumb + Hero Header */}
      <section className="st-card" aria-label="Ringkasan utama emiten">
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", fontSize: "12px", alignItems: "center" }}>
              <Link href="/" style={{ color: "var(--accent)", textDecoration: "none" }}>
                ← Back to Dashboard
              </Link>
              <span className="st-muted">/</span>
              <Link href={`/sector/${td.sector_slug}`} style={{ color: "var(--accent)", textDecoration: "none" }}>
                Sektor {td.sector}
              </Link>
              <span className="st-muted">/</span>
              <Link href={`/calendar?ticker=${data.ticker}`} style={{ color: "var(--accent)", textDecoration: "none" }}>
                Kalender {data.ticker} ({data.corporateActions.upcomingCount})
              </Link>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "12px", marginTop: "8px" }}>
              <h1 className="st-title-xl">{data.ticker}</h1>
              {data.companyName ? (
                <span className="st-muted" style={{ fontSize: "14px", fontWeight: 600 }}>{data.companyName}</span>
              ) : null}
              <span className="st-title-xl st-tabular" style={{ fontSize: "22px" }}>
                {formatPriceID(td.close)}
              </span>
              <span className={`st-tabular ${td.change >= 0 ? "st-pos" : "st-neg"}`} style={{ fontWeight: 700, fontSize: "15px" }}>
                {td.change >= 0 ? "+" : ""}
                {formatPriceID(td.change)} ({formatPctID(td.change_pct, true)})
              </span>
            </div>

            <div className="st-chip-row" style={{ marginTop: "8px" }}>
              <span className={`st-badge ${regBadge.cls}`}>{regBadge.text}</span>
              <span className={`st-badge ${smBadge.cls}`}>{smBadge.text}</span>
              <span className={`st-badge ${data.technical.momentumStrip.activeSignalTone === "bullish" ? "st-badge-strategy" : "st-badge-neutral"}`}>
                SIGNAL: {data.technical.momentumStrip.activeSignalLabel}
              </span>
            </div>

            <div className="st-muted st-tabular" style={{ marginTop: "8px" }}>
              Sesi {td.latest_date} · MCap {formatRupiahCompact(td.market_cap)} · Free Float{" "}
              {td.free_float_pct !== null ? `${td.free_float_pct.toFixed(1)}%` : "-"} · RSI(14){" "}
              {lastRsi !== null ? lastRsi.toFixed(1) : "-"} · ADX(14){" "}
              {lastAdx?.adx !== null && lastAdx?.adx !== undefined ? `${lastAdx.adx.toFixed(1)} (${lastAdx.strength})` : "-"} · EMA200{" "}
              {lastE200 !== null ? formatPriceID(lastE200) : "-"}
            </div>
          </div>

          {/* Option-A Quick Chart Toggle & Broker Flow Shortcut */}
          <div className="st-chip-row">
            <button
              type="button"
              className="st-chip"
              aria-pressed={showQuickChart}
              onClick={() => setShowQuickChart((v) => !v)}
            >
              {showQuickChart ? "Tutup Chart Cepat ▲" : "Chart Cepat & Indikator ▼"}
            </button>
            <Link href="/broker-flow" className="st-btn" style={{ textDecoration: "none" }}>
              /broker-flow →
            </Link>
          </div>
        </div>
      </section>

      {/* Optional Quick Chart Drawer Above Console (Option A) */}
      {showQuickChart ? (
        <TickerChartCanvas
          data={td}
          height={380}
          defaultRange={130}
          title={`Preview Chart Cepat — ${data.ticker} (EMA 21/50/200, Supertrend, Fractal, Pivot, Fibonacci)`}
        />
      ) : null}

      {/* TICKER INTELLIGENCE CONSOLE (8 Tabs — Strictly Zero MaxV7) */}
      <section className="st-card" aria-label="Ticker Intelligence Console">
        <div className="st-card-header" style={{ marginBottom: "8px" }}>
          <div>
            <div className="st-eyebrow">TICKER INTELLIGENCE CONSOLE</div>
            <div className="st-muted" style={{ fontSize: "11px" }}>
              OBSERVED · DERIVED FROM BROKSUM + OHLCV + KSEI + 3-RULE ENGINE · PROXY LABELS ARE MARKED
            </div>
          </div>

          <div className="st-chip-row">
            <span className={`st-badge ${activeSource.status === "ok" ? "st-badge-markup" : activeSource.status === "unavailable" ? "st-badge-markdown" : "st-badge-confirmed"}`}>
              {activeSource.provenance.toUpperCase()} · {activeSource.sourceLabel}
              {activeSource.stale ? " (CACHE)" : ""}
            </span>
          </div>
        </div>

        {/* Single-Row Horizontally Scrollable Accessible Tablist */}
        <div
          ref={tablistRef}
          role="tablist"
          aria-label="Konsol Intelijen Emiten"
          className="st-intel-tablist"
          onKeyDown={handleTabKeyDown}
        >
          {TICKER_TABS.map((t) => {
            const isSel = activeTab === t.key;
            return (
              <button
                key={t.key}
                ref={(el) => {
                  tabRefs.current[t.key] = el;
                }}
                type="button"
                role="tab"
                id={`tab-btn-${t.key}`}
                aria-selected={isSel}
                tabIndex={isSel ? 0 : -1}
                className="st-intel-tab"
                onClick={() => activateTab(t.key)}
              >
                {t.label}
                {t.key === "aksi" && data.corporateActions.upcomingCount > 0 ? (
                  <span className="st-chip-count st-tabular" style={{ marginLeft: "5px" }}>
                    {data.corporateActions.upcomingCount}
                  </span>
                ) : null}
                {t.key === "news" && data.news.length > 0 ? (
                  <span className="st-chip-count st-tabular" style={{ marginLeft: "5px" }}>
                    {data.news.length}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {activeSource.note ? (
          <div className="st-provenance-banner" style={{ marginTop: "10px" }} role="status">
            <span>{activeSource.note}</span>
          </div>
        ) : null}

        {/* Panels use zero styling on the outer hidden="until-found" container and style .st-tabpanel-inner */}
        <div className="st-tabpanels-stack">
          <div
            ref={(el) => { panelRefs.current.rekomendasi = el; }}
            role="tabpanel"
            aria-labelledby="tab-btn-rekomendasi"
            tabIndex={activeTab === "rekomendasi" ? 0 : undefined}
            hidden={activeTab === "rekomendasi" ? undefined : ("until-found" as unknown as boolean)}
            className="st-tabpanel"
          >
            <div className="st-tabpanel-inner">
              <TabRekomendasi data={data} onSwitchTab={activateTab} />
            </div>
          </div>

          <div
            ref={(el) => { panelRefs.current.bandar = el; }}
            role="tabpanel"
            aria-labelledby="tab-btn-bandar"
            tabIndex={activeTab === "bandar" ? 0 : undefined}
            hidden={activeTab === "bandar" ? undefined : ("until-found" as unknown as boolean)}
            className="st-tabpanel"
          >
            <div className="st-tabpanel-inner">
              <TabBandar data={data} />
            </div>
          </div>

          <div
            ref={(el) => { panelRefs.current.broker = el; }}
            role="tabpanel"
            aria-labelledby="tab-btn-broker"
            tabIndex={activeTab === "broker" ? 0 : undefined}
            hidden={activeTab === "broker" ? undefined : ("until-found" as unknown as boolean)}
            className="st-tabpanel"
          >
            <div className="st-tabpanel-inner">
              <TabBroker data={data} />
            </div>
          </div>

          <div
            ref={(el) => { panelRefs.current.teknikal = el; }}
            role="tabpanel"
            aria-labelledby="tab-btn-teknikal"
            tabIndex={activeTab === "teknikal" ? 0 : undefined}
            hidden={activeTab === "teknikal" ? undefined : ("until-found" as unknown as boolean)}
            className="st-tabpanel"
          >
            <div className="st-tabpanel-inner">
              <TabTeknikal data={data} />
            </div>
          </div>

          <div
            ref={(el) => { panelRefs.current.pro = el; }}
            role="tabpanel"
            aria-labelledby="tab-btn-pro"
            tabIndex={activeTab === "pro" ? 0 : undefined}
            hidden={activeTab === "pro" ? undefined : ("until-found" as unknown as boolean)}
            className="st-tabpanel"
          >
            <div className="st-tabpanel-inner">
              <TabProIntel data={data} />
            </div>
          </div>

          <div
            ref={(el) => { panelRefs.current.ownership = el; }}
            role="tabpanel"
            aria-labelledby="tab-btn-ownership"
            tabIndex={activeTab === "ownership" ? 0 : undefined}
            hidden={activeTab === "ownership" ? undefined : ("until-found" as unknown as boolean)}
            className="st-tabpanel"
          >
            <div className="st-tabpanel-inner">
              <TabOwnership data={data} />
            </div>
          </div>

          <div
            ref={(el) => { panelRefs.current.aksi = el; }}
            role="tabpanel"
            aria-labelledby="tab-btn-aksi"
            tabIndex={activeTab === "aksi" ? 0 : undefined}
            hidden={activeTab === "aksi" ? undefined : ("until-found" as unknown as boolean)}
            className="st-tabpanel"
          >
            <div className="st-tabpanel-inner">
              <TabAksiKorporasi data={data} />
            </div>
          </div>

          <div
            ref={(el) => { panelRefs.current.news = el; }}
            role="tabpanel"
            aria-labelledby="tab-btn-news"
            tabIndex={activeTab === "news" ? 0 : undefined}
            hidden={activeTab === "news" ? undefined : ("until-found" as unknown as boolean)}
            className="st-tabpanel"
          >
            <div className="st-tabpanel-inner">
              <TabNews data={data} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
