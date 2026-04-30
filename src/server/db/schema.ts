import type { Generated } from 'kysely';

export type Database = {
  sources: SourceTable;
  claims: ClaimTable;
  genealogy_nodes: GenealogyNodeTable;
  genealogy_edges: GenealogyEdgeTable;
  assistant_outputs: AssistantOutputTable;
  ingestion_jobs: IngestionJobTable;
};

export type SourceTable = {
  id: Generated<string>;
  title: string;
  author: string | null;
  published_date: string | null;
  url: string;
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
  confidence: string;
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
  status: 'queued' | 'running' | 'completed' | 'failed';
  error_message: string | null;
  created_at: Generated<Date>;
  completed_at: Date | null;
};
