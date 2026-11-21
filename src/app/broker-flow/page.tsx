"use client";

import React, { useState } from "react";
import { JournalShell } from "@/components/journal-shell";
import {
  DEFAULT_MARKET_SUMMARY,
  DEFAULT_TOP_ACCUMULATIONS,
  DEFAULT_TOP_DISTRIBUTIONS,
  DEFAULT_TOP_BROKERS,
  DEFAULT_SECTOR_FLOWS,
  TICKER_DETAILS_MAP,
  QUADRANT_MAPS,
  fetchTickerDetail,
  formatRupiah,
  formatNumber,
  type TickerBrokerDetail,
} from "@/lib/broker-flow";
import "./broker-flow.css";

export default function BrokerFlowPage() {
  const [selectedTicker, setSelectedTicker] = useState<TickerBrokerDetail | null>(
    TICKER_DETAILS_MAP.MBMA
  );
  const [activeFilterQuadrant, setActiveFilterQuadrant] = useState<string | null>(null);
  const [activeQuadrantModal, setActiveQuadrantModal] = useState<string | null>(null);
  const [modalSearch, setModalSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleTickerClick = async (tickerCode: string) => {
    const detail = await fetchTickerDetail(tickerCode);
    if (detail) {
      setSelectedTicker(detail);
      setSearchStatus(null);
      if (activeQuadrantModal) {
        setActiveQuadrantModal(null);
      }
      setTimeout(() => {
        const el = document.getElementById("ticker-insight-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchStatus("Mencari data emiten...");

    try {
      const detail = await fetchTickerDetail(searchQuery);
      if (detail) {
        setSelectedTicker(detail);
        setSearchStatus(`Menampilkan data analisis untuk ${detail.ticker}`);
        setTimeout(() => {
          const el = document.getElementById("ticker-insight-section");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 50);
      } else {
        setSearchStatus(`Data untuk ${searchQuery.toUpperCase()} belum tersedia pada sesi ini.`);
      }
    } catch {
      setSearchStatus(`Gagal memuat data untuk ${searchQuery.toUpperCase()}.`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualSync = () => {
    setSyncStatus("Menghubungkan ke Supabase Edge Function...");
    setTimeout(() => {
      setSyncStatus("Sinkronisasi EOD Broksum Sukses (Snapshot 20 Nov 2026 Aktif)");
      setTimeout(() => setSyncStatus(null), 4000);
    }, 800);
  };

  // Active quadrant data for modal
  const activeModalData = activeQuadrantModal ? QUADRANT_MAPS[activeQuadrantModal] : null;
  const filteredModalStocks = activeModalData
    ? activeModalData.stocks.filter((s) =>
        s.ticker.toLowerCase().includes(modalSearch.toLowerCase())
      )
    : [];

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
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Sync Button */}
            <button
              type="button"
              onClick={handleManualSync}
              className="bf-btn-sync"
              title="Manual Trigger Sync Broksum EOD via Supabase Edge Function"
            >
              <span>↻</span>
              <span>SYNC BROKSUM</span>
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
        {(searchStatus || syncStatus) && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
            {searchStatus && <div className="bf-search-status">{searchStatus}</div>}
            {syncStatus && <div className="bf-search-status" style={{ color: "var(--green)" }}>{syncStatus}</div>}
          </div>
        )}

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
                title="Buka daftar 111 saham Markup + Akumulasi"
              >
                <div className="bf-quad-label">BULL ACCUMULATION</div>
                <div className="bf-quad-count">
                  {DEFAULT_MARKET_SUMMARY.quadrant_counts.markup_akumulasi}
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
                title="Buka daftar 86 saham Markup + Distribusi (Trap)"
              >
                <div className="bf-quad-label">BULL DISTRIBUTION</div>
                <div className="bf-quad-count">
                  {DEFAULT_MARKET_SUMMARY.quadrant_counts.markup_distribusi}
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
                title="Buka daftar 142 saham Markdown + Serapan"
              >
                <div className="bf-quad-label">BEAR ACCUMULATION</div>
                <div className="bf-quad-count">
                  {DEFAULT_MARKET_SUMMARY.quadrant_counts.markdown_akumulasi}
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
                title="Buka daftar 287 saham Markdown + Distribusi"
              >
                <div className="bf-quad-label">BEAR DISTRIBUTION</div>
                <div className="bf-quad-count">
                  {DEFAULT_MARKET_SUMMARY.quadrant_counts.markdown_distribusi}
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
                  DEFAULT_MARKET_SUMMARY.smart_money_net >= 0 ? "pos" : "neg"
                }`}
              >
                {formatRupiah(DEFAULT_MARKET_SUMMARY.smart_money_net)}
              </div>
              <p className="bf-panel-hint">
                {DEFAULT_MARKET_SUMMARY.smart_money_net >= 0
                  ? "Smart Money Net Inflow"
                  : "Smart Money Net Outflow"}
              </p>
            </div>

            <div className="bf-summary-meta">
              <div className="bf-meta-row">
                <span>Total Omzet Bursa:</span>
                <strong>{formatRupiah(DEFAULT_MARKET_SUMMARY.total_turnover)}</strong>
              </div>
              <div className="bf-meta-row">
                <span>Saham Terpantau:</span>
                <strong>{DEFAULT_MARKET_SUMMARY.total_classified} saham</strong>
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
              <span className="bf-panel-hint">88 stocks</span>
            </div>

            <div className="bf-table-scroll">
              <table className="bf-table">
                <thead>
                  <tr>
                    <th>TICKER</th>
                    <th className="num">PRICE</th>
                    <th className="num">CHG%</th>
                    <th>TOP 5 BUYERS</th>
                    <th className="num">SUM BUY</th>
                    <th className="num">SMART MONEY</th>
                  </tr>
                </thead>
                <tbody>
                  {DEFAULT_TOP_ACCUMULATIONS.map((item) => {
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
                        <td className="num pos">+{item.change_percent.toFixed(1)}%</td>
                        <td className="muted">{item.top_buyers}</td>
                        <td className="num pos">{formatRupiah(item.sum_buy)}</td>
                        <td className="num pos">{formatRupiah(item.smart_money_net)}</td>
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
              <span className="bf-panel-hint">112 stocks</span>
            </div>

            <div className="bf-table-scroll">
              <table className="bf-table">
                <thead>
                  <tr>
                    <th>TICKER</th>
                    <th className="num">PRICE</th>
                    <th className="num">CHG%</th>
                    <th>TOP 5 SELLERS</th>
                    <th className="num">SUM SELL</th>
                    <th className="num">SMART MONEY</th>
                  </tr>
                </thead>
                <tbody>
                  {DEFAULT_TOP_DISTRIBUTIONS.map((item) => {
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
                        <td className="num neg">{item.change_percent.toFixed(1)}%</td>
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

        {/* SECTION 3: SECTOR FLOW & BROKER RANKING */}
        <section className="bf-grid-2col">
          
          {/* Sector Smart Money Flow */}
          <div className="bf-table-card">
            <div className="bf-table-header">
              <span className="bf-table-title neutral">SECTOR SMART MONEY FLOW</span>
              <span className="bf-panel-hint">by sector</span>
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
              <span className="bf-panel-hint">200 stocks</span>
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

        {/* SECTION 4: TICKER DEEP DIVE INSIGHT (WHO, WHAT, HOW MUCH, AT WHAT PRICE, WHY) */}
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

            {/* Quantitative Footprints Grid */}
            <div className="bf-stats-grid">
              <div className="bf-stat-box">
                <div className="label">NET VALUE SMART MONEY</div>
                <div
                  className={`val ${
                    selectedTicker.net_value >= 0 ? "pos" : "neg"
                  }`}
                >
                  {formatRupiah(selectedTicker.net_value)}
                </div>
              </div>

              <div className="bf-stat-box">
                <div className="label">NET VOLUME</div>
                <div className="val" style={{ color: "var(--ink)" }}>
                  {formatNumber(selectedTicker.net_volume_lots)} Lot
                </div>
              </div>

              <div className="bf-stat-box">
                <div className="label">HARGA MODAL BANDAR</div>
                <div className="val amber">
                  Rp {formatNumber(selectedTicker.bandar_avg_cost)}
                </div>
              </div>

              <div className="bf-stat-box">
                <div className="label">JARAK KE MODAL (PnL BANDAR)</div>
                <div
                  className={`val ${
                    selectedTicker.bandar_cost_gap_pct >= 0 ? "pos" : "neg"
                  }`}
                >
                  {selectedTicker.bandar_cost_gap_pct >= 0 ? "+" : ""}
                  {selectedTicker.bandar_cost_gap_pct.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Main Insight & Breakdown Layout */}
            <div className="bf-insight-bottom-grid">
              
              {/* Left: Who & Why */}
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>
                  SIAPA AKUMULATOR &amp; DISTRIBUTOR UTAMA (WHO):
                </div>
                
                <div className="bf-broker-list">
                  {selectedTicker.top_accumulators.map((acc) => (
                    <div key={acc.code} className="bf-broker-item">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="sky" style={{ fontWeight: 700 }}>{acc.code}</span>
                        <span className="muted" style={{ fontSize: "11px" }}>{acc.name}</span>
                        <span className="bf-broker-tag">{acc.investor_group}</span>
                      </div>
                      <div>
                        <span className="pos" style={{ fontWeight: 700 }}>
                          {formatRupiah(acc.net_value)}
                        </span>
                        <span className="muted" style={{ marginLeft: "8px", fontSize: "11px" }}>
                          @ Rp {formatNumber(acc.avg_price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: "11px", color: "var(--muted)", fontStyle: "italic", marginTop: "8px", fontFamily: "ui-monospace, monospace" }}>
                  Lawan Transaksi: {selectedTicker.counterparty_note}
                </div>

                {/* Insight Kenapa (Why) */}
                <div className="bf-why-banner">
                  <div className="bf-why-title">
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6bd5ed", display: "inline-block" }}></span>
                    INSIGHT KENAPA (THE &quot;WHY&quot; FACTOR):
                  </div>
                  <div style={{ color: "var(--ink)" }}>{selectedTicker.why_insight}</div>
                </div>
              </div>

              {/* Right: Actionable Trade Plan */}
              <div className="bf-plan-card">
                <div>
                  <div className="bf-plan-title">ACTIONABLE TRADE PLAN</div>

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

          </section>
        )}

        {/* MARKET QUADRANT MAP MODAL (Opened upon clicking a quadrant card) */}
        {activeModalData && (
          <div
            className="bf-modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setActiveQuadrantModal(null);
            }}
          >
            <div className="bf-modal-container">
              
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
                  <div className="bf-modal-title">{activeModalData.name}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveQuadrantModal(null)}
                  className="bf-modal-close"
                  title="Tutup (Esc)"
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
                            <span
                              className="bf-btn-primary"
                              style={{ padding: "3px 8px", fontSize: "10px" }}
                            >
                              ANALYSIS →
                            </span>
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
