import { test, expect } from "@playwright/test";

test("fixture is explicit; filtering and signal review preserve reference-vs-fill", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await page.waitForSelector('html[data-hydrated="true"]');
  await expect(page.getByText("Mode demo", { exact: true })).toBeVisible();
  await expect(page.getByText("Data sintetis · bukan harga pasar atau anggota KOMPAS100")).toBeVisible();
  await page.getByRole("button", { name: "Lihat alasan" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Harga entry pada malam sinyal")).toBeVisible();
  await expect(page.getByText("Belum tersedia", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Simpan ke watchlist demo", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Tidak membuat transaksi actual");
  await page.getByRole("button", { name: "Tutup dialog" }).click();
  await page.getByRole("textbox", { name: "Cari ticker", exact: true }).fill("NONE");
  await expect(page.getByText("Tidak ada sinyal untuk filter ini.")).toBeVisible();
  await page.getByRole("textbox", { name: "Cari ticker", exact: true }).fill("");
  await page.getByRole("button", { name: "Tutup notifikasi" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  expect(errors).toEqual([]);
  await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, 0); });
  await page.screenshot({ path: `test-results/workspace-${testInfo.project.name}.png`, fullPage: true });
  await page.screenshot({ path: `test-results/viewport-${testInfo.project.name}.png`, fullPage: false });
});

test("shared terminal theme covers fixture, login and not-found states", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector('html[data-hydrated="true"]');
  const shell=page.locator(".site-terminal-shell");
  await expect(shell).toBeVisible();
  await expect(shell).toHaveCSS("background-color", "rgb(11, 16, 21)");
  await expect(page.locator(".demo-strip")).toHaveCSS("background-color", "rgb(32, 30, 24)");
  await expect(page.getByRole("button", { name: "Ringkasan", exact: true })).toHaveAttribute("aria-current", "page");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();

  await page.goto("/login");
  await expect(page.locator(".site-terminal-shell .auth-page")).toBeVisible();
  await expect(page.locator(".journal-nav .badge")).toHaveCount(0);
  await expect(page.locator(".auth-page")).toHaveCSS("background-color", "rgb(17, 25, 34)");

  await page.goto("/route-tidak-ada");
  await expect(page.getByRole("heading", { name: "Alamat ini belum tersedia." })).toBeVisible();
  await expect(page.locator(".site-terminal-shell")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test("command navigation, paper/actual separation and truthful provider status", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector('html[data-hydrated="true"]');
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog", { name: "Cari & navigasi" })).toBeVisible();
  await page.getByRole("textbox", { name: "Pencarian command menu" }).fill("Jurnal");
  await page.getByRole("dialog").getByRole("button", { name: "Jurnal", exact: true }).click();
  await page.getByRole("button", { name: "Actual", exact: true }).click();
  await expect(page.getByText("Belum ada transaksi actual.")).toBeVisible();
  await page.getByRole("navigation").getByRole("button", { name: "Operasional" }).click();
  await expect(page.getByText("Menunggu key", { exact: true })).toBeVisible();
  await page.getByLabel("Pratinjau state UI").selectOption("partial");
  await expect(page.getByText(/Ranking RS ditahan/)).toBeVisible();
});

test("unconfigured root uses the shared terminal shell and truthful recovery state", async ({ page }) => {
  test.skip(process.env.SMOKE_DATA_MODE !== "unconfigured", "requires isolated unconfigured server mode");
  await page.goto("/");
  const shell = page.locator(".site-terminal-shell");
  await expect(shell).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pemindaian live sedang disiapkan." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Masuk sebagai pemilik" })).toBeVisible();
  await expect(page.locator(".journal-nav .badge")).toHaveCount(0);
  await expect(shell).toHaveCSS("background-color", "rgb(11, 16, 21)");
});