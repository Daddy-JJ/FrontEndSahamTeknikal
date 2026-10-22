# Active plan - Jurnal, Analytics, Scanner guide and chart overlay

Updated 22 October 2026. Owner requested a combined plan before further implementation.
**A/B/C/D verified locally; owner authorized commit/push/Production deployment on 22 October.** This assignment supersedes completed
password-login and documentation plans; it does not reopen reset/backfill or auth work.

Read the [focused combined plan](docs/UI_JOURNAL_ANALYTICS_STRATEGY_GUIDE_PLAN_20261022.md)
for exact layout, strategy copy, [chart overlay D](docs/UI_JOURNAL_ANALYTICS_STRATEGY_GUIDE_PLAN_20261022.md#d-overlay-chart-dari-daftar-jurnal-dan-analytics), responsive behavior and acceptance.

| Scope | Action | Proof / state |
| --- | --- | --- |
| A | Compact header/tabs/filters; fullwidth readable ledger; curve+strategy beside each other on desktop; local table scrolling on mobile | COMPLETE LOCALLY, not committed/deployed. RED->GREEN navigation and P&L colors; affected browser cases all have PASS across recorded runs; unit 111/111, full lint, typecheck and production build PASS. See status for exact receipts/limits |
| B | Put processing diagnostics after results/table/footnote on paper journal | COMPLETE LOCALLY, not committed/deployed. RED->GREEN, desktop/mobile 6/6, unit 111/111, typecheck/lint/build PASS; review no HIGH/CRITICAL |
| C | Four baseline V1 strategy cards below published Scanner signals, including entry, initial SL and both exit methods | COMPLETE LOCALLY, not committed/deployed. RED->GREEN; dedicated final desktop/mobile6/6 PASS; full Scanner/chart68 PASS/6 viewport skips; unit111/111, lint/typecheck/build PASS; source/React/a11y review no HIGH/CRITICAL. No new data request/calculation |
| D | Existing row Chart/Saat sinyal links open one responsive modal using ChartPanel; preserve context, focus/scroll, canonical fullpage fallback | COMPLETE LOCALLY. Overlay/fullpage24/24 PASS; affected reporting/layout/CSV35 PASS with subsequent scoped fallback/keyboard/read-count rechecks. Unit111/111, lint/typecheck/build PASS; no HIGH/CRITICAL. Original failures and existing initial-JS-off streaming limitation retained in status. No server reads moved client |
| Verification | Review and targeted journal/reporting/scanner/chart-return/overlay regression plus build checks | Run when A/C/D implementation changes the affected surfaces; prior B proof is dated local evidence |

Frontend only: preserve backend/RPC, auth/RLS, routes/query, ledger/CSV, financial values,
trading rules, historical snapshots and unrelated Markdown cleanup. Publication of this UI
package is authorized; backend/database/auth configuration and data mutations remain out of scope.

Release Action: reuse completed QA receipts; scoped frontend commit/push; verify the exact SHA
in Vercel Production, alias/public routes/assets and auth boundaries. Restore the recorded
previous deployment if live smoke fails. Owner-browser proof remains separate when unavailable.
Release Proof: independent current-source receipt/security audit PASS, no HIGH/CRITICAL;
remote main matches local baseline dcd847e. Prior Production rollback target recorded privately.
Initial app loading with JavaScript disabled is an existing streaming limitation, separate
from the tested native fallback of a rendered chart link. No completed local suite is repeated.
Do not reimplement B. [Status](IMPLEMENTATION_STATUS.md) owns dated local/live evidence;
its password section retains native Auth/recovery/owner-acceptance limits.

[Previous completed plans](docs/archive/PLAN_BEFORE_JOURNAL_ANALYTICS_STRATEGY_GUIDE_20261022.md)
are archived with their existing limitations and links, not a task queue.
