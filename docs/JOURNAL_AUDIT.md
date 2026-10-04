# Frontend M4 audit and development handoff

Current remainder (2026-10-04): [AUDIT_REMAINING_20261004.md](AUDIT_REMAINING_20261004.md).
Corrective code/local QA: [FRONTEND_REMEDIATION_REPORT_20261004.md](FRONTEND_REMEDIATION_REPORT_20261004.md).
The dated evidence below is historical; it does not certify the current local candidate.

Updated 2026-10-01, Asia/Jakarta. All edits in this continuation are in frontend.
Backend owns trading rules, ledger arithmetic, revisions, authorization and RLS.
No frontend commit, push, deployment, migration application, or production write was made.
Backend has since applied migrations 005 and 006 to development; the owner-JWT
fixture smoke and resolved `PT412` stale-revision path are recorded below.

The owner gate also requires the Supabase deployment mode to match the app's
server-side `DATA_MODE`. Fixture journal access follows the same preview gate as
the homepage. A mismatch yields an unavailable state before actual table/RPC
reads or export, and is covered by a focused three-viewport browser case.

## Contract used

Read-only reference: backend `supabase/migrations/202609290005_actual_journal.sql`,
SHA256 `9039e5ba51f24ea78a599ae0343b29ae0d16d002ef65b44d49db58e121d319bf`.
Coordinated with **Backend SahamTeknikal**; export now supports p_status=closed.
See backend `docs/ACTUAL_JOURNAL.md` for rollout instructions.

- `apply_actual_journal(p_action,p_trade_id,p_payload,p_request_id)`: create,
  fill, finalize, stop, note, tag, correct_fill. Decimal strings and explicit WIB
  to UTC conversion; no browser ledger math. Quantity inputs are safe whole
  JavaScript integers; prices/fees allow 16 integer and 4 fractional digits.
- Non-create mutations pass expected_revision. Pending disables the form; errors
  retain inputs and UUID. Retry uncertain replies with the same request. Success
  performs a fresh GET, including after replay of a historical receipt. Database
  atomicity, idempotency and oversell remain backend responsibilities.
- Buy/finalize controls use entry_finalized_at: a buy batch is already open before
  finalization. Risk stays provisional; first sell can finalize atomically. Fees
  are required, default to estimated, and never default to zero.
- Corrections display effective timestamps. Fill pages use stable recording
  sequence (newest first) so a corrected timestamp does not move rows between
  pages. The latest correction for each visible fill is embedded with limit 1;
  the immutable correction audit has its own pages. Blank optional correction
  time preserves backend time. Risk restatement needs its explicit checkbox.
  Failed reads of the selected event page block mutations rather than appearing
  as an empty ledger.
- `actual_journal_analytics` uses from/to/strategy/exit_version and an exact
  `p_exit_snapshot` for the three immutable configs created by this frontend.
  Closed cohort uses inclusive Jakarta exit dates; null ratios remain undefined.
  Open/draft are current positions outside the exit-date cohort; estimated fee
  counts are visible. Version-only filtering can combine different parameters;
  select an exact snapshot for a controlled comparison. Custom snapshots made
  outside the current form are not in this preset selector.
- `export_actual_journal` uses the same filters, p_status=closed, p_limit=200 and
  p_after cursor. `/journal/export` exposes each part, preserving filters. Direct
  API download rejects a >200 cohort without an explicit cursor (413).
  `after=start` opts into page one; X-Has-More/X-Next-After identify continuation.
- Owner list reads 101 trades for each 100-trade page, ordered by created_at and
  ID. Analytics summary is requested on page one only. Detail reads only the
  selected event type, at most 51 rows for a 50-row
  page, and at most one embedded correction per visible fill. Changing tabs does
  not re-request the other four event types. Offset pagination can shift when
  events are added concurrently; reload the current page after a write. No
  frontend ledger recomputation occurs.

`src/generated/actual-journal-export.mjs` is a **verbatim backend contract** from
backend `contracts/actual-journal-export.mjs`, SHA256
`aa855662a503de3fea11af6548763e0c5e47a1a89f87ce2012edc270e9a27cda`.
The API uses its ordered columns, decimal-string validation and formula escaping.
Tests pin the checksum; synchronize future changes together with declarations and
tests, rather than independently changing CSV semantics. Each part includes a
header/BOM. Decimal strings retain precision; config/tags/notes are JSON cells.
CSV is a trade summary, not a backup. Multiple pages are not one DB snapshot;
export during a quiet journal session. Display formatting may round IDR/R, while
CSV preserves backend precision.

