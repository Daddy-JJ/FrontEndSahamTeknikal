# Frontend implementation status

Updated: 2026-10-02 (Asia/Jakarta).

## Production deployment preparation handoff

### Git publication authorization — 2026-10-02

User explicitly authorized frontend commit and push. Publish the reviewed local
M4 journal/scanner/test/docs changes to `codex/frontend-m4-scanner-preparation`.
This supersedes older no-commit/no-push wording for frontend only. Production
deployment, backend edits, Auth changes and production QA writes remain outside
this authorization. Main is unchanged; any automatic branch preview is not a
production GO. Environment files, test output and local builds remain ignored.

### Scanner adapter and Windows teardown continuation — implemented locally

User requested completion of the scanner read adapter and Windows test teardown.
The adapter uses owner Auth/RLS and existing immutable scan tables, bounded
page reads, explicit data-mode/namespace checks, and backend quality/RS states.
No frontend rule or financial engine will be introduced. Calendar/full-universe,
GitHub publication/runner and hosted mutation gates remain separate; backend
edit scope was requested for clarification. No production QA writes or Vercel
deployment are part of this implementation.

`/scanner` and live `/` now read one forward run, one latest complete/partial
metadata row, and only the selected section's25+1 rows. Run snapshot arrays are
not downloaded; pagination retains the immutable UUID and disables prefetch.
Coverage/quality/candidate reasons, global incomplete-RS hold, late cohort,
elapsed/unknown entry windows, and missing/error/mixed-mode states stay explicit.
No financial or signal arithmetic was added. Persisted run data does not expose
all provider diagnostics or an authoritative current runtime session; these
limits remain visible instead of fabricated freshness.

Windows harness now owns direct Node children and closes Next/HTTP/sockets via
IPC. Workspace15/15, scanner21/21, selected journal6/6 and targeted teardown1/1
returned exit0 without Ctrl+C. Unit12/12, lint, typecheck and isolated Next16.3.6
production build passed. Initial lint purity and transient generated-type errors
were corrected before those final checks; smoke output types are excluded from
product typecheck, while production build validates source/routes normally.
Audit: `docs/SCANNER_ADAPTER_AUDIT.md`.

Production-configured local server was rebuilt into ignored `.next-release-check`
and restarted on3050; environment presence-only audit confirmed the production
project/public key, live mode and fixture disallowed, without printing values.
The old tab initially showed the existing owner verified. A separate port3057
did not carry that session, and after returning to3050 the new build required
login. GitHub login attempt was followed by browser/CDP timeouts; no token was
copied, Auth setting changed, or data mutation submitted. Thus fresh adapter
owner-JWT hosted read is not counted as passed. Local server remains on3050 for
the user to resume login. Previous owner/anon production read evidence remains
historical, not proof of nonempty hosted scanner output.

Fresh anonymous frontend GET `/scanner` returned HTTP200 with
`Cache-Control: no-store, private` and the login-required message; no protected
scan content rendered. This is the frontend access gate, not a new direct
production PostgREST/RLS denial test. Final targeted teardown rerun passed1/1
with exit0; `next-env.d.ts` has no diff, typecheck and diff check passed afterward.

### Latest preparation-only boundary — 2026-10-02

The latest user instruction is preparation only. It supersedes the earlier
deployment-readiness/action wording below. No commit, push, backend edit,
production QA ledger write, Auth change, or Vercel deployment is authorized by
this continuation. Frontend deployment remains **NO-GO** and needs separate
user authorization after mandatory backend gates close.

Read-only review of backend `docs/SCANNER_LIVE_READINESS.md` and sanitized
`docs/evidence/{disposable-auth-smoke,disposable-followup,disposable-signal,
live-provider-5-ticker,scanner-readiness}-20261002.json` establishes these
distinct evidence scopes:

