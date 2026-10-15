# Frontend implementation status

Documentation reconciled 2026-10-15. Release facts below come from recorded [workspace handoff](../CODEX_HANDOFF.md) and [chart verification](../docs/CHART_V1_LOCAL_VERIFICATION.md); no new tests, remote probes or deployment were run for this cleanup.

## Active work

**Scanner relayout stages 1-4: IMPLEMENTED AND VERIFIED LOCALLY; not deployed.**
Read [PLAN.md](PLAN.md) for the layout and [local verification](docs/SCANNER_RELAYOUT_VERIFICATION_20261015.md) for results and limits. Unit80, final Scanner followup21 plus zoom1, chart followup2, journal/Analytics15 and Workspace6 PASS; typecheck/lint/production build PASS. Earlier full Scanner failures and their disclosure correction are retained in verification. These stages are unrelated to the released chart baseline below.

## Recorded released baseline

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
