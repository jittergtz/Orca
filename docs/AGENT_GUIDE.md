# Agent Guide

This file is for future agents working in the Orca repo. It is deliberately practical: where to look, what owns what, and what not to accidentally break.

## Start Here

1. Read [README](./README.md) for the short map.
2. Read [Architecture](./ARCHITECTURE.md) for ownership and flows.
3. Read [Worker Architecture And Operations](./WORKER.md) before changing worker queues, scheduler, Redis, or article generation.
4. Read [Roadmap](./ROADMAP.md) before making product-shaping decisions.
5. Use `rg` before opening lots of files.
6. Check `git status --short` before editing. There may be user changes already present.

## App And Package Ownership

Use this as the first routing table:

| Task | Start Here |
| --- | --- |
| Landing/pricing/public pages | `apps/web/app`, `apps/web/components/Landing`, `apps/web/components/Pricing` |
| Dashboard billing display | `apps/web/app/dashboard/page.tsx` |
| Stripe checkout/portal/webhooks | `apps/web/app/api/stripe`, `apps/web/lib/stripeBilling.ts` |
| Subscription status API | `apps/web/app/api/billing/status/route.ts` |
| Desktop sign-in/subscription gate | `apps/desktop/src/renderer/App.tsx` |
| Desktop feed/topic UI | `apps/desktop/src/renderer/components`, `apps/desktop/src/renderer/stores` |
| Desktop native/Electron bridge | `apps/desktop/src/main.ts`, `apps/desktop/src/preload.ts`, `apps/desktop/src/window.ts` |
| Topic onboarding | `apps/desktop/src/renderer/components/onboarding/OnboardingFlow.tsx` |
| Worker fetch pipeline | `apps/worker/src/services/pipeline.ts` |
| Search provider | `apps/worker/src/services/serperSearch.ts` |
| Scraping | `apps/worker/src/services/scraper.ts` |
| Worker jobs/queue/schedule | `apps/worker/src/jobs`, `apps/worker/src/queue.ts`, `apps/worker/src/scheduler.ts` |
| AI prompts/models | `packages/ai/src`, `apps/worker/src/ai` |
| DB schema/types | `packages/db/sql`, `packages/db/src/types.ts`, `packages/db/src/schemas.ts` |
| Env resolution/constants | `packages/config/src` |

## Common Workflows

### Change The Database

When you add or change a table/column/status value:

1. Update `packages/db/sql`.
2. Add a follow-up SQL migration file when existing databases need the change.
3. Update `packages/db/src/types.ts`.
4. Update `packages/db/src/schemas.ts`.
5. Update any Supabase `.select(...)`, `.insert(...)`, `.update(...)`, or `.upsert(...)` calls.
6. Build `@newsflow/db`.

Command:

```bash
npm run build -w @newsflow/db
```

### Change Billing Or Access Control

The intended source of truth is:

- Stripe: payment authority.
- `public.billing_subscriptions`: local Supabase cache.
- `apps/web/app/api/billing/status/route.ts`: server-side reconciliation.
- Desktop/web clients: consume the status endpoint when possible.

Do not build new subscription gating from `users.subscription_status`. That legacy field may be maintained for compatibility, but it should not drive new access logic.

Useful files:

- `apps/web/lib/stripeBilling.ts`
- `apps/web/app/api/billing/status/route.ts`
- `apps/web/app/api/stripe/webhook/route.ts`
- `apps/web/app/dashboard/page.tsx`
- `apps/web/components/Auth/SubscribeAuth.tsx`
- `apps/desktop/src/renderer/App.tsx`

Local Stripe gotcha: if Stripe CLI is not forwarding webhooks, checkout can succeed while Supabase remains stale. Use Stripe CLI or rely on the billing status route to reconcile from Stripe in dev.

### Change Topic Creation Or Onboarding

Start in:

- `apps/desktop/src/renderer/components/onboarding/OnboardingFlow.tsx`
- `apps/desktop/src/renderer/stores/feedStore.ts`
- `packages/db/src/types.ts`
- `packages/db/sql/0001_newsflow_schema.sql`

After creating a topic, the desktop app can trigger the worker to fetch immediately. If articles do not appear, check that the worker is running and that `VITE_WORKER_URL` points to it.

### Change Report Generation

Start in:

- `apps/worker/src/services/pipeline.ts`
- `apps/worker/src/services/serperSearch.ts`
- `apps/worker/src/services/scraper.ts`
- `apps/worker/src/jobs/fetchNews.ts`
- `packages/ai/src/summarizer.ts`
- `apps/worker/src/ai/prompts.ts`

The future direction is multi-source report synthesis, not just summarizing individual scraped pages. When touching this area, preserve source attribution and think about dedupe, ranking, and cost.

### Change AI Behavior

Use shared package code when behavior is reusable:

- `packages/ai/src/models.ts`
- `packages/ai/src/summarizer.ts`
- `packages/ai/src/topicAgent.ts`

Use worker-local AI code when behavior is specific to the content pipeline:

- `apps/worker/src/ai`

Keep prompts versionable and easy to evaluate. Avoid hiding product-critical instructions inside ad hoc strings scattered across components.

### Change Desktop UI

Start in:

- `apps/desktop/src/renderer/App.tsx`
- `apps/desktop/src/renderer/components`
- `apps/desktop/src/renderer/index.css`

Build command:

```bash
npm run build -w @newsflow/desktop
```

### Change Web UI

Start in:

- `apps/web/app`
- `apps/web/components`
- `apps/web/app/globals.css`

Build command:

```bash
npm run build -w @newsflow/web
```

The web production build may fetch Google Fonts through `next/font`. In restricted environments, it can fail because network access is blocked even when the code is fine.

## Environment Files

Common local env files:

- `apps/web/.env.local`
- `apps/desktop/.env.local`
- `apps/worker/.env.local`

Important env families:

- Supabase public keys for clients.
- Supabase service role key for server/worker writes.
- Stripe secret, webhook secret, and price IDs for billing.
- OpenAI key for AI generation.
- Serper key for web/news search.
- Redis/Upstash URLs for the worker queue.

Never expose service role keys to browser or Electron renderer code.

## Important Gotchas

- The repo may contain user changes. Do not revert unrelated modified files.
- `apps/desktop/src/renderer/stores/feedStore.ts` may often be in motion because it owns feed state.
- `tsbuildinfo` files are generated. Avoid touching them.
- `node_modules` is present and huge. Avoid broad searches that include it. Prefer `rg ... apps packages` or use `--glob '!**/node_modules/**'`.
- The codebase uses both Bun and npm. Existing scripts often use Bun inside app packages, but root workspace commands with npm are also used.
- Some package names still say `newsflow` while the product name is Orca.
- When adding a Stripe subscription status, update the SQL check constraint and TS/Zod unions together.

## Verification Checklist

Pick the smallest meaningful checks for the change:

- DB/schema package: `npm run build -w @newsflow/db`
- Web/API/billing/dashboard: `npm run build -w @newsflow/web`
- Desktop renderer/Electron: `npm run build -w @newsflow/desktop`
- Worker/pipeline: `npm run build -w @newsflow/worker`

For content pipeline behavior, a build is not enough. Run the worker and trigger a fetch for a known topic.
