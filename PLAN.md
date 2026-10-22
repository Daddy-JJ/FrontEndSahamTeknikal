# Password login - released, 22 October 2026

Owner approved implementation, cloud configuration and commit/push/deploy; username `daddyjj`.
Keep the existing Supabase owner UUID, GitHub fallback and RLS. Pre-existing Markdown cleanup
remains separate. Never rerun the completed journal reset/backfill for this task.

| Stage | Action | Proof / state |
| --- | --- | --- |
| A1 | Verify existing owner, alias and cloud protection | Fresh 22 October read-only owner/email/membership checks PASS; same UUID. Native Auth advanced config GET 403 remains NOT VERIFIED |
| A2 | TDD policy/core, SSR adapter and owner setup/login | Complete: 31 focused and 111 full unit PASS; focused modules 100% lines/functions, 99.20% branches. Browser proof is separate |
| A3 | Protected recovery, safe errors and cloud attempt limit | Complete with recovery disabled. Active Vercel WAF v2: exact POST `/auth/password`, 5/60 seconds/source IP; requests 6-8 returned 429 across two clients; GET login 200. No in-memory limiter |
| A4 | Review, checks, publish, configure Production and verify live | Source `9d477cc` published. Activation SHA `a30bd79`, Vercel `dpl_nA6gQwK5j7Fe3bsR5rvWzJvr2j1z` READY, Production alias verified. 10 routes/11 assets and four live guards PASS. Prior local 36 browser + 7 selected regressions, typecheck/lint/build PASS; independent security review no HIGH/CRITICAL |

Production password form and server-only mapping are active. No backend/schema/dependency,
financial data, Auth user or password was changed. Owner sets their own password via Akun
after fresh GitHub login, then signs in using `daddyjj`; never send the password to an agent.

[Status](IMPLEMENTATION_STATUS.md) owns the release receipt and limits;
[design/checklist](docs/LOGIN_PASSWORD_EXPLORATION.md) owns architecture and configuration.
Remaining owner acceptance: real password setup/login, authenticated data reads and genuine
outsider JWT denial are NOT VERIFIED. Recovery stays off until delivery/PKCE is proven;
native Supabase advanced limits/reauth settings are NOT VERIFIED (management GET 403).
These gaps do not authorize operator-created passwords, real email or new Auth users.
New configuration resides in Vercel Production; the laptop is not required at runtime.

Previous completed Scanner relayout plan: [historical snapshot](docs/archive/PLAN_SCANNER_RELAYOUT_BEFORE_DOC_CLEANUP_20261021.md).
