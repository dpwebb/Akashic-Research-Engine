import type { SourceImportPreview } from '../../shared/types.js';
import { safeFetch } from '../security/safeFetch.js';

const requestTimeoutMs = 9000;
const maxInspectableBytes = 650_000;
const userAgent = 'Mozilla/5.0 (compatible; AkashicResearchEngine/1.0; source import preview)';

export async function previewSourceImport(url: string): Promise<SourceImportPreview> {
  const normalizedUrl = normalizeUrl(url);
  const warnings: string[] = [];

  try {
    const response = await fetchWithTimeout(normalizedUrl, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,text/plain',
        'User-Agent': userAgent,
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Source returned HTTP ${response.status}.`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    const body = await readLimitedText(response);
    const isHtml = contentType.includes('text/html') || body.includes('<html');
    const visibleText = isHtml ? extractVisibleText(body) : cleanText(body);
    const title = isHtml ? extractTagContent(body, 'title') : getFilenameTitle(normalizedUrl);
    const description = isHtml ? extractMetaContent(body, 'description') : visibleText.slice(0, 220);
    const detectedAuthor = isHtml ? detectAuthor(body, visibleText) : '';
    const detectedDate = detectDate([body, visibleText].join(' '));
    const wordCount = countWords(visibleText);
    const proposedSourceType = classifyImportedSource(normalizedUrl, [title, description, visibleText].join(' '));
    const fullTextCandidate = visibleText.length > 3000 || normalizedUrl.includes('archive.org') || normalizedUrl.endsWith('.pdf');
    const citationStatus = inferCitationStatus({
      author: detectedAuthor,
      date: detectedDate,
      title,
      url: normalizedUrl,
    });
    const qualityFlags = buildQualityFlags({
      citationStatus,
      contentType,
      detectedAuthor,
      detectedDate,
      fullTextCandidate,
      proposedSourceType,
      wordCount,
    });

    if (visibleText.length >= maxInspectableBytes - 1000) {
      warnings.push('Preview reached the inspection limit; full-text extraction should run as a background job.');
    }

    if (!description) {
      warnings.push('No meta description was found; summary should be written manually during review.');
    }

    return {
      url: normalizedUrl,
      domain: getDomain(normalizedUrl),
      title: title || getFilenameTitle(normalizedUrl),
      description: description || 'No description detected.',
      contentType: contentType || 'unknown',
      detectedAuthor,
      detectedDate,
      wordCount,
      characterCount: visibleText.length,
      fullTextCandidate,
      citationStatus,
      qualityFlags,
      textExcerpt: visibleText.slice(0, 1200),
      proposedSourceType,
      confidenceLevel: inferConfidenceLevel(proposedSourceType),
      citationNotes: buildCitationNotes(proposedSourceType, normalizedUrl),
      extractionStatus: 'completed',
      warnings,
    };
  } catch (error) {
    return {
      url: normalizedUrl,
      domain: getDomain(normalizedUrl),
      title: getFilenameTitle(normalizedUrl),
      description: 'Import preview failed.',
      contentType: 'unknown',
      detectedAuthor: '',
      detectedDate: '',
      wordCount: 0,
      characterCount: 0,
      fullTextCandidate: false,
      citationStatus: 'needs review',
      qualityFlags: ['Preview failed before metadata extraction.'],
      textExcerpt: '',
      proposedSourceType: 'low-quality',
      confidenceLevel: 'low',
      citationNotes: 'Preview failed; manually verify source accessibility and citation metadata.',
      extractionStatus: 'failed',
      warnings: [error instanceof Error ? error.message : 'Import preview failed.'],
    };
  }
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return new URL(withProtocol).href;
}

function classifyImportedSource(url: string, text: string): SourceImportPreview['proposedSourceType'] {
  const domain = getDomain(url);
  const normalizedText = text.toLocaleLowerCase();

  if (domain.includes('britannica.com') || domain.includes('encyclopedia.com') || domain.includes('wikipedia.org')) {
    return 'historical';
  }

  if (domain.includes('archive.org')) {
    return 'historical';
  }

  if (domain.endsWith('.edu') || normalizedText.includes('journal') || normalizedText.includes('university')) {
    return 'academic';
  }

  if (normalizedText.includes('archive') || normalizedText.includes('historical')) {
    return 'historical';
  }

  if (
    normalizedText.includes('theosophy') ||
    normalizedText.includes('anthroposophy') ||
    normalizedText.includes('steiner') ||
    normalizedText.includes('blavatsky') ||
    normalizedText.includes('leadbeater')
  ) {
    return 'primary esoteric';
  }

  if (normalizedText.includes('cayce') || normalizedText.includes('reading') || normalizedText.includes('spiritual')) {
    return 'modern spiritual';
  }

  if (normalizedText.includes('buy') || normalizedText.includes('course') || normalizedText.includes('session')) {
    return 'commercial';
  }

  return 'speculative';
}

function inferConfidenceLevel(
  sourceType: SourceImportPreview['proposedSourceType'],
): SourceImportPreview['confidenceLevel'] {
  if (sourceType === 'commercial' || sourceType === 'low-quality') {
    return 'low';
  }

  return 'medium';
}

function buildCitationNotes(sourceType: SourceImportPreview['proposedSourceType'], url: string): string {
  const domain = getDomain(url);

  if (sourceType === 'primary esoteric') {
    return `Imported from ${domain}. Treat as primary esoteric testimony; verify edition and page references.`;
  }

  if (sourceType === 'academic' || sourceType === 'historical') {
    return `Imported from ${domain}. Review author, publisher, date, and citation stability before promotion.`;
  }

  if (sourceType === 'commercial') {
    return `Imported from ${domain}. Treat promotional claims cautiously and require independent corroboration.`;
  }

  return `Imported from ${domain}. Review source quality and classify before promotion.`;
}

function detectAuthor(html: string, visibleText: string): string {
  const candidates = [
    extractMetaContent(html, 'author'),
    extractMetaContent(html, 'article:author'),
    extractMetaContent(html, 'byl'),
  ].filter(Boolean);

  if (candidates.length > 0) {
    return candidates[0].slice(0, 160);
  }

  const byline = /\bby\s+([A-Z][A-Za-z .'-]{2,80})\b/.exec(visibleText);
  return byline ? byline[1].trim() : '';
}

function detectDate(text: string): string {
  const isoDate = /\b(18|19|20|21)\d{2}-\d{2}-\d{2}\b/.exec(text);
  if (isoDate) {
    return isoDate[0];
  }

  const namedDate =
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+((18|19|20|21)\d{2})\b/i.exec(
      text,
    );
  if (namedDate) {
    return namedDate[0];
  }

  const year = /\b(18|19|20|21)\d{2}\b/.exec(text);
  return year ? year[0] : '';
}

function countWords(text: string): number {
  return text.match(/\b[\p{L}\p{N}'-]+\b/gu)?.length ?? 0;
}

function inferCitationStatus(input: {
  author: string;
  date: string;
  title: string;
  url: string;
}): SourceImportPreview['citationStatus'] {
  const hasStableSource =
    input.url.includes('archive.org') || input.url.includes('britannica.com') || input.url.endsWith('.pdf');
  const hasCoreMetadata = Boolean(input.title && input.author && input.date);

  if (hasStableSource && hasCoreMetadata) {
    return 'complete';
  }

  if (input.title && (input.author || input.date || hasStableSource)) {
    return 'partial';
  }

  return 'needs review';
}

function buildQualityFlags(input: {
  citationStatus: SourceImportPreview['citationStatus'];
  contentType: string;
  detectedAuthor: string;
  detectedDate: string;
  fullTextCandidate: boolean;
  proposedSourceType: SourceImportPreview['proposedSourceType'];
  wordCount: number;
}): string[] {
  const flags: string[] = [];

  if (input.citationStatus !== 'complete') {
    flags.push('Citation metadata needs reviewer verification.');
  }

  if (!input.detectedAuthor) {
    flags.push('No author metadata detected.');
  }

  if (!input.detectedDate) {
    flags.push('No publication date detected.');
  }

  if (input.wordCount < 300) {
    flags.push('Low extracted word count; source may be a landing page or blocked document.');
  }

  if (input.proposedSourceType === 'commercial' || input.proposedSourceType === 'low-quality') {
    flags.push('Treat as low-trust until independently corroborated.');
  }

  if (input.fullTextCandidate) {
    flags.push('Good candidate for a later full-text extraction job.');
  }

  if (!input.contentType.includes('text') && !input.contentType.includes('html')) {
    flags.push('Non-HTML/text content may need a specialized extractor.');
  }

  return flags;
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

  const merged = new Uint8Array(Math.min(totalBytes, maxInspectableBytes));
  let offset = 0;

  for (const chunk of chunks) {
    const remaining = merged.byteLength - offset;
    if (remaining <= 0) {
      break;
    }

    merged.set(chunk.slice(0, remaining), offset);
    offset += Math.min(chunk.byteLength, remaining);
  }

  return new TextDecoder().decode(merged);
}

function extractVisibleText(html: string): string {
  return cleanText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  );
}

function extractTagContent(html: string, tagName: string): string {
  const pattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = pattern.exec(html);
  return match ? cleanText(match[1]) : '';
}

function extractMetaContent(html: string, name: string): string {
  const pattern = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    'i',
  );
  const reversePattern = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["'][^>]*>`,
    'i',
  );
  const match = pattern.exec(html) ?? reversePattern.exec(html);
  return match ? cleanText(match[1]) : '';
}

function cleanText(value: string): string {
  return decodeHtml(value).replace(/\s+/g, ' ').trim();
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

function getFilenameTitle(url: string): string {
  try {
    const parsed = new URL(url);
    const segment = parsed.pathname.split('/').filter(Boolean).at(-1);
    return segment ? segment.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ') : parsed.hostname;
  } catch {
    return 'Untitled source';
  }
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown domain';
  }
}
