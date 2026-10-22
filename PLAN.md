# Active work — password login, 22 October 2026

Owner approved [password login design](docs/LOGIN_PASSWORD_EXPLORATION.md), then selected
username `daddyjj`. Keep the current Supabase owner UUID, GitHub fallback and RLS.
Preserve pre-existing uncommitted documentation. No password, signup, owner reassignment,
journal mutation, paid dependency or schema migration is part of this implementation.
This newer assignment supersedes the root 21 October handoff's completed-docs task;
the completed journal reset must never be rerun as part of password login.

| Stage | Action | Proof / state |
| --- | --- | --- |
| A1 | Read-only owner/config audit; lock server alias and cloud abuse protection | Owner confirmed active with same UUID on 21 October; email/GitHub identities and password present. Management Auth configuration GET 403; settings NOT VERIFIED |
| A2 | TDD policy/core, SSR adapter, username login and owner password setup | Implemented locally. 31 focused tests PASS; policy/core/HTTP 100% lines, 99.20% branches; full unit 111/111 PASS. Same UID/membership/AMR, cookie buffering, origin/body/redirect validation |
| A3 | Protected password recovery, errors, cross-instance attempt protection and consistent UI | Implemented locally. Disabled recovery rejects both request and update. Cloud WAF+native Auth controls not verified/configured; no in-memory counter |
| A4 | Security/a11y review, unit/browser/regression/type/lint/build; prepare release | Local checks complete: independent review no CRITICAL/HIGH; typecheck/lint/final production build PASS. Browser 36/36 desktop/mobile and 7 selected journal/reporting/scanner regressions PASS. Callback canonical-origin and HTML 429 fixes verified. Real owner/cloud WAF/SMTP NOT VERIFIED; no publication or activation performed |

Production activation must verify the Vercel WAF rule and server mapping first. GitHub
remains available while missing configuration fails closed. Password is set by the owner
through verified UI; do not solicit it in chat. Source, local proof and live proof are separate.
Owner authorized cloud configuration and commit/push/deploy on 22 October. Release is in
progress; current Vercel CLI login is not yet available to the operator. Follow the activation
checklist after access is verified. Keep recovery disabled until delivery is proven;
do not rerun old reset/backfill operations. No backend implementation or migration is needed.

## Release continuation

Source `9d477cc` is deployed (Production `7246831816`); public smoke PASS.
Password activation remains pending authenticated Vercel CLI access, WAF and environment.
[Status](IMPLEMENTATION_STATUS.md) owns the dated receipts and proof limits.
Next: finish cloud login, verify protection/mapping, redeploy and obtain owner acceptance.

Previous completed Scanner relayout plan: [historical snapshot](docs/archive/PLAN_SCANNER_RELAYOUT_BEFORE_DOC_CLEANUP_20261021.md).
