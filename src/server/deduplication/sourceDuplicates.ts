import { createHash } from 'node:crypto';
import { researchDataset } from '../../shared/researchData.js';
import type {
  BibliographicRecord,
  Claim,
  DuplicateCandidate,
  DuplicateMatchKind,
  IngestionJob,
  ReviewQueueItem,
  Source,
} from '../../shared/types.js';

type DuplicateInput = {
  url: string;
  title: string;
  author?: string;
  date?: string;
  domain?: string;
  textExcerpt?: string;
  sourceFingerprint?: string;
  contentFingerprint?: string;
};

type DuplicateCollections = {
  reviewQueue?: ReviewQueueItem[];
  ingestionJobs?: IngestionJob[];
};

type CandidateRecord = {
  id: string;
  origin: DuplicateCandidate['origin'];
  title: string;
  url: string;
  canonicalUrl: string;
  domain: string;
  author?: string;
  date?: string;
  sourceFingerprint?: string;
  contentFingerprint?: string;
  sourceType?: DuplicateCandidate['sourceType'];
  status?: string;
  citationStatus?: string;
};

const trackingParameterPatterns = [/^utm_/i, /^mc_/i];
const trackingParameters = new Set([
  'fbclid',
  'gclid',
  'gbraid',
  'wbraid',
  'igshid',
  'ref',
  'ref_src',
  'spm',
  'src',
  'cmpid',
  'campaign',
]);

export function normalizeSourceUrl(value: string): string {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);

  const archivedUrl = getArchivedSnapshotUrl(parsed);
  if (archivedUrl && archivedUrl !== parsed.href) {
    return normalizeSourceUrl(archivedUrl);
  }

  const protocol = parsed.protocol === 'http:' ? 'https:' : parsed.protocol;
  const hostname = parsed.hostname.toLocaleLowerCase().replace(/^www\./, '');
  const port = parsed.port && !isDefaultPort(protocol, parsed.port) ? `:${parsed.port}` : '';
  let pathname = parsed.pathname.replace(/\/{2,}/g, '/');

  if (pathname !== '/') {
    pathname = pathname.replace(/\/(?:index|default)\.(?:html?|aspx?)$/i, '/').replace(/\/+$/, '');
  }

  const query = normalizeSearchParams(parsed.searchParams);
  return `${protocol}//${hostname}${port}${pathname || '/'}${query}`;
}

export function getSourceDomain(url: string): string {
  try {
    return new URL(normalizeSourceUrl(url)).hostname;
  } catch {
    return 'unknown domain';
  }
}

export function createSourceFingerprint(input: DuplicateInput): string {
  const year = extractYear(input.date ?? '');
  const domain = input.domain || getSourceDomain(input.url);
  const parts = [
    normalizeIdentityText(input.title),
    normalizeIdentityText(input.author ?? ''),
    year,
    normalizeIdentityText(domain),
  ];

  return `source:${hash(parts.join('|'))}`;
}

export function createContentFingerprint(text: string): string | undefined {
  const normalized = normalizeIdentityText(text);
  if (normalized.length < 120) {
    return undefined;
  }

  return `content:${hash(normalized.slice(0, 20_000))}`;
}

export function normalizeClaimText(value: string): string {
  return normalizeIdentityText(value);
}

export function createClaimFingerprint(claim: Pick<Claim, 'text' | 'type'>): string {
  return `claim:${hash(`${normalizeClaimText(claim.text)}|${claim.type}`)}`;
}

export function findDuplicateClaimCandidates(claim: Pick<Claim, 'text' | 'type'>): Claim[] {
  const fingerprint = createClaimFingerprint(claim);
  const normalizedText = normalizeClaimText(claim.text);

  return researchDataset.claims.filter((existingClaim) => {
    const existingFingerprint =
      existingClaim.claimFingerprint ??
      createClaimFingerprint({
        text: existingClaim.text,
        type: existingClaim.type,
      });

    if (existingFingerprint === fingerprint) {
      return true;
    }

    return tokenSimilarity(normalizedText, normalizeClaimText(existingClaim.text)) >= 0.86;
  });
}

