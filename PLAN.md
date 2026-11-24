# Active plan - Smart Money Flow, Broker Flow, Jurnal, Analytics, Scanner guide and chart overlay

Updated 24 November 2026.
**Smart Money Flow & Broker Flow (`/broker-flow`) RELEASED and verified, 24 November 2026.**
Earlier A/B/C/D features released and public-smoke-verified, 22 October 2026.

## Smart Money Flow & Broker Flow — 24 November 2026

| Scope | Action | Proof / state |
| --- | --- | --- |
| Multi-Horizon Flow | Query genuine Max MCP horizon calculations for 2D, 5D, and 10D flows; eliminate duplicate metrics | RELEASED. Verified across AMMN and all active tickers; distinct volume, net value, broker modal, and PnL |
| Wyckoff Market Quadrants | Visual quadrant segmentation for `[MA]`, `[MD]`, `[DA]`, and `[DD]`; modal deep-dive navigation | RELEASED. Fixed navigation race condition, added robust `buildQuadrantFallbackDetail` fallback |
| Chart Integration | Add direct interactive technical chart shortcut (`📈 Buka Chart Teknikal →`) linking to `/chart/[ticker]` | RELEASED. Seamless client-side navigation |
| Dual-Tier API | `/api/broker-flow` loads Supabase `broker_flow_ticker_horizons` with automatic fallback to static snapshot | RELEASED. 13/13 passing contract tests (`tests/broker-flow.test.mjs`), build PASS |

Read the earlier [focused combined plan](docs/UI_JOURNAL_ANALYTICS_STRATEGY_GUIDE_PLAN_20261022.md)
for exact layout, strategy copy, [chart overlay D](docs/UI_JOURNAL_ANALYTICS_STRATEGY_GUIDE_PLAN_20261022.md#d-overlay-chart-dari-daftar-jurnal-dan-analytics), responsive behavior and acceptance.

| Scope | Action | Proof / state |
| --- | --- | --- |
| A | Compact header/tabs/filters; fullwidth readable ledger; curve+strategy beside each other on desktop; local table scrolling on mobile | RELEASED. Local RED->GREEN navigation and P&L colors; affected browser cases all have PASS across recorded runs; unit 111/111, full lint, typecheck and production build PASS. See status for exact receipts/limits |
| B | Put processing diagnostics after results/table/footnote on paper journal | RELEASED. Local RED->GREEN, desktop/mobile 6/6, unit 111/111, typecheck/lint/build PASS; review no HIGH/CRITICAL |
| C | Four baseline V1 strategy cards below published Scanner signals, including entry, initial SL and both exit methods | RELEASED. Local RED->GREEN; dedicated final desktop/mobile6/6 PASS; full Scanner/chart68 PASS/6 viewport skips; unit111/111, lint/typecheck/build PASS; source/React/a11y review no HIGH/CRITICAL. No new data request/calculation |
| D | Existing row Chart/Saat sinyal links open one responsive modal using ChartPanel; preserve context, focus/scroll, canonical fullpage fallback | RELEASED. Local overlay/fullpage24/24 PASS; affected reporting/layout/CSV35 PASS with subsequent scoped fallback/keyboard/read-count rechecks. Unit111/111, lint/typecheck/build PASS; no HIGH/CRITICAL. Original failures and existing initial-JS-off streaming limitation retained in status. No server reads moved client |
| Verification | Reuse completed local QA and verify exact-SHA Production publication | COMPLETE: independent receipt/source/security audit and public HTTP smoke PASS. Hosted owner interactions remain NOT VERIFIED; no completed local suite rerun |

Frontend only: preserve backend/RPC, auth/RLS, routes/query, ledger/CSV, financial values,
trading rules, historical snapshots and unrelated Markdown cleanup. Publication of this UI
package is authorized; backend/database/auth configuration and data mutations remain out of scope.

Release Action completed: reused QA receipts, scoped frontend commit/push and exact-SHA
Production verification. Feature source c2a0eaa; Vercel dpl_73eqrwqq7votyMLiWeiRCYoFDQQN
READY, Production alias assigned. Public HTTP10 routes/17 assets/3 guards PASS; new reporting
stylesheet served, privileged asset-pattern scan PASS. No completed local suite was repeated.
Release Proof: independent current-source/security audit PASS, no HIGH/CRITICAL. This delivery
receipt is a documentation-only follow-up; application files are identical to feature source.
Prior Production rollback target is recorded in status. Owner-browser NOT VERIFIED (not connected).
Initial app loading with JavaScript disabled is an existing streaming limitation, separate
from the tested native fallback of a rendered chart link. No backend/data operation performed.
Next: no remaining A-D implementation. Await a new owner task; do not rerun release/reset/backfill.
Do not reimplement B. [Status](IMPLEMENTATION_STATUS.md) owns dated local/live evidence;
its password section retains native Auth/recovery/owner-acceptance limits.

[Previous completed plans](docs/archive/PLAN_BEFORE_JOURNAL_ANALYTICS_STRATEGY_GUIDE_20261022.md)
are archived with their existing limitations and links, not a task queue.
