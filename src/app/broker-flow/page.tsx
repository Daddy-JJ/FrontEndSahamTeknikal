"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  DEFAULT_MARKET_SUMMARY,
  DEFAULT_TOP_ACCUMULATIONS,
  DEFAULT_TOP_DISTRIBUTIONS,
  DEFAULT_TOP_BROKERS,
  DEFAULT_SECTOR_FLOWS,
  TICKER_DETAILS_MAP,
  formatRupiah,
  formatNumber,
  type TickerBrokerDetail,
} from "@/lib/broker-flow";

export default function BrokerFlowPage() {
  const [selectedTicker, setSelectedTicker] = useState<TickerBrokerDetail | null>(
    TICKER_DETAILS_MAP.MBMA
  );
  const [activeFilterQuadrant, setActiveFilterQuadrant] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleTickerClick = (tickerCode: string) => {
    const detail = TICKER_DETAILS_MAP[tickerCode.toUpperCase()];
    if (detail) {
      setSelectedTicker(detail);
      // Auto-scroll to detail if on mobile
      const el = document.getElementById("ticker-insight-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const detail = TICKER_DETAILS_MAP[searchQuery.toUpperCase().trim()];
    if (detail) {
      setSelectedTicker(detail);
    } else {
      alert(`Data detail untuk ticker ${searchQuery.toUpperCase()} belum tersedia pada snapshot ini.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b101b] text-[#e2e8f0] font-sans antialiased pb-16">
      {/* Top Header Bar */}
      <header className="border-b border-slate-800 bg-[#0e1626]/90 backdrop-blur sticky top-0 z-40 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold tracking-wider text-sm font-mono text-white">IDX TERMINAL</span>
            <span className="text-slate-500 text-xs hidden sm:inline">|</span>
            <span className="text-xs font-mono text-slate-300">
              DATA: <strong className="text-emerald-400">{DEFAULT_MARKET_SUMMARY.date}</strong>
            </span>
            <span className="text-xs font-mono text-slate-300">
              IHSG: <strong className="text-rose-400">5,146.326 -0.92%</strong>
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700 font-mono">
              API ACTIVE
            </span>
          </div>

          {/* Navigation Bar */}
          <nav className="flex items-center gap-1 text-xs font-mono">
            <Link href="/" className="px-3 py-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition">
              DASHBOARD
            </Link>
            <Link href="/scanner" className="px-3 py-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition">
              SCREENER
            </Link>
            <span className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/40 rounded font-bold">
              BROKER FLOW
            </span>
            <Link href="/chart" className="px-3 py-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition">
              TICKER DETAIL
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 pt-4 space-y-6">
        
        {/* Page Title & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
          <div>
            <div className="text-[11px] font-mono text-blue-400 font-semibold tracking-wider uppercase">
              &bull; BROKER FLOW &bull; MARKET WIDE &bull;
            </div>
            <h1 className="text-lg font-bold text-white tracking-wide">
              Smart Money Flow & Bandarmology Intelligence
            </h1>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Ticker (e.g. MBMA, BBRI, BBCA)..."
              className="px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs font-mono uppercase text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-56"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-mono text-xs font-bold transition"
            >
              ANALYZE
            </button>
          </form>
        </div>

        {/* SECTION 1: MARKET QUADRANT & SMART MONEY FLOW SUMMARY (Screenshot 1 top) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: 4-Quadrant Summary Box */}
          <div className="lg:col-span-2 p-3.5 rounded-lg border border-slate-800 bg-slate-900/60 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-mono font-bold tracking-wider text-slate-300">
                MARKET QUADRANT SUMMARY
              </span>
              <span className="text-[10px] font-mono text-slate-400 italic">
                Klik kartu untuk filter kuadran
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Bull Acc */}
              <button
                type="button"
                onClick={() => setActiveFilterQuadrant(activeFilterQuadrant === "markup_akumulasi" ? null : "markup_akumulasi")}
                className={`p-3 rounded text-left border transition active:scale-95 ${
                  activeFilterQuadrant === "markup_akumulasi"
                    ? "border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500"
                    : "border-emerald-900/60 bg-emerald-950/20 hover:border-emerald-700"
                }`}
              >
                <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  BULL ACCUMULATION
                </div>
                <div className="text-2xl font-mono font-bold text-emerald-400 mt-1 tabular-nums">
                  {DEFAULT_MARKET_SUMMARY.quadrant_counts.markup_akumulasi}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Markup + Akumulasi</div>
              </button>

              {/* Bull Dist */}
              <button
                type="button"
                onClick={() => setActiveFilterQuadrant(activeFilterQuadrant === "markup_distribusi" ? null : "markup_distribusi")}
                className={`p-3 rounded text-left border transition active:scale-95 ${
                  activeFilterQuadrant === "markup_distribusi"
                    ? "border-amber-500 bg-amber-950/40 ring-1 ring-amber-500"
                    : "border-amber-900/60 bg-amber-950/20 hover:border-amber-700"
                }`}
              >
                <div className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                  BULL DISTRIBUTION
                </div>
                <div className="text-2xl font-mono font-bold text-amber-400 mt-1 tabular-nums">
                  {DEFAULT_MARKET_SUMMARY.quadrant_counts.markup_distribusi}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Markup + Distribusi (Trap)</div>
              </button>

              {/* Bear Acc */}
              <button
                type="button"
                onClick={() => setActiveFilterQuadrant(activeFilterQuadrant === "markdown_akumulasi" ? null : "markdown_akumulasi")}
                className={`p-3 rounded text-left border transition active:scale-95 ${
                  activeFilterQuadrant === "markdown_akumulasi"
                    ? "border-sky-500 bg-sky-950/40 ring-1 ring-sky-500"
                    : "border-sky-900/60 bg-sky-950/20 hover:border-sky-700"
                }`}
              >
                <div className="text-[10px] font-mono text-sky-400 font-bold uppercase tracking-wider">
                  BEAR ACCUMULATION
                </div>
                <div className="text-2xl font-mono font-bold text-sky-400 mt-1 tabular-nums">
                  {DEFAULT_MARKET_SUMMARY.quadrant_counts.markdown_akumulasi}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Markdown + Serapan</div>
              </button>

              {/* Bear Dist */}
              <button
                type="button"
                onClick={() => setActiveFilterQuadrant(activeFilterQuadrant === "markdown_distribusi" ? null : "markdown_distribusi")}
                className={`p-3 rounded text-left border transition active:scale-95 ${
                  activeFilterQuadrant === "markdown_distribusi"
                    ? "border-rose-500 bg-rose-950/40 ring-1 ring-rose-500"
                    : "border-rose-900/60 bg-rose-950/20 hover:border-rose-700"
                }`}
              >
                <div className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider">
                  BEAR DISTRIBUTION
                </div>
                <div className="text-2xl font-mono font-bold text-rose-400 mt-1 tabular-nums">
                  {DEFAULT_MARKET_SUMMARY.quadrant_counts.markdown_distribusi}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Markdown + Distribusi</div>
              </button>
            </div>
          </div>

          {/* Right: Smart Money Flow Summary Box */}
          <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                SMART MONEY FLOW SUMMARY
              </div>
              <div className="text-3xl font-mono font-bold text-rose-400 mt-3 tabular-nums">
                {formatRupiah(DEFAULT_MARKET_SUMMARY.smart_money_net)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                Smart Money Net Outflow
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 font-mono text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Total Omzet Bursa:</span>
                <strong className="text-slate-200">
                  {formatRupiah(DEFAULT_MARKET_SUMMARY.total_turnover)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Saham Terpantau:</span>
                <strong className="text-slate-200">
                  {DEFAULT_MARKET_SUMMARY.total_classified} saham
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: DUAL TABLES - TOP ACCUMULATION & TOP DISTRIBUTION (Screenshot 1 bottom) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Top Accumulation */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 bg-emerald-950/20 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">&blacktriangle;</span>
                <span className="font-mono text-xs font-bold text-emerald-400 tracking-wider">
                  TOP ACCUMULATION (TOP 5 BROKER)
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">88 stocks</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 text-[11px] bg-slate-950/40">
                    <th className="py-2 px-3">TICKER</th>
                    <th className="py-2 px-3">PRICE</th>
                    <th className="py-2 px-3">CHG%</th>
                    <th className="py-2 px-3">TOP 5 BUYERS</th>
                    <th className="py-2 px-3 text-right">SUM BUY</th>
                    <th className="py-2 px-3 text-right">SMART MONEY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {DEFAULT_TOP_ACCUMULATIONS.map((item) => (
                    <tr
                      key={item.ticker}
                      onClick={() => handleTickerClick(item.ticker)}
                      className="cursor-pointer hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2 px-3 font-bold text-emerald-400 hover:underline">
                        {item.ticker}
                      </td>
                      <td className="py-2 px-3 tabular-nums">{formatNumber(item.close)}</td>
                      <td className="py-2 px-3 tabular-nums text-emerald-400">
                        +{item.change_percent.toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 text-slate-300 text-[11px]">{item.top_buyers}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-emerald-400 font-semibold">
                        +{formatRupiah(item.sum_buy)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-emerald-400">
                        +{formatRupiah(item.smart_money_net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Distribution */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 bg-rose-950/20 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-rose-400 font-bold">&blacktriangledown;</span>
                <span className="font-mono text-xs font-bold text-rose-400 tracking-wider">
                  TOP DISTRIBUTION (TOP 5 BROKER)
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">112 stocks</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 text-[11px] bg-slate-950/40">
                    <th className="py-2 px-3">TICKER</th>
                    <th className="py-2 px-3">PRICE</th>
                    <th className="py-2 px-3">CHG%</th>
                    <th className="py-2 px-3">TOP 5 SELLERS</th>
                    <th className="py-2 px-3 text-right">SUM SELL</th>
                    <th className="py-2 px-3 text-right">SMART MONEY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {DEFAULT_TOP_DISTRIBUTIONS.map((item) => (
                    <tr
                      key={item.ticker}
                      onClick={() => handleTickerClick(item.ticker)}
                      className="cursor-pointer hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2 px-3 font-bold text-rose-400 hover:underline">
                        {item.ticker}
                      </td>
                      <td className="py-2 px-3 tabular-nums">{formatNumber(item.close)}</td>
                      <td className="py-2 px-3 tabular-nums text-rose-400">
                        {item.change_percent.toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 text-slate-300 text-[11px]">{item.top_sellers}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-rose-400 font-semibold">
                        {formatRupiah(item.sum_sell)}
                      </td>
                      <td className={`py-2 px-3 text-right tabular-nums ${item.smart_money_net > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {formatRupiah(item.smart_money_net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 3: SECTOR SMART MONEY FLOW & TOP BROKER RANKING (Screenshot 2) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Sector Smart Money Flow */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center">
              <span className="font-mono text-xs font-bold text-slate-200 tracking-wider">
                SECTOR SMART MONEY FLOW
              </span>
              <span className="text-[11px] font-mono text-slate-400">by sector</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 text-[11px] bg-slate-950/30">
                    <th className="py-2 px-3">SECTOR</th>
                    <th className="py-2 px-3 text-center">STOCKS</th>
                    <th className="py-2 px-3 text-right">SMART MONEY NET</th>
                    <th className="py-2 px-3 text-right">VALUE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {DEFAULT_SECTOR_FLOWS.map((s) => (
                    <tr key={s.sector} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-semibold text-slate-200">{s.sector}</td>
                      <td className="py-2 px-3 text-center tabular-nums text-slate-400">{s.stocks_count}</td>
                      <td
                        className={`py-2 px-3 text-right tabular-nums font-semibold ${
                          s.smart_money_net > 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {formatRupiah(s.smart_money_net)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-slate-300">
                        {formatRupiah(s.total_value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Broker Ranking */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center">
              <span className="font-mono text-xs font-bold text-slate-200 tracking-wider">
                TOP BROKER RANKING
              </span>
              <span className="text-[11px] font-mono text-slate-400">200 stocks</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 text-[11px] bg-slate-950/30">
                    <th className="py-2 px-3">BROKER</th>
                    <th className="py-2 px-3 text-right">BUY</th>
                    <th className="py-2 px-3 text-right">SELL</th>
                    <th className="py-2 px-3 text-right">NET</th>
                    <th className="py-2 px-3 text-right">STOCKS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {DEFAULT_TOP_BROKERS.map((b) => (
                    <tr key={b.broker} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-bold text-blue-400">
                        {b.broker} <span className="text-slate-500 font-normal text-[10px] hidden sm:inline">{b.name}</span>
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-emerald-400">
                        +{formatRupiah(b.buy_value)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-rose-400">
                        {formatRupiah(b.sell_value)}
                      </td>
                      <td
                        className={`py-2 px-3 text-right tabular-nums font-bold ${
                          b.net_value > 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {formatRupiah(b.net_value)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-slate-400 text-[11px]">
                        {b.stocks_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 4: TICKER DEEP DIVE INSIGHT (WHO, WHAT, HOW MUCH, AT WHAT PRICE, WHY) */}
        {selectedTicker && (
          <section id="ticker-insight-section" className="p-4 rounded-xl border border-blue-500/30 bg-slate-900/90 shadow-2xl space-y-4">
            
            {/* Ticker Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold font-mono text-white tracking-wider">
                  {selectedTicker.ticker}
                </span>
                <span className="text-lg font-mono text-slate-300">
                  Rp {formatNumber(selectedTicker.close)}
                </span>
                <span
                  className={`text-sm font-mono font-bold ${
                    selectedTicker.change_percent >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {selectedTicker.change_percent >= 0 ? "+" : ""}
                  {selectedTicker.change_percent.toFixed(1)}%
                </span>
              </div>

              <span
                className={`px-3 py-1 rounded text-xs font-mono font-bold border ${
                  selectedTicker.status_color === "emerald"
                    ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                    : selectedTicker.status_color === "sky"
                    ? "bg-sky-950 text-sky-300 border-sky-700"
                    : selectedTicker.status_color === "amber"
                    ? "bg-amber-950 text-amber-300 border-amber-700"
                    : "bg-rose-950 text-rose-300 border-rose-700"
                }`}
              >
                {selectedTicker.quadrant_label}
              </span>
            </div>

            {/* Quantitative Footprints Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">NET VALUE SMART MONEY</div>
                <div
                  className={`text-base font-bold mt-0.5 ${
                    selectedTicker.net_value >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {formatRupiah(selectedTicker.net_value)}
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">NET VOLUME</div>
                <div className="text-base font-bold text-slate-200 mt-0.5">
                  {formatNumber(selectedTicker.net_volume_lots)} Lot
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">HARGA MODAL BANDAR</div>
                <div className="text-base font-bold text-amber-300 mt-0.5">
                  Rp {formatNumber(selectedTicker.bandar_avg_cost)}
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">JARAK KE MODAL (PnL BANDAR)</div>
                <div
                  className={`text-base font-bold mt-0.5 ${
                    selectedTicker.bandar_cost_gap_pct >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {selectedTicker.bandar_cost_gap_pct >= 0 ? "+" : ""}
                  {selectedTicker.bandar_cost_gap_pct.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Main Insight & Breakdown Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Left 2 Cols: Broker Breakdown & Why Insight */}
              <div className="lg:col-span-2 space-y-3">
                {/* Who: Top Accumulators & Distributors */}
                <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/40">
                  <div className="text-xs font-mono font-bold text-slate-300 mb-2">
                    SIAPA AKUMULATOR & DISTRIBUTOR UTAMA (WHO):
                  </div>
                  
                  <div className="space-y-1.5 font-mono text-xs">
                    {selectedTicker.top_accumulators.map((acc) => (
                      <div
                        key={acc.code}
                        className="flex justify-between items-center p-2 rounded bg-slate-900 border border-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-400">{acc.code}</span>
                          <span className="text-slate-400 text-[11px]">{acc.name}</span>
                          <span className="text-[10px] px-1 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800">
                            {acc.investor_group}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-400 tabular-nums">
                            +{formatRupiah(acc.net_value)}
                          </span>
                          <span className="text-slate-400 text-[11px] ml-2">@ Rp {formatNumber(acc.avg_price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 italic font-mono">
                    Lawan Transaksi: {selectedTicker.counterparty_note}
                  </p>
                </div>

                {/* Insight Kenapa (Why) */}
                <div className="p-3.5 rounded-lg border border-blue-500/40 bg-blue-950/20 text-xs leading-relaxed">
                  <div className="font-bold text-blue-300 flex items-center gap-1.5 mb-1.5 font-mono">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    INSIGHT KENAPA (THE "WHY" FACTOR):
                  </div>
                  <p className="text-slate-200">{selectedTicker.why_insight}</p>
                </div>
              </div>

              {/* Right Col: Actionable Trade Plan */}
              <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 flex flex-col justify-between">
                <div>
                  <div className="font-mono font-bold text-xs text-emerald-400 border-b border-slate-800 pb-2 mb-3 tracking-wider">
                    ACTIONABLE TRADE PLAN
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">REKOMENDASI AKSI:</span>
                      <span className="font-bold text-sm text-emerald-400">
                        {selectedTicker.trade_plan.action}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block">AREA ENTRY IDEAL:</span>
                      <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded inline-block border border-slate-700">
                        Rp {selectedTicker.trade_plan.entry_zone}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block">STOP LOSS:</span>
                      <span className="font-bold text-rose-400">
                        Rp {selectedTicker.trade_plan.stop_loss}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block">TARGET PRICE:</span>
                      <span className="font-bold text-emerald-400">
                        Rp {selectedTicker.trade_plan.target_price}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block">REWARD / RISK RATIO:</span>
                      <span className="font-bold text-amber-300 text-sm">
                        {selectedTicker.trade_plan.rr_ratio}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 italic">
                  {selectedTicker.trade_plan.note}
                </div>
              </div>
            </div>

          </section>
        )}

      </main>
    </div>
  );
}
