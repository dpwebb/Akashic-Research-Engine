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

create table research_people (
  id text primary key,
  name text not null,
  lifespan text not null default '',
  role text not null default '',
  summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table research_movements (
  id text primary key,
  name text not null,
  period text not null default '',
  classification text not null,
  summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table research_terms (
  id text primary key,
  term text not null,
  aliases text[] not null default '{}',
  tradition text not null default '',
  definition text not null default '',
  caution text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table timeline_events (
  id text primary key,
  event_date text not null,
  title text not null,
  summary text not null default '',
  confidence_level text not null check (confidence_level in ('high', 'medium', 'low')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table bibliographic_records (
  id text primary key,
  source_id uuid references sources(id) on delete set null,
  title text not null,
  author text not null default '',
  publication_date text not null default '',
  edition_notes text not null default '',
  publisher text not null default '',
  archive_url text not null default '',
  rights_status text not null check (rights_status in ('public domain', 'copyrighted', 'unknown')),
  source_classification text not null default '',
  citation_status text not null default 'needs review' check (citation_status in ('complete', 'partial', 'needs review')),
  access_type text not null default 'catalog/reference' check (access_type in ('full text', 'catalog/reference', 'movement page')),
  review_status text not null default 'needs page review' check (review_status in ('reviewed', 'needs page review', 'lead only')),
  stable_citation text not null default '',
  page_reference text not null default '',
  audit_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table source_claim_links (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id) on delete cascade,
  claim_id uuid not null references claims(id) on delete cascade,
  page_reference text not null default '',
  chapter_reference text not null default '',
  quotation text not null default '',
  reviewer_notes text not null default '',
  unique (source_id, claim_id, page_reference)
);

create table entity_source_links (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('person', 'movement', 'term', 'timeline_event')),
  entity_id text not null,
  source_id uuid not null references sources(id) on delete cascade,
  relationship_label text not null default 'related source',
  confidence_level text not null check (confidence_level in ('high', 'medium', 'low')),
  unique (entity_type, entity_id, source_id, relationship_label)
);

create table review_queue_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null unique,
  domain text not null,
  proposed_source_type text not null,
  summary text not null default '',
  provenance text not null check (provenance in ('curated seed', 'discovery search')),
  status text not null check (status in ('pending', 'approved', 'rejected')),
  confidence_level text not null check (confidence_level in ('high', 'medium', 'low')),
  review_priority text not null default 'medium' check (review_priority in ('high', 'medium', 'low')),
  citation_notes text not null default '',
  quality_flags text[] not null default '{}',
  required_actions text[] not null default '{}',
  reviewer_notes text not null default '',
  discovered_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table source_full_texts (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id) on delete cascade,
  content_url text not null default '',
  extracted_text text not null default '',
  extraction_status text not null check (extraction_status in ('pending', 'completed', 'failed')),
  extraction_notes text not null default '',
  extracted_at timestamptz,
  unique (source_id, content_url)
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
  relationship_kind text not null default '',
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  source_ids text[] not null default '{}',
  audit_note text not null default ''
);

create table ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  domain text not null default '',
  title text not null default '',
  status text not null check (status in ('queued', 'running', 'completed', 'failed')),
  source_type text not null default '',
  citation_status text not null default 'needs review' check (citation_status in ('complete', 'partial', 'needs review')),
  word_count integer not null default 0,
  full_text_candidate boolean not null default false,
  quality_flags text[] not null default '{}',
  extraction_notes text not null default '',
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
