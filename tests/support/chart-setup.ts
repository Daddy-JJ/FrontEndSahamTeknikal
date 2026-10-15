import { fork } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
export default async function setup() {
  const original = await readFile("next-env.d.ts", "utf8");
  const distDir = process.env.CHART_SMOKE_WEBPACK === "true" ? ".next-chart-smoke/webpack" : ".next-chart-smoke";
  const child = fork(resolve("tests/support/chart-dev.mjs"), [], {
    windowsHide: true,
    stdio: ["ignore", "inherit", "inherit", "ipc"],
    env: {
      ...process.env,
      NODE_ENV: "development",
      DATA_MODE: "fixture",
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      NEXT_TEST_DIST_DIR: distDir,
      SMOKE_PORT: "3058",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  });
  async function cleanup() {
    if (child.exitCode === null)
      await new Promise<void>((done, reject) => {
        const timer = setTimeout(() => {
          child.kill();
          reject(Error("chart_teardown_timeout"));
        }, 15000);
        child.once("exit", () => {
          clearTimeout(timer);
          done();
        });
        child.send({ stop: true });
      });
    const current = await readFile("next-env.d.ts", "utf8");
    const expected=original.replace(/import "\.\/[^"\n]+\/types\/(routes|root-params)\.d\.ts";/g,'import "./'+distDir+'/dev/types/$1.d.ts";');
    // Restore only generated import changes from this run, never concurrent edits.
    if (current.includes("./.next-chart-smoke/")&&current.replaceAll('\r\n','\n')===expected.replaceAll('\r\n','\n'))
      await writeFile("next-env.d.ts", original);
  }
  try {
    await new Promise<void>((done, reject) => {
      const timer = setTimeout(
        () => reject(Error("chart_start_timeout")),
        120000,
      );
      child.once("error", (e) => {
        clearTimeout(timer);
        reject(e);
      });
      child.once("exit", () => {
        clearTimeout(timer);
        reject(Error("chart_start_exited"));
      });
      child.on("message", (m) => {
        if (m && typeof m === "object" && "ready" in m) {
          clearTimeout(timer);
          done();
        }
      });
    });
    await fetch("http://127.0.0.1:3058/dev/chart", {
      signal: AbortSignal.timeout(120000),
    });
    return cleanup;
  } catch (error) {
    await cleanup();
    throw error;
  }
}
