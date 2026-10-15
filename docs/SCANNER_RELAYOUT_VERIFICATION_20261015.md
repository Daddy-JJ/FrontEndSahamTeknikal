# Scanner relayout - local verification, 15 October 2026

Status: IMPLEMENTED AND VERIFIED LOCALLY. These checks precede commit/push delivery;
consult the shared handoff for delivery evidence. No Production deployment verification,
backend runtime change or migration is established by these local checks.
The dated released chart baseline in IMPLEMENTATION_STATUS is a different source state.

## Action / Proof

| Stage | Implemented behavior | Local proof |
| --- | --- | --- |
| 1 | Stable 50:50 split for all tabs; explicit expand/restore; one desktop nonmodal/mobile modal dialog | 1280/1440/1920px pane widths/heights within 2px; breakpoint roundtrip during in-flight request retains one GET |
| 2 | Sticky ticker, independent scroll, reachable headings/pagination; audit disclosure; scroll reset for a new ticker | Exact backend metadata hashes still checked after opening disclosure; stale 221px scroll reproduced RED then reset to 0 GREEN |
| 3 | Grouped container toolbar; adaptive price/volume/MACD frame; retained pan/zoom | Helper 3 tests, 100% line/branch/function coverage for this helper only; renderer zoom/toggle/resize and one-GET browser cases PASS |
| 4 | Navigation/auth/error/fixture regression and release build | Results below; read-only React/a11y review found no HIGH/CRITICAL, three Scanner findings corrected and reviewed |

## Checks run

- Unit suite: **80 PASS**. The new pure sizing helper independently rerun: **3 PASS**, 100% coverage; no claim of whole-UI coverage.
- Full initial Scanner regression: **86 PASS / 7 viewport-specific SKIP / 3 FAIL**.
  All failures were the legacy assertion that audit hashes were visible before opening
  the newly approved disclosure. The assertion now opens it and checks the same exact hashes.
- Final targeted Scanner regression after accessibility/scroll fixes: **21 PASS / 9 viewport-specific SKIP / 0 FAIL**.
  Includes all three failed provenance cases, fixed-size tabs, focus, expanded state,
  in-flight breakpoint transition, scrolling, chart render and navigation/return restoration.
- Short viewport at **200% CSS zoom: 1 PASS**. This is CSS zoom stress, not a claim of browser-chrome zoom testing.
- Chart worker: 6 desktop/mobile renderer/refresh/disposal cases PASS, plus final 2 toolbar/sizing/request-count followups PASS.
- Journal/Analytics chart integration: **15 PASS** across desktop/mobile/tablet;
  preserves displayed canonical facts, URL/cohort, storage failures and explicit backend errors.
- Workspace chart: **6 PASS**; synthetic labels, lazy canvas, unchanged review facts and zero live requests.
- Typecheck, full lint plus changed-file followup, production Next.js/Turbopack build and diff-check PASS.
- Text contrast from the actual palette: body13.80, muted7.45, active tab8.63,
  chart action8.56 and explicit focus outline10.43 to1. This is a palette check, not a full WCAG audit.
- Synthetic desktop/mobile screenshots were visually inspected; no observed hydration/page errors in the integrated chart cases.

Local JSON reports/source hashes are retained under ignored test-results. Older failing
reports are retained separately; they are not silently relabelled PASS or added together
as independent unique coverage. No private financial data was exported for these checks.

## Boundaries and next action

No API/schema/dependency or canonical financial behavior changed. Browser code continues
to format backend values; actual ledger/CSV and paper/evaluation rules remain canonical.
No price request is added by layout-only resize/expand. Context/view/reload still follow
the existing fetch contract. Fixtures are explicit test/dev data, never production fallback.

This source has not been deployed or tested through an authenticated Production owner
browser. Native browser-chrome zoom200%, real outsider JWT and future market/job stability
are not established by these local UI tests. Follow the applicable release authorization
and [deployment checklist](VERCEL_DEPLOYMENT_CHECKLIST.md) before claiming live acceptance.
