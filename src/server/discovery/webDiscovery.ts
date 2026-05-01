import type {
  DiscoverySearchRequest,
  DiscoverySearchResponse,
  DiscoverySearchResult,
  Source,
} from '../../shared/types.js';
import { researchDataset } from '../../shared/researchData.js';
import { safeFetch } from '../security/safeFetch.js';

const searchEndpoint = 'https://html.duckduckgo.com/html/';
const bingSearchEndpoint = 'https://www.bing.com/search';
const userAgent =
  'Mozilla/5.0 (compatible; AkashicResearchEngine/1.0; research discovery)';
const requestTimeoutMs = 8000;
const maxInspectableBytes = 500_000;

type RawSearchResult = {
  title: string;
  url: string;
  snippet: string;
};

type NormalizedDiscoverySearchRequest = DiscoverySearchRequest & {
  scope: 'combined' | 'engine' | 'web';
  includeTerms: string[];
  excludeTerms: string[];
  domains: string[];
  evidenceGrades: Array<'A' | 'B' | 'C' | 'D' | 'E' | 'F'>;
  sourceIds: string[];
  dateFrom?: number;
  dateTo?: number;
  minRelevance: number;
};

export async function discoverRelatedSources(
  request: DiscoverySearchRequest,
  runtimeSources: Source[] = [],
): Promise<DiscoverySearchResponse> {
  const warnings: string[] = [];
  const query = request.query.trim();
  const normalizedRequest = normalizeRequest(request);
  const maxResults = Math.min(Math.max(normalizedRequest.maxResults, 1), 20);
  const effectiveWebQuery = buildWebQuery(query, normalizedRequest);
  const engineResults =
    normalizedRequest.scope === 'web' ? [] : searchEngineCorpus(normalizedRequest, runtimeSources);
  let webResults: DiscoverySearchResult[] = [];

  if (normalizedRequest.scope !== 'engine') {
    let rawResults = await searchPublicWeb(effectiveWebQuery, maxResults, warnings);
    if (rawResults.length === 0 && effectiveWebQuery !== query) {
      warnings.push('Strict web query returned no results; retried with the base research query.');
      rawResults = await searchPublicWeb(query, maxResults, warnings);
    }

    if (rawResults.length === 0) {
      warnings.push('No public search results were returned for this query.');
    }

    webResults = normalizedRequest.inspectPages
      ? await inspectResults(rawResults, normalizedRequest, warnings)
      : rawResults.map((result, index) => toDiscoveryResult(result, normalizedRequest, index));
  }

  const candidateResults = [...engineResults, ...webResults];
  const filteredResults = candidateResults
    .filter((result) => passesGranularFilters(result, normalizedRequest))
    .filter((result) => result.relevanceScore >= normalizedRequest.minRelevance)
    .sort((first, second) => second.relevanceScore - first.relevanceScore)
    .slice(0, maxResults);

  if (candidateResults.length > 0 && filteredResults.length === 0) {
    warnings.push('Search providers returned candidates, but the active filters removed all matches.');
  }

  return {
    query,
    effectiveWebQuery,
    results: filteredResults,
    warnings,
    summary: {
      engineMatches: filteredResults.filter((result) => result.origin === 'engine').length,
      webMatches: filteredResults.filter((result) => result.origin === 'web').length,
      inspectedPages: filteredResults.filter((result) => result.inspected).length,
    },
  };
}

