export const sourceClassifications = [
  'primary esoteric',
  'academic',
  'historical',
  'religious/comparative',
  'modern spiritual',
  'speculative',
  'commercial',
  'low-quality',
] as const;

export const claimTypes = [
  'historical claim',
  'metaphysical claim',
  'experiential claim',
  'symbolic interpretation',
  'psychological interpretation',
  'speculative hypothesis',
] as const;

export const evidenceGrades = [
  { grade: 'A', label: 'historically documented', requiresCitation: true },
  { grade: 'B', label: 'well-supported textual interpretation', requiresCitation: true },
  { grade: 'C', label: 'plausible comparative interpretation', requiresCitation: true },
  { grade: 'D', label: 'subjective or experiential claim', requiresCitation: true },
  { grade: 'E', label: 'speculative hypothesis', requiresCitation: false },
  { grade: 'F', label: 'unsupported or promotional claim', requiresCitation: false },
] as const;

export const guardrailRules = [
  'Do not claim the Akashic Records are empirically proven.',
  'Do not ridicule or dismiss the subject.',
  'Separate belief, history, interpretation, testimony, and speculation.',
  'Require citations for factual claims.',
  'Mark AI-generated theories and additions as speculative.',
] as const;

export type SourceClassification = (typeof sourceClassifications)[number];
export type ClaimType = (typeof claimTypes)[number];
export type EvidenceGrade = (typeof evidenceGrades)[number]['grade'];
