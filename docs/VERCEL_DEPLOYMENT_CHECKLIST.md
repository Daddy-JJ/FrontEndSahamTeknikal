# Vercel production deployment checklist

Reusable procedure, not a release receipt or authorization. Read [current status](../IMPLEMENTATION_STATUS.md) and [active plan](../PLAN.md) first. Previous checklists and dated receipts are preserved in the [historical snapshot](archive/VERCEL_DEPLOYMENT_CHECKLIST_BEFORE_DOC_CLEANUP_20261015.md).

## Prepare the reviewed candidate

- Confirm task-local release authorization and the exact frontend diff; preserve unrelated work. Keep backend changes in its own repository.
- Verify required RPC/schema capability before publishing a dependent frontend. Follow current backend rollout gates; do not rerun old migrations or recovery scripts from archived prompts.
- Run relevant unit/dedicated browser suites, typecheck, lint and production build. Fixtures/local SQL roles/public HTTP have distinct proof scopes.
- Record candidate SHA, compatible backend contract version, previous verified frontend deployment and a workable rollback method. Check actual Vercel authentication before relying on instant CLI rollback.

## Environment and authentication

Vercel frontend root directory is `.`. Use values from the matching project; record variable names only.

| Variable | Production | Development/fixture Preview |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase URL | Matching development URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Matching public key | Matching development public key |
| `DATA_MODE` | `live` | `fixture` |
| `ALLOW_FIXTURE_PREVIEW` | Unset or `false` | `true` only for explicit labelled preview |

Do not put service-role, DB, provider, OAuth client-secret or dispatch credentials in this frontend. Public build-configuration changes require a fresh build. Preview must not impersonate production.

For the approved Production origin `https://sahamteknikal.vercel.app`, verify Supabase Site URL and exact redirect `/auth/callback`. The GitHub OAuth provider callback goes to the matching Supabase project's `/auth/v1/callback`. Use the Preview/local origin only in the development project's allowlist.
Verify the application's Auth identity has an enabled owner membership and matching `DATA_MODE`; never silently promote a new login.

## Deploy and verify

- After authorized commit/push/deploy, record the exact SHA, deployment ID, target/origin, UTC time and result. A successful push or build is not a served-release proof.
- Verify HTTPS public routes/assets, login boundary and denied anonymous chart/export access. Check chart failure envelope and private/no-store handling.
- Owner browser: login/callback/auth-check, refresh/back/logout; Scanner date/strategy/quality/pagination and all detail tabs; paper/actual journal detail, all Analytics tabs, chart controls, filters and export. Check desktop/tablet/mobile, keyboard/focus/Escape and no hydration errors.
- Keep missing, stale, partial, failed and no-signal states distinct. Preserve incomplete cross-section RS holds, source provenance and actual denominators. No fixture fallback or browser financial recomputation.
- Match Analytics and export to the same actual closed cohort/exit snapshot. Export follows `p_limit=200`, `p_after=next_after` until `has_more=false`; persistent multi-part browser proof must be labelled separately from local doubles.
- Mutations/lifecycle/replay/conflict testing requires specifically authorized genuine activity or an approved isolation method. Do not create permanent QA production trades. Keep owner, anonymous, outsider and disabled-owner results separate.
- Inspect served bundles and logs for privileged secrets and OAuth codes. Do not copy private payloads/credentials into documentation.

If owner browser, genuine JWT or protected immutable URL is unavailable, report NOT VERIFIED for that scope. Do not infer it from public HTTP, screenshots of another page or SQL-role claims.

## Failure, rollback and reporting

If release smoke fails, use the recorded compatible verified deployment through an authenticated rollback/promote operation. If that operation is unavailable, use the authorized reviewed source-revert/push method and verify its resulting deployment. Do not invent a rollback ID or claim an unauthenticated CLI can perform rollback.
Frontend rollback restores frontend behavior only. Do not drop additive schema, delete immutable ledger rows or reverse economic events as part of a visual rollback. Chart feature rollback can disable its cloud job while retaining schema/artifacts through the authorized backend procedure.

Update [status](../IMPLEMENTATION_STATUS.md) with observed evidence and explicit PASS / PARTIAL / SKIPPED / NOT VERIFIED outcomes. Keep release history in the archive or existing dated verification report; keep this checklist reusable.
The 15 October chart full-backup/restore waiver was scoped to that release and does not silently waive gates for future releases.
