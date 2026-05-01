import { safeFetch } from '../security/safeFetch.js';

const wikipediaSearchEndpoint = 'https://en.wikipedia.org/w/api.php';

export type OnlineSignal = {
  query: string;
  title: string;
  snippet: string;
  pageUrl: string;
  timestamp: string;
};

export async function getOnlineSignals(queries: string[], limitPerQuery = 2): Promise<OnlineSignal[]> {
  const trimmedQueries = [...new Set(queries.map((query) => query.trim()).filter(Boolean))].slice(0, 4);

  const results = await Promise.all(
    trimmedQueries.map(async (query) => {
      const searchParams = new URLSearchParams({
        action: 'query',
        list: 'search',
        format: 'json',
        utf8: '1',
        srlimit: String(limitPerQuery),
        srsearch: query,
      });

      const response = await safeFetch(`${wikipediaSearchEndpoint}?${searchParams.toString()}`, {
        headers: {
          'User-Agent': 'AkashicResearchEngine/1.0 (online signals)',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Wikipedia lookup failed with status ${response.status}.`);
      }

      const payload = (await response.json()) as {
        query?: { search?: Array<{ title: string; snippet: string; timestamp?: string }> };
      };

      return (payload.query?.search ?? []).map((item) => ({
        query,
        title: item.title,
        snippet: item.snippet.replace(/<[^>]+>/g, ''),
        pageUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s+/g, '_'))}`,
        timestamp: item.timestamp ?? new Date().toISOString(),
      }));
    }),
  );

  return results.flat();
}
