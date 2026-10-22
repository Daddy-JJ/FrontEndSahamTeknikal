# Frontend implementation status

## Password login activated, 22 October 2026

The approved feature uses `daddyjj`, the existing owner UUID, GitHub fallback and unchanged RLS.
[PLAN](PLAN.md) owns current Action/Proof; [design/checklist](docs/LOGIN_PASSWORD_EXPLORATION.md)
owns configuration. Earlier relayout/chart receipts below remain historical, not fresh proof
of scanner feed quality or journal processing. Unrelated local documentation cleanup is retained.

### Published source and Production activation

- Feature source `9d477cc796a61dbd925ca3b10543a5e813c25760` committed/pushed; initial GitHub
  Production deployment `7246831816` SUCCESS with capability deliberately disabled.
- Activation source `a30bd797def3b3c84cb2ded2e8bdd0ab930a5eaf` redeployed from exact Git SHA
  after cloud configuration. Vercel `dpl_nA6gQwK5j7Fe3bsR5rvWzJvr2j1z` READY; alias
  https://sahamteknikal.vercel.app confirmed in deployment and current Production target.
- Existing owner UUID/email are confirmed and match the private operator mapping; one active
  owner membership. Email/GitHub providers enabled. No owner reassignment, signup, password,
  Auth user, RLS, database, journal data or backend implementation change was performed.
- Six server-only variables created as sensitive, Production-only: `APP_OWNER_USER_ID`,
  `OWNER_LOGIN_USERNAME`, `OWNER_LOGIN_EMAIL`, `APP_ORIGIN`, `AUTH_PASSWORD_RECOVERY_READY`,
  `AUTH_PASSWORD_PROTECTION`. Existing variables/targets preserved; protection flag written
  last after fresh WAF proof. No password stored in environment. Runtime configuration is
  cloud-hosted and does not require the operator laptop.
- WAF active v2: exact POST `/auth/password`, fixed window 5 requests/60 seconds/source IP,
  follow-up `rate_limit` returns429. Two independent HTTP clients: first5 requests503 while
  feature was still disabled, requests6-8 returned429; ordinary GET `/login` remained200.
  This proves the cloud rule across those requests, not a deliberately selected function-instance test.
  Initial `deny` follow-up returned403 as documented; activation was held, then only that
  action changed to429. Owned rule ID/other config preserved; failure receipt retained.
- Public live smoke at08:25UTC: 10 routes/11 assets PASS; password form and GitHub fallback
  present, stylesheet served; invalid body400. Anonymous chart/export401; callback307 with
  no-store/no-referrer. Live guards: cross-origin403, unsupported format415, oversized body413,
  disabled recovery503; no cookies, passwords or real email sent by these probes.
- Public asset scans against actual private values and full privileged-token patterns PASS.
  An initial bare `sb_secret_` literal was independently traced to Supabase SDK key-format
  recognition; no secret exposure was confirmed and no rotation was necessary.

### Local implementation proof retained

- TDD policy/core/HTTP: missing module RED->GREEN, disabled recovery update RED->GREEN;
  31 focused tests PASS; measured modules100% lines/functions,99.20% branches. Adapter/UI
  coverage is separate. Full unit111/111, typecheck, ESLint and production build PASS.
- Browser36/36 desktop/mobile Edge PASS using isolated loopback Auth, no real email or data.
  Covers owner/cookie checks, login/refresh/logout, visibility/input/duplicate submit, errors,
  PKCE, expired/reused codes, recent signed AMR, change/logout and HTML429 safe messaging.
  Selected fixture regressions7/7 PASS: reporting3, journal2, scanner2. Full unrelated browser
  financial suites were not rerun. Local fixtures do not establish hosted owner acceptance.
- Initial cold-compile/test-mock failures and callback-origin failures retained; canonical
  origin fix passed the final suite. WAF HTML429 UI case was RED before safe mapping then
  GREEN. A teardown aborted-RSC warning occurred; no monitored browser hydration/page error.
- Independent source security/React/a11y and cloud operator reviews: no HIGH/CRITICAL.
  No app code changed after the final local test/build run; cloud activation used that source.

### Remaining acceptance and rollback

- Owner privately logs in afresh via GitHub, opens Akun `/auth/check`, sets password within
  10minutes, then logs in as `daddyjj`. Real owner setup/login/data reads, real outsider JWT,
  immutable-host comparison and later-session stability remain NOT VERIFIED.