| Scope | Evidence | Limit |
| --- | --- | --- |
| Hosted production | CLI history001–007 reported; earlier frontend owner/anon read smoke below | Empty journal; no hosted lifecycle, outsider/disabled-owner or concurrency proof |
| Local disposable fixture | Real Auth/HTTP owner isolation and outsider/disabled-owner denials; actual lifecycle, canonical ledger, replay/conflict/PT412, fee correction/explicit FK, independent sessions; export201 as200+1 with `p_exit_snapshot`; scanner-action007 two sessions | Backend evidence reviewed, not rerun here; not hosted production or Vercel proof |
| Live Yahoo probes | Five ticker identities and fetched bars passed | Connectivity/identity proof; not full-universe quality, calendar, publication or runner proof |

The KOMPAS100 workbook was found and verified with 100/100 unique members;
the user does not need to supply a replacement workbook. Runtime calendar and
historical session rules, the remaining 95 ticker mappings/full-universe checks,
and actual GitHub runner execution remain blocked. Quality skips are accepted
only with visible reasons and coverage; RS must hold for the whole incomplete
cross-section. Other strategies may evaluate only backend-eligible tickers.

Frontend audit: the production homepage honestly shows scanner preparation,
but currently has no live scan read adapter. The workspace and its partial/stale
controls are labeled fixture previews. Publishing backend output alone will
not populate that page. A future frontend adapter needs the verified backend
contract and must preserve freshness, coverage, per-ticker skip reasons and RS
holds, without recalculating signals or financial metrics in the browser.

The workspace/auth Playwright harness now uses loopback 3054, a separate build
directory, explicit fixture-only environment and no server reuse. It no longer
attaches fixture tests to the production-configured local server on 3050.
The first regression run executed all15 desktop/mobile/tablet cases:14 passed,
one desktop login redirect exceeded the default5s wait during cold Next.js
compilation. Its snapshot already showed the login page. The assertion wait is
now15s; the targeted desktop case rerun passed. Both processes were interrupted
after their case results while waiting for server teardown, and an immediate
rerun correctly refused to reuse the first occupied port. Windows server teardown
still needs investigation before calling this a clean suite exit. The generated
`next-env.d.ts` was restored to its pre-test paths. `npm.cmd run lint`,
`npm.cmd run typecheck`, and `git diff --check` passed. These fixture browser
results do not prove hosted RLS. No production build or remote smoke was rerun
in this preparation-only continuation.

### Production read-only smoke — 2026-10-02

Backend's latest status reports CLI application/history for migrations001–007,
HTTP200 privileged postflight for the market revision and seven actual tables,
the explicit correction FK, live mode, zero fixture rows, and an enabled owner.
This is schema/privileged-GET evidence, not proof of RLS by itself.

The local production-configured build passed and `http://localhost:3050/login`
returned HTTP200. GitHub OAuth returned through `/auth/callback`; `/auth/check`
showed that the signed-in UUID matched the existing enabled owner. The UUID is
intentionally omitted here. Owner-JWT GETs rendered the LIVE journal with zero
trades, analytics with `exit_snapshot=fixed2r` and zero closed trades, and the
closed export page with zero rows and no continuation. No CSV file was produced
because there were no rows; no trade, fill, or other journal mutation was sent.
The owner pages therefore demonstrate read access and successful empty states,
not lifecycle or cursor-over-200 behavior.

Anonymous production PostgREST GETs to `app_members` and `actual_trades`, using
only the public key and no user bearer token, returned HTTP401 / SQLSTATE42501.
An unauthenticated local frontend export request also returned HTTP401. These
prove the tested anonymous denials. Outsider/disabled-owner sessions and
production mutation/idempotency/concurrency behavior remain untested.

The production homepage says “Pemindaian live sedang disiapkan.” Backend's
latest readiness status likewise says scanner live smoke has not passed.
Frontend deployment remains NO-GO until backend completes its remaining
production owner/RLS and scanner gates and the live scanner has verified inputs
and runner. The user has now requested deployment readiness/action separately;
no commit, push, or Vercel deployment has occurred. This local smoke is not a
Vercel deployment smoke or a full-stack GO.

