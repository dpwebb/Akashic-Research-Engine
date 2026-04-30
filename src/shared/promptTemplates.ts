export const promptTemplates = [
  {
    id: 'source-summary',
    name: 'Source summary',
    purpose: 'Summarize a source without converting its claims into facts.',
    template:
      'Summarize the cited source. Separate documented bibliographic facts, the author’s claims, interpretive context, and uncertainty. Do not state metaphysical claims as empirically proven.',
  },
  {
    id: 'claim-comparison',
    name: 'Claim comparison',
    purpose: 'Compare claims across sources with evidence labels.',
    template:
      'Compare these claims by source, claim type, evidence grade, and citation strength. Identify agreement, contradiction, and category errors.',
  },
  {
    id: 'contradiction-report',
    name: 'Contradiction report',
    purpose: 'Find conflicts between historical, metaphysical, experiential, and speculative claims.',
    template:
      'Produce a contradiction report. Separate direct factual conflicts from differences in interpretation, testimony, and speculative framing.',
  },
  {
    id: 'realistic-addition',
    name: 'Realistic Addition Builder',
    purpose: 'Generate disciplined speculative additions.',
    template:
      'Generate a new interpretation clearly marked SPECULATIVE. Include citations needed, boundaries, counterarguments, and what would not be justified to claim.',
  },
];
