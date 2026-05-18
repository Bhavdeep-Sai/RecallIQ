-- ============================================================
-- RecallIQ — Complete database setup
-- Run this entire file in the Supabase SQL Editor
-- Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "citext";
create extension if not exists "vector";

-- ── Enums ──────────────────────────────────────────────────

do $$ begin create type public.member_role as enum ('owner','admin','manager','rep','analyst','member'); exception when duplicate_object then null; end $$;
do $$ begin create type public.member_status as enum ('invited','active','suspended','removed'); exception when duplicate_object then null; end $$;
do $$ begin create type public.customer_stage as enum ('lead','qualified','discovery','proposal','negotiation','closed_won','closed_lost'); exception when duplicate_object then null; end $$;
do $$ begin create type public.conversation_status as enum ('open','pending_follow_up','closed','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type public.message_sender_type as enum ('user','customer','ai','system','integration'); exception when duplicate_object then null; end $$;
do $$ begin create type public.message_format as enum ('plain_text','markdown','email_html','json'); exception when duplicate_object then null; end $$;
do $$ begin create type public.follow_up_status as enum ('draft','queued','sent','completed','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type public.memory_entry_kind as enum ('objection','tone','pricing','stakeholder','security','timeline','preference','summary','strategy'); exception when duplicate_object then null; end $$;
do $$ begin create type public.runtime_log_level as enum ('debug','info','warn','error'); exception when duplicate_object then null; end $$;
do $$ begin create type public.escalation_severity as enum ('low','medium','high','critical'); exception when duplicate_object then null; end $$;
do $$ begin create type public.escalation_status as enum ('open','investigating','resolved','dismissed'); exception when duplicate_object then null; end $$;
do $$ begin create type public.budget_scope as enum ('organization','workspace','member','model','channel'); exception when duplicate_object then null; end $$;
do $$ begin create type public.analytics_granularity as enum ('hour','day','week','month'); exception when duplicate_object then null; end $$;

-- ── Helper functions ────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create or replace function public.current_user_id()
returns text language sql stable as $$
  select coalesce(
    nullif(current_setting('app.current_user_id', true), ''),
    nullif(current_setting('request.jwt.claim.sub', true), '')
  ) $$;

create or replace function public.current_organization_id()
returns uuid language sql stable as $$
  select nullif(current_setting('app.current_organization_id', true), '')::uuid $$;

create or replace function public.is_org_member(target_organization_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.team_members tm
    where tm.organization_id = target_organization_id
      and tm.clerk_user_id = public.current_user_id()
      and tm.deleted_at is null and tm.status = 'active'
  ) $$;

create or replace function public.is_org_admin(target_organization_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.team_members tm
    where tm.organization_id = target_organization_id
      and tm.clerk_user_id = public.current_user_id()
      and tm.deleted_at is null and tm.status = 'active'
      and tm.role in ('owner','admin')
  ) $$;

-- ── Tables ──────────────────────────────────────────────────

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  name text not null,
  plan text not null default 'growth',
  billing_status text not null default 'trialing',
  timezone text not null default 'UTC',
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clerk_user_id text not null,
  email citext,
  full_name text,
  role public.member_role not null default 'member',
  status public.member_status not null default 'invited',
  title text,
  avatar_url text,
  invited_at timestamptz,
  joined_at timestamptz,
  last_active_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, clerk_user_id),
  unique (organization_id, email)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_member_id uuid references public.team_members(id) on delete set null,
  external_id text,
  external_source text,
  display_name text not null,
  company_name text not null,
  email citext,
  phone text,
  website text,
  lifecycle_stage public.customer_stage not null default 'lead',
  lifecycle_score integer not null default 0,
  health_score integer not null default 0,
  sentiment text,
  pricing_risk text,
  annual_contract_value_cents bigint not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  assigned_member_id uuid references public.team_members(id) on delete set null,
  created_by_member_id uuid references public.team_members(id) on delete set null,
  channel text not null,
  subject text,
  status public.conversation_status not null default 'open',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  summary text,
  tone text,
  outcome text,
  source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  sender_type public.message_sender_type not null,
  sender_member_id uuid references public.team_members(id) on delete set null,
  sender_name text,
  content text not null,
  content_format public.message_format not null default 'plain_text',
  sentiment text,
  model_name text,
  token_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.ai_follow_ups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  message_id uuid references public.messages(id) on delete set null,
  created_by_member_id uuid references public.team_members(id) on delete set null,
  assigned_member_id uuid references public.team_members(id) on delete set null,
  title text not null,
  body text not null,
  rationale text,
  priority integer not null default 3,
  status public.follow_up_status not null default 'draft',
  confidence numeric(5,4) not null default 0.8000,
  model_name text,
  due_at timestamptz,
  generated_at timestamptz not null default now(),
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.ai_memory_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  entry_kind public.memory_entry_kind not null,
  memory_key text not null,
  memory_value text,
  summary text not null,
  embedding vector(384),
  confidence numeric(5,4) not null default 0.8000,
  importance integer not null default 50,
  tags text[] not null default '{}'::text[],
  source_refs jsonb not null default '[]'::jsonb,
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.model_routing_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  follow_up_id uuid references public.ai_follow_ups(id) on delete set null,
  request_id text not null,
  provider text not null,
  selected_model text not null,
  fallback_model text,
  routing_strategy text not null,
  route_reason text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  total_tokens integer not null default 0,
  latency_ms integer not null default 0,
  confidence numeric(5,4) not null default 0.8000,
  cost_cents integer not null default 0,
  budget_remaining_cents bigint,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.token_usage_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  follow_up_id uuid references public.ai_follow_ups(id) on delete set null,
  routing_log_id uuid references public.model_routing_logs(id) on delete set null,
  provider text not null,
  model_name text not null,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  cached_tokens integer not null default 0,
  total_tokens integer not null default 0,
  cost_cents integer not null default 0,
  request_latency_ms integer not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.budget_limits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  scope public.budget_scope not null default 'organization',
  scope_key text,
  period_start date not null,
  period_end date not null,
  currency char(3) not null default 'USD',
  hard_limit_cents bigint not null,
  soft_limit_cents bigint,
  warn_threshold numeric(5,4) not null default 0.8000,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.cost_tracking_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  token_usage_log_id uuid references public.token_usage_logs(id) on delete set null,
  budget_limit_id uuid references public.budget_limits(id) on delete set null,
  cost_type text not null,
  currency char(3) not null default 'USD',
  cost_cents bigint not null default 0,
  forecast_cents bigint not null default 0,
  period_start date not null,
  period_end date not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.ai_performance_analytics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  granularity public.analytics_granularity not null,
  bucket_start timestamptz not null,
  bucket_end timestamptz not null,
  model_name text,
  routing_strategy text,
  conversations_processed integer not null default 0,
  messages_processed integer not null default 0,
  follow_ups_generated integer not null default 0,
  memory_entries_created integer not null default 0,
  avg_latency_ms numeric(10,2) not null default 0,
  p95_latency_ms numeric(10,2) not null default 0,
  avg_tokens numeric(14,2) not null default 0,
  total_tokens bigint not null default 0,
  total_cost_cents bigint not null default 0,
  success_rate numeric(5,4) not null default 0,
  escalation_rate numeric(5,4) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.runtime_intelligence_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  follow_up_id uuid references public.ai_follow_ups(id) on delete set null,
  request_id text not null,
  log_level public.runtime_log_level not null default 'info',
  event_name text not null,
  component text not null,
  message text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references public.team_members(id) on delete cascade,
  preferred_theme text not null default 'dark',
  locale text not null default 'en-US',
  timezone text not null default 'UTC',
  notification_settings jsonb not null default '{}'::jsonb,
  ai_settings jsonb not null default '{}'::jsonb,
  dashboard_layout jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (member_id)
);

