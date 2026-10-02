import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testMatch: "**/journal.spec.ts",
  testIgnore: [],
  expect: {timeout:15000},
  timeout:45000,
  outputDir: "test-results/journal",
  reporter: [["list"],["json",{outputFile:"test-results/journal-report.json"}]],
  use: { ...base.use, baseURL: "http://127.0.0.1:3052" },
  metadata: { smokeKind: "journal" },
});