Local release checks in this continuation: production `npm.cmd run build`
passed, `npm.cmd run lint` passed, and `npm.cmd run test:unit` passed 8/8.
`npm.cmd test` was stopped after two desktop workspace tests timed out because
`playwright.config.ts` reuses the existing production-configured server at
127.0.0.1:3050 while those tests require the fixture demo. The initial desktop
and mobile auth cases passed; this interrupted fixture suite is not counted as
a pass or a production smoke. No test intentionally submitted a production
journal mutation.

Backend `docs/FRONTEND_DEPLOYMENT_HANDOFF.md` and
`docs/PRODUCTION_READINESS.md` were read-only inputs. Development
`vgmkpsestahkfahzdtae` remains fixture mode with migrations005, 006 and 007
active. Migration007 passed a hosted SQL rollback-only smoke for exact replay,
changed-payload conflict and stale `PT412`; this used a simulated SQL owner
claim, not a real Auth JWT, PostgREST request or independent sessions. The
frontend owner-JWT/two-tab smoke documented below covers actual-journal 006,
not scanner-action 007. The current scanner-action probe only tests an identical
replay and is development-only.

The older deployment status below is historical as of 2026-10-01. The
2026-10-02 production CLI and frontend smoke evidence above supersedes it for
migrations, owner login/read access and tested anon denials. Backend still has
not reported complete production owner lifecycle/RLS or scanner live smoke.
There is no production scanner-action UI.

Development `vgmkpsestahkfahzdtae` remains fixture mode with migrations005,
006 and007 active. Development007 evidence remains hosted SQL rollback-only
with a simulated owner claim; real owner-JWT, PostgREST/HTTP412 and independent
sessions are untested. The frontend owner-JWT/two-tab evidence is for actual
journal migration006 only. No backend, Supabase, Auth, Vercel, Git, or
production state was changed here.

Local probe safety check: after the user updated ignored `.env.local`, a
value-free check confirmed the development URL, configured publishable key,
fixture mode and fixture preview permission. No key value was read or printed.
The user-requested `npm.cmd run dev` could not start because port3050 was already
in use; the existing local app returned `/auth/check`. It showed an active
development owner session and fixture counts (one run, two signals), confirming
authenticated page access to the development project. The page also showed the
pre-existing watchlist probe record (revision1, one request and one audit). The
fixed request UUID and arguments are in the existing development probe source,
but the page does not expose the stored receipt payload. Because the action
already exists, its guarded test button is hidden. A fresh read of `/auth/check`
after inspection showed the same revision1/request1/audit1 counts. No RPC was
sent, so this unchanged read is not a replay or conflict smoke.

The existing candidate origin `https://sahamteknikal.vercel.app` returned HTTP200
for `/` and `/login` in a read-only check on 2026-10-01. This is shell evidence,
not a live full-stack result. `docs/VERCEL_DEPLOYMENT_CHECKLIST.md` now records the
root repository, production/preview environment matrix, exact Auth URLs,
deployment order, real smoke gates, rollback boundary, and evidence required.
`.env.production.example` contains no secret and keeps production in `live` mode
with fixture preview disabled. Three error messages that can render in production
now refer to the active environment/Supabase connection instead of incorrectly
directing operators to development. Post-preparation verification passed:
TypeScript typecheck, ESLint, Next.js 16.3.6 production build, and
`git diff --check`. The build used the ignored local environment and is compile
evidence only; it is not a production-Supabase or Vercel environment smoke.

