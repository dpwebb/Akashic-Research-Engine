import { ExternalLink } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { researchDataset } from '../../shared/researchData.js';
import { sourceClassifications, type SourceClassification } from '../../shared/taxonomy.js';

type ConfidenceFilter = 'all' | 'high' | 'medium' | 'low';

export function SourcesPage() {
  const [query, setQuery] = useState('');
  const [sourceType, setSourceType] = useState<'all' | SourceClassification>('all');
  const [confidence, setConfidence] = useState<ConfidenceFilter>('all');
  const [primaryOnly, setPrimaryOnly] = useState(false);

  const filteredSources = useMemo(
    () =>
      researchDataset.sources.filter((source) => {
        const sourceClaims = researchDataset.claims.filter((claim) => claim.sourceId === source.id);
        const searchableText = [
          source.title,
          source.author,
          source.date,
          source.sourceType,
          source.summary,
          source.citationNotes,
          sourceClaims.map((claim) => claim.text).join(' '),
        ]
          .join(' ')
          .toLocaleLowerCase();

        if (query.trim() && !searchableText.includes(query.trim().toLocaleLowerCase())) {
          return false;
        }

        if (sourceType !== 'all' && source.sourceType !== sourceType) {
          return false;
        }

        if (confidence !== 'all' && source.confidenceLevel !== confidence) {
          return false;
        }

        if (primaryOnly && source.sourceType !== 'primary esoteric') {
          return false;
        }

        return true;
      }),
    [confidence, primaryOnly, query, sourceType],
  );

  return (
    <section className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Citation database</p>
        <h1>Sources</h1>
        <p>Each source is classified before claims are extracted or compared.</p>
      </header>

      <section className="filter-panel">
        <label>
          Search sources
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by title, author, notes, or derived claim"
          />
        </label>
        <label>
          Source class
          <select value={sourceType} onChange={(event) => setSourceType(event.target.value as typeof sourceType)}>
            <option value="all">All classes</option>
            {sourceClassifications.map((classification) => (
              <option key={classification} value={classification}>
                {classification}
              </option>
            ))}
          </select>
        </label>
        <label>
          Confidence
          <select value={confidence} onChange={(event) => setConfidence(event.target.value as ConfidenceFilter)}>
            <option value="all">All confidence</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={primaryOnly}
            onChange={(event) => setPrimaryOnly(event.target.checked)}
          />
          Primary esoteric only
        </label>
      </section>

      <div className="source-list">
        {filteredSources.map((source) => {
          const sourceClaims = researchDataset.claims.filter((claim) => claim.sourceId === source.id);

          return (
            <article className="source-card" key={source.id}>
              <div>
                <div className="result-meta">
                  <span className="tag">{source.sourceType}</span>
                  <span className="tag">{source.confidenceLevel}</span>
                  <span className="tag">{sourceClaims.length} claims</span>
                </div>
                <h2>{source.title}</h2>
                <p className="muted">
                  {source.author} - {source.date}
                </p>
              </div>
              <p>{source.summary}</p>
              <p className="notes">{source.citationNotes}</p>
              {sourceClaims.length > 0 && (
                <div className="derived-claims">
                  <div className="derived-claims-header">
                    <h3>Claims Derived From This Source</h3>
                    <Link to={`/claims?sourceId=${encodeURIComponent(source.id)}`}>Open drilldown</Link>
                  </div>
                  <ul>
                    {sourceClaims.map((claim) => (
                      <li key={claim.id}>
                        <strong>{claim.evidenceGrade}</strong>
                        <span>
                          {claim.text}
                          <small>
                            {claim.type} - {claim.confidenceLevel} confidence - citation{' '}
                            {claim.citationRequired ? 'required' : 'optional'}
                          </small>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <a href={source.url} target="_blank" rel="noreferrer">
                Open source <ExternalLink aria-hidden="true" />
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}
