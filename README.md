# SahamTeknikal — Indonesian Stock Market Intelligence & Quantitative Trading Console

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.0.0-black?style=for-the-badge&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-Local_Cache-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Max_Trade-MCP_Server-FF6B6B?style=for-the-badge" alt="Max Trade MCP" />
  <img src="https://img.shields.io/badge/Architecture-BFF_Orchestrator-8A2BE2?style=for-the-badge" alt="BFF Architecture" />
</p>

---

## ⚡ Overview

**SahamTeknikal** is a professional-grade command center and algorithmic screening platform tailored for the **Indonesia Stock Exchange (IDX / BEI)**. It bridges quantitative technical price action with institutional bandarmology flow and real-time corporate intelligence.

Built with a high-performance **Next.js 16 App Router** frontend, a dedicated **Backend-for-Frontend (BFF)** orchestration layer, and upstream integrations with the **Max Trade MCP Server** and **IDX Upstream API**, SahamTeknikal gives traders instant market clarity without noise or lag.

```
       ┌─────────────────────────────────────────────────────────────┐
       │                   SAHAMTEKNIKAL WEB PLATFORM                │
       └─────────────────────────────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
  ┌───────────────┐           ┌───────────────┐           ┌───────────────┐
  │   DASHBOARD   │           │  BROKER FLOW  │           │   CALENDAR    │
  │  & SCREENER   │           │ MULTI-HORIZON │           │   ACTIONS     │
  └───────────────┘           └───────────────┘           └───────────────┘
          │                           │                           │
          └───────────────────────────┼───────────────────────────┘
                                      ▼
                      ┌───────────────────────────────┐
                      │   TICKER INTELLIGENCE CONSOLE │
                      │   8-Tab Deep Stock Analysis   │
                      └───────────────────────────────┘
```

---

## 🏗️ Architecture & Data Pipelines

The system is designed with a resilient, multi-tiered architecture that isolates external data latency from the user interface.

```mermaid
flowchart TD
    subgraph Data Sources
        MCP["Max Trade MCP Server<br/>(EOD, Broksum, Bandarmology, Pivots)"]
        IDX["IDX Upstream Proxy<br/>(https://idx.maxlong.my.id)"]
        SUPA[("Supabase Local Cache<br/>(PostgreSQL Historical Snapshots)")]
    end

    subgraph BFF Orchestrator [Next.js 16 BFF API Engine]
        DASH_API["/api/dashboard<br/>(Regime, Breadth, Heatmap)"]
        SCREEN_API["/api/signals<br/>(3-Rule Engine, Smart Money, Win Rate)"]
        FLOW_API["/api/broker-flow<br/>(2D / 5D / 10D Multi-Horizon)"]
        TICKER_API["/api/ticker/[ticker]/intelligence<br/>(8-Tab Unified Stock Model)"]
        CAL_API["/api/calendar<br/>(Temporal.PlainDate Normalized)"]
        QUAD_API["/api/quadrant & /api/sector"]
    end

    subgraph Presentation Layer [React 19 Obsidian Dark Client]
        VIEW_DASH["Dashboard & 3-Rule Screener"]
        VIEW_FLOW["Multi-Horizon Broker Flow Table"]
        VIEW_TICKER["8-Tab Ticker Intelligence Console"]
        VIEW_CAL["Corporate Actions Calendar"]
    end

    MCP --> BFF Orchestrator
    IDX --> BFF Orchestrator
    SUPA <--> BFF Orchestrator

    DASH_API --> VIEW_DASH
    SCREEN_API --> VIEW_DASH
    FLOW_API --> VIEW_FLOW
    TICKER_API --> VIEW_TICKER
    CAL_API --> VIEW_CAL
    QUAD_API --> VIEW_DASH
```

For in-depth architectural specifications, contracts, and data provenance definitions, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 🎯 Core Features

