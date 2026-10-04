# Frontend corrective implementation — 2026-10-04

Scope: frontend only. User approved implementation of the audit remediation plan.
Baseline HEAD: 52d11d0078a55f9798a47765eb5a0ce785109ca2. Changes remain local.
No backend edit, environment replacement, production mutation, QA production
trade, commit, push or Vercel deployment was performed by this continuation.

## Findings and implementation

Current open-item register: [AUDIT_REMAINING_20261004.md](AUDIT_REMAINING_20261004.md).
It separates CLOSED LOCAL regressions from missing capabilities and hosted release
evidence; an open release gate does not reopen a locally corrected bug.

| Finding | Local change | Remaining scope |
| --- | --- | --- |
| FE-01 | Paper fixture isolated before actual queries; live paper unavailable with explicit copy | Hosted paper persistence/read adapter still missing |
| FE-02 | Invalid cohort rejected; all five RPC filters including exact p_exit_snapshot; complete filter serialization on strategy navigation/CSV | Fresh hosted acceptance on changed candidate |
| FE-03 | RPC errors, incompatible mode/IDR/cohort/null/status/decimal response fail closed | Hosted error paths remain separate evidence |
| FE-04 | Removed unbounded closed history preload and frontend cumulative R/strategy financial sums | Canonical aggregate curve/attribution read model |
| FE-05 | Open partial exits show backend realized P&L; realized R remains null until closed | No invented unrealized P&L |
| FE-06 | Continuation empty, no published signals, partial, failed and preparing distinct | No claim all technical criteria failed from zero publications |
| FE-07 | Removed reference-close minus stop / ΔR calculation; invalid/missing stop reason retained, canonical stop_invalid labelled | Reference close remains distinct from fill |
| FE-08 | PF/payoff net IDR labels and explicit undefined/no-loss/no-win/null states | No infinity inferred from backend null |
| FE-09 | Immutable signal checklist, pivot/availability/provenance, bounded date/strategy navigation, verified signal-linked actual draft; owner Operations GitHub link | Frozen chart inputs, live paper, persistent planned/skipped actions/settings and operational metrics |
| FE-10 | Dedicated semantic tests include the new correctness/denial/idempotency paths | Automated suites use local HTTP doubles |
| FE-11 | Current candidate and incomplete capabilities separated from historical release claims | Exact release SHA and new Vercel acceptance not available |

Canonical arithmetic and scanner eligibility remain in backend. Frontend validates
the boundary and formats values; it does not compute MACD/EMA/fractals/RS, risk,
fees, P&L, R, win rate, expectancy or official attribution. Percentage conversion
and decimal formatting are presentation only.

## Contract compatibility

- Existing apply_actual_journal accepts optional signal_id in create payload.
  The route and action recheck owner/mode/forward signal, ID, ticker and strategy.
  A linked draft prefills ticker/strategy, requires explicit stop confirmation,
  and creates no fill or broker order. Request UUID and exact payload survive retry.
- Analytics uses the current actual_journal_analytics(date,date,text,text,jsonb)
  signature and validates cohort_date=exit_session_Asia_Jakarta, mode, data_mode,
  basis, echoed filters, numeric/count/status fields. Unknown/error never becomes
  zero statistics. Open/draft counts share strategy/exit filters, not exit dates.
- CSV is unchanged: actual-journal-export-v1, p_status=closed, p_limit=200,
  p_after through has_more=false. Exact decimals and formula neutralization stay
  backend-serializer compatible. Explicit correction FK remains unchanged.
- Scanner latest forward/mode selection and section reads remain bounded.
  Date/strategy filters use existing PostgREST fields; pages retain run ID.
  Candidate rules/pivot_date/available_session and projected versions come from
  the immutable signal snapshot. Missing metadata remains unknown. No latest
  market revision is substituted for a chosen run's input.
- PT412/HTTP412 and revision/idempotency contracts remain unchanged.
- Operations opens the existing backend GitHub Actions page; no PAT, workflow
  dispatch, production publication or fabricated scheduler/usage state.

## Verification ledger

Actual checks observed (local only):

- Baseline journal invalid-cohort desktop reproduction FAILED as expected before
  remediation: invalid date showed analytics, expected rejection absent.
- Unit suite18/18 PASS; final nonincremental typecheck and lint PASS. Ordinary
  Next16.3.6 production build PASS, including TypeScript and route generation.
- Journal desktop19/19 and tablet/mobile38/38 PASS: 57 cases total over 1440x1000,
  1024x768 and iPhone13 viewport. Includes empty/error/auth doubles, partial ledger,
  canonical SOT1200/fee100/net1000/R0.833333, pending/retry/PT412, corrected-time FK,
  CSV formula neutralization and 200+1 cursor, cohort and bounded history reads.
