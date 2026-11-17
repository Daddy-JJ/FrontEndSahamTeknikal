# SahamTeknikal frontend - operating instructions

Policy snapshot: docs-context-v1-20261021, consolidated 21 October 2026 with owner approval.
This is the independent frontend Git repository. Latest explicit user instructions prevail;
approved SOT DEFAULT decisions need no repeated confirmation. Root shared rules are canonical
when available; this guide retains the minimum safe obligations for a standalone clone.

## FE-01 Read and scope

Start locally: [PROJECT_CONTEXT](PROJECT_CONTEXT.md) -> [PLAN](PLAN.md) -> relevant source/tests
and [SOT](SOT.md)/contracts. Read [status](IMPLEMENTATION_STATUS.md) for release evidence/gaps;
[README](README.md) for setup. Archives are optional provenance, never a task queue.
Inspect git status, existing user work, affected routes/components/patterns, types/API clients,
loading/error/empty behavior, tests, environment conventions and contract impact before edits.
Code describes implementation; it cannot override SOT, approved requirements or explicit instructions.
Root handoff/PRD/technical docs and sibling backend are optional extra context when accessible.
Do not invent inaccessible requirements; use local versioned snapshots/typed interfaces and
report missing context. Clarify only when it blocks safe authorized work. Shared snapshot
maintenance and external-source locations are in PROJECT_CONTEXT.

Own UI/routes, state/forms/interaction, API clients, browser-safe config, validation, scanner,
journal/statistics presentation and frontend tests. Read backend when needed and available;
edit backend or parent only with explicit cross-repository scope. Document required backend
work rather than masking an incompatibility in frontend.

## FE-02 Plan, permission and Git

Small work: inspect -> smallest safe change -> verify -> report. For multi-component/route,
shared-state, auth, API/data-flow, cross-repository, architecture or production-config work,
use PLAN with dependencies, risks, phases and Action/Proof per meaningful step. Length alone
is no reason to seek permission. After two materially different failed attempts, stop that
step, record attempts/evidence in PLAN, revisit assumptions, collect evidence and replan.

Explicit approval is required for material public-contract or canonical-trading changes,
architecture replacement, major dependencies, auth/security architecture changes, destructive
Git and substantial behavior deletion. Do not commit/push/deploy, mutate production, use real
email/payment or create persistent QA data without task-local authorization; Git publication
and production mutations are separate gates. Pushing main can auto-deploy Vercel even for docs.
Preserve unrelated changes; no reset --hard, clean -fd, force push, history rewrite or destructive
checkout without authorization. Do not alter backend history here. Review the final diff.

## FE-03 Small safe implementation

Prefer existing components/utilities/API clients/dependencies and targeted fixes. Avoid unrelated
refactors/cleanup, speculative abstractions, broad renames, formatting churn, new dependencies
or rewrites without demonstrated need. Preserve working behavior; correctness/data integrity
outweigh visual convenience; weigh UX, developer maintainability and future-agent clarity.
Create new objects/copies rather than mutating. Organize cohesive files by feature/domain,
typically 200-400 lines, maximum 800; functions under 50 lines and nesting at most 4 levels.
Use readable names, no hardcoded values, schema validation at all input boundaries and fail
fast with clear messages. Never trust external input. Handle errors at every level with
user-friendly UI messages and detailed safe server logs; never silently swallow errors.
Use consistent success/data/error/pagination envelopes and repository data-access interfaces
(findAll/findById/create/update/delete) with business logic depending on the abstraction.
For a new skeleton, evaluate proven templates for security/extensibility/relevance before
cloning/iterating; use parallel specialist review where independent. Avoid large refactors
in the final 20% of available context; simple scoped work may continue.

## FE-04 Contract and domain integrity

Backend API/Supabase contracts are compatibility boundaries. Inspect backend contracts when
possible before changing assumptions about paths/methods, payload/response, status/errors,
auth/authz/RLS, pagination/timestamps, strategy IDs, signals, trades/fills or statistics.
If unavailable, use approved documentation and typed interfaces and state the limitation.
Do not conceal incompatible or failed backend behavior behind apparent success.

Frontend formats/interacts; deterministic backend/RPC owns official signals, fills, initial
risk, ledger P&L and statistics. Never redefine signal criteria, indicator formulas, fractal
availability, fill conventions, SL/TP ambiguity, exits, RS ranks or official statistics for UI
convenience. Distinguish display calculations from canonical ones; AI is not their authority.
Keep paper and actual ledgers separate. No future information: pivot date differs from fractal
available-at date; signal-night information differs from next-session open. Preserve SOT/backend
backtest/forward-test execution conventions; do not improve historical presentation retroactively.
Never edit SOT merely to match accidental implementation; canonical changes require user direction.

## FE-05 Truthful market data and UI

Never fabricate production market data or silently substitute failures/missing live data with
fixtures, mocks, hardcoded prices, stale cache presented as current, random values or sample
signals. Isolate and label fixtures/mocks in development/tests. Claim current/live only when
freshness supports it; no-signal is distinct from unavailable data.
For affected flows verify normal/loading/empty/stale/partial/error/invalid/disabled states,
double click/submit, refresh/navigation and responsive/mobile behavior. Missing/failed retrieval
must not look like a successful empty result unless explicitly intended.

## FE-06 Security