export function findDuplicateSourceCandidates(
  input: DuplicateInput,
  collections: DuplicateCollections = {},
): DuplicateCandidate[] {
  const canonicalUrl = normalizeSourceUrl(input.url);
  const sourceFingerprint = input.sourceFingerprint ?? createSourceFingerprint({ ...input, url: canonicalUrl });
  const contentFingerprint = input.contentFingerprint ?? createContentFingerprint(input.textExcerpt ?? '');
  const inputTitle = normalizeIdentityText(input.title);
  const inputDomain = input.domain || getSourceDomain(canonicalUrl);
  const records = buildCandidateRecords(collections);
  const candidatesById = new Map<string, DuplicateCandidate>();

  for (const record of records) {
    const candidateId = `${record.origin}:${record.id}`;
    const matches = getCandidateMatches({
      input,
      canonicalUrl,
      sourceFingerprint,
      contentFingerprint,
      inputTitle,
      inputDomain,
      record,
    });

    for (const match of matches) {
      const current = candidatesById.get(candidateId);
      if (!current || match.confidenceScore > current.confidenceScore) {
        candidatesById.set(candidateId, toDuplicateCandidate(record, match));
      }
    }
  }

  return [...candidatesById.values()]
    .sort((first, second) => second.confidenceScore - first.confidenceScore)
    .slice(0, 8);
}

function buildCandidateRecords(collections: DuplicateCollections): CandidateRecord[] {
  return [
    ...researchDataset.sources.flatMap((source) => safeCandidate(() => sourceToCandidate(source))),
    ...researchDataset.index.bibliography.flatMap((record) => safeCandidate(() => bibliographyToCandidate(record))),
    ...(collections.reviewQueue ?? []).flatMap((item) => safeCandidate(() => reviewQueueToCandidate(item))),
    ...(collections.ingestionJobs ?? []).flatMap((job) => safeCandidate(() => ingestionJobToCandidate(job))),
  ];
}

function sourceToCandidate(source: Source): CandidateRecord {
  const canonicalUrl = source.canonicalUrl ?? normalizeSourceUrl(source.url);

  return {
    id: source.id,
    origin: 'canonical source',
    title: source.title,
    url: source.url,
    canonicalUrl,
    domain: getSourceDomain(source.url),
    author: source.author,
    date: source.date,
    sourceFingerprint: source.sourceFingerprint ?? createSourceFingerprint({ ...source, url: canonicalUrl }),
    sourceType: source.sourceType,
    status: source.confidenceLevel,
  };
}

function bibliographyToCandidate(record: BibliographicRecord): CandidateRecord {
  const canonicalUrl = normalizeSourceUrl(record.archiveUrl);

  return {
    id: record.id,
    origin: 'bibliographic record',
    title: record.title,
    url: record.archiveUrl,
    canonicalUrl,
    domain: getSourceDomain(record.archiveUrl),
    author: record.author,
    date: record.publicationDate,
    sourceFingerprint: createSourceFingerprint({
      title: record.title,
      author: record.author,
      date: record.publicationDate,
      url: canonicalUrl,
    }),
    sourceType: record.sourceClassification,
    status: record.reviewStatus,
    citationStatus: record.citationStatus,
  };
}

function reviewQueueToCandidate(item: ReviewQueueItem): CandidateRecord {
  const canonicalUrl = item.canonicalUrl ?? normalizeSourceUrl(item.url);

  return {
    id: item.id,
    origin: 'review queue',
    title: item.title,
    url: item.url,
    canonicalUrl,
    domain: item.domain || getSourceDomain(item.url),
    author: item.author,
    date: item.publicationDate,
    sourceFingerprint:
      item.sourceFingerprint ??
      createSourceFingerprint({
        title: item.title,
        author: item.author,
        date: item.publicationDate,
        url: canonicalUrl,
        domain: item.domain,
      }),
    sourceType: item.proposedSourceType,
    status: item.status,
  };
}

function ingestionJobToCandidate(job: IngestionJob): CandidateRecord {
  const canonicalUrl = job.canonicalUrl ?? normalizeSourceUrl(job.url);

  return {
    id: job.id,
    origin: 'ingestion job',
    title: job.title,
    url: job.url,
    canonicalUrl,
    domain: job.domain || getSourceDomain(job.url),
    sourceFingerprint:
      job.sourceFingerprint ??
      createSourceFingerprint({
        title: job.title,
        url: canonicalUrl,
        domain: job.domain,
      }),
    sourceType: job.sourceType,
    status: job.status,
    citationStatus: job.citationStatus,
  };
}

function safeCandidate(build: () => CandidateRecord): CandidateRecord[] {
  try {
    const candidate = build();
    return candidate.url ? [candidate] : [];
  } catch {
    return [];
  }
}

