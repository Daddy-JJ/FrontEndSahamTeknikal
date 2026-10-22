# Frontend implementation status

## A-D release verified, 22 October 2026

- Owner requested QA only where missing, then commit/push/Production deployment. Independent
  receipt/current-source/security audit PASS, no HIGH/CRITICAL; no completed suite rerun.
  All current A-D source files predate the final passing build. Existing limitations below
  remain unchanged. No backend/database/auth configuration or trading-data operation required.
- Scope: A-D frontend source/tests/configs, focused plan/archive and related status sections.
  Unrelated documentation cleanup and backend files remain outside this publication.
- Baseline main/origin main: dcd847e. Current verified Production target before publication:
  dpl_J7yBpgrpxxdFURkEfuumhsjd6AyQ, READY, same Git SHA; this is the rollback target.
- Feature commit c2a0eaaac46db581c53c6b06bc6fb2cdec77eacc pushed to origin/main. Vercel Git
  Production deployment dpl_73eqrwqq7votyMLiWeiRCYoFDQQN READY with this exact SHA and alias
  `https://sahamteknikal.vercel.app`. Rollback was not needed. This receipt follow-up changes
  documentation only; reviewed application/test/config bytes remain identical to feature source.
- Public smoke22October14:34UTC:10 routes,17 assets,3 guards PASS; new reporting stylesheet
  marker served, asset privileged-token pattern scan PASS. Anonymous chart/export401 with
  no-store; missing-code callback307. No password, email, QA trades or database writes used.
- No connected owner browser is available; hosted owner interactions and genuine outsider-JWT
  proof remain NOT VERIFIED. Public/fixture results are not owner acceptance or ongoing feed proof.
  Private ignored receipts: `test-results/ui-release-{manifest,candidate,public-smoke}.json`.
  Unrelated frontend Markdown cleanup and all backend changes remain uncommitted separately.

## Reporting chart overlay D, 22 October 2026 - local proof before release

- Owner authorized D after A/B/C. Paper journal and Analytics paper/actual/signal row links
  now open one native dialog via thin client links and one context host. Existing server
  children, RPCs, filters, financial values and canonical hrefs remain server-owned/unchanged.
  No new ledger entry point, backend/schema/API/dependency/trading change or cloud operation.
- ChartPanel mounts only after open; existing request/abort/generation/timer/renderer cleanup
  and validated context/indicator choices are reused. Route/cohort/owner/mode changes reset
  the host; an existing Auth client subscription closes on signout/account change. Native
  modal/Escape/focus trap, 44px close, responsive header, one body scroll and original body
  styles/page/table positions are restored. Fullpage records pre-open coordinates; generic
  return capture ignores overlay triggers and overlay-owned navigation.
- RED: original click navigated fullpage. Initial fixture used inconsistent signal/source
  cutoffs, correctly rejected by unchanged parser; corrected fixture now validates itself.
  First integration7 PASS/1 FAIL exposed an early-click hydration race in global effect
  delegation. Replanned to synchronous context-backed Link handlers before Next navigation;
  narrow reproduction PASS. Keep these failure receipts; do not relabel them as passing.
- Current reviewed source: overlay + fullpage-return desktop/mobile24/24 PASS. Includes
  lazy/exact paper/actual/signal contexts, dedupe, close/focus/scroll/backdrop, view/indicators,
  refresh/history cleanup, late A response after B, auth channel signout/account switch,
  429 cooldown/403/401 data clearing, disabled storage, long20-character ticker at320px,
  narrow/short viewports. Unit111/111 PASS. Independent React/a11y/security-boundary review
  has no HIGH/CRITICAL; long-title wrap and dialog announcement recommendations fixed.
- Affected reporting/layout/CSV/inline-chart run:35 PASS/2 SKIPPED/1 FAIL. The failure was the
  added initial-JS-off scenario, not ordinary overlay behavior; keep the receipt. Control on
  unchanged `/journal/paper/paper-test-v1` (no overlay provider) confirms final facts attached
  but hidden while global loading remains visible. Existing initial App Router streaming
  without JS is unsupported locally; whole-app JS-off capability is NOT a PASS or a D fix.
- Rendered canonical anchor with JS execution then disabled: PASS. Final fallback/keyboard/
  read-count rechecks5 PASS/1 desktop-only-flow SKIP; dedicated native-fallback/control1 PASS.
  Ctrl-click/new-tab PASS in the affected run. Original fullpage return proof retained and
  extended to opening the modal OHLC disclosure before navigation. No extra reporting reads,
  no return record on mere modal open, no page/hydration errors in the final opening checks.
- Final opening/timing2/2 PASS. One local synthetic measurement: desktop622ms/mobile471ms
  click-to-visible canvas, not a Production SLA. Desktop/mobile screenshots inspected.
  Unit111/111, full ESLint + final test lint, final typecheck and local production build PASS.
  Native browser-toolbar zoom and hosted owner acceptance remain NOT VERIFIED. Local loopback
  fixtures are not live backend integration. No new coverage percentage claimed for JSX/CSS.
- Changed D files: `src/components/chart-overlay.tsx` and `.module.css` (new), ChartPanel,
  ChartReturnPosition, JournalShell, row link factories and owner scope in the two list pages;
  new overlay browser tests/config plus preserved fullpage tests. No lib/API/dependency changes.
- Private ignored receipts: `test-results/chart-overlay-*`. Frontend main@dcd847e plus local
  A/B/C/D edits and unrelated retained Markdown cleanup at local completion. Publication was
  subsequently authorized and completed as recorded above; this section preserves local proof.

## Scanner strategy guide C, 22 October 2026 - complete locally, not released