- Scanner suite first stopped on HTTP stub treating lte date as exact eq. Second
  stopped on exact label locator containing select options and an assertion that
  prohibited existing Auth refresh. DOM/proxy inspection explained both; semantic
  combobox and no-REST-read assertions preserve the intended checks. These failed
  runs are not reported as passing. Further dev streaming/render timing failures
  led to an interrupted owned run and a production-build harness, after inspecting
  DOM evidence. No assertions/timeouts were weakened. Full scanner54/54 PASS on
  the isolated production build; prior preview flag=true with simulated live still
  excluded fixtures. Final preview flag=false guards6/6 PASS separately across
  all three viewports; do not claim the full54 ran with that final flag.
- Default workspace/Auth browser18/18 PASS; not a substitute for dedicated flows.
- Test ports3052/3053/3054/3056 closed after all suites; user port3050 preserved.
- Source41 files and browser bundle15 files scanned: public names only URL and
  publishable key; no suspected private literal or configured private value matches.
  This bounded pattern/value check is not exhaustive unknown-secret/hosted proof.
- Frontend/backend CSV serializer SHA256 both
  AA855662A503DE3FEA11AF6548763E0C5E47A1A89F87CE2012EDC270E9A27CDA.
- Mobile analytics screenshot inspected: fixture banner, cohort form, metrics and
  explicit aggregate-unavailable panel visible; screenshot is local synthetic data.
- Read-only reviewer found no P0/P1 in the inspected diff. P2 canonical stop reason
  and linked-draft submit-proof gaps were addressed. Review is not hosted evidence.

Automated browser tests are isolated Node/Next HTTP doubles on test ports,
including simulated LIVE mode; they never contact production. Windows teardown
uses only owned child IPC, no taskkill by port or unrelated server termination.

Final diff check PASS. No fresh hosted owner-JWT,
RLS, lifecycle, scanner publisher or Vercel smoke was run in this continuation.

| Command | Observed result |
| --- | --- |
| npm.cmd run test:unit | 18/18 PASS |
| npm.cmd run test:journal -- --project=desktop --max-failures=3 | 19/19 PASS |
| npm.cmd run test:journal -- --project=tablet --project=mobile --max-failures=2 | 38/38 PASS |
| npm.cmd run test:scanner:release | isolated build +54/54 PASS |
| npm.cmd run test:scanner:release -- --grep "live paper\|unpublished" | final flag=false build +6/6 PASS |
| npm.cmd test | 18/18 PASS |
| npm.cmd run lint | PASS |
| node node_modules/typescript/bin/tsc --noEmit --incremental false | PASS |
| npm.cmd run build | PASS |
| git diff --check | PASS |

Sanitized evidence: docs/evidence/frontend-remediation-local-20261004.json.

## Changed frontend files

- Source: src/app/analytics/page.tsx; src/app/journal/page.tsx and actions.ts;
  src/app/operations/page.tsx; src/components/journal-shell.tsx,
  scanner-dashboard.tsx, paper-journal-preview.tsx; src/lib/actual-analytics.ts,
  journal-filters.ts, journal-server.ts, scanner-contract.ts, scanner-server.ts;
  src/proxy.ts.
- QA: tests/actual-analytics.test.mjs, scanner-contract.test.mjs, journal.spec.ts,
  scanner.spec.ts; tests/support/journal-dev.mjs, managed-next.mjs, smoke-setup.ts,
  scanner-release-smoke.mjs; package.json (script only; no dependency change).
- Documentation: PLAN.md, IMPLEMENTATION_STATUS.md, README.md,
  docs/VERCEL_DEPLOYMENT_CHECKLIST.md, this report, backend handoff and local JSON
  evidence. Generated next-env.d.ts has no substantive diff after conditional
  test-path restoration and the ordinary build; no env files were replaced.

## Release boundaries and next action

Corrective frontend behavior can be reviewed separately from full MVP. Live paper
and canonical aggregate/chart/action/settings integrations remain incomplete;
an unavailable panel is not feature completion. Mandatory backend/full-stack
readiness stays NO-GO until its remaining gates or an explicit scoped release
disposition are documented. Skipped outsider/concurrency checks remain SKIPPED /
NOT VERIFIED. New live acceptance must target the actual candidate/deploy SHA.

Backend documents were read-only. Latest reported manual publication uses run
3c700de4-8389-400e-b862-31f2c8998a64, target2026-10-02, stored_at
2026-10-03T12:44:34.492091Z, LOCAL Yahoo input digest
653f9f9168b20dabfc14dc9fa18090e6ed48f5d63546c897107cc44258dd4110.
45/100 evaluated,25 action holds,30 quality holds,0signals,RS incomplete.
These are prior backend reports, not a new probe. GitHub37114744856 metadata must
not replace that snapshot's lineage. Hosted publisher and hosted mutation/access
proof remain governed by backend handoff, not this local corrective test suite.

Continue with docs/BACKEND_REMEDIATION_HANDOFF_20261004.md: agree additive read
contracts, backend development evidence, frontend adapters, authorized backend
rollout, then separately authorized frontend release and exact-deploy smoke.
No change to SOT/PRD trading rules is requested. Root status/handoff completion
claims need cross-repository alignment in their owning chat; root/backend files
were preserved. Sibling backend local work must also be preserved.
