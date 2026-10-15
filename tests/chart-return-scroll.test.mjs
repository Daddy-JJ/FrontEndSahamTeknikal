import { test } from "node:test";
import assert from "node:assert/strict";
import { returnPage, scrollRecord, parseScrollRecord, scrollStorageKey } from "../src/lib/chart-return-scroll.ts";
test("return scroll matches exact cohort despite harmless query ordering", () => {
  assert.equal(returnPage("/analytics?tab=paper&from=2026-10-01"), "/analytics?from=2026-10-01&tab=paper");
  for (const unsafe of ["https://evil.test/analytics", "//evil.test", "/auth/logout", "/journal/id", "/analytics?x=%5cfoo", "/analytics#private"])
    assert.equal(returnPage(unsafe), null);
});
test("scroll records contain only bounded UI positions and match mode, page and freshness", () => {
  const record = scrollRecord("fixture", "/analytics?tab=paper", 421.5, [{ index: 0, left: 201.2, top: 1 }], 1000);
  assert.deepEqual(record, { version: 1, mode: "fixture", page: "/analytics?tab=paper", y: 421, regions: [{ index: 0, left: 201, top: 1 }], recordedAt: 1000 });
  const raw = JSON.stringify(record);
  assert.deepEqual(parseScrollRecord(raw, "fixture", "/analytics?tab=paper", 2000), record);
  assert.equal(parseScrollRecord(raw, "live", "/analytics?tab=paper", 2000), null);
  assert.equal(parseScrollRecord(raw, "fixture", "/analytics?tab=actual", 2000), null);
  assert.equal(parseScrollRecord(raw, "fixture", "/analytics?tab=paper", 1900001), null);
  assert.notEqual(scrollStorageKey("live"), scrollStorageKey("fixture"));
});
test("malformed and financial fields fail closed; excessive positions do not enter UI storage", () => {
  const record = scrollRecord("live", "/journal", 1, [], 1000);
  for (const value of ["{", JSON.stringify({ ...record, price: 1000 }), JSON.stringify({ ...record, y: -1 }), JSON.stringify({ ...record, regions: [{ index: 0, left: Infinity, top: 0 }] })])
    assert.equal(parseScrollRecord(value, "live", "/journal", 2000), null);
  assert.equal(scrollRecord("live", "/chart/ADRO", 1, [], 1000), null);
  assert.equal(scrollRecord("live", "/journal", NaN, [], 1000), null);
  assert.equal(scrollRecord("live", "/journal", 1, Array.from({ length: 25 }, (_, index) => ({ index, left: 0, top: 0 })), 1000), null);
});
