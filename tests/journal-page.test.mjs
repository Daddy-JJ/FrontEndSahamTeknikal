import assert from "node:assert/strict";
import { test } from "node:test";
import { journalPageNumber, journalHistorySelection, journalHistoryHref } from "../src/lib/journal-page.ts";

test("journal page rejects ambiguous or excessive offsets",()=>{
  assert.equal(journalPageNumber(undefined),1);
  assert.equal(journalPageNumber("2"),2);
  for(const value of ["0","-1","1.5","01","10001","abc",["1","2"]])
    assert.equal(journalPageNumber(value),null);
});

test("event section navigation requests one bounded page",()=>{
  assert.deepEqual(journalHistorySelection({}),{section:"fills",page:1});
  assert.deepEqual(journalHistorySelection({section:"notes",page:"2"}),{section:"notes",page:2});
  assert.equal(journalHistoryHref("trade","notes",2),"/journal/trade?section=notes&page=2");
  assert.equal(journalHistorySelection({section:["fills","notes"]}),null);
  assert.equal(journalHistorySelection({section:"unknown"}),null);
});
