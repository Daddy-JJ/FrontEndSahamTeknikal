# AGENTS.md — SahamTeknikal Frontend

Operating instructions for the SahamTeknikal frontend repository.

Repository path:

```text
C:\xampp\htdocs\SahamTeknikal\frontend
```

Sibling backend repository:

```text
C:\xampp\htdocs\SahamTeknikal\backend
```

Project-level documentation:

```text
C:\xampp\htdocs\SahamTeknikal\
```

This repository is an independent Git repository.

The root project `AGENTS.md` contains the canonical shared project rules. This file adds frontend-specific operating instructions.

---

## 1. Read before changing code

Before substantial work, inspect the relevant project documentation when filesystem access permits:

1. `..\AGENTS.md`
2. `..\SOT.md`
3. `..\PRD.md`
4. `..\TECHNICAL_DOC.md`
5. `..\README.md`
6. `..\CODEX_HANDOFF.md`
7. `..\IMPLEMENTATION_STATUS.md`, when present

Also inspect:

- this repository's Git status;
- relevant source files;
- related tests;
- API client code;
- environment/configuration conventions;
- `PLAN.md` when active.

Do not assume parent files were automatically loaded merely because they exist above this Git repository.

If parent documentation cannot be accessed, do not invent its contents. Work from available repository evidence and report what could not be verified.

The latest explicit user instruction takes precedence.

Canonical trading rules are defined in `SOT.md`.

A `DEFAULT` explicitly approved in `SOT.md` may be implemented without repeatedly requesting confirmation.

---

## 2. Frontend responsibility

Default editable scope:

```text
C:\xampp\htdocs\SahamTeknikal\frontend
```

The frontend agent owns:

- UI;
- routes/pages;
- client-side state;
- forms and interaction;
- API clients;
- browser-safe configuration;
- frontend validation;
- presentation of scanner results;
- journal UI;
- statistics UI;
- frontend tests.

Reading the backend repository or parent documentation is allowed when access is available and needed for verification.

Do not edit:

```text
..\backend
```

unless the user explicitly requests cross-repository implementation.

If backend work is required, document the required backend change rather than silently working around it in the frontend.

---

## 3. Understand before editing

Before changing implementation:

- locate the existing component or pattern;
- identify affected screens/routes;
- inspect relevant API client code;
- inspect related types/interfaces;
- inspect loading/error/empty-state handling;
- inspect applicable tests;
- determine whether an API or data contract is involved.

Prefer existing patterns over introducing new abstractions.

Existing code describes current implementation, but does not override `SOT.md`, approved product requirements, or explicit user instructions.

---

## 4. Planning

For a small obvious change:

1. inspect;
2. implement the smallest safe change;
3. verify;
4. report.

For complex work, create or update:

```text
PLAN.md
```

Use a plan when work involves:

- multiple related components;
- multiple routes/pages;
- shared application state;
- authentication;
- API contract changes;
- major data-flow changes;
- cross-repository integration;
- architecture changes;
- production configuration.

Each meaningful plan step must include:

```text
Action:
Proof:
```

Do not wait for approval merely because a task is long.

Explicit approval is required before:

- materially changing a public API contract;
- changing canonical trading behavior;
- replacing application architecture;
- introducing a major dependency;
- changing authentication/security architecture;
- destructive Git operations;
- deleting substantial existing behavior.

---

## 5. Smallest safe change

Prefer:

- small diffs;
- existing components;
- existing utilities;
- existing UI patterns;
- existing API clients;
- existing dependencies;
- targeted fixes.

Avoid without demonstrated need:

- unrelated refactors;
- speculative abstractions;
- broad renames;
- formatting churn;
- new dependencies;
- architecture rewrites;
- unrelated cleanup.

Do not modify unrelated working behavior.

When tradeoffs exist, consider:

- **UX** — user impact;
- **DX** — maintainability for developers;
- **AX** — clarity and verifiability for future agents.

Correctness and data integrity take precedence over visual convenience.

---

## 6. API boundary

