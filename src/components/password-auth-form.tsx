"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { safePasswordReturn } from "@/lib/password-auth-policy";

type Intent = "login" | "recover" | "change" | "recovery";
type Result = { ok: boolean; status: number; code: string; message: string; redirect?: string };
type Props = { intent: Intent; username?: string; returnTo?: string; disabled?: boolean };

const unavailable = "Permintaan belum dapat diproses. Periksa koneksi lalu coba lagi.";
const labels: Record<Intent, string> = {
  login: "Masuk", recover: "Kirim tautan pemulihan", change: "Simpan password", recovery: "Simpan password",
};

function parseResult(value: unknown, status: number): Result | null {
  if (!value || typeof value !== "object") return null;
  const result = value as Record<string, unknown>;
  if (typeof result.ok !== "boolean" || result.status !== status
    || typeof result.code !== "string" || typeof result.message !== "string"
    || result.message.length > 500
    || (result.redirect !== undefined && typeof result.redirect !== "string")) return null;
  return result as Result;
}

function safeRedirect(value: string | undefined): string | null {
  if (!value) return null;
  if (value === "/login?password=updated" || value === "/auth/error?reason=password-logout") return value;
  return safePasswordReturn(value) === value ? value : null;
}

function PasswordField({ id, confirmation, newPassword }: {
  id: string; confirmation?: boolean; newPassword: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const label = confirmation ? "Konfirmasi password" : "Password";
  return <div className="password-auth-field">
    <label htmlFor={id}>{label}</label>
    <div className="password-auth-input-row">
      <input id={id} name={confirmation ? "confirmPassword" : "password"}
        type={visible ? "text" : "password"} autoComplete={newPassword ? "new-password" : "current-password"}
        required minLength={newPassword ? 12 : undefined} maxLength={72}
        spellCheck={false} autoCapitalize="none" aria-describedby={newPassword ? `${id}-help` : undefined} />
      <button type="button" className="password-auth-toggle" aria-controls={id}
        aria-label={`${visible ? "Sembunyikan" : "Tampilkan"} ${label.toLowerCase()}`}
        aria-pressed={visible} onClick={() => setVisible(!visible)}>
        {visible ? "Sembunyikan" : "Tampilkan"}
      </button>
    </div>
    {newPassword && <span id={`${id}-help`} className="password-auth-help">
      {confirmation ? "Ketik ulang password yang sama." : "Gunakan minimal 12 karakter; maksimal 72 byte."}
    </span>}
  </div>;
}

function payload(form: HTMLFormElement, { intent, returnTo }: Props) {
  const values = new FormData(form);
  return {
    intent,
    ...(intent === "login" || intent === "recover" ? { username: String(values.get("username") ?? "") } : {}),
    ...(intent !== "recover" ? { password: String(values.get("password") ?? "") } : {}),
    ...(intent === "change" || intent === "recovery" ? { confirmPassword: String(values.get("confirmPassword") ?? "") } : {}),
    ...(intent === "login" && returnTo ? { returnTo } : {}),
  };
}

async function request(form: HTMLFormElement, props: Props): Promise<Result | null> {
  const response = await fetch("/auth/password", {
    method: "POST", credentials: "same-origin", cache: "no-store",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(payload(form, props)),
  });
  // Cloud firewall responses can be HTML. Never render their body as an error message.
  if (response.status === 429) return {
    ok: false, status: 429, code: "rate_limited",
    message: "Terlalu banyak percobaan. Silakan coba lagi nanti.",
  };
  if (!response.headers.get("content-type")?.includes("application/json")) return null;
  const result = parseResult(await response.json(), response.status);
  return result && result.ok === response.ok ? result : null;
}

export function PasswordAuthForm(props: Props) {
  const { intent, username = "daddyjj", disabled = false } = props;
  const id = useId();
  const router = useRouter();
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  const [savedLogoutPending, setSavedLogoutPending] = useState(false);
  const newPassword = intent === "change" || intent === "recovery";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || disabled || savedLogoutPending) return;
    const form = event.currentTarget;
    locked.current = true;
    setBusy(true);
    setNotice(null);
    try {
      const result = await request(form, props);
      if (!result) { setNotice({ error: true, text: unavailable }); return; }
      if (!result.ok) {
        if (result.code === "password_saved_logout_pending") {
          form.reset();
          setSavedLogoutPending(true);
        }
        setNotice({ error: true, text: result.message }); return;
      }
      if (intent === "recover") {
        setNotice({ error: false, text: result.message });
        return;
      }
      const redirect = safeRedirect(result.redirect);
      if (!redirect) { setNotice({ error: true, text: unavailable }); return; }
      form.reset();
      setNotice({ error: false, text: newPassword ? "Password tersimpan." : "Login berhasil. Membuka halaman…" });
      router.replace(redirect);
      router.refresh();
    } catch {
      setNotice({ error: true, text: unavailable });
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  return <form className="password-auth-form" method="post" action="/auth/password" onSubmit={submit} aria-busy={busy}>
    <noscript><p role="status">Aktifkan JavaScript untuk menggunakan formulir password pada browser ini.</p></noscript>
    <fieldset disabled={busy || disabled || savedLogoutPending} className="password-auth-fields">
      <legend className="sr-only">{newPassword ? "Tetapkan password" : intent === "recover" ? "Pemulihan password" : "Login dengan password"}</legend>
      {(intent === "login" || intent === "recover") && <div className="password-auth-field">
        <label htmlFor={`${id}-username`}>Username</label>
        <input id={`${id}-username`} name="username" autoComplete="username" defaultValue={username}
          required maxLength={64} spellCheck={false} autoCapitalize="none" autoCorrect="off" />
      </div>}
      {intent !== "recover" && <PasswordField id={`${id}-password`} newPassword={newPassword} />}
      {newPassword && <PasswordField id={`${id}-confirmation`} confirmation newPassword />}
      <button type="submit" className="primary-button">{busy ? "Memproses…" : labels[intent]}</button>
    </fieldset>
    <p className={`password-auth-notice ${notice?.error ? "auth-error" : "auth-success"}`}
      role={notice?.error ? "alert" : "status"} aria-live={notice?.error ? "assertive" : "polite"}
      aria-atomic="true">{notice?.text ?? ""}</p>
    {savedLogoutPending && <a href="/auth/check">Buka Akun untuk keluar dan masuk kembali</a>}
  </form>;
}
