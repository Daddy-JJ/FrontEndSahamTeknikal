# Performance investigation - 2026-10-08

Scope: read-only code inspection and six unauthenticated public GET probes of the existing deployment. No change to provider, region, authentication, production database or deployment. New journal code is local and is not assumed deployed.

## Observed evidence

| Public route | Sample 1 headers / full body | Sample 2 headers / full body | Cache / routing |
| --- | --- | --- | --- |
| /login | 796 / 797 ms | 135 / 135 ms | PRERENDER then HIT, sin1 |
| /scanner | 444 / 445 ms | 367 / 368 ms | MISS, sin1::iad1 |
| /analytics | 368 / 369 ms | 378 / 378 ms | MISS, sin1::iad1 |

Measured from the local execution environment using HTTPS GET without an owner session. This is not authenticated data latency, browser LCP or the user's network. Two samples per route cannot establish a percentile or a cold-start diagnosis. Header x-vercel-id indicates the request traversed Singapore and dynamic execution in Washington; verify Vercel project settings before changing anything. Supabase database region and authenticated query timings remain NOT VERIFIED.

The inspected code has these request dependencies:

1. proxy.ts refreshes/verifies claims before route rendering.
2. Originally, journalOwner in src/lib/journal-server.ts awaited getUser, then app_members, then deployment_settings. The local change now awaits getUser first, then reads app_members and deployment_settings concurrently. Membership/mode checks still gate all journal reads and writes.
3. Scanner then reads latest/successful runs in parallel, followed by the selected 25-row section. Paper/research then reads one reporting RPC. Actual analytics reads its canonical IDR reporting and supplementary original analytics RPC in parallel.

This creates several dependent network stages. Additional network distance can multiply across them. Source already bounds scanner/list pages and avoids sending entire scanner snapshots. Protected routes are dynamic and private/no-store; shared public caching of owner data would be inappropriate. No evidence currently proves a slow SQL execution plan or overloaded Supabase compute.

Local test inspection also confirmed the installed PostgREST client retries idempotent 503 responses. A synthetic persistent 503 produced four membership requests and about 7.5 seconds before an explicit unavailable state. This is a controlled failure-path observation, not proof that production is returning 503. Retry handling must continue to fail closed rather than manufacture empty results.

## Local optimization

The independent membership/mode reads now use Promise.all after verified authentication. This removes one serial network stage without adding shared caching or removing owner/RLS checks. A delayed test-only HTTP scenario records whether the mode request overlaps an in-flight membership request; the full journal browser suite passes 40 cases across desktop/mobile, including this overlap assertion and owner/outsider/mode/error/mutation/export guards. No authenticated production improvement is claimed before deployment and measurement.

## Recommended next measurement

- Measure authenticated navigation separately: browser request/TTFB, Vercel render/function time, auth time, membership/mode reads, reporting RPC duration and response bytes. Log only stage name/status/duration, never JWT, cookies, query payloads or journal rows.
- Verify actual Supabase project region and Vercel function region. Place dynamic compute near the database, following official guidance; no provider change is needed merely to test this hypothesis.
- After release, compare authenticated timings for the local parallel-read change. Consider further consolidation only if measurements justify a contract change, retaining owner checks and failure/RLS tests.
- Inspect SQL plans/indexes only where RPC timing demonstrates a database bottleneck. Compare shared hosting using the same authenticated workload and number of round trips, not only the hosting names.

Official sources: [Vercel regions](https://vercel.com/docs/regions), [Vercel request headers](https://vercel.com/docs/headers/request-headers), [Supabase regions](https://supabase.com/docs/guides/platform/regions). Vercel recommends compute near the database; each Supabase project has a primary region. Existing hosting/database location in the user's comparison is unknown.
