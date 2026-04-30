import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const defaultMaxRedirects = 4;
const blockedHostnamePatterns = [
  /^localhost$/i,
  /^localhost\./i,
  /\.localhost$/i,
];

type SafeFetchOptions = RequestInit & {
  maxRedirects?: number;
};

export async function safeFetch(input: string, init: SafeFetchOptions = {}): Promise<Response> {
  const maxRedirects = init.maxRedirects ?? defaultMaxRedirects;
  let currentUrl = await assertSafePublicUrl(input);

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const response = await fetch(currentUrl.href, { ...init, redirect: 'manual' });

    if (!isRedirect(response.status)) {
      return response;
    }

    const location = response.headers.get('location');
    if (!location) {
      return response;
    }

    currentUrl = await assertSafePublicUrl(new URL(location, currentUrl).href);
  }

  throw new Error('Too many redirects while fetching source.');
}

export async function assertSafePublicUrl(value: string): Promise<URL> {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error('URL is invalid.');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Only HTTP and HTTPS URLs can be fetched.');
  }

  if (url.username || url.password) {
    throw new Error('URLs with embedded credentials are not allowed.');
  }

  if (blockedHostnamePatterns.some((pattern) => pattern.test(url.hostname))) {
    throw new Error('Localhost URLs are not allowed.');
  }

  if (isBlockedIp(url.hostname)) {
    throw new Error('Private or local network URLs are not allowed.');
  }

  const records = await lookup(url.hostname, { all: true, verbatim: true });
  if (records.length === 0 || records.some((record) => isBlockedIp(record.address))) {
    throw new Error('URL resolves to a private or local network address.');
  }

  return url;
}

function isRedirect(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

function isBlockedIp(value: string): boolean {
  const ipVersion = isIP(value);

  if (ipVersion === 4) {
    const parts = value.split('.').map((part) => Number.parseInt(part, 10));
    const [first, second] = parts;

    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 198 && (second === 18 || second === 19)) ||
      first >= 224
    );
  }

  if (ipVersion === 6) {
    const normalized = value.toLocaleLowerCase();
    return (
      normalized === '::1' ||
      normalized === '::' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:') ||
      normalized.startsWith('ff')
    );
  }

  return false;
}
