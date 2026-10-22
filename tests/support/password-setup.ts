import { fork, type ChildProcess } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const dist = ".next-password-smoke";
async function start(file: string, env: Partial<NodeJS.ProcessEnv>): Promise<ChildProcess> {
  const child = fork(resolve(file), [], { env: { ...process.env, ...env },
    stdio: ["ignore", "inherit", "inherit", "ipc"], windowsHide: true });
  try {
    await new Promise<void>((done, reject) => {
      const timer = setTimeout(() => reject(Error("password_smoke_start_timeout")), 120000);
      child.once("error", error => { clearTimeout(timer); reject(error); });
      child.once("exit", () => { clearTimeout(timer); reject(Error("password_smoke_start_exited")); });
      child.on("message", message => {
        if (message && typeof message === "object" && "ready" in message) { clearTimeout(timer); done(); }
      });
    });
    return child;
  } catch (error) { child.kill(); throw error; }
}
async function stop(child: ChildProcess) {
  if (child.exitCode !== null) return;
  await new Promise<void>((done, reject) => {
    const timer = setTimeout(() => { child.kill(); reject(Error("password_smoke_stop_timeout")); }, 15000);
    child.once("exit", code => {
      clearTimeout(timer);
      if (code === 0) done();
      else reject(Error("password_smoke_stop_failed"));
    });
    child.send({ stop: true });
  });
}
export default async function setup() {
  const original = await readFile("next-env.d.ts", "utf8");
  const originalConfig = await readFile("tsconfig.json", "utf8");
  const children: ChildProcess[] = [];
  async function cleanup() {
    const results = await Promise.allSettled([...children].reverse().map(stop));
    const current = await readFile("next-env.d.ts", "utf8");
    const expected = original.replace(/import "\.\/[^"\n]+\/types\/(routes|root-params)\.d\.ts";/g,
      `import "./${dist}/dev/types/$1.d.ts";`);
    if (current.includes(`./${dist}/`) && current.replaceAll("\r\n", "\n") === expected.replaceAll("\r\n", "\n"))
      await writeFile("next-env.d.ts", original);
    const currentConfig = await readFile("tsconfig.json", "utf8");
    const parsedConfig = JSON.parse(currentConfig);
    const originalParsed = JSON.parse(originalConfig);
    const ownedEntries = [`${dist}/types/**/*.ts`, `${dist}/dev/types/**/*.ts`];
    const restored = { ...parsedConfig, include: parsedConfig.include.filter((value: string) =>
      !ownedEntries.includes(value) || originalParsed.include.includes(value)) };
    // Restore a generated include only when every other setting is still ours.
    if (currentConfig !== originalConfig && JSON.stringify(restored) === JSON.stringify(originalParsed))
      await writeFile("tsconfig.json", originalConfig);
    const failure = results.find(result => result.status === "rejected");
    if (failure?.status === "rejected") throw failure.reason;
  }
  try {
    children.push(await start("tests/support/password-auth-dev.mjs", {}));
    children.push(await start("tests/support/managed-next.mjs", {
      NODE_ENV: "development", SMOKE_PORT: "3058", NEXT_TEST_DIST_DIR: dist,
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:3061",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-test-publishable", DATA_MODE: "fixture",
      ALLOW_FIXTURE_PREVIEW: "true", APP_OWNER_USER_ID: "22222222-2222-4222-8222-222222222222",
      OWNER_LOGIN_USERNAME: "daddyjj", OWNER_LOGIN_EMAIL: "owner@example.test",
      APP_ORIGIN: "http://127.0.0.1:3058", AUTH_PASSWORD_PROTECTION: "local-test",
      AUTH_PASSWORD_RECOVERY_READY: "true", NEXT_TELEMETRY_DISABLED: "1",
    }));
    for (const route of ["/login", "/auth/check", "/auth/password/recover", "/auth/password/update"])
      await fetch(`http://127.0.0.1:3058${route}`, { signal: AbortSignal.timeout(120000) });
    // Compile the route handler outside browser deadlines without credentials.
    // Missing Origin must be rejected before contacting even the loopback Auth.
    const denied = await fetch("http://127.0.0.1:3058/auth/password", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
      signal: AbortSignal.timeout(120000),
    });
    if (denied.status !== 403) throw Error("password_smoke_origin_guard_failed");
    return cleanup;
  } catch (error) { await cleanup(); throw error; }
}
