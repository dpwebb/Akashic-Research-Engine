import { safeFetch } from '../security/safeFetch.js';

const suspiciousPatterns = [
  /\bguaranteed?\b/i,
  /\binstant manifestation\b/i,
  /\bmiracle cure\b/i,
  /\bbuy now\b/i,
  /\bexclusive secret\b/i,
];

const akashicKeywords = [
  'akashic',
  'theosophy',
  'esoteric',
  'blavatsky',
  'anthroposophy',
  'occult',
  'metaphysical',
  'archive',
  'doctrine',
  'primary source',
];

export type AkashicScrubResult = {
  url: string;
  title: string;
  summary: string;
  cleanedExcerpt: string;
  wordCount: number;
  akashicRelevance: number;
  matchedKeywords: string[];
  riskFlags: string[];
  recommendation: 'promising' | 'review' | 'discard';
  fetchedAt: string;
};

export async function scrubAkashicUrl(url: string): Promise<AkashicScrubResult> {
  const response = await safeFetch(url, {
    headers: {
      'User-Agent': 'AkashicResearchEngine/1.0 (akashic scrubber)',
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`Could not fetch page. Status ${response.status}.`);
  }

  const html = await response.text();
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() ?? 'Untitled page';
  const text = extractText(html);
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const matchedKeywords = akashicKeywords.filter((keyword) => lower.includes(keyword));
  const riskFlags = suspiciousPatterns.filter((pattern) => pattern.test(text)).map((pattern) => `matched:${pattern.source}`);

  const akashicRelevance = Math.min(100, Math.round((matchedKeywords.length / akashicKeywords.length) * 100 + Math.min(words.length / 120, 20)));
  const recommendation = riskFlags.length >= 2 ? 'discard' : akashicRelevance >= 40 ? 'promising' : 'review';

  return {
    url,
    title,
    summary: summarize(text),
    cleanedExcerpt: text.slice(0, 900),
    wordCount: words.length,
    akashicRelevance,
    matchedKeywords,
    riskFlags,
    recommendation,
    fetchedAt: new Date().toISOString(),
  };
}

function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function summarize(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/).filter((sentence) => sentence.length > 40);
  return sentences.slice(0, 2).join(' ').slice(0, 380) || text.slice(0, 380);
}
