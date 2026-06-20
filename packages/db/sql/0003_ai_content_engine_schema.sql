create extension if not exists vector;

alter table public.articles
  add column if not exists content_mdx text,
  add column if not exists image_url text,
  add column if not exists image_attribution text;

create table if not exists public.topic_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  topic_query text not null,
  rolling_summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, topic_query)
);

create table if not exists public.article_chunks (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique (article_id, chunk_index)
);

create index if not exists idx_topic_summaries_user_updated
  on public.topic_summaries(user_id, updated_at desc);

create index if not exists idx_article_chunks_article
  on public.article_chunks(article_id, chunk_index);

create index if not exists idx_article_chunks_user
  on public.article_chunks(user_id);

create index if not exists article_chunks_embedding_idx
  on public.article_chunks using hnsw (embedding vector_cosine_ops)
  where embedding is not null;

drop trigger if exists set_topic_summaries_updated_at on public.topic_summaries;
create trigger set_topic_summaries_updated_at
before update on public.topic_summaries
for each row execute function public.set_updated_at();

alter table public.topic_summaries enable row level security;
alter table public.article_chunks enable row level security;

drop policy if exists topic_summaries_select_own on public.topic_summaries;
create policy topic_summaries_select_own on public.topic_summaries
for select using (user_id = auth.uid());

drop policy if exists topic_summaries_insert_own on public.topic_summaries;
create policy topic_summaries_insert_own on public.topic_summaries
for insert with check (user_id = auth.uid());

drop policy if exists topic_summaries_update_own on public.topic_summaries;
create policy topic_summaries_update_own on public.topic_summaries
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists topic_summaries_delete_own on public.topic_summaries;
create policy topic_summaries_delete_own on public.topic_summaries
for delete using (user_id = auth.uid());

drop policy if exists article_chunks_select_own on public.article_chunks;
create policy article_chunks_select_own on public.article_chunks
for select using (user_id = auth.uid());
