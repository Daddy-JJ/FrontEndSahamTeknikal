export function ensure(value: unknown): asserts value {
  if (!value) throw Error("chart_contract_invalid");
}
export function object(
  value: unknown,
  keys: string[],
): Record<string, unknown> {
  ensure(value !== null && typeof value === "object" && !Array.isArray(value));
  const o = value as Record<string, unknown>;
  ensure(
    Object.keys(o).length === keys.length &&
      keys.every((k) => Object.hasOwn(o, k)),
  );
  return o;
}
export function text(value: unknown, max = 512): asserts value is string {
  ensure(typeof value === "string" && value.length > 0 && value.length <= max);
}
export function nullableText(value: unknown, max = 512) {
  if (value !== null) text(value, max);
}
export function one(value: unknown, choices: readonly string[]) {
  ensure(typeof value === "string" && choices.includes(value));
}
export function integer(
  value: unknown,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
) {
  ensure(
    typeof value === "number" &&
      Number.isSafeInteger(value) &&
      value >= min &&
      value <= max,
  );
}
export function date(value: unknown): asserts value is string {
  ensure(
    typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value,
  );
}
export function nullableDate(value: unknown) {
  if (value !== null) date(value);
}
export function decimal(value: unknown, positive = true) {
  ensure(
    typeof value === "string" &&
      /^\d+(\.\d+)?$/.test(value) &&
      Number.isFinite(Number(value)) &&
      Number(value) <= Number.MAX_SAFE_INTEGER &&
      (positive ? Number(value) > 0 : Number(value) >= 0),
  );
}
export function array(value: unknown, max = 500): asserts value is unknown[] {
  ensure(Array.isArray(value) && value.length <= max);
}
export function sortedSessions(values: unknown[]): asserts values is string[] {
  values.forEach((v, i) => {
    date(v);
    ensure(i === 0 || String(values[i - 1]) < v);
  });
}
export function cursor(has: unknown, value: unknown) {
  ensure(typeof has === "boolean");
  if (has) text(value, 2048);
  else ensure(value === null);
}
export function source(value: unknown) {
  const s = object(value, [
    "series_id",
    "input_digest",
    "resolved_input_digest",
    "resolved_cutoff",
    "provider",
    "provider_version",
    "price_basis",
    "scope",
    "fetched_at",
    "stored_at",
    "history_start",
    "last_market_session",
  ]);
  ensure(
    typeof s.series_id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        s.series_id,
      ),
  );
  for (const k of ["input_digest", "resolved_input_digest"])
    ensure(typeof s[k] === "string" && /^[0-9a-f]{64}$/.test(s[k] as string));
  for (const k of ["provider", "provider_version", "price_basis"])
    text(s[k], 128);
  one(s.scope, ["forward", "paper_recovery", "fixture"]);
  for (const k of ["fetched_at", "stored_at"])
    ensure(
      typeof s[k] === "string" &&
        /T.*(Z|[+-]\d{2}:\d{2})$/.test(s[k] as string) &&
        !Number.isNaN(Date.parse(s[k] as string)),
    );
  for (const k of ["resolved_cutoff", "history_start", "last_market_session"])
    date(s[k]);
  ensure(
    String(s.history_start) <= String(s.last_market_session) &&
      String(s.last_market_session) <= String(s.resolved_cutoff),
  );
}
