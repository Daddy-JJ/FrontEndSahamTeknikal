# Active: compact terminal Scanner layout - 2026-10-08

Status: implementation and production-readiness verification authorized; commit/push only after relevant checks pass. Existing reporting fixes remain a separate compatible part of this release. Scope `/` live and `/scanner`, which share `ScannerDashboard`; journal/analytics/auth flows retain their default shell.

## Final local verification - 2026-10-09 WIB

Action: complete regression and production-build gates after the modal focus correction and strict coverage parser checks.
Proof: unit30 PASS; browser journal40 + scanner44 + reporting18 =102 PASS; typecheck, lint and ordinary production build PASS. Desktop geometry and mobile/zoom-equivalent checks pass; Escape and Close restore an initially unfocused ticker opener. Currency tokens fit their cells at1440/1280/1200/1101/1100/901/390/320px. Reporting screenshots preserve caret state and assert no hydration errors. Read-only review has no remaining confirmed blocker.

Action: release only the tested frontend with compatible SQL010 metadata, preserving canonical domain calculations and current authentication/data queries.
Proof: final diff and secret-pattern scan clean; no dependency/provider/auth changes. Local PNG previews are explicitly synthetic; authenticated hosted owner interaction is not inferred from these tests. Exact remote release/deployment evidence is maintained in the shared IMPLEMENTATION_STATUS.md and CODEX_HANDOFF.md outside the source repos.

## Target layout

A Bloomberg-inspired dark terminal workspace: compact sans-serif text, tabular numeric columns, thin borders, restrained amber/cyan accents, readable positive/negative/warning states with text. Desktop: compact navigation > run status strip > inline filters/tabs > primary table and selected ticker detail. Run diagnostics expand on demand. No invented real-time prices, charts or global counts.

- Action: add a scanner-only terminal shell; reduce hero/card whitespace, replace vertical run facts with a compact summary, and keep critical partial/failed/RS/window/freshness states visible. Expand full timestamps, provenance and explanatory metadata in run details.
  Proof: 1366x768 geometry puts first data row within 280px and shows at least ten compact quality rows; normal/empty/failed/historical/loading/error states remain distinguishable. No change to default journal/analytics/auth styling.
- Action: make the bounded 25-row table the primary workspace. Show concise strategy/status cells and move verbose per-ticker reasons and complete signal audit into an accessible selected-ticker panel (desktop) or drawer (mobile). Preserve backend values, current auto tab choice, run/date/strategy/page semantics, nulls and immutable source data.
  Proof: keyboard/focus/Escape, selection, filter/back/refresh/pagination and existing scanner regressions. No extra data RPC or unbounded fetch; no canonical financial/indicator arithmetic in browser.
- Action: implement compact desktop toolbar and responsive matrix at 320-390px; horizontal scrolling only inside the matrix, monetary tokens unbroken, 200% zoom and reduced-motion supported.
  Proof: desktop/mobile browser geometry and overflow checks, readable status text, focus restoration, and journal/reporting regression suites.
- Action: review complete frontend/backend diff and compatible SQL010 capability; commit/push the two independent repos only after meaningful local verification. Preserve active model configuration, historical signals and actual ledger.
  Proof: units, typecheck, lint, build, SQL/Python suites, read-only review and exact commit/remote/deployment evidence; hosted proof kept separate from local doubles.

Prior plans/evidence follow.

# Persistent paper journal and reporting — 2026-10-08

## Reporting coverage and money layout follow-up — 2026-10-08

Action: read optional scanner_coverage from the existing reporting RPCs; validate status/date/counts and distinguish scanner completeness from journal/observation completeness. Preserve SQL009 compatibility without asserting missing scanner metadata is complete.
Proof: boundary and local browser regressions cover 95/100 partial, failed/missing/invalid counts, and no additional scanner RPC.

Action: keep complete currency tokens on one line in reporting/journal rows while retaining responsive cards; widen cards breakpoint when the desktop columns cannot fit.
Proof: inspect decimal token line rectangles and cell bounds plus page/list overflow at desktop and small mobile widths. Unit, types, lint, build and targeted browser checks recorded below.



## Production rollout authorization - 2026-10-08

