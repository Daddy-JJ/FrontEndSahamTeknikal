import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { actualJournalCsv, COLUMNS, VERSION } from "../src/generated/actual-journal-export.mjs";

const row=Object.fromEntries(COLUMNS.map(k=>[k,null]));
Object.assign(row,{contract_version:VERSION,mode:"actual",data_mode:"fixture",ticker:"TEST",initial_stop:"9999999999999999.1234",realized_pnl_idr:"-1000.0000"});
const page={contract_version:VERSION,mode:"actual",data_mode:"fixture",rows:[row]};
test("backend CSV snapshot is unchanged and retains exact decimals and negative losses",()=>{
  assert.equal(createHash("sha256").update(readFileSync(new URL("../src/generated/actual-journal-export.mjs",import.meta.url))).digest("hex"),
    "aa855662a503de3fea11af6548763e0c5e47a1a89f87ce2012edc270e9a27cda");
  const csv=actualJournalCsv(page);
  assert.ok(csv.includes('"9999999999999999.1234"'));
  assert.ok(csv.includes('"-1000.0000"'));
  assert.ok(csv.endsWith("\r\n"));
});
test("canonical CSV guards formula prefixes and rejects incompatible or imprecise payloads",()=>{
  for(const ticker of ["=cmd"," \t=cmd","\u0001=cmd","\t@cmd","+cmd","-cmd"])
    assert.ok(actualJournalCsv({...page,rows:[{...row,ticker}]}).includes('"\''+ticker+'"'));
  assert.throws(()=>actualJournalCsv({...page,mode:"paper"}));
  assert.throws(()=>actualJournalCsv({...page,rows:[{...row,data_mode:"live"}]}));
  assert.throws(()=>actualJournalCsv({...page,rows:[{...row,initial_stop:100}]}));
});
