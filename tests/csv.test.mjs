import assert from "node:assert/strict";
import { test } from "node:test";
import { csvText, csvDecimal } from "../src/lib/csv.ts";

test("CSV quotes text and neutralizes spreadsheet formulas after whitespace", () => {
  assert.equal(csvText("=HYPERLINK(\"https://example.test\")"),
    "\"'=HYPERLINK(\"\"https://example.test\"\")\"");
  for (const value of ["+SUM(1,1)","-cmd","@cmd","  =1+1","\t=1+1","\r=cmd","\n=cmd","\u0000=cmd","\ufeff=cmd"]) {
    assert.ok(csvText(value).startsWith("\"'"),value);
  }
  assert.equal(csvText("BBCA"),"\"BBCA\"");
  assert.equal(csvText("a,b\"c"),"\"a,b\"\"c\"");
  assert.equal(csvText("x\u0000y"),"\"xy\"");
});

test("only strict database decimals bypass text quoting", () => {
  assert.equal(csvDecimal("-1000.25"),"-1000.25");
  assert.equal(csvDecimal("1000"),"1000");
  assert.equal(csvDecimal("=1+1"),"");
  assert.equal(csvDecimal("1e6"),"");
  assert.equal(csvDecimal("1,000"),"");
  assert.equal(csvDecimal("9999999999999999.1234"),"9999999999999999.1234");
  assert.equal(csvDecimal(null),"");
  assert.equal(csvDecimal(Infinity),"");
});