### 1. Market Overview & Command Center (`/`)
* **Real-time IHSG Snapshot**: Live index level, daily delta (Rp & %), volume, value, and composite market regime (`BULL`, `NEUTRAL`, `BEAR`).
* **Market Breadth Meters**: Visual gainer, loser, and unchanged breakdown with active participation ratios.
* **Lightweight Canvas Chart**: Interactive IHSG candlestick chart with overlay indicators:
  * **EMA 21 / 50 / 200**: Trend regime verification.
  * **Supertrend (10, 3)**: Algorithmic volatility trailing support/resistance.
  * **Floor Pivot Points**: Classic Floor Pivots ($P, S_1, S_2, R_1, R_2$).
* **Market Drivers (Penopang & Pemberat)**: Top positive and negative index movers weighted by market cap impact. One click navigates directly to the stock's Ticker Intelligence Console.
* **Sector Heatmap**: Dynamic sector tiles displaying daily performance and weight. Clicking any sector opens a dedicated modal and route (`/sector/[sector]`) showing the sector chart, top gainers/losers, and full constituent table.
* **Market Quadrant Map**: 4-quadrant scatter matrix mapping Volume vs Price change. Clicking any quadrant opens an interactive modal listing **all** stocks in that quadrant with volume multipliers and price changes.

---

### 2. Daily 3-Rule Screening Engine (`/`)
Automated daily screening across active Indonesian stocks, running on three quantitative setups:

| Strategy | Rule Code | Setup Logic & Trigger Conditions |
| :--- | :--- | :--- |
| **Fractal Breakout** | `FRACTAL_BREAKOUT` | Williams 5-bar fractal high breakout confirmed with above-average volume ($V > 1.2 \times \text{SMA}_{20}$). |
| **MACD & MA 200** | `MACD_EMA200` | Golden cross on MACD line over Signal line while price trades strictly above $\text{EMA}_{200}$ (Bullish trend filter). |
| **G Accumulation** | `G_ACC` | Institutional accumulation detected at lower boundary / base structure ($V > 1.5 \times \text{SMA}_{20}$, price range near support). |

#### 🛡️ Smart Money Scoring (3 Factors)
Every screened candidate is scored against a 3-factor institutional confirmation matrix:
1. **Broker Accumulation**: Top-1 to Top-5 broker buy concentration confidence $\ge 60\%$.
2. **Foreign Flow**: Net foreign institutional flow $> 0$ (positive net foreign inflow).
3. **Bandarmology Alignment**: Trend of broker accumulation aligned with price momentum.

$$\text{Confirmation Tier} = \begin{cases} 
3/3 & \textbf{STRONG CONFIRMATION} \\ 
2/3 & \textbf{CONFIRMED} \\ 
1/3 & \textbf{PARTIAL} \\ 
0/3 & \textbf{NOT CONFIRMED} 
\end{cases}$$

#### 🧭 Stock Regime Detection
* **MARKUP**: Price $> \text{EMA}_{21} \ \& \ \text{EMA}_{50}$, upward trend slope, accumulation confirmed $\rightarrow$ **High-priority BUY / SWING**.
* **MARKDOWN**: Price $< \text{EMA}_{21} \ \& \ \text{EMA}_{50}$, downward trend, distribution dominant $\rightarrow$ **AVOID / SELL**.
* **CONSOLIDATING**: Price ranging between EMAs with contracting ATR $\rightarrow$ **WATCH FOR BREAKOUT**.

#### 📊 Historical Win Rate Engine
* Tracks **TP1 Before SL**, **TP2 Before SL**, and **Naik Tanpa SL (5D, 10D, Sampai Terbaru)**.
* Excludes deprecated / experimental strategies cleanly from monitoring (`Beta Breakout`, `Early Sweep`, `Smart Gamma`, `Smart Sniper`, `V-Shape` are eliminated).

---

