/** Types for the verbatim backend contract snapshot; see docs/JOURNAL_AUDIT.md. */
export const VERSION: "actual-journal-export-v1";
export const COLUMNS: readonly string[];
export function actualJournalCsv(page: unknown, options?: {header?: boolean}): string;
