// Test-only loopback Auth transport: no real email, remote calls or persisted data.
import { createServer } from "node:http";
import { createHash, createHmac } from "node:crypto";

const origin = "http://127.0.0.1:3061";
const ownerId = "22222222-2222-4222-8222-222222222222";
const outsiderId = "33333333-3333-4333-8333-333333333333";
const sessionId = "44444444-4444-4444-8444-444444444444";
const fixturePassword = "Local-only-password-123!";
const scenarios = new Set(["owner", "invalid-credentials", "limited", "backend-error", "delayed",
  "outsider", "disabled", "membership-error", "stale-auth", "oauth", "recovery",
  "recovery-stale", "recovery-expired", "logout-error", "update-error", "refresh"]);
let state = { scenario: "owner", calls: [], usedCodes: new Set(), currentPassword: fixturePassword, pkceChallenge: null };

function user() {
  return { id: state.scenario === "outsider" ? outsiderId : ownerId,
    aud: "authenticated", role: "authenticated", email: "owner@example.test",
    email_confirmed_at: "2026-01-01T00:00:00Z", is_anonymous: false,
    app_metadata: { provider: "email", providers: ["email", "github"] }, user_metadata: {},
    created_at: "2026-01-01T00:00:00Z" };
}
function token(method = "password", expired = false) {
  const now = Math.floor(Date.now() / 1000);
  const stale = ["stale-auth", "recovery-stale"].includes(state.scenario);
  const claims = { sub: user().id, aud: "authenticated", role: "authenticated",
    iss: `${origin}/auth/v1`, session_id: sessionId, iat: now,
    exp: now + (expired ? -60 : 3600), amr: [{ method, timestamp: now - (stale ? 3600 : 0) }] };
  const body = [{ alg: "HS256", typ: "JWT" }, claims].map(v => Buffer.from(JSON.stringify(v)).toString("base64url")).join(".");
  return `${body}.${createHmac("sha256", "test-only-key").update(body).digest("base64url")}`;
}
function session(method = "password", expired = false) {
  return { access_token: token(method, expired), refresh_token: "test-only-refresh", token_type: "bearer",
    expires_in: expired ? -60 : 3600, expires_at: Math.floor(Date.now() / 1000) + (expired ? -60 : 3600), user: user() };
}
function selectedMethod() {
  return state.scenario.startsWith("recovery") ? "recovery" : state.scenario === "oauth" ? "oauth" : "password";
}
function authenticated(request) {
  try {
    const encoded = request.headers.authorization?.replace(/^Bearer /, "");
    const [header, payload, signature] = encoded?.split(".") ?? [];
    if (!header || !payload || signature !== createHmac("sha256", "test-only-key").update(`${header}.${payload}`).digest("base64url")) return false;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
    return claims.sub === user().id && claims.exp > Math.floor(Date.now() / 1000) && claims.iss === `${origin}/auth/v1`;
  } catch { return false; }
}
const server = createServer(async (req, res) => {
  const url = new URL(req.url, origin);
  let raw = "";
  for await (const chunk of req) raw += chunk;
  let body;
  try { body = raw ? JSON.parse(raw) : null; } catch { body = null; }
  const send = (value, status = 200) => {
    res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Supabase-Api-Version": "2024-01-01" });
    res.end(JSON.stringify(value));
  };
  if (url.pathname === "/__scenario") {
    if (!scenarios.has(body?.scenario)) return send({ code: "invalid_test_scenario" }, 400);
    state = { scenario: body.scenario, calls: [], usedCodes: new Set(), currentPassword: fixturePassword, pkceChallenge: null };
    return send({ ok: true, test_only: true });
  }
  // Aggregate-only diagnostics: never echo request bodies, identity, password or JWT.
  if (url.pathname === "/__calls") return send({ test_only: true, calls: state.calls });
  if (url.pathname === "/__session") return send({ test_only: true, session: session(selectedMethod(), body?.expired === true) });
  state = { ...state, calls: [...state.calls, { path: url.pathname, method: req.method, grant: url.searchParams.get("grant_type") }] };
  if (state.scenario === "delayed") await new Promise(done => setTimeout(done, 400));
  if (url.pathname === "/auth/v1/token") {
    const grant = url.searchParams.get("grant_type");
    if (grant === "pkce") {
      const challenge = typeof body?.code_verifier === "string"
        ? createHash("sha256").update(body.code_verifier).digest("base64url") : null;
      if (body?.auth_code !== "test-only-good-code" || !challenge || challenge !== state.pkceChallenge || state.usedCodes.has(body.auth_code)
        || state.scenario === "recovery-expired") return send({ code: "flow_state_expired", message: "Synthetic code rejected" }, 400);
      state = { ...state, usedCodes: new Set([...state.usedCodes, body.auth_code]) };
      return send(session(selectedMethod()));
    }
    if (grant === "refresh_token") return send(session(selectedMethod()));
    if (state.scenario === "limited") return send({ code: "over_request_rate_limit", message: "Synthetic rate limit" }, 429);
    if (state.scenario === "backend-error") return send({ code: "unexpected_failure", message: "Synthetic provider failure" }, 503);
    if (state.scenario === "invalid-credentials" || body?.email !== "owner@example.test" || body?.password !== state.currentPassword)
      return send({ code: "invalid_credentials", message: "Synthetic credentials rejected" }, 400);
    return send(session(selectedMethod()));
  }
  if (url.pathname === "/auth/v1/user") {
    if (!authenticated(req)) return send({ code: "bad_jwt" }, 401);
    if (req.method === "PUT") {
      if (state.scenario === "update-error") return send({ code: "weak_password" }, 422);
      state = { ...state, currentPassword: body?.password ?? state.currentPassword };
    }
    return send(user());
  }
  if (url.pathname === "/auth/v1/logout") return state.scenario === "logout-error"
    ? send({ code: "unexpected_failure", message: "Synthetic logout failure" }, 503) : send({});
  if (url.pathname === "/auth/v1/recover") {
    if (typeof body?.code_challenge !== "string" || body.code_challenge_method !== "s256")
      return send({ code: "bad_code_verifier" }, 400);
    state = { ...state, pkceChallenge: body.code_challenge };
    return send({});
  }
  if (url.pathname === "/rest/v1/app_members") {
    if (!authenticated(req)) return send({ code: "42501" }, 401);
    if (state.scenario === "membership-error") return send({ code: "08006" }, 503);
    return send(state.scenario === "outsider" ? null : { role: "owner", enabled: state.scenario !== "disabled" });
  }
  if (url.pathname === "/rest/v1/deployment_settings") return send({ data_mode: "fixture" });
  if (url.pathname === "/rest/v1/scan_runs") return send(null);
  return send({ code: "TEST_UNEXPECTED_REQUEST" }, 404);
});
server.listen(3061, "127.0.0.1", () => process.send?.({ ready: true }));
function stop() { server.closeAllConnections(); server.close(() => process.exit(0)); }
process.on("message", message => { if (message?.stop === true) stop(); });
process.on("disconnect", stop);
