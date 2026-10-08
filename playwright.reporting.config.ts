import {defineConfig} from "@playwright/test";
import journal from "./playwright.journal.config";
export default defineConfig({
 ...journal,testMatch:"**/reporting.spec.ts",outputDir:"test-results/reporting",
 reporter:[["list"],["json",{outputFile:"test-results/reporting-report.json"}]],
});
