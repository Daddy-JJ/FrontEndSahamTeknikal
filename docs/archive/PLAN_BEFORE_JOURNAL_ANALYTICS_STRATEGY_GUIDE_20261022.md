# Historical plan snapshot - 22 October 2026

Completed password release and documentation handover; retained for provenance, not an active task queue.
Original PLAN body preserved except relative links rebased for this archive.
Current owner task is in [PLAN](../../PLAN.md). Proof limits below remain historical.

---

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

[Status](../../IMPLEMENTATION_STATUS.md) owns the release receipt and limits;
[design/checklist](../LOGIN_PASSWORD_EXPLORATION.md) owns architecture and configuration.
Remaining owner acceptance: real password setup/login, authenticated data reads and genuine
outsider JWT denial are NOT VERIFIED. Recovery stays off until delivery/PKCE is proven;
native Supabase advanced limits/reauth settings are NOT VERIFIED (management GET 403).
These gaps do not authorize operator-created passwords, real email or new Auth users.
New configuration resides in Vercel Production; the laptop is not required at runtime.

## Completed documentation handover

The owner-approved D1–D5 cleanup below remains complete; it is not a new task queue.

# Documentation handover - 21 October 2026

Task: docs-context-v1-20261021, frontend documentation role. Owner approved D1-D5 in the
shared documentation handover plan; only first-party Markdown is authorized here.
No app code/config/data/schema/checksum/workflow changes, commit, push, deployment,
production probe or financial mutation is authorized by this plan. A push to main may
trigger Vercel even for Markdown and remains a separate release action.

| Stage | Action | Proof / state |
| --- | --- | --- |
| D1 | Freeze ownership, SHA, dirty state and document/hash baseline | Parent recorded baseline; frontend main HEAD 513870f6020983ddb20ba022c946eaffd223fce6 clean before edits; local SOT/chart snapshots frozen |
| D2 | Reconcile relayout source/local/release/public evidence | Local documentation reconciliation complete; 15 October receipts transcribed into status, no new remote verification |
| D3 | Archive completed plan, retain stubs/headings and repair wrappers/indices | Local PASS: 17 original archived bodies preserved, existing stub headings and chart/journal locator paths retained |
| D4 | Condense operating guide with rule traceability and portable context | Local complete: AGENTS170 lines plus context67 and PLAN21 (258 startup lines); independent frontend-only reader PASS |
| D5 | Validate Markdown allowlist, links/anchors, preservation, hashes and fresh handover | Local links/anchors, preservation, protected hashes and diff-check PASS; parent source/preservation/link checks PASS; independent backend and workspace review PASS; application/runtime checks outside scope |

The finished Scanner plan is [archived](PLAN_SCANNER_RELAYOUT_BEFORE_DOC_CLEANUP_20261021.md).
It is historical, including its descriptions of source before the relayout; do not restart it.
[Status](../../IMPLEMENTATION_STATUS.md) owns dated delivery proof and open evidence limits.
Open owner-browser/JWT/restore/stability gaps do not authorize implementation or production actions.
D1-D5 complete locally. No frontend implementation/review remains; await the owner's next
assignment. Do not repeat completed checks or publish without the applicable authorization.
