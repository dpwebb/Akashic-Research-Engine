import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { researchDataset } from '../../shared/researchData.js';
import { claimTypes, evidenceGrades, type ClaimType, type EvidenceGrade } from '../../shared/taxonomy.js';

export function ClaimsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [claimType, setClaimType] = useState<'all' | ClaimType>('all');
  const [evidenceGrade, setEvidenceGrade] = useState<'all' | EvidenceGrade>('all');
  const [citationRequiredOnly, setCitationRequiredOnly] = useState(false);
  const sourceId = searchParams.get('sourceId') ?? 'all';
  const selectedSource = sourceId === 'all' ? undefined : researchDataset.sources.find((source) => source.id === sourceId);
  const selectedSourceClaims = selectedSource
    ? researchDataset.claims.filter((claim) => claim.sourceId === selectedSource.id)
    : [];

  const filteredClaims = useMemo(
    () =>
      researchDataset.claims.filter((claim) => {
        const source = researchDataset.sources.find((item) => item.id === claim.sourceId);
        const searchableText = [claim.text, claim.type, claim.notes, source?.title, source?.author, source?.sourceType]
          .join(' ')
          .toLocaleLowerCase();

        if (query.trim() && !searchableText.includes(query.trim().toLocaleLowerCase())) {
          return false;
        }

        if (claimType !== 'all' && claim.type !== claimType) {
          return false;
        }

        if (evidenceGrade !== 'all' && claim.evidenceGrade !== evidenceGrade) {
          return false;
        }

        if (sourceId !== 'all' && claim.sourceId !== sourceId) {
          return false;
        }

        if (citationRequiredOnly && !claim.citationRequired) {
          return false;
        }

        return true;
      }),
    [citationRequiredOnly, claimType, evidenceGrade, query, sourceId],
  );

  const setSourceFilter = (nextSourceId: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextSourceId === 'all') {
      nextParams.delete('sourceId');
    } else {
      nextParams.set('sourceId', nextSourceId);
    }
    setSearchParams(nextParams);
  };

  return (
    <section className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Claim extraction</p>
        <h1>Claims</h1>
        <p>Claims are labeled separately from the source summary and assigned an evidence grade.</p>
      </header>

      {selectedSource && (
        <section className="source-drilldown-panel">
          <div>
            <p className="eyebrow">Source drilldown</p>
            <h2>{selectedSource.title}</h2>
            <p className="muted">
              {selectedSource.author} - {selectedSource.date} - {selectedSource.sourceType}
            </p>
            <p>{selectedSource.summary}</p>
          </div>
          <div className="source-drilldown-stats">
            <span className="tag">{selectedSourceClaims.length} linked claims</span>
            <span className="tag">{selectedSource.confidenceLevel} source confidence</span>
            <Link to="/claims">Clear source</Link>
            <a href={selectedSource.url} target="_blank" rel="noreferrer">
              Open source
            </a>
          </div>
        </section>
      )}

      <section className="filter-panel claims-filter-panel">
        <label>
          Search claims
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by claim, note, source, or author"
          />
        </label>
        <label>
          Claim type
          <select value={claimType} onChange={(event) => setClaimType(event.target.value as typeof claimType)}>
            <option value="all">All claim types</option>
            {claimTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label>
          Evidence grade
          <select
            value={evidenceGrade}
            onChange={(event) => setEvidenceGrade(event.target.value as typeof evidenceGrade)}
          >
            <option value="all">All grades</option>
            {evidenceGrades.map((grade) => (
              <option key={grade.grade} value={grade.grade}>
                {grade.grade} - {grade.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Source
          <select value={sourceId} onChange={(event) => setSourceFilter(event.target.value)}>
            <option value="all">All sources</option>
            {researchDataset.sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.title}
              </option>
            ))}
          </select>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={citationRequiredOnly}
            onChange={(event) => setCitationRequiredOnly(event.target.checked)}
          />
          Citation required only
        </label>
      </section>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Claim</th>
              <th>Type</th>
              <th>Grade</th>
              <th>Confidence</th>
              <th>Citation</th>
            </tr>
          </thead>
          <tbody>
            {filteredClaims.map((claim) => {
              const source = researchDataset.sources.find((item) => item.id === claim.sourceId);

              return (
                <tr key={claim.id}>
                  <td>
                    <strong>{claim.text}</strong>
                    <span>{claim.notes}</span>
                    {source && (
                      <span>
                        Source:{' '}
                        <Link to={`/claims?sourceId=${encodeURIComponent(source.id)}`}>
                          {source.title} - {source.author}
                        </Link>
                      </span>
                    )}
                  </td>
                  <td>{claim.type}</td>
                  <td>
                    <span className={`grade grade-${claim.evidenceGrade.toLowerCase()}`}>{claim.evidenceGrade}</span>
                  </td>
                  <td>{claim.confidenceLevel}</td>
                  <td>{claim.citationRequired ? 'required' : 'optional'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