Treat the backend API and Supabase contracts as compatibility boundaries.

Do not silently change assumptions about:

- endpoint paths;
- HTTP methods;
- request payloads;
- response structures;
- status codes;
- error formats;
- authentication;
- authorization;
- RLS behavior;
- pagination;
- timestamps;
- trading-strategy identifiers;
- signal structures;
- trade/fill structures;
- statistics schemas.

Before changing a frontend API assumption, inspect the backend contract when possible.

If the backend contract cannot be inspected, rely on approved technical documentation and existing typed interfaces.

Do not make the UI appear functional by hiding a backend incompatibility.

---

## 7. Market-data integrity

Never fabricate production market data.

Do not silently substitute failed or missing live data with:

- fixtures;
- mock responses;
- hard-coded prices;
- stale cached values presented as current;
- random values;
- sample trading signals.

Fixtures and mocks are allowed only in clearly isolated development/test contexts.

The UI must distinguish where relevant:

- loading;
- current data;
- stale data;
- partial coverage;
- missing data;
- no signal;
- API failure.

`No signal` is not equivalent to `data unavailable`.

Do not label data as live/current unless freshness supports the claim.

---

## 8. Trading-rule safety

The frontend is primarily a presentation layer.

Do not independently redefine canonical strategy rules.

Do not alter:

- signal criteria;
- indicator formulas;
- fractal availability rules;
- fill conventions;
- initial risk;
- SL/TP ambiguity treatment;
- exit policy;
- RS ranking rules;
- official statistics;

merely to produce preferred UI results.

Official domain calculations should come from approved deterministic logic.

Frontend-only display calculations must be clearly distinguished from canonical trading calculations.

AI must not become the authoritative source of official signals, fills, P&L, or statistics.

---

## 9. Temporal correctness

Never introduce frontend logic that implies knowledge unavailable at decision time.

Respect distinctions such as:

```text
pivot date
!=
fractal available-at date
```

and:

```text
signal-night information
!=
next-session open
```

Do not use future values to retroactively improve historical trade presentation.

When presenting backtest/forward-test results, preserve the execution conventions defined by SOT/backend logic.

---

## 10. UI states

For affected flows, verify applicable states:

- normal;
- loading;
- empty;
- stale;
- partial coverage;
- error;
- invalid input;
- disabled;
- double click / double submit;
- refresh;
- navigation;
- responsive/mobile behavior.

Failed data retrieval must not render as a successful empty result unless that behavior is explicitly intended.

---

## 11. Authentication and browser security

Assume everything shipped to the browser is visible to users.

Never expose:

- Supabase service-role keys;
- private API keys;
- database credentials;
- AI provider secrets;
- privileged tokens;
- passwords;
- session secrets.

Only browser-safe public configuration may be exposed client-side.

Do not print secret values while troubleshooting.

When configuration is missing, report:

- environment-variable name;
- expected location;
- purpose;

not the secret value.

RLS must not be replaced by frontend-only authorization assumptions.

---

## 12. Bug workflow

For bugs:

1. reproduce the reported issue when practical;
2. capture actual behavior;
3. inspect relevant UI/state/API flow;
4. identify the root cause;
5. fix the root cause;
6. repeat the original reproduction;
7. run relevant regression checks.

Do not:

- swallow errors merely to keep the UI clean;
- fabricate successful data;
- disable validation to make a flow pass;
- weaken tests solely to obtain green output;
- hide backend failures behind mock responses.

---

## 13. Subagents

Use subagents only when decomposition materially helps.

Preferred roles:

### Explorer
Read-only investigation.

### Worker
One bounded frontend implementation.

### Reviewer
Read-only review.

Each delegated task must specify:

- objective;
- scope;
- done condition;
- expected evidence;
- concise report.

Do not assign two editing agents to the same file simultaneously.

Verify material subagent claims before relying on them.

---

## 14. Failed-attempt rule

After two materially different failed attempts on the same problem:

1. stop modifying that step;
2. record attempts and observed evidence in `PLAN.md`;
3. revisit assumptions;
4. collect new evidence;
5. form a new approach.

