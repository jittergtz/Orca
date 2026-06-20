# Roadmap

This roadmap captures the intended direction for Orca: the best personalized news app, tailored to every user's needs.

## North Star

Orca lets users subscribe to topics at any level of specificity and receive excellent reports on a cadence they choose. A topic can be broad, like "AI", or hyperspecific, like "new FDA approvals for oncology diagnostics in Europe". Orca searches and scrapes the best available web sources, combines them into one useful piece, and delivers a report that is short enough to enjoy but deep enough to trust.

The product should feel like a careful editor who knows what the user cares about.

## Report Quality Bar

Every generated report should aim for:

- A TLDR at the top that can be read in about 30 seconds.
- A real article after the TLDR, not a sloppy summary dump.
- Concise, readable prose with a clear angle.
- Multiple sources synthesized together.
- Enough detail to be useful, without becoming long for no reason.
- Clear citations/source links.
- Relevant images, charts, or diagrams only when they improve the report.
- A predictable cadence: daily, weekly, and eventually real-time for topics that need it.

## Product Pillars

### 1. Topic Subscriptions

Users should be able to subscribe to:

- Broad general topics: "AI", "sports business", "climate tech".
- Specific topics: "Apple supply chain in India", "AI regulation in the EU".
- Very specific monitoring topics: "new grants for battery recycling startups in Germany".

Topic setup should capture:

- Topic name.
- Topic description/intent.
- Include signals.
- Exclude signals.
- Frequency: daily, weekly, real-time.
- Preferred depth: short, standard, deep report.
- Delivery format: app feed first, later email/audio/push.

### 2. Excellent Reports

The target report structure:

```txt
Title
Short subtitle or one-sentence angle

TLDR
- 3 to 5 bullets
- Max 30-second read
- Focus on what changed, why it matters, and what to watch

Article
- Polished narrative
- Not too long
- Combines the strongest facts across sources
- Avoids repeated filler and generic transitions

Sources
- Linked source list
- Optional "why these sources" metadata later
```

Future report records should probably separate:

- Canonical report metadata.
- TLDR blocks.
- Article body blocks.
- Source citations.
- Media attachments.
- Generation/evaluation metadata.

### 3. Dynamic Images And Visuals

Images are a difficult feature and need design before implementation.

Open design question: when should a report contain images, how many, and where?

Possible image sources:

- Images extracted from source pages.
- Licensed/news image APIs.
- Generated explanatory images.
- Generated charts or diagrams from extracted facts.
- Screenshots/previews for product or market reports.

Recommended first implementation:

- Add a `media_assets` or `report_media` table.
- Store image URL, source URL, attribution, alt text, caption, safety/relevance score, and placement hint.
- Let the report writer request zero to three media slots.
- Prefer no image when the topic is mostly text/analysis.
- Prefer diagrams/charts for explainers where source images do not add value.
- Show images only when attribution and relevance are clear.

Hard parts to solve:

- Avoiding irrelevant stock-like images.
- Avoiding copyright problems.
- Choosing a useful image count.
- Matching images to report sections.
- Making mobile/desktop layouts feel intentional.

### 4. Scheduling And Background Jobs

Current system uses a worker with scheduled jobs and queues. Long term, Orca needs production-grade scheduling and observability.

Desired job types:

- Daily topic report.
- Weekly topic report.
- Manual refresh.
- Backfill for missed runs.
- Re-run failed generation.
- Shared canonical report generation.
- Fanout delivery to users.

Trigger.dev or a similar workflow system may be a good fit when we need:

- Better retry visibility.
- Scheduled jobs per topic/cadence.
- Backfills.
- Long-running multi-step workflows.
- Per-step logs and failure recovery.

Implementation principles:

- Jobs must be idempotent.
- Job keys should include canonical topic, cadence, and date window.
- Re-running should update or replace the same report, not duplicate it.
- Failed steps should be resumable.

### 5. Shared Topic Generation

This is one of the most important scale/cost features.

Problem: many users may subscribe to the same or similar topics. If 1,000 users subscribe to "AI", generating 1,000 separate reports is wasteful.

Target model:

```txt
user_topic_subscriptions
  User-specific topic intent, settings, frequency, and delivery preferences.

canonical_topics
  Normalized topic clusters that can serve many users.

topic_cluster_memberships
  Mapping from user topic subscriptions to canonical topics.

canonical_reports
  One report generated for one canonical topic and date/cadence window.

report_deliveries
  Per-user delivery/read state for canonical reports.
```

Example:

- User A: "AI"
- User B: "latest artificial intelligence news"
- User C: "AI breakthroughs this week"

These can likely share one canonical daily AI report.