function normalizeRequest(request: DiscoverySearchRequest): NormalizedDiscoverySearchRequest {
  return {
    ...request,
    scope: request.scope ?? 'combined',
    includeTerms: normalizeTerms(request.includeTerms),
    excludeTerms: normalizeTerms(request.excludeTerms),
    domains: normalizeTerms(request.domains).map((domain) => domain.replace(/^https?:\/\//, '')),
    sourceTypes: request.sourceTypes ?? [],
    evidenceGrades: request.evidenceGrades ?? [],
    sourceIds: request.sourceIds ?? [],
    dateFrom: request.dateFrom,
    dateTo: request.dateTo,
    exactPhrase: request.exactPhrase?.trim(),
    minRelevance: request.minRelevance ?? 0,
  };
}

function normalizeTerms(terms: string[] | undefined): string[] {
  return [...new Set((terms ?? []).map((term) => term.trim()).filter(Boolean))];
}

function buildWebQuery(query: string, request: NormalizedDiscoverySearchRequest): string {
  const parts = [query];

  if (request.exactPhrase) {
    parts.push(`"${request.exactPhrase}"`);
  }

  for (const term of request.includeTerms ?? []) {
    parts.push(term.includes(' ') ? `"${term}"` : term);
  }

  for (const term of request.excludeTerms ?? []) {
    parts.push(`-${term.includes(' ') ? `"${term}"` : term}`);
  }

  for (const domain of request.domains ?? []) {
    parts.push(`site:${domain}`);
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function searchEngineCorpus(
  request: NormalizedDiscoverySearchRequest,
  runtimeSources: Source[],
): DiscoverySearchResult[] {
  const sourceMatches = getSearchableSources(runtimeSources).map((source) => scoreSource(source, request));
  const claimMatches: DiscoverySearchResult[] = researchDataset.claims.map((claim) => {
    const source = researchDataset.sources.find((item) => item.id === claim.sourceId);
    const text = [claim.text, claim.type, claim.notes, source?.title, source?.summary].join(' ');
    const score = scoreText(text, request);

    return {
      id: `engine-claim-${claim.id}`,
      origin: 'engine',
      category: 'claim',
      title: claim.text,
      url: source?.url ?? '',
      domain: source ? getDomain(source.url) : 'engine corpus',
      snippet: claim.notes,
      inspected: true,
      relevanceScore: score.score,
      matchedTerms: score.matchedTerms,
      sourceType: source?.sourceType,
      confidenceLevel: claim.confidenceLevel,
      evidenceGrade: claim.evidenceGrade,
      researchNotes: [
        `Source ID: ${claim.sourceId}`,
        `Claim type: ${claim.type}`,
        claim.citationRequired ? 'Citation required before reuse.' : 'Citation optional by current taxonomy.',
      ],
      discoveredAt: new Date().toISOString(),
    } satisfies DiscoverySearchResult;
  });
  const genealogyMatches: DiscoverySearchResult[] = researchDataset.genealogy.nodes.map((node) => {
    const text = [node.label, node.period, node.category, node.description].join(' ');
    const score = scoreText(text, request);

    return {
      id: `engine-genealogy-${node.id}`,
      origin: 'engine',
      category: 'genealogy',
      title: node.label,
      url: '',
      domain: 'engine corpus',
      snippet: `${node.period}. ${node.description}`,
      inspected: true,
      relevanceScore: score.score,
      matchedTerms: score.matchedTerms,
      confidenceLevel: 'medium',
      researchNotes: [`Genealogy category: ${node.category}`],
      discoveredAt: new Date().toISOString(),
    } satisfies DiscoverySearchResult;
  });
  const genealogyEdgeMatches: DiscoverySearchResult[] = researchDataset.genealogy.edges.map((edge) => {
    const fromNode = researchDataset.genealogy.nodes.find((node) => node.id === edge.from);
    const toNode = researchDataset.genealogy.nodes.find((node) => node.id === edge.to);
    const text = [
      fromNode?.label,
      toNode?.label,
      edge.label,
      edge.relationshipKind,
      edge.confidence,
      edge.sourceIds.join(' '),
      edge.auditNote,
    ].join(' ');
    const score = scoreText(text, request);

    return {
      id: `engine-genealogy-edge-${edge.from}-${edge.to}`,
      origin: 'engine',
      category: 'genealogy',
      title: `${fromNode?.label ?? edge.from} - ${toNode?.label ?? edge.to}`,
      url: '',
      domain: 'engine corpus',
      snippet: `${edge.relationshipKind}. ${edge.label}`,
      inspected: true,
      relevanceScore: score.score,
      matchedTerms: score.matchedTerms,
      confidenceLevel: edge.confidence,
      researchNotes: [`Sources: ${edge.sourceIds.join(', ')}`, edge.auditNote],
      discoveredAt: new Date().toISOString(),
    } satisfies DiscoverySearchResult;
  });

  const peopleMatches: DiscoverySearchResult[] = researchDataset.index.people.map((person) => {
    const score = scoreText(
      [person.name, person.lifespan, person.role, person.summary, person.movementIds.join(' ')].join(' '),
      request,
    );

    return {
      id: `engine-person-${person.id}`,
      origin: 'engine',
      category: 'person',
      title: person.name,
      url: '',
      domain: 'engine corpus',
      snippet: `${person.role}. ${person.summary}`,
      inspected: true,
      relevanceScore: score.score,
      matchedTerms: score.matchedTerms,
      confidenceLevel: 'medium',
      researchNotes: [`Related sources: ${person.sourceIds.join(', ')}`],
      discoveredAt: new Date().toISOString(),
    } satisfies DiscoverySearchResult;
  });
  const movementMatches: DiscoverySearchResult[] = researchDataset.index.movements.map((movement) => {
    const score = scoreText(
      [movement.name, movement.period, movement.classification, movement.summary].join(' '),
      request,
    );

    return {
      id: `engine-movement-${movement.id}`,
      origin: 'engine',
      category: 'movement',
      title: movement.name,
      url: '',
      domain: 'engine corpus',
      snippet: `${movement.period}. ${movement.summary}`,
      inspected: true,
      relevanceScore: score.score,
      matchedTerms: score.matchedTerms,
      sourceType: movement.classification,
      confidenceLevel: 'medium',
      researchNotes: [`Related sources: ${movement.sourceIds.join(', ')}`],
      discoveredAt: new Date().toISOString(),
    } satisfies DiscoverySearchResult;
  });
  const termMatches: DiscoverySearchResult[] = researchDataset.index.terms.map((term) => {
    const score = scoreText(
      [term.term, term.aliases.join(' '), term.tradition, term.definition, term.caution].join(' '),
      request,
    );

    return {
      id: `engine-term-${term.id}`,
      origin: 'engine',
      category: 'term',
      title: term.term,
      url: '',
      domain: 'engine corpus',
      snippet: term.definition,
      inspected: true,
      relevanceScore: score.score,
      matchedTerms: score.matchedTerms,
      confidenceLevel: 'medium',
      researchNotes: [term.caution, `Related sources: ${term.sourceIds.join(', ')}`],
      discoveredAt: new Date().toISOString(),
    } satisfies DiscoverySearchResult;
  });
  const comparativeConceptMatches: DiscoverySearchResult[] = researchDataset.index.comparativeConcepts.map((concept) => {
    const score = scoreText(
      [
        concept.concept,
        concept.tradition,
        concept.relationshipToAkashicResearch,
        concept.summary,
        concept.boundaryNote,
      ].join(' '),
      request,
    );

    return {
      id: `engine-comparative-${concept.id}`,
      origin: 'engine',
      category: 'comparative concept',
      title: concept.concept,
      url: '',
      domain: 'engine corpus',
      snippet: concept.summary,
      inspected: true,
      relevanceScore: score.score,
      matchedTerms: score.matchedTerms,
      confidenceLevel: concept.confidenceLevel,
      researchNotes: [
        `Relationship: ${concept.relationshipToAkashicResearch}`,
        concept.boundaryNote,
        `Related sources: ${concept.sourceIds.join(', ')}`,
      ],
      discoveredAt: new Date().toISOString(),
    } satisfies DiscoverySearchResult;
  });
  const timelineMatches: DiscoverySearchResult[] = researchDataset.index.timeline.map((event) => {
    const score = scoreText([event.date, event.title, event.summary, event.entityIds.join(' ')].join(' '), request);

    return {
      id: `engine-timeline-${event.id}`,
      origin: 'engine',
      category: 'timeline',
      title: event.title,
      url: '',
      domain: 'engine corpus',
      snippet: `${event.date}. ${event.summary}`,
      inspected: true,
      relevanceScore: score.score,
      matchedTerms: score.matchedTerms,
      confidenceLevel: event.confidenceLevel,
      researchNotes: [`Related sources: ${event.sourceIds.join(', ')}`],
      discoveredAt: new Date().toISOString(),
    } satisfies DiscoverySearchResult;
  });
  const bibliographyMatches: DiscoverySearchResult[] = researchDataset.index.bibliography.map((record) => {
    const source = researchDataset.sources.find((item) => item.id === record.sourceId);
    const score = scoreText(
      [
        record.title,
        record.author,
        record.publicationDate,
        record.editionNotes,
        record.publisher,
        record.rightsStatus,
        record.sourceClassification,
        record.citationStatus,
        record.accessType,
        record.reviewStatus,
        record.stableCitation,
        record.pageReference,
        record.auditNote,
        source?.summary,
      ].join(' '),
      request,
    );

    return {
      id: `engine-bibliography-${record.id}`,
      origin: 'engine',
      category: 'bibliography',
      title: record.title,
      url: record.archiveUrl,
      domain: getDomain(record.archiveUrl),
      snippet: record.stableCitation,
      inspected: true,
      relevanceScore: score.score,
      matchedTerms: score.matchedTerms,
      sourceType: source?.sourceType,
      confidenceLevel: source?.confidenceLevel ?? 'medium',
      researchNotes: [
        `Source ID: ${record.sourceId}`,
        `Publisher: ${record.publisher}`,
        record.editionNotes,
        record.pageReference,
        `Rights status: ${record.rightsStatus}`,
        `Citation status: ${record.citationStatus}`,
        `Access: ${record.accessType}`,
        `Review status: ${record.reviewStatus}`,
        record.auditNote,
      ],
      discoveredAt: new Date().toISOString(),
    } satisfies DiscoverySearchResult;
  });

  return [
    ...sourceMatches,
    ...claimMatches,
    ...genealogyMatches,
    ...genealogyEdgeMatches,
    ...peopleMatches,
    ...movementMatches,
    ...termMatches,
    ...comparativeConceptMatches,
    ...timelineMatches,
    ...bibliographyMatches,
  ].filter((result) => {
    if (result.relevanceScore <= 0) {
      return false;
    }

    return true;
  });
}

function getSearchableSources(runtimeSources: Source[]): Source[] {
  const sourcesByUrl = new Map<string, Source>();
  for (const source of [...researchDataset.sources, ...runtimeSources]) {
    sourcesByUrl.set(source.canonicalUrl ?? source.url, source);
  }

  return [...sourcesByUrl.values()];
}

function scoreSource(source: Source, request: NormalizedDiscoverySearchRequest): DiscoverySearchResult {
  const text = [source.title, source.author, source.date, source.sourceType, source.summary, source.citationNotes].join(
    ' ',
  );
  const score = scoreText(text, request);

  return {
    id: `engine-source-${source.id}`,
    origin: 'engine',
    category: 'source',
    title: source.title,
    url: source.url,
    domain: getDomain(source.url),
    snippet: source.summary,
    inspected: true,
    relevanceScore: score.score,
    matchedTerms: score.matchedTerms,
    sourceType: source.sourceType,
    confidenceLevel: source.confidenceLevel,
    researchNotes: [`Source ID: ${source.id}`, source.citationNotes, `Author/date: ${source.author}, ${source.date}`],
    discoveredAt: new Date().toISOString(),
  };
}

async function searchPublicWeb(
  query: string,
  maxResults: number,
  warnings: string[],
): Promise<RawSearchResult[]> {
  const providerResults = await Promise.allSettled([
    searchDuckDuckGo(query, maxResults),
    searchBing(query, maxResults),
  ]);
  const results: RawSearchResult[] = [];

  for (const providerResult of providerResults) {
    if (providerResult.status === 'fulfilled') {
      results.push(...providerResult.value);
    } else {
      warnings.push(
        `A search provider failed: ${
          providerResult.reason instanceof Error ? providerResult.reason.message : 'unknown error'
        }`,
      );
    }
  }

  return dedupeResults(results).slice(0, maxResults);
}

async function searchDuckDuckGo(query: string, maxResults: number): Promise<RawSearchResult[]> {
  const body = new URLSearchParams({ q: query });
  const response = await fetchWithTimeout(searchEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': userAgent,
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Search provider returned HTTP ${response.status}.`);
  }

  const html = await response.text();
  if (html.includes('anomaly.js') || html.includes('challenge-form')) {
    return [];
  }

  return parseDuckDuckGoResults(html).slice(0, maxResults);
}

async function searchBing(query: string, maxResults: number): Promise<RawSearchResult[]> {
  const url = new URL(bingSearchEndpoint);
  url.searchParams.set('q', query);

  const response = await fetchWithTimeout(url.href, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': userAgent,
    },
  });

  if (!response.ok) {
    throw new Error(`Bing returned HTTP ${response.status}.`);
  }

  const html = await response.text();
  return parseBingResults(html).slice(0, maxResults);
}

async function inspectResults(
  rawResults: RawSearchResult[],
  request: NormalizedDiscoverySearchRequest,
  warnings: string[],
): Promise<DiscoverySearchResult[]> {
  const inspected: DiscoverySearchResult[] = [];

  for (const [index, result] of rawResults.entries()) {
    try {
      inspected.push(await inspectResult(result, request, index));
    } catch (error) {
      warnings.push(
        `Could not inspect ${getDomain(result.url)}: ${
          error instanceof Error ? error.message : 'page fetch failed'
        }`,
      );
      inspected.push(toDiscoveryResult(result, request, index));
    }
  }

  return inspected;
}

async function inspectResult(
  result: RawSearchResult,
  request: NormalizedDiscoverySearchRequest,
  index: number,
): Promise<DiscoverySearchResult> {
  const response = await fetchWithTimeout(result.url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': userAgent,
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html')) {
    return toDiscoveryResult(result, request, index, { inspected: true });
  }

  const html = await readLimitedText(response);
  const visibleText = extractVisibleText(html);

  return toDiscoveryResult(result, request, index, {
    inspected: true,
    pageTitle: extractTagContent(html, 'title'),
    pageDescription: extractMetaContent(html, 'description'),
    pageExcerpt: visibleText.slice(0, 700),
  });
}

function parseDuckDuckGoResults(html: string): RawSearchResult[] {
  const results: RawSearchResult[] = [];
  const resultPattern = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
  const fallbackPattern = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = resultPattern.exec(html)) !== null) {
    results.push({
      title: cleanHtml(match[2]),
      url: normalizeDuckDuckGoUrl(decodeHtml(match[1])),
      snippet: cleanHtml(match[3]),
    });
  }

  if (results.length > 0) {
    return dedupeResults(results);
  }

  while ((match = fallbackPattern.exec(html)) !== null) {
    results.push({
      title: cleanHtml(match[2]),
      url: normalizeDuckDuckGoUrl(decodeHtml(match[1])),
      snippet: '',
    });
  }

  return dedupeResults(results);
}

function parseBingResults(html: string): RawSearchResult[] {
  const results: RawSearchResult[] = [];
  const resultPattern = /<li[^>]+class="b_algo"[\s\S]*?<h2[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:<p[^>]*>([\s\S]*?)<\/p>)?/gi;
  let match: RegExpExecArray | null;

  while ((match = resultPattern.exec(html)) !== null) {
    const url = decodeHtml(match[1]);
    if (!url.startsWith('http')) {
      continue;
    }

    results.push({
      title: cleanHtml(match[2]),
      url,
      snippet: cleanHtml(match[3] ?? ''),
    });
  }

  return dedupeResults(results);
}

function dedupeResults(results: RawSearchResult[]): RawSearchResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    if (!result.url || seen.has(result.url)) {
      return false;
    }

    seen.add(result.url);
    return true;
  });
}

function normalizeDuckDuckGoUrl(url: string): string {
  try {
    const parsed = new URL(url, searchEndpoint);
    const redirectedUrl = parsed.searchParams.get('uddg');
    return redirectedUrl ? decodeURIComponent(redirectedUrl) : parsed.href;
  } catch {
    return url;
  }
}

function toDiscoveryResult(
  result: RawSearchResult,
  request: NormalizedDiscoverySearchRequest,
  index: number,
  inspectedData: Partial<DiscoverySearchResult> = {},
): DiscoverySearchResult {
  const scoringText = [
    result.title,
    result.snippet,
    inspectedData.pageTitle,
    inspectedData.pageDescription,
    inspectedData.pageExcerpt,
    result.url,
  ].join(' ');
  const score = scoreText(scoringText, request);
  const sourceType = classifyWebResult(result, inspectedData);

  return {
    id: `web-${index}-${slugify(result.url)}`,
    origin: 'web',
    category: 'webpage',
    title: result.title,
    url: result.url,
    domain: getDomain(result.url),
    snippet: result.snippet,
    inspected: false,
    relevanceScore: score.score + Math.max(0, 12 - index),
    matchedTerms: score.matchedTerms,
    sourceType,
    confidenceLevel: inferConfidenceLevel(sourceType),
    researchNotes: buildResearchNotes(result, sourceType),
    discoveredAt: new Date().toISOString(),
    ...inspectedData,
  };
}

function scoreText(
  text: string,
  request: NormalizedDiscoverySearchRequest,
): { score: number; matchedTerms: string[] } {
  const normalizedText = text.toLocaleLowerCase();
  const queryTerms = tokenize(request.query);
  const includeTerms = request.includeTerms ?? [];
  const excludeTerms = request.excludeTerms ?? [];
  const matchedTerms = new Set<string>();
  let score = 0;

  for (const term of queryTerms) {
    if (normalizedText.includes(term.toLocaleLowerCase())) {
      score += 10;
      matchedTerms.add(term);
    }
  }

  for (const term of includeTerms) {
    if (normalizedText.includes(term.toLocaleLowerCase())) {
      score += 14;
      matchedTerms.add(term);
    } else {
      score -= 10;
    }
  }

  if (request.exactPhrase && normalizedText.includes(request.exactPhrase.toLocaleLowerCase())) {
    score += 30;
    matchedTerms.add(request.exactPhrase);
  }

  for (const term of excludeTerms) {
    if (normalizedText.includes(term.toLocaleLowerCase())) {
      score -= 50;
    }
  }

  return { score: Math.max(0, score), matchedTerms: [...matchedTerms] };
}

function passesGranularFilters(
  result: DiscoverySearchResult,
  request: NormalizedDiscoverySearchRequest,
): boolean {
  const searchableText = [
    result.title,
    result.snippet,
    result.pageTitle,
    result.pageDescription,
    result.pageExcerpt,
    result.url,
    result.domain,
    result.researchNotes.join(' '),
  ]
    .join(' ')
    .toLocaleLowerCase();

  if (request.sourceTypes?.length && !result.sourceType) {
    return false;
  }

  if (request.sourceTypes?.length && result.sourceType && !request.sourceTypes.includes(result.sourceType)) {
    return false;
  }

  if (request.evidenceGrades.length && result.category !== 'claim') {
    return false;
  }

  if (request.evidenceGrades.length && result.evidenceGrade && !request.evidenceGrades.includes(result.evidenceGrade)) {
    return false;
  }

  if (request.sourceIds.length && !request.sourceIds.some((sourceId) => searchableText.includes(sourceId))) {
    return false;
  }

  if ((request.dateFrom !== undefined || request.dateTo !== undefined) && !matchesDateRange(searchableText, request)) {
    return false;
  }

  if (request.includeTerms.some((term) => !searchableText.includes(term.toLocaleLowerCase()))) {
    return false;
  }

  if (request.excludeTerms.some((term) => searchableText.includes(term.toLocaleLowerCase()))) {
    return false;
  }

  if (request.exactPhrase && !searchableText.includes(request.exactPhrase.toLocaleLowerCase())) {
    return false;
  }

  return true;
}

function matchesDateRange(text: string, request: NormalizedDiscoverySearchRequest): boolean {
  const years = extractYears(text);
  if (years.length === 0) {
    return false;
  }

  const from = request.dateFrom ?? Number.NEGATIVE_INFINITY;
  const to = request.dateTo ?? Number.POSITIVE_INFINITY;
  return years.some((year) => year >= from && year <= to);
}

function extractYears(text: string): number[] {
  return [...text.matchAll(/\b(1[0-9]{3}|20[0-9]{2}|21[0-9]{2})\b/g)].map((match) =>
    Number.parseInt(match[1], 10),
  );
}

function tokenize(value: string): string[] {
  return [...new Set(value.toLocaleLowerCase().match(/[a-z0-9]{3,}/g) ?? [])];
}

function classifyWebResult(
  result: RawSearchResult,
  inspectedData: Partial<DiscoverySearchResult>,
): DiscoverySearchResult['sourceType'] {
  const text = [result.title, result.snippet, inspectedData.pageTitle, inspectedData.pageDescription, result.url]
    .join(' ')
    .toLocaleLowerCase();
  const domain = getDomain(result.url);

  if (domain.endsWith('.edu') || text.includes('journal') || text.includes('university')) {
    return 'academic';
  }

  if (text.includes('archive') || text.includes('history') || text.includes('historical')) {
    return 'historical';
  }

  if (text.includes('theosophy') || text.includes('anthroposophy') || text.includes('steiner')) {
    return 'primary esoteric';
  }

  if (text.includes('course') || text.includes('session') || text.includes('healing') || text.includes('reading')) {
    return 'modern spiritual';
  }

  if (text.includes('buy') || text.includes('shop') || text.includes('price')) {
    return 'commercial';
  }

  return 'speculative';
}

function inferConfidenceLevel(sourceType: DiscoverySearchResult['sourceType']): DiscoverySearchResult['confidenceLevel'] {
  if (sourceType === 'academic' || sourceType === 'historical' || sourceType === 'primary esoteric') {
    return 'medium';
  }

  if (sourceType === 'commercial' || sourceType === 'low-quality') {
    return 'low';
  }

  return 'medium';
}

function buildResearchNotes(
  result: RawSearchResult,
  sourceType: DiscoverySearchResult['sourceType'],
): string[] {
  const notes = [`Preliminary classification: ${sourceType ?? 'unclassified'}.`];

  if (sourceType === 'commercial') {
    notes.push('Treat promotional claims cautiously and corroborate with independent sources.');
  }

  if (sourceType === 'academic' || sourceType === 'historical') {
    notes.push('Review citations and publication context before adding claims to the corpus.');
  }

  if (!result.snippet) {
    notes.push('Search provider did not return a snippet; inspect the page before using it.');
  }

  return notes;
}

function slugify(value: string): string {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

async function fetchWithTimeout(input: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    return await safeFetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function readLimitedText(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    return response.text();
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (totalBytes < maxInspectableBytes) {
    const { done, value } = await reader.read();
    if (done || !value) {
      break;
    }

    chunks.push(value);
    totalBytes += value.byteLength;
  }

  return new TextDecoder().decode(concatChunks(chunks, Math.min(totalBytes, maxInspectableBytes)));
}

function concatChunks(chunks: Uint8Array[], byteLength: number): Uint8Array {
  const merged = new Uint8Array(byteLength);
  let offset = 0;

  for (const chunk of chunks) {
    const remaining = byteLength - offset;
    if (remaining <= 0) {
      break;
    }

    merged.set(chunk.slice(0, remaining), offset);
    offset += Math.min(chunk.byteLength, remaining);
  }

  return merged;
}

function extractVisibleText(html: string): string {
  return cleanHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' '),
  );
}

function extractTagContent(html: string, tagName: string): string | undefined {
  const pattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = pattern.exec(html);
  return match ? cleanHtml(match[1]) : undefined;
}

function extractMetaContent(html: string, name: string): string | undefined {
  const pattern = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    'i',
  );
  const reversePattern = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["'][^>]*>`,
    'i',
  );
  const match = pattern.exec(html) ?? reversePattern.exec(html);
  return match ? cleanHtml(match[1]) : undefined;
}

function cleanHtml(value: string): string {
  return decodeHtml(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown domain';
  }
}
