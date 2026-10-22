# Login username/password — exploration

As of 21 October 2026. **APPROVED for implementation; username `daddyjj`.**
This focused design began as exploration. [PLAN](../PLAN.md) owns current Action/Proof.
Production readiness still requires verified cloud protection, configuration and owner login;
approval is not evidence that these checks or deployment succeeded.

## Existing ownership and implementation

[Login](../src/app/login/page.tsx) now includes a gated username/password form alongside
[GitHub OAuth](../src/app/login/github-login-button.tsx).
The [callback](../src/app/auth/callback/route.ts) exchanges the PKCE code, then
[Akun](../src/app/auth/check/page.tsx) verifies the user and active `app_members` membership.
The [server client](../src/lib/supabase/server.ts) and [proxy](../src/proxy.ts) maintain
the Supabase session through cookies. Supabase Dashboard login is separate from app login.
Dedicated password tests use an isolated loopback Auth service; they are not hosted proof.

The same Supabase user UUID must remain the owner. Membership, journal ownership and
backend `APP_OWNER_USER_ID` refer to it. Do not sign up a replacement owner, automatically
merge identities, migrate journal ownership or bypass RLS for this feature.

## Recommended V1

- Primary login: username and password, directly on `/login`, matching the terminal UI.
  Provide visible labels, show/hide password, password-manager autocomplete, Enter submit,
  loading/error states and safe return to Scanner or the originally requested local route.
- Supabase Auth continues to verify passwords and issue the existing session/JWT. User
  daily login no longer requires visiting GitHub or the Supabase Dashboard.
- Supabase password login accepts email/phone. A single-owner username is therefore an
  application alias, resolved server-side to the existing owner's verified email.
  Keep the alias/email mapping in server-only Vercel configuration for this first version;
  never expose an anonymous email-lookup RPC or put a password in environment configuration.
  Email+password is the simpler alternative if the owner prefers email as their username.
- Password setup/change belongs in the existing Akun route, `/auth/check`, after owner
  verification and appropriate fresh authentication. Add a password to the existing OAuth
  user using Supabase's supported update flow; confirm UUID remains identical.
  Use provider-neutral copy in account/error screens. The current callback always
  redirects to `/auth/check`; recovery needs an explicit protected password-update
  destination rather than reusing that redirect unchanged.
- Keep GitHub as an alternative recovery method during rollout. Do not unlink it before
  password login/recovery succeeds. No public registration screen is required; inspect
  project signup/provider settings explicitly rather than relying only on hidden UI.
- Offer forgotten-password recovery only when the recovery email, allowed redirect,
  token exchange and actual delivery are verified. Do not assume built-in email delivery
  is production-ready. Do not trigger a real email during exploration/local fixture tests.

## Proposed stages: Action / Proof

| Stage | Action | Required proof |
| --- | --- | --- |
| 1 | Confirm existing owner UUID/email, provider/signup/recovery settings and username mapping; lock threat model and rollout | Read-only configuration receipt; same-UID design; no new owner or data migration |
| 2 | Add password setup, login form/server handler and session/owner verification | TDD unit/integration: valid/invalid input, non-owner, cookie persistence, refresh/logout, unchanged UID/ownership |
| 3 | Add recovery and abuse controls | Generic credential errors; cloud-effective attempt limits; CSRF/origin protection, safe redirects, no credentials/tokens in URLs/logs; expired/reused recovery token tests |
| 4 | Verify and separately authorize activation/release | Browser desktop/mobile/accessibility; real owner login/data access, outsider denial, scanner/journal/export regressions; typecheck/lint/build/security review; deployed SHA and rollback plan |

Rate limiting must work across Vercel instances and cover underlying Auth endpoints too.
Server-side Auth requests need explicit review of IP attribution and Supabase limits;
an in-memory counter is insufficient. CAPTCHA can be included if the selected deployment
needs it. No new paid service, dependency or DB migration is assumed by this design.

