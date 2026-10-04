# Scanner read adapter — recovery handoff2026-10-03

Current remainder (2026-10-04): [AUDIT_REMAINING_20261004.md](AUDIT_REMAINING_20261004.md).
Corrective code/local QA: [FRONTEND_REMEDIATION_REPORT_20261004.md](FRONTEND_REMEDIATION_REPORT_20261004.md).
The dated evidence below is historical; it does not certify the current local candidate.

## Latest backend gate alignment - 2026-10-03 (Asia/Jakarta)

Documentation-only alignment from backend BACKEND_FINALIZATION_REPORT_20261003.md,
FRONTEND_DEPLOYMENT_HANDOFF.md and github-full-universe-smoke-20261003.json.
No unchanged owner smoke, migration001-007 check, runner dispatch or artifact
redownload was performed by frontend. Backend evidence is accepted as reported;
this update does not claim independent frontend verification of its artifact hash.

- Owner production snapshot read remains PASS; existing evidence is preserved.
- Full100 hosted GitHub fetch/evaluation PASS within partial-quality scope:
  run37114744856, commit b4762fd063f45df6a9b29fb3d0a75b1fbdc8d371,
  finished2026-10-03T09:57:22.242630Z (16:57:22 WIB). Backend downloaded artifact
  11270993302 (1875 bytes), SHA256
  8f51cb6c35a0b6ce7d3312bb9bb7e679ce2a6e052822bd432c08c3778b781726,
  and reports the independent hash match. Prior failed run37114212953 stays FAIL.
- Calendar/universe100mapping PASS within configured dates; fresh LOCAL target
  recheck100/100 recovered, while the earlier failed fetch remains FAIL. Five
  short histories remain ineligible for600-bar strategies. Quality remains
  partial45/100:25 action holds,30 quality holds,zero signals,RS incomplete.
- Hosted anonymous read denial14/14 PASS according to backend; this does not
  prove authenticated outsider/disabled-owner or mutation authorization.
- Production publisher still BLOCKED: no database publication attempted, receipt
  null. Production snapshot is still8f634f6c-efae-4837-b1eb-1db04de6ffd2,
  target2026-10-02, stored2026-10-02T17:50:07.347251Z, digest
  0aefe872fe3aa9ead45f1f98f9980ff96cd819142ddcc0f9f64a0a83c1c4c121.
  Runner digest2ed30d1968c2aa8b6491541d712fc37aca8a475d8d7de9f8e84d247aab512241
  belongs to the runner artifact only; its timestamp/digest is not this snapshot.
- Current run items lack an explicit per-item revision-ID/fetch-time binding for
  all held/no-signal items. Do not substitute latest market revision provenance
  for this run's input, or equate stored_at with provider freshness.
- Hosted outsider/disabled-owner/mutation/lifecycle/concurrency remain BLOCKED
  without genuine approved activity/identities or an authorized isolation method.
  Scheduler OFF; full-stack/Vercel NO-GO; no frontend commit/push/deploy permission.

Adapter/UI and PT412/idempotency, p_exit_snapshot, closed export limit200/cursor
p_after and explicit correction FK remain unchanged. Older pending-runner notes
below are historical and superseded by this section. Next backend gates are
controlled hosted publisher and mandatory authenticated/mutation proofs; do not
reopen unchanged migration, owner-read or successful runner fetch/evaluation.


Frontend implementation plus local and hosted read verification; this is not a full-stack GO
or authorization to publish GitHub workflows, create production QA trades, or deploy.

### Partial scanner recovery verification — PASS within read-only scope

Observation UTC 2026-10-02T22:50:09.953Z; Asia/Jakarta handoff version2026-10-03.
Production owner UUID matches the existing enabled owner; no JWT was copied.
Latest forward/live run8f634f6c-efae-4837-b1eb-1db04de6ffd2, target2026-10-02,
stored2026-10-02T17:50:07.347251Z (3October00:50:07WIB), is partial45/100.
Four25-row quality pages showed100 unique tickers:45 evaluated,25 corporate
action holds and30 data quality holds. Scanner GETs all returned200. RS remains
incomplete and no ranking is rendered. Published signals were empty; UI explains
this is not a complete-universe result. Partial/failed runs default to quality.
Storage/publication time is explicitly not provider freshness. No provider input
time or unpublished fetch details are fabricated from missing metadata.

Real owner journal/analytics/export reads succeeded with an empty ledger. Exact
Fixed2R snapshot remained selected through analytics/export; export had0 closed
rows and ended without continuation. Empty data cannot prove CSV contents or
production cursor>200; no QA trades were created. RPC HTTP status for journal/
analytics/export was not separately captured. Anonymous local application reads
showed access-required pages, with CSV API401; this is not new hosted outsider
RLS evidence. Desktop1440, tablet1024 and mobile390 showed no horizontal
overflow on scanner, journal, analytics and export. This is localhost against
production Supabase, not a Vercel smoke.

Executed local checks: scanner27/27 plus final empty-continuation3/3; selected journal contracts12/12 plus
PT412 fill checks3/3; unit12/12; lint, production build and standalone typecheck
PASS. Tests use HTTP doubles and exited normally; generated Next type paths
were restored without touching application edits. No backend edit, production
write, commit, push or deploy. Full-stack/Vercel remains NO-GO pending backend
gates and separate frontend authorization. Evidence:
`docs/evidence/scanner-owner-production-20261003.json`.

## Read contract

Inputs are migration001 tables and migration004 run envelopes, produced by
`idx_scanner.persistence.scan_envelope` and `SupabaseScanStore.publish`.
No invented overview RPC or additional API version is needed.

- Owner Auth, enabled `app_members`, and matching `deployment_settings.data_mode`
  gate each request. One Supabase client carries the user's session; no privileged key.
- `scan_runs`: one `forward` run in the configured mode, ordered by session,
  stored time and ID. A specified UUID pins subsequent pages. Select metadata,
  `snapshot->ranking->>status` and `snapshot->>publication_deadline`; exclude
  the full run snapshot, its item array and ranked returns.
- Last complete/partial run: one metadata-only row, not the history.
- Signals: `scan_run_signals` filtered by `run_id`, embed `signals!inner(...)`
  with only the candidate projection and provenance columns.
- Quality: `scan_run_items` filtered by `run_id`, one snapshot per displayed ticker.
- Each section reads25+1 rows; the extra row is a continuation sentinel. No other
  section is fetched. Pagination disables prefetch and retains the immutable UUID.
  No polling or full-history preload is installed.

Aliases, JSON projection and inner embedding follow the official
[Supabase select contract](https://supabase.com/docs/reference/javascript/select).
Schema/envelope producers were read locally. Hosted nonempty run/item projections passed in the recovery smoke above.
Nonempty published-signal embedding remains unverified on production because
this run has zero signals; an HTTP double does not certify that remaining case.

## Display behavior and limits

`/scanner` is private in both modes; live `/` uses the same adapter. Fixture `/`
stays the labeled demo workspace. There is no fallback from live to fixture.
Preparing, forbidden/unconfigured, contract error, read failure, partial, failed
and complete results remain distinct. Coverage keeps backend numerator/denominator;
saved quality and candidate reason codes are visible, including unknown codes.

Incomplete RS holds the entire ranking. The browser never ranks a partial subset
or recalculates indicators, risk, fees, ledger, R or analytics. Reference close and
backend stop are display values, not fills. Late-model-only and elapsed next-open
windows are explicit. A stored deadline does not certify freshness against today's
exchange session: frontend does not guess holidays from weekdays or Yahoo gaps.
Authoritative latest runtime-session metadata is needed before claiming freshness.

The persisted envelope exposes item statuses, not detailed provider_errors,
last-bar timestamps or transport diagnostics. The UI shows the actual reason code
and says additional detail is unavailable; it does not reconstruct or fabricate it.

## Windows teardown

The prior Playwright webServer launcher used a shell/Windows taskkill and stalled.
Test-only global setup now forks direct owned Node children, starts Next using its
programmatic custom-server API, and closes sockets/HTTP/Next through IPC. The mock
uses the same protocol. No shell, unknown-PID kill, or production-server reuse.
A15s timeout fails teardown rather than claiming success.

Workspace/auth: loopback3054; scanner:3056; journal:3052 with HTTP double3053.
Explicit test URL/key/mode override local environment files. Isolated build output
and transient smoke types are excluded from lint/product typecheck; production
build still checks application/routes. Generated `next-env.d.ts` is restored only
when it matches the harness-owned transformation, preserving concurrent edits.

Executed: scanner21/21, workspace/auth15/15, selected journal access/empty/responsive
6/6, targeted teardown1/1 and unit12/12 passed. Browser runs exited0 without Ctrl+C.
Desktop/tablet/mobile coverage includes partial screenshot review and overflow
assertions. These are test doubles/fixtures, not hosted production RLS evidence.
Final build and production read checks are in IMPLEMENTATION_STATUS.md.

## Files touched in this continuation

- Adapter: `src/lib/scanner-contract.ts`, `src/lib/scanner-server.ts`,
  `src/components/scanner-dashboard.tsx`, `src/app/scanner/page.tsx`.
- Integration/layout: `src/app/page.tsx`, `src/proxy.ts`,
  `src/components/journal-shell.tsx`, `src/app/globals.css`.
- Browser/unit cases: `tests/scanner.spec.ts`, `tests/scanner-contract.test.mjs`.
- Owned server lifecycle: `tests/support/managed-next.mjs`,
  `tests/support/smoke-setup.ts`, `tests/support/journal-dev.mjs`.
- Harness/config: `playwright.config.ts`, `playwright.journal.config.ts`,
  `playwright.scanner.config.ts`, `package.json`, `tsconfig.json`,
  `eslint.config.mjs`, `.gitignore`.
- Docs: `README.md`, `IMPLEMENTATION_STATUS.md`, this audit,
  `docs/VERCEL_DEPLOYMENT_CHECKLIST.md`.

`next-env.d.ts` was generated during checks and restored to its original paths.
All earlier local work is preserved; this list is not the entire repository diff.

## Historical backend gates — superseded by recovery report20261003

Update2026-10-02: hosted owner-session read smoke now passed against production
run08fb1080-5889-45e6-903d-3d2400bbf375. Observed GET scan_runs/items/signals
HTTP200, failed0/100,100 unique data_quality_hold items over four25-row pages,
zero published signals and incompleteRS. Failed runs default to quality pages.
Evidence: docs/evidence/scanner-owner-production-20261002.json. Item snapshots
provide status only; no deeper provider reason is invented. Backend now reports
full100 mappings/fetch, assembled2024–2026 calendar and manual GitHub provider
smoke PASS; full GitHub scanner publication, evaluated quality and deployment
remain distinct gates. Earlier pending-input list below is historical.

Backend files are untouched. Scope clarification is pending because prior
instructions reserve backend edits for another chat.

1. Assemble verified runtime2023–2026 calendar/amendments and historical session
   periods. An additional primary-source research lead is the official KPEI
   [2024 calendar amendment](https://assets-website.idclear.co.id/idclear/storage/28410/PENG-041-20Nov24-Perubahan-Jadwal-Kliring-dan-Penyelesaian-Transaksi-Bursa-Tahun-2024_v.3-%281%29.pdf);
   it is not a certified assembled runtime calendar.
2. Verify remaining95 mappings and fetch the effective full universe with the
   existing backend provider. Preserve every failure/hold and incomplete RS.
3. Review/publish the prepared manual-only GitHub workflow with explicit
   commit/push authorization, execute it, and retain run URL/status/artifact.
   A local workflow file cannot be dispatched as if already published.
4. Close mandatory hosted RLS/lifecycle gates using real owner-approved activity
   or a specifically reviewed isolation method. Do not add permanent synthetic
   ledger data, create/promote accounts, or substitute local fixture success.
5. Verify this adapter against a real published run, including JSON projections,
   FK embedding, paging, quality holds, and stale/late states. Then obtain separate
   frontend deployment authorization and execute Vercel smoke.
