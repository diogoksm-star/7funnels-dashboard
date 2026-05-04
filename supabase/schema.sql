create extension if not exists "pgcrypto";

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  dashboard_password_hash text not null,
  subtitle text not null default 'Relatorio visual de midia paga',
  logo_url text,
  goals jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.imports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  report_level text not null check (report_level in ('campaign', 'adset', 'ad')),
  period_start date,
  period_end date,
  storage_path text,
  row_count integer not null default 0,
  columns jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.entities (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  level text not null check (level in ('campaign', 'adset', 'ad')),
  name text not null,
  normalized_name text not null,
  parent_name text,
  status text,
  objective_type text,
  funnel_stage text,
  manual_category text,
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.metric_rows (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  import_id uuid not null references public.imports(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete set null,
  level text not null check (level in ('campaign', 'adset', 'ad')),
  entity_name text not null,
  parent_name text,
  period_start date,
  period_end date,
  status text,
  objective_type text,
  result_indicator text,
  raw_json jsonb not null default '{}'::jsonb,
  spend numeric not null default 0,
  results numeric not null default 0,
  cost_per_result numeric not null default 0,
  impressions numeric not null default 0,
  reach numeric not null default 0,
  frequency numeric not null default 0,
  cpm numeric not null default 0,
  link_clicks numeric not null default 0,
  purchases numeric not null default 0,
  checkouts numeric not null default 0,
  landing_page_views numeric not null default 0,
  roas numeric not null default 0,
  revenue numeric not null default 0,
  profit numeric not null default 0,
  quality_ranking text,
  engagement_ranking text,
  conversion_ranking text,
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  scope text not null default 'account',
  objective_type text,
  target_roas numeric,
  max_cpa numeric,
  max_cpl numeric,
  max_cost_per_message numeric,
  max_spend_without_result numeric,
  max_frequency numeric,
  min_ctr numeric,
  expected_lead_value numeric,
  close_rate numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.entity_mappings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  level text not null check (level in ('campaign', 'adset', 'ad')),
  original_name text not null,
  parent_name text,
  friendly_name text,
  manual_objective text,
  type text,
  main_tag text,
  notes text,
  creative_type text,
  creative_angle text,
  offer text,
  creative_status text,
  audience_region text,
  audience_age text,
  audience_gender text,
  audience_temperature text,
  audience_type text,
  updated_at timestamptz not null default now()
);

create index if not exists metric_rows_client_level_idx on public.metric_rows(client_id, level);
create index if not exists metric_rows_import_idx on public.metric_rows(import_id);
create index if not exists entities_client_level_idx on public.entities(client_id, level);
create index if not exists entity_mappings_client_level_idx on public.entity_mappings(client_id, level);
create unique index if not exists entities_unique_name_idx
  on public.entities(client_id, level, normalized_name, coalesce(parent_name, ''));
create unique index if not exists entity_mappings_unique_name_idx
  on public.entity_mappings(client_id, level, original_name, coalesce(parent_name, ''));

alter table public.clients enable row level security;
alter table public.imports enable row level security;
alter table public.entities enable row level security;
alter table public.metric_rows enable row level security;
alter table public.goals enable row level security;
alter table public.entity_mappings enable row level security;

-- The MVP uses server-side/service role writes. Add stricter per-user policies
-- when the admin account model is finalized.
