# Portable project context - frontend

Snapshot ID: **docs-context-v1-20261021**. As of 21 October 2026.
Purpose: minimum shared context for a standalone clone; status chronology belongs elsewhere.
Source: owner-approved shared documentation handover and root product/technical/SOT snapshots.
Frontend source ref: 513870f6020983ddb20ba022c946eaffd223fce6; context edits are local until published.

## Product and topology

SahamTeknikal is an owner application for an IDX end-of-day scanner, Smart Money Flow & Bandarmology
intelligence (`/broker-flow`), signal research, paper evaluation, an actual trade journal, Analytics and canonical ticker charts.
Paper and actual ledgers remain separate; AI/research output is not official trading arithmetic.
Two independent Git repositories are used:

- Frontend: Daddy-JJ/FrontEndSahamTeknikal (this clone, Next.js owner application).
- Backend: Daddy-JJ/BackendSahamTeknikal (Python scanner, workflows, Supabase migrations/RPCs).

Root workspace documentation is shared context, not either repository's release workspace.
Run Git/source work inside its assigned repository; reading another repo is not edit permission.

## Stack and ownership

Frontend: Next.js 16.3.8, React 19.3.0, TypeScript; Vercel project root is this repo (.).
Backend: Python 3.12 scanner & sync pipeline, GitHub Actions cloud jobs and Supabase Auth/Postgres/RPC/watchdog.
Frontend owns formatting, plotting, routes, state, validation and interaction against contracts.
Key features include Night Scanner (`/scanner`), Smart Money Flow & Bandarmology (`/broker-flow`) with Wyckoff Market Quadrants and multi-horizon (2D/5D/10D) flow, interactive ticker charts (`/chart/[ticker]`), paper/actual journals (`/journal`), and portfolio analytics (`/analytics`).
Backend/SOT owns deterministic signal/trading rules and canonical financial/journal/statistics values.
Do not recompute official values in the browser or silently substitute synthetic data for failures.
`/api/broker-flow` uses a dual-tier strategy: querying Supabase `broker_flow_ticker_horizons` with automatic fallback to static snapshot `public/data/broker_flow_horizons.json`.
Read the [local SOT](SOT.md) and [chart contract](contracts/ticker-chart-v1.md) for affected rules.
Source and tests show implementation; they never override approved canonical rules.

## Shared snapshot identity

The root SOT is canonical; this repo's SOT is a synchronized normative snapshot, not a fork.
The chart Markdown contract is vendored for standalone consumers with its existing checksum.
Baseline available root/frontend/backend copies agreed at the 21 October documentation freeze:

- SOT.md raw SHA-256: d6e18a844a739a799ca38d0e23dc637f8e817991330de86c7ed62b6ad4f32f06.
- contracts/ticker-chart-v1.md raw SHA-256: b31fe96047df61c91c81c91a5bc27c53b398651b9fa08fce4ea4e90d5bc39e63.

These hashes establish agreement of the available snapshot, not freshness against an unavailable root.
Canonical payloads, contract/checksum bytes and legal attribution are unchanged by this cleanup.
If shared rules are inaccessible, report that boundary; do not invent their newest version.

## Local-first reading and evidence

Read [AGENTS](AGENTS.md) -> this context -> [PLAN](PLAN.md) -> source/tests and relevant SOT/contracts.
Use [README](README.md) for local commands and [status](IMPLEMENTATION_STATUS.md) for dated proof/gaps.
Root CODEX_HANDOFF.md, PRD.md, TECHNICAL_DOC.md and rules/common + typescript/react/web are
optional enrichment in a combined workspace; backend/database security rules apply when relevant.
Other framework libraries remain available but are not mandatory frontend startup reading.
External backend source reference: Daddy-JJ/BackendSahamTeknikal at ref 719bc8c7f4deff2f945a0825cc92f6685cf48661;
docs/ACTUAL_JOURNAL.md and contracts/ticker-chart-v1.md are optional external contract/runbook sources.
Root shared documents are local workspace files, not guaranteed files in either published clone.
Use local snapshots and typed interfaces if unavailable; report unknown integration details.
PASS belongs to the recorded source/environment/time; local fixture, SQL-role, public-HTTP,
owner-browser and genuine JWT proofs differ. Unrun/unavailable checks remain NOT VERIFIED.
An archived prompt or a gap grants no new mutation/release authority; task-local authorization applies.

## Maintenance and handover

An agent changing shared context/policy owns synchronization of both PROJECT_CONTEXT and affected
AGENTS rules within authorized scope. Record source, date, snapshot ID/hash and publication ref.
If the sibling repo is unavailable or unapproved, mark sync pending; do not claim all repos aligned.
Compare both snapshots before closure; identical bytes/hashes cannot establish unavailable-root freshness.
Stable context lives here; active Action/Proof in PLAN; release evidence/gaps in status; history in archives.
Handover includes task/role/scope, repo/branch/SHA/dirty files, decisions, proof, blockers, approvals,
next action/side effects and exact reading pointers as required by AGENTS.
