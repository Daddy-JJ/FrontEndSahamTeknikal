# Scanner read adapter — 2026-10-02

Frontend implementation/local verification only; this is not a full-stack GO
or authorization to publish GitHub workflows, create production QA trades, or deploy.

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
Schema/envelope producers were read locally. Nonempty real hosted PostgREST
projection/embedding remains a smoke gate; an HTTP double does not certify it.

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

## Remaining backend gates

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
