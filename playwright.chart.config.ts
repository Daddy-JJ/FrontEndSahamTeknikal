import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/chart.spec.ts",
  workers: 1,
  fullyParallel: false,
  timeout: 60000,
  expect: { timeout: 20000 },
  outputDir: "test-results/chart",
  reporter: [
    ["list"],
    ["json", { outputFile: "test-results/chart-report.json" }],
  ],
  globalSetup: "./tests/support/chart-setup.ts",
  use: { baseURL: "http://127.0.0.1:3058", trace: "retain-on-failure" },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        channel: "msedge",
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["iPhone 13"],
        defaultBrowserType: "chromium",
        channel: "msedge",
      },
    },
  ],
});