create table if not exists public.escalation_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  follow_up_id uuid references public.ai_follow_ups(id) on delete set null,
  triggered_by_member_id uuid references public.team_members(id) on delete set null,
  assigned_to_member_id uuid references public.team_members(id) on delete set null,
  severity public.escalation_severity not null,
  status public.escalation_status not null default 'open',
  reason text not null,
  summary text not null,
  resolution text,
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ── Indexes ─────────────────────────────────────────────────

create index if not exists organizations_slug_idx on public.organizations (slug) where deleted_at is null;
create index if not exists team_members_org_role_idx on public.team_members (organization_id, role) where deleted_at is null;
create index if not exists team_members_user_idx on public.team_members (clerk_user_id) where deleted_at is null;
create index if not exists customers_org_stage_idx on public.customers (organization_id, lifecycle_stage, updated_at desc) where deleted_at is null;
create index if not exists conversations_customer_started_idx on public.conversations (customer_id, started_at desc) where deleted_at is null;
create index if not exists conversations_org_status_idx on public.conversations (organization_id, status, started_at desc) where deleted_at is null;
create index if not exists messages_conversation_occurred_idx on public.messages (conversation_id, occurred_at desc) where deleted_at is null;
create index if not exists memory_entries_org_customer_idx on public.ai_memory_entries (organization_id, customer_id, entry_kind, created_at desc) where deleted_at is null;
create index if not exists memory_entries_tags_idx on public.ai_memory_entries using gin (tags) where deleted_at is null;
create index if not exists memory_entries_embedding_idx on public.ai_memory_entries using hnsw (embedding vector_cosine_ops);
create index if not exists token_usage_org_created_idx on public.token_usage_logs (organization_id, created_at desc) where deleted_at is null;
create index if not exists budget_limits_org_scope_idx on public.budget_limits (organization_id, active, scope, period_start desc) where deleted_at is null;

