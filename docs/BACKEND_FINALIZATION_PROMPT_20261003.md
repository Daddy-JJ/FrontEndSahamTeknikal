# Backend finalization prompt — align with frontend recovery review

## Nonempty real-trade owner read / analytics / CSV - 2026-10-03

Read-only existing owner session now verified the user-supplied NCKL closed
trade e6dcfcc6-fd57-4e1d-9148-ecd5a738edc4 at revision5. Analytics exact MA10
snapshot and closed export both show1 trade, with selected snapshot retained
through /api/export/journal?exit_snapshot=ma10&after=start. CSV downloaded and
parsed: the provided trade/revision, actual-journal-export-v1, live/closed,
actual-ma10-v1, risk6500.0000, P&L1244.0000, R0.191384615385 and fees256.0000
match the rendered ledger/analytics values. These are backend-supplied figures,
not recomputed finance metrics. Fee quality remains includes_estimates.
Final export page has no continuation; >200 production cursor is NOT VERIFIED.
Earlier empty-ledger and no-CSV-download observations remain historical.

User's outsider and independent-session/concurrency skips remain SKIPPED /
NOT VERIFIED, never assumed PASS; disabled-owner remains untested. No lifecycle,
replay, conflict or fee-status mutation was sent. No new scanner/migration probe,
backend edit, production write, commit/push or Vercel deployment. RPC HTTP status
was not separately captured. No broker document or deployed Vercel proof.
Evidence: docs/evidence/real-trade-owner-read-export-20261003.json.
Current backend continuation prompt: docs/BACKEND_CONTINUATION_REAL_TRADE_20261003.md.


## User-provided real trade and skipped gates - 2026-10-03

Latest user supplies actual production trade e6dcfcc6-fd57-4e1d-9148-ecd5a738edc4 and requests skipping
point3 (outsider session checks) and point4 (independent sessions/concurrency),
asking to assume PASS. Record these as SKIPPED at user request / NOT VERIFIED;
never convert unexecuted checks to PASS. Backend release decision must disclose
these skipped proofs. Existing permissions, RLS policies and app_members are
unchanged; no disabled-owner or two-session denial/concurrency proof was added.

Read-only inspection of the user-provided localhost journal page observed:
NCKL closed, revision5, actual-ma10-v1, data live, buy/sell fills, a corrected buy
and estimated fee status. User confirms it is a genuine production transaction.
This is available input for backend ledger/receipt inspection, not certification
of broker values, complete lifecycle execution, replay or stale conflict.
No journal mutation, request replay, correction or Auth/member change was sent.
Older empty-ledger observations remain historical; do not rerun unchanged scanner
owner smoke or migration001-007 because this trade now exists.

Point1 approves publisher preparation; controlled production publication still
needs the concrete reviewed plan/execution authorization. Scheduler remains off.
No frontend commit/push/deploy authorization follows. Current full-stack NO-GO
remains pending publisher, remaining evidence/release disposition and Vercel
smoke. Do not claim full-stack PASS from the skipped tests or this trade URL.
Evidence: docs/evidence/real-trade-and-skipped-gates-20261003.json.


## Latest backend gate alignment - 2026-10-03 (Asia/Jakarta)

Documentation-only alignment from backend BACKEND_FINALIZATION_REPORT_20261003.md,
FRONTEND_DEPLOYMENT_HANDOFF.md and github-full-universe-smoke-20261003.json.
No unchanged owner smoke, migration001-007 check, runner dispatch or artifact
redownload was performed by frontend. Backend evidence is accepted as reported;
this update does not claim independent frontend verification of its artifact hash.

- Owner production snapshot read remains PASS; existing evidence is preserved.
- Full100 hosted GitHub fetch/evaluation PASS within partial-quality scope:
  run37114744856, commit b4762fd063f45df6a9b29fb3d0a75b1fbdc8d371,
  finished2026-10-03T09:57:22.242630Z (16:57:22 WIB). Backend downloaded artifact
  11270993302 (1875 bytes), SHA256
  8f51cb6c35a0b6ce7d3312bb9bb7e679ce2a6e052822bd432c08c3778b781726,
  and reports the independent hash match. Prior failed run37114212953 stays FAIL.
- Calendar/universe100mapping PASS within configured dates; fresh LOCAL target
  recheck100/100 recovered, while the earlier failed fetch remains FAIL. Five
  short histories remain ineligible for600-bar strategies. Quality remains
  partial45/100:25 action holds,30 quality holds,zero signals,RS incomplete.
- Hosted anonymous read denial14/14 PASS according to backend; this does not
  prove authenticated outsider/disabled-owner or mutation authorization.
- Production publisher still BLOCKED: no database publication attempted, receipt
  null. Production snapshot is still8f634f6c-efae-4837-b1eb-1db04de6ffd2,
  target2026-10-02, stored2026-10-02T17:50:07.347251Z, digest
  0aefe872fe3aa9ead45f1f98f9980ff96cd819142ddcc0f9f64a0a83c1c4c121.
  Runner digest2ed30d1968c2aa8b6491541d712fc37aca8a475d8d7de9f8e84d247aab512241
  belongs to the runner artifact only; its timestamp/digest is not this snapshot.
- Current run items lack an explicit per-item revision-ID/fetch-time binding for
  all held/no-signal items. Do not substitute latest market revision provenance
  for this run's input, or equate stored_at with provider freshness.
- Hosted outsider/disabled-owner/mutation/lifecycle/concurrency remain BLOCKED
  without genuine approved activity/identities or an authorized isolation method.
  Scheduler OFF; full-stack/Vercel NO-GO; no frontend commit/push/deploy permission.