### 3. Multi-Horizon Broker Flow & Bandarmology (`/broker-flow`)
* **Simultaneous Multi-Horizon Matrix**: View and compare broker accumulation/distribution across **2D**, **5D**, and **10D** windows simultaneously with instantaneous focus switching (0ms latency).
* **Net Value & Volume Dominance**: Real-time identification of lead buyer and seller brokers (CC, AK, YU, ZP, BK, etc.).
* **Foreign Accumulation MA**: Net foreign flow trends mapped against moving average thresholds.
* **Volume Anomaly Alerts**: Flags sudden spikes where institutional volume exceeds normal baseline by $> 2.0\times$.

---

### 4. Corporate Actions Calendar (`/calendar`)
* Built with modern **`Temporal.PlainDate`** handling (via `temporal-polyfill`), eliminating UTC/WIB date shift bugs.
* Supports **8 Corporate Action Categories**:
  1. `DIVIDEND`: Cash & stock dividends with Cum Date, Ex Date, Recording Date, Payment Date, and Amount per share.
  2. `STOCK SPLIT`: Share split ratios and effective execution dates.
  3. `REVERSE SPLIT`: Consolidation ratios and market effective dates.
  4. `RIGHT ISSUE`: Rights offering ratios, exercise price, and trading periods.
  5. `TENDER`: Mandatory and voluntary tender offers.
  6. `RUPS`: General shareholder meetings (AGMS/EGMS), agenda dates, and venue information.
  7. `PUBEX`: Public expose schedules, livestream links, and company presentation dates.
  8. `IPO`: Upcoming initial public offerings, bookbuilding ranges, and listing dates.
* Quick filters, category tabs, count metric cards, and keyword search by ticker or company name.

---

### 5. 8-Tab Ticker Intelligence Console (`/ticker/[ticker]`)
A deep-dive research console providing comprehensive stock intelligence across 8 specialized tabs (strictly zero legacy MaxV7 dependency):

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [REKOMENDASI]  [BANDAR]  [BROKER]  [ANALISIS TEKNIKAL]  [PRO INTEL]  [OWNERSHIP]  [AKSI KORPORASI]  [NEWS] │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Rekomendasi**: Synthesized tactical action card (`BUY`, `SPECULATIVE BUY`, `WAIT AND SEE / HINDARI DULU`, `TAKE PROFIT / EXIT`) with entry zone, stop loss (SL), target price (TP1 & TP2), risk-reward ratio (RRR), and confidence tags.
2. **Bandar**: Institutional money flow breakdown across 1D, 5D, 20D, and 30D. Top buyer/seller volume deltas and institutional absorption metrics.
3. **Broker**: Detailed broker summary (Broksum) ranking buyers and sellers by lot and value, displaying broker average prices ($AvgPrice$) and accumulation ratios.
4. **Analisis Teknikal**:
   * EMA Trend Confluence: $\text{EMA}_{21}, \text{EMA}_{50}, \text{EMA}_{100}, \text{EMA}_{200}$.
   * Momentum: RSI(14) with divergence warning, MACD (12, 26, 9) histogram.
   * Volatility: ATR(14), Supertrend, Bollinger Bands width.
   * Advanced: **ADX(14)** trend strength (+DI/-DI) and **Fibonacci Retracement (90D)** levels ($23.6\%, 38.2\%, 50.0\%, 61.8\%, 78.6\%$).
   * Pivots: Floor Pivots ($P, S_1, S_2, R_1, R_2$).
   * Quick Interactive Candlestick Chart toggle.
5. **Pro Intel**: Smart money absorption signals, liquidity sweeps, block trade anomalies, and multi-day accumulation patterns.
6. **Ownership**: Shareholder structure (Controlling / Foreign / Domestic Retail / Institutional breakdown) and periodic changes in controlling stakes.
7. **Aksi Korporasi**: Corporate actions timeline for the specific stock (Dividends history, RUPS, stock splits, rights issues).
8. **News**: Real-time curated news feed with sentiment tagging and market relevance rating.

---

## 💻 Tech Stack & Engineering Standards

