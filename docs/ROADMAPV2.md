Create a file named `ROADMAP_AI_ENGINE.md` in your root or docs folder. This blueprint is structured specifically for an AI IDE agent (like Cursor, Windsurf, or Copilot) to parse and execute step-by-step across your mono-repo workspaces.

```markdown
# Orca AI & Content Engine Expansion Roadmap

This roadmap details the engineering execution plan for implementing the 2026 multi-model AI pipeline, rich MDX generation with native custom components, automated image acquisition, and vector-backed historical topic memory.

---

## Technical Context & Directory Mapping
*   **AI Provider Models:** `DeepSeek V4 Flash` (Scraping/Synthesis), `DeepSeek V4 Pro` or `Claude Sonnet 4.6` (MDX Writing), `Gemini 3.5 Flash` (Chat Interface).
*   **State & Storage:** Supabase Postgres with `pgvector` enabled.
*   **Target Applications:**
    *   `packages/db/`: Tables, SQL migrations, schemas, Zod types.
    *   `packages/ai/`: LLM clients, prompt states, Unsplash wrapper.
    *   `apps/worker/`: Background queue, multi-stage pipelines, scraper adjustments.
    *   `apps/desktop/`: MDX rendering client, custom chart/table components, conversational chat pane.

---

## Milestone 1: Database & Schema Evolution (`packages/db`)
**Objective:** Add support for MDX storage, cross-article topic grouping, and high-density vector text chunking.

### 1.1 SQL Migration (`packages/db/sql/`)
Create a new migration file to activate the vector extension and schema modifications:
```sql
-- 1. Enable vector extension
CREATE EXTENSION IF NOT EXISTS pgvector;

-- 2. Update articles table to support rich MDX content
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS content_mdx TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS image_attribution TEXT;

-- 3. Create topic_summaries table for rolling memory
CREATE TABLE IF NOT EXISTS public.topic_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_query TEXT NOT NULL,
    rolling_summary TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_topic ON public.topic_summaries (user_id, topic_query);

-- 4. Create article_chunks table for granular vector search
CREATE TABLE IF NOT EXISTS public.article_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(1536), -- Vector size matches 2026 standard embedding models
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS article_chunks_embedding_idx ON public.article_chunks USING hnsw (embedding vector_cosine_ops);

```

### 1.2 TypeScript Types & Zod Schemas (`packages/db/src/`)

* Update `schemas.ts` and `types.ts` to expose the new fields (`content_mdx`, `image_url`, etc.).
* Export updated validation schemas for use inside `apps/worker` during persistence.

---

## Milestone 2: Multi-Model Generation Pipeline (`apps/worker` & `packages/ai`)

**Objective:** Replace standard monolithic prompts with a structured, cost-efficient agentic pipeline.

### 2.1 Provider Configuration (`packages/ai/src/`)

Implement API clients routing to fast, cost-efficient 2026 models via your chosen API gateway (e.g., OpenRouter or DeepSeek direct):

* **Extraction Tier:** `DeepSeek V4 Flash` (High context processing at ~$0.14/1M input tokens).
* **Compilation Tier:** `DeepSeek V4 Pro` or `Claude Sonnet 4.6` (Excellent JSON-in-MDX formatting structure).

### 2.2 Rebuild `apps/worker/src/services/pipeline.ts`

Refactor the creation process into five sequential steps:

1. **Context Assembly (Rolling Memory Lookup):**
* Query `public.topic_summaries` for the specific `user_id` and `topic_query`.
* If a running summary exists, append it to the hidden system instructions: *"The user has already read about [X]. Focus on net-new developments, market updates, or structural changes. Do not re-explain foundational facts unless necessary."*


2. **Scraping & Distillation (`DeepSeek V4 Flash`):**
* Pass raw unstructured page text/HTML markdown from web sources into the Flash model.
* Extract structured raw payload: key facts, quotes, timeline points, and hard data fields.


3. **MDX Construction (`DeepSeek V4 Pro` / `Sonnet 4.6`):**
* Feed the distilled payload into the writing tier model.
* Enforce MDX generation using a strict schema containing custom tags. Example system guide:



```text
        You are allowed to inject the following interactive MDX components:
        - <DataTable headers="{string[]}" rows="{string[][]}" title="{string}"/>
        - <MetricCard change="{string}" label="{string}" value="{string}"/>
        - <DataChart "line" data="{JSON_STRING}" type="bar" |/>
        Never output generic HTML components. Output raw markdown outside of components.
        ```
4.  **Aesthetic Asset Acquisition (Unsplash API + Open Graph):**
    *   Instruct the writer model to output a single parameter `image_search_query` (e.g., "semiconductor cleanroom").
    *   In the pipeline service, request the Unsplash API using this query to get a high-resolution landscape photo. Fallback to scraping data's `og:image` if API quota drops.
5.  **Database Persistence & Backfill:**
    *   Save the final text directly into `articles.content_mdx`.
    *   Asynchronously queue a background task to chunk the newly created text into 500-token blocks, compute embeddings, and populate `public.article_chunks`.
    *   Trigger an update statement to regenerate the `rolling_summary` in `public.topic_summaries`.

---

## Milestone 3: Rich UI Presentation Engine (`apps/desktop`)
**Objective:** Safely interpret server-generated MDX payloads and mount interactive chart elements natively inside Electron.

### 3.1 Install MDX Interpreter Assemblies
Within `apps/desktop/`, verify or add dependencies:
```bash
npm install next-mdx-remote # Or alternative client-side runtime compiler compatible with Electron

