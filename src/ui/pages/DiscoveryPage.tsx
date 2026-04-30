import { FormEvent, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import type { DiscoverySearchResponse } from '../../shared/types.js';

export function DiscoveryPage() {
  const [query, setQuery] = useState('Akashic Records historical sources');
  const [maxResults, setMaxResults] = useState(6);
  const [inspectPages, setInspectPages] = useState(true);
  const [response, setResponse] = useState<DiscoverySearchResponse | null>(null);
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  async function runDiscovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setResponse(null);
    setIsSearching(true);

    try {
      const searchResponse = await fetch('/api/discovery/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, maxResults, inspectPages }),
      });
      const data = await searchResponse.json();

      if (!searchResponse.ok) {
        throw new Error(data.error ?? 'Discovery search failed.');
      }

      setResponse(data);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Discovery search failed.');
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Internet discovery</p>
        <h1>Research Spider</h1>
        <p>Run targeted public web searches and inspect result pages for citation leads.</p>
      </header>

      <form className="assistant-form discovery-form" onSubmit={runDiscovery}>
        <label>
          Search query
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            minLength={3}
            maxLength={240}
            placeholder="Example: Akashic Records historical sources"
          />
        </label>
        <div className="discovery-controls">
          <label>
            Results
            <select
              value={maxResults}
              onChange={(event) => setMaxResults(Number.parseInt(event.target.value, 10))}
            >
              {[4, 6, 8, 10, 12].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={inspectPages}
              onChange={(event) => setInspectPages(event.target.checked)}
            />
            Inspect result pages
          </label>
        </div>
        <button type="submit" disabled={isSearching || query.trim().length < 3}>
          <Search aria-hidden="true" />
          {isSearching ? 'Searching...' : 'Search Web'}
        </button>
        {error && <p className="form-error">{error}</p>}
      </form>

      {response && (
        <section className="source-list discovery-results">
          {response.warnings.length > 0 && (
            <div className="panel">
              <h2>Warnings</h2>
              {response.warnings.map((warning) => (
                <p className="muted" key={warning}>
                  {warning}
                </p>
              ))}
            </div>
          )}

          {response.results.map((result) => (
            <article className="source-card" key={result.url}>
              <div>
                <span className="tag">{result.domain}</span>
                <h2>{result.pageTitle || result.title}</h2>
                <p className="muted">
                  Discovered {new Date(result.discoveredAt).toLocaleString()} ·{' '}
                  {result.inspected ? 'page inspected' : 'search result only'}
                </p>
              </div>
              {result.pageDescription && <p>{result.pageDescription}</p>}
              {result.snippet && <p className="notes">{result.snippet}</p>}
              {result.pageExcerpt && <p className="muted">{result.pageExcerpt}</p>}
              <a href={result.url} target="_blank" rel="noreferrer">
                Open result <ExternalLink aria-hidden="true" />
              </a>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}
