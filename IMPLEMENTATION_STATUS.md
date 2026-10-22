# Frontend implementation status

## Active owner password release, 22 October 2026

The owner approved implementation, cloud configuration and commit/push/deploy. [PLAN](PLAN.md) owns the release steps; [activation checklist](docs/LOGIN_PASSWORD_EXPLORATION.md) owns environment and rollback requirements.

Before this release, a fresh GitHub deployment read confirmed Production 7092738529 / frontend main@513870f success. Earlier receipts below remain historical; they are not new verification of the password release.

### Local password feature and current release evidence


- Source: frontend main@513870f plus uncommitted implementation; pre-existing Markdown retained.
- Implemented: server alias mapping, same-owner checks, buffered SSR cookies, bounded JSON POST
  and Origin validation, recent signed AMR, login/change/recovery UI, safe errors and logout.
  Recovery readiness gates request and direct update. No backend/schema/dependency/financial change.
- TDD: missing HTTP module RED then GREEN; disabled direct recovery update RED (200 vs 503) then GREEN.
 31 focused tests PASS; policy/core/HTTP 100% lines/functions and 99.20% branches. Adapter/UI
 coverage is separate browser integration evidence, not part of that unit percentage.
- Full unit 111/111 PASS; typecheck PASS; final post-review production build PASS; full ESLint PASS after
  excluding only the new generated smoke build directory (same policy as other suites).
- Browser integration 36/36 PASS: 14 password + 4 existing OAuth cases on each desktop/mobile Edge.
  Covers same-owner login/refresh/logout, visibility/keyboard/touch/overflow, duplicate submit,
  safe errors, no-cookie owner denial, origin/body/redirect checks, expiry refresh,
  same-origin PKCE challenge/verifier matching, expired/reused codes, AMR and password-change/logout.
  HTML 429 from the firewall receives a fixed safe message without rendering its body.
  Test-only loopback Auth; no real email or production data written. Ports 3058/3061 closed and
  generated next-env/tsconfig restored by teardown. Parent visually checked both login screenshots.
  Selected desktop regressions PASS: reporting 3/3 (paper money/filter, actual CSV/detail,
  denied reporting); journal 2/2 (anonymous/non-owner denial, refreshed-session reauthorization);
  scanner 2/2 (outsider denial, partial coverage/RS hold). These are local HTTP fixtures.
  Full financial/browser suites were not rerun; these selected regressions cover affected boundaries.
- Independent source security/React/a11y review: no CRITICAL/HIGH. Nonblocking findings addressed:
  native POST/no-JS guidance and cleared/locked fields with an Account link after saved-but-logout-failed.
- Retained browser failures: first cold compile setup timeout, cold POST compile deadline,
  initial full run 24 PASS/10 FAIL (8 fake-header/selector failures; 2 real callback origin failures).
  Fixed fake API-version header/selectors; callback now uses validated APP_ORIGIN when password
  configuration is enabled, preserving cookies behind a host-rewriting proxy. Full 34/34 then PASS.
  Additional WAF HTML 429 test reproduced RED before the safe UI mapping; fresh full 36/36 PASS.
  Initial receipt `test-results/password-initial-report.json`; WAF RED `password-waf-red-report.json`;
  final `password-report.json`. Last fixture immutability cleanup received a focused PKCE check
  and was included in the final full 36-case run. No failure receipt is relabelled as PASS.
  A local Next dev aborted-RSC stream warning occurred on test context teardown; no browser
  page/hydration error was observed. Do not report server logs as universally error-free.
- Read-only owner preflight 21 October: same active confirmed nonanonymous owner; email/GitHub and
  password already present. No password set by operator. Management Auth config GET 403.
- Cloud WAF, server mapping, native Auth settings, recovery SMTP/PKCE and real owner/outsider
  acceptance are NOT VERIFIED. Capability defaults disabled; GitHub remains available.
  Owner authorized WAF/environment configuration and commit/push/deploy on 22 October.
  Publication is in progress; production activation and owner acceptance are still pending.
  Fresh read-only Supabase audit: existing owner UUID/email match and are confirmed;
  email/GitHub providers enabled. Public signup remains enabled as before; RLS is unchanged.
  Management Auth configuration still returns 403. No Auth user/password or journal was changed.


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
