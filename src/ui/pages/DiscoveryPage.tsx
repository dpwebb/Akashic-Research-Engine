import { FormEvent, useMemo, useState } from 'react';
import { ExternalLink, Filter, Plus, Search } from 'lucide-react';
import { sourceClassifications, type SourceClassification } from '../../shared/taxonomy.js';
import type { DiscoverySearchResponse } from '../../shared/types.js';

type SearchScope = 'combined' | 'engine' | 'web';

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function DiscoveryPage() {
  const [query, setQuery] = useState('Akashic Records historical sources');
  const [scope, setScope] = useState<SearchScope>('combined');
  const [maxResults, setMaxResults] = useState(8);
  const [inspectPages, setInspectPages] = useState(true);
  const [exactPhrase, setExactPhrase] = useState('');
  const [includeTerms, setIncludeTerms] = useState('');
  const [excludeTerms, setExcludeTerms] = useState('course, paid reading');
  const [domains, setDomains] = useState('');
  const [selectedSourceTypes, setSelectedSourceTypes] = useState<SourceClassification[]>([]);
  const [minRelevance, setMinRelevance] = useState(0);
  const [response, setResponse] = useState<DiscoverySearchResponse | null>(null);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const searchPayload = useMemo(
    () => ({
      query,
      scope,
      maxResults,
      inspectPages,
      exactPhrase: exactPhrase.trim() || undefined,
      includeTerms: parseList(includeTerms),
      excludeTerms: parseList(excludeTerms),
      domains: parseList(domains),
      sourceTypes: selectedSourceTypes,
      minRelevance,
    }),
    [
      query,
      scope,
      maxResults,
      inspectPages,
      exactPhrase,
      includeTerms,
      excludeTerms,
      domains,
      selectedSourceTypes,
      minRelevance,
    ],
  );

  async function runDiscovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setResponse(null);
    setIsSearching(true);

    try {
      const searchResponse = await fetch('/api/discovery/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchPayload),
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

  function toggleSourceType(sourceType: SourceClassification) {
    setSelectedSourceTypes((current) =>
      current.includes(sourceType)
        ? current.filter((item) => item !== sourceType)
        : [...current, sourceType],
    );
  }

  async function saveToReviewQueue(result: DiscoverySearchResponse['results'][number]) {
    setSaveMessage('');
    setError('');

    try {
      const saveResponse = await fetch('/api/review-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: result.pageTitle || result.title,
          url: result.url,
          domain: result.domain,
          proposedSourceType: result.sourceType ?? 'speculative',
          summary: result.pageDescription || result.snippet || result.pageExcerpt || 'Discovery result pending review.',
          confidenceLevel: result.confidenceLevel ?? 'low',
          citationNotes: result.researchNotes.join(' '),
        }),
      });

      if (!saveResponse.ok) {
        const data = await saveResponse.json();
        throw new Error(data.error ?? 'Could not save result.');
      }

      setSaveMessage('Saved to review queue.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save result.');
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Research search</p>
        <h1>Discovery Engine</h1>
        <p>Search the engine corpus and the public web with precise filters, relevance scoring, and citation review cues.</p>
      </header>

      <form className="assistant-form discovery-form" onSubmit={runDiscovery}>
        <label>
          Research query
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            minLength={3}
            maxLength={240}
            placeholder="Example: Akashic Records historical sources"
          />
        </label>

        <div className="scope-control" aria-label="Search scope">
          {(['combined', 'engine', 'web'] as const).map((item) => (
            <button
              className={scope === item ? 'active' : ''}
              key={item}
              type="button"
              onClick={() => setScope(item)}
            >
              {item === 'combined' ? 'Combined' : item === 'engine' ? 'Engine Corpus' : 'Public Web'}
            </button>
          ))}
        </div>

        <div className="discovery-controls">
          <label>
            Results
            <select
              value={maxResults}
              onChange={(event) => setMaxResults(Number.parseInt(event.target.value, 10))}
            >
              {[6, 8, 10, 12, 16, 20].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>
          <label>
            Minimum relevance
            <input
              max={100}
              min={0}
              type="number"
              value={minRelevance}
              onChange={(event) => setMinRelevance(Number.parseInt(event.target.value, 10) || 0)}
            />
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={inspectPages}
              disabled={scope === 'engine'}
              onChange={(event) => setInspectPages(event.target.checked)}
            />
            Inspect web pages
          </label>
        </div>

        <details className="advanced-search" open>
          <summary>
            <Filter aria-hidden="true" />
            Granular filters
          </summary>
          <div className="filter-grid">
            <label>
              Exact phrase
              <input
                value={exactPhrase}
                onChange={(event) => setExactPhrase(event.target.value)}
                maxLength={160}
                placeholder="Example: cosmic memory"
              />
            </label>
            <label>
              Required terms
              <input
                value={includeTerms}
                onChange={(event) => setIncludeTerms(event.target.value)}
                placeholder="Comma-separated terms"
              />
            </label>
            <label>
              Excluded terms
              <input
                value={excludeTerms}
                onChange={(event) => setExcludeTerms(event.target.value)}
                placeholder="Comma-separated terms"
              />
            </label>
            <label>
              Domains
              <input
                value={domains}
                onChange={(event) => setDomains(event.target.value)}
                placeholder="Example: archive.org, rsarchive.org"
              />
            </label>
          </div>

          <div className="source-type-filter" aria-label="Source classifications">
            {sourceClassifications.map((sourceType) => (
              <button
                className={selectedSourceTypes.includes(sourceType) ? 'active' : ''}
                key={sourceType}
                type="button"
                onClick={() => toggleSourceType(sourceType)}
              >
                {sourceType}
              </button>
            ))}
          </div>
        </details>

        <button type="submit" disabled={isSearching || query.trim().length < 3}>
          <Search aria-hidden="true" />
          {isSearching ? 'Searching...' : 'Run Search'}
        </button>
        {error && <p className="form-error">{error}</p>}
        {saveMessage && <p className="form-success">{saveMessage}</p>}
      </form>

      {response && (
        <section className="search-output">
          <div className="search-summary">
            <article>
              <span>Engine</span>
              <strong>{response.summary.engineMatches}</strong>
            </article>
            <article>
              <span>Web</span>
              <strong>{response.summary.webMatches}</strong>
            </article>
            <article>
              <span>Inspected</span>
              <strong>{response.summary.inspectedPages}</strong>
            </article>
          </div>

          {response.effectiveWebQuery && response.effectiveWebQuery !== response.query && (
            <div className="panel query-panel">
              <h2>Effective Web Query</h2>
              <p>{response.effectiveWebQuery}</p>
            </div>
          )}

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

          <div className="source-list discovery-results">
            {response.results.length === 0 && (
              <div className="panel empty-results">
                <h2>No Matches</h2>
                <p>
                  The search ran, but no results survived the active filters. Clear required terms,
                  exact phrase, source classifications, or minimum relevance to broaden the search.
                </p>
              </div>
            )}

            {response.results.map((result) => (
              <article className="source-card search-result-card" key={result.id}>
                <div>
                  <div className="result-meta">
                    <span className="tag">{result.origin}</span>
                    <span className="tag">{result.category}</span>
                    {result.sourceType && <span className="tag">{result.sourceType}</span>}
                  </div>
                  <h2>{result.pageTitle || result.title}</h2>
                  <p className="muted">
                    Score {result.relevanceScore} · {result.domain} ·{' '}
                    {result.inspected ? 'inspected' : 'not inspected'}
                  </p>
                </div>
                {result.pageDescription && <p>{result.pageDescription}</p>}
                {result.snippet && <p className="notes">{result.snippet}</p>}
                {result.pageExcerpt && <p className="muted">{result.pageExcerpt}</p>}
                {result.matchedTerms.length > 0 && (
                  <p className="matched-terms">Matched: {result.matchedTerms.join(', ')}</p>
                )}
                <ul className="research-notes">
                  {result.researchNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
                {result.url && (
                  <div className="review-actions">
                    <button type="button" onClick={() => saveToReviewQueue(result)}>
                      <Plus aria-hidden="true" />
                      Send to Review
                    </button>
                    <a href={result.url} target="_blank" rel="noreferrer">
                      Open result <ExternalLink aria-hidden="true" />
                    </a>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