Do not repeat variations of the same failed solution indefinitely.

---

## 15. Git safety

Before substantial edits:

- inspect `git status`;
- identify existing user work;
- keep the diff scoped.

Do not destroy unrelated changes.

Unless explicitly authorized, do not use:

- `git reset --hard`;
- `git clean -fd`;
- force push;
- history rewriting;
- destructive checkout.

Do not modify backend Git history from this repository.

Inspect the final diff before reporting completion.

---

## 16. Verification

Run the strongest practical frontend checks relevant to the change.

Examples:

- targeted unit tests;
- component tests;
- integration tests;
- type checking;
- linting;
- production build;
- browser smoke tests;
- API integration checks.

For trading-related UI, verify presentation against deterministic backend/source values where applicable.

Read test/build output yourself.

An unrun check is not a pass.

Never claim:

- tests pass;
- build succeeds;
- browser flow works;
- API integration works;
- production is ready;

without evidence.

---

## 17. Cross-repository verification

When frontend behavior depends on backend behavior, verify as much of this path as access permits:

```text
UI action
↓
frontend state/handler
↓
API client
↓
request contract
↓
backend/API
↓
response contract
↓
frontend state
↓
rendered result
```

If the backend cannot be inspected or executed, explicitly report:

```text
Backend integration not verified in this session.
```

Do not describe frontend-only verification as end-to-end verification.

---

## 18. Documentation and status

When implementation materially changes approved behavior or project state, identify whether updates are required to:

- `..\SOT.md`
- `..\PRD.md`
- `..\TECHNICAL_DOC.md`
- `..\README.md`
- `..\CODEX_HANDOFF.md`
- `..\IMPLEMENTATION_STATUS.md`

Do not change `SOT.md` simply to match accidental implementation.

Canonical rule changes require explicit user direction or approval.

`IMPLEMENTATION_STATUS.md` must remain evidence-based.

Distinguish:

- planned;
- implemented locally;
- tested locally;
- configured;
- deployed;
- live smoke-tested.

---

## 19. Review before completion

Before finalizing:

1. inspect final diff;
2. remove accidental changes;
3. remove debug code;
4. remove temporary files;
5. check browser console/logging;
6. check for exposed secrets;
7. verify API-contract assumptions;
8. compare behavior against the task and SOT;
9. run applicable tests/build;
10. identify unresolved backend dependency.

For substantial changes, use a read-only reviewer when available.

---

## 20. Handoff

If another session or backend agent must continue the work, provide:

- objective;
- frontend changes completed;
- files changed;
- contract assumptions;
- verification performed;
- unresolved issues;
- required backend work;
- exact recommended next action.

Keep active implementation state in:

```text
PLAN.md
```

Use project-level `CODEX_HANDOFF.md` for durable cross-repository continuation context when appropriate.

---

## 21. Definition of done

Frontend work is done only when the relevant conditions are satisfied:

- implementation matches approved behavior;
- frontend/backend contracts remain compatible;
- market-data states are represented truthfully;
- no mock fallback can masquerade as live data;
- relevant UI states are handled;
- meaningful tests/build checks pass;
- no privileged secret is exposed;
- documentation/status impact is identified;
- limitations are explicitly reported.

---

## 22. Final report

Report concisely:

### Changed
What changed and why.

### Verified
Exact checks run and their results.

### Not verified
Relevant checks not performed.

### Backend impact
Required backend work or contract dependencies.

### Data / strategy impact
Any effect on signal, trade, fill, statistics, timing, or displayed market data.

### Tradeoffs
Only meaningful compromises or deferred work.

Use evidence rather than confidence statements.

---

## 23. Lessons

When the user provides a durable correction, add:

> When X, do Y because Z.

Newest lessons go first.

Lessons must be specific, reusable, and actionable.

Do not add temporary task details.

Do not modify the operating sections above `Lessons` unless the user explicitly requests it.

---

## Lessons

<!-- Newest durable frontend lessons go first. -->