import assert from "node:assert/strict";
import { test } from "node:test";
import { journalFilters, validSessionDate } from "../src/lib/journal-filters.ts";

test("calendar validation rejects rollover and impossible dates",()=>{
  for (const value of ["2026-02-29","2026-02-30","2026-13-01","2026-00-01","0000-01-01","date"])
    assert.equal(validSessionDate(value),false,value);
  assert.equal(validSessionDate("2024-02-29"),true);
});
test("invalid filters never broaden an analytics cohort",()=>{
  for(const q of [{from:"2026-09-30",to:"2026-09-01"},{strategy:"UNKNOWN"},{from:["2026-01-01","2026-02-01"]},{exit_version:"=cmd"},
    {exit_snapshot:"unknown"},{exit_snapshot:"fixed2r",exit_version:"actual-ma10-v1"}])
    assert.equal(journalFilters(q),null);
  assert.deepEqual(journalFilters({}),{from:null,to:null,strategy:null,exitVersion:null,exitSnapshotKey:null,exitSnapshot:null});
  assert.deepEqual(journalFilters({exit_snapshot:"fixed2r"})?.exitSnapshot,
    {version:"actual-fixed2r-v1",mode:"fixed_rr",target_r:2});
});
