# Orca Monorepo

Welcome to the internal source code repository for Orca. This project is structured as a [Turborepo](https://turbo.build/) monorepo containing multiple applications and shared packages.

## Workspace Structure

### Apps
- `apps/desktop`: The core, private local desktop application built with Electron, React, and Vite.
- `apps/web`: The Next.js 16 App Router landing page with Stripe and Supabase integration.
- `apps/worker`: A Node.js background service that fetches news via Serper.dev, scrapes articles, summarizes with GPT-4o-mini, and orchestrates jobs with BullMQ and node-cron.

### Packages
- `packages/db`: Shared database schemas, types, and Supabase client utilities.
- `packages/ai`: AI agent wrappers (topic refinement, news search, article summarization).
- `packages/config`: Shared environment variable resolvers, constants, and types.

## Getting Started

### Prerequisites
- **Bun** (primary package manager) — or npm (v11+) as fallback
- **Node.js 20+**
- **Redis** — for the worker's BullMQ job queue (see [Redis Setup](#redis-setup) below)

### 1. Install Dependencies
Run from the root directory:
```bash
bun install
```

### 2. Environment Variables
Each app/package has its own `.env.local` file. Copy from `.env.example` where available:

```bash
# Desktop app
cp apps/desktop/.env.example apps/desktop/.env.local

# Worker
cp apps/worker/.env.example apps/worker/.env.local
```

Fill out the required API keys. See the [Environment Variables](#environment-variables-reference) section below for details.

---

## Local Development Guide

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Desktop App                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐  │
│  │  Vite    │◄───│ Electron │    │  OnboardingFlow  │  │
│  │(:5173)   │    │  Window  │    │  (creates topics)│  │
│  └──────────┘    └────┬─────┘    └────────┬─────────┘  │
│                       │                   │            │
└───────────────────────┼───────────────────┼────────────┘
                        │                   │
                        ▼                   ▼
              ┌─────────────────┐   ┌──────────────┐
              │   Supabase      │   │   Worker     │
              │  (PostgreSQL)   │◄──│  (:3001)     │
              │                 │   │              │
              │ • users         │   │ • cron sched │
              │ • topics        │   │ • fetch jobs │
              │ • articles      │   │ • AI summary │
              │ • subscriptions │   │ • upsert art │
              └─────────────────┘   └──────────────┘
```

### Running the Full Stack (Recommended)

You need **3 terminals** running simultaneously:

#### Terminal 1 — Vite Dev Server
```bash
cd apps/desktop
bun run dev:ui
```
Serves the React UI at `http://localhost:5173` with hot module replacement.

#### Terminal 2 — Electron Window
```bash
cd apps/desktop
bun run dev
```
Opens the desktop app window. Loads content from the Vite dev server in development mode. DevTools open automatically.

#### Terminal 3 — Background Worker
```bash
cd apps/worker
bun run dev
```
Starts the cron scheduler, BullMQ workers, and HTTP server on port `3001`. Handles:
- Periodic news fetching (every 15 min by default)
- Article scraping and AI summarization
- Immediate fetch triggers via `POST /trigger-fetch`

### Running Individual Components

| What you want to test | What to run | What won't work |
|----------------------|-------------|-----------------|
| **UI only** (styling, components) | Terminal 1 + 2 | No articles will appear (worker not running) |
| **Full article flow** | All 3 terminals | — |
| **Worker pipeline only** | Terminal 3 | No UI, but you can trigger via `curl` |

### Testing the Article Flow End-to-End

1. Start all **3 terminals** (see above)
2. Sign in to the desktop app
3. Click the **+** button in the sidebar to create a new topic
4. Complete the 5-step onboarding flow
5. **Immediately after topic creation**, the desktop app calls the worker's `/trigger-fetch` endpoint
6. Watch the **worker terminal** for logs:
   ```
   [worker] Manual fetch trigger received { topicId: "...", initiatedBy: "manual" }
   [worker] Fetch pipeline completed { topicId: "...", articleCount: 5 }
   ```
7. Articles appear in the desktop app within seconds (after scraping + AI summarization completes)

> **Note:** Without the worker running, topics are created but no articles are fetched — the UI will show "No articles yet for this topic".

### Redis Setup

The worker uses **BullMQ** which requires Redis. You have two options:

#### Option A: Upstash (Recommended — Zero Setup)
1. Create a free account at [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy the connection strings into `apps/worker/.env.local`:
   ```
   UPSTASH_REDIS_URL=redis://...
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   ```

#### Option B: Local Redis
```bash
# Via Homebrew
brew install redis
brew services start redis

# Via Docker
docker run -d -p 6379:6379 redis:7-alpine
```
Then set in `apps/worker/.env.local`:
```
REDIS_URL=redis://localhost:6379
```

### Environment Variables Reference

#### Desktop App (`apps/desktop/.env.local`)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/publishable key |
| `VITE_APP_URL` | No | Web app URL (for pricing links) |
| `VITE_WORKER_URL` | No | Worker URL for immediate fetch triggers. Local: `http://localhost:3001`, Production: Railway URL |

#### Worker (`apps/worker/.env.local`)
| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (for writes) |
| `OPENAI_API_KEY` | Yes | For article summarization |
| `SERPER_API_KEY` | Yes | For Google news search |
| `UPSTASH_REDIS_URL` | Yes | Redis connection string |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash REST API URL |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash REST API token |
| `WORKER_POLL_CRON` | No | Cron expression for scheduler (default: `*/15 * * * *`) |
| `WORKER_AUTH_TOKEN` | No | Bearer token for `/trigger-fetch` endpoint (optional, recommended for production) |
| `PORT` | No | HTTP server port (default: `3001`) |

---

## Available Commands

### Development
Start all apps in parallel from the root:
```bash
bun run dev
```

### Building
Build all applications and packages in dependency order:
```bash
bun run build
```

### Linting
```bash
bun run lint
```

### Running Specific Applications
```bash
# Web only
bun --filter=@newsflow/web dev

# Desktop only
bun --filter=@newsflow/desktop dev

# Worker only
bun --filter=@newsflow/worker dev
```

---

## Troubleshooting

### Port 5173 Already in Use
```bash
sudo lsof -ti :5173 | xargs kill -9
```

### Worker Can't Connect to Redis
- Check that Redis is running: `redis-cli ping` (should return `PONG`)
- Verify `UPSTASH_REDIS_URL` or `REDIS_URL` in `.env.local`
- For Upstash, ensure the REST URL and token are also set

### Blank Electron Window
1. Check DevTools console (opens automatically in dev mode)
2. Common causes:
   - **Module format error**: `@newsflow/db` or `@newsflow/config` not built as ESM → rebuild: `cd packages/db && npx tsc`
   - **Missing env vars**: Supabase URL or key not set → check `.env.local`
   - **Vite not running**: Electron can't load content → start `bun run dev:ui` first
3. See [`.agents/blank-screen-debug-report.md`](./.agents/blank-screen-debug-report.md) for detailed debugging guide

### Articles Not Appearing After Topic Creation
1. Ensure the **worker is running** (Terminal 3)
2. Check worker terminal for fetch logs
3. Verify `VITE_WORKER_URL` is set in desktop `.env.local`
4. Check that `SERPER_API_KEY` and `OPENAI_API_KEY` are set in worker `.env.local`
5. Test worker manually:
   ```bash
   curl -X POST http://localhost:3001/trigger-fetch \
     -H "Content-Type: application/json" \
     -d '{"topicId": "your-topic-uuid"}'
   ```

---

## Planned Features

### Immediate Article Fetch on Topic Creation ✅
**Status: Implemented**

When a new topic is created, the desktop app immediately triggers a fetch via the worker's HTTP endpoint (`POST /trigger-fetch`). This bypasses the 15-minute cron wait and starts fetching articles right away.

- **Local dev**: Set `VITE_WORKER_URL=http://localhost:3001` in desktop `.env.local`
- **Production**: Set `VITE_WORKER_URL` to your Railway worker URL
- **Auth**: Optional `WORKER_AUTH_TOKEN` for production security
