# Vercel production deployment checklist

## Live production smoke verified on Vercel domain - 2026-10-03 (Asia/Jakarta)

End-to-end production verification completed and PASSED on https://sahamteknikal.vercel.app:
- Auth: GitHub OAuth callback and owner verification at /auth/check PASS (UID 3e877216-b881-41c0-8e16-f7bd7a3f596d, Owner aktif).
- Scanner: Live forward run 3c700de4-8389-400e-b862-31f2c8998a64, digest 653f9f9168b20dabfc14dc9fa18090e6ed48f5d63546c897107cc44258dd4110, stored 2026-10-03 19:44:34 WIB, partial coverage 45/100, RS rank held, and hold reasons displayed per ticker PASS.
- Journal & Analytics: Trade NCKL closed at revision 5 (PULLBACK RECLAIM V1, Net Rp1.244, 0.19R, 100% win rate) PASS.
- CSV Export: Downloaded and parsed in Excel with exact decimals, neutral formulas, and contract version actual-journal-export-v1 PASS.
- Status: PRODUCTION APPLICATION LIVE AND VERIFIED. Evidence: docs/evidence/vercel-production-smoke-final-20261003.json.

## Nonempty real-trade owner read / analytics / CSV - 2026-10-03

Read-only existing owner session now verified the user-supplied NCKL closed
trade e6dcfcc6-fd57-4e1d-9148-ecd5a738edc4 at revision5. Analytics exact MA10
snapshot and closed export both show1 trade, with selected snapshot retained
through /api/export/journal?exit_snapshot=ma10&after=start. CSV downloaded and
parsed: the provided trade/revision, actual-journal-export-v1, live/closed,
actual-ma10-v1, risk6500.0000, P&L1244.0000, R0.191384615385 and fees256.0000
match the rendered ledger/analytics values. These are backend-supplied figures,
not recomputed finance metrics. Fee quality remains includes_estimates.
Final export page has no continuation; >200 production cursor is NOT VERIFIED.
Earlier empty-ledger and no-CSV-download observations remain historical.

User's outsider and independent-session/concurrency skips remain SKIPPED /
NOT VERIFIED, never assumed PASS; disabled-owner remains untested. No lifecycle,
replay, conflict or fee-status mutation was sent. No new scanner/migration probe,
backend edit, production write, commit/push or Vercel deployment. RPC HTTP status
was not separately captured. No broker document or deployed Vercel proof.
Evidence: docs/evidence/real-trade-owner-read-export-20261003.json.
Current backend continuation prompt: docs/BACKEND_CONTINUATION_REAL_TRADE_20261003.md.


## User-provided real trade and skipped gates - 2026-10-03

Latest user supplies actual production trade e6dcfcc6-fd57-4e1d-9148-ecd5a738edc4 and requests skipping
point3 (outsider session checks) and point4 (independent sessions/concurrency),
asking to assume PASS. Record these as SKIPPED at user request / NOT VERIFIED;
never convert unexecuted checks to PASS. Backend release decision must disclose
these skipped proofs. Existing permissions, RLS policies and app_members are
unchanged; no disabled-owner or two-session denial/concurrency proof was added.

Read-only inspection of the user-provided localhost journal page observed:
NCKL closed, revision5, actual-ma10-v1, data live, buy/sell fills, a corrected buy
and estimated fee status. User confirms it is a genuine production transaction.
This is available input for backend ledger/receipt inspection, not certification
of broker values, complete lifecycle execution, replay or stale conflict.
No journal mutation, request replay, correction or Auth/member change was sent.
Older empty-ledger observations remain historical; do not rerun unchanged scanner
owner smoke or migration001-007 because this trade now exists.

Point1 approves publisher preparation; controlled production publication still
needs the concrete reviewed plan/execution authorization. Scheduler remains off.
No frontend commit/push/deploy authorization follows. Current full-stack NO-GO
remains pending publisher, remaining evidence/release disposition and Vercel
smoke. Do not claim full-stack PASS from the skipped tests or this trade URL.
Evidence: docs/evidence/real-trade-and-skipped-gates-20261003.json.


