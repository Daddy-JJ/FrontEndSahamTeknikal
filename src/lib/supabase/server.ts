import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function publicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

export async function createClient() {
  const config = publicSupabaseConfig();
  if (!config) throw new Error("supabase_public_config_missing");
  const cookieStore = await cookies();

  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(items) {
        try {
          items.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components are read-only; src/proxy.ts refreshes the cookie.
        }
      },
    },
  });
}