```

### 3.2 Component Declarations (`apps/desktop/src/renderer/components/mdx/`)

Create native UI adapters matching the generation constraints:

* `DataTable.tsx`: Standard scannable grid with alternating row colors.
* `MetricCard.tsx`: Accent container featuring visual directional indicators for percentage changes.
* `DataChart.tsx`: Minimalist configuration mapping JSON strings into responsive visualizations via lightweight chart packages (e.g., Recharts or self-rendered SVG grids).

### 3.3 Dynamic View Integration

Update the target viewer interface component (e.g., `ArticleView.tsx`):

```tsx
import { MDXRemote } from 'next-mdx-remote/navigation';
import { DataTable } from './components/mdx/DataTable';
import { MetricCard } from './components/mdx/MetricCard';
import { DataChart } from './components/mdx/DataChart';

const mdxComponents = {
  DataTable,
  MetricCard,
  DataChart
};

export function ArticleView({ article }) {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>{article.title}</h1>
      {article.image_url && (
        <img src={article.image_url} alt={article.title} className="w-full h-64 object-cover rounded-xl" />
      )}
      <MDXRemote components="{mdxComponents}" source="{article.content_mdx}"/>
    </div>
  );
}

```

---

## Milestone 4: Granular Topic Memory & Contextual Chat

**Objective:** Empower users to deep dive into the broader context of their personal news feed through semantic lookup.

### 4.1 Global Context Router (`apps/web/app/api/chat/route.ts`)

Create or edit the chat execution route:

1. **Compute Input Vector:** Generate a vector representation of the user's conversation question.
2. **Cosine Similarity Match:** Run an optimized vector lookup across `public.article_chunks` scoped strictly to the authenticated `user_id`:

```sql
    SELECT content FROM article_chunks 
    WHERE user_id = :userId 
    ORDER BY embedding <=> :inputEmbedding 
    LIMIT 5;
    ```
3.  **Prompt & Answer Execution (`Gemini 3.5 Flash`):** Assemble the top 5 relevant document fragments into the prompt system block. Submit the final payload to the chat model for high-speed streaming generation.

---

## Verification Checklist for IDE Agent
- [ ] Database migrations execute locally without errors.
- [ ] `apps/worker` validates formatting to prevent syntax issues before writing to the database.
- [ ] Custom MDX components extract properties safely without failing if empty parameters occur.
- [ ] Chat endpoint isolates semantic information matching by active user session ID.

```