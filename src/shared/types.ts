import type { ClaimType, EvidenceGrade, SourceClassification } from './taxonomy.js';

export type Source = {
  id: string;
  title: string;
  author: string;
  date: string;
  url: string;
  canonicalUrl?: string;
  sourceFingerprint?: string;
  sourceType: SourceClassification;
  summary: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  citationNotes: string;
};

export type Claim = {
  id: string;
  sourceId: string;
  text: string;
  normalizedText?: string;
  claimFingerprint?: string;
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
  relationshipKind: 'term inheritance' | 'doctrinal influence' | 'reinterpretation' | 'parallel concept' | 'disputed link';
  confidence: 'high' | 'medium' | 'low';
  sourceIds: string[];
  auditNote: string;
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
  resourceCount?: number;
};

export type CitationStatus = 'complete' | 'partial' | 'needs review';

export type SourceAccessType = 'full text' | 'catalog/reference' | 'movement page';

export type ReviewQueueItem = {
  id: string;
  title: string;
  author?: string;
  publicationDate?: string;
  publisher?: string;
  url: string;
  canonicalUrl?: string;
  sourceFingerprint?: string;
  domain: string;
  proposedSourceType: SourceClassification;
  summary: string;
  provenance: 'curated seed' | 'discovery search';
  status: 'pending' | 'reviewed' | 'approved' | 'promoted' | 'rejected';
  confidenceLevel: 'high' | 'medium' | 'low';
  reviewPriority: 'high' | 'medium' | 'low';
  citationStatus?: CitationStatus;
  accessType?: SourceAccessType;
  stableCitation?: string;
  citationNotes: string;
  sourceCollection?: string;
  catalogTags?: string[];
  qualityFlags: string[];
  requiredActions: string[];
  discoveredAt: string;
  duplicateCandidates?: DuplicateCandidate[];
  reviewedAt?: string;
  reviewerNotes?: string;
  assignedReviewer?: string;
  decisionReason?: string;
  promotedAt?: string;
  promotedSourceId?: string;
};

export type RuntimePersistenceMode = 'postgres' | 'json';

export type AccountPlanId = 'public-library' | 'researcher-seat' | 'studio-seat' | 'institution-license';

export type UsageMetric = 'discoverySearches' | 'sourceImports' | 'assistantGenerations' | 'reviewSubmissions' | 'exports';

export type UsageLimits = Record<UsageMetric, number | null>;

export type UsageSnapshot = Record<UsageMetric, number>;

export type AccountEntitlement = {
  email: string;
  planId: AccountPlanId;
  status: 'anonymous' | 'active' | 'trialing' | 'past_due' | 'cancelled';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEndsAt?: string;
  usage: UsageSnapshot;
  updatedAt: string;
};

export type ExportDeliverableType =
  | 'citation-packet'
  | 'contradiction-report'
  | 'source-review-dossier'
  | 'genealogy-summary'
  | 'bibliography-export';

export type ExportDeliverable = {
  id: string;
  type: ExportDeliverableType;
  title: string;
  format: 'markdown';
  content: string;
  createdAt: string;
  createdByEmail?: string;
};

export type PromotedSource = Source & {
  reviewQueueItemId: string;
  promotedAt: string;
  promotionNotes: string;
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
  citationStatus: CitationStatus;
  accessType: SourceAccessType;
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
  canonicalUrl: string;
  sourceFingerprint: string;
  contentFingerprint?: string;
  domain: string;
  title: string;
  description: string;
  contentType: string;
  detectedAuthor: string;
  detectedDate: string;
  wordCount: number;
  characterCount: number;
  fullTextCandidate: boolean;
  citationStatus: CitationStatus;
  qualityFlags: string[];
  textExcerpt: string;
  proposedSourceType: SourceClassification;
  confidenceLevel: 'high' | 'medium' | 'low';
  citationNotes: string;
  extractionStatus: 'completed' | 'failed';
  warnings: string[];
  duplicateCandidates: DuplicateCandidate[];
};

export type IngestionJob = {
  id: string;
  url: string;
  canonicalUrl?: string;
  sourceFingerprint?: string;
  domain: string;
  title: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  sourceType: SourceClassification;
  citationStatus: CitationStatus;
  wordCount: number;
  fullTextCandidate: boolean;
  qualityFlags: string[];
  extractionNotes: string;
  duplicateCandidates?: DuplicateCandidate[];
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
};

export type DuplicateMatchKind =
  | 'exact_url_match'
  | 'canonical_url_match'
  | 'source_fingerprint_match'
  | 'content_fingerprint_match'
  | 'similar_title_same_domain';

export type DuplicateCandidate = {
  id: string;
  origin: 'canonical source' | 'bibliographic record' | 'review queue' | 'ingestion job';
  matchKind: DuplicateMatchKind;
  confidenceLevel: 'high' | 'medium' | 'low';
  confidenceScore: number;
  title: string;
  url: string;
  canonicalUrl: string;
  domain: string;
  sourceType?: SourceClassification;
  status?: string;
  citationStatus?: string;
  reason: string;
  recommendedAction: 'merge' | 'link as alternate URL' | 'keep separate edition' | 'reject duplicate';
};
