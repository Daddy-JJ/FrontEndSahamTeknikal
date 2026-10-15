// Usage: node tests/support/chart-performance-prepare.mjs [--build] [--refresh-final <receipt>]
// New snapshots only. No checkout, reset, working-tree build, env-file read, or remote operation.
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, cp, symlink, writeFile, readFile, readdir } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { resolve, dirname, relative, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { chartPerformanceEnv } from "./chart-performance-env.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const refreshIndex = process.argv.indexOf('--refresh-final');
const receipt = refreshIndex >= 0 ? resolve(process.argv[refreshIndex + 1] ?? '') : resolve(root, "test-results/chart-performance", new Date().toISOString().replaceAll(":", "-") + "-" + randomUUID());
const owned = relative(resolve(root, 'test-results/chart-performance'), receipt);
if (!owned || owned.startsWith('..') || isAbsolute(owned)) throw Error('receipt_must_be_owned_local_directory');
const previous = refreshIndex >= 0 ? JSON.parse(await readFile(resolve(receipt, 'manifest.json'), 'utf8')) : null;
const baseline = previous?.baseline ?? resolve(receipt, "baseline"), final = resolve(receipt, previous ? 'final-refresh-' + randomUUID() : "final");
if (previous && (!previous.buildComplete || previous.baselineSha !== '11234b7' || previous.nextVersion !== '16.3.8' || relative(receipt, baseline).startsWith('..') || isAbsolute(relative(receipt, baseline)))) throw Error('invalid_frozen_baseline');
const baselineSha = "11234b7";
const snapshotNames = ["src", "public", "next.config.ts", "tsconfig.json", "next-env.d.ts", "package.json", "package-lock.json"];
async function command(binary, args, cwd, logfile) {
  const stream = logfile ? createWriteStream(logfile) : null;
  const child = spawn(binary, args, { cwd, env: chartPerformanceEnv(), windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  let output = "";
  for (const pipe of [child.stdout, child.stderr]) pipe.on("data", data => { output += data; stream?.write(data); });
  await new Promise((done, reject) => { child.once("error", reject); child.once("close", code => code === 0 ? done() : reject(Error("local_command_failed:" + binary + ":" + code))); });
  if (stream) await new Promise(done => stream.end(done));
  return output.trim();
}
async function fingerprint(directory) {
  const digest = createHash("sha256");
  async function visit(path, prefix = "") {
    const entries = await readdir(path, { withFileTypes: true });
    for (const entry of [...entries].sort((a, b) => a.name.localeCompare(b.name))) {
      const name = entry.name;
      if (["node_modules", ".next"].includes(name)) continue;
      const location = resolve(path, name);
      if (entry.isSymbolicLink()) throw Error("benchmark_source_symlink_forbidden");
      if (entry.isDirectory()) await visit(location, prefix + name + "/");
      else { digest.update(prefix + name + "\0"); digest.update(await readFile(location)); }
    }
  }
  await visit(directory);
  return digest.digest("hex");
}
if (!previous) await mkdir(baseline, { recursive: true });
await mkdir(final);
if (!previous) {
const archive = resolve(receipt, "baseline.tar");
const tracked = (await command('git', ['ls-tree', '--name-only', baselineSha, '--', ...snapshotNames], root)).split(/\r?\n/).filter(Boolean);
if (!tracked.length || tracked.some(name => !snapshotNames.includes(name))) throw Error('invalid_baseline_snapshot_paths');
const git = spawn("git", ["archive", "--format=tar", baselineSha, '--', ...tracked], { cwd: root, env: chartPerformanceEnv(), windowsHide: true, stdio: ["ignore", "pipe", "inherit"] });
const archiveDone = new Promise((done, reject) => { git.once("error", reject); git.once("close", code => code === 0 ? done() : reject(Error("baseline_archive_failed"))); });
await Promise.all([pipeline(git.stdout, createWriteStream(archive)), archiveDone]);
await command("tar.exe", ["-xf", archive, "-C", baseline], root);
}
// Current source snapshot has an explicit allowlist, so .env and operator receipts are never copied.
for (const name of snapshotNames)
  await cp(resolve(root, name), resolve(final, name), { recursive: true });
for (const directory of previous ? [final] : [baseline, final]) {
  // A tracked env file would make the archive unsuitable even without reading its value.
  if ((await readdir(directory)).some(name => /^\.env(?:$|\.(?!example$|sample$))/.test(name))) throw Error("archived_environment_file_forbidden");
  await symlink(resolve(root, "node_modules"), resolve(directory, "node_modules"), "junction");
}
const nextVersion = JSON.parse(await readFile(resolve(root, "node_modules/next/package.json"), "utf8")).version;
if (nextVersion !== "16.3.8") throw Error("benchmark_requires_same_next_16_3_8");
const manifest = { ...(previous ?? {}), contract: "chart-local-performance-v1", baselineSha, finalHead: await command("git", ["rev-parse", "HEAD"], root),
  nextVersion, bundler: "webpack", baseline, final, baselineInputFingerprint: previous?.baselineInputFingerprint ?? await fingerprint(baseline), finalInputFingerprint: await fingerprint(final),
  syntheticOnly: true, buildComplete: false, createdAt: new Date().toISOString() };
await writeFile(resolve(receipt, "manifest.json"), JSON.stringify(manifest, null, 2));
if (process.argv.includes("--build")) {
  const nextCli = resolve(root, "node_modules/next/dist/bin/next");
  for (const [name, directory] of previous ? [["final", final]] : [["baseline", baseline], ["final", final]])
    await command(process.execPath, [nextCli, "build", "--webpack"], directory, resolve(receipt, (previous ? 'refresh-' + final.split(/[\\/]/).at(-1) : name) + "-build.log"));
  await writeFile(resolve(receipt, "manifest.json"), JSON.stringify({ ...manifest, buildComplete: true,
    baselineBuiltSourceFingerprint: await fingerprint(baseline), finalBuiltSourceFingerprint: await fingerprint(final),
    fingerprintNote: "Input fingerprints precede Next-generated next-env/tsconfig changes. Built source fingerprints exclude .next and node_modules. Delivered browser chunks have independent SHA-256 hashes in report.json." }, null, 2));
}
console.log(JSON.stringify({ receipt, buildComplete: process.argv.includes("--build"), nextVersion }));
