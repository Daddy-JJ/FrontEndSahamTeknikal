# SahamTeknikal frontend

Next.js owner application for IDX Night Scanner, Smart Money Flow & Bandarmology (`/broker-flow`), actual/paper journals, Analytics and ticker charts.
This folder is an independent Git repository; Vercel project root is `.`.
Backend source, migrations, canonical financial arithmetic and market-data artifacts belong to the sibling backend repository.

## Read only what the task needs

- [AGENTS.md](AGENTS.md): mandatory local instructions; shared workspace context is optional.
- [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md): portable product, stack and repository boundaries.
- [PLAN.md](PLAN.md): authorized active work and Action/Proof; completed plans are archived.
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md): recorded release baseline and open evidence boundaries.
- [SOT.md](SOT.md): canonical trading rules; synchronized copy of root SOT.
- [Deployment checklist](docs/VERCEL_DEPLOYMENT_CHECKLIST.md): reusable release procedure.
- [Chart contract](contracts/ticker-chart-v1.md): read when modifying chart boundaries.
- [Archive index](docs/archive/README.md): optional historical evidence; do not read by default.

## Local setup

Use Node 22.x and npm 12.0.2, as declared in [package.json](package.json).

```powershell
npm.cmd ci
npm.cmd run dev
```

Development and production-start commands bind `127.0.0.1:3050`.
Configure local environment using [.env.example](.env.example); keep real values in ignored environment files.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL for the selected environment |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Matching browser-safe publishable key |
| `DATA_MODE` | `live` for production; `fixture` for explicitly labelled development |
| `ALLOW_FIXTURE_PREVIEW` | Explicit fixture-preview permission; unset/false in Production |

Supabase GitHub OAuth uses `/login`, `/auth/callback` and `/auth/check`.
Dashboard login is separate from application login. Access requires an enabled owner membership and matching deployment data mode.

Owner password login also uses `/login`; `/auth/check` allows password setup/change after
recent authentication. It preserves the same Auth UUID, owner membership and RLS. GitHub
remains a fallback. Server-only alias/config and the cloud protection activation checklist
are documented in [password login](docs/LOGIN_PASSWORD_EXPLORATION.md). Missing configuration
disables password operations. Recovery stays disabled until verified SMTP/callback delivery.
Run isolated local Auth browser coverage with
`npx playwright test --config playwright.password.config.ts`; it uses loopback fake Auth,
never a production password, email delivery or journal mutation.
Production secrets, service-role keys, DB passwords and provider credentials never belong in this frontend.

## Commands

```powershell
npm.cmd run test:unit
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd test
npm.cmd run test:journal
npm.cmd run test:scanner
npm.cmd run test:scanner:release
npm.cmd run test:reporting
npm.cmd run test:chart
node --test tests/broker-flow.test.mjs
```

Select checks relevant to the task. Browser suites use isolated local HTTP doubles and labelled fixtures; their success does not prove authenticated hosted behavior. `npm.cmd test` alone does not cover every dedicated suite.

## Application boundaries

Scanner `/` in live mode and `/scanner` display published backend snapshots with coverage/hold/failure states. Ticker details expose Alasan sinyal, Chart and Data & sumber; `/chart/[ticker]` opens a dedicated owner chart.
Broker Flow `/broker-flow` provides Smart Money Flow and Bandarmology intelligence, featuring Wyckoff Market Quadrants (`[MA]`, `[MD]`, `[DA]`, `[DD]`), multi-horizon analysis (2D momentum, 5D weekly persistence, 10D structural base), and direct links to `/chart/[ticker]`. `/api/broker-flow` queries Supabase cloud table `broker_flow_ticker_horizons` with automatic fallback to static snapshot `public/data/broker_flow_horizons.json`.
`/journal`, `/journal/paper/[id]` and `/analytics?tab=paper|actual|signals` consume canonical RPCs. `/journal/export` and `/api/export/journal` preserve the actual CSV contract.
The browser formats results and plots backend series; it does not independently calculate official signals, ledger P&L, risk or statistics. Data failure never silently becomes fixture output or an empty successful result.

Current release facts belong in status; task steps belong in PLAN. Update those documents instead of prepending dated release blocks here.