The latest focused local browser regression passed on desktop, mobile, and
tablet: 3/3 cases for a 201-row export spanning the 200-row page boundary and
3/3 cases for a failed logout. The export double verifies `p_status=closed`,
`p_limit=200`, and continuation with `p_after`; it does not prove a persistent
201-row production cohort. A Supabase logout error now keeps the user out of the
success redirect and displays an explicit session-uncertain error. The focused
checks are mocked browser evidence, not production Auth or ledger evidence.
The current `test:unit` run passed 8/8, followed by successful typecheck,
lint, production build, and `git diff --check`.

## Development owner-JWT frontend smoke after migrations 005 and 006

This section is evidence for the actual-journal frontend flow on migrations005
and006. It is not a scanner-action 007 test. Backend's newer 007 development
result is SQL-only and rollback-only; frontend owner-JWT/PostgREST and two
independent-session scanner-action checks remain untested. The development app
shows a genuine owner session and the existing watchlist probe receipt/audit.
Its test action is guarded because the fixed signal already has an action, so
no new RPC was submitted. Changed-payload conflict and stale PT412 still require
separate requests/sessions through an authorized test path. No concurrent test
was attempted on shared fixture data.

Backend applied 005 and the stale-conflict follow-up 006 to
`vgmkpsestahkfahzdtae` with `data_mode=fixture`; the
frontend did not apply migrations or write to production. An unrestricted local
Next development server at `localhost:3050` was necessary because the sandboxed
server could not reach Supabase HTTPS (`EACCES`). The browser completed GitHub
OAuth through the application, and `/auth/check` showed an active owner. No JWT
or service key was copied to a test script. Before the final config change,
Next dev's default incoming-request log did include one-time OAuth callback
codes in URL query strings; the callback route is now excluded from that log.

- With that real application session, the owner created one labeled `TEST` draft
  and recorded buy 100@100 fee25 estimated, buy 100@102 fee25 actual, finalized
  entry at initial stop95, changed the current stop to97, then sold 100@105 fee25
  and 100@108 fee25. The partial position stayed open with R undefined; after
  close, the UI showed initial risk Rp1,200, fees Rp100, net Rp1,000 and rounded
  R0.833. All four fill rows and the locked initial risk were visible. The
  correction changed the first fill's fee status from estimated to actual while
  retaining amount25 and timestamp; embedded latest correction rendered on the
  fill row. Final trade revision after two replay probes was 10. Synthetic
  development audit data remains in the fixture project.
- The owner analytics RPC through the UI showed partial as open and closed
  sample0, then closed sample1/net Rp1,000/win rate100%. Exact fixed2r snapshot
  selected the closed trade; exact ma10 selected zero closed trades and null
  ratios. The invalid snapshot query showed a filter error rather than widening
  the cohort. After the fee correction, estimated-fee closed count was zero.
- The downloaded CSV (`actual-journal-fixture-start.csv`) contained one closed
  row at revision8 with backend strings `1200.0000`, `100.0000`, `1000.0000`,
  `0.833333333333` and `fee_quality=actual`; these match the UI's rounded
  presentation and the canonical SOT case. The app's export page said this was
  the last part. A temporary development-only owner-session probe called
  `export_actual_journal` with exact fixed2r, `p_status=closed`, `p_limit=200`,
  `p_after=null`: one row, `has_more=false`, `next_after=null`; ma10 returned
  zero rows. No >200-row hosted cursor continuation was tested.
- The temporary owner-session probe submitted an identical note request twice:
  both responses matched, and one note/one receipt advanced revision exactly
  once. Migration 006 changed stale business conflicts from retryable SQLSTATE
  `40001` to `PT412`/HTTP 412. A real owner two-tab retest on 2026-10-01 saved a
  fresh note at revision11, advancing the trade to revision12, then submitted a
  stale revision11 note from the second tab. The UI immediately showed
  `Revisi trade berubah`; the trade remained revision12 and the stale note did
  not appear in the notes view. `40001` remains mapped in the client for
  compatibility, while `PT412` is the active development contract.