Everything shipped to browsers is visible: expose only browser-safe public config. Never
hardcode/expose/print service-role/private/provider keys, DB credentials, privileged tokens,
passwords or session secrets. Use env/secret management; validate required config at startup.
For missing config report variable name, location and purpose, never its value. RLS cannot
be replaced by frontend-only authorization. Never publish secret/private runtime payloads in docs.
Before any authorized commit verify input validation, parameterized SQL, sanitized HTML/XSS,
CSRF protection, authentication/authorization, endpoint rate limits and nonleaking errors.
If a security issue appears: stop the affected step, use security review, fix CRITICAL issues,
rotate exposed secrets through authorized operations and inspect similar paths.

## FE-07 TDD, bugs and checks

For application features/fixes use mandatory RED -> minimal GREEN -> refactor; coverage minimum 80%.
Required test types: unit, integration (API/database contracts) and E2E critical user flows.
Choose relevant checks: component/dedicated browser suites, typecheck, lint, production build,
API integration and deterministic backend/source comparisons for trading UI. Troubleshoot
isolation -> mocks -> implementation; change tests only when wrong, never just to get green.
For bugs reproduce/capture actual behavior, trace UI/state/API, fix root cause, repeat the
original reproduction and run regressions. Never hide errors/failures, fabricate success,
disable validation, weaken tests or substitute mock responses to make a flow pass.

Read all check output. Existing PASS stays bound to its source/environment; rerun for changed
code, failures, unresolved risk or a verification request. Unrun checks are never PASS.
Documentation-only work validates links/anchors, preservation, protected hashes and diff;
application checks remain mandatory for application changes, not this Markdown-only cleanup.
Never claim test/build/browser/API success or production readiness without evidence.
Trace cross-repository flows as access permits: UI action -> state/handler -> API client ->
request -> backend -> response -> state -> render. Frontend-only proof is not E2E proof.
If backend cannot be inspected/executed, say: "Backend integration not verified in this session."

## FE-08 Specialist work and review

Use a planner for complex work, a TDD guide for bugs/features, an architect for design,
a code reviewer immediately after code changes (resolve HIGH/CRITICAL), and a security reviewer
for sensitive code/before commits. Use an explorer for unfamiliar systems, React review for JSX,
a11y for UI, performance review for measured bottlenecks and a build-error resolver to analyze,
fix incrementally and verify after each fix. Other domain/OSS/RAG/loop/harness specialists
apply when their domains arise; the shared ECC catalog is optional discovery, not a requirement
to load unrelated frameworks. Use independent work in parallel where it materially helps.
Each subtask specifies objective/scope/done condition/evidence/concise report. Explorer/reviewer
are read-only; worker owns one bounded edit. Never overlap file writers; verify material claims.

Before completion inspect diff; remove accidental/debug/temp changes; check relevant browser
console/logging, secrets, API assumptions, task/SOT behavior, tests/build and backend dependencies.
Use a read-only reviewer for substantial changes when available. Done means approved behavior,
compatible contracts, truthful states/no mock fallback, applicable checks passed, acceptable
performance, no security vulnerabilities/privileged secret exposure, documentation impact
identified and explicit limitations. No waiver becomes PASS.

## FE-09 Documentation, handover and release

Keep PLAN active Action/Proof; status evidence-based with planned/implemented-locally/tested-locally/
configured/deployed/live-smoke-tested separate. Label source/ref, environment/time and
PASS/PARTIAL/FAIL/SKIPPED/NOT VERIFIED/NO-GO honestly; local fixtures, SQL roles, public HTTP and
owner-browser/JWT proof are different. Update appropriate local/shared SOT, PRD, technical,
README, handoff/status when behavior/state materially changes; keep document purposes distinct.
Archive superseded content with links/wrappers and open gaps; never relabel old proof as new.
Team architecture/API/runbook knowledge belongs in existing docs; do not duplicate task output.
Personal notes follow applicable memory rules; ask before a new top-level doc when no home exists.
New workflow contributions go in skills/; commands/ is compatibility only when a shim is needed.

Handover minimum: task ID/role/scope; repo/branch/SHA and dirty files; decisions/rule IDs;
completed changes/files/contract assumptions with proof per source/environment; blockers and
NOT VERIFIED; approvals and their limits; backend work; exact next action, side effects and
source/docs to read. PLAN/status/context suffice here; root handoff is optional coordination.
Final report: changes/why, exact checks/results, not verified, backend impact, data/strategy/timing
impact and meaningful tradeoffs. Report evidence, not confidence. If authorized to publish,
use type: description (feat/fix/refactor/docs/test/chore/perf/ci); analyze full history for a
comprehensive PR summary plus test plan and use push -u. Procedures are not publication permission.

## FE-10 Lessons and maintenance

Durable user corrections use "When X, do Y because Z", newest first, specific/reusable/actionable.
Keep temporary task details out of Lessons. Do not change operating rules above Lessons without
explicit user instruction; this consolidation was explicitly approved. When authorized shared
context/rules change, synchronize both repository snapshots with date/version/source hash/ref;
if unavailable or outside authorized scope record sync pending. Equal hashes prove snapshot
agreement, not freshness against an unavailable root. See PROJECT_CONTEXT for the protocol.
Full old-section/unique-rule mapping: [traceability](docs/AGENT_RULE_TRACEABILITY_20261021.md).

## Lessons

<!-- Newest durable frontend lessons go first. -->
