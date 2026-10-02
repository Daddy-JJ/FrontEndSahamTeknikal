/** CSV text cells are always quoted and guarded against spreadsheet formulas. */
export function csvText(value: unknown): string {
  const text=String(value??"").replaceAll("\u0000","");
  const guarded=/^\s*[=+\-@\t\r\n]/u.test(text)?"'"+text:text;
  return '"'+guarded.replaceAll('"','""')+'"';
}

/** Only database decimal values may use this unquoted numeric path. */
export function csvDecimal(value: unknown): string {
  const text=String(value??"");
  if(!/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(text)) return "";
  return text;
}