Adapter/UI and PT412/idempotency, p_exit_snapshot, closed export limit200/cursor
p_after and explicit correction FK remain unchanged. Older pending-runner notes
below are historical and superseded by this section. Next backend gates are
controlled hosted publisher and mandatory authenticated/mutation proofs; do not
reopen unchanged migration, owner-read or successful runner fetch/evaluation.


## Historical prompt - runner steps already completed; use gate update above

Lanjutkan project backend saja di C:\xampp\htdocs\SahamTeknikal\backend.
Baca AGENTS.md dan canonical SOT/PRD/TECHNICAL_DOC/CODEX_HANDOFF, lalu
IMPLEMENTATION_STATUS.md, docs/SCANNER_RECOVERY_REPORT_20261003.md,
docs/SCANNER_LIVE_READINESS.md, docs/PRODUCTION_READINESS.md dan
docs/FRONTEND_DEPLOYMENT_HANDOFF.md. Baca frontend read-only:
docs/FRONTEND_RELEASE_REVIEW_20261003.md serta
docs/evidence/scanner-owner-production-20261003.json. Pertahankan perubahan
lokal dan audit git sebelum edit. Jangan edit frontend atau deploy Vercel.

Frontend kini mempunyai bukti nyata owner production melalui localhost3050:
owner UUID cocok dengan owner enabled; latest forward/live run
8f634f6c-efae-4837-b1eb-1db04de6ffd2 target2026-10-02; scanner GET run/items/
signals HTTP200;100 ticker unik dalam4x25:45 evaluated,25 corporate_action_hold,
30 data_quality_hold;0 signals;RS incomplete. UI menampilkan coverage parsial,
hold per ticker, target dan stored_at UTC/WIB, tidak menampilkan RS ranking,
dan tidak menganggap timestamp publikasi sebagai freshness provider.
Journal/analytics/export production kosong; exact Fixed2R snapshot dipertahankan
sampai export0closed/lastpage. Tidak ada QAtrade atau JWT dicetak/disalin.
Local tests scanner27/27,journal selected15/15,unit12/12,lint/build/typecheck
lulus. Itu bukan bukti hosted lifecycle atau Vercel GO.

Gunakan evidence frontend ini untuk menutup gate owner read snapshot terbaru;
jangan membuka ulang gate migration001–007/owner read tanpa perubahan baru
yang relevan. Pisahkan owner read PASS dari hosted mutation/RLS yang belum PASS.

Tuntaskan gate backend yang masih wajib dengan bukti, bukan hanya rencana:
1. Audit ulang kalender runtime,100 mapping/effective universe, warm-up dan
   target/latest-complete candle. Fetch Yahoo terbaru yang gagal dan tidak
   dipublikasikan harus tetap FAIL. Cari data/source yang valid menggunakan
   provider yang sudah disetujui; jangan mengganti provider, mengambil paid
   tier, menghapus bar anomalous atau mengarang candle/penyesuaian.
2. Selesaikan review action/amendment dan klasifikasi308 anomaly rows30tickers
   sesuai sumber canonical. User menerima quality skips dengan alasan/coverage
   terlihat; ticker yang belum terbukti tetap hold. Partial tidak boleh
   dinyatakan100/100. RS tetap global hold sampai cross-section lengkap.
3. Tutup gate full-universe GitHub runner. Audit workflow manual-only lokal,
   pastikan izin commit/push/dispatch spesifik memang ada di chat backend;
   bila belum, siapkan diff konkret lalu minta izin itu. Jalankan dan simpan
   runURL,commitSHA,exitstatus,artifact dan hasil kualitas/publication receipt.
   Lima ticker atau runner lokal tidak menggantikan full-universe hosted run.
   Jangan mengaktifkan scheduler sebelum gate data/runner/backend lulus.
4. Tutup bukti hosted production Auth/HTTP/RLS yang mandatory: owner,anon,
   outsider,disabled-owner,isolation,replay/conflict,stalePT412/two-session,
   explicit correctionFK,ledger/fee/partial lifecycle,analytics p_exit_snapshot
   dan closed export p_limit200,p_after hingga has_more=false. Pisahkan bukti
   production dari local/disposable. Jangan membuat permanent QAproduction
   trade, mempromosikan akun atau mengubah Auth diam-diam. Pakai genuine
   owner-approved activity atau metode isolasi yang secara spesifik diizinkan.
   Jika tidak ada target/activity aman, catat BLOCKED dan minta input/izin
   minimum yang diperlukan; jangan mengganti bukti hosted dengan tes lokal.
5. Pertahankan RPC/PT412/export contract actual-journal-export-v1 dan FK
   actual_fill_corrections!actual_fill_corrections_fill_id_fkey. Jika metadata
   freshness/provenance memang dipersistenkan, berikan path/kontrak canonical
   ke frontend; jangan meminta frontend menebak atau membuat engine kedua.
6. Update status/readiness/handoff dengan matriks PASS/PARTIAL/BLOCKED, timestamp
   migration/history,run/provider/calendar/universe versions dan digest,
   runnerURL,sanitized owner/denial results serta gate yang tersisa.

Output yang dibutuhkan: perubahan backend, tes yang benar-benar dijalankan,
bukti hosted vs lokal yang terpisah, blocker + input minimum pengguna, dan
keputusan GO/NO-GO eksplisit. Jika partial-release diterima, jelaskan scope
serta semua hold; jangan menganggap persetujuan skip otomatis menutup gate
freshness/runner/RLS. Backend GO belum mengotorisasi deploy frontend. Setelah
mandatory backend gates PASS, kirim handoff final agar pengguna dapat memberi
otorisasi frontend terpisah, lalu Vercel production smoke. Jangan menyatakan
full-stack live sebelum kedua sisi lulus.
