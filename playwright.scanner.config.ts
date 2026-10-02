import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base, testMatch: "**/scanner.spec.ts", testIgnore: [],
  metadata: { smokeKind: "scanner" },
  use: { ...base.use, baseURL: "http://127.0.0.1:3056" },
  timeout: 45000, outputDir: "test-results/scanner",
  reporter: [["list"], ["json", { outputFile: "test-results/scanner-report.json" }]],
});
