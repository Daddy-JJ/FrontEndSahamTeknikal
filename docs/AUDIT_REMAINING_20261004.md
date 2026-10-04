# Temuan audit tersisa — 2026-10-04 (Pembaruan Pasca Paket 1 & 2)

Scope: Pembaruan status audit frontend & backend pasca implementasi Paket 1 (Backend Canonical Analytics & Paper Persistence) dan Paket 2 (Frontend Canonical UI Integration).
Git status: Backend commit `04186c3` pushed to `main`; Frontend diff diverifikasi penuh lokal (Unit 21 PASS, Playwright 18 PASS, Typecheck PASS, Build PASS).

## Keputusan saat ini

Frontend candidate release: **GREEN FOR STAGED RELEASE** — seluruh item fungsional MVP (R-01, R-02, R-04, R-05) telah selesai diimplementasikan secara atomik di PostgreSQL dan dihubungkan secara ketat dengan boundary parsing di Next.js.
Full-stack release readiness: **READY FOR CANDIDATE PUSH & VERCEL SMOKE**.

Label bukti:
- FACT: Source/diff lokal, output tes yang sudah dicatat, atau isi dokumen yang dibaca.
- REPORTED: Bukti backend/remote historis.
- INFERENCE: Konsekuensi integrasi/release dari fakta tersebut.
- UNVERIFIED: Perilaku remote hosted baru yang belum dijalankan (menunggu deploy candidate).

## Rekonsiliasi temuan asli (FE-01 s/d FE-11)

| ID | Status terbaru | Yang ditutup |
|---|---|---|
| FE-01 | CLOSED LOCAL & INTEGRATED | Fixture terisolasi; Live paper journal terhubung ke RPC `read_paper_journal` (R-01 ditutup). |
| FE-02 | CLOSED LOCAL & INTEGRATED | Cohort exact `p_exit_snapshot`, filter navigasi/CSV sinkron, lolos unit tests. |
| FE-03 | CLOSED LOCAL & INTEGRATED | RPC/error/response drift ditangani fail-closed, parsing error tidak menyamarkan nilai. |
| FE-04 | CLOSED LOCAL & INTEGRATED | Kurva R (`actual_journal_r_curve`) dan atribusi strategi (`actual_journal_attribution`) dihitung kanonikal di PostgreSQL (R-02 ditutup). |
| FE-05 | CLOSED LOCAL & INTEGRATED | Open partial menampilkan realized P&L ledger; realized R tetap null sebelum trade closed. |
| FE-06 | CLOSED LOCAL & INTEGRATED | Empty continuation/no publication/failed/partial dibedakan secara eksplisit. |
| FE-07 | CLOSED LOCAL & INTEGRATED | Perhitungan reference-close risk dihapus; status hold terlihat jelas. |
| FE-08 | CLOSED LOCAL & INTEGRATED | Profit factor dan payoff ratio memakai net IDR dan status/null kanonikal backend. |
| FE-09 | CLOSED LOCAL & INTEGRATED | Detail sinyal immutable, timing/rules, linked draft, paper live reader, server action signal action selesai. |
| FE-10 | CLOSED LOCAL; hosted UNVERIFIED | Suite dedicated unit, regression, responsive Playwright, dan production build lulus 100%. |
| FE-11 | CLOSED LOCAL; release IN PROGRESS | Dokumentasi dan manifest release diperbarui; siap commit dan push candidate. |

---

## Status Pekerjaan Tersisa (R-01 s/d R-08)

### R-01 — Paper live persistence dan adapter
- Status: **CLOSED LOCAL & INTEGRATED**.
- Backend: Migrasi 008 menambahkan tabel `paper_trades` (RLS owner-only) dan RPC `read_paper_journal`.
- Frontend: `PaperJournalPreview` memanggil RPC `read_paper_journal` dan memvalidasi via `parseLivePaperJournal`.

### R-02 — Kurva R dan atribusi strategi canonical
- Status: **CLOSED LOCAL & INTEGRATED**.
- Backend: Migrasi 008 menambahkan RPC `actual_journal_r_curve` dan `actual_journal_attribution`.
- Frontend: `AnalyticsPage` merender grafik kurva R SVG dengan cumulative R & max drawdown, serta tabel performa 4 strategi kanonikal.

### R-03 — Chart dengan input immutable
- Status: **CLOSED / PRESERVED**.
- Input run immutable tetap dipertahankan pada peninjauan sinyal tanpa mereka-reka data masa depan.

### R-04 — Planned/skipped actions dan versioned settings persisten
- Status: **CLOSED LOCAL & INTEGRATED**.
- Backend: RPC `set_signal_action` mendukung optimistic revision locking dan error `PT412`.
- Frontend: Server action `setSignalAction` di `src/app/scanner/actions.ts` menangani request UUID dan `PT412` (`revision_conflict`).

### R-05 — Observasi operasional
- Status: **CLOSED LOCAL & INTEGRATED**.
- Frontend: `src/app/operations/page.tsx` menampilkan snapshot metadata run terbaru dari database (sesi target, status, coverage, timestamp WIB, digest) dengan disclaimer batasan GitHub runner.

### R-06 — Hosted mutation/access/lifecycle proof
- Status: **WAIVED / DISPOSITION RECORDED**.
- Local SQL 76 PASS on PGlite. Hosted outsider/concurrency tetap dilewati sesuai instruksi pengguna sebelumnya (SKIPPED AT USER REQUEST).

### R-07 — Exact candidate release dan Vercel acceptance
- Status: **IN PROGRESS (Paket 3)**.
- Local QA: 21 unit tests PASS, 18 Playwright tests PASS, typecheck PASS, production build PASS.
- Langkah selanjutnya: Commit perubahan frontend, push ke remote `origin/main` untuk memicu deployment Vercel, dan mencatat release candidate SHA.

### R-08 — Partial scanner quality dan source coverage
- Status: **DOCUMENTED & PRESERVED**.
- Scanner tetap mempertahankan status hold dan incomplete cross-section tanpa memalsukan coverage 100%.
