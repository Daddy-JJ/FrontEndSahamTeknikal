# Frontend operating-rule traceability - 21 October 2026

Scope: owner-approved documentation-only D4 consolidation, snapshot docs-context-v1-20261021.
The full pre-edit frontend operating guide was read before condensation and is preserved in
[the original-guide archive](archive/AGENTS_BEFORE_CONTEXT_CLEANUP_20261021.md).
This mapping explains retention; [AGENTS](../AGENTS.md) is the active guide.
The inherited shared ECC v2.2.3 obligations are retained locally so a parent checkout is optional.
No domain, security, test, permission or release requirement is waived by shorter routing.

## Old frontend sections to current rules

| Old section / unique obligation | Retained location and meaning |
| --- | --- |
| Preamble: independent frontend Git, sibling/backend/root locations and shared-rule precedence | FE-01 scope; PROJECT_CONTEXT topology/external references; latest user instructions and root canonical rules when available |
| 1 Read before changing code: root/repo AGENTS, handoff, PLAN; status/source/tests/env/contracts; SOT/auth/RLS; PRD/technical/setup only as needed | FE-01 local-first equivalent plus FE-04/06; shared product/topology minimum copied into PROJECT_CONTEXT, root extra reading optional |
| 1 Standalone boundary, no invented requirements, synchronized SOT snapshots, explicit instructions, approved DEFAULT without repeated confirmation | AGENTS preamble, FE-01/04/10 and PROJECT_CONTEXT snapshot identity/maintenance |
| 2 Frontend responsibility: UI/routes/state/forms/API/config/validation/scanner/journal/statistics/tests; read versus edit backend | FE-01 full scope and cross-repository authorization; FE-04 presentation/canonical boundary |
| 3 Understand before editing: existing patterns, screens, API/types/states/tests, contract impact; implementation cannot override requirements | FE-01/03/04 |
| 4 Small inspect/implement/verify/report; complex triggers; Action/Proof; no permission merely for length | FE-02 preserves each trigger and explicit workflow |
| 4 Approval: material public contract, canonical trading, architecture replacement, major dependency, auth/security architecture, destructive Git, substantial deletion | FE-02 explicit approval list; publication/production gates additionally retained |
| 5 Smallest safe change: existing utilities/components/patterns/clients/dependencies, avoid unrelated refactors/renames/churn/abstractions/rewrites; UX/DX/AX; integrity above visuals | FE-03 |
| 6 API boundary: paths/methods, payloads/structures, status/errors, auth/authz/RLS, pagination/timestamps, strategy IDs, signals/trades/fills/statistics; inspect backend or approved types | FE-04 preserves all compatibility dimensions and missing-context reporting |
| 7 Market integrity: no production fabrication or failed-live fallback to fixtures/mock/hardcoded/stale/random/sample signals | FE-05; fixtures isolated/labelled; current claim requires freshness; unavailable differs from no-signal |
| 8 Trading safety: formulas/signals/fractal/fill/risk/SL-TP/exit/RS/statistics; deterministic official values; display calculations separate; AI never authority | FE-04 |
| 9 Temporal correctness: pivot versus available-at, signal-night versus next-open, no future knowledge or retrospective improvement, backend execution conventions | FE-04 |
| 10 UI states: normal/loading/empty/stale/partial/error/invalid/disabled/double-submit/refresh/navigation/mobile; failures not successful emptiness | FE-05 |
| 11 Browser security: visible bundles, public config only, service-role/private/provider/DB/token/password/session secrets never exposed/printed; config name/location/purpose; RLS | FE-06 |
| 12 Bug workflow: reproduce/observe/trace/root cause/fix/repeat/regression; no swallowing/faking/validation disable/test weakening/mock masking | FE-07 |
| 13 Subagents: decomposition useful, explorer/reviewer read-only, bounded worker, objective/scope/done/evidence/report, no overlapping writers, verify claims | FE-08 |
| 14 Two materially different failures: stop, PLAN evidence, revisit, collect evidence and new approach | FE-02 |
| 15 Git safety: inspect status/user work/scope, preserve unrelated work, destructive commands/history require permission, no backend history edits, final diff | FE-02/08 |
| 16 Strongest relevant checks, deterministic display comparison, personally read output, no unrun PASS/readiness claims | FE-07/08; doc-only exception preserves required application checks for code changes |
| 17 Full UI-handler-client-request-backend-response-state-render trace; report unavailable backend; frontend-only is not E2E | FE-07 exact trace and explicit missing-integration sentence |
| 18 Identify SOT/PRD/technical/README/handoff/status impact; never normalize accidental code by changing SOT; evidence-based separate lifecycle states | FE-04/09 plus PROJECT_CONTEXT shared-sync protocol |
| 19 Completion review: diff/accidental/debug/temp/console/secrets/contracts/task/SOT/checks/backend dependency; read-only substantial review | FE-08 |
| 20 Handoff objective/completed/files/contracts/checks/issues/backend work/next step; PLAN active; shared handoff coordination | FE-09 expanded minimum; context/PLAN/status remain sufficient without a new frontend handoff |
| 21 Done: approved behavior, compatibility, truthful market states/no mock fallback, UI states/checks/security/docs/limitations | FE-08 with FE-04/05/07 |
| 22 Final changed/verified/not-verified/backend/data-strategy impact/tradeoffs, evidence not confidence | FE-09 |
| 23 Lessons and Lessons section: user durable correction, When X do Y because Z, newest first, reusable/actionable, no temporary details, operating sections only on explicit request | FE-10 and retained Lessons section; consolidation authorization is task-local, not a permanent exemption |

## Inherited shared ECC rules to local minimum

Source: shared root AGENTS at the approved 21 October documentation baseline, ECC v2.2.3.
Its framework catalog/library is optional discovery; the obligations below remain operative.

| Shared section / unique obligation | Retained location / optional discovery |
| --- | --- |
| Project context/routing policy, 15 October: split repos, scoped reads, active PLAN, dated status, old PASS bound to source, archive preservation, no secret/runtime docs | FE-01/07/09/10; PROJECT_CONTEXT; local first is the approved portability update |
| Core Principles: agents, TDD80, security/input validation, immutable objects, plan complex work | FE-02/03/06/07/08 |
| Available Agents / Agent Orchestration: use relevant planners, TDD, code/security/architecture/domain/build/a11y/performance reviewers; parallel independent work | FE-08 retains specialist workflow and discovery for other relevant domains; root catalog and rules library are optional when present |
| Before any commit: no secrets; input validation, parameterized SQL, sanitized HTML/XSS, CSRF, auth/authz, rate limits, safe errors | FE-06, applies to any authorized commit; docs-only work does not authorize a commit |
| Env/secret manager, required config at startup, rotate exposed secrets; issue STOP/security-review/fix critical/review similar paths | FE-06; rotation follows authorized secret operations |
| Coding style: immutable copies; feature/domain files typical 200-400/max 800; functions under 50/nesting at most 4; validation/errors/readable names/no hardcoded values | FE-03 |
| Tests: minimum 80%; unit/integration/E2E; RED/GREEN/refactor; isolate/mocks/implementation, tests corrected only if wrong | FE-07 |
| Development: planning risks/dependencies/phases, TDD guide, immediate code review resolve HIGH/CRITICAL | FE-02/07/08 |
| Knowledge: personal notes obey memory policy; team knowledge in existing docs, no duplication, ask if no obvious top-level home | FE-09; memory writing still requires applicable explicit authorization |
| Workflow surface: skills canonical, commands compatibility shim only | FE-09; external library is preserved and not moved into this repo |
| Git conventional types; full-history PR summary/test plan; authorized push -u | FE-09, subordinate to FE-02 task-local publication permission |
| Architecture: consistent response envelope, repository abstraction with findAll/findById/create/update/delete, evaluate proven skeletons with parallel security/extensibility/relevance review | FE-03; FE-04 existing-contract compatibility still controls |
| Performance/context: avoid last 20% for large refactors; build-error specialist, incremental fixes/checks | FE-03/08 |
| Project structure: agents/skills/commands/hooks/rules/scripts/mcp-configs/tests is ECC catalog topology, commands legacy | Optional shared workspace library discovery in PROJECT_CONTEXT; not application structure or mandatory clone dependency |
| Success: requirements, readable/maintainable code, appropriate performance, passing tests 80%, no vulnerabilities | FE-03/06/07/08 done rules |

## Preservation and limits

- Original frontend AGENTS body is preserved in the linked archive; new wrapper makes its
  historical status explicit. The previous routing-only 15 October snapshot also remains.
- Completed PLAN body is preserved in
  [the relayout-plan archive](archive/PLAN_SCANNER_RELAYOUT_BEFORE_DOC_CLEANUP_20261021.md),
  with only wrapper/relative Markdown link rebasing. Before-change source descriptions stay historical.
- SOT/chart contract/checksum/legal are unchanged. No new application implementation, test
  result, runtime health, production mutation or publication authorization is implied.
- D5 parent review validates preservation, local links/anchors, shared snapshot agreement and
  frontend-only reading. This mapping is not a claim that unrun tests or hosted gaps passed.