## Local verification

```powershell
cd C:\xampp\htdocs\SahamTeknikal\frontend
npm.cmd run test:unit
npm.cmd run test:journal
npm.cmd test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Journal smoke runs Next at 127.0.0.1:3052 and a test-only Auth/PostgREST HTTP
double at 127.0.0.1:3053, with `.next-journal-smoke` output. The application has
no auth bypass/fixture override. Only the test-server environment points to this
double. No real JWT or privileged key is used; never deploy the test URL/key.

Viewport projects: desktop1440x1000, mobile iPhone13 390x664, tablet1024x768.
All use Chromium via installed Edge. This is viewport/touch emulation, not
physical iPhone/Safari certification. Earlier fixture screenshots were visually
reviewed across all three sizes; current pagination tests assert no horizontal
overflow. Test artifacts are ignored by Git. Final counts are recorded in
IMPLEMENTATION_STATUS.md; journal JSON report is test-results/journal-report.json.

Coverage includes owner/anon/outsider handling, membership/schema failures, mode
mismatch, empty/null/no-loss metrics, SOT ledger display (risk1200/net1000/R0.833333),
partial basis/null R, fee status, immutable exit details, identical retry payload
and UUID, pending forms, revision conflicts, WIB input, invalid dates/cohorts,
canonical CSV injection/precision, cursor export, session refresh, mutation-time
authorization and effective correction timestamps. The double does not execute
SQL/RLS or prove database atomicity/concurrency. Existing scanner/auth smoke is
separate at localhost:3050. UI success with fixtures is not a remote M4 release.

## Remote evidence and next gates

The earlier 404/PGRST205 anonymous probes were before backend's application of
005 and are superseded as schema-readiness evidence. Backend reports seven actual
tables and the explicit correction embedding ready on development, fixture mode.
Its hosted SQL concurrency and outsider RLS tests remain separate backend proof.

The frontend browser completed application GitHub OAuth at `localhost:3050`
and `/auth/check` verified an enabled development owner. The actual fixture
workflow created one TEST trade, four fills, finalized risk, changed current stop,
partially exited, closed, and corrected one estimated fee to actual. The live
PostgREST correction embedding displayed the amended fill with the original
time preserved. UI ledger and downloaded CSV matched the SOT example: risk1200,
fee100, net1000, R0.833333333333 (UI rounds R to three decimals). Exact fixed2r
analytics/export selected this trade; ma10 yielded an empty closed cohort. The
invalid snapshot filter showed an error, not a widened sample. Export RPC with
`p_status=closed`, `p_limit=200`, `p_after=null` returned one row and
`has_more=false`. Backend separately tested 201 closed trades in a development
transaction that ended in `ROLLBACK`: page one returned 200 and its cursor
returned the final row without duplication. That proves the backend cursor
contract, not the frontend multi-part download against persistent data.

A temporary development-only route used the same owner cookies to submit an
identical note RPC twice: one receipt and one note, with one revision increment.
It was removed after smoke. Migration 006 maps a stale expected revision to
`PT412`/HTTP 412 instead of retryable `40001`. In a fresh two-tab owner smoke,
the first tab advanced revision11 to revision12; the second tab submitted its
stale revision11 form and immediately received the specific frontend conflict
message. Revision stayed 12 and the stale note was absent from the notes view.
The affected browser case then passed 3/3 across desktop, mobile and tablet;
unit 8/8, typecheck, lint, production build and diff check also passed.
Logout hid the ledger, and unauthenticated export returned HTTP401. No outsider
or disabled-owner frontend session was used. Fixture data is not live market data.

The initial Next development server log printed one-time OAuth callback codes
as part of default incoming-request URLs. `next.config.ts` now excludes
`/auth/callback` from those development request logs; this does not alter Auth
flow or production behavior.

Next gates: verify the frontend with an outsider and disabled-owner session if
those accounts are available; test the frontend multi-part export with a
persistent >200-row cohort without treating multiple pages as one DB snapshot.
Paper persistence/ambiguity analytics, cash/equity and tested backup/restore
remain open scope.

PostgREST documents [embedded resource limits](https://docs.postgrest.org/en/latest/references/api/resource_embedding.html)
and Supabase documents [referenced-table limits](https://supabase.com/docs/reference/javascript/using-modifiers-limit).

References checked: installed Next.js16.3.6 forms/proxy docs,
[Next.js forms](https://nextjs.org/docs/app/guides/forms), and
[Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client).
Node22.23.2/npm12.0.2 and dependency versions are unchanged.
