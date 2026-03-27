create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  stripe_customer_id text unique,
  subscription_status text not null default 'canceled' check (subscription_status in ('active','trialing','past_due','canceled')),
  subscription_expires_at timestamptz,
  preferred_voice text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  category text not null,
  config jsonb not null default '{}'::jsonb,
  frequency text not null default 'daily' check (frequency in ('daily','weekly','realtime')),
  last_fetched_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  url_hash text not null,
  source_url text not null,
  source_name text not null,
  title text not null,
  tldr_bullets jsonb not null default '[]'::jsonb,
  body text not null,
  read_minutes double precision not null,
  sentiment text not null check (sentiment in ('positive','negative','neutral')),
  audio_url text,
  published_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (topic_id, url_hash)
);

create table if not exists public.article_reads (
  user_id uuid not null references public.users(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  read_at timestamptz not null default now(),
  listened_at timestamptz,
  primary key (user_id, article_id)
);

create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  provider text not null default 'stripe' check (provider = 'stripe'),
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  stripe_price_id text not null,
  plan_code text not null check (plan_code in ('go','pro')),
  status text not null check (status in ('trialing','active','past_due','canceled','unpaid','incomplete','incomplete_expired')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  stripe_checkout_session_id text not null unique,
  plan_code text not null check (plan_code in ('go','pro')),
  stripe_price_id text not null,
  status text not null default 'open' check (status in ('open','complete','expired')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.billing_events (
  id bigserial primary key,
  event_id text not null unique,
  provider text not null default 'stripe' check (provider = 'stripe'),
  event_type text not null,
  livemode boolean not null default false,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_topics_user on public.topics(user_id);
create index if not exists idx_topics_user_active on public.topics(user_id, is_active);
create index if not exists idx_articles_topic_published on public.articles(topic_id, published_at desc);
create index if not exists idx_articles_url_hash on public.articles(url_hash);
create index if not exists idx_article_reads_user_read_at on public.article_reads(user_id, read_at desc);
create index if not exists idx_checkout_sessions_user on public.checkout_sessions(user_id);
create index if not exists idx_billing_events_type_created on public.billing_events(event_type, created_at desc);

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at before update on public.users for each row execute function public.set_updated_at();
drop trigger if exists set_topics_updated_at on public.topics;
create trigger set_topics_updated_at before update on public.topics for each row execute function public.set_updated_at();
drop trigger if exists set_articles_updated_at on public.articles;
create trigger set_articles_updated_at before update on public.articles for each row execute function public.set_updated_at();
drop trigger if exists set_billing_subscriptions_updated_at on public.billing_subscriptions;
create trigger set_billing_subscriptions_updated_at before update on public.billing_subscriptions for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.topics enable row level security;
alter table public.articles enable row level security;
alter table public.article_reads enable row level security;
alter table public.billing_subscriptions enable row level security;
alter table public.checkout_sessions enable row level security;
alter table public.billing_events enable row level security;

drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users for select using (id = auth.uid());
drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists topics_select_own on public.topics;
create policy topics_select_own on public.topics for select using (user_id = auth.uid());
drop policy if exists topics_insert_own on public.topics;
create policy topics_insert_own on public.topics for insert with check (user_id = auth.uid());
drop policy if exists topics_update_own on public.topics;
create policy topics_update_own on public.topics for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists topics_delete_own on public.topics;
create policy topics_delete_own on public.topics for delete using (user_id = auth.uid());

drop policy if exists articles_select_via_topic_owner on public.articles;
create policy articles_select_via_topic_owner on public.articles
for select using (
  exists (
    select 1 from public.topics t
    where t.id = articles.topic_id
      and t.user_id = auth.uid()
  )
);

drop policy if exists article_reads_select_own on public.article_reads;
create policy article_reads_select_own on public.article_reads for select using (user_id = auth.uid());
drop policy if exists article_reads_insert_own on public.article_reads;
create policy article_reads_insert_own on public.article_reads
for insert with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.articles a
    join public.topics t on t.id = a.topic_id
    where a.id = article_id and t.user_id = auth.uid()
  )
);
drop policy if exists article_reads_update_own on public.article_reads;
create policy article_reads_update_own on public.article_reads
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists billing_subscriptions_select_own on public.billing_subscriptions;
create policy billing_subscriptions_select_own on public.billing_subscriptions for select using (user_id = auth.uid());

drop policy if exists checkout_sessions_select_own on public.checkout_sessions;
create policy checkout_sessions_select_own on public.checkout_sessions for select using (user_id = auth.uid());
drop policy if exists checkout_sessions_insert_own on public.checkout_sessions;
create policy checkout_sessions_insert_own on public.checkout_sessions for insert with check (user_id = auth.uid());
drop policy if exists checkout_sessions_update_own on public.checkout_sessions;
create policy checkout_sessions_update_own on public.checkout_sessions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