- Logout returned to `/login`; `/journal` then hid the ledger and requested
  owner login. An unauthenticated local HTTP request to `/api/export/journal`
  returned 401. Real outsider and disabled-owner frontend sessions were not
  exercised here; backend's separate outsider RLS evidence must not be counted
  as this browser smoke. A one-page persistent fixture cohort cannot prove the
  frontend multi-part download. Backend separately reports a rollback-only
  development smoke with 201 closed trades returning 200 plus one continuation;
  that is backend cursor evidence, not frontend UI evidence or a single DB
  snapshot across multiple requests.

The development-only replay probe route/page were removed after use. No durable
application auth bypass or test endpoint remains. The intended source edits
from this continuation are `next.config.ts`, `src/app/journal/actions.ts`,
`src/app/journal/page.tsx`, `src/components/journal-form.tsx`,
`tests/support/journal-dev.mjs`, this status, `README.md`, and
`docs/JOURNAL_AUDIT.md`;
all pre-existing uncommitted frontend work remains preserved. Local `test:unit`
passed 8/8 during the smoke. Typecheck first failed while the temporary probe
referenced a non-existent TypeScript `PostgrestError.status`; that temporary
field was removed, and the probe files were then deleted. Final `typecheck`
passed, `lint` passed after a sandbox invocation hung without diagnostics,
Next.js 16.3.6 `build` passed with no dev-smoke route in the route table, and
`git diff --check` passed. The full local journal/browser suites were not
rerun in this continuation; their earlier counts are below.
After excluding `/auth/callback` from Next development incoming-request logs,
a synthetic `code=QA_NO_SECRET` callback returned HTTP307 and produced no
incoming-request log line. A stale generated `.next/dev/types` directory from
deleting the temporary route initially broke typecheck/build; only that ignored
generated directory was removed. Final typecheck, lint and build then passed.

After user approval to continue, the complete local regressions were repeated:
`npm.cmd run test:journal` passed **45/45** in 6.6 minutes and `npm.cmd test`
passed **15/15** in 1.1 minutes, both with clean exit codes across desktop,
mobile and tablet. Their first sandboxed runs had already passed every assertion
but hung during Windows teardown; those runs were interrupted and are not counted
as clean results. The permitted reruns exited normally. Backend coordination was
sent to the separate Backend SahamTeknikal chat for the stale owner-JWT timeout
and a controlled >200-row development fixture. Backend supplied migration 006 and
its rollback-only 201-row cursor evidence; this frontend chat made no backend
edits. After adding the frontend `PT412` mapping, the focused conflict case passed
**3/3** across desktop, mobile and tablet. The final post-change checks also
passed: unit **8/8**, TypeScript typecheck, ESLint, Next.js 16.3.6 production
build, and `git diff --check`. The full 45/45 journal and 15/15 auth/scanner
suites above were completed before the narrow `PT412` mapping; the affected
browser case was the one rerun across all three viewports.

## Earlier local implementation and checks

- Analytics and CSV share `p_exit_snapshot` for the three immutable exit
  configurations created by the frontend. The draft form imports the same
  constants, so its snapshot cannot drift from the filter presets. Invalid or
  conflicting filters do not silently widen a cohort.
- Owner trade list fetches 101 rows for each 100-trade page; later list pages
  skip the analytics RPC. Trade detail loads
  only the selected event section, 51 rows for each 50-row page; visible fills
  embed at most one latest correction each. Switching from Fill to Catatan was
  asserted to query `actual_notes` only, without re-reading other event tables.
  Fill pages use stable recording sequence while displaying effective corrected
  timestamps. Official ledger amounts still come from backend fields/RPCs.
- Full `npm.cmd run test:journal` after the selected-section refactor:
  **45/45 passed**, clean exit, 15 cases across desktop/mobile/tablet. The
  subsequent page-2 analytics skip passed its focused **3/3** viewport rerun.
  `npm.cmd run test:unit`: **8/8 passed**. Final `typecheck`,
  `lint`, Next.js 16.3.6 `build`, and `git diff --check` passed. A sandbox lint
  invocation hung without diagnostics and was interrupted; the permitted rerun
  passed. Targeted browser reruns after the query refactor also passed 9/9 and
  3/3 before that full run. No full suite was repeated after the small page-2
  change; the 3-case rerun covers its affected pagination path.