- Recovery remains disabled; SMTP delivery, recovery PKCE and advanced native Auth rate/
  password reauthentication settings remain NOT VERIFIED. Management Auth config GET403;
  public signup remains enabled as before. Direct Supabase Auth bypasses Vercel WAF;
  app AMR/WAF does not replace native provider policy or data RLS.
- On activation failure, disable the protection flag/password capability and redeploy while
  keeping GitHub fallback, or restore the previously verified source `513870f` / GitHub
  Production deployment `7092738529`. Never delete/reassign the owner or rerun journal reset.
- Private ignored receipts: `test-results/password-release/` (WAF, environment metadata,
  deployment, public smoke, guards, Auth audit); test suites in `test-results/`. Private
  identity/credentials and raw runtime payloads are deliberately absent from published docs.

## Historical released baseline (as recorded 15 October)


| Item | Recorded evidence |
| --- | --- |
| Frontend application | Chart-integrated source `9164d00a24ec3a69b08b2c33b1e12b21351803db` |
| Released frontend SHA | `92705f9e47c4bedb6872e350ea4093a6fd472761`, docs-only followups above the application source |
| Vercel Production | Deployment `7085991505`, SUCCESS; alias `https://sahamteknikal.vercel.app` |
| Backend capability | Supabase migrations 001-016 recorded applied; full chart cloud run `38695021871` SUCCESS |
| Chart artifacts | 100/100 latest tickers; 288 immutable artifacts, current/complete through 14 October at verification |
| Public smoke | 8 routes / 14 assets PASS; anonymous chart/export denied, strict failure envelope and no-store verified |

These are dated release facts, not a fresh statement about today's remote HEAD, feed or processing checkpoint.
Application chart is accessible from Scanner detail tabs, journal/Analytics links and `/chart/[ticker]`.
Cloud scheduler/watchdog/chart jobs use cloud secrets; the operator laptop is not a runtime dependency.

## Recorded verification

- Frontend: 77 unit checks, typecheck, lint and build PASS. Dedicated browser evidence: journal 69; Scanner 81 plus 3 followups; reporting 64 plus 2; Workspace 27 PASS / 3 explicitly unconfigured SKIP; chart 24 plus 6 grouped failure cases.
- Performance: local synthetic production LCP 624 to 572 ms; 500-slot chart render 373.8 ms and payload 240833 bytes. Closed chart loads no price request/heavy chart library. These are local observations, not a hosted SLA.
- Hosted chart SQL-owner payloads passed the actual frontend parser across 15 latest/signal/paper contexts and one existing actual context. SQL-role evidence is distinct from a genuine owner browser or outsider JWT.
- Runtime audit 0 was recorded. The owner-approved temporary dev-only braces advisory exception remains unresolved; it is not a patched dependency.

Full scope, failures/retests and limitations: [chart evidence](../docs/CHART_V1_LOCAL_VERIFICATION.md). Do not rerun completed release work merely because an archived document says pending.

## Open evidence boundaries

- Authenticated owner-browser on the exact latest Production release and genuine outsider JWT remain NOT VERIFIED. Disabled-owner and independent-session lifecycle/concurrency proofs retain their historical limitations; SQL-role tests do not replace them.
- Hosted browser export of a persistent cohort exceeding 200 rows remains NOT VERIFIED by this cleanup. Preserve the canonical cursor/CSV contract.
- Immutable Vercel deployment URL requires Vercel login; immutable-to-alias asset-byte comparison is NOT VERIFIED. Exact-SHA deployment metadata and alias HTTP checks were verified separately.
- Fresh full backup and populated restore rehearsal for the 15 October chart release are **SKIPPED_OWNER_WAIVER**. Existing failed dumps are invalid backups. No full recovery capability is established; this exception applies only to that release.
- Future-session feed/job stability and representative authenticated navigation latency require ongoing observation. Historical anonymous probes do not prove a database bottleneck.
- Older requested capabilities such as versioned settings or cash/equity are not automatically complete because chart shipped. Verify the current contract/source before opening implementation or claiming closure.

## Documentation routing

[README](README.md) is the stable setup guide. [PLAN](PLAN.md) owns active steps; this document owns baseline and remaining evidence. Historical audits remain accessible through their original-path stubs and the [archive index](docs/archive/README.md). They are optional, dated evidence and never grant production authorization.

No application code, API, financial rule, environment or deployment changed during documentation cleanup. SOT synchronization only copies the already approved root dividend clarification.
