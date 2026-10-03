import { NextResponse } from "next/server";
import { createClient, publicSupabaseConfig } from "@/lib/supabase/server";

function safeRedirect(path: string, origin: string) {
  const response = NextResponse.redirect(new URL(path, origin));
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const code = new URL(request.url).searchParams.get("code");
  if (!publicSupabaseConfig()) return safeRedirect("/auth/error?reason=configuration", origin);
  if (!code) return safeRedirect("/auth/error?reason=callback", origin);

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return safeRedirect("/auth/check", origin);
    if (error.name === "AuthPKCECodeVerifierMissingError") {
      return safeRedirect("/auth/error?reason=verifier", origin);
    }
  } catch {
    // Keep provider details and OAuth code out of redirects and logs.
  }
  return safeRedirect("/auth/error?reason=exchange", origin);
}
