import {
  freshPasswordAuth, isConfiguredOwner, parsePasswordInput, safePasswordReturn,
  type AuthUser, type OwnerPasswordConfig, type PasswordInput,
} from './password-auth-policy.ts';

export type { AuthUser, OwnerPasswordConfig, PasswordInput } from './password-auth-policy.ts';
export type AuthError = { status?: number; code?: string };
type UserResponse = { user: AuthUser | null; error: AuthError | null };
export interface PasswordAuthPort {
  signIn(email: string, password: string): Promise<UserResponse>;
  ownerMembership(id: string): Promise<{ role: string; enabled: boolean } | null>;
  currentUser(): Promise<UserResponse>;
  verifiedClaims(): Promise<Record<string, unknown> | null>;
  updatePassword(password: string): Promise<UserResponse>;
  recover(email: string, redirectTo: string): Promise<{ error: AuthError | null }>;
  signOut(scope?: 'local' | 'global'): Promise<{ error: AuthError | null }>;
}
export type PasswordResult = {
  ok: boolean; status: number; code: string; message: string;
  redirect?: string; commitCookies?: boolean;
};

const MESSAGES = {
  unavailable: 'Layanan login belum tersedia. Silakan coba lagi nanti.',
  credentials: 'Username atau password tidak sesuai.',
  limited: 'Terlalu banyak percobaan. Silakan coba lagi nanti.',
  invalid: 'Periksa kembali isian formulir.',
  fresh: 'Silakan masuk kembali sebelum mengatur password.',
  recovery: 'Jika akun sesuai dan pemulihan tersedia, petunjuk akan dikirim ke email terdaftar.',
};
function failure(status: number, code: string, message: string): PasswordResult {
  return { ok: false, status, code, message, commitCookies: false };
}
function unavailable(): PasswordResult {
  return failure(503, 'auth_unavailable', MESSAGES.unavailable);
}
function denied(): PasswordResult {
  return failure(401, 'login_rejected', MESSAGES.credentials);
}
function authFailure(error: AuthError, update = false): PasswordResult {
  if (error.status === 429 || ['over_request_rate_limit', 'over_email_send_rate_limit', 'too_many_requests'].includes(error.code ?? ''))
    return failure(429, 'rate_limited', MESSAGES.limited);
  if (error.status === 401 || error.status === 403 || error.code === 'invalid_credentials') return denied();
  if (update && error.status === 422) return failure(400, 'password_rejected', 'Password belum dapat digunakan. Periksa persyaratan atau gunakan password berbeda.');
  return unavailable();
}
async function activeOwner(user: AuthUser | null, config: OwnerPasswordConfig, port: PasswordAuthPort): Promise<boolean> {
  if (!isConfiguredOwner(user, config)) return false;
  const membership = await port.ownerMembership(config.ownerId);
  return membership?.role === 'owner' && membership.enabled === true;
}

async function login(input: PasswordInput, config: OwnerPasswordConfig, port: PasswordAuthPort): Promise<PasswordResult> {
  if (input.username !== config.username) return denied();
  const response = await port.signIn(config.email, input.password!);
  if (response.error) return authFailure(response.error);
  if (!await activeOwner(response.user, config, port)) {
    if (response.user && (await port.signOut('local')).error) return unavailable();
    return denied();
  }
  return { ok: true, status: 200, code: 'signed_in', message: 'Berhasil masuk.', redirect: safePasswordReturn(input.returnTo), commitCookies: true };
}
async function recover(input: PasswordInput, config: OwnerPasswordConfig, port: PasswordAuthPort): Promise<PasswordResult> {
  if (!config.recoveryEnabled) return unavailable();
  const generic = { ok: true, status: 200, code: 'recovery_requested', message: MESSAGES.recovery, commitCookies: false };
  if (input.username !== config.username) return generic;
  const response = await port.recover(config.email, `${config.origin}/auth/callback?flow=recovery`);
  if (response.error) return authFailure(response.error);
  return { ...generic, commitCookies: true };
}
async function finishPasswordChange(port: PasswordAuthPort): Promise<PasswordResult> {
  try {
    if (!(await port.signOut('global')).error)
      return { ok: true, status: 200, code: 'password_updated', message: 'Password tersimpan. Silakan masuk kembali.', redirect: '/login?password=updated', commitCookies: true };
  } catch { /* The password is already saved; do not misreport this as a failed update. */ }
  return {
    ok: false, status: 503, code: 'password_saved_logout_pending', commitCookies: true,
    message: 'Password tersimpan, tetapi pengakhiran sesi belum selesai. Silakan keluar lalu masuk kembali.',
    redirect: '/auth/error?reason=password-logout',
  };
}
async function change(input: PasswordInput, config: OwnerPasswordConfig, port: PasswordAuthPort, now: number): Promise<PasswordResult> {
  if (input.intent === 'recovery' && !config.recoveryEnabled) return unavailable();
  const current = await port.currentUser();
  if (current.error) return authFailure(current.error);
  if (!await activeOwner(current.user, config, port)) return denied();
  const mode = input.intent === 'recovery' ? 'recovery' : 'change';
  if (!freshPasswordAuth(await port.verifiedClaims(), config, mode, now))
    return failure(401, 'reauthentication_required', MESSAGES.fresh);
  const updated = await port.updatePassword(input.password!);
  if (updated.error) return authFailure(updated.error, true);
  if (!isConfiguredOwner(updated.user, config)) return unavailable();
  return finishPasswordChange(port);
}

/** Cookies are committed by the adapter only after all required owner checks pass. */
export async function runPasswordAuth(input: unknown, config: OwnerPasswordConfig | null, port: PasswordAuthPort, nowSeconds: number): Promise<PasswordResult> {
  const parsed = parsePasswordInput(input);
  if (!parsed) return failure(400, 'invalid_input', MESSAGES.invalid);
  if (!config) return unavailable();
  try {
    if (parsed.intent === 'login') return await login(parsed, config, port);
    if (parsed.intent === 'recover') return await recover(parsed, config, port);
    return await change(parsed, config, port, nowSeconds);
  } catch { return unavailable(); }
}
