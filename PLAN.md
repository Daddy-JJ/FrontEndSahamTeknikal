# Frontend UI Re-Layout & Analytics Implementation Plan — 2026-10-04

Scope: `frontend/` repository.
Goal:
1. Re-layout `/journal` into a dense, full-width financial ledger table with drawer draft creation and status filters.
2. Implement dedicated `/analytics` page connecting to Supabase `actual_journal_analytics` RPC with pure SVG charts and strategy breakdown.
3. Integrate Paper Journal / Actual Journal separation.
4. Apply dense table and strategy matrix re-layout to `/scanner` (signals and quality).
5. Verify zero regression across builds, contracts, and RLS.

## Phase 1: Re-layout & Dense Table for Journal (`/journal`) (COMPLETED & VERIFIED)
- Step 1.1:
  Action: Transform the trade history list in `frontend/src/app/journal/page.tsx` into a full-width dense financial ledger table with columns (Ticker, Strategy, Status, Lot/Qty, Initial Stop, Current Stop, Total Fee, Realized P&L IDR, Realized R, Action Link).
  Proof: Verified table layout renders all fields correctly and handles both desktop and mobile viewports with horizontal scroll.
- Step 1.2:
  Action: Move the "Buat draft transaksi baru" form from the static 50% split layout into a sleek modal/collapsible drawer (`<details className="journal-drawer">`) triggered by a `+ Buat Draft Transaksi Baru` summary button.
  Proof: Full 100% container width available for the ledger table; form submission works cleanly with existing `submitActualJournal` server actions.
- Step 1.3:
  Action: Add tab switcher between "Jurnal Aktual (Riil)" and "Paper Journal (Simulasi Sinyal)".
  Proof: SOT Invariant #7 strictly preserved with separate views; Paper view explains unit-R normalization and forward signal simulation.

## Phase 2: Implementation of Dedicated Analytics (`/analytics`) (COMPLETED & VERIFIED)
- Step 2.1:
  Action: Create `frontend/src/app/analytics/page.tsx` resolving the previous 404 route.
  Proof: Visiting `/analytics` is now a compiled Next.js route returning HTTP 200 with JournalShell header and authenticated owner context.
- Step 2.2:
  Action: Connect to backend Supabase RPC `public.actual_journal_analytics` with cohort date filters (`p_from`, `p_to`), strategy (`p_strategy`), and exit policy snapshot.
  Proof: Owner analytics data (win rate, expectancy R, profit factor, payoff ratio, net P&L IDR, closed count, open count, fee quality) load deterministically.
- Step 2.3:
  Action: Build 4 KPI scorecards, Pure SVG Cumulative Closed R curve, monetary summary, and Strategy Attribution Table for 4 strategies.
  Proof: Zero external library bloat; clean pure SVG rendering compliant with strict CSP and responsive layout.

## Phase 3: Scanner UI Dense Table Re-layout (COMPLETED & VERIFIED)
- Step 3.1:
  Action: Update `frontend/src/components/scanner-dashboard.tsx` with dense horizontal table for "Sinyal diterbitkan" and 4-column strategy matrix for "Quality dan evaluasi ticker".
  Proof: 100 constituents displayed compactly with matrix columns (MACD+EMA200, Fractal BO, RS Breakout, Pullback Reclaim); informative empty state when 0 signals are active.

## Phase 4: Full Verification & Harmonization (COMPLETED & VERIFIED)
- Step 4.1:
  Action: Run `npm run typecheck`, `npm run lint`, `npm run build`, and Playwright test suites.
  Proof:
  - `tsc --noEmit`: 100% passed (exit code 0).
  - `eslint .`: 100% passed (exit code 0).
  - `next build`: compiled and generated all 7 routes in 26.7s with zero errors.
  - Playwright browser test suite: 18 passed across desktop, mobile, tablet in 54.1s.
