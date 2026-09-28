import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests", fullyParallel: false, workers: 1,
  reporter: "list", timeout: 30000,
  use: { baseURL: "http://127.0.0.1:3050", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 }, channel: "msedge" } },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium", channel: "msedge" } },
    { name: "tablet", use: { viewport: { width: 1024, height: 768 }, channel: "msedge" } },
  ],
  webServer: { command: "npm run dev", url: "http://127.0.0.1:3050", reuseExistingServer: true, timeout: 120000 },
});