Counterexample:

- User A: "AI"
- User B: "AI chips export controls for Nvidia in China"

These should not share the same report, although the specific topic may use some overlapping sources.

Possible matching approach:

1. Normalize user topic with an AI topic-refinement step.
2. Generate embedding for normalized topic intent.
3. Search existing canonical topics by embedding similarity.
4. Use a stricter LLM or rules-based classifier to confirm whether sharing is valid.
5. If matched, attach subscription to canonical topic.
6. If not matched, create a new canonical topic.

Safety rule: when uncertain, generate separately. Wrongly merging a hyperspecific topic into a broad report destroys trust.

### 6. Personalization

After canonical reports exist, personalization should happen in layers:

- Shared report core: generated once.
- User-specific ordering/filtering: show reports based on user interests.
- User-specific annotations: optional small personalization layer.
- User-specific delivery: timing, app/email/audio preferences.

Avoid generating fully separate reports for every user unless their topic is truly unique.

### 7. Trust, Evaluation, And Quality Control

Orca needs quality controls before scaling:

- Source quality scoring.
- Duplicate source detection.
- Claim extraction and contradiction checks.
- Citation coverage checks.
- Report length checks.
- TLDR length checks.
- Hallucination-focused evals.
- Regression examples for common topics.
- User feedback: useful, too long, missed key info, bad source, bad image.

Initial evals can be simple:

- Does every report have a TLDR?
- Is the TLDR under the target length?
- Are sources present?
- Are citations linked?
- Is the article body within length bounds?
- Did the model mention facts unsupported by sources?

## Suggested Phases

### Phase 0: Stabilize Current Foundations

- Make billing and subscription gating reliable across web and desktop.
- Keep `billing_subscriptions` as the billing read model.
- Ensure local dev docs explain Stripe CLI/webhook behavior.
- Ensure the worker can reliably fetch for new topics.
- Add basic observability for failed worker jobs.

### Phase 1: Better Topic Model

- Improve topic onboarding fields: include/exclude signals, cadence, depth.
- Store richer topic config in DB.
- Add topic refinement previews so users know what Orca will monitor.
- Add frequency controls in the desktop app.

### Phase 2: Multi-Source Report Writer

- Move from per-source article summaries to synthesized reports.
- Add source ranking and dedupe.
- Add report-level schema: TLDR, article body, citations, source list.
- Add quality checks before saving.
- Make article length and TLDR length controllable.

### Phase 3: Scheduling Upgrade

- Make scheduled generation idempotent.
- Add job run records.
- Support daily and weekly cadence explicitly.
- Evaluate Trigger.dev for production workflows.
- Add backfill/retry tools.

### Phase 4: Canonical Topics And Shared Reports

- Add canonical topic table.
- Add user-subscription-to-canonical-topic mapping.
- Generate once per canonical topic/cadence/date.
- Fan out report deliveries to subscribers.
- Add topic similarity and matching thresholds.

### Phase 5: Images And Visual Reports

- Add report media schema.
- Extract candidate images from sources.
- Generate captions and alt text.
- Add placement decisions.
- Add chart/diagram generation for topics where visuals help.
- Build desktop/web layouts for image-rich reports.

### Phase 6: Delivery And Retention

- Add email digests.
- Add audio versions where useful.
- Add saved reports and reading history.
- Add report feedback controls.
- Add notifications for important updates.

### Phase 7: Scale And Cost Controls

- Cache search/scrape results.
- Cache canonical reports.
- Add per-topic and per-user cost tracking.
- Add rate limits.
- Add provider fallback.
- Add source and model cost dashboards.

## Data Model Ideas

Potential future tables:

```txt
topic_subscriptions
canonical_topics
topic_cluster_memberships
canonical_reports
report_sections
report_sources
report_media
report_deliveries
generation_runs
source_documents
source_claims
quality_evaluations
```

Do not add all of these at once. Add them as the pipeline evolves.

## Open Questions

- How much personalization should happen inside the canonical report versus delivery layer?
- What exact threshold decides whether two topics are similar enough to share?
- Should broad topics have editor-like preset configurations?
- Should hyperspecific topics require user confirmation before first run?
- What image sources are legally and operationally safe?
- How should citations appear in desktop articles?
- Should reports be immutable once delivered, or can they update as new sources arrive?
- How much source text should be stored versus re-fetched?
- What is the right first Trigger.dev workflow boundary?

## Guiding Product Taste

Orca should not feel like an endless feed. It should feel like a calm, high-quality briefing that knows what matters to the user.

The output should be:

- Specific.
- Readable.
- Trustworthy.
- Efficient.
- Beautiful enough that users want to return.

