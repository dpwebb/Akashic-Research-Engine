import type { Generated } from 'kysely';

export type Database = {
  sources: SourceTable;
  claims: ClaimTable;
  research_people: ResearchPersonTable;
  research_movements: ResearchMovementTable;
  research_terms: ResearchTermTable;
  timeline_events: TimelineEventTable;
  bibliographic_records: BibliographicRecordTable;
  source_claim_links: SourceClaimLinkTable;
  entity_source_links: EntitySourceLinkTable;
  review_queue_items: ReviewQueueItemTable;
  source_full_texts: SourceFullTextTable;
  genealogy_nodes: GenealogyNodeTable;
  genealogy_edges: GenealogyEdgeTable;
  assistant_outputs: AssistantOutputTable;
  ingestion_jobs: IngestionJobTable;
  source_aliases: SourceAliasTable;
  duplicate_reviews: DuplicateReviewTable;
};

export type ResearchPersonTable = {
  id: string;
  name: string;
  lifespan: string;
  role: string;
  summary: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
};

export type ResearchMovementTable = {
  id: string;
  name: string;
  period: string;
  classification: string;
  summary: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
};

export type ResearchTermTable = {
  id: string;
  term: string;
  aliases: string[];
  tradition: string;
  definition: string;
  caution: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
};

export type TimelineEventTable = {
  id: string;
  event_date: string;
  title: string;
  summary: string;
  confidence_level: 'high' | 'medium' | 'low';
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
};

export type BibliographicRecordTable = {
  id: string;
  source_id: string | null;
  title: string;
  author: string;
  publication_date: string;
  edition_notes: string;
  publisher: string;
  archive_url: string;
  rights_status: 'public domain' | 'copyrighted' | 'unknown';
  source_classification: string;
  citation_status: 'complete' | 'partial' | 'needs review';
  access_type: 'full text' | 'catalog/reference' | 'movement page';
  review_status: 'reviewed' | 'needs page review' | 'lead only';
  stable_citation: string;
  page_reference: string;
  audit_note: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
};

export type SourceClaimLinkTable = {
  id: Generated<string>;
  source_id: string;
  claim_id: string;
  page_reference: string;
  chapter_reference: string;
  quotation: string;
  reviewer_notes: string;
};

export type SourceAliasTable = {
  id: Generated<string>;
  source_id: string;
  url: string;
  canonical_url: string;
  alias_kind: 'alternate URL' | 'archive mirror' | 'publisher mirror' | 'redirect' | 'duplicate submission';
  review_note: string;
  created_at: Generated<Date>;
};

export type EntitySourceLinkTable = {
  id: Generated<string>;
  entity_type: 'person' | 'movement' | 'term' | 'timeline_event';
  entity_id: string;
  source_id: string;
  relationship_label: string;
  confidence_level: 'high' | 'medium' | 'low';
};

export type ReviewQueueItemTable = {
  id: Generated<string>;
  title: string;
  url: string;
  canonical_url: string;
  source_fingerprint: string;
  domain: string;
  proposed_source_type: string;
  summary: string;
  provenance: 'curated seed' | 'discovery search';
  status: 'pending' | 'approved' | 'rejected';
  confidence_level: 'high' | 'medium' | 'low';
  review_priority: 'high' | 'medium' | 'low';
  citation_notes: string;
  quality_flags: string[];
  required_actions: string[];
  duplicate_candidates: unknown[];
  reviewer_notes: string;
  discovered_at: Generated<Date>;
  reviewed_at: Date | null;
};

export type DuplicateReviewTable = {
  id: Generated<string>;
  incoming_origin: 'review queue' | 'ingestion job' | 'manual import';
  incoming_id: string;
  candidate_origin: string;
  candidate_id: string;
  match_kind: string;
  confidence_score: number;
  decision: 'merge' | 'link as alternate URL' | 'keep separate edition' | 'reject duplicate';
  reviewer_notes: string;
  created_at: Generated<Date>;
};

export type SourceFullTextTable = {
  id: Generated<string>;
  source_id: string;
  content_url: string;
  extracted_text: string;
  extraction_status: 'pending' | 'completed' | 'failed';
  extraction_notes: string;
  extracted_at: Date | null;
};

export type SourceTable = {
  id: Generated<string>;
  title: string;
  author: string | null;
  published_date: string | null;
  url: string;
  canonical_url: string;
  source_fingerprint: string;
  content_fingerprint: string;
  source_type: string;
  summary: string;
  confidence_level: string;
  citation_notes: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
};

export type ClaimTable = {
  id: Generated<string>;
  source_id: string;
  text: string;
  normalized_text: string;
  claim_fingerprint: string;
  claim_type: string;
  evidence_grade: string;
  confidence_level: string;
  citation_required: boolean;
  notes: string;
  created_at: Generated<Date>;
};

export type GenealogyNodeTable = {
  id: string;
  label: string;
  period: string;
  category: string;
  description: string;
};

export type GenealogyEdgeTable = {
  id: Generated<string>;
  from_node_id: string;
  to_node_id: string;
  label: string;
  relationship_kind: string;
  confidence: string;
  source_ids: string[];
  audit_note: string;
};

export type AssistantOutputTable = {
  id: Generated<string>;
  template_id: string;
  prompt: string;
  output: string;
  is_speculative: boolean;
  created_at: Generated<Date>;
};

export type IngestionJobTable = {
  id: Generated<string>;
  url: string;
  canonical_url: string;
  source_fingerprint: string;
  domain: string;
  title: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  source_type: string;
  citation_status: 'complete' | 'partial' | 'needs review';
  word_count: number;
  full_text_candidate: boolean;
  quality_flags: string[];
  duplicate_candidates: unknown[];
  extraction_notes: string;
  error_message: string | null;
  created_at: Generated<Date>;
  completed_at: Date | null;
};