function getCandidateMatches(input: {
  input: DuplicateInput;
  canonicalUrl: string;
  sourceFingerprint: string;
  contentFingerprint?: string;
  inputTitle: string;
  inputDomain: string;
  record: CandidateRecord;
}): Array<{
  matchKind: DuplicateMatchKind;
  confidenceScore: number;
  reason: string;
  recommendedAction: DuplicateCandidate['recommendedAction'];
}> {
  const matches: Array<{
    matchKind: DuplicateMatchKind;
    confidenceScore: number;
    reason: string;
    recommendedAction: DuplicateCandidate['recommendedAction'];
  }> = [];

  if (input.record.url.trim().toLocaleLowerCase() === input.input.url.trim().toLocaleLowerCase()) {
    matches.push({
      matchKind: 'exact_url_match',
      confidenceScore: 100,
      reason: 'Incoming URL is already present.',
      recommendedAction: 'reject duplicate',
    });
  }

  if (input.record.canonicalUrl === input.canonicalUrl) {
    matches.push({
      matchKind: 'canonical_url_match',
      confidenceScore: 96,
      reason: 'Incoming URL normalizes to an existing canonical URL.',
      recommendedAction: 'link as alternate URL',
    });
  }

  if (input.record.sourceFingerprint === input.sourceFingerprint) {
    matches.push({
      matchKind: 'source_fingerprint_match',
      confidenceScore: 88,
      reason: 'Title, author/date, and domain fingerprint matches an existing record.',
      recommendedAction: 'keep separate edition',
    });
  }

  if (input.contentFingerprint && input.record.contentFingerprint === input.contentFingerprint) {
    matches.push({
      matchKind: 'content_fingerprint_match',
      confidenceScore: 94,
      reason: 'Extracted text fingerprint matches an existing record.',
      recommendedAction: 'merge',
    });
  }

  const titleSimilarity = tokenSimilarity(input.inputTitle, normalizeIdentityText(input.record.title));
  if (titleSimilarity >= 0.72 && input.record.domain === input.inputDomain) {
    matches.push({
      matchKind: 'similar_title_same_domain',
      confidenceScore: Math.round(62 + titleSimilarity * 20),
      reason: 'Title is very similar on the same domain.',
      recommendedAction: 'keep separate edition',
    });
  }

  return matches;
}

function toDuplicateCandidate(
  record: CandidateRecord,
  match: {
    matchKind: DuplicateMatchKind;
    confidenceScore: number;
    reason: string;
    recommendedAction: DuplicateCandidate['recommendedAction'];
  },
): DuplicateCandidate {
  return {
    id: `${record.origin}:${record.id}`,
    origin: record.origin,
    matchKind: match.matchKind,
    confidenceLevel: match.confidenceScore >= 90 ? 'high' : match.confidenceScore >= 75 ? 'medium' : 'low',
    confidenceScore: match.confidenceScore,
    title: record.title,
    url: record.url,
    canonicalUrl: record.canonicalUrl,
    domain: record.domain,
    sourceType: record.sourceType,
    status: record.status,
    citationStatus: record.citationStatus,
    reason: match.reason,
    recommendedAction: match.recommendedAction,
  };
}

function normalizeSearchParams(searchParams: URLSearchParams): string {
  const filteredEntries = [...searchParams.entries()]
    .filter(([key]) => !isTrackingParameter(key))
    .sort(([firstKey, firstValue], [secondKey, secondValue]) =>
      `${firstKey}=${firstValue}`.localeCompare(`${secondKey}=${secondValue}`),
    );

  if (filteredEntries.length === 0) {
    return '';
  }

  const normalized = new URLSearchParams();
  for (const [key, value] of filteredEntries) {
    normalized.append(key, value);
  }

  return `?${normalized.toString()}`;
}

function isTrackingParameter(key: string): boolean {
  return trackingParameters.has(key.toLocaleLowerCase()) || trackingParameterPatterns.some((pattern) => pattern.test(key));
}

function getArchivedSnapshotUrl(url: URL): string | undefined {
  if (url.hostname.toLocaleLowerCase().replace(/^www\./, '') !== 'web.archive.org') {
    return undefined;
  }

  const match = /^\/web\/[^/]+\/(https?:\/\/.+)$/i.exec(url.pathname);
  return match ? decodeURIComponent(match[1]) : undefined;
}

function isDefaultPort(protocol: string, port: string): boolean {
  return (protocol === 'https:' && port === '443') || (protocol === 'http:' && port === '80');
}

function extractYear(value: string): string {
  return /\b(1[0-9]{3}|20[0-9]{2}|21[0-9]{2})\b/.exec(value)?.[0] ?? '';
}

function normalizeIdentityText(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(the|a|an|of|and|in|on|for|with|by)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSimilarity(first: string, second: string): number {
  const firstTokens = new Set(first.split(' ').filter((token) => token.length >= 3));
  const secondTokens = new Set(second.split(' ').filter((token) => token.length >= 3));

  if (firstTokens.size === 0 || secondTokens.size === 0) {
    return 0;
  }

  const intersection = [...firstTokens].filter((token) => secondTokens.has(token)).length;
  const union = new Set([...firstTokens, ...secondTokens]).size;
  return intersection / union;
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 24);
}
