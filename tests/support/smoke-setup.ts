import { fork, type ChildProcess } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { FullConfig } from "@playwright/test";

// Own direct Node children only. Never terminate a process discovered by port/PID.
async function start(file: string, env: Partial<NodeJS.ProcessEnv>): Promise<ChildProcess> {
  const child = fork(resolve(file), [], { env: { ...process.env, ...env },
    stdio: ["ignore", "inherit", "inherit", "ipc"], windowsHide: true });
  try {
    await new Promise<void>((resolveReady, reject) => {
      const timer = setTimeout(() => reject(new Error("smoke_start_timeout")), 120000);
      child.once("error", error => { clearTimeout(timer); reject(error); });
      child.once("exit", () => { clearTimeout(timer); reject(new Error("smoke_start_exited")); });
      child.on("message", message => {
        if (typeof message === "object" && message !== null && "ready" in message) {
          clearTimeout(timer); resolveReady();
        }
      });
    });
    return child;
  } catch (error) {
    child.kill();
    throw error;
  }
}

async function stop(child: ChildProcess) {
  if (child.exitCode !== null) return;
  await new Promise<void>((resolveExit, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("smoke_graceful_teardown_timeout"));
    }, 15000);
    child.once("exit", code => {
      clearTimeout(timer);
      if (code === 0) resolveExit();
      else reject(new Error("smoke_teardown_failed"));
    });
    child.send({ stop: true });
  });
}

export default async function setup(config: FullConfig) {
  const kind = config.metadata.smokeKind ?? "workspace";
  const port = kind === "journal" ? 3052 : kind === "scanner" ? 3056 : 3054;
  const dist = `.next-${kind}-smoke`;
  const production = process.env.SMOKE_PRODUCTION === "true";
  const originalTypes = await readFile("next-env.d.ts", "utf8");
  const children: ChildProcess[] = [];
  async function cleanup() {
    const results = await Promise.allSettled(children.reverse().map(stop));
    // Restore only the generated paths owned by this run; preserve concurrent edits.
    const currentTypes = await readFile("next-env.d.ts", "utf8");
    const expectedTypes = originalTypes.replace(/import "\.\/[^"\n]+\/types\/(routes|root-params)\.d\.ts";/g,
      `import "./${dist}/${production ? "" : "dev/"}types/$1.d.ts";`);
    if (currentTypes.includes(`./${dist}/`)
      && currentTypes.replaceAll("\r\n", "\n") === expectedTypes.replaceAll("\r\n", "\n")) {
      await writeFile("next-env.d.ts", originalTypes);
    }
    const failure = results.find(result => result.status === "rejected");
    if (failure?.status === "rejected") throw failure.reason;
  }
  try {
    if (kind !== "workspace") children.push(await start("tests/support/journal-dev.mjs", {}));
    children.push(await start("tests/support/managed-next.mjs", {
      NODE_ENV: production ? "production" : "development", SMOKE_PORT: String(port), NEXT_TEST_DIST_DIR: dist,
      NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${kind === "workspace" ? 3055 : 3053}`,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-test-publishable",
      DATA_MODE: process.env.SMOKE_DATA_MODE ?? (kind === "scanner" ? "live" : "fixture"), ALLOW_FIXTURE_PREVIEW: production ? "false" : "true",
      NEXT_TELEMETRY_DISABLED: "1",
    }));
    const warmRoutes = kind === "workspace" ? ["/", "/login", "/auth/error"] : ["/login"];
    for (const route of warmRoutes) await fetch(`http://127.0.0.1:${port}${route}`,
      { signal: AbortSignal.timeout(60000) });
    return cleanup;
  } catch (error) {
    await cleanup();
    throw error;
  }
}
