import type {
  DiscoverySearchRequest,
  DiscoverySearchResponse,
  DiscoverySearchResult,
} from '../../shared/types.js';

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

export async function discoverRelatedSources(
  request: DiscoverySearchRequest,
): Promise<DiscoverySearchResponse> {
  const warnings: string[] = [];
  const query = request.query.trim();
  const maxResults = Math.min(Math.max(request.maxResults, 1), 12);

  const rawResults = await searchDuckDuckGo(query, maxResults);
  if (rawResults.length === 0) {
    warnings.push('No public search results were returned for this query.');
  }

  const results = request.inspectPages
    ? await inspectResults(rawResults, warnings)
    : rawResults.map((result) => toDiscoveryResult(result));

  return {
    query,
    results,
    warnings,
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
  warnings: string[],
): Promise<DiscoverySearchResult[]> {
  const inspected: DiscoverySearchResult[] = [];

  for (const result of rawResults) {
    try {
      inspected.push(await inspectResult(result));
    } catch (error) {
      warnings.push(
        `Could not inspect ${getDomain(result.url)}: ${
          error instanceof Error ? error.message : 'page fetch failed'
        }`,
      );
      inspected.push(toDiscoveryResult(result));
    }
  }

  return inspected;
}

async function inspectResult(result: RawSearchResult): Promise<DiscoverySearchResult> {
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
    return toDiscoveryResult(result, { inspected: true });
  }

  const html = await readLimitedText(response);
  const visibleText = extractVisibleText(html);

  return toDiscoveryResult(result, {
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
  inspectedData: Partial<DiscoverySearchResult> = {},
): DiscoverySearchResult {
  return {
    title: result.title,
    url: result.url,
    domain: getDomain(result.url),
    snippet: result.snippet,
    inspected: false,
    discoveredAt: new Date().toISOString(),
    ...inspectedData,
  };
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