Progress (2026-10-08 18:08 WIB): SQL administrator access is verified via TLS. Legacy scheduled writer is temporarily paused. Fresh encrypted database/roles backup was fully restored into a no-network local target; catalog, actual ledger and owner/Auth linkage match. SQL009 rehearsal passed. A second local encrypted copy is verified; DPAPI recovery requires this Windows profile/machine, and off-site recovery is NOT VERIFIED. SQL008 catalog matches all ten categories exactly, so history008 was reconciled via pinned CLI; dry-run listed only009 and production migration history now contains001-009. Hosted rollback-only smoke passes init/config immutability, CAS/retry/reload, owner/outsider/anon SQL RLS claims, no direct service DML, real frontend parsers and unchanged actual-ledger hashes. No persistent QA trade/account was created. GitHub owner variable is verified. Next: release source to main/Vercel, initialize immutable model and verify fresh released-SHA jobs. Authenticated browser acceptance remains NOT VERIFIED.

Action: user authorized backend migration/production activation, frontend release/full deployment and verification. Inspect remote history and compatible backups first; apply only pending forward migrations, verify RPC/RLS, release frontend before enabling the new scheduled runtime. Existing source candidate is backend e4ed019 / frontend d94f243. Production mutations remain limited to this project and approved model; preserve real actual trades and legacy history.
Proof: record remote migration history/catalog, integrity fingerprints, source SHA/deployment IDs, activation configuration/time, owner/anonymous access and real scheduler receipts. Report unexecuted checks explicitly. No artificial production trade or test account is needed for smoke.

Source publication authorization (2026-10-08): commit and push to `feat/persistent-paper-reporting-v1`. Production main rollout, remote migrations, activation and deployment remain separate gates. A branch push can start existing CI/preview automation; it does not establish hosted acceptance.

Status: IMPLEMENTED AND TESTED LOCALLY; hosted release NOT VERIFIED. Production rollout is authorized; verified migration/preflight progress is recorded above.

1. Action: add strict reporting readers validating mode, model, cohort, exit experiment and pagination. Proof: boundary tests reject malformed/mismatched responses without fixtures or financial recomputation.
2. Action: integrate Paper / Actual / Signal Evaluation dashboard and persistent paper list/detail, preserving manual actual ledger and CSV. Proof: typed build and local browser checks cover filters, null metrics, failure, audit and mobile.
3. Action: verify suites and final diff; document migration dependency. Proof: unit 28 PASS; lint/typecheck/production build PASS; browser desktop/mobile journal 40, scanner 36, reporting 12 PASS. SQL/PGlite 93 PASS includes direct frontend parser compatibility. Hosted remains NOT VERIFIED.

Model: signal-close fills next session; maximum Rp1m planned loss at SL including 15/25 bps fees, floor lots; independent Fixed2R/SMA10. Confirmed close below SMA10 only. 5/10 observations never close trades.

## Navigation latency follow-up - 2026-10-08

Action: investigate the user's slow Vercel page navigation with public read-only probes and source dependency inspection. Then remove one serial dependency by reading membership and deployment mode concurrently after authenticated user verification; keep owner/RLS checks and fail-closed outcomes.
Proof: public scanner/analytics 367-445 ms without login, header sin1::iad1; authenticated timings/DB region remain unverified. A delayed local HTTP regression proves overlap on desktop/mobile; the full journal suite (40 PASS) retains owner/outsider/unavailable/mode/export/mutation guards. No remote configuration or deployment changes.


Final review: signal observations expose canonical source IDs and target prices; source details also pass mobile overflow checks. Initial scanner assertions targeted obsolete headings; updated checks verify reporting capability failure and the bounded database snapshot. Final scanner suite 36 PASS. Current candidate requires backend SQL009/RPC capability before frontend rollout; neither experiment is summed with the other, and 5/10 checkpoints never close trades.

---

# Frontend remediation and live acceptance plan — 2026-10-04

Status: PAKET 1 (BACKEND) & PAKET 2 (FRONTEND) COMPLETE & VERIFIED. Paket 3 (Candidate Release & Deployment Acceptance) in progress.
Scope: frontend repository; sibling backend read-only. Preserve the historical
plan below. Its completion claims do not close the regressions identified by the
2026-10-04 read-only audit.

## Target and baseline

