"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function GithubLoginButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function signIn() {
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: new URL("/auth/callback", window.location.origin).toString(),
          skipBrowserRedirect: true,
        },
      });
      if (error || !data.url) throw new Error("oauth_start_failed");
      window.location.assign(data.url);
    } catch {
      setMessage("Login GitHub belum dapat dimulai. Periksa pengaturan provider untuk environment ini.");
      setBusy(false);
    }
  }

  return <div className="auth-action">
    <button type="button" className="primary-button" onClick={signIn} disabled={busy}>
      {busy ? "Menghubungkan…" : "Lanjutkan dengan GitHub"}
    </button>
    {message && <p role="alert">{message}</p>}
  </div>;
}