| Area | Technologies / Libraries |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React Server Components) |
| **UI Library** | [React 19](https://react.dev/), [Lucide React](https://lucide.dev/) |
| **Language** | [TypeScript 5.6](https://www.typescriptlang.org/) (Strict mode, explicit interfaces) |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) + Custom Obsidian Dark theme (`dashboard.css`) |
| **Charting** | HTML5 Canvas + [Lightweight Charts](https://tradingview.github.io/lightweight-charts/) |
| **Data Engine** | [Supabase](https://supabase.com/) (Local Cache), Max Trade MCP Server, IDX Upstream Adapter |
| **Date Standard** | [TC39 Temporal Proposal](https://github.com/tc39/proposal-temporal) via `temporal-polyfill` |
| **Testing** | Node.js Test Runner (`node --test`), 49 unit tests covering indicators, math & data parsing |
| **Code Quality** | ESLint 9, Prettier, TypeScript `--noEmit` type checking |

---

## 🚀 Quickstart & Local Development

### Prerequisites
* **Node.js**: `v20.x` or `v22.x` recommended.
* **Package Manager**: `npm` (v10+).
* **Environment**: Local XAMPP/Windows or Linux/macOS.

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Daddy-JJ/FrontEndSahamTeknikal.git
cd FrontEndSahamTeknikal
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the project root:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Max Trade MCP Server & IDX Upstream
MAX_TRADE_API_URL=http://127.0.0.1:8000
IDX_UPSTREAM_URL=https://idx.maxlong.my.id
IDX_UPSTREAM_AUTH_BEARER=your_bearer_token_if_required
```

### 3. Run Development Server
```bash
npm run dev
# Server will start on http://127.0.0.1:3000
```

### 4. Running Unit Tests
Execute the automated test suite (49 unit tests):
```bash
npm run test:unit
```

### 5. Production Build
```bash
npm run build
npm run start
```

---

## 📂 Project Directory Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── calendar/route.ts              # Corporate actions calendar BFF route
│   │   │   ├── dashboard/route.ts             # IHSG overview, breadth & sector heatmap BFF
│   │   │   ├── quadrant/route.ts              # 4-Quadrant full stock list BFF
│   │   │   ├── sector/[sector]/route.ts       # Sector constituents & metrics BFF
│   │   │   ├── signals/route.ts               # 3-Rule screener & win rate BFF
│   │   │   └── ticker/[ticker]/intelligence/  # 8-Tab unified stock intelligence BFF
│   │   ├── calendar/page.tsx                  # Calendar route page
│   │   ├── sector/[sector]/page.tsx           # Sector drill-down route page
│   │   ├── ticker/[ticker]/page.tsx           # Stock intelligence route page
│   │   ├── dashboard.css                      # Obsidian dark theme & container queries
│   │   ├── layout.tsx                         # Root app layout
│   │   └── page.tsx                           # Command Center Dashboard & Screener
│   ├── components/
│   │   ├── ticker-tabs/                       # 8 Tab components for Ticker Detail
│   │   │   ├── tab-rekomendasi.tsx            # Rekomendasi tactical plan
│   │   │   ├── tab-bandar.tsx                 # Bandarmology flow & absorption
│   │   │   ├── tab-broker.tsx                 # Broker summary (Broksum)
│   │   │   ├── tab-teknikal.tsx               # Technical indicators, ADX, Fibo
│   │   │   ├── tab-pro-intel.tsx              # Institutional intelligence
│   │   │   ├── tab-ownership.tsx              # Shareholders breakdown
│   │   │   ├── tab-corp-actions-news.tsx      # Corporate actions & News
│   │   │   └── types.ts                       # Shared tab data contracts
│   │   ├── calendar-client.tsx                # Corporate calendar interactive client
│   │   ├── dashboard-client.tsx               # Dashboard main orchestrator
│   │   ├── ihsg-overview-chart.tsx            # IHSG Lightweight Candlestick Chart
│   │   ├── market-contributors.tsx            # Penopang & Pemberat movers
│   │   ├── market-quadrant-map.tsx            # Market quadrant matrix widget
│   │   ├── quadrant-all-modal.tsx             # Modal displaying all quadrant stocks
│   │   ├── sector-heatmap.tsx                 # Sector heatmap interactive grid
│   │   ├── signal-screener-panel.tsx          # 3-Rule screener & win rate tabs
│   │   └── ticker-chart-canvas.tsx            # Quick Canvas Candlestick Chart
│   └── lib/
│       ├── calendar-service.ts                # Calendar data fetcher & normalizer
│       ├── calendar-types.ts                  # Pure client-safe calendar types
│       ├── format-id.ts                       # Indonesian currency & number formatting
│       ├── idx-upstream.ts                    # IDX Upstream BFF fetcher & error handling
│       ├── screener-server.ts                 # 3-Rule screening engine server
│       ├── screener-types.ts                  # Screener interfaces & regime types
│       ├── technical-indicators.ts            # ADX, Fibo, EMA, Supertrend, Pivots, RSI
│       ├── temporal-dates.ts                  # Temporal.PlainDate calendar math
│       ├── ticker-intelligence.ts             # 8-Tab aggregator & provenance tracker
│       └── ticker-plan-builder.ts             # Tactical plan & entry/SL/TP builder
├── tests/
│   ├── indicators-adx-fibo.test.mjs           # Unit tests for ADX(14) & Fibonacci
│   ├── screener-v2.test.mjs                   # Screener 3-rule engine tests
│   ├── temporal-dates.test.mjs                # Temporal.PlainDate formatting tests
│   └── ticker-intelligence.test.mjs           # Unified intelligence contract tests
├── ARCHITECTURE.md                            # Detailed system architecture document
└── README.md                                  # Project overview (this document)
```

---

## 📡 API Reference

| Endpoint | Method | Description | Cache / SLA |
| :--- | :--- | :--- | :--- |
| `/api/dashboard` | `GET` | IHSG summary, market regime, breadth, sector heatmap | 10s SWR |
| `/api/signals?year=2026` | `GET` | 3-Rule screened signals & historical win rate | 60s cache |
| `/api/quadrant?q=Q1` | `GET` | Full list of stocks in specified market quadrant | 30s cache |
| `/api/sector/[sector]` | `GET` | Sector summary, chart history, top movers & stocks | 30s cache |
| `/api/calendar?event=ALL` | `GET` | Corporate actions calendar across 8 categories | 300s cache |
| `/api/ticker/[ticker]/intelligence` | `GET` | Unified 8-tab intelligence model for specific ticker | 15s SWR |

---

## 🔒 Design System & UX Standards

The interface is built adhering to the **`/userinterface-wiki`** and **`/modern-web-guidance`** design standards:
* **Palette**: Deep Obsidian Dark (`#0a0d14` canvas, `#111622` card surface, `#1a2030` border).
* **Financial Semantics**: Indonesian market convention (Green `#10b981` = Profit/Markup/Accumulation; Red `#ef4444` = Loss/Markdown/Distribution; Purple/Violet `#8b5cf6` = Institutional Flow).
* **Responsive Fluidity**: Standard CSS Grid with CSS Container Queries (`@container (max-width: 720px)`) allowing data tables to seamlessly morph into card stacks on compact screens.
* **Zero Shift**: Fixed height layout skeletons and loading fallbacks prevent Cumulative Layout Shift (CLS < 0.05).
* **Data Provenance Badges**: Every data point in the Ticker Intelligence Console carries an explicit provenance tag:
  * `[OBSERVED]`: Direct factual exchange data (EOD price, Raw Broksum).
  * `[DERIVED]`: Calculated quantitative metrics (EMA, RSI, ADX, Supertrend).
  * `[PROXY]`: Approximation heuristics when direct feeds are unavailable.

---

## 📄 License & Attribution

Internal Quantitative Trading Platform — Proprietary to DaddyJJ / SahamTeknikal. All rights reserved.
Upstream market data provided via Max Trade MCP & IDX Data Pipeline.
