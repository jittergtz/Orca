# Local Dev Setup

## TL;DR

**Goal:** Run the desktop app + worker locally, create a topic, and get one article back — without scheduled jobs, Redis queues, or runaway API costs.

**Before you start**

1. Copy/fill env files: `apps/desktop/.env.local` (Supabase + `VITE_WORKER_URL=http://localhost:3001`) and `apps/worker/.env.local` (Supabase, OpenAI, Serper, safe worker flags below).
2. Apply DB migration `packages/db/sql/0003_ai_content_engine_schema.sql` in Supabase.
3. In `apps/worker/.env.local`, keep the safe local defaults: scheduler off, queue off, inline mode, 1 article / 1 attempt.

**Start everything (3 terminals + 1 optional)**

| # | What | Command |
|---|------|---------|
| 1 | Desktop UI (Vite) | `cd apps/desktop && bun run dev:ui` → wait for `http://localhost:5173` |
| 2 | Electron app | `cd apps/desktop && bun run dev` |
| 3 | Worker | from repo root: `set -a && source apps/worker/.env.local && set +a && npm run dev -w apps/worker` → expect `Worker HTTP server listening on port 3001` |
| 4 | Web app *(optional)* | `cd apps/web && npm run dev` → `http://localhost:3000` for landing, auth, billing, dashboard |

**Use it**

1. Log in in the Electron window.
2. Create a topic — desktop calls `POST http://localhost:3001/trigger-fetch`.
3. Watch the worker terminal for `Manual fetch trigger received` → `articleCount:1`.
4. The article should show up in the app.

**Quick sanity check:** worker logs should show `mode:inline`, `attempted:1`, `articleCount:1`. If not, stop and fix env before retesting.

Details, curl triggers, queue mode, and troubleshooting are below.

---

## Start Order

Use separate terminals.

### Terminal 1: Desktop UI

```bash
cd /Users/sandrogantze/Projects/Orca/apps/desktop
bun run dev:ui
```

Wait until Vite prints:

```text
Local: http://localhost:5173
```

### Terminal 2: Electron Desktop

```bash
cd /Users/sandrogantze/Projects/Orca/apps/desktop
bun run dev
```

If the renderer is not available, Electron now shows a readable error page instead of a gray window.

### Terminal 3: Worker

```bash
cd /Users/sandrogantze/Projects/Orca
set -a
source apps/worker/.env.local
set +a
npm run dev -w apps/worker
```

Expected safe startup logs:

```text
Worker scheduler disabled
Worker queue disabled
Worker HTTP server listening on port 3001
Orca worker started
```

### Optional Terminal 4: Web App

Only needed when testing landing, auth-adjacent pages, billing, or dashboard:

```bash
cd /Users/sandrogantze/Projects/Orca/apps/web
npm run dev
```

The web app normally runs at `http://localhost:3000`.

## Manual End-to-End Test

1. Start desktop UI, Electron, and worker.
2. Log in inside the Electron app.
3. Create one topic in the app.
4. The desktop app calls `POST http://localhost:3001/trigger-fetch`.
5. Watch the worker terminal.

Expected worker logs in safe local mode:

```text
Manual fetch trigger received ... mode:inline
News search starting ... maxArticles:1
Scrape batch complete ... attempted:1
News search completed ... candidates:1
MDX summarize pipeline completed ...
Fetch pipeline completed ... articleCount:1 ... inlineSummarize:true
```

Then check the Electron app. The new article should appear and render through the safe MDX renderer.

## Manual Trigger With Curl

If you want to trigger a topic without using the desktop app:

```bash
curl -X POST http://localhost:3001/trigger-fetch \
  -H "Content-Type: application/json" \
  -d '{"topicId":"YOUR_TOPIC_ID","initiatedBy":"manual"}'
```

If `WORKER_AUTH_TOKEN` is set, include:

```bash
-H "Authorization: Bearer YOUR_TOKEN"
```

## Before Retesting After A Failed Run

Stop the worker with `Ctrl+C`.

If queue mode was used, clear Redis queues before restarting:

```bash
cd /Users/sandrogantze/Projects/Orca
set -a
source apps/worker/.env.local
set +a
npm run cli -w apps/worker -- clear-queues --yes
```

In inline mode this is usually not needed because manual fetches do not enqueue BullMQ jobs.

## Production-Like Queue Mode

Only use this when intentionally testing Redis/BullMQ behavior:

```bash
WORKER_ENVIRONMENT=development
WORKER_QUEUE_ENABLED=true
WORKER_ALLOW_DEV_QUEUE=true
WORKER_MANUAL_TRIGGER_MODE=queue
WORKER_SCHEDULER_ENABLED=false
WORKER_JOB_ATTEMPTS=1
WORKER_MAX_ARTICLES_PER_FETCH=1
WORKER_PIPELINE_CONCURRENCY=1
WORKER_QUEUE_RATE_LIMIT_MAX=2
WORKER_QUEUE_RATE_LIMIT_DURATION_MS=60000
```

This mode will use Upstash Redis commands even for manual tests.

For scheduled production behavior, enable the scheduler only when you are ready:

```bash
WORKER_ENVIRONMENT=development
WORKER_SCHEDULER_ENABLED=true
WORKER_ALLOW_DEV_SCHEDULER=true
WORKER_QUEUE_ENABLED=true
WORKER_ALLOW_DEV_QUEUE=true
WORKER_MANUAL_TRIGGER_MODE=queue
```

## Cost Safety Checklist

Before any rough E2E test, confirm:

- `WORKER_MAX_ARTICLES_PER_FETCH=1`
- `WORKER_JOB_ATTEMPTS=1`
- `WORKER_SCHEDULER_ENABLED=false`
- `WORKER_QUEUE_ENABLED=false` for local manual testing
- `WORKER_MANUAL_TRIGGER_MODE=inline` for local manual testing
- `WORKER_TEST_MODE=true` for endpoint-only tests that must not call Redis, Serper, or OpenAI
- worker logs show `mode:inline`
- worker logs show `attempted:1`
- worker logs show `articleCount:1`

If any of these are different, stop and fix the env before continuing.

## Troubleshooting

### Electron shows a gray window

Start `bun run dev:ui` first and wait for `http://localhost:5173`, then start `bun run dev`.

### No article appears after topic creation

Check:

- desktop has `VITE_WORKER_URL=http://localhost:3001`
- worker is running on port `3001`
- worker terminal shows `Manual fetch trigger received`
- Supabase migration `0003_ai_content_engine_schema.sql` has been applied

### Worker complains about missing env

Start it from repo root with:

```bash
set -a
source apps/worker/.env.local
set +a
npm run dev -w apps/worker
```

### Upstash command count rises during local tests

Confirm:

```bash
WORKER_QUEUE_ENABLED=false
WORKER_MANUAL_TRIGGER_MODE=inline
```

If queue mode is enabled, BullMQ will use Redis commands for job lifecycle, worker polling, locks, retries, and cleanup.



This is the safe local startup guide for testing Orca with the desktop app, web app, and worker.

Use this file when you only want to verify the product flow locally without accidentally starting scheduled jobs or expensive queue retries.

## Recommended Local Test Mode

For normal feature testing, run the worker in inline manual mode:

- scheduler off
- BullMQ queue off
- one article per manual trigger
- one attempt only
- no digest email
- no legacy fallback after MDX failure

Add these values to `apps/worker/.env.local`:

```bash
WORKER_SCHEDULER_ENABLED=false
WORKER_QUEUE_ENABLED=false
WORKER_MANUAL_TRIGGER_MODE=inline
WORKER_JOB_ATTEMPTS=1
WORKER_MAX_ARTICLES_PER_FETCH=1
WORKER_DIGEST_EMAIL_ENABLED=false
WORKER_MDX_FALLBACK_ENABLED=false
ENABLE_ARTICLE_MDX_PIPELINE=true
```

This mode avoids Redis for the manual fetch and summarize path. Upstash should not climb much during local manual tests.

## Required Env Files



### Desktop: `apps/desktop/.env.local`

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_WORKER_URL=http://localhost:3001
VITE_APP_URL=http://localhost:3000
```

### Worker: `apps/worker/.env.local`

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
SERPER_API_KEY=...

WORKER_SCHEDULER_ENABLED=false
WORKER_QUEUE_ENABLED=false
WORKER_MANUAL_TRIGGER_MODE=inline
WORKER_JOB_ATTEMPTS=1
WORKER_MAX_ARTICLES_PER_FETCH=1
WORKER_DIGEST_EMAIL_ENABLED=false
WORKER_MDX_FALLBACK_ENABLED=false
ENABLE_ARTICLE_MDX_PIPELINE=true

ARTICLE_DISTILLATION_MODEL=gpt-4o-mini
ARTICLE_MDX_MODEL=gpt-4o
ARTICLE_EMBEDDING_MODEL=text-embedding-3-small
PORT=3001
```

Redis values are only required when `WORKER_QUEUE_ENABLED=true` or when running queue maintenance commands:

```bash
UPSTASH_REDIS_URL=rediss://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```