Recovery handoff2026-10-03, Asia/Jakarta; owner read observation recorded in UTC.

Latest frontend owner read smoke PASS within scope: partial45/100,25 action
holds,30 quality holds,zero signals,RS incomplete; scanner GET HTTP200.
Partial quality pagination, storage-time/freshness warning and responsive layout
passed on localhost with production Supabase. Journal/analytics/export are empty;
production CSV content/cursor>200 and lifecycle are unproven. Details:
`docs/evidence/scanner-owner-production-20261003.json`.

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

Historical update2026-10-02, Asia/Jakarta. Production migrations001–007 and privileged
schema/FK GETs are now reported passed by backend. This frontend independently
completed a local production-configured owner read smoke and anonymous denial
checks. Production mutation, outsider/disabled-owner, scanner-live, and Vercel
smoke remain incomplete, so frontend deployment is currently **NO-GO**. The
latest user instruction is preparation only and supersedes earlier deployment
action wording. No commit, push, backend edit, production QA ledger write or
deployment is authorized in this continuation. Deployment needs separate user
authorization after mandatory backend gates close.

Backend sanitized disposable evidence dated2026-10-02 now passes real Auth/HTTP
owner isolation, outsider/disabled-owner denial, actual lifecycle/canonical
ledger, replay/conflict/PT412, corrections/explicit FK, independent sessions,
analytics `p_exit_snapshot`, and201-row export as200+1. Scanner-action007 also
passes real Auth/HTTP two-session checks there. These are **local fixture**
proofs, not hosted production lifecycle or Vercel smoke. Evidence sources:
`backend/docs/SCANNER_LIVE_READINESS.md` and
`backend/docs/evidence/{disposable-auth-smoke,disposable-followup,
disposable-signal,live-provider-5-ticker,scanner-readiness}-20261002.json`.

Latest backend evidence read from `backend/docs/PRODUCTION_READINESS.md`,
`backend/IMPLEMENTATION_STATUS.md`, and `backend/docs/ACTUAL_JOURNAL.md`:
the guarded production ACL reduction for `reject_immutable_mutation()` was
applied at `2026-10-02T05:16:25.481422Z`, and all 10 clean-001 catalog
fingerprints matched afterward. Source-count reconciliation, logical restore,
and a local non-superuser release rehearsal for migrations002–007 are reported
passed. Those steps do not mean migrations002–007 or migration history are
present in production. The latest backend status reports production history
and migrations001–007 applied and privileged schema/FK GETs successful. It does
not report full owner-JWT/RLS, mutation/idempotency/concurrency, or scanner-live
smoke. Frontend's 2026-10-02 local production-configured read smoke verified an
existing enabled owner, empty journal/analytics/export, and anonymous denials;
details and limitations are recorded in `IMPLEMENTATION_STATUS.md`. These
remaining backend gates must pass before Vercel production smoke can establish
full-stack readiness.

## Candidate origin and repository

- Candidate canonical origin: `https://sahamteknikal.vercel.app`.
- Read-only HTTP checks on 2026-10-01 returned 200 for `/` and `/login`, with
  Vercel and HSTS headers. This proves the existing shell is reachable, not that
  production Supabase, Auth, scanner data, journal migrations, or RLS are ready.
- Git repository: `https://github.com/Daddy-JJ/FrontEndSahamTeknikal.git`.
- Vercel Root Directory: `.`. There is no `apps/web` directory and no local
  `.vercel/project.json` link in this checkout.
- Framework: Next.js 16.3.6. Install with `npm ci`; build with `npm run build`;
  use the default `.next` output. `package.json` pins Node 22.23.2 and npm 12.0.2.

If a custom domain will replace the candidate origin, review the final HTTPS
origin before any Auth setting or deployment. Use one origin consistently in
Vercel, Supabase Site URL, allowed redirect URLs, and the smoke evidence.

