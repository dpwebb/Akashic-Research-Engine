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
