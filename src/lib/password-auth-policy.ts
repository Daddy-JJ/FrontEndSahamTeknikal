export type OwnerPasswordConfig = {
  username: string; email: string; ownerId: string; origin: string;
  recoveryEnabled: boolean; issuer: string;
};
export type PasswordIntent = 'login' | 'recover' | 'change' | 'recovery';
export type PasswordInput = {
  intent: PasswordIntent; username?: string; password?: string;
  confirmPassword?: string; returnTo?: string;
};
export type AuthUser = {
  id: string; email?: string | null; email_confirmed_at?: string | null; is_anonymous?: boolean;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const USERNAME = /^[a-z0-9][a-z0-9_.-]{0,31}$/;
const FRESH_AUTH_SECONDS = 600;
const RETURN_ORIGIN = 'https://password-return.internal';
const RETURN_PATH = /^(?:\/scanner|\/journal|\/analytics|\/operations|\/auth\/check|\/chart\/[A-Za-z0-9_-]{1,32})$/;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function normalizedUsername(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 128) return null;
  const username = value.trim().toLowerCase();
  return USERNAME.test(username) ? username : null;
}
function validPassword(value: unknown, isNew: boolean): value is string {
  if (typeof value !== 'string') return false;
  const bytes = new TextEncoder().encode(value).length;
  return bytes > 0 && bytes <= 72 && (!isNew || Array.from(value).length >= 12);
}
function allowedKeys(input: Record<string, unknown>, intent: PasswordIntent): boolean {
  const fields = intent === 'login' ? ['username', 'password'] :
    intent === 'recover' ? ['username'] : ['password', 'confirmPassword'];
  return Object.keys(input).every(key => ['intent', 'returnTo', ...fields].includes(key));
}

/** Preserve password whitespace; normalization belongs only to the username alias. */
export function parsePasswordInput(value: unknown): PasswordInput | null {
  if (!record(value)) return null;
  const intent = value.intent;
  if (intent !== 'login' && intent !== 'recover' && intent !== 'change' && intent !== 'recovery') return null;
  if (!allowedKeys(value, intent) || (value.returnTo !== undefined && typeof value.returnTo !== 'string')) return null;
  if (typeof value.returnTo === 'string' && value.returnTo.length > 4096) return null;
  const route = value.returnTo === undefined ? {} : { returnTo: value.returnTo as string };
  if (intent === 'recover' || intent === 'login') {
    const username = normalizedUsername(value.username);
    if (!username || (intent === 'login' && !validPassword(value.password, false))) return null;
    return intent === 'recover' ? { intent, username, ...route } : { intent, username, password: value.password as string, ...route };
  }
  if (!validPassword(value.password, true) || value.confirmPassword !== value.password) return null;
  return { intent, password: value.password, confirmPassword: value.confirmPassword as string, ...route };
}

/** Decode repeatedly so double-encoded controls cannot hide behind a trusted path. */
function decodedSafeReturn(value: string): boolean {
  let decoded = value;
  for (let depth = 0; depth < 5; depth += 1) {
    if (/[\\\u0000-\u001f\u007f]/.test(decoded) || decoded.startsWith('//') || decoded.includes('..')) return false;
    const next = decodeURIComponent(decoded);
    if (next === decoded) return true;
    decoded = next;
  }
  return false;
}
export function safePasswordReturn(value: unknown): string {
  if (value === '/') return '/scanner';
  if (typeof value !== 'string' || value.length > 4096 || !value.startsWith('/')) return '/scanner';
  try {
    if (!decodedSafeReturn(value)) return '/scanner';
    const url = new URL(value, RETURN_ORIGIN);
    return url.origin === RETURN_ORIGIN && !url.hash && RETURN_PATH.test(url.pathname) ? value : '/scanner';
  } catch { return '/scanner'; }
}

function rootUrl(value: string | undefined): URL | null {
  if (!value || /[\\\u0000-\u0020\u007f]/.test(value)) return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password &&
      url.pathname === '/' && !url.search && !url.hash ? url : null;
  } catch { return null; }
}
function loopback(url: URL): boolean {
  return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
}
function protectedRuntime(env: Record<string, string | undefined>, origin: URL, supabase: URL): boolean {
  if (env.AUTH_PASSWORD_PROTECTION === 'vercel-waf')
    return env.VERCEL === '1' && origin.protocol === 'https:' && supabase.protocol === 'https:';
  return env.AUTH_PASSWORD_PROTECTION === 'local-test' && env.NODE_ENV !== 'production' && loopback(origin) && loopback(supabase);
}
export function passwordConfig(env: Record<string, string | undefined>): OwnerPasswordConfig | null {
  const ownerId = env.APP_OWNER_USER_ID;
  const username = normalizedUsername(env.OWNER_LOGIN_USERNAME);
  const email = env.OWNER_LOGIN_EMAIL?.trim().toLowerCase();
  const origin = rootUrl(env.APP_ORIGIN);
  const supabase = rootUrl(env.NEXT_PUBLIC_SUPABASE_URL);
  if (!ownerId || !UUID.test(ownerId) || !username || !email || email.length > 254 ||
      !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(email) ||
      !origin || !supabase || !protectedRuntime(env, origin, supabase)) return null;
  return { username, email, ownerId, origin: origin.origin, recoveryEnabled: env.AUTH_PASSWORD_RECOVERY_READY === 'true', issuer: `${supabase.origin}/auth/v1` };
}

export function isConfiguredOwner(user: unknown, config: OwnerPasswordConfig): user is AuthUser {
  return record(user) && user.id === config.ownerId && typeof user.email === 'string' &&
    user.email.trim().toLowerCase() === config.email && typeof user.email_confirmed_at === 'string' &&
    Number.isFinite(Date.parse(user.email_confirmed_at)) && user.is_anonymous !== true;
}
/** The port must supply claims verified by the Auth SDK, never a decoded browser JWT. */
export function freshPasswordAuth(claims: unknown, config: OwnerPasswordConfig, mode: 'change' | 'recovery', nowSeconds: number): boolean {
  if (!record(claims) || !Number.isFinite(nowSeconds) || claims.sub !== config.ownerId ||
      claims.role !== 'authenticated' || claims.iss !== config.issuer ||
      !(claims.aud === 'authenticated' || (Array.isArray(claims.aud) && claims.aud.includes('authenticated'))) ||
      typeof claims.exp !== 'number' || !Number.isFinite(claims.exp) || claims.exp <= nowSeconds ||
      typeof claims.session_id !== 'string' || !UUID.test(claims.session_id) || !Array.isArray(claims.amr)) return false;
  const methods = mode === 'recovery' ? ['recovery'] : ['oauth', 'password'];
  return claims.amr.some(entry => record(entry) && typeof entry.method === 'string' && methods.includes(entry.method) &&
    typeof entry.timestamp === 'number' && Number.isInteger(entry.timestamp) &&
    entry.timestamp <= nowSeconds && nowSeconds - entry.timestamp <= FRESH_AUTH_SECONDS);
}
