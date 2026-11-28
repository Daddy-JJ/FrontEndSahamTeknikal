"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { JournalShell } from "@/components/journal-shell";

const BrokerFlowInlineChart = dynamic(
  () => import("@/components/broker-flow-inline-chart"),
  { ssr: false }
);
import {
  DEFAULT_MARKET_SUMMARY,
  DEFAULT_TOP_ACCUMULATIONS,
  DEFAULT_TOP_DISTRIBUTIONS,
  DEFAULT_TOP_BROKERS,
  DEFAULT_SECTOR_FLOWS,
  QUADRANT_MAPS,
  collectLocalMultiHorizonMap,
  fetchTickerMultiHorizon,
  getDailyInsight,
  formatRupiah,
  formatNumber,
  type AccumulationItem,
  type DailyInsightCardData,
  type DistributionItem,
  type HorizonPeriod,
  type MarketSummary,
  type QuadrantMapDetail,
  type TickerBrokerDetail,
} from "@/lib/broker-flow";
import { formatShortDateID, type DataFreshnessMeta } from "@/lib/live-broker-flow";
import { MultiHorizonTable } from "@/components/multi-horizon-table";
import "./broker-flow.css";

export default function BrokerFlowPage() {
  const [selectedTickerCode, setSelectedTickerCode] = useState<string>("MBMA");
  const [activeHorizon, setActiveHorizon] = useState<HorizonPeriod>("5D");
  const [detailFocusHorizon, setDetailFocusHorizon] = useState<HorizonPeriod>("5D");
  const [selectedTickerHorizons, setSelectedTickerHorizons] = useState<
    Partial<Record<HorizonPeriod, TickerBrokerDetail>>
  >(() => collectLocalMultiHorizonMap("MBMA", "5D").horizons);
  const selectedTicker =
    selectedTickerHorizons[detailFocusHorizon] ||
    selectedTickerHorizons["5D"] ||
    selectedTickerHorizons["2D"] ||
    selectedTickerHorizons["10D"] ||
    null;

  const [marketSummary, setMarketSummary] = useState<MarketSummary>(DEFAULT_MARKET_SUMMARY);
  const [topAccumulations, setTopAccumulations] = useState<AccumulationItem[]>(
    DEFAULT_TOP_ACCUMULATIONS
  );
  const [topDistributions, setTopDistributions] = useState<DistributionItem[]>(
    DEFAULT_TOP_DISTRIBUTIONS
  );
  const [quadrantMaps, setQuadrantMaps] = useState<Record<string, QuadrantMapDetail>>(
    QUADRANT_MAPS
  );
  const [dailyInsight, setDailyInsight] = useState<DailyInsightCardData>(() =>
    getDailyInsight("5D")
  );
  const [freshness, setFreshness] = useState<DataFreshnessMeta | null>(null);
  const [isSyncingLive, setIsSyncingLive] = useState<boolean>(true);
  const [isTickerLoading, setIsTickerLoading] = useState<boolean>(false);
  const [activeFilterQuadrant, setActiveFilterQuadrant] = useState<string | null>(null);
  const [activeQuadrantModal, setActiveQuadrantModal] = useState<string | null>(null);
  const [modalSearch, setModalSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isOnDemandLoading, setIsOnDemandLoading] = useState(false);
  const [onDemandTarget, setOnDemandTarget] = useState<string | null>(null);
  const [isChartOpen, setIsChartOpen] = useState(false);
  const hasUserSelectedTickerRef = useRef(false);
  const marketAbortRef = useRef<AbortController | null>(null);
  const tickerAbortRef = useRef<AbortController | null>(null);
  const marketReqIdRef = useRef(0);
  const tickerReqIdRef = useRef(0);

  const closeQuadrantModal = () => {
    setActiveQuadrantModal(null);
    setActiveFilterQuadrant(null);
  };

  useEffect(() => {
    if (!activeQuadrantModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeQuadrantModal();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeQuadrantModal]);

  const applyMarketOverviewPayload = (payloadData: Record<string, unknown>) => {
    if (payloadData.market_summary) {
      setMarketSummary(payloadData.market_summary as MarketSummary);
    }
    if (Array.isArray(payloadData.top_accumulations)) {
      setTopAccumulations(payloadData.top_accumulations as AccumulationItem[]);
    }
    if (Array.isArray(payloadData.top_distributions)) {
      setTopDistributions(payloadData.top_distributions as DistributionItem[]);
    }
    if (payloadData.quadrant_maps) {
      setQuadrantMaps(payloadData.quadrant_maps as Record<string, QuadrantMapDetail>);
    }
    if (payloadData.daily_insight) {
      setDailyInsight(payloadData.daily_insight as DailyInsightCardData);
    }
    if (payloadData.data_freshness) {
      setFreshness(payloadData.data_freshness as DataFreshnessMeta);
    }
  };

  useEffect(() => {
    const reqId = ++marketReqIdRef.current;
    const controller = new AbortController();
    marketAbortRef.current = controller;

    (async () => {
      try {
        const res = await fetch("/api/broker-flow?horizon=5D&live=true", {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const json = await res.json();
        if (controller.signal.aborted || reqId !== marketReqIdRef.current || !json?.success || !json?.data) {
          return;
        }

        applyMarketOverviewPayload(json.data as Record<string, unknown>);
        const topAcc = json.data.top_accumulations as AccumulationItem[] | undefined;
        const nextMaps = json.data.quadrant_maps as Record<string, QuadrantMapDetail> | undefined;
        const defaultTicker =
          !hasUserSelectedTickerRef.current && topAcc && topAcc.length > 0
            ? topAcc[0].ticker
            : "MBMA";

        if (hasUserSelectedTickerRef.current) return;
        const tReqId = ++tickerReqIdRef.current;
        const multi = await fetchTickerMultiHorizon(
          defaultTicker,
          "5D",
          true,
          nextMaps,
          false,
          controller.signal
        );
        if (
          !controller.signal.aborted &&
          !hasUserSelectedTickerRef.current &&
          tReqId === tickerReqIdRef.current &&
          multi
        ) {
          setSelectedTickerCode(defaultTicker);
          setSelectedTickerHorizons(multi.horizons);
        }
      } catch {
        // Keep initial SSR fallback on network failure or abort
      } finally {
        if (!controller.signal.aborted && reqId === marketReqIdRef.current) {
          setIsSyncingLive(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, []);

  const loadLiveMarket = async (
    horizon: HorizonPeriod,
    forceRefresh: boolean = false,
    signal?: AbortSignal
  ): Promise<Record<string, QuadrantMapDetail> | undefined> => {
    const qs = new URLSearchParams({ horizon, live: "true" });
    if (forceRefresh) qs.set("refresh", "true");
    const res = await fetch(`/api/broker-flow?${qs.toString()}`, { signal });
    if (!res.ok) return undefined;
    const json = await res.json();
    if (json?.success && json?.data) {
      applyMarketOverviewPayload(json.data as Record<string, unknown>);
      return json.data.quadrant_maps as Record<string, QuadrantMapDetail> | undefined;
    }
    return undefined;
  };

  /**
   * 0ms instant horizon switch for the ticker comparison table, Trade Plan & Chart line.
   */
  const handleDetailFocusHorizonChange = (h: HorizonPeriod) => {
    setDetailFocusHorizon(h);
  };

  /**
   * Switches market-wide Daily Radar horizon; syncs ticker focus instantaneously if cached in state.
   */
  const handleHorizonChange = async (newHorizon: HorizonPeriod) => {
    setActiveHorizon(newHorizon);
    setDetailFocusHorizon(newHorizon);
    setIsSyncingLive(true);

    marketAbortRef.current?.abort();
    const controller = new AbortController();
    marketAbortRef.current = controller;
    const reqId = ++marketReqIdRef.current;

    try {
      const nextMaps = await loadLiveMarket(newHorizon, false, controller.signal).catch(() => undefined);
      if (controller.signal.aborted || reqId !== marketReqIdRef.current) return;

      if (selectedTickerCode && !selectedTickerHorizons[newHorizon]) {
        const tReqId = ++tickerReqIdRef.current;
        const refreshed = await fetchTickerMultiHorizon(
          selectedTickerCode,
          newHorizon,
          true,
          nextMaps || quadrantMaps,
          false,
          controller.signal
        );
        if (!controller.signal.aborted && tReqId === tickerReqIdRef.current && refreshed) {
          setSelectedTickerHorizons(refreshed.horizons);
        }
      }
    } finally {
      if (!controller.signal.aborted && reqId === marketReqIdRef.current) {
        setIsSyncingLive(false);
      }
    }
  };

  const handleTriggerOnDemand = async (tickerToFetch: string) => {
    const upper = tickerToFetch.toUpperCase().trim();
    tickerAbortRef.current?.abort();
    const controller = new AbortController();
    tickerAbortRef.current = controller;
    const reqId = ++tickerReqIdRef.current;

    setIsOnDemandLoading(true);
    setSearchStatus(`⚡ Menghubungkan ke Max MCP... Menarik data 2D, 5D, 10D sekaligus untuk ${upper}...`);

    try {
      const resp = await fetch("/api/broker-flow/on-demand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: upper }),
        signal: controller.signal,
      });
      const data = await resp.json();
      if (controller.signal.aborted || reqId !== tickerReqIdRef.current) return;

      if (data.success && data.horizons) {
        const horizonsMap = data.horizons as Partial<Record<HorizonPeriod, TickerBrokerDetail>>;
        if (horizonsMap["2D"] || horizonsMap["5D"] || horizonsMap["10D"]) {
          setSelectedTickerCode(upper);
          setSelectedTickerHorizons(horizonsMap);
          setOnDemandTarget(null);
          setSearchStatus(`✅ Berhasil! Tabel multi-horizon 2D/5D/10D untuk ${upper} siap.`);
          setTimeout(() => {
            const el = document.getElementById("ticker-insight-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }, 50);
        } else {
          setSearchStatus(`Data ditarik tapi detail horizon tidak ditemukan.`);
        }
      } else {
        setSearchStatus(`❌ Gagal on-demand: ${data.error || "Data emiten tidak ditemukan di Bursa."}`);
      }
    } catch (err: unknown) {
      if (controller.signal.aborted || reqId !== tickerReqIdRef.current) return;
      const msg = err instanceof Error ? err.message : "Koneksi terputus.";
      setSearchStatus(`❌ Gagal on-demand: ${msg}`);
    } finally {
      if (!controller.signal.aborted && reqId === tickerReqIdRef.current) {
        setIsOnDemandLoading(false);
      }
    }
  };

  const handleTickerClick = async (tickerCode: string) => {
    const code = tickerCode.toUpperCase().trim();
    hasUserSelectedTickerRef.current = true;
    tickerAbortRef.current?.abort();
    const controller = new AbortController();
    tickerAbortRef.current = controller;
    const reqId = ++tickerReqIdRef.current;

    setSelectedTickerCode(code);
    if (activeQuadrantModal) {
      closeQuadrantModal();
    }
    setIsTickerLoading(true);
    setSearchStatus(`Memuat tabel 2D / 5D / 10D sekaligus untuk ${code}...`);

    setTimeout(() => {
      const el = document.getElementById("ticker-insight-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 50);

    try {
      const multi = await fetchTickerMultiHorizon(
        code,
        detailFocusHorizon,
        true,
        quadrantMaps,
        false,
        controller.signal
      );
      if (controller.signal.aborted || reqId !== tickerReqIdRef.current) return;
      if (multi) {
        setSelectedTickerHorizons(multi.horizons);
        setOnDemandTarget(null);
        setSearchStatus(`Menampilkan komparasi 2D / 5D / 10D untuk ${multi.ticker}`);
      } else {
        setOnDemandTarget(code);
        setSearchStatus(`Data untuk ${code} belum tersedia di snapshot atau feed.`);
      }
    } finally {
      if (!controller.signal.aborted && reqId === tickerReqIdRef.current) {
        setIsTickerLoading(false);
      }
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    tickerAbortRef.current?.abort();
    const controller = new AbortController();
    tickerAbortRef.current = controller;
    const reqId = ++tickerReqIdRef.current;

    setIsSearching(true);
    setIsTickerLoading(true);
    setSearchStatus("Menarik data 2D, 5D, dan 10D sekaligus dari Max MCP...");

    try {
      const upper = searchQuery.toUpperCase().trim();
      hasUserSelectedTickerRef.current = true;
      const multi = await fetchTickerMultiHorizon(
        upper,
        detailFocusHorizon,
        true,
        quadrantMaps,
        false,
        controller.signal
      );
      if (controller.signal.aborted || reqId !== tickerReqIdRef.current) return;
      if (multi) {
        setSelectedTickerCode(upper);
        setSelectedTickerHorizons(multi.horizons);
        setOnDemandTarget(null);
        setSearchStatus(`Menampilkan komparasi 2D / 5D / 10D untuk ${multi.ticker}`);
        setTimeout(() => {
          const el = document.getElementById("ticker-insight-section");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 50);
      } else {
        setOnDemandTarget(upper);
        setSearchStatus(`Data untuk ${upper} belum tersedia di snapshot lokal.`);
      }
    } catch {
      if (controller.signal.aborted || reqId !== tickerReqIdRef.current) return;
      setSearchStatus(`Gagal memuat data untuk ${searchQuery.toUpperCase()}.`);
    } finally {
      if (!controller.signal.aborted && reqId === tickerReqIdRef.current) {
        setIsSearching(false);
        setIsTickerLoading(false);
      }
    }
  };

  const handleManualSync = async () => {
    marketAbortRef.current?.abort();
    const controller = new AbortController();
    marketAbortRef.current = controller;
    const reqId = ++marketReqIdRef.current;

    setIsSyncingLive(true);
    setIsTickerLoading(true);
    setSyncStatus("Menghubungkan ke Max MCP & menyegarkan snapshot bursa...");
    try {
      const nextMaps = await loadLiveMarket(activeHorizon, true, controller.signal);
      if (controller.signal.aborted || reqId !== marketReqIdRef.current) return;
      if (selectedTickerCode) {
        const tReqId = ++tickerReqIdRef.current;
        const refreshedMulti = await fetchTickerMultiHorizon(
          selectedTickerCode,
          detailFocusHorizon,
          true,
          nextMaps || quadrantMaps,
          true,
          controller.signal
        );
        if (!controller.signal.aborted && tReqId === tickerReqIdRef.current && refreshedMulti) {
          setSelectedTickerHorizons(refreshedMulti.horizons);
        }
      }
      setSyncStatus(
        `✅ Sinkronisasi live sukses (${formatShortDateID(marketSummary.date)})`
      );
    } catch {
      if (controller.signal.aborted || reqId !== marketReqIdRef.current) return;
      setSyncStatus("⚠️ Gagal menarik update terbaru dari Max MCP; mempertahankan data aktif.");
    } finally {
      if (!controller.signal.aborted && reqId === marketReqIdRef.current) {
        setIsSyncingLive(false);
        setIsTickerLoading(false);
        setTimeout(() => setSyncStatus(null), 5000);
      }
    }
  };

  // Active quadrant data for modal
  const activeModalData = activeQuadrantModal ? quadrantMaps[activeQuadrantModal] : null;
  const filteredModalStocks = activeModalData
    ? activeModalData.stocks.filter((s) =>
        s.ticker.toLowerCase().includes(modalSearch.toLowerCase())
      )
    : [];

  const activeDateBadge = formatShortDateID(freshness?.latest_date || marketSummary.date);

  return (
    <JournalShell mode="live" variant="terminal" activePage="broker-flow">
      <div className="bf-page-container">
        
        {/* Header Bar */}
        <header className="bf-header">
          <div>
            <div className="bf-eyebrow">
              • BROKER FLOW • MARKET WIDE INTELLIGENCE •
            </div>
            <h1 className="bf-title">
              Smart Money Flow &amp; Bandarmology Intelligence
            </h1>
            <div className="bf-freshness-row">
              <span
                className={`bf-freshness-pill ${
                  freshness?.source === "snapshot-fallback" ? "fallback" : "live"
                }`}
              >
                {freshness?.source === "snapshot-fallback"
                  ? `🟡 SNAPSHOT: ${activeDateBadge}`
                  : freshness?.source === "supabase"
                  ? `🟢 SUPABASE EOD: ${activeDateBadge}`
                  : `🟢 LIVE EOD: ${activeDateBadge}`}
              </span>
              {freshness && !freshness.is_today_published && (
                <span className="bf-freshness-pill notice">
                  ℹ️ {freshness.message}
                </span>
              )}
              {isSyncingLive && (
                <span className="bf-freshness-pill notice">
                  ⏳ Memuat data live Max MCP...
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Sync Button */}
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncingLive}
              className="bf-btn-sync"
              style={{ opacity: isSyncingLive ? 0.7 : 1, cursor: isSyncingLive ? "wait" : "pointer" }}
              title="Tarik ulang data EOD & Broksum live langsung dari Max MCP"
            >
              <span>{isSyncingLive ? "⏳" : "↻"}</span>
              <span>{isSyncingLive ? "SYNCING..." : "SYNC BROKSUM"}</span>
            </button>

            {/* Search Form */}
            <form onSubmit={handleSearchSubmit} className="bf-search-form">
              <input
                type="text"
                placeholder="CARI EMITEN (CONTOH: ASII, BREN)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bf-search-input"
                disabled={isSearching}
              />
              <button type="submit" className="bf-btn-primary" disabled={isSearching}>
                {isSearching ? "SEARCHING..." : "ANALYZE"}
              </button>
            </form>
          </div>
        </header>

        {/* Status Notifications */}
        {(searchStatus || syncStatus || onDemandTarget) && (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px", margin: "10px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              {searchStatus && <div className="bf-search-status">{searchStatus}</div>}
              {onDemandTarget && (
                <button
                  type="button"
                  className="bf-btn-ondemand"
                  disabled={isOnDemandLoading}
                  onClick={() => handleTriggerOnDemand(onDemandTarget)}
                >
                  {isOnDemandLoading ? (
                    <span className="bf-pulse-loader">⏳ Menarik Data {onDemandTarget}...</span>
                  ) : (
                    <>⚡ Tarik Data On-Demand untuk {onDemandTarget}</>
                  )}
                </button>
              )}
            </div>
            {syncStatus && <div className="bf-search-status" style={{ color: "var(--green)" }}>{syncStatus}</div>}
          </div>
        )}

        {/* SECTION 0: DAILY BANDARMOLOGY INSIGHT & ACTION RADAR */}
        <section className="bf-daily-insight-container">
          {/* Top Bar: Title, Subtitle, and Horizon Switcher */}
          <div className="bf-daily-insight-topbar">
            <div className="bf-insight-title-group">
              <span className="bf-insight-badge">⚡ DAILY RADAR</span>
              <div>
                <h2 className="bf-insight-title">Bandarmology Flow &amp; Actionable Radar</h2>
                <div className="bf-insight-subtitle">
                  {dailyInsight.horizon_label} • {dailyInsight.date_range}
                </div>
              </div>
            </div>

            {/* Horizon Selector Pill Group */}
            <div className="bf-horizon-selector">
              <button
                type="button"
                className={`bf-horizon-btn ${activeHorizon === "2D" ? "active" : ""}`}
                onClick={() => handleHorizonChange("2D")}
                title="Inisiasi 2 Hari Bursa: Deteksi momentum & spike akumulasi awal"
              >
                2 HARI
              </button>
              <button
                type="button"
                className={`bf-horizon-btn ${activeHorizon === "5D" ? "active" : ""}`}
                onClick={() => handleHorizonChange("5D")}
                title="Weekly Persistence 5 Hari: Uji konsistensi akumulasi (Rekomendasi Utama)"
              >
                5 HARI (1 PEKAN)
              </button>
              <button
                type="button"
                className={`bf-horizon-btn ${activeHorizon === "10D" ? "active" : ""}`}
                onClick={() => handleHorizonChange("10D")}
                title="Structural Base 10 Hari: Fondasi modal inventori bandar"
              >
                10 HARI (2 PEKAN)
              </button>
            </div>
          </div>

          {/* Macro Pulse Strip */}
          <div className="bf-macro-pulse-strip">
            <div className="bf-macro-metrics-row">
              <div className="bf-macro-metric">
                <span className="bf-macro-metric-label">GLOBAL SMART MONEY (FOREIGN):</span>
                <span className={`bf-macro-metric-val ${dailyInsight.macro_pulse.foreign_net >= 0 ? "pos" : "neg"}`}>
                  {formatRupiah(dailyInsight.macro_pulse.foreign_net)}
                </span>
              </div>
              <div className="bf-macro-metric">
                <span className="bf-macro-metric-label">DANANTARA / BUMN SUPPORT:</span>
                <span className={`bf-macro-metric-val ${dailyInsight.macro_pulse.government_net >= 0 ? "pos" : "neg"}`}>
                  {formatRupiah(dailyInsight.macro_pulse.government_net)}
                </span>
              </div>
              <div className="bf-macro-metric">
                <span className="bf-macro-metric-label">RETAIL CROWD (XL, XC, YP):</span>
                <span className={`bf-macro-metric-val ${dailyInsight.macro_pulse.retail_net >= 0 ? "pos" : "neg"}`}>
                  {formatRupiah(dailyInsight.macro_pulse.retail_net)}
                </span>
              </div>
            </div>
            <div className="bf-macro-summary-sentence">
              <strong>Analisa Dinamika Aliran:</strong> {dailyInsight.macro_pulse.summary_sentence}
            </div>
          </div>

          {/* 3-Column Insight Grid */}
          <div className="bf-insight-grid">
            {/* Column 1: Sweet Spots / Siap Ditumpangi */}
            <div className="bf-insight-col">
              <div className="bf-insight-col-header sweet">
                <div className="bf-col-title sweet">
                  <span>🎯</span>
                  <span>SIAP DITUMPANGI (SWEET SPOT)</span>
                </div>
                <span className="bf-col-badge">{dailyInsight.sweet_spots.length} emiten</span>
              </div>
              <div className="bf-insight-col-body">
                {dailyInsight.sweet_spots.map((item) => (
                  <div key={item.ticker} className="bf-sweet-card">
                    <div className="bf-card-head">
                      <button
                        type="button"
                        className="bf-ticker-interactive"
                        onClick={() => handleTickerClick(item.ticker)}
                        title={`Buka detail analisis bandarmologi ${item.ticker}`}
                      >
                        {item.ticker}
                      </button>
                      <div className="bf-card-price-wrap">
                        <span style={{ fontWeight: 800 }}>{formatNumber(item.close)}</span>
                        <span style={{ color: item.change_percent >= 0 ? "var(--green)" : "var(--red)", fontWeight: 700 }}>
                          {item.change_percent >= 0 ? `+${item.change_percent.toFixed(1)}%` : `${item.change_percent.toFixed(1)}%`}
                        </span>
                      </div>
                    </div>

                    <div className="bf-card-cost-row">
                      <span>Modal Bandar: <strong>{formatNumber(item.bandar_cost)}</strong></span>
                      <span className={`bf-gap-tag ${item.gap_pct <= 0 ? "discount" : "sweet"}`}>
                        {item.gap_pct <= 0 ? `Diskon ${item.gap_pct.toFixed(1)}%` : `+${item.gap_pct.toFixed(1)}% dari modal`}
                      </span>
                    </div>

                    <div className="bf-card-lead-row">
                      <span className="bf-card-lead-label">Lead Accumulator:</span>
                      <span style={{ fontWeight: 600 }}>{item.lead_accumulator}</span>
                    </div>

                    <div className="bf-card-counterparty-row">
                      <span>🛡️ Counterparty:</span>
                      <span style={{ color: "var(--cyan)", fontWeight: 600 }}>{item.counterparty_purity}</span>
                    </div>

                    <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.4 }}>
                      {item.why_brief}
                    </div>

                    <div className="bf-card-action-bar">
                      <span className="bf-verdict-pill buy">{item.action_verdict}</span>
                      <span className="bf-plan-brief">Zone: {item.sweet_zone} | SL: {item.stop_loss}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Traps / Wajib Dijauhi */}
            <div className="bf-insight-col">
              <div className="bf-insight-col-header trap">
                <div className="bf-col-title trap">
                  <span>⚠️</span>
                  <span>DISTRIBUSI &amp; JEBAKAN RITEL</span>
                </div>
                <span className="bf-col-badge">{dailyInsight.traps.length} emiten</span>
              </div>
              <div className="bf-insight-col-body">
                {dailyInsight.traps.map((item) => (
                  <div key={item.ticker} className="bf-trap-card">
                    <div className="bf-card-head">
                      <button
                        type="button"
                        className="bf-ticker-interactive"
                        style={{ color: "#f87171" }}
                        onClick={() => handleTickerClick(item.ticker)}
                        title={`Buka detail analisis bandarmologi ${item.ticker}`}
                      >
                        {item.ticker}
                      </button>
                      <div className="bf-card-price-wrap">
                        <span style={{ fontWeight: 800 }}>{formatNumber(item.close)}</span>
                        <span style={{ color: item.change_percent >= 0 ? "var(--green)" : "var(--red)", fontWeight: 700 }}>
                          {item.change_percent >= 0 ? `+${item.change_percent.toFixed(1)}%` : `${item.change_percent.toFixed(1)}%`}
                        </span>
                      </div>
                    </div>

                    <div className="bf-card-cost-row" style={{ borderColor: "#3b1717" }}>
                      <span style={{ color: "#fca5a5" }}>Smart Money Net: <strong>{formatRupiah(item.smart_money_net)}</strong></span>
                      <span className="bf-gap-tag trap">Exit ~{formatNumber(item.bandar_exit_avg)}</span>
                    </div>

                    <div className="bf-card-lead-row">
                      <span className="bf-card-lead-label" style={{ color: "#f87171" }}>Dominant Seller:</span>
                      <span style={{ fontWeight: 600 }}>{item.smart_money_sellers}</span>
                    </div>

                    <div className="bf-card-counterparty-row">
                      <span>⚠️ Ritel Trap:</span>
                      <span style={{ color: "#fbbf24", fontWeight: 600 }}>{item.retail_buyers}</span>
                    </div>

                    <div style={{ fontSize: "11px", color: "#fca5a5", lineHeight: 1.4 }}>
                      {item.risk_warning}
                    </div>

                    <div className="bf-card-action-bar">
                      <span className={`bf-verdict-pill ${item.action_verdict.includes("AVOID") ? "avoid" : "wait"}`}>
                        {item.action_verdict}
                      </span>
                      <span className="bf-plan-brief" style={{ color: "#f87171" }}>Disarankan Tidak Masuk</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Retail Tracker (XL, XC, YP) */}
            <div className="bf-insight-col">
              <div className="bf-insight-col-header retail">
                <div className="bf-col-title retail">
                  <span>🔍</span>
                  <span>RETAIL TRACKER (XL, XC, YP)</span>
                </div>
                <span className="bf-col-badge">{dailyInsight.retail_footprints.length} broker</span>
              </div>
              <div className="bf-insight-col-body">
                {dailyInsight.retail_footprints.map((item) => (
                  <div key={item.broker_code} className="bf-retail-card">
                    <div className="bf-retail-head">
                      <div>
                        <span className="bf-retail-broker-code">{item.broker_code}</span>
                        <span style={{ fontSize: "11px", color: "var(--muted)", marginLeft: "6px" }}>
                          {item.broker_name}
                        </span>
                      </div>
                      <span className="bf-retail-sentiment-tag">{item.sentiment_label}</span>
                    </div>

                    <div className="bf-card-cost-row">
                      <span>Net Volume Ritel:</span>
                      <strong className={item.total_net >= 0 ? "pos" : "neg"} style={{ color: item.total_net >= 0 ? "#34d399" : "#f87171" }}>
                        {formatRupiah(item.total_net)}
                      </strong>
                    </div>

                    <div className="bf-retail-stocks-list">
                      <div style={{ fontSize: "10.5px", color: "var(--muted)", fontWeight: 700 }}>TOP AKUMULASI RITEL:</div>
                      {item.top_bought.map((s) => (
                        <div key={s.ticker} className="bf-retail-stock-row">
                          <span
                            style={{ cursor: "pointer", textDecoration: "underline" }}
                            onClick={() => handleTickerClick(s.ticker)}
                          >
                            {s.ticker}
                          </span>
                          <span className="bf-retail-stock-val pos">{formatRupiah(s.net_val)}</span>
                        </div>
                      ))}

                      {item.top_sold.length > 0 && (
                        <>
                          <div style={{ fontSize: "10.5px", color: "var(--muted)", fontWeight: 700, marginTop: "4px" }}>TOP CUTLOSS / DISTRIBUSI RITEL:</div>
                          {item.top_sold.map((s) => (
                            <div key={s.ticker} className="bf-retail-stock-row">
                              <span
                                style={{ cursor: "pointer", textDecoration: "underline" }}
                                onClick={() => handleTickerClick(s.ticker)}
                              >
                                {s.ticker}
                              </span>
                              <span className="bf-retail-stock-val neg">{formatRupiah(s.net_val)}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: TOP SUMMARY - 4 QUADRANTS & MARKET FLOW */}
        <section className="bf-top-grid">
          
          {/* Left: 4 Quadrants Matrix */}
          <div className="bf-panel">
            <div className="bf-panel-header">
              <span className="bf-panel-title">MARKET QUADRANT (PRICE VS SMART MONEY)</span>
              <span className="bf-panel-hint">Klik kartu untuk buka daftar saham</span>
            </div>

            <div className="bf-quadrant-cards">
              {/* Bull Acc */}
              <button
                type="button"
                onClick={() => {
                  setActiveFilterQuadrant("markup_akumulasi");
                  setActiveQuadrantModal("markup_akumulasi");
                  setModalSearch("");
                }}
                className={`bf-quad-card bull-acc ${
                  activeFilterQuadrant === "markup_akumulasi" ? "active" : ""
                }`}
                title={`Buka daftar ${marketSummary.quadrant_counts.markup_akumulasi} saham Markup + Akumulasi`}
              >
                <div className="bf-quad-label">BULL ACCUMULATION</div>
                <div className="bf-quad-count">
                  {marketSummary.quadrant_counts.markup_akumulasi}
                </div>
                <div className="bf-quad-sub">Markup + Akumulasi ↗</div>
              </button>

              {/* Bull Dist */}
              <button
                type="button"
                onClick={() => {
                  setActiveFilterQuadrant("markup_distribusi");
                  setActiveQuadrantModal("markup_distribusi");
                  setModalSearch("");
                }}
                className={`bf-quad-card bull-dist ${
                  activeFilterQuadrant === "markup_distribusi" ? "active" : ""
                }`}
                title={`Buka daftar ${marketSummary.quadrant_counts.markup_distribusi} saham Markup + Distribusi (Trap)`}
              >
                <div className="bf-quad-label">BULL DISTRIBUTION</div>
                <div className="bf-quad-count">
                  {marketSummary.quadrant_counts.markup_distribusi}
                </div>
                <div className="bf-quad-sub">Markup + Distribusi (Trap) ↗</div>
              </button>

              {/* Bear Acc */}
              <button
                type="button"
                onClick={() => {
                  setActiveFilterQuadrant("markdown_akumulasi");
                  setActiveQuadrantModal("markdown_akumulasi");
                  setModalSearch("");
                }}
                className={`bf-quad-card bear-acc ${
                  activeFilterQuadrant === "markdown_akumulasi" ? "active" : ""
                }`}
                title={`Buka daftar ${marketSummary.quadrant_counts.markdown_akumulasi} saham Markdown + Serapan`}
              >
                <div className="bf-quad-label">BEAR ACCUMULATION</div>
                <div className="bf-quad-count">
                  {marketSummary.quadrant_counts.markdown_akumulasi}
                </div>
                <div className="bf-quad-sub">Markdown + Serapan ↗</div>
              </button>

              {/* Bear Dist */}
              <button
                type="button"
                onClick={() => {
                  setActiveFilterQuadrant("markdown_distribusi");
                  setActiveQuadrantModal("markdown_distribusi");
                  setModalSearch("");
                }}
                className={`bf-quad-card bear-dist ${
                  activeFilterQuadrant === "markdown_distribusi" ? "active" : ""
                }`}
                title={`Buka daftar ${marketSummary.quadrant_counts.markdown_distribusi} saham Markdown + Distribusi`}
              >
                <div className="bf-quad-label">BEAR DISTRIBUTION</div>
                <div className="bf-quad-count">
                  {marketSummary.quadrant_counts.markdown_distribusi}
                </div>
                <div className="bf-quad-sub">Markdown + Distribusi ↗</div>
              </button>
            </div>
          </div>

          {/* Right: Smart Money Flow Summary Box */}
          <div className="bf-panel bf-summary-panel">
            <div>
              <div className="bf-panel-title">SMART MONEY FLOW SUMMARY</div>
              <div
                className={`bf-net-val ${
                  marketSummary.smart_money_net >= 0 ? "pos" : "neg"
                }`}
              >
                {formatRupiah(marketSummary.smart_money_net)}
              </div>
              <p className="bf-panel-hint">
                {marketSummary.smart_money_net >= 0
                  ? "Smart Money Net Inflow"
                  : "Smart Money Net Outflow"}
              </p>
            </div>

            <div className="bf-summary-meta">
              <div className="bf-meta-row">
                <span>Total Omzet Bursa:</span>
                <strong>{formatRupiah(marketSummary.total_turnover)}</strong>
              </div>
              <div className="bf-meta-row">
                <span>Saham Terpantau:</span>
                <strong>{marketSummary.total_classified} saham</strong>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: DUAL TABLES - TOP ACCUMULATION & TOP DISTRIBUTION */}
        <section className="bf-grid-2col">
          
          {/* Top Accumulation */}
          <div className="bf-table-card">
            <div className="bf-table-header">
              <div className="bf-table-title acc">
                <span>▲</span>
                <span>TOP ACCUMULATION (TOP 5 BROKER)</span>
              </div>
              <span className="bf-panel-hint">Top {topAccumulations.length} likuid • {activeDateBadge}</span>
            </div>

            <div className="bf-table-scroll">
              <table className="bf-table">
                <thead>
                  <tr>
                    <th>TICKER</th>
                    <th className="num">PRICE</th>
                    <th className="num">CHG%</th>
                    <th>TOP BUYERS</th>
                    <th className="num">SUM BUY</th>
                    <th className="num">SMART MONEY</th>
                  </tr>
                </thead>
                <tbody>
                  {topAccumulations.map((item) => {
                    const isSelected = selectedTicker?.ticker === item.ticker;
                    return (
                      <tr
                        key={item.ticker}
                        onClick={() => handleTickerClick(item.ticker)}
                        className={`clickable ${isSelected ? "active-row" : ""}`}
                        title={`Klik untuk menganalisis ${item.ticker}`}
                      >
                        <td className="ticker-link pos">{item.ticker}</td>
                        <td className="num">{formatNumber(item.close)}</td>
                        <td className={`num ${item.change_percent >= 0 ? "pos" : "neg"}`}>
                          {item.change_percent >= 0 ? "+" : ""}
                          {item.change_percent.toFixed(1)}%
                        </td>
                        <td className="muted">{item.top_buyers}</td>
                        <td className="num pos">{formatRupiah(item.sum_buy)}</td>
                        <td className={`num ${item.smart_money_net >= 0 ? "pos" : "neg"}`}>
                          {formatRupiah(item.smart_money_net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Distribution */}
          <div className="bf-table-card">
            <div className="bf-table-header">
              <div className="bf-table-title dist">
                <span>▼</span>
                <span>TOP DISTRIBUTION (TOP 5 BROKER)</span>
              </div>
              <span className="bf-panel-hint">Top {topDistributions.length} distribusi • {activeDateBadge}</span>
            </div>

            <div className="bf-table-scroll">
              <table className="bf-table">
                <thead>
                  <tr>
                    <th>TICKER</th>
                    <th className="num">PRICE</th>
                    <th className="num">CHG%</th>
                    <th>TOP SELLERS</th>
                    <th className="num">SUM SELL</th>
                    <th className="num">SMART MONEY</th>
                  </tr>
                </thead>
                <tbody>
                  {topDistributions.map((item) => {
                    const isSelected = selectedTicker?.ticker === item.ticker;
                    return (
                      <tr
                        key={item.ticker}
                        onClick={() => handleTickerClick(item.ticker)}
                        className={`clickable ${isSelected ? "active-row" : ""}`}
                        title={`Klik untuk menganalisis ${item.ticker}`}
                      >
                        <td className="ticker-link neg">{item.ticker}</td>
                        <td className="num">{formatNumber(item.close)}</td>
                        <td className={`num ${item.change_percent >= 0 ? "pos" : "neg"}`}>
                          {item.change_percent >= 0 ? "+" : ""}
                          {item.change_percent.toFixed(1)}%
                        </td>
                        <td className="muted">{item.top_sellers}</td>
                        <td className="num neg">{formatRupiah(item.sum_sell)}</td>
                        <td
                          className={`num ${
                            item.smart_money_net > 0 ? "pos" : "neg"
                          }`}
                        >
                          {formatRupiah(item.smart_money_net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 3: SECTOR FLOW & BROKER RANKING (Only shown on offline snapshot fallback; hidden in live mode) */}
        {!isSyncingLive && freshness?.source === "snapshot-fallback" && (
        <section className="bf-grid-2col">
          
          {/* Sector Smart Money Flow */}
          <div className="bf-table-card">
            <div className="bf-table-header">
              <span className="bf-table-title neutral">SECTOR SMART MONEY FLOW</span>
              <span className="bf-panel-hint">Referensi Snapshot Statis 20 Nov</span>
            </div>

            <div className="bf-table-scroll">
              <table className="bf-table">
                <thead>
                  <tr>
                    <th>SECTOR</th>
                    <th className="center">STOCKS</th>
                    <th className="num">SMART MONEY NET</th>
                    <th className="num">TOTAL VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  {DEFAULT_SECTOR_FLOWS.map((s) => (
                    <tr key={s.sector}>
                      <td style={{ fontWeight: 600, color: "var(--ink)" }}>{s.sector}</td>
                      <td className="center muted">{s.stocks_count}</td>
                      <td
                        className={`num ${
                          s.smart_money_net > 0 ? "pos" : "neg"
                        }`}
                        style={{ fontWeight: 600 }}
                      >
                        {formatRupiah(s.smart_money_net)}
                      </td>
                      <td className="num muted">{formatRupiah(s.total_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Broker Ranking */}
          <div className="bf-table-card">
            <div className="bf-table-header">
              <span className="bf-table-title neutral">TOP BROKER RANKING</span>
              <span className="bf-panel-hint">Referensi Snapshot Statis 20 Nov</span>
            </div>

            <div className="bf-table-scroll">
              <table className="bf-table">
                <thead>
                  <tr>
                    <th>BROKER</th>
                    <th className="num">BUY</th>
                    <th className="num">SELL</th>
                    <th className="num">NET</th>
                    <th className="num">STOCKS</th>
                  </tr>
                </thead>
                <tbody>
                  {DEFAULT_TOP_BROKERS.map((b) => (
                    <tr key={b.broker}>
                      <td className="sky" style={{ fontWeight: 700 }}>
                        {b.broker} <span className="muted" style={{ fontWeight: 400, fontSize: "10px" }}>{b.name}</span>
                      </td>
                      <td className="num pos">{formatRupiah(b.buy_value)}</td>
                      <td className="num neg">{formatRupiah(b.sell_value)}</td>
                      <td
                        className={`num ${
                          b.net_value > 0 ? "pos" : "neg"
                        }`}
                        style={{ fontWeight: 700 }}
                      >
                        {formatRupiah(b.net_value)}
                      </td>
                      <td className="num muted">{b.stocks_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        )}

        {/* SECTION 4: TICKER DEEP DIVE INSIGHT (MULTI-HORIZON 2D/5D/10D + TRADE PLAN + INLINE CHART) */}
        {selectedTicker && (
          <section id="ticker-insight-section" className="bf-insight-card">
            {/* Ticker Header */}
            <div className="bf-insight-top">
              <div className="bf-insight-ticker-group">
                <span className="bf-insight-ticker">{selectedTicker.ticker}</span>
                <span className="bf-insight-price">Rp {formatNumber(selectedTicker.close)}</span>
                <span
                  className={`bf-insight-chg ${
                    selectedTicker.change_percent >= 0 ? "pos" : "neg"
                  }`}
                >
                  {selectedTicker.change_percent >= 0 ? "+" : ""}
                  {selectedTicker.change_percent.toFixed(1)}%
                </span>
                <span className="bf-insight-period-tag">
                  Fokus Plan: {detailFocusHorizon} ({selectedTicker.date_range || selectedTicker.horizon_label})
                </span>
              </div>

              <div className="bf-insight-top-actions">
                <button
                  type="button"
                  className={`bf-btn-secondary ${isChartOpen ? "bf-btn-chart-active" : ""}`}
                  onClick={() => setIsChartOpen(!isChartOpen)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "5px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    borderRadius: "6px",
                    cursor: "pointer",
                    backgroundColor: isChartOpen ? "rgba(56, 189, 248, 0.18)" : undefined,
                    borderColor: isChartOpen ? "#38bdf8" : undefined,
                    color: isChartOpen ? "#38bdf8" : undefined,
                  }}
                  title={isChartOpen ? "Tutup grafik teknikal interaktif" : `Buka grafik teknikal interaktif untuk ${selectedTicker.ticker}`}
                >
                  {isChartOpen ? "📉 Tutup Chart" : "📈 Buka Chart Teknikal"}
                </button>

                <button
                  type="button"
                  className="bf-btn-secondary bf-btn-refresh-ondemand"
                  disabled={isOnDemandLoading || isTickerLoading}
                  onClick={() => handleTriggerOnDemand(selectedTicker.ticker)}
                  title={`Tarik data 2D, 5D, dan 10D terbaru langsung dari Max MCP untuk ${selectedTicker.ticker}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "5px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    borderRadius: "6px",
                    cursor: isOnDemandLoading || isTickerLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {(isOnDemandLoading || isTickerLoading) && selectedTickerCode === selectedTicker.ticker ? (
                    <span className="bf-pulse-loader">⏳ Syncing 2D/5D/10D...</span>
                  ) : (
                    <>⚡ Refresh On-Demand</>
                  )}
                </button>

                <div
                  className="bf-horizon-selector bf-insight-horizon-nav"
                  role="group"
                  aria-label={`Pilih horizon fokus Trade Plan dan Chart ${selectedTicker.ticker} tanpa loading`}
                >
                  {(["2D", "5D", "10D"] as HorizonPeriod[]).map((h) => (
                    <button
                      key={h}
                      type="button"
                      className={`bf-horizon-btn ${detailFocusHorizon === h ? "active" : ""}`}
                      aria-pressed={detailFocusHorizon === h}
                      onClick={() => handleDetailFocusHorizonChange(h)}
                      title={`Pindah fokus Trade Plan & Modal Chart ke horizon ${h} (instan tanpa loading)`}
                    >
                      {h}
                    </button>
                  ))}
                </div>

                <span
                  className={`bf-badge-pill ${
                    selectedTicker.status_color === "emerald"
                      ? "emerald"
                      : selectedTicker.status_color === "sky"
                      ? "sky"
                      : selectedTicker.status_color === "amber"
                      ? "amber"
                      : "rose"
                  }`}
                >
                  {selectedTicker.quadrant_label}
                </span>
              </div>
            </div>

            {/* Fallback Safeguard Notification */}
            {selectedTicker.is_horizon_fallback && (
              <div
                style={{
                  margin: "0",
                  padding: "10px 14px",
                  background: "rgba(245, 158, 11, 0.12)",
                  border: "1px solid rgba(245, 158, 11, 0.35)",
                  borderRadius: "6px",
                  color: "#fbbf24",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>⚠️</span>
                <span>
                  <strong>Informasi Multi-Horizon:</strong>{" "}
                  {selectedTicker.horizon_fallback_reason ||
                    `Snapshot lengkap 2D/5D/10D belum tersedia di fallback lokal untuk ${selectedTicker.ticker}. Tekan ⚡ Refresh On-Demand untuk menarik data live.`}
                </span>
              </div>
            )}

            {/* Simultaneous 2D • 5D • 10D Comparison Table */}
            <MultiHorizonTable
              ticker={selectedTicker.ticker}
              closePrice={selectedTicker.close}
              horizons={selectedTickerHorizons}
              focusedHorizon={detailFocusHorizon}
              onSelectFocusHorizon={handleDetailFocusHorizonChange}
              onRefreshTicker={() => handleTriggerOnDemand(selectedTicker.ticker)}
              isLoading={isTickerLoading || isOnDemandLoading}
            />

            {/* Bottom Grid: Focused Horizon Counterparty Summary + Actionable Trade Plan */}
            <div className="bf-mh-bottom-grid">
              <div className="bf-mh-focus-summary-card">
                <div className="bf-plan-title" style={{ color: "#6bd5ed" }}>
                  DISTRIBUTOR &amp; RINGKASAN COUNTERPARTY ({detailFocusHorizon})
                </div>

                <div className="bf-broker-list" style={{ marginTop: "4px" }}>
                  {selectedTicker.top_distributors.length > 0 ? (
                    selectedTicker.top_distributors.map((dist) => (
                      <div key={dist.code} className="bf-broker-item">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ color: "var(--red)", fontWeight: 700 }}>{dist.code}</span>
                          <span className="muted" style={{ fontSize: "11px" }}>{dist.name}</span>
                          <span className="bf-broker-tag">{dist.investor_group}</span>
                        </div>
                        <div>
                          <span className="neg" style={{ fontWeight: 700 }}>
                            {formatRupiah(dist.net_value)}
                          </span>
                          <span className="muted" style={{ marginLeft: "8px", fontSize: "11px" }}>
                            @ Rp {formatNumber(dist.avg_price)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: "11.5px", color: "var(--muted)" }}>
                      Tidak ada distributor dominan pada periode fokus {detailFocusHorizon}.
                    </div>
                  )}
                </div>

                <div className="bf-mh-focus-stats">
                  <div className="bf-stat-box">
                    <div className="label">NET VOLUME ({detailFocusHorizon})</div>
                    <div className="val" style={{ color: "var(--ink)", fontSize: "13.5px" }}>
                      {formatNumber(selectedTicker.net_volume_lots)} Lot
                    </div>
                  </div>
                  <div className="bf-stat-box">
                    <div className="label">KONSENTRASI</div>
                    <div className="val" style={{ color: "#6bd5ed", fontSize: "13.5px" }}>
                      {selectedTicker.concentration_pct.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bf-stat-box">
                    <div className="label">MODAL CHARTS ({detailFocusHorizon})</div>
                    <div className="val amber" style={{ fontSize: "13.5px" }}>
                      Rp {formatNumber(selectedTicker.bandar_avg_cost)}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--muted)",
                    fontStyle: "italic",
                    fontFamily: "ui-monospace, monospace",
                  }}
                >
                  Lawan Transaksi: {selectedTicker.counterparty_note}
                </div>
              </div>

              {/* Right: Actionable Trade Plan (Synchronized instantaneously with detailFocusHorizon) */}
              <div className="bf-plan-card">
                <div>
                  <div className="bf-plan-title">
                    ACTIONABLE TRADE PLAN (HORIZON {detailFocusHorizon})
                  </div>

                  <div style={{ marginTop: "12px" }}>
                    <div className="bf-plan-item">
                      <span className="label">REKOMENDASI AKSI:</span>
                      <span className="val pos" style={{ fontSize: "14px" }}>
                        {selectedTicker.trade_plan.action}
                      </span>
                    </div>

                    <div className="bf-plan-item">
                      <span className="label">AREA ENTRY IDEAL:</span>
                      <span className="bf-entry-pill">
                        Rp {selectedTicker.trade_plan.entry_zone}
                      </span>
                    </div>

                    <div className="bf-plan-item">
                      <span className="label">STOP LOSS:</span>
                      <span className="val neg">
                        Rp {selectedTicker.trade_plan.stop_loss}
                      </span>
                    </div>

                    <div className="bf-plan-item">
                      <span className="label">TARGET PRICE:</span>
                      <span className="val pos">
                        Rp {selectedTicker.trade_plan.target_price}
                      </span>
                    </div>

                    <div className="bf-plan-item">
                      <span className="label">REWARD / RISK RATIO:</span>
                      <span className="val amber" style={{ fontSize: "14px" }}>
                        {selectedTicker.trade_plan.rr_ratio}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bf-plan-note">
                  {selectedTicker.trade_plan.note}
                </div>
              </div>
            </div>

            {/* Embedded Inline Chart (Lightweight Charts: Volume, Supertrend, MACD, Modal Bandar) */}
            {isChartOpen && (
              <div className="bf-inline-chart-mount-point" style={{ marginTop: "20px" }}>
                <BrokerFlowInlineChart
                  ticker={selectedTicker.ticker}
                  bandarAvgCost={selectedTicker.bandar_avg_cost}
                  onClose={() => setIsChartOpen(false)}
                />
              </div>
            )}
          </section>
        )}

        {/* MARKET QUADRANT MAP MODAL (Opened upon clicking a quadrant card) */}
        {activeModalData && (
          <div
            className="bf-modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeQuadrantModal();
            }}
          >
            <div
              className="bf-modal-container"
              role="dialog"
              aria-modal="true"
              aria-labelledby="bf-quadrant-modal-title"
            >
              
              <div className="bf-modal-header">
                <div className="bf-modal-title-wrap">
                  <span
                    className={`bf-badge-pill ${
                      activeModalData.color === "emerald"
                        ? "emerald"
                        : activeModalData.color === "sky"
                        ? "sky"
                        : activeModalData.color === "amber"
                        ? "amber"
                        : "rose"
                    }`}
                  >
                    {activeModalData.stocks_count} SAHAM
                  </span>
                  <div id="bf-quadrant-modal-title" className="bf-modal-title">{activeModalData.name}</div>
                </div>
                <button
                  type="button"
                  onClick={closeQuadrantModal}
                  className="bf-modal-close"
                  title="Tutup (Esc)"
                  aria-label="Tutup modal kuadran"
                >
                  ✕
                </button>
              </div>

              <div className="bf-modal-body">
                <div className="bf-modal-philosophy">
                  <strong>Wyckoff / Smart Money Insight:</strong> {activeModalData.philosophy}
                </div>

                <input
                  type="text"
                  placeholder="FILTER EMITEN DI KUADRAN INI..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="bf-modal-search"
                  autoFocus
                />

                <div className="bf-modal-table-wrap">
                  <table className="bf-table">
                    <thead>
                      <tr>
                        <th>TICKER</th>
                        <th className="num">PRICE</th>
                        <th className="num">CHG%</th>
                        <th className="num">SMART MONEY NET</th>
                        <th className="center">AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredModalStocks.map((stock) => (
                        <tr
                          key={stock.ticker}
                          className="clickable"
                          onClick={() => handleTickerClick(stock.ticker)}
                        >
                          <td className="ticker-link pos">{stock.ticker}</td>
                          <td className="num">{formatNumber(stock.close)}</td>
                          <td
                            className={`num ${
                              stock.change_percent >= 0 ? "pos" : "neg"
                            }`}
                          >
                            {stock.change_percent >= 0 ? "+" : ""}
                            {stock.change_percent.toFixed(1)}%
                          </td>
                          <td
                            className={`num ${
                              stock.smart_money_net >= 0 ? "pos" : "neg"
                            }`}
                            style={{ fontWeight: 700 }}
                          >
                            {formatRupiah(stock.smart_money_net)}
                          </td>
                          <td className="center">
                            <button
                              type="button"
                              className="bf-btn-primary"
                              style={{
                                padding: "4px 10px",
                                fontSize: "10px",
                                cursor: "pointer",
                                border: "none",
                                borderRadius: "4px",
                                fontWeight: 700,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTickerClick(stock.ticker);
                              }}
                              title={`Buka analisis mendalam untuk ${stock.ticker}`}
                            >
                              ANALYSIS →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ fontSize: "11px", color: "var(--muted)", textAlign: "right" }}>
                  Klik salah satu baris emiten untuk langsung membuka analisis Ticker Deep Dive.
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </JournalShell>
  );
}