- Only frontend files changed in that local slice. Backend 005 was then the
  separate development gate; no backend edits, remote database writes, commit,
  push, or deploy had occurred in the frontend chat at that point.
  Local HTTP doubles cannot prove hosted PostgREST embedding/RLS behavior.

### 2026-09-30 continuation: mode boundary

- The journal owner gate now compares `deployment_settings.data_mode` with the
  server's `DATA_MODE` and permits fixture journal access only where fixture
  preview is enabled. Mismatch denies journal reads, mutations and export before
  querying actual tables/RPCs; the homepage uses the same server-side mode helper.
- Typecheck and lint passed. The focused browser case passed 3/3 across desktop,
  mobile and tablet with a clean exit after the permitted rerun. An earlier
  sandbox run passed its three assertions but hung during Playwright teardown
  and was interrupted; it is not counted as a clean test result.
- The existing scanner/auth browser suite passed 15/15 across the same three
  viewports after the homepage mode helper change. Next.js 16.3.6 production
  build and `git diff --check` passed.
- Browser inventory still has no owner session. The development migration and
  real JWT/RLS/ledger smoke remain open; no remote schema change was made.
- The pre-generated backend dev SQL handoff was checked read-only: file present,
  transaction/fixture guard/readiness query present (SHA256
  `1A1D4DE6E9E4347EC88DA534D2EE997049B8197755D182357B13A83B664524BE`).
  The Supabase dev SQL Editor redirected to sign-in after its initial shell;
  there was no authenticated dashboard session to verify backup/project state
  or execute the guarded migration. The sign-in tab was left for owner handoff.

## Historical local baseline before development owner-JWT smoke

Preserved and continued the uncommitted handover. Only frontend was edited.
No commit, push, deploy, migration application or production write was performed.

### Changes

- Journal/analytics/export now receive session refresh and repeat owner checks.
- Read errors and unavailable schemas are separate from empty data; failure of
  the selected event page disables mutations. Unknown/unconfigured connection
  uses neutral status.
- Form pending state prevents duplicate clicks. Transport failure preserves input
  and request UUID; retry uses the same payload. Success reloads current ledger.
- Entry controls use entry_finalized_at, including open unfinalized buy batches.
  Fees are explicit and initially estimated; risk/basis/MA fields are displayed
  from backend. Fill rows show effective corrected timestamps in stable recording
  order, avoiding page shifts when a timestamp is corrected.
- Calendar-valid cohort filters never silently widen the requested sample.
- Export uses backend export_actual_journal with p_status=closed and cursor paging,
  plus the verbatim canonical CSV formatter. Exact decimals/fee quality/audit
  context are preserved, text formulas escaped, paper/live modes never conflated.
- Added a test-only localhost Auth/PostgREST double, meaningful browser/unit tests,
  documentation and isolated test output. No application auth bypass was added.

### Verification actually run

- Earlier baseline `npm.cmd run test:journal`: **39/39 passed**, 0 skipped/flaky, exit 0.
  13 cases x desktop1440x1000 / mobile390x664 / tablet1024x768, Chromium/Edge.
  Full report: test-results/journal-full-report.json (ignored).
- npm.cmd test: **15/15 passed**, exit 0 (existing scanner/auth regression).
- Earlier baseline `npm.cmd run test:unit`: **6/6 passed**, exit 0 (CSV/date/contract checksum).
- npm.cmd run build: **passed**, Next.js16.3.6 production compilation and routes.
- npm.cmd run typecheck and npm.cmd run lint: final reruns **passed**, exit 0.
- Final targeted rerun after fixture consistency and caret capture changes:
  **12/12 passed**, exit 0 (four affected cases across all three viewports).
  The 39-case report is retained separately. The latest journal-report.json
  contains the final 3-case targeted rerun; the 45-case pass is recorded above
  from the clean Playwright process output.
- git diff --check: passed after trimming a trailing blank line in globals.css.
- Visual review: fixture journal/analytics screenshots across desktop, mobile,
  tablet. Browser assertions check horizontal overflow and relevant form states.
- Canonical CSV source/backend SHA256 matched; no dependency versions changed.
- Static browser JS search found no privileged environment variable names tested
  (SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SECRET_KEY, AI_API_KEY). This is a targeted
  check, not a general security certification.

Earlier test failures: incomplete synthetic session cookie, ambiguous alert
locator, dev cache-header expectation, and short correction navigation timeout.
These were corrected and covered by the successful full run. A screenshot caret
style injected before hydration caused a warning in the successful full run;
final screenshots use caret=initial to avoid altering form attributes.
Sandbox Windows test teardown hung after assertions; those runs were interrupted.
The final 39/15 runs used permitted process access and exited cleanly. Node emits
non-failing MODULE_TYPELESS_PACKAGE_JSON/FORCE_COLOR warnings; runtime is unchanged.

### Earlier remote evidence and limits (superseded by the owner smoke above)

Read-only anonymous development probes on 2026-09-30: actual_trades and
actual_fills returned HTTP404/PGRST205. First sandbox network attempt failed;
the permitted retry produced those responses. This proves neither owner access
nor RLS isolation. No owner session was available in connected browser inventory.

At that earlier point, 005 was not yet active. Local doubles verify frontend integration,
not SQL atomicity, hosted concurrency, RLS policy correctness or real OAuth refresh.
No remote journal mutation/export/ledger smoke had been attempted then. Backend's separate
SQL/Python results are not counted as tests run by this frontend chat.

### Files in the frontend worktree

Continued handover files:
- src/lib/journal-server.ts; src/lib/csv.ts (preserved utility)
- src/components/journal-shell.tsx
- src/app/journal/page.tsx; src/app/journal/[id]/page.tsx; src/app/journal/actions.ts
- src/app/analytics/page.tsx; src/app/api/export/journal/route.ts
- src/app/globals.css; tests/csv.test.mjs

Added/further changed by this audit:
- src/components/journal-form.tsx
- src/lib/journal-filters.ts; src/lib/journal-export.ts
- src/lib/data-mode.ts; src/lib/journal-page.ts; src/app/page.tsx
- src/app/journal/export/page.tsx; src/app/layout.tsx; src/proxy.ts
- src/generated/actual-journal-export.mjs and actual-journal-export.d.mts
- tests/journal.spec.ts; tests/journal-filters.test.mjs; tests/journal-page.test.mjs;
  tests/export-contract.test.mjs; tests/support/journal-dev.mjs
- playwright.journal.config.ts; playwright.config.ts; package.json
- next.config.ts; tsconfig.json; eslint.config.mjs; .gitignore
- README.md; docs/JOURNAL_AUDIT.md; IMPLEMENTATION_STATUS.md

next-env.d.ts may be regenerated by Next dev/build for the active output directory;
it is generated framework output, not a contract change.

### Remaining release gates

Migration005/006 and the real-owner fixture smoke now cover the canonical ledger,
partial exclusion, correction, exact replay and stale-revision response described
above. Before a production release, verify the frontend with real outsider and
disabled-owner sessions, exercise a persistent >200-row frontend export cohort,
and complete the backend deployment gates for paper persistence/ambiguity
analytics, cash/equity, custom exit-snapshot discovery, backup/restore and the
target production environment. Re-run the production-mode smoke only after the
backend migration plan, secrets and rollback plan have been reviewed.

See docs/JOURNAL_AUDIT.md for contract checksums, commands and detailed boundaries.