- Owner authorized C only after A/B: four static baseline V1 cards under published Scanner
  signals with entry, initial SL and Fixed2R/SMA10 exits. Source: SOT7/8/8A/8B/9; canonical
  per-run snapshot remains authoritative. No backend/API/data/auth/trading-rule change.
- Server-rendered guide passes through a ReactNode slot; no new client effects, indicators,
  requests or dependencies. Guide follows the workspace in normal flow. Only no-detail
  signals tables lose the desktop340px minimum; quality/split geometry is preserved.
- RED reproduced absent guide. Initial dedicated browser6/6 PASS using isolated loopback
  doubles (desktop/mobile): four cards, 4/2/1 columns at1440/1024/390/320, native disclosure
  keyboard/44px target, compact one-row table, failed/partial/empty/filter/preparing states,
  guide outside the split workspace, one bounded signals read and no additional reads/mutations.
- Full Scanner/chart desktop/mobile regressions:68 PASS/6 SKIPPED, exit0. Skips are the existing
  device-specific geometry cases (mobile frame on desktop; desktop split/expand/scroll/zoom
  cases on mobile), not passed cases. Includes chart lazy loading/identity/canvas/return,
  stable50:50 panes, quality scroll, filters/refresh/back, auth/contract/error/hold and linked drafts.
- Independent source/React/a11y/security-boundary review: no HIGH/CRITICAL. One copy finding
  resolved: each card explicitly labels Fixed2R/SMA10 as two separate experiments. Current-model
  ambiguous results are explicitly excluded from main stats, with separate sensitivities.
  Final dedicated browser6/6 PASS on reviewed copy; zero browser chart requests before open.
- Unit111/111, full ESLint, final changed-file ESLint, typecheck and local production build PASS.
  Desktop/mobile screenshots inspected locally; guide disclosures use native keyboard behavior.
  No new unit coverage percentage is claimed for static JSX/CSS. No live backend/owner acceptance
  or native browser-toolbar zoom proof is claimed; the existing CSS200% Scanner case passes.
- Receipts: ignored `test-results/scanner-guide-{red,green,regressions,final,unit,lint,lint-final,typecheck,build}.log`;
  final compact screenshots `scanner-guide-compact-{desktop,mobile}.png` and disclosure layout
  `scanner-guide-{desktop,mobile}.png`. Frontend main@dcd847e plus local
  A/B/C edits. No commit/push/deploy. D was subsequently authorized; see current status above.

## Jurnal/Analytics presentation A+B, 22 October 2026 - local only

- A is implemented locally: scoped reporting main/header/filter styles, consistent journal
  actual/paper tabs, fullwidth panels and ledger, two-column curve/strategy on wide Analytics,
  semantic tables at every size with keyboard-focusable local scrolling, and distinct
  positive/negative/zero/null presentation. Existing GET fields/query/RPC/CSV/auth remain unchanged.
- B remains intact: `/journal?tab=paper` processing diagnostics follow results/table/footnote;
  Analytics processing order is unchanged. C was separately authorized afterward (see above);
  D (chart overlay) was separately authorized and completed locally afterward (see above).
  No backend/schema/data/trading change.
- RED->GREEN: missing shared paper-journal mode navigation reproduced before A; review found
  P&L colors overridden by generic table CSS, reproduced by computed-color test and fixed
  with scoped rules. Focused initial layout run8/8 PASS, unit111/111 PASS.
- Full desktop/mobile reporting+chart-return run:54 PASS/2 FAIL. The two new focus-bound checks
  sampled coordinates before native scroll finished after viewport resize. Keep that receipt;
  test now re-enters the table and waits for the same visibility bounds (no clipping allowed).
  Recheck2/2 PASS; final keyboard/Tab/ArrowRight plus enlarged-viewport run4/4 PASS.
  All56 original browser cases therefore have passing evidence across runs, not a relabelled
  clean single full-suite run. Two added enlarged-viewport cases also PASS.
- Selected actual-journal desktop regressions10/10 PASS: empty/denied access, ledger values,
  partial position, fill form, CSV, exact snapshot, long histories, shared filters and drafts.
  Total68 distinct affected browser cases have PASS evidence across the recorded runs.
- Full ESLint PASS; final added-test lint, typecheck and local production build PASS.
  Independent React/a11y/code reviews: no remaining HIGH/CRITICAL; color finding resolved.
  Desktop/mobile screenshots inspected. Layout tested320/390/1024/1280/1440 CSS-pixel widths;
  short viewport720x450 with density2 emulates 200% desktop geometry. Native browser-toolbar
  zoom200% and exhaustive vertical sticky-header/Tab-order acceptance remain NOT VERIFIED.
- A local Next dev `destination stream closed early` warning occurred during the passing
  journal run; no failed assertion was attributed to it. Do not claim universally clean server
  logs or hosted owner acceptance from fixture tests. Financial/parser modules were not changed;
  no new unit coverage percentage is claimed for CSS/JSX based on browser results.
- Private ignored receipts: `test-results/reporting-layout-green.log`, `reporting-colors-red.log`,
  `reporting-a-regressions.log`, `reporting-keyboard-recheck.log`, `reporting-keyboard-zoom-final.log`,
  `reporting-a-journal-regressions.log`, and `reporting-a-{unit,lint,typecheck,build}.log`.
  New layout screenshots use `reporting-layout-*`. Earlier B-only proof remains in its plan section.
- Source is frontend main@dcd847e plus local A/B edits; no commit, push, deploy or Production
  mutation performed for this UI package. Unrelated Markdown cleanup remains untouched.

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
