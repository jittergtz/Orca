# Worker Roadmap Status

This file tracks the backend state for `apps/worker` and the desktop data-layer work that depends on it.

## Current Position

The repo is between Phase 1 and early Phase 2 of the system design roadmap.

### Effectively done

- Worker process bootstraps and shuts down cleanly.
- Redis/BullMQ queues exist for fetch, summarize, and audio work.
- Scheduler can discover due topics and enqueue fetch jobs.
- Fetch pipeline can resolve a topic, call the search layer, and enqueue summaries.
- Summarize pipeline can persist processed article output.
- Desktop has typed Supabase session/feed stores for authenticated reads.

### Partially done

- AI flow exists, but prompt tuning, retries, batching, and failure classification are still basic.
- Audio pipeline exists only as a queue placeholder.
- Desktop data stores exist, but UI is not yet wired for full feed testing.
- End-to-end orchestration can be exercised from worker CLI, but not yet from product UI.

### Not done

- Cross-user topic batching for broad categories.
- Audio generation + storage writeback.
- Operational metrics and dead-letter handling.
- Realtime desktop unread/feed behavior at the UI layer.
- Full onboarding persistence and subscription gating.

## Highest-Value Next Steps

1. Persist and inspect pipeline results with job-level status records or structured audit rows.
2. Implement audio generation workflow end to end, including article cache checks.
3. Add retry classification and clearer failure buckets for search vs summarize vs storage.
4. Add broad-topic batching before Perplexity calls to control cost.
5. Wire desktop UI to the existing feed/session stores and realtime updates.

## Useful Commands

```bash
npm run healthcheck -w apps/worker
npm run cli -w apps/worker -- topic-refine --category Finance --prompt "TSMC company finances"
npm run cli -w apps/worker -- fetch-topic --topic-id <uuid> --dry-run
```
