import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests", fullyParallel: false, workers: 1,
  testMatch: "**/*.spec.ts",
  testIgnore: ["**/journal.spec.ts", "**/scanner.spec.ts", "**/reporting.spec.ts"],
  outputDir: "test-results/workspace",
  reporter: "list", timeout: 30000,
  // Cold development compilation can outlast Playwright's default 5s assertion wait.
  expect: { timeout: 15000 },
  globalSetup: "./tests/support/smoke-setup.ts",
  metadata: { smokeKind: "workspace" },
  use: { baseURL: "http://127.0.0.1:3054", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 }, channel: "msedge" } },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium", channel: "msedge" } },
    { name: "tablet", use: { viewport: { width: 1024, height: 768 }, channel: "msedge" } },
  ],
});
