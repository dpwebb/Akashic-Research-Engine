import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { researchDataset } from '../../shared/researchData.js';
import {
  claimTypes,
  evidenceGrades,
  sourceClassifications,
  type ClaimType,
  type EvidenceGrade,
  type SourceClassification,
} from '../../shared/taxonomy.js';

type ConfidenceFilter = 'all' | 'high' | 'medium' | 'low';

function extractYears(text: string): number[] {
  return [...text.matchAll(/\b(1[0-9]{3}|20[0-9]{2}|21[0-9]{2})\b/g)].map((match) =>
    Number.parseInt(match[1], 10),
  );
}

function matchesDateRange(text: string, dateFrom: string, dateTo: string): boolean {
  if (!dateFrom && !dateTo) {
    return true;
  }

  const years = extractYears(text);
  if (years.length === 0) {
    return false;
  }

  const from = dateFrom ? Number.parseInt(dateFrom, 10) : Number.NEGATIVE_INFINITY;
  const to = dateTo ? Number.parseInt(dateTo, 10) : Number.POSITIVE_INFINITY;
  return years.some((year) => year >= from && year <= to);
}

function claimReuseGuidance(claim: { evidenceGrade: EvidenceGrade; citationRequired: boolean; type: ClaimType }): string {
  if (claim.evidenceGrade === 'D' || claim.evidenceGrade === 'E' || claim.evidenceGrade === 'F') {
    return 'Do not cite as proof; use as testimony, interpretation, or speculation with explicit limits.';
  }

  if (claim.type === 'metaphysical claim' || claim.type === 'experiential claim') {
    return 'Cite as a source claim, not as independently verified fact.';
  }

  return claim.citationRequired ? 'Cite the source before reuse.' : 'Useful as workflow context; verify before final citation.';
}

export function ClaimsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [claimType, setClaimType] = useState<'all' | ClaimType>('all');
  const [evidenceGrade, setEvidenceGrade] = useState<'all' | EvidenceGrade>('all');
  const [confidence, setConfidence] = useState<ConfidenceFilter>('all');
  const [sourceType, setSourceType] = useState<'all' | SourceClassification>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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
        const searchableText = [
          claim.text,
          claim.type,
          claim.notes,
          claim.confidenceLevel,
          claimReuseGuidance(claim),
          source?.title,
          source?.author,
          source?.date,
          source?.sourceType,
          source?.citationNotes,
        ]
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

        if (confidence !== 'all' && claim.confidenceLevel !== confidence) {
          return false;
        }

        if (sourceType !== 'all' && source?.sourceType !== sourceType) {
          return false;
        }

        if (sourceId !== 'all' && claim.sourceId !== sourceId) {
          return false;
        }

        if (source && !matchesDateRange(source.date, dateFrom, dateTo)) {
          return false;
        }

        if (citationRequiredOnly && !claim.citationRequired) {
          return false;
        }

        return true;
      }),
    [citationRequiredOnly, claimType, confidence, dateFrom, dateTo, evidenceGrade, query, sourceId, sourceType],
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
            <Link to="/app/claims">Clear source</Link>
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
        <label>
          Confidence
          <select value={confidence} onChange={(event) => setConfidence(event.target.value as ConfidenceFilter)}>
            <option value="all">All confidence</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
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
          Source date from
          <input
            type="number"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            placeholder="1880"
          />
        </label>
        <label>
          Source date to
          <input
            type="number"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            placeholder="1920"
          />
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
                    <span className="claim-guidance">{claimReuseGuidance(claim)}</span>
                    {source && (
                      <span>
                        Source:{' '}
                        <Link to={`/app/claims?sourceId=${encodeURIComponent(source.id)}`}>
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