Audit remainder update: docs/AUDIT_REMAINING_20261004.md is the current open-item
register. Action: reconcile FE-01–FE-11 against local fixes and reported backend
gates without repeating unchanged tests. Proof: source/report references, explicit
owner/closure criteria R-01–R-08 and documentation diff check; no new hosted claims.

Target: a usable owner-only web app with accurate canonical scanner/journal/
analytics presentation, complete agreed MVP integrations, bounded data reads,
meaningful regression checks and verified deployment behavior.

Audit baseline: frontend HEAD 52d11d0, clean working tree before plan edits.
Confirmed findings FE-01 through FE-11 are in the audit response. Eight local
render probes reproduced affected behavior using dependency doubles; unit12/12,
lint and nonincremental typecheck passed. These are local audit evidence, not
fresh hosted or Vercel acceptance. Build/browser suites were not run in that audit.

Release decisions:
- A corrective release of existing live flows is separate from complete MVP.
- Closing fixture/error/filter bugs does not make missing live paper, chart,
  actions or configuration integrations complete.
- No production fixture fallback, frontend financial engine, privileged frontend
  key, QA production trade, rule change or migration001-007 reopening.
- Existing outsider/concurrency waivers remain SKIPPED / NOT VERIFIED. A release
  decision must disclose them; full verification cannot be inferred from waivers.
- Do not add major dependencies or change public contracts without approval.

## Verification investigation — 2026-10-04

Action: After two scanner suite runs stopped on different failures, inspect
Playwright DOM/trace and proxy before another run. First failure was the HTTP
stub treating existing session_date.lte as exact date; fixed getAll eq handling.
Second failure had an accessible combobox in the captured DOM but getByLabel
exact included nested option text; use semantic combobox role/name. Invalid
filter correctly halted scanner reads, while the existing proxy still refreshed
Auth; assert no REST data reads rather than prohibiting required Auth refresh.
Further date-filter trace: URL was read before client pagination navigation
committed (run=null on the filter URL). Wait for the filter URL/link href and
page2 URL before asserting run/filter keys; retained all bounded-read assertions.
Proof: Captured error-context and source paths identify separate test-harness/
locator issues, no suppressed contract check or fabricated empty UI. Rerun only
from this new evidence, then finish the full dedicated suite.

Production-harness decision: full dev scanner run still hit streamed-navigation
and slow-render timing after the standalone filter case passed. Interrupted the
owned failing run; no assertions/timeouts were weakened. Use test:scanner:release:
build the unchanged app in an isolated test dist with local public config,
DATA_MODE=live and fixture preview denied, then run the same 54 assertions on
Next production server. Only direct children are stopped; generated type paths
are restored conditionally. This is local production-build proof, not hosted.

## Phase 0 — Reproduce and protect the baseline

Owner: FRONTEND. Findings: FE-01 through FE-11. Risk: low.
Files: tests/journal.spec.ts, tests/scanner.spec.ts, relevant unit/route tests.
Action: Recheck Git/HEAD, relevant canonical docs and actual backend signatures.
Run the dedicated journal/scanner suites in their isolated local-double harness,
capture current failures and separate deleted-markup failures from domain failures.
Add meaningful regression cases for live paper exclusion, exact/invalid cohort,
RPC errors, partial realized P&L, empty signal continuation and invalid-stop copy.
Proof: Repeatable failing cases identify actual behavior; tests neither touch
production nor weaken assertions. Harness teardown stops only owned children;
existing ports/processes and local env remain intact.

## Phase 1 — Close financial integrity regressions

Owner: FRONTEND. Findings: FE-01, FE-02, FE-03, FE-04. Risk: medium.
Files: src/app/analytics/page.tsx, src/app/journal/page.tsx,
src/lib/journal-filters.ts, src/lib/journal-server.ts and focused tests.
Action: Gate fixture paper behind explicit permitted development/test mode.
Live paper becomes an honest unavailable state until its backend adapter exists;
the feature is not marked complete. Validate filters before any query. Send exact
p_exit_snapshot, preserve the full cohort through filter navigation/export, and
validate response mode/data_mode/basis before presenting metrics. Give RPC/table
errors an explicit unavailable state. Stop unconditional actual queries on paper
tabs. Remove unsupported official JS strategy/curve aggregates from active live
presentation until Phase4 supplies a canonical backend result.
Proof: All eight audit reproductions relevant to this phase stop exhibiting the
bug. Live paper never contains DEMO data; invalid filters cause no analytics read;
KPI/export use identical filters; failures do not render numeric zero/empty success.
There is no unbounded closed-trade preload or local P&L/R aggregation.

