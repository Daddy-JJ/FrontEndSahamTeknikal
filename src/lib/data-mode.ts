import "server-only";

export function appDataMode(): "fixture" | "live" | null {
  const mode = process.env.DATA_MODE ?? (process.env.NODE_ENV === "development" ? "fixture" : "live");
  return mode === "fixture" || mode === "live" ? mode : null;
}

export function fixturePreviewAllowed(): boolean {
  return process.env.NODE_ENV === "development" || process.env.ALLOW_FIXTURE_PREVIEW === "true";
}