-- ── Updated-at triggers ─────────────────────────────────────

do $$ declare t text; begin
  foreach t in array array[
    'organizations','team_members','customers','conversations','messages',
    'ai_follow_ups','ai_memory_entries','budget_limits','ai_performance_analytics',
    'user_preferences','escalation_events'
  ] loop
    execute format('drop trigger if exists touch_%s_updated_at on public.%I', t, t);
    execute format('create trigger touch_%s_updated_at before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

-- ── Row Level Security ──────────────────────────────────────

alter table public.organizations enable row level security;
alter table public.team_members enable row level security;
alter table public.customers enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.ai_follow_ups enable row level security;
alter table public.ai_memory_entries enable row level security;
alter table public.runtime_intelligence_logs enable row level security;
alter table public.model_routing_logs enable row level security;
alter table public.token_usage_logs enable row level security;
alter table public.budget_limits enable row level security;
alter table public.cost_tracking_entries enable row level security;
alter table public.ai_performance_analytics enable row level security;
alter table public.user_preferences enable row level security;
alter table public.escalation_events enable row level security;

-- Organizations
drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations for select using (public.is_org_member(id));
drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations for update using (public.is_org_admin(id)) with check (public.is_org_admin(id));

-- Team members
drop policy if exists team_members_select on public.team_members;
create policy team_members_select on public.team_members for select using (public.is_org_member(organization_id) or clerk_user_id = public.current_user_id());
drop policy if exists team_members_insert on public.team_members;
create policy team_members_insert on public.team_members for insert with check (public.is_org_admin(organization_id));
drop policy if exists team_members_update on public.team_members;
create policy team_members_update on public.team_members for update using (public.is_org_admin(organization_id) or clerk_user_id = public.current_user_id()) with check (public.is_org_admin(organization_id) or clerk_user_id = public.current_user_id());

-- All other org-scoped tables
do $$ declare t text; begin
  foreach t in array array[
    'customers','conversations','messages','ai_follow_ups','ai_memory_entries',
    'runtime_intelligence_logs','model_routing_logs','token_usage_logs',
    'budget_limits','cost_tracking_entries','ai_performance_analytics','escalation_events'
  ] loop
    execute format('drop policy if exists %s_select on public.%I', t, t);
    execute format('create policy %s_select on public.%I for select using (public.is_org_member(organization_id))', t, t);
    execute format('drop policy if exists %s_insert on public.%I', t, t);
    execute format('create policy %s_insert on public.%I for insert with check (public.is_org_member(organization_id))', t, t);
    execute format('drop policy if exists %s_update on public.%I', t, t);
    execute format('create policy %s_update on public.%I for update using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id))', t, t);
    execute format('drop policy if exists %s_delete on public.%I', t, t);
    execute format('create policy %s_delete on public.%I for delete using (public.is_org_admin(organization_id))', t, t);
  end loop;
end $$;

-- User preferences (member-scoped)
drop policy if exists user_preferences_select on public.user_preferences;
create policy user_preferences_select on public.user_preferences for select using (
  member_id in (select tm.id from public.team_members tm where tm.clerk_user_id = public.current_user_id() and tm.deleted_at is null)
  or public.is_org_admin(organization_id)
);
drop policy if exists user_preferences_insert on public.user_preferences;
create policy user_preferences_insert on public.user_preferences for insert with check (
  member_id in (select tm.id from public.team_members tm where tm.clerk_user_id = public.current_user_id() and tm.deleted_at is null)
  or public.is_org_admin(organization_id)
);
drop policy if exists user_preferences_update on public.user_preferences;
create policy user_preferences_update on public.user_preferences for update using (
  member_id in (select tm.id from public.team_members tm where tm.clerk_user_id = public.current_user_id() and tm.deleted_at is null)
  or public.is_org_admin(organization_id)
) with check (
  member_id in (select tm.id from public.team_members tm where tm.clerk_user_id = public.current_user_id() and tm.deleted_at is null)
  or public.is_org_admin(organization_id)
);

-- ── Seed: demo organization (optional, safe to skip) ────────
-- Uncomment to insert a demo org so the dashboard shows data immediately:
--
-- insert into public.organizations (slug, name, plan) values ('demo', 'Demo Org', 'growth') on conflict do nothing;
