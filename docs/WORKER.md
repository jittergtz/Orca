# Worker Architecture And Operations

This document is the worker handoff for future agents. Read it before changing scheduled jobs, queues, Redis, article generation, or anything that can create API cost.

The worker lives in `apps/worker`. It is the content engine for Orca: it turns user topics into generated article records that the desktop app reads from Supabase.

## Goal

The product goal is not just "fetch news." Orca should generate useful personalized reports for user-defined topics. The worker should eventually:

- Normalize user topics into reusable canonical topic/report work.
- Search multiple high-quality sources.
- Dedupe and rank those sources.
- Extract facts, quotes, metrics, timelines, and relevant context.
- Write a polished report with a short TLDR and concise article body.
- Attach images only when they improve comprehension and can be attributed.
- Publish once, then fan out to subscribed users where possible.

The current worker is an early version of that system. It still mostly creates article records per discovered source, with newer MDX/distillation steps layered on top.

## Current Runtime Shape

```mermaid
flowchart TD
  HTTP["HTTP server\napps/worker/src/index.ts"]
  Scheduler["Cron scheduler\nscheduler.ts"]
  Queue["BullMQ queues\nqueue.ts"]
  FetchJob["fetch-news job\njobs/fetchNews.ts"]
  SummarizeJob["summarize-article job\njobs/summarize.ts"]
  Pipeline["pipeline.ts"]
  Search["Serper news/web search"]
  AI["OpenAI model calls"]
  Assets["Unsplash / Open Graph image lookup"]
  DB["Supabase/Postgres"]
  Desktop["Desktop reader"]

  HTTP -->|"POST /trigger-fetch"| Pipeline
  HTTP -->|"queue mode"| Queue
  Scheduler --> Queue
  Queue --> FetchJob
  Queue --> SummarizeJob
  FetchJob --> Pipeline
  SummarizeJob --> Pipeline
  Pipeline --> Search
  Pipeline --> AI
  Pipeline --> Assets
  Pipeline --> DB
  DB --> Desktop
```

## Main Files

- `apps/worker/src/index.ts`: process entrypoint, HTTP server, queue/scheduler startup, shutdown.
- `apps/worker/src/lib/env.ts`: worker env parsing and defaults.
- `apps/worker/src/scheduler.ts`: cron polling for due topics.
- `apps/worker/src/queue.ts`: BullMQ queues, workers, job options, Redis connections.
- `apps/worker/src/jobs/fetchNews.ts`: small wrapper around the fetch pipeline.
- `apps/worker/src/jobs/summarize.ts`: small wrapper around the summarize pipeline.
- `apps/worker/src/services/pipeline.ts`: core orchestration for search, summarization, MDX, images, article upsert, memory indexing, and digest email.
- `apps/worker/src/services/serperSearch.ts`: search provider integration.
- `apps/worker/src/services/scraper.ts`: source extraction.
- `apps/worker/src/services/articleAssets.ts`: Unsplash first, Open Graph fallback.
- `apps/worker/src/services/articleMemory.ts`: article chunking, embeddings, rolling topic memory.
- `apps/worker/src/services/email.ts`: digest email sending.
- `apps/worker/src/ai`: worker-local model calls and prompts.

## Runtime Safety Model

The worker now defaults to safe manual behavior. Queue workers, cron scheduling, and external API calls are controlled independently so a local/dev process cannot accidentally idle-poll Redis or fan out OpenAI calls just because Redis credentials exist.

- `WORKER_ENVIRONMENT` controls runtime assumptions. Valid values are `development`, `production`, and `test`; it falls back to `RAILWAY_ENVIRONMENT_NAME`, `RAILWAY_ENVIRONMENT`, `NODE_ENV`, then `development`.
- `WORKER_QUEUE_ENABLED=true` requests BullMQ workers. In non-production it is ignored unless `WORKER_ALLOW_DEV_QUEUE=true`.
- `WORKER_SCHEDULER_ENABLED=true` requests cron due-topic discovery. In non-production it is ignored unless `WORKER_ALLOW_DEV_SCHEDULER=true`, and it also requires the queue to be active.
- `WORKER_TEST_MODE=true` accepts `POST /trigger-fetch` as a no-cost smoke test and skips Redis, Serper, OpenAI, Unsplash, and DB writes for that trigger.
- `WORKER_EXTERNAL_CALLS_ENABLED=false` is the emergency kill switch for Serper/OpenAI-backed pipeline work.

