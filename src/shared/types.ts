import type { ClaimType, EvidenceGrade, SourceClassification } from './taxonomy.js';

export type Source = {
  id: string;
  title: string;
  author: string;
  date: string;
  url: string;
  sourceType: SourceClassification;
  summary: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  citationNotes: string;
};

export type Claim = {
  id: string;
  sourceId: string;
  text: string;
  type: ClaimType;
  evidenceGrade: EvidenceGrade;
  confidenceLevel: 'high' | 'medium' | 'low';
  citationRequired: boolean;
  notes: string;
};

export type GenealogyNode = {
  id: string;
  label: string;
  period: string;
  category: string;
  description: string;
};

export type GenealogyEdge = {
  from: string;
  to: string;
  label: string;
  confidence: 'high' | 'medium' | 'low';
};

export type AdditionFramework = {
  id: string;
  name: string;
  description: string;
  requiredBoundaries: string[];
};

export type DiscoverySearchRequest = {
  query: string;
  scope: 'combined' | 'engine' | 'web';
  maxResults: number;
  inspectPages: boolean;
  exactPhrase?: string;
  includeTerms?: string[];
  excludeTerms?: string[];
  domains?: string[];
  sourceTypes?: SourceClassification[];
  evidenceGrades?: EvidenceGrade[];
  sourceIds?: string[];
  dateFrom?: number;
  dateTo?: number;
  minRelevance?: number;
};

export type DiscoverySearchResult = {
  id: string;
  origin: 'engine' | 'web';
  category:
    | 'source'
    | 'claim'
    | 'genealogy'
    | 'person'
    | 'movement'
    | 'term'
    | 'comparative concept'
    | 'timeline'
    | 'bibliography'
    | 'webpage';
  title: string;
  url: string;
  domain: string;
  snippet: string;
  inspected: boolean;
  relevanceScore: number;
  matchedTerms: string[];
  sourceType?: SourceClassification;
  confidenceLevel?: 'high' | 'medium' | 'low';
  evidenceGrade?: EvidenceGrade;
  researchNotes: string[];
  pageTitle?: string;
  pageDescription?: string;
  pageExcerpt?: string;
  discoveredAt: string;
};

export type DiscoverySearchResponse = {
  query: string;
  effectiveWebQuery: string;
  results: DiscoverySearchResult[];
  warnings: string[];
  summary: {
    engineMatches: number;
    webMatches: number;
    inspectedPages: number;
  };
};

export type SeedPack = {
  id: string;
  name: string;
  description: string;
  querySeeds: string[];
  sourceIds: string[];
};

export type ReviewQueueItem = {
  id: string;
  title: string;
  url: string;
  domain: string;
  proposedSourceType: SourceClassification;
  summary: string;
  provenance: 'curated seed' | 'discovery search';
  status: 'pending' | 'approved' | 'rejected';
  confidenceLevel: 'high' | 'medium' | 'low';
  citationNotes: string;
  discoveredAt: string;
  reviewedAt?: string;
  reviewerNotes?: string;
};

export type ResearchPerson = {
  id: string;
  name: string;
  lifespan: string;
  role: string;
  movementIds: string[];
  sourceIds: string[];
  summary: string;
};

export type ResearchMovement = {
  id: string;
  name: string;
  period: string;
  classification: SourceClassification;
  summary: string;
  sourceIds: string[];
};

export type ResearchTerm = {
  id: string;
  term: string;
  aliases: string[];
  tradition: string;
  definition: string;
  caution: string;
  sourceIds: string[];
};

export type ComparativeConcept = {
  id: string;
  concept: string;
  tradition: string;
  relationshipToAkashicResearch: 'analogue' | 'influence' | 'contrast' | 'speculative comparison';
  summary: string;
  boundaryNote: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  sourceIds: string[];
};

export type TimelineEvent = {
  id: string;
  date: string;
  title: string;
  summary: string;
  entityIds: string[];
  sourceIds: string[];
  confidenceLevel: 'high' | 'medium' | 'low';
};

export type BibliographicRecord = {
  id: string;
  sourceId: string;
  title: string;
  author: string;
  publicationDate: string;
  editionNotes: string;
  publisher: string;
  archiveUrl: string;
  rightsStatus: 'public domain' | 'copyrighted' | 'unknown';
  sourceClassification: SourceClassification;
  citationStatus: 'complete' | 'partial' | 'needs review';
  accessType: 'full text' | 'catalog/reference' | 'movement page';
  reviewStatus: 'reviewed' | 'needs page review' | 'lead only';
  stableCitation: string;
  pageReference: string;
  auditNote: string;
};

export type SourceImportPreviewRequest = {
  url: string;
};

export type SourceImportPreview = {
  url: string;
  domain: string;
  title: string;
  description: string;
  textExcerpt: string;
  proposedSourceType: SourceClassification;
  confidenceLevel: 'high' | 'medium' | 'low';
  citationNotes: string;
  extractionStatus: 'completed' | 'failed';
  warnings: string[];
};