## Vercel environment matrix

Set these variables in Vercel's **Production** environment:

| Name | Required value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hcjfxbynqzsaidlwvdfx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Production public/publishable key, entered directly in Vercel |
| `DATA_MODE` | `live` |
| `ALLOW_FIXTURE_PREVIEW` | Unset, or `false`; never `true` |

For **Preview**, set the same variable names with the development values and
fixture mode:

| Name | Preview value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vgmkpsestahkfahzdtae.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Development public/publishable key, entered directly in Vercel |
| `DATA_MODE` | `fixture` |
| `ALLOW_FIXTURE_PREVIEW` | `true` |

Preview results must remain visibly labeled fixture and cannot be release
evidence. Keep Production and Preview scopes separate; do not add secrets to
either frontend scope.

Never add `SUPABASE_SECRET_KEY`, service-role keys, provider tokens, GitHub OAuth
Client Secret, database passwords, or operator credentials to the frontend or
Vercel environment. `APP_BASE_URL` is not consumed by this implementation.

The tracked `.env.production.example` contains names and safe public metadata
only. It intentionally leaves the publishable key empty. Do not copy a real key
into a committed file or chat.

## Auth settings after backend GO

Configure these only after the backend production migration, schema, and
owner-JWT/RLS/HTTP smoke gates are cleared and the final origin is approved.
The earlier local production owner smoke completed GitHub login and callback.
The previously observed disabled-provider status is historical. The final
Vercel HTTPS redirect configuration and deployed callback/logout remain untested.

- Supabase Site URL: `https://sahamteknikal.vercel.app`.
- Supabase allowed redirect: `https://sahamteknikal.vercel.app/auth/callback`.
- GitHub OAuth application callback:
  `https://hcjfxbynqzsaidlwvdfx.supabase.co/auth/v1/callback`.
- GitHub provider Client ID/Secret stay in GitHub/Supabase dashboards.
- The authenticated production UUID must already match an enabled `app_members`
  owner. Never grant owner membership automatically to a new OAuth user.

The application derives `redirectTo` from `window.location.origin`, so no
frontend base-URL variable is needed. `/auth/callback` exchanges the PKCE code,
uses no-store/no-referrer responses, and incoming callback URLs are excluded
from Next development request logging.

Before any local development owner probe, verify the local Supabase URL and
publishable key both belong to `vgmkpsestahkfahzdtae`, with fixture mode enabled.
On 2026-10-01 a value-free check confirmed that `.env.local` points to the
development project with fixture mode enabled. `/auth/check` showed a real
development owner session. The existing scanner probe record already has its
fixed watchlist action, so its guarded button is hidden; this is not a fresh
owner-JWT/PostgREST replay test. No environment value belongs in this checklist,
terminal output or chat.

## Required order

1. Backend has reported history repair, application of migrations001–007, and
   privileged schema/FK GET postflight. Preserve the exact CLI evidence and
   verify all required RPC signatures, policies and grants; privileged GETs do
   not prove RLS.
2. Complete remaining production owner-JWT/PostgREST/RLS evidence, including
   outsider and disabled-owner denial. The frontend has verified owner reads,
   empty journal/analytics/export, and anon denial only. Production journal
   mutation/idempotency/concurrency has not been tested; do not add permanent
   test trades. Use a safe authorized isolation method or leave those gates
   explicitly open.
3. Retain runner fetch/evaluation PASS from37114744856/b4762fd and accepted
   owner-read PASS for the unchanged production partial45/25/30 snapshot.
   Runner publication was not attempted; controlled hosted publisher remains
   BLOCKED. Hosted anonymous14denials PASS is distinct from authenticated RLS.
   Keep incompleteRS held, scheduler off and full-stack NO-GO until mandatory
   publisher/authenticated mutation gates close. Do not reopen001-007, rerun
   unchanged owner smoke or attach runner timestamps/digest to production.