## Phase 2 — Correct ledger and scanner presentation

Owner: FRONTEND. Findings: FE-05, FE-06, FE-07, FE-08. Risk: low.
Files: src/app/journal/page.tsx, src/components/scanner-dashboard.tsx,
src/app/analytics/page.tsx and corresponding tests.
Action: Display backend realized P&L for open partial exits; realized R remains
null until closed and no unrealized mark is invented. Distinguish continuation
empty from no published signals on the selected run. Remove unsupported claims
that no technical criteria matched. Label reference-close distance as indicative
or omit it; do not infer fill risk or eligibility. Preserve missing/invalid stop
reasons. Match PF/payoff labels to net IDR and backend null/status semantics.
Proof: List/detail agreement on partial cash P&L; 26-signal pagination plus empty
continuation has accurate copy; stop-null/invalid cases show no tradable risk;
no-closed/no-loss/no-win/breakeven metrics match backend statuses. Partial, stale,
failed and missing states remain distinct; incomplete RS is never ranked.

## Phase 3 — Add available live signal detail and bounded navigation

Owner: FRONTEND where existing snapshot fields suffice; BOTH for missing queries.
Finding: FE-09. Risk: medium.
Files: scanner contract/server/dashboard, a signal detail route/component,
journal draft integration, relevant tests.
Action: Present canonical rule checklist, reference versus fill, candidate
eligibility reason, pivot_date versus available_session, publication time,
config/data versions and provenance that actually exist. Add bounded date/strategy
navigation with consistent run binding. For signal-linked draft creation, use the
existing optional backend signal_id contract and owner validation; a signal or
watchlist action never creates an actual fill. Unknown metadata stays unknown.
Proof: Detail derives from the selected immutable signal/run; no latest-revision
substitution, backplot availability, inferred provider freshness or future open.
Filtering reads bounded pages and draft records the correct canonical signal.

## Phase 4 — Resolve backend integration dependencies

Owner: BACKEND for implementation in its own chat; FRONTEND for contract review
and adapters. Findings: FE-04, FE-09. Risk: medium/high.
Files: backend contracts/read models/migrations where needed; frontend typed
adapters/pages/tests. Names below describe required capabilities, not existing APIs.

### 4A — Canonical analytics curve and strategy attribution
Action: Agree an additive owner-protected read contract sharing from/to/strategy/
exit_version/exact exit snapshot and closed exit-session cohort. Backend returns
canonical counts/decimal aggregates and ordered curve points with explicit basis,
completeness and bounded paging where necessary. Frontend formats and plots only.
Proof: Same-cohort KPI, attribution, curve and CSV reconcile against backend
decimal results, including multi-strategy/multi-exit and large-history cases.

### 4B — Persisted paper journal and analytics
Action: Backend supplies durable hosted paper reads rather than runner-local files.
Agree explicit experiment activation/version, cost status/basis, entry/exit dates,
initial risk, pending/open/skipped/closed/data-hold, dual-hit ambiguity and alternate
outcome metadata. Frontend implements a separate owner-protected paper adapter.
Do not activate extra exit experiments implicitly or mix actual balances.
Proof: Real paper data is persisted and read back across independent runs; owner/
denial checks pass on the authorized target; next-session convention, fixed risk,
ambiguity counts/sensitivity and cost labels survive the UI/CSV path.

### 4C — Frozen chart inputs and persistent actions/configuration
Action: Agree frozen signal-input chart retrieval and backend-derived indicator
series; preserve available-at timing. Integrate existing set_signal_action with
stored request UUID/expected revision and explicit PT412 handling after contract
review. Implement the PRD operations/manual-run link and approved versioned exit/
experiment configuration. A new settings mutation requires an agreed contract;
do not use local React state as a persistent success receipt.
Proof: Chart is tied to the chosen input/version with no lookahead; exact action
replay does not add revision/audit, changed payload conflicts, stale revision is
HTTP412; configuration changes affect only new plans/trades. Test on development/
disposable targets; production actions require genuine approved activity.

