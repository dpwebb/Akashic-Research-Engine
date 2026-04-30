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
  minRelevance?: number;
};

export type DiscoverySearchResult = {
  id: string;
  origin: 'engine' | 'web';
  category: 'source' | 'claim' | 'genealogy' | 'webpage';
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
