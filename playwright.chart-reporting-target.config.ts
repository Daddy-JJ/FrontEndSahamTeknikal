import { defineConfig } from "@playwright/test";
import reporting from "./playwright.reporting.config";
/** Focused follow-up of the two previously failing UI boundaries, with one owned server. */
export default defineConfig({
  ...reporting,
  projects: (reporting.projects ?? []).filter(project => ["desktop", "mobile"].includes(project.name ?? "")).map(project => ({
    ...project,
    grep: project.name === "desktop" ? /analytics chart roundtrip/ : /actual IDR reporting/,
  })),
  outputDir: "test-results/chart-reporting-target",
  reporter: [["list"], ["json", { outputFile: "test-results/chart-reporting-target-report.json" }]],
});
