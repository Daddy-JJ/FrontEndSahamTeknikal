import { expect, test } from "@playwright/test";

test("unauthenticated user reaches login without private data", async ({ page }) => {
  await page.goto("/auth/check");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: "Lanjutkan dengan GitHub" })).toBeVisible();
  await expect(page.getByText("Sesi owner terverifikasi")).toHaveCount(0);
});

test("OAuth callback rejects a request without an authorization code", async ({ page }) => {
  await page.goto("/auth/callback");
  await expect(page).toHaveURL(/\/auth\/error$/);
  await expect(page.getByRole("heading", { name: "Login belum selesai" })).toBeVisible();
});

test("OAuth callback redirect is not cached or forwarded as a referrer", async ({ request }) => {
  const response = await request.get("/auth/callback", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["referrer-policy"]).toBe("no-referrer");
  expect(response.headers()["location"]).toMatch(/\/auth\/error$/);
});
