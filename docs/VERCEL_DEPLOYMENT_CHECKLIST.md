# Vercel production deployment checklist

Updated 2026-10-02, Asia/Jakarta. Production migrations001–007 and privileged
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
3. Complete scanner live readiness and smoke for provider/input freshness,
   coverage, runner and output. Five Yahoo ticker probes passed connectivity and
   identity only. The verified100-member workbook is available; no replacement
   workbook is needed. Runtime calendar/historical session rules, remaining95
   ticker mappings/full universe and actual GitHub runner execution are blocked.
   The homepage currently states scanning is being prepared. Keep scheduling
   disabled until that gate passes. The frontend read adapter is now implemented
   against immutable run/item/signal tables; verify it on real published output
   before claiming hosted scanner UI ready. See SCANNER_ADAPTER_AUDIT.md.
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
