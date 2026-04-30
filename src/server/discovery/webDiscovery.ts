import type {
  DiscoverySearchRequest,
  DiscoverySearchResponse,
  DiscoverySearchResult,
  Source,
} from '../../shared/types.js';
import { researchDataset } from '../../shared/researchData.js';

const searchEndpoint = 'https://html.duckduckgo.com/html/';
const userAgent =
  'AkashicResearchEngine/1.0 (+https://github.com; research discovery; contact site owner for crawl concerns)';
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
  minRelevance: number;
};

export async function discoverRelatedSources(
  request: DiscoverySearchRequest,
): Promise<DiscoverySearchResponse> {
  const warnings: string[] = [];
  const query = request.query.trim();
  const normalizedRequest = normalizeRequest(request);
  const maxResults = Math.min(Math.max(normalizedRequest.maxResults, 1), 20);
  const effectiveWebQuery = buildWebQuery(query, normalizedRequest);
  const engineResults =
    normalizedRequest.scope === 'web' ? [] : searchEngineCorpus(normalizedRequest);
  let webResults: DiscoverySearchResult[] = [];

  if (normalizedRequest.scope !== 'engine') {
    const rawResults = await searchDuckDuckGo(effectiveWebQuery, maxResults);
    if (rawResults.length === 0) {
      warnings.push('No public search results were returned for this query.');
    }

    webResults = normalizedRequest.inspectPages
      ? await inspectResults(rawResults, normalizedRequest, warnings)
      : rawResults.map((result, index) => toDiscoveryResult(result, normalizedRequest, index));
  }

  const filteredResults = [...engineResults, ...webResults]
    .filter((result) => passesGranularFilters(result, normalizedRequest))
    .filter((result) => result.relevanceScore >= normalizedRequest.minRelevance)
    .sort((first, second) => second.relevanceScore - first.relevanceScore)
    .slice(0, maxResults);

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

function searchEngineCorpus(request: NormalizedDiscoverySearchRequest): DiscoverySearchResult[] {
  const sourceMatches = researchDataset.sources.map((source) => scoreSource(source, request));
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

  return [...sourceMatches, ...claimMatches, ...genealogyMatches].filter((result) => {
    if (result.relevanceScore <= 0) {
      return false;
    }

    return true;
  });
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
    researchNotes: [source.citationNotes, `Author/date: ${source.author}, ${source.date}`],
    discoveredAt: new Date().toISOString(),
  };
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
  return parseDuckDuckGoResults(html).slice(0, maxResults);
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
    return await fetch(input, { ...init, signal: controller.signal });
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