Backend rollout order: agree contract -> backend code/schema tests -> development
application and real Auth/HTTP proof -> frontend adapter tests -> authorized
production backend rollout -> frontend release. Never edit applied migrations
001-007 merely to support a new feature or invent a schema/API version.

## Phase 5 — Full local QA and release review

Owner: FRONTEND; read-only reviewer. Findings: FE-10, FE-11. Risk: medium.
Files: tests, Playwright configs, README.md, IMPLEMENTATION_STATUS.md,
docs/VERCEL_DEPLOYMENT_CHECKLIST.md and current release evidence.
Action: Update semantic locators for dense tables while retaining financial/state
assertions. Run unit, lint, typecheck, build, default browser, dedicated journal
and dedicated scanner suites. Cover desktop/tablet/mobile, loading/error/empty/
partial/stale, invalid input, duplicate submit, refresh, session expiry/logout,
lost-response retry, PT412, explicit corrections and closed CSV200+1 cursor.
Review diff, bundle/config secret exposure and frontend/backend contract changes.
Reconcile docs against the actual verified commit and capabilities.
Proof: All required local suites pass with exact command/results and isolated
fixture labels. Test artifacts and stale generated types are handled without
discarding user work. Reviewer finds no unresolved P0/P1. Passing default18
workspace/Auth tests is not substituted for dedicated flow suites.

## Phase 6 — Hosted acceptance and controlled release

Owner: BOTH, each within repository ownership. Risk: high.
Action: Confirm current backend handoff, schema/contracts, publisher evidence and
source dates without repeating unchanged migrations. Prepare exact candidate SHA,
Vercel root '.', Production versus Preview env, callback/logout origins, rollback
deployment and sanitized acceptance checklist. Production: live URL/public key,
DATA_MODE=live, ALLOW_FIXTURE_PREVIEW=false/unset; Preview: isolated development
project and explicitly allowed fixture. No privileged/provider/OAuth secrets in
frontend. Commit/push/deploy and production Auth changes require current explicit
authorization; this plan is not that authorization.
Proof: On the exact deployed candidate, actual owner login/callback/logout and
read-only scanner/journal/analytics/CSV smoke pass; mobile/tablet/desktop and no
secret/token/OAuth-code exposure are checked. Backend hosted mutation/RLS/publisher
proof is separately recorded. Never create QA production trades. Waived outsider/
concurrency or unavailable >200 production history are disclosed, not fabricated.
The running backend snapshot date/digest is never replaced by a newer runner's
metadata unless that result was actually published.

## Completion gates

1. Frontend correctness: FE-01 through FE-08 resolved and regression-tested.
2. MVP integration: agreed live paper, signal detail/chart, actions, analytics and
   configuration flows are connected; an unavailable placeholder is not completion.
3. Local QA: all relevant dedicated suites/build/review pass on the release SHA.
4. Backend readiness: compatible deployed contracts and mandatory hosted evidence,
   or explicit scoped release disposition for waived checks; no assumed PASS.
5. Deployment acceptance: authorized exact Vercel release has real smoke evidence
   and rollback reference. Only then report the verified live scope.

Current outcome: Phases0-2 and the available-contract portion of Phase3 are
implemented and locally verified. Phase5 passes: unit18, journal57, scanner54
plus6 final fixture-denial guards, default browser18, lint, nonincremental
typecheck and ordinary Next16.3.6 build. Browser cases cover desktop/tablet/mobile.
The full scanner54 used the prior fixture-preview flag=true with simulated live;
the final flag=false is separately proven by6 critical guards. Dev timing failures
and the interrupted run are disclosed in the report; no assertions were weakened.
All test ports3052/3053/3054/3056 were closed after QA. Source/bundle pattern and
configured-private-value checks found no matches, with their limits disclosed.

Next action: Phase4 additive contract coordination via
docs/BACKEND_REMEDIATION_HANDOFF_20261004.md, then frontend adapters and fresh QA.
Phase6 requires backend evidence and separate release authorization; no new
hosted/Vercel smoke was run. Full MVP remains incomplete, not silently descoped.
See docs/FRONTEND_REMEDIATION_REPORT_20261004.md and sanitized local evidence.
Do not message another chat without explicit user instruction.

---

## Historical plan — preserved, superseded for current readiness

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