4. Approve the final HTTPS origin, then configure production Auth URLs/provider.
   Candidate values are Site URL `https://sahamteknikal.vercel.app`, app redirect
   `https://sahamteknikal.vercel.app/auth/callback`, and GitHub provider callback
   `https://hcjfxbynqzsaidlwvdfx.supabase.co/auth/v1/callback`. Confirm the
   signed-in UUID matches an enabled `app_members` owner.
5. Add only the four public/mode variables above to their Vercel environments.
6. Finish the gates above and review the exact release diff, then obtain separate
   user authorization for frontend deployment. Only after authorization deploy
   the reviewed release and record commit SHA, Vercel
   deployment ID, deployment URL, UTC time, Node/npm versions, and environment
   names. Do not record secret values.
7. Keep scanner scheduling disabled until the backend live scanner gates pass.

## Production smoke after authorized deployment

### Scanner UI acceptance before release

The live homepage now uses the owner/RLS scanner read adapter and shows preparation
when no forward run exists. Its21/21 local HTTP-double cases pass, but nonempty
hosted output is still untested. Verify these conditions on real published output
without computing a second rule engine:

- Preparing, empty/unpublished, stale, missing, partial and provider failure
  remain distinct. Show no-signal only for a completed, evaluated backend result.
- Display target session, last successful session, freshness, and actual
  eligible/total coverage from backend; never silently shrink the denominator.
- Preserve per-ticker quality, missing-bar and unreconciled corporate-action
  skip/hold reasons. Skips accepted by the user must be visible, not replaced
  with fixture bars or hidden as a successful complete run.
- Preserve a global RS hold when the cross-section is incomplete. Render other
  strategies only as backend-eligible results; do not rank the partial universe
  or recalculate signals/ledger/risk/fees/R/analytics in the browser.

### Deployed owner and access smoke

- `/` and `/login` return 200 over HTTPS and never show fixture data as live.
- GitHub login, `/auth/callback`, `/auth/check`, refresh, and logout work on the
  approved origin; OAuth codes do not appear in application logs.
- Anonymous, outsider, and disabled-owner sessions cannot read or mutate owner
  journal data. Owner access is RLS-backed.
- Journal empty/error states are distinct from no signal. Ledger figures come
  from backend RPC/table projections; the browser does not rebuild P&L or R.
- Using a genuine owner-approved production trade or separately approved
  isolation method, verify create/fill/finalize/partial exit/correction, exact
  replay, changed-payload conflict, and two-tab stale `PT412`. Do not import or
  later delete development TEST trades from the immutable production ledger.
- Analytics and export reuse the same exit snapshot and closed cohort. Export
  sends `p_status=closed`, `p_limit=200`, and each `p_after=next_after` until
  `has_more=false`; check every CSV part, row boundary and preserved filter,
  and run it during a quiet journal period. Local HTTP-double coverage exercises
  the two-part UI/API path; hosted browser HTTP with persistent >200 rows remains
  unverified.
- Verify no-data, stale, missing, partial coverage, and provider error are not
  presented as no signal. Scanner live evidence remains a backend gate.
- Run desktop, tablet, and mobile smoke. Inspect the served bundle and logs for
  service-role/provider/OAuth secrets and callback codes.

## Rollback and evidence

If the frontend deploy fails while backend remains healthy, promote the last
known-good Vercel deployment using Vercel's deployment rollback/promote action.
Verify login, callback and the production smoke on the restored deployment.
Keep journal mutation links unavailable until the frontend/backend version
mismatch is understood. This rollback restores frontend code only; database
migrations or immutable ledger rows are not rolled back or deleted by it.

Update `IMPLEMENTATION_STATUS.md` only with observed production facts: final
origin, commit/deployment identity, migration history, owner/denial outcomes,
scanner data status, CSV cursor result, responsive coverage, and any open gate.
HTTP 200, a successful build, or configured environment names alone do not prove
the full stack is live.
