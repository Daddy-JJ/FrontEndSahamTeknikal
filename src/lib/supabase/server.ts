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
    global: process.env.SCANNER_READ_HTTP_AUDIT === "true" ? { fetch: async (input, init) => {
      const response = await fetch(input, init);
      const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
      const table = url.pathname.split("/").pop();
      if ((init?.method ?? "GET").toUpperCase() === "GET"
        && url.origin === new URL(config.url).origin
        && url.pathname.startsWith("/rest/v1/")
        && ["scan_runs", "scan_run_items", "scan_run_signals"].includes(table ?? "")) {
        // Opt-in local evidence: never log query, headers, body, JWT or cookies.
        console.info(JSON.stringify({ event: "scanner_read_http", project: url.hostname.split(".")[0], table, status: response.status }));
      }
      return response;
    } } : undefined,
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
