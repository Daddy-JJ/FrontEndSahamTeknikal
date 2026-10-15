/** A deliberately minimal child environment: never inherit provider/cloud/operator credentials. */
export function chartPerformanceEnv(mode = "live") {
  if (!["live", "fixture"].includes(mode)) throw Error("invalid_benchmark_mode");
  const system = Object.fromEntries(["PATH", "Path", "SYSTEMROOT", "SystemRoot", "WINDIR", "COMSPEC", "TEMP", "TMP", "USERPROFILE", "APPDATA", "LOCALAPPDATA"]
    .filter(key => process.env[key]).map(key => [key, process.env[key]]));
  return { ...system, NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1", DATA_MODE: mode,
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:3053", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "synthetic-chart-perf-key",
    APP_OWNER_USER_ID: "22222222-2222-4222-8222-222222222222", ALLOW_FIXTURE_PREVIEW: mode === "fixture" ? "true" : "false" };
}
