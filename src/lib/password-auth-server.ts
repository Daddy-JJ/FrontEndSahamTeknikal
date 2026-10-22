import 'server-only';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { createClient, publicSupabaseConfig } from './supabase/server';
import { freshPasswordAuth, isConfiguredOwner, passwordConfig } from './password-auth-policy';
import type { PasswordAuthPort } from './password-auth-core';

type Client = Awaited<ReturnType<typeof createClient>>;
export type PasswordCookie = { name: string; value: string; options: CookieOptions };
export function passwordAuthConfig() {
  return publicSupabaseConfig() ? passwordConfig(process.env) : null;
}
function authPort(client: Client): PasswordAuthPort {
  return {
    async signIn(email, password) {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      return { user: data.user, error };
    },
    async ownerMembership(id) {
      const { data, error } = await client.from('app_members').select('role,enabled').eq('user_id', id).maybeSingle();
      if (error) throw new Error('password_membership_unavailable');
      return data;
    },
    async currentUser() {
      const { data, error } = await client.auth.getUser();
      return { user: data.user, error };
    },
    async verifiedClaims() {
      const { data, error } = await client.auth.getClaims();
      return error ? null : data?.claims ?? null;
    },
    async updatePassword(password) {
      const { data, error } = await client.auth.updateUser({ password });
      return { user: data.user, error };
    },
    async recover(email, redirectTo) { return client.auth.resetPasswordForEmail(email, { redirectTo }); },
    async signOut(scope = 'local') { return client.auth.signOut({ scope }); },
  };
}
/** Cookie writes stay private until the controller has verified the owner. */
export function bufferedPasswordPort(request: NextRequest) {
  const config = publicSupabaseConfig();
  if (!config) throw new Error('password_config_unavailable');
  let pending: PasswordCookie[] = [];
  const client = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: items => { pending = [...pending.filter(old => !items.some(item => item.name === old.name)), ...items]; },
    },
  });
  return { port: authPort(client), cookies: () => pending };
}
type AccessReason = 'unconfigured' | 'unauthenticated' | 'forbidden' | 'reauthenticate' | 'ready';
export async function passwordUpdateAccess(mode: 'change' | 'recovery'): Promise<{ ready: boolean; reason: AccessReason }> {
  const config = passwordAuthConfig();
  if (!config || (mode === 'recovery' && !config.recoveryEnabled)) return { ready: false, reason: 'unconfigured' };
  try {
    const port = authPort(await createClient());
    const { user, error } = await port.currentUser();
    if (error || !user) return { ready: false, reason: 'unauthenticated' };
    if (!isConfiguredOwner(user, config)) return { ready: false, reason: 'forbidden' };
    const member = await port.ownerMembership(user.id);
    if (member?.role !== 'owner' || member.enabled !== true) return { ready: false, reason: 'forbidden' };
    const ready = freshPasswordAuth(await port.verifiedClaims(), config, mode, Math.floor(Date.now() / 1000));
    return { ready, reason: ready ? 'ready' : 'reauthenticate' };
  } catch { return { ready: false, reason: 'unconfigured' }; }
}
