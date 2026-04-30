create table sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  published_date text,
  url text not null unique,
  source_type text not null,
  summary text not null default '',
  confidence_level text not null check (confidence_level in ('high', 'medium', 'low')),
  citation_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table claims (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id) on delete cascade,
  text text not null,
  claim_type text not null,
  evidence_grade text not null check (evidence_grade in ('A', 'B', 'C', 'D', 'E', 'F')),
  confidence_level text not null check (confidence_level in ('high', 'medium', 'low')),
  citation_required boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table genealogy_nodes (
  id text primary key,
  label text not null,
  period text not null,
  category text not null,
  description text not null
);

create table genealogy_edges (
  id uuid primary key default gen_random_uuid(),
  from_node_id text not null references genealogy_nodes(id) on delete cascade,
  to_node_id text not null references genealogy_nodes(id) on delete cascade,
  label text not null,
  confidence text not null check (confidence in ('high', 'medium', 'low'))
);

create table ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  status text not null check (status in ('queued', 'running', 'completed', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table assistant_outputs (
  id uuid primary key default gen_random_uuid(),
  template_id text not null,
  prompt text not null,
  output text not null,
  is_speculative boolean not null default true,
  created_at timestamptz not null default now()
);
