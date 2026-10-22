import { expect, test, type APIRequestContext, type BrowserContext, type Page } from "@playwright/test";

const mock = "http://127.0.0.1:3061";
const app = "http://127.0.0.1:3058";
const ownerId = "22222222-2222-4222-8222-222222222222";
const password = "Local-only-password-123!";
const newPassword = "New-local-password-456!";
type Call = { path: string; method: string; grant: string | null };
async function scenario(request: APIRequestContext, value = "owner") {
  expect((await request.post(`${mock}/__scenario`, { data: { scenario: value } })).ok()).toBe(true);
}
async function calls(request: APIRequestContext): Promise<Call[]> {
  return (await (await request.get(`${mock}/__calls`)).json()).calls;
}
async function fillLogin(page: Page, username = "daddyjj") {
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
}
async function seedSession(context: BrowserContext, request: APIRequestContext, expired = false) {
  const { session } = await (await request.post(`${mock}/__session`, { data: { expired } })).json();
  await context.addCookies([{ name: "sb-127-auth-token", value: "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url"),
    domain: "127.0.0.1", path: "/", httpOnly: false, sameSite: "Lax" }]);
}
async function post(request: APIRequestContext, data: unknown, origin = app) {
  return request.post("/auth/password", { headers: { Origin: origin }, data });
}
test.beforeEach(async ({ request }) => { await scenario(request); });

