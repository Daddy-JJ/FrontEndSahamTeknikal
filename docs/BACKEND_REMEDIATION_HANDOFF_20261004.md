# Backend coordination after frontend remediation — 2026-10-04

Preparation only. This is a copyable prompt, not automatic messaging or remote
authorization. Frontend edits remain local; backend repository was read-only.

```text
Lanjutkan di repository backend SahamTeknikal saja. Baca AGENTS.md, SOT.md,
PRD.md, TECHNICAL_DOC.md, status backend terbaru serta frontend/PLAN.md dan
frontend/docs/FRONTEND_REMEDIATION_REPORT_20261004.md secara read-only.

Frontend telah menutup fixture paper pada live, memperbaiki analytics cohort
dan p_exit_snapshot/error/null-status, serta menghapus agregasi finansial JS.
Partial realized P&L berasal dari ledger; scanner membedakan failed/partial/
continuation/no-published dan menahan RS incomplete. Detail immutable signal
menampilkan rules/pivot_date/available_session/provenance yang memang ada.
Date/strategy reads dibatasi dan pagination terikat run. Draft dari signal
memakai optional signal_id existing dengan verifikasi owner/context; tidak
membuat fill otomatis. Operasi menyediakan link GitHub Actions tanpa PAT/dispatch.
Belum ada commit/push/deploy frontend atau hosted smoke baru dari perubahan ini.

Jangan membuka ulang migration001–007 atau mengubah rumus trading. Pertahankan
apply_actual_journal, expected_revision/idempotency/PT412 HTTP412,
actual_journal_analytics p_exit_snapshot, export_actual_journal p_status=closed,
p_limit=200/p_after sampai has_more=false, actual-journal-export-v1 dan explicit
actual_fill_corrections!actual_fill_corrections_fill_id_fkey.

Tuntaskan kontrak yang masih hilang secara bertahap:
1. Usulkan additive canonical analytics read model untuk kurva R dan atribusi
   strategi. Sama dengan cohort closed exit_session_Asia_Jakarta pada RPC/CSV:
   from/to/strategy/exit_version/exact exit_snapshot, mode actual/data_mode live
   atau fixture, monetary basis IDR, fee quality. Return decimal backend, count,
   ordered points dan explicit completeness/bounded pagination. Tentukan
   definisi strategi attribution dan kurva; jangan membuat definisi portofolio
   baru diam-diam. Frontend hanya format/plot. Buktikan empty/partial-history,
   beberapa strategi/exit, dan >200 trades dengan parity KPI/CSV.
2. Usulkan hosted persistence dan owner-protected read model paper terpisah
   actual. Runner-local files belum cukup untuk UI live. Sertakan experiment
   activation/version, cost basis/status, pending/open/skipped/closed/data-hold,
   next-session fill timing, immutable initial risk, ambiguous dual-hit serta
   alternatif outcome. Jangan aktifkan exit tambahan secara implisit.
3. Usulkan chart input binding immutable pada chosen signal/run: raw/derived
   revision IDs dan indicator series backend yang dibekukan, provider/date/
   adjustment/config/version. Jangan mengambil latest market revision untuk
   historical run; held/no-signal juga perlu explicit binding jika ditampilkan.
4. Dokumentasikan kontrak set_signal_action existing: allowed state enum, payload,
   read revision/request receipt, exact UUID replay, changed-payload conflict dan
   stale PT412. Sediakan contoh tersanitasi/test target untuk frontend planned/
   skipped UI. Versioned settings/experiment changes dan operational metrics
   memerlukan kontrak, bukan local-state success. Link manual GitHub sudah ada.

Sebelum material public API/schema change, dokumentasikan request/response/error,
scope/RLS, compatibility dan rollout order untuk review. Nama kapabilitas di atas
bukan API yang sudah ada. Jangan mengedit applied migration demi kenyamanan.
Implementasi backend mengikuti otorisasi chat backend; prompt ini tidak memberi
izin production mutation/Auth/dispatch/publisher/scheduler/deploy.

Proof: backend deterministic/unit/SQL checks, development/disposable real Auth
HTTP owner/denial/idempotency/concurrency yang diotorisasi, lalu sanitized handoff
berisi signature, response samples, migration/version/hash dan hasil aktual.
Jangan menanam QA trade production. User-waived outsider/concurrency tetap
SKIPPED/NOT VERIFIED, tidak menjadi PASS. Local fixture bukan hosted production.

Pertahankan lineage publication aktual: run3c700de4-8389-400e-b862-31f2c8998a64,
target2026-10-02, stored2026-10-03T12:44:34.492091Z, digest653f9f9168b20dabfc14dc9fa18090e6ed48f5d63546c897107cc44258dd4110 berasal LOCAL capture,
bukan GitHub37114744856. Ini prior reported evidence, bukan probe baru frontend.
45evaluated/25actionhold/30qualityhold/0signals/RS incomplete tetap partial.
Hosted publisher, raw owner receipt/audit, disabled-owner dan hosted journal
error-path/lifecycle/concurrency tetap sesuai status bukti terbaru. Scheduler
jangan dinyatakan aktif tanpa bukti/otorisasi. Pisahkan corrective limited release
dari full MVP. Frontend deployment tetap membutuhkan otorisasi tersendiri dan
smoke pada exact Vercel release. Berikan handoff dengan PASS/PARTIAL/BLOCKED/
SKIPPED/NOT VERIFIED, jangan menyatakan full-stack GO dari tes lokal.
```
