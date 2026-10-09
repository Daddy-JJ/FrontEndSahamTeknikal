import { expect, test } from "@playwright/test";

test("unauthenticated user reaches login without private data", async ({ page }) => {
  await page.goto("/auth/check");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: "Lanjutkan dengan GitHub" })).toBeVisible();
  await expect(page.getByText("Sesi owner terverifikasi")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Uji aksi owner pada fixture" })).toHaveCount(0);
});

test("OAuth callback rejects a request without an authorization code", async ({ page }) => {
  await page.goto("/auth/callback");
  await expect(page).toHaveURL(/\/auth\/error\?reason=callback$/);
  await expect(page.getByRole("heading", { name: "Login belum selesai" })).toBeVisible();
  const retry = page.getByRole("link", { name: "Coba kembali" });
  await expect(retry).toBeVisible();
  await expect(retry).toHaveCSS("color", "rgb(156, 228, 244)");
});

test("OAuth callback redirect is not cached or forwarded as a referrer", async ({ request }) => {
  const response = await request.get("/auth/callback", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["referrer-policy"]).toBe("no-referrer");
  expect(response.headers()["location"]).toMatch(/\/auth\/error\?reason=callback$/);
});

test("callback strips untrusted provider details from the redirect", async ({ request }) => {
  const response = await request.get("/auth/callback?error_description=SENSITIVE_SENTINEL", { maxRedirects: 0 });
  expect(response.headers()["location"]).toMatch(/\/auth\/error\?reason=callback$/);
  expect(response.headers()["location"]).not.toContain("SENSITIVE_SENTINEL");
});