test("username form, password visibility and Enter preserve the owner session", async ({ page, context }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/login?returnTo=%2Fauth%2Fcheck");
  await expect(page.getByLabel("Username", { exact: true })).toHaveValue("daddyjj");
  await expect(page.getByRole("button", { name: "Lanjutkan dengan GitHub" })).toBeVisible();
  await fillLogin(page);
  const field = page.getByLabel("Password", { exact: true });
  await expect(field).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Tampilkan password", exact: true }).click();
  await expect(field).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Sembunyikan password", exact: true }).click();
  await field.press("Enter");
  await expect(page).toHaveURL(/\/auth\/check$/);
  await expect(page.getByRole("heading", { name: "Sesi owner terverifikasi" })).toBeVisible();
  await expect(page.getByText(ownerId, { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText(ownerId, { exact: true })).toBeVisible();
  expect((await context.cookies()).some(cookie => cookie.name.startsWith("sb-127-auth-token"))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/password-owner-${info.project.name}.png`, fullPage: true });
  await page.getByRole("button", { name: "Keluar", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/auth/check");
  await expect(page).toHaveURL(/\/login/);
  expect(errors).toEqual([]);
});

test("double submit makes one password grant and keeps the UI busy", async ({ page, request }) => {
  await scenario(request, "delayed");
  await page.goto("/login?returnTo=%2Fauth%2Fcheck");
  await fillLogin(page);
  await page.locator(".password-auth-form").evaluate(form => {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  await expect(page.locator(".password-auth-form")).toHaveAttribute("aria-busy", "true");
  await expect(page.getByLabel("Username", { exact: true })).toBeDisabled();
  await expect(page).toHaveURL(/\/auth\/check$/);
  expect((await calls(request)).filter(call => call.grant === "password")).toHaveLength(1);
});

test("invalid credentials, throttling and provider failures show safe errors without a session", async ({ page, context, request }) => {
  for (const [value, message] of [["invalid-credentials", /Username atau password tidak sesuai/],
    ["limited", /Terlalu banyak percobaan/], ["backend-error", /Layanan login belum tersedia/]] as const) {
    await scenario(request, value);
    await page.goto("/login");
    await fillLogin(page);
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page.locator(".password-auth-form").getByRole("alert")).toContainText(message);
    await expect(page.getByRole("button", { name: "Masuk", exact: true })).toBeEnabled();
    expect((await context.cookies()).filter(cookie => cookie.name.startsWith("sb-127-auth-token"))).toHaveLength(0);
    expect(await page.locator("body").innerText()).not.toContain("owner@example.test");
    expect(await page.locator("body").innerText()).not.toContain("Synthetic");
  }
});

test("network failure is recoverable and does not leak the password", async ({ page }) => {
  await page.goto("/login");
  await page.route("**/auth/password", route => route.abort("failed"));
  await fillLogin(page);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page.locator(".password-auth-form").getByRole("alert")).toContainText(/Periksa koneksi/);
  await expect(page.getByRole("button", { name: "Masuk", exact: true })).toBeEnabled();
  expect(await page.locator(".password-auth-form").getByRole("alert").innerText()).not.toContain(password);
});

test("HTML rate-limit responses show a safe throttling message", async ({ page }) => {
  await page.goto("/login");
  await page.route("**/auth/password", route => route.fulfill({
    status: 429, contentType: "text/html", headers: { "Retry-After": "60" },
    body: "<!doctype html><title>PRIVATE_WAF_SENTINEL</title><p>PRIVATE_WAF_SENTINEL</p>",
  }));
  await fillLogin(page);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page.locator(".password-auth-form").getByRole("alert")).toContainText("Terlalu banyak percobaan");
  await expect(page.getByRole("button", { name: "Masuk", exact: true })).toBeEnabled();
  expect(await page.locator("body").innerText()).not.toContain("PRIVATE_WAF_SENTINEL");
});

test("alias, outsider identity and disabled membership never receive authenticated cookies", async ({ request }) => {
  for (const value of ["owner", "outsider", "disabled", "membership-error"]) {
    await scenario(request, value);
    const response = await post(request, { intent: "login", username: value === "owner" ? "unknown" : "daddyjj", password });
    expect(response.status()).toBe(value === "membership-error" ? 503 : 401);
    expect(response.headers()["set-cookie"]).toBeUndefined();
    const data = await response.json();
    expect(data.ok).toBe(false);
    expect(JSON.stringify(data)).not.toContain("owner@example.test");
    expect(JSON.stringify(data)).not.toContain(password);
    if (value === "owner") expect((await calls(request)).some(call => call.grant === "password")).toBe(false);
  }
});

test("endpoint enforces origin, content type, body bound and safe return paths", async ({ request }) => {
  const input = { intent: "login", username: "daddyjj", password };
  expect((await post(request, input, "https://outside.invalid")).status()).toBe(403);
  const noOrigin = await request.post("/auth/password", { data: input });
  expect(noOrigin.status()).toBe(403);
  const text = await request.post("/auth/password", { headers: { Origin: app, "Content-Type": "text/plain" }, data: JSON.stringify(input) });
  expect(text.status()).toBe(415);
  const huge = await request.post("/auth/password", { headers: { Origin: app, "Content-Type": "application/json" }, data: "x".repeat(20000) });
  expect(huge.status()).toBe(413);
  for (const returnTo of ["https://outside.invalid", "//outside.invalid", "/%252f%252foutside.invalid", "/auth/callback?code=bad"]) {
    const response = await post(request, { ...input, returnTo });
    expect(response.status()).toBe(200);
    expect((await response.json()).redirect).toBe("/scanner");
    expect(response.headers()["cache-control"]).toContain("no-store");
  }
});

test("expired owner session refreshes with the same UID", async ({ page, context, request }) => {
  await scenario(request, "refresh");
  await seedSession(context, request, true);
  await page.goto("/auth/check");
  await expect(page.getByText(ownerId, { exact: true })).toBeVisible();
  expect((await calls(request)).some(call => call.grant === "refresh_token")).toBe(true);
});

test("recovery form is generic for an unknown username and starts PKCE only for the owner alias", async ({ page, request, context }) => {
  await page.goto("/auth/password/recover");
  await page.getByLabel("Username", { exact: true }).fill("unknown");
  await page.getByRole("button", { name: "Kirim tautan pemulihan" }).click();
  const first = await page.getByRole("status").filter({ hasText: "Jika akun sesuai" }).innerText();
  expect((await calls(request)).filter(call => call.path.endsWith("/recover"))).toHaveLength(0);
  await page.getByLabel("Username", { exact: true }).fill("daddyjj");
  await page.getByRole("button", { name: "Kirim tautan pemulihan" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Jika akun sesuai" })).toHaveText(first);
  expect((await calls(request)).filter(call => call.path.endsWith("/recover"))).toHaveLength(1);
  expect((await context.cookies()).some(cookie => cookie.name.includes("code-verifier"))).toBe(true);
  expect(await page.locator("body").innerText()).not.toContain("owner@example.test");
});

test("PKCE recovery verifies AMR, updates password once and ends the old session", async ({ page, request, context }) => {
  await scenario(request, "recovery");
  await page.goto("/auth/password/recover");
  await page.getByRole("button", { name: "Kirim tautan pemulihan" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Jika akun sesuai" })).toBeVisible();
  await page.goto("/auth/callback?flow=recovery&code=test-only-good-code");
  await expect(page).toHaveURL(`${app}/auth/password/update`);
  await page.getByLabel("Password", { exact: true }).fill(newPassword);
  await page.getByLabel("Konfirmasi password", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Simpan password", exact: true }).click();
  await expect(page).toHaveURL(/\/login\?password=updated$/);
  const recorded = await calls(request);
  expect(recorded.filter(call => call.path === "/auth/v1/user" && call.method === "PUT")).toHaveLength(1);
  expect(recorded.some(call => call.path === "/auth/v1/logout")).toBe(true);
  expect((await context.cookies()).filter(cookie => cookie.name.startsWith("sb-127-auth-token"))).toHaveLength(0);
  await page.goto("/auth/password/recover");
  await page.getByRole("button", { name: "Kirim tautan pemulihan" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Jika akun sesuai" })).toBeVisible();
  await page.goto("/auth/callback?flow=recovery&code=test-only-good-code");
  await expect(page).toHaveURL(/\/auth\/error/);
  expect((await calls(request)).filter(call => call.path === "/auth/v1/user" && call.method === "PUT")).toHaveLength(1);
});

test("normal OAuth/password, stale recovery and expired or reused codes cannot unlock recovery", async ({ page, request, context }) => {
  for (const value of ["owner", "oauth", "recovery-stale"]) {
    await scenario(request, value);
    await context.clearCookies();
    await seedSession(context, request);
    await page.goto("/auth/password/update");
    await expect(page.getByRole("button", { name: "Simpan password", exact: true })).toHaveCount(0);
    const response = await page.request.post("/auth/password", { headers: { Origin: app },
      data: { intent: "recovery", password: newPassword, confirmPassword: newPassword } });
    expect(response.status()).toBe(401);
    expect((await calls(request)).filter(call => call.path === "/auth/v1/user" && call.method === "PUT")).toHaveLength(0);
  }
  await scenario(request, "recovery-expired");
  await context.clearCookies();
  await page.goto("/auth/password/recover");
  await page.getByRole("button", { name: "Kirim tautan pemulihan" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Jika akun sesuai" })).toBeVisible();
  await page.goto("/auth/callback?flow=recovery&code=test-only-good-code");
  await expect(page).toHaveURL(/\/auth\/error/);
});

test("owner password change requires fresh auth and rejects mismatched confirmation", async ({ page, context, request }) => {
  await scenario(request, "oauth");
  await seedSession(context, request);
  await page.goto("/auth/check");
  await page.getByLabel("Password", { exact: true }).fill(newPassword);
  await page.getByLabel("Konfirmasi password", { exact: true }).fill(`${newPassword}x`);
  await page.getByRole("button", { name: "Simpan password", exact: true }).click();
  await expect(page.locator(".password-auth-form").getByRole("alert")).toContainText(/isian formulir/);
  expect((await calls(request)).some(call => call.method === "PUT")).toBe(false);
  await page.getByLabel("Konfirmasi password", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Simpan password", exact: true }).click();
  await expect(page).toHaveURL(/\/login\?password=updated$/);
  expect((await calls(request)).filter(call => call.path === "/auth/v1/user" && call.method === "PUT")).toHaveLength(1);
});

test("stale owner auth cannot change password and a saved-password logout failure stays explicit", async ({ page, context, request }) => {
  await scenario(request, "stale-auth");
  await seedSession(context, request);
  await page.goto("/auth/check");
  await expect(page.getByRole("button", { name: "Simpan password", exact: true })).toHaveCount(0);
  const response = await page.request.post("/auth/password", { headers: { Origin: app },
    data: { intent: "change", password: newPassword, confirmPassword: newPassword } });
  expect(response.status()).toBe(401);
  expect((await calls(request)).some(call => call.method === "PUT")).toBe(false);
  await scenario(request, "logout-error");
  await seedSession(context, request);
  await page.goto("/auth/check");
  await page.getByLabel("Password", { exact: true }).fill(newPassword);
  await page.getByLabel("Konfirmasi password", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Simpan password", exact: true }).click();
  await expect(page.locator(".password-auth-form").getByRole("alert")).toContainText(/Password tersimpan.*pengakhiran sesi belum selesai/);
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Konfirmasi password", { exact: true })).toHaveValue("");
  await expect(page.getByRole("link", { name: /pengakhiran sesi|Keluar|Periksa sesi/i })).toHaveAttribute("href", /^\/auth\/check(?:\?|$)/);
  expect((await calls(request)).filter(call => call.path === "/auth/v1/user" && call.method === "PUT")).toHaveLength(1);
});

test("keyboard focus, touch targets and login mobile layout remain usable", async ({ page }, info) => {
  await page.goto("/login");
  await page.getByLabel("Username", { exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Password", { exact: true })).toBeFocused();
  const focus = await page.getByLabel("Password", { exact: true }).evaluate(element => ({
    outline: getComputedStyle(element).outlineStyle, width: getComputedStyle(element).outlineWidth,
    height: element.getBoundingClientRect().height,
  }));
  expect(focus.outline).not.toBe("none");
  expect(focus.width).not.toBe("0px");
  expect(focus.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/password-login-${info.project.name}.png`, fullPage: true });
});
