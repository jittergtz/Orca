# Orca Docs

This folder is the handoff map for agents and developers working in the Orca monorepo. Start here when you need to understand what each app/package owns, where to make a change, and how the main product flows fit together.

Orca is becoming a personalized news and research app. Users subscribe to broad topics like "AI" or very specific topics like "EU AI Act enforcement for healthcare startups", choose a cadence such as daily or weekly, and receive sharp reports built from high-quality web sources. Each report should start with a short TLDR that can be read in about 30 seconds, then continue into a polished article that is concise, useful, sourced, and pleasant to read.

## Read These First

- [Architecture](./ARCHITECTURE.md): system overview, app/package ownership, data flow, billing flow, and report-generation flow.
- [Agent Guide](./AGENT_GUIDE.md): practical navigation guide for future agents: where to edit, common workflows, and gotchas.
- [Roadmap](./ROADMAP.md): product direction, milestones, and technical design areas still to solve.

## Repository Shape

The repo is a Turborepo/NPM workspace with three apps and three shared packages:

```txt
apps/
  desktop/    Electron + React app that users log into and read/manage their news in.
  web/        Next.js app for landing pages, auth-adjacent pages, billing, dashboard, and API routes.
  worker/     Background service for scheduled fetching, scraping, AI summarization, and article persistence.

packages/
  ai/         Shared AI wrappers and prompt logic.
  config/     Shared environment resolvers, constants, and category data.
  db/         Shared Supabase clients, DB types, Zod schemas, SQL schema, and queries.
```

## Current Mental Model

Orca has three major surfaces:

- Public/product surface: `apps/web`, including landing, pricing, subscribe, dashboard, and Stripe API routes.
- Reader/product surface: `apps/desktop`, the Electron application for authenticated subscribers.
- Content engine: `apps/worker`, which turns user topics into searched, scraped, summarized articles.

The database is Supabase/Postgres. Most app code should go through shared helpers in `packages/db` when available, but the codebase still has direct Supabase queries in some UI/API files. When changing schema, update SQL, TypeScript types, and Zod schemas together.

## Important Source Of Truths

- Subscription access should come from `public.billing_subscriptions`, not the legacy billing columns on `public.users`.
- Stripe is the billing source of truth. Supabase is the local cache used by clients.
- `apps/web/app/api/billing/status/route.ts` reconciles subscription state from Stripe when the DB row is stale or missing.
- Topics and articles live in Supabase and are read by the desktop app.
- The worker owns discovery, scraping, summarization, and article writes.

## Useful Commands

Run from the repo root unless noted:

```bash
npm run build -w @newsflow/web
npm run build -w @newsflow/desktop
npm run build -w @newsflow/worker
npm run build -w @newsflow/db
```

For local development, see the root [README](../README.md). The common full-stack loop is:

```bash
cd apps/desktop && bun run dev:ui
cd apps/desktop && bun run dev
cd apps/worker && bun run dev
```

The web app can also be run separately:

```bash
cd apps/web && npm run dev
```

## When You Are Unsure

Use this search order:

1. Start with [Agent Guide](./AGENT_GUIDE.md).
2. Search with `rg` for the table, route, component, or env var.
3. Check `packages/db/sql` for schema.
4. Check `packages/db/src/types.ts` and `packages/db/src/schemas.ts` for expected shapes.
5. Check `apps/worker/src/services/pipeline.ts` and `apps/worker/src/jobs` for content generation behavior.
6. Check `apps/web/app/api` for server-side billing/auth/topic endpoints.
7. Check `apps/desktop/src/renderer` for user-facing reader behavior.