### Safe Local Inline Mode

Use this for normal local development and debugging:

```bash
WORKER_ENVIRONMENT=development
WORKER_SCHEDULER_ENABLED=false
WORKER_QUEUE_ENABLED=false
WORKER_MANUAL_TRIGGER_MODE=inline
WORKER_JOB_ATTEMPTS=1
WORKER_MAX_ARTICLES_PER_FETCH=1
WORKER_MAX_ARTICLES_PER_FETCH_CAP=1
WORKER_MANUAL_TRIGGER_MIN_INTERVAL_MS=60000
WORKER_DIGEST_EMAIL_ENABLED=false
WORKER_MDX_FALLBACK_ENABLED=false
WORKER_MEMORY_INDEXING_ENABLED=false
ENABLE_ARTICLE_MDX_PIPELINE=true
```

In this mode `POST /trigger-fetch` runs the pipeline inline and does not use BullMQ/Redis. This is the safest way to test one topic without idle Redis command burn or queue retries.

### No-Cost Worker Smoke Test

Use this when you only want to verify that the worker process, HTTP route, auth, and desktop trigger plumbing work:

```bash
WORKER_TEST_MODE=true
WORKER_QUEUE_ENABLED=false
WORKER_SCHEDULER_ENABLED=false
WORKER_EXTERNAL_CALLS_ENABLED=false
```

`POST /trigger-fetch` returns an accepted test response without touching Redis or calling Serper/OpenAI. This is the safest feature flag for UI/E2E trigger tests in development.

### Local Queue Test Mode

Use this only when intentionally testing production-like background behavior:

```bash
WORKER_ENVIRONMENT=development
WORKER_QUEUE_ENABLED=true
WORKER_ALLOW_DEV_QUEUE=true
WORKER_MANUAL_TRIGGER_MODE=queue
WORKER_SCHEDULER_ENABLED=false
WORKER_JOB_ATTEMPTS=1
WORKER_MAX_ARTICLES_PER_FETCH=1
WORKER_MAX_ARTICLES_PER_FETCH_CAP=1
WORKER_PIPELINE_CONCURRENCY=1
WORKER_QUEUE_RATE_LIMIT_MAX=2
WORKER_QUEUE_RATE_LIMIT_DURATION_MS=60000
WORKER_AUDIO_QUEUE_ENABLED=false
```

Queue mode uses Upstash Redis through BullMQ. Even with no user-visible jobs, BullMQ workers use Redis for blocking reads, stalled-job checks, locks, retries, cleanup, and queue metadata. Do not assume "no topics created" means "no Redis commands."

### Production Queue / Scheduled Mode

Use explicit production settings for the deployed worker. Start conservative, then raise concurrency/rate limits from logs and provider dashboards:

```bash
WORKER_ENVIRONMENT=production
WORKER_QUEUE_ENABLED=true
WORKER_MANUAL_TRIGGER_MODE=queue
WORKER_SCHEDULER_ENABLED=true
WORKER_AUDIO_QUEUE_ENABLED=false
WORKER_JOB_ATTEMPTS=1
WORKER_MAX_ARTICLES_PER_FETCH=1
WORKER_MAX_ARTICLES_PER_FETCH_CAP=5
WORKER_SCHEDULER_MAX_DUE_TOPICS=25
WORKER_PIPELINE_CONCURRENCY=1
WORKER_QUEUE_RATE_LIMIT_MAX=10
WORKER_QUEUE_RATE_LIMIT_DURATION_MS=60000
WORKER_MANUAL_TRIGGER_MIN_INTERVAL_MS=60000
WORKER_EXTERNAL_CALLS_ENABLED=true
WORKER_MEMORY_INDEXING_ENABLED=true
ENABLE_ARTICLE_MDX_PIPELINE=true
```

## Important Env Vars

- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: service role key for worker writes. Never expose this to browser/renderer code.
- `OPENAI_API_KEY`: model calls for distillation, MDX, summaries, embeddings.
- `SERPER_API_KEY`: news/web search.
- `UNSPLASH_ACCESS_KEY`: optional image search. If absent, image lookup falls back to Open Graph only.
- `UPSTASH_REDIS_URL` or `REDIS_URL`: BullMQ Redis connection string. Required only for queue mode and queue maintenance commands.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`: optional Upstash REST ping in health checks when queue mode is active.
- `WORKER_ENVIRONMENT`: `development`, `production`, or `test`. Defaults to `RAILWAY_ENVIRONMENT_NAME`, `RAILWAY_ENVIRONMENT`, then `NODE_ENV`, then `development`.
- `WORKER_TEST_MODE`: no-cost HTTP trigger mode. Forces queue/scheduler/external calls off.
- `WORKER_SCHEDULER_ENABLED`: requests cron due-topic discovery.
- `WORKER_ALLOW_DEV_SCHEDULER`: required with `WORKER_SCHEDULER_ENABLED=true` outside production.
- `WORKER_QUEUE_ENABLED`: requests BullMQ workers and queue enqueue mode.
- `WORKER_ALLOW_DEV_QUEUE`: required with `WORKER_QUEUE_ENABLED=true` outside production.
- `WORKER_AUDIO_QUEUE_ENABLED`: starts the audio worker. Defaults off because current code has no active audio job producer.
- `WORKER_MANUAL_TRIGGER_MODE`: `inline` or `queue`.
- `WORKER_POLL_CRON`: cron expression, default `*/15 * * * *`.
- `WORKER_JOB_ATTEMPTS`: BullMQ attempts, default 1.
- `WORKER_MAX_ARTICLES_PER_FETCH`: max candidate articles per topic fetch, default 1.
- `WORKER_MAX_ARTICLES_PER_FETCH_CAP`: hard cap applied over `WORKER_MAX_ARTICLES_PER_FETCH`; defaults to 1 in non-production and 5 in production.
- `WORKER_SCHEDULER_MAX_DUE_TOPICS`: max due topics enqueued per scheduler tick.
- `WORKER_PIPELINE_CONCURRENCY`: BullMQ pipeline worker concurrency.
- `WORKER_QUEUE_RATE_LIMIT_MAX`, `WORKER_QUEUE_RATE_LIMIT_DURATION_MS`: BullMQ worker rate limit for the shared pipeline queue.
- `WORKER_QUEUE_DRAIN_DELAY_SECONDS`, `WORKER_QUEUE_STALLED_INTERVAL_MS`: idle long-poll and stalled-job intervals.
- `WORKER_QUEUE_PREFIX`: optional BullMQ key prefix. Non-production defaults to an isolated dev/test prefix when queue mode is allowed.
- `WORKER_MANUAL_TRIGGER_MIN_INTERVAL_MS`: in-process per-topic cooldown for `POST /trigger-fetch`, default 60 seconds.
- `WORKER_REQUEST_BODY_LIMIT_BYTES`: max HTTP JSON body size, default 16 KiB.
- `WORKER_EXTERNAL_CALLS_ENABLED`: kill switch for Serper/OpenAI-backed pipeline work.
- `WORKER_UNSPLASH_ENABLED`: kill switch for Unsplash image lookup. Open Graph fallback can still run when the pipeline is active.
- `WORKER_MEMORY_INDEXING_ENABLED`: enables article chunk embeddings and rolling topic memory. Defaults true only in production.
- `WORKER_DIGEST_EMAIL_ENABLED`: sends daily/weekly digest email after fetch.
- `WORKER_MDX_FALLBACK_ENABLED`: permits legacy summary fallback after MDX failure.
- `ENABLE_ARTICLE_MDX_PIPELINE`: enables the newer distillation/MDX/article asset path.
- `ARTICLE_DISTILLATION_MODEL`, `ARTICLE_MDX_MODEL`, `ARTICLE_EMBEDDING_MODEL`: model choices.
- `WORKER_AUTH_TOKEN`: optional bearer token for `POST /trigger-fetch`.
- `PORT`: HTTP port, default `3001`.

## Data Flow Today

### Manual Inline Fetch

1. Desktop creates a topic in Supabase.
2. Desktop calls `POST /trigger-fetch` on the worker URL.
3. `index.ts` validates the payload and auth token if configured.
4. If `WORKER_MANUAL_TRIGGER_MODE=inline`, it calls `executeFetchPipeline(..., { inlineSummarize: true })`.
5. The fetch pipeline loads the topic, searches for candidates, and runs each summarize pipeline inline.
6. The summarize pipeline writes or updates rows in `articles`.
7. Desktop realtime/feed refresh sees the new article.

### Scheduled Queue Fetch

1. `scheduler.ts` runs on `WORKER_POLL_CRON`.
2. It loads active topics and filters due topics through `listDueTopics`.
3. It bulk-enqueues `fetch-news` jobs with deterministic job IDs.
4. The pipeline worker processes each fetch job.
5. Scheduled fetches update `last_fetched_at` at the start of the run, so slow or failing runs do not stay immediately due and get re-enqueued on the next tick.
6. The fetch pipeline enqueues or runs summarize jobs.
7. Summarize jobs upsert article records.

### Summarize / MDX Path

When `ENABLE_ARTICLE_MDX_PIPELINE=true`, `executeSummarizePipeline` does:

1. Load the topic and previous topic summary.
2. Distill the source into facts/quotes/metrics/timeline/entities.
3. Generate MDX content and TLDR.
4. Acquire an image asset from Unsplash when `imageSearchQuery` exists, otherwise fall back to Open Graph.
5. Upsert the article.
6. Index article memory and embeddings when topic/user data is available.

If MDX fails and `WORKER_MDX_FALLBACK_ENABLED=false`, the job returns an `mdx_failed` result instead of writing a legacy summary. If fallback is enabled, it generates the older plain summary and writes that.

## Redis / BullMQ Notes

Redis usage comes from BullMQ, not from Unsplash.

Recent incident: an Upstash Redis command dashboard climbed from roughly 10K commands to 25K commands while the user did not intentionally create new jobs or topics. The likely causes in the previous code were:

- Pipeline worker and unused audio worker were always started in queue mode.
- BullMQ's default empty-queue long poll was 5 seconds, so idle workers touched Redis often.
- BullMQ stalled-job checks ran every 30 seconds.
- Scheduler enqueued due topics with one fresh Redis connection and queue per topic.
- Fetch and summarize jobs had no deterministic `jobId`, so repeated ticks or triggers could duplicate work.
- Scheduled topics were marked fetched only after the search/enqueue path completed, so a slow or failing run could remain due and be re-enqueued.

Mitigations now in code:

- Queue mode defaults off and non-production queue starts require `WORKER_ALLOW_DEV_QUEUE=true`.
- Scheduler starts require queue mode, and non-production scheduler starts require `WORKER_ALLOW_DEV_SCHEDULER=true`.
- `WORKER_TEST_MODE=true` accepts manual trigger smoke tests without Redis or external API calls.
- `WORKER_EXTERNAL_CALLS_ENABLED=false` skips Serper/OpenAI-backed pipeline work.
- `WORKER_AUDIO_QUEUE_ENABLED` defaults off.
- Workers use configurable concurrency, a queue rate limit, a longer `drainDelay`, and a slower `stalledInterval`.
- Scheduler refuses overlapping ticks and caps due-topic enqueue count per tick.
- Scheduler and fetch pipeline use `queue.addBulk` with one Redis connection for batches.
- Fetch, summarize, and audio jobs have deterministic `jobId` values.
- Scheduled fetch jobs mark the topic fetched at job start.
- Fetch jobs remove completed/failed records immediately.
- Manual HTTP triggers have a per-topic cooldown and bounded JSON body size.
- Health checks only ping Redis when queue mode is active.

Future agents should still inspect actual Upstash command metrics after deploy. BullMQ will never be zero-command while workers are running.

## Current Problems And Investigation Backlog

### Redis Cost / Idle Command Burn

Status: guarded in code; still needs provider-dashboard verification after deploy.

What to check next:

- Confirm production logs show `environment:production`, `queueEnabled:true`, and the intended `schedulerEnabled` value.
- Compare Upstash command rate before and after deploying this guardrail patch.
- Confirm only one worker process is running in production.
- Confirm `WORKER_AUDIO_QUEUE_ENABLED=false` unless audio jobs are intentionally produced.
- Confirm non-production queue tests include `WORKER_ALLOW_DEV_QUEUE=true`, otherwise queue mode is intentionally blocked.
- Confirm `WORKER_SCHEDULER_ENABLED=false` for environments that should not schedule jobs, or `WORKER_TEST_MODE=true` for no-cost smoke tests.
- Consider replacing BullMQ for low-volume scheduled work if Upstash command cost remains high.
- Consider Trigger.dev, Railway cron, or direct scheduled HTTP jobs for better observability.

Useful files:

- `apps/worker/src/queue.ts`
- `apps/worker/src/scheduler.ts`
- `apps/worker/src/index.ts`

### Duplicate Or Repeated Topic Fetches

Status: partially mitigated with deterministic job IDs and early scheduled timestamp updates.

Risk:

- Manual triggers can still intentionally re-run a topic after the per-topic cooldown.
- Similar topics across users are still separate rows and will each generate work.
- A failed scheduled job now advances `last_fetched_at`, which protects cost but can delay content. That tradeoff is currently intentional after the Redis incident.

Future direction:

- Add explicit job run records with status, timestamps, error, and cost metadata.
- Decide whether failed scheduled fetches should retry through a bounded retry-after field instead of `last_fetched_at`.
- Build canonical topic/report generation so one report can satisfy many users.

### Unsplash / Image Costs And Relevance

Status: basic implementation.

Current behavior:

- If MDX returns `imageSearchQuery`, the worker calls Unsplash search for one landscape photo.
- If Unsplash fails or no key exists, it fetches the source URL and tries Open Graph image metadata.
- Images are stored on the article as `image_url` and `image_attribution`.

Problems:

- Unsplash calls happen per summarized article and are not cached by query or source.
- Search queries may be too generic.
- Images are decorative unless the prompt produces a genuinely useful visual intent.

Future direction:

- Cache image lookup results by normalized query and/or source URL.
- Add an env kill switch for Unsplash specifically if needed.
- Store richer image metadata: source, alt text, relevance reason, license/attribution.
- Prefer source images or generated charts when they explain the report better.

### Pipeline Cost Visibility

Status: weak.

The worker logs major events, but it does not persist a structured job/run ledger. Future agents should add a table for:

- job type
- topic ID
- canonical topic/report ID when available
- trigger source
- model names
- input/output token counts if available
- article count
- external API calls
- status/error
- started/completed timestamps

Without this, cost incidents require reading provider dashboards and logs after the fact.

### Multi-Source Reports

Status: product target, not current implementation.

The current pipeline discovers multiple candidate sources but writes article records per source. The target Orca experience needs one synthesized report per topic/cadence, with sources supporting a single narrative.

Future architecture likely needs:

- canonical topic clusters
- report run table
- source candidate table
- source ranking/dedupe
- claim extraction
- synthesized report table
- user delivery/fanout table

## Operational Playbooks

### Stop Redis Command Growth Fast

If Redis commands are climbing unexpectedly:

1. Set these env vars and redeploy:

```bash
WORKER_QUEUE_ENABLED=false
WORKER_SCHEDULER_ENABLED=false
WORKER_MANUAL_TRIGGER_MODE=inline
WORKER_AUDIO_QUEUE_ENABLED=false
WORKER_EXTERNAL_CALLS_ENABLED=false
```

2. Confirm worker logs say:

```text
Worker scheduler disabled
Worker queue disabled
```

For endpoint-only checks, set `WORKER_TEST_MODE=true` instead of running the pipeline.

3. If queue mode was active, clear stuck queues only after confirming it is safe:

```bash
npm run cli -w apps/worker -- clear-queues --yes
```

4. Watch Upstash command rate for at least 10-15 minutes.

### Run One Safe Manual Article Test

1. Use safe local inline mode.
2. Set `WORKER_MAX_ARTICLES_PER_FETCH=1`.
3. Start the worker from repo root with env loaded.
4. Trigger one topic through desktop or curl.
5. Watch for:

```text
Manual fetch trigger received ... mode:inline
News search starting ... maxArticles:1
Fetch pipeline completed
```

### Verify A Worker Change

Build first:

```bash
npm run build -w @newsflow/worker
```

For behavior changes, a build is not enough. Run the worker and trigger a known topic in inline mode. Use queue mode only when the change specifically touches BullMQ scheduling or job behavior.

## Design Rules For Future Agents

- Default to inline mode for local tests.
- Do not enable the scheduler casually.
- Do not enable queue mode unless the task requires BullMQ behavior.
- Keep job payloads idempotent.
- Prefer deterministic job IDs for anything that can be enqueued more than once.
- Add cost controls before increasing articles per fetch, model size, retries, or cadence.
- Treat service role keys as server/worker-only.
- Update SQL, TS types, Zod schemas, and shared queries together for DB shape changes.
- Preserve source attribution when changing article generation.
- Add structured observability before adding more background automation.
