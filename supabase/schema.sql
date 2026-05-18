-- RecallIQ core schema

create extension if not exists "pgcrypto";

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  clerk_org_id text unique,
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  organization_id uuid references public.organizations(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'member',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  external_id text,
  name text not null,
  company text not null,
  stage text not null default 'prospecting',
  sentiment text,
  owner_name text,
  forecast_value numeric(12,2) not null default 0,
  health_score integer not null default 0,
  pricing_risk text not null default 'low',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  channel text not null,
  summary text not null,
  tone text not null,
  next_step text,
  source_uri text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memory_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  subject text not null,
  insight text not null,
  confidence numeric(5,4) not null default 0.8,
  tags text[] not null default '{}'::text[],
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.runtime_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  memory_entry_id uuid references public.memory_entries(id) on delete set null,
  model_name text not null,
  route text not null,
  latency_ms integer not null default 0,
  cost_cents integer not null default 0,
  budget_remaining numeric(10,4),
  trace_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.budget_policies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  monthly_budget_cents integer not null,
  hard_limit_cents integer,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  metric_key text not null,
  metric_value numeric(14,4) not null,
  captured_at timestamptz not null default now()
);

create table if not exists public.workspace_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  memory_retention_days integer not null default 365,
  budget_alert_threshold numeric(5,4) not null default 0.8,
  latency_target_ms integer not null default 300,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id)
);

create index if not exists customers_org_stage_idx on public.customers (organization_id, stage);
create index if not exists conversations_org_time_idx on public.conversations (organization_id, occurred_at desc);
create index if not exists memory_entries_org_customer_idx on public.memory_entries (organization_id, customer_id, created_at desc);
create index if not exists runtime_events_org_time_idx on public.runtime_events (organization_id, created_at desc);
create index if not exists analytics_snapshots_org_metric_idx on public.analytics_snapshots (organization_id, metric_key, captured_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_organizations_updated_at on public.organizations;
create trigger touch_organizations_updated_at
before update on public.organizations
for each row execute function public.touch_updated_at();

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_customers_updated_at on public.customers;
create trigger touch_customers_updated_at
before update on public.customers
for each row execute function public.touch_updated_at();

drop trigger if exists touch_conversations_updated_at on public.conversations;
create trigger touch_conversations_updated_at
before update on public.conversations
for each row execute function public.touch_updated_at();

drop trigger if exists touch_memory_entries_updated_at on public.memory_entries;
create trigger touch_memory_entries_updated_at
before update on public.memory_entries
for each row execute function public.touch_updated_at();

drop trigger if exists touch_budget_policies_updated_at on public.budget_policies;
create trigger touch_budget_policies_updated_at
before update on public.budget_policies
for each row execute function public.touch_updated_at();

drop trigger if exists touch_workspace_settings_updated_at on public.workspace_settings;
create trigger touch_workspace_settings_updated_at
before update on public.workspace_settings
for each row execute function public.touch_updated_at();

comment on table public.memory_entries is 'Persistent hindsight memory records for RecallIQ.';
comment on table public.runtime_events is 'Cascadeflow runtime telemetry and routing observability.';