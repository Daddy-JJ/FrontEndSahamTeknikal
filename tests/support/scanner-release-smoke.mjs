// Local production-build test with HTTP doubles only; never real Supabase/Vercel.
import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const dist = ".next-scanner-smoke";
const originalTypes = await readFile("next-env.d.ts", "utf8");
const env = { ...process.env, NODE_ENV: "production", SMOKE_PRODUCTION: "true",
  NEXT_TEST_DIST_DIR: dist, NEXT_TELEMETRY_DISABLED: "1",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:3053",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-test-publishable",
  DATA_MODE: "live", ALLOW_FIXTURE_PREVIEW: "false" };
let child;
let interrupted = false;
function interrupt() {
  interrupted = true;
  child?.kill(); // Only the directly spawned child, never a discovered PID/port.
}
process.on("SIGINT", interrupt);
process.on("SIGTERM", interrupt);
async function run(file, args) {
  child = spawn(process.execPath, [resolve(file), ...args], {
    env, stdio: "inherit", windowsHide: true,
  });
  return new Promise((resolveExit, reject) => {
    child.once("error", reject);
    child.once("exit", code => resolveExit(code ?? 1));
  });
}
let code = 1;
try {
  code = await run("node_modules/next/dist/bin/next", ["build"]);
  if (code === 0 && !interrupted) code = await run("node_modules/@playwright/test/cli.js",
    ["test", "--config", "playwright.scanner.config.ts", ...process.argv.slice(2)]);
} finally {
  // Restore generated paths only when no unrelated/concurrent edit is present.
  const current = await readFile("next-env.d.ts", "utf8");
  const expected = originalTypes.replace(/import "\.\/[^"\n]+\/types\/(routes|root-params)\.d\.ts";/g,
    `import "./${dist}/types/$1.d.ts";`);
  if (current.replaceAll("\r\n", "\n") === expected.replaceAll("\r\n", "\n")) {
    await writeFile("next-env.d.ts", originalTypes);
  }
}
process.exitCode = code;