Implementation choice: one explicit POST `/auth/password` route covers all password
operations. Prepare a Vercel WAF rate-limit rule for this exact path and method, 5 requests
per60 seconds per source IP, while retaining native Supabase Auth endpoint limits.
Production readiness requires the rule to be verified; no process-local limiter or trusted
user-supplied forwarding header is substituted. No CAPTCHA service is required for this V1.
Local-test bypass is limited to non-production with both app/Auth hosts on loopback.

Production provider/credential setup and release need their own task-local authorization.
The owner sets their password through a verified UI, never through chat or a committed file.
If password rollout fails, keep the working GitHub route and revert the frontend release;
do not delete or reassign the existing Auth user.

## Official references checked

- [Add password to an existing OAuth account](https://supabase.com/docs/guides/auth/auth-identity-linking#how-to-add-emailpassword-sign-in-to-an-oauth-account).
- [Password sign-in API](https://supabase.com/docs/reference/javascript/auth-signinwithpassword).
- [Password and recovery flows](https://supabase.com/docs/guides/auth/passwords).
- [SSR cookies](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs).
- [Auth rate limits and server IP forwarding](https://supabase.com/docs/guides/auth/rate-limits).

## Implemented boundaries and operator activation

The pure policy/core and bounded HTTP controller live in `src/lib/password-auth-*.ts`.
The server adapter uses the existing public-key SSR client and buffers cookie writes until
the configured UUID/email and enabled owner membership pass. It does not use service role.
`POST /auth/password` accepts only bounded JSON and the fixed configured Origin; all
password intents share that path. Inputs/errors never expose the configured email/password.
Recent SDK-verified AMR (10 minutes) is required for password changes; recovery specifically
needs recovery AMR. A refreshed session alone is insufficient. Password changes globally
sign out; a failed logout truthfully reports that the password was already saved.
Query `flow=recovery` selects the callback destination, never permission to change password.
New passwords require 12 characters and at most72 UTF-8 bytes; input whitespace is preserved.

Release activation checklist (not performed by local implementation):

1. Verify this Vercel project's available rate-limit rule, configure exact path
   `/auth/password`, methodPOST, source-IP limit5/60seconds, and prove blocking across
   requests/instances. Review native Supabase Auth rate limits and password-change/reauth
   settings separately; direct Auth endpoints bypass Vercel and this app's recent-AMR gate.
   These app checks do not replace provider authorization/session policy or data RLS.
   Do not rely on untrusted forwarded headers or an in-memory map.
2. Configure server-only `APP_OWNER_USER_ID`, `OWNER_LOGIN_USERNAME=daddyjj`,
   `OWNER_LOGIN_EMAIL`, `APP_ORIGIN` from the existing confirmed owner identity. Never create
   a replacement user. Set `AUTH_PASSWORD_PROTECTION=vercel-waf` only after step1 verification.
   The flag is an operator declaration, not a runtime check of the cloud rule.
3. Keep `AUTH_PASSWORD_RECOVERY_READY=false` until SMTP delivery, exact production callback
   allowlist, same-browser PKCE, expired/reused links and recovery AMR have been verified.
   Management Auth config GET403 in the read-only audit remains unresolved; do not infer settings.
4. Owner logs in via GitHub, sets the password on `/auth/check` within10minutes, then uses
   `daddyjj` on `/login`. Never send a password through chat/env/operator scripts. Verify same
   UUID, journal/scanner reads, logout, outsider denial and no secret in logs/network URLs.
5. On failed release keep GitHub fallback, disable the protection flag/password capability,
   or restore the last verified frontend deployment. Do not delete/reassign Auth users.

No DB migration, dependency, financial arithmetic, RLS or backend change is required.
**Production mapping and WAF enforcement verified 22 October 2026.** Password form is live;
recovery delivery, native advanced Auth settings and real owner password login remain
NOT VERIFIED. [Status](../IMPLEMENTATION_STATUS.md) owns the receipt and owner acceptance steps.
