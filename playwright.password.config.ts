import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests", testMatch: ["**/password-auth.spec.ts", "**/auth.spec.ts"], fullyParallel: false, workers: 1,
  globalSetup: "./tests/support/password-setup.ts", timeout: 45000,
  expect: { timeout: 15000 }, outputDir: "test-results/password",
  reporter: [["list"], ["json", { outputFile: "test-results/password-report.json" }]],
  use: { baseURL: "http://127.0.0.1:3058", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 }, channel: "msedge" } },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium", channel: "msedge" } },
  ],
});
