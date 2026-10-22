import assert from 'node:assert/strict';
import { test } from 'node:test';
import { passwordConfig, parsePasswordInput, safePasswordReturn, isConfiguredOwner, freshPasswordAuth } from '../src/lib/password-auth-policy.ts';
import { runPasswordAuth } from '../src/lib/password-auth-core.ts';

const ownerId = '11111111-1111-4111-8111-111111111111';
const sessionId = '11111111-2222-4333-8444-555555555555';
const now = 1_792_540_000;
const password = ' a long password ';
const env = {
  APP_OWNER_USER_ID: ownerId, OWNER_LOGIN_USERNAME: 'daddyjj', OWNER_LOGIN_EMAIL: 'owner@example.test',
  APP_ORIGIN: 'https://scanner.example.test', NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  AUTH_PASSWORD_PROTECTION: 'vercel-waf', VERCEL: '1', NODE_ENV: 'production', AUTH_PASSWORD_RECOVERY_READY: 'true',
};
const config = {
  username: 'daddyjj', email: 'owner@example.test', ownerId, origin: 'https://scanner.example.test',
  recoveryEnabled: true, issuer: 'https://project.supabase.co/auth/v1',
};
const owner = { id: ownerId, email: config.email, email_confirmed_at: '2026-01-01T00:00:00Z', is_anonymous: false };
const claims = {
  sub: ownerId, iss: config.issuer, aud: 'authenticated', role: 'authenticated', exp: now + 3600,
  session_id: sessionId, amr: [{ method: 'oauth', timestamp: now - 10 }],
};
function port(overrides = {}) {
  const calls = [];
  const defaults = {
    signIn: async (...args) => { calls.push(['signIn', ...args]); return { user: owner, error: null }; },
    ownerMembership: async (...args) => { calls.push(['membership', ...args]); return { role: 'owner', enabled: true }; },
    currentUser: async () => { calls.push(['currentUser']); return { user: owner, error: null }; },
    verifiedClaims: async () => { calls.push(['claims']); return claims; },
    updatePassword: async (...args) => { calls.push(['updatePassword', ...args]); return { user: owner, error: null }; },
    recover: async (...args) => { calls.push(['recover', ...args]); return { error: null }; },
    signOut: async (...args) => { calls.push(['signOut', ...args]); return { error: null }; },
  };
  return { calls, ...defaults, ...overrides };
}
const login = { intent: 'login', username: 'daddyjj', password };
const change = { intent: 'change', password, confirmPassword: password };
const recovery = { ...change, intent: 'recovery' };

test('password config binds the existing owner and enabled cloud protection', () => {
  assert.deepEqual(passwordConfig(env), config);
  assert.equal(passwordConfig({ ...env, AUTH_PASSWORD_RECOVERY_READY: 'false' }).recoveryEnabled, false);
  assert.equal(passwordConfig({ ...env, OWNER_LOGIN_EMAIL: ' OWNER@EXAMPLE.TEST ' }).email, config.email);
  assert.equal(passwordConfig({ ...env, APP_ORIGIN: config.origin + '/' }).origin, config.origin);
});
test('password config fails closed on missing, malformed or bypass protection settings', () => {
  for (const key of ['APP_OWNER_USER_ID', 'OWNER_LOGIN_USERNAME', 'OWNER_LOGIN_EMAIL', 'APP_ORIGIN', 'NEXT_PUBLIC_SUPABASE_URL', 'AUTH_PASSWORD_PROTECTION'])
    assert.equal(passwordConfig({ ...env, [key]: undefined }), null, key);
  for (const patch of [
    { APP_OWNER_USER_ID: 'owner' }, { APP_OWNER_USER_ID: '00000000-0000-0000-0000-000000000000' },
    { OWNER_LOGIN_USERNAME: 'a b' }, { OWNER_LOGIN_USERNAME: 'A'.repeat(33) }, { OWNER_LOGIN_EMAIL: 'owner' },
    { OWNER_LOGIN_EMAIL: 'a@b.test\nCc:bad' }, { APP_ORIGIN: 'https://scanner.example.test/path' },
    { APP_ORIGIN: 'https://user:pass@scanner.example.test' }, { APP_ORIGIN: 'https://scanner.example.test?x=1' },
    { NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co/path' }, { NEXT_PUBLIC_SUPABASE_URL: 'javascript:alert(1)' },
    { AUTH_PASSWORD_PROTECTION: 'none' }, { VERCEL: '0' }, { APP_ORIGIN: 'http://scanner.example.test' },
    { AUTH_PASSWORD_PROTECTION: 'local-test' },
  ]) assert.equal(passwordConfig({ ...env, ...patch }), null, JSON.stringify(patch));
});
test('local protection is restricted to nonproduction and both loopback endpoints', () => {
  const local = { ...env, NODE_ENV: 'test', VERCEL: undefined, AUTH_PASSWORD_PROTECTION: 'local-test', APP_ORIGIN: 'http://127.0.0.1:3050', NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321' };
  assert.ok(passwordConfig(local));
  assert.equal(passwordConfig({ ...local, NODE_ENV: 'production' }), null);
  assert.equal(passwordConfig({ ...local, APP_ORIGIN: 'http://127.0.0.1.evil.test' }), null);
  assert.equal(passwordConfig({ ...local, NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co' }), null);
});
test('password input is strict, normalizes alias, preserves password whitespace', () => {
  assert.deepEqual(parsePasswordInput({ ...login, username: ' DADDYJJ ', returnTo: '/journal?tab=paper' }), { ...login, returnTo: '/journal?tab=paper' });
  assert.deepEqual(parsePasswordInput({ intent: 'recover', username: 'DaddyJJ' }), { intent: 'recover', username: 'daddyjj' });
  assert.deepEqual(parsePasswordInput(change), change);
  assert.deepEqual(parsePasswordInput(recovery), recovery);
  for (const input of [null, [], 'login', {}, { ...login, extra: 'unexpected' }, { ...login, intent: 'signup' },
    { ...login, username: 123 }, { ...login, username: '' }, { ...login, username: 'дaddyjj' },
    { ...login, username: 'a'.repeat(33) }, { ...login, password: '' }, { ...login, password: 123 },
    { ...login, password: 'a'.repeat(73) }, { ...login, password: 'é'.repeat(37) },
    { ...login, confirmPassword: password }, { ...login, returnTo: 123 },
    { ...change, password: 'short', confirmPassword: 'short' }, { ...change, confirmPassword: password + 'x' },
    { ...change, username: 'daddyjj' }, { ...change, password: 'a'.repeat(73), confirmPassword: 'a'.repeat(73) },
    { intent: 'recover', username: 'daddyjj', password },
  ]) assert.equal(parsePasswordInput(input), null, JSON.stringify(input));
  assert.equal(parsePasswordInput({ ...login, password: 'é'.repeat(36) }).password.length, 36);
});
test('safe local returns allow known app reads and reject hidden redirect or control paths', () => {
  for (const value of ['/scanner?section=quality&page=3', '/journal?tab=paper', '/analytics?tab=signals', '/operations', '/auth/check', '/chart/ADRO?view=snapshot'])
    assert.equal(safePasswordReturn(value), value);
  assert.equal(safePasswordReturn('/'), '/scanner');
  for (const value of [undefined, null, 123, '', 'https://evil.test', '//evil.test', '/\\evil.test', '/scanner#unsafe',
    '/scanner/../login', '/scanner%2f..%2flogin', '/scanner?x=%0aevil', '/scanner?x=%250aevil', '/scanner?x=%5cevil',
    '/api/password-auth', '/login', '/unknown', '/chart/../login', '/scanner?x=' + 'a'.repeat(4096), '/scanner?x=%', '/scanner?x=%252525252561',
  ]) assert.equal(safePasswordReturn(value), '/scanner', String(value));
});
test('owner requires exact UUID, verified configured email and nonanonymous identity', () => {
  assert.equal(isConfiguredOwner(owner, config), true);
  assert.equal(isConfiguredOwner({ ...owner, email: ' OWNER@EXAMPLE.TEST ' }, config), true);
  for (const user of [null, {}, { ...owner, id: sessionId }, { ...owner, email: 'other@example.test' },
    { ...owner, email: undefined }, { ...owner, email_confirmed_at: null }, { ...owner, email_confirmed_at: 'invalid' },
    { ...owner, is_anonymous: true }]) assert.equal(isConfiguredOwner(user, config), false);
});
test('fresh claims bind verified owner session and recent OAuth/password auth, never refresh alone', () => {
  assert.equal(freshPasswordAuth(claims, config, 'change', now), true);
  assert.equal(freshPasswordAuth({ ...claims, amr: [{ method: 'password', timestamp: now - 600 }] }, config, 'change', now), true);
  assert.equal(freshPasswordAuth({ ...claims, aud: ['authenticated'] }, config, 'change', now), true);
  for (const patch of [{ sub: sessionId }, { role: 'anon' }, { aud: 'anon' }, { iss: 'https://other/auth/v1' },
    { exp: now }, { exp: '9999999999' }, { exp: Number.NaN }, { exp: Number.POSITIVE_INFINITY }, { session_id: '' }, { session_id: 'not-uuid' }, { amr: null },
    { amr: [{ method: 'token_refresh', timestamp: now }] }, { amr: [{ method: 'oauth', timestamp: now - 601 }] },
    { amr: [{ method: 'oauth', timestamp: now + 1 }] }, { amr: [{ method: 'oauth', timestamp: now - 0.5 }] },
    { amr: [{ method: 'recovery', timestamp: now }] }, { amr: [null, {}] },
  ]) assert.equal(freshPasswordAuth({ ...claims, ...patch }, config, 'change', now), false, JSON.stringify(patch));
  assert.equal(freshPasswordAuth(null, config, 'change', now), false);
  assert.equal(freshPasswordAuth(claims, config, 'change', Number.NaN), false);
});
test('recovery needs its own fresh recovery AMR, not normal OAuth/password', () => {
  assert.equal(freshPasswordAuth({ ...claims, amr: [{ method: 'recovery', timestamp: now - 1 }] }, config, 'recovery', now), true);
  assert.equal(freshPasswordAuth(claims, config, 'recovery', now), false);
  assert.equal(freshPasswordAuth({ ...claims, amr: [{ method: 'password', timestamp: now }] }, config, 'recovery', now), false);
});
test('login succeeds only after exact owner identity and active membership, retaining return query', async () => {
  const api = port();
  const result = await runPasswordAuth({ ...login, returnTo: '/journal?tab=paper' }, config, api, now);
  assert.equal(result.ok, true); assert.equal(result.status, 200); assert.equal(result.commitCookies, true);
  assert.equal(result.redirect, '/journal?tab=paper');
  assert.deepEqual(api.calls, [['signIn', config.email, password], ['membership', ownerId]]);
});
test('wrong aliases and passwords have identical generic errors without email exposure', async () => {
  const api = port();
  const alias = await runPasswordAuth({ ...login, username: 'stranger' }, config, api, now);
  assert.equal(api.calls.length, 0);
  const wrong = await runPasswordAuth(login, config, port({ signIn: async () => ({ user: null, error: { status: 400, code: 'invalid_credentials' } }) }), now);
  assert.deepEqual(alias, wrong); assert.equal(alias.status, 401); assert.notEqual(alias.commitCookies, true);
  assert.doesNotMatch(JSON.stringify(alias), /owner@example|daddyjj|invalid_credentials|3e877216/);
});
test('login rejects nonowner, unverified identity and missing/disabled/wrong-role membership without committing cookies', async () => {
  for (const candidate of [{ ...owner, id: sessionId }, { ...owner, email_confirmed_at: null }, null]) {
    const api = port({ signIn: async () => ({ user: candidate, error: null }) });
    assert.equal((await runPasswordAuth(login, config, api, now)).status, 401);
    assert.deepEqual(api.calls, candidate ? [['signOut', 'local']] : []);
  }
  for (const membership of [null, { role: 'owner', enabled: false }, { role: 'reader', enabled: true }]) {
    const result = await runPasswordAuth(login, config, port({ ownerMembership: async () => membership }), now);
    assert.equal(result.status, 401); assert.notEqual(result.commitCookies, true);
  }
});
test('malformed inputs and unconfigured service fail before any auth operation', async () => {
  const api = port();
  assert.equal((await runPasswordAuth({}, config, api, now)).status, 400);
  assert.equal((await runPasswordAuth(login, null, api, now)).status, 503);
  assert.equal(api.calls.length, 0);
});
test('rate limits map safely and upstream failures are unavailable rather than bad credentials', async () => {
  for (const [error, status] of [[{ status: 429 }, 429], [{ code: 'over_request_rate_limit' }, 429], [{ status: 503 }, 503], [{ code: 'unexpected_failure' }, 503]]) {
    const result = await runPasswordAuth(login, config, port({ signIn: async () => ({ user: null, error }) }), now);
    assert.equal(result.status, status); assert.notEqual(result.commitCookies, true);
    assert.doesNotMatch(JSON.stringify(result), /unexpected_failure|over_request_rate_limit/);
  }
});
test('all thrown port errors fail closed without raw errors or committing partial login', async () => {
  for (const method of ['signIn', 'ownerMembership']) {
    const api = port({ [method]: async () => { throw new Error('private-key-here'); } });
    const result = await runPasswordAuth(login, config, api, now);
    assert.equal(result.status, 503); assert.notEqual(result.commitCookies, true);
    assert.doesNotMatch(JSON.stringify(result), /private-key-here/);
  }
});
test('recovery hides unknown usernames and sends only a fixed owner callback with PKCE cookies', async () => {
  const api = port();
  const unknown = await runPasswordAuth({ intent: 'recover', username: 'stranger' }, config, api, now);
  assert.equal(unknown.ok, true); assert.equal(unknown.status, 200); assert.notEqual(unknown.commitCookies, true);
  assert.equal(api.calls.length, 0);
  const known = await runPasswordAuth({ intent: 'recover', username: 'daddyjj', returnTo: '//evil.test' }, config, api, now);
  assert.equal(known.ok, true); assert.equal(known.message, unknown.message); assert.equal(known.commitCookies, true);
  assert.deepEqual(api.calls, [['recover', config.email, config.origin + '/auth/callback?flow=recovery']]);
});
test('recovery disabled, unavailable, limited or thrown never commits PKCE cookies', async () => {
  const input = { intent: 'recover', username: 'daddyjj' };
  const api = port();
  assert.equal((await runPasswordAuth(input, { ...config, recoveryEnabled: false }, api, now)).status, 503);
  assert.equal(api.calls.length, 0);
  for (const [override, status] of [[async () => ({ error: { status: 429 } }), 429], [async () => ({ error: { status: 500 } }), 503], [async () => { throw new Error('secret'); }, 503]]) {
    const result = await runPasswordAuth(input, config, port({ recover: override }), now);
    assert.equal(result.status, status); assert.notEqual(result.commitCookies, true);
  }
});
test('password change rechecks identity, membership and fresh auth then saves and signs out', async () => {
  const api = port();
  const result = await runPasswordAuth(change, config, api, now);
  assert.equal(result.ok, true); assert.equal(result.commitCookies, true); assert.equal(result.redirect, '/login?password=updated');
  assert.deepEqual(api.calls, [['currentUser'], ['membership', ownerId], ['claims'], ['updatePassword', password], ['signOut', 'global']]);
});
test('recovery update uses recovery AMR and logs out after saving', async () => {
  const api = port({ verifiedClaims: async () => ({ ...claims, amr: [{ method: 'recovery', timestamp: now }] }) });
  const result = await runPasswordAuth(recovery, config, api, now);
  assert.equal(result.ok, true); assert.ok(api.calls.some(call => call[0] === 'updatePassword'));
});
test('disabled recovery also refuses direct recovery password updates', async () => {
  const api = port({ verifiedClaims: async () => ({ ...claims, amr: [{ method: 'recovery', timestamp: now }] }) });
  const result = await runPasswordAuth(recovery, { ...config, recoveryEnabled: false }, api, now);
  assert.equal(result.status, 503); assert.notEqual(result.commitCookies, true);
  assert.equal(api.calls.length, 0);
});
test('password updates never run for revoked owner, stale auth, missing/foreign claims or wrong AMR', async () => {
  for (const override of [
    { currentUser: async () => ({ user: null, error: { status: 401 } }) },
    { currentUser: async () => ({ user: { ...owner, id: sessionId }, error: null }) },
    { ownerMembership: async () => null }, { ownerMembership: async () => ({ role: 'owner', enabled: false }) },
    { verifiedClaims: async () => null }, { verifiedClaims: async () => ({ ...claims, sub: sessionId }) },
    { verifiedClaims: async () => ({ ...claims, amr: [{ method: 'token_refresh', timestamp: now }] }) },
  ]) {
    const api = port(override);
    const result = await runPasswordAuth(change, config, api, now);
    assert.equal(result.ok, false); assert.notEqual(result.commitCookies, true);
    assert.equal(api.calls.some(call => call[0] === 'updatePassword'), false);
  }
  const api = port();
  assert.equal((await runPasswordAuth(recovery, config, api, now)).ok, false);
  assert.equal(api.calls.some(call => call[0] === 'updatePassword'), false);
});
test('update failures distinguish auth/limit/unavailable, never sign out or commit a denied save', async () => {
  for (const [error, expected] of [[{ status: 401 }, 401], [{ status: 429 }, 429], [{ status: 500 }, 503], [{ status: 422, code: 'same_password' }, 400]]) {
    const api = port({ updatePassword: async () => ({ user: null, error }) });
    const result = await runPasswordAuth(change, config, api, now);
    assert.equal(result.status, expected); assert.equal(result.ok, false); assert.notEqual(result.commitCookies, true);
    assert.equal(api.calls.some(call => call[0] === 'signOut'), false);
  }
});
test('an update response with another identity is refused and cannot commit cookies', async () => {
  const api = port({ updatePassword: async () => ({ user: { ...owner, id: sessionId }, error: null }) });
  const result = await runPasswordAuth(change, config, api, now);
  assert.equal(result.status, 503); assert.notEqual(result.commitCookies, true);
  assert.equal(api.calls.some(call => call[0] === 'signOut'), false);
});
test('saved password remains truthfully saved when global signout fails or throws', async () => {
  for (const signOut of [async () => ({ error: { status: 500 } }), async () => { throw new Error('secret'); }]) {
    const result = await runPasswordAuth(change, config, port({ signOut }), now);
    assert.equal(result.ok, false); assert.equal(result.status, 503); assert.equal(result.code, 'password_saved_logout_pending');
    assert.equal(result.commitCookies, true); assert.ok(result.redirect); assert.doesNotMatch(result.message, /gagal menyimpan|secret/);
  }
});
test('throws/current-user failures fail closed at every password-update boundary', async () => {
  for (const method of ['currentUser', 'ownerMembership', 'verifiedClaims', 'updatePassword']) {
    const api = port({ [method]: async () => { throw new Error('secret'); } });
    const result = await runPasswordAuth(change, config, api, now);
    assert.equal(result.status, 503); assert.notEqual(result.commitCookies, true);
    assert.doesNotMatch(JSON.stringify(result), /secret/);
  }
  assert.equal((await runPasswordAuth(change, config, port({ currentUser: async () => ({ user: null, error: { status: 503 } }) }), now)).status, 503);
});
