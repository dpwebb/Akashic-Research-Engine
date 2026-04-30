import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CalendarDays, GitCompare, Network, Search, UserRound } from 'lucide-react';
import { researchDataset } from '../../shared/researchData.js';

type IndexTab = 'people' | 'movements' | 'terms' | 'comparisons' | 'timeline' | 'bibliography';

const tabs: Array<{ id: IndexTab; label: string; icon: typeof UserRound }> = [
  { id: 'people', label: 'People', icon: UserRound },
  { id: 'movements', label: 'Movements', icon: Network },
  { id: 'terms', label: 'Terms', icon: Search },
  { id: 'comparisons', label: 'Comparisons', icon: GitCompare },
  { id: 'timeline', label: 'Timeline', icon: CalendarDays },
  { id: 'bibliography', label: 'Bibliography', icon: BookOpen },
];

function includesQuery(values: Array<string | string[]>, query: string): boolean {
  const text = values.flat().join(' ').toLocaleLowerCase();
  return text.includes(query.toLocaleLowerCase());
}

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

function sourceTitle(sourceId: string): string {
  return researchDataset.sources.find((source) => source.id === sourceId)?.title ?? sourceId;
}

function SourceLinks({ sourceIds }: { sourceIds: string[] }) {
  if (sourceIds.length === 0) {
    return null;
  }

  return (
    <div className="source-chip-list" aria-label="Linked sources">
      {sourceIds.map((sourceId) => (
        <Link key={sourceId} to={`/claims?sourceId=${encodeURIComponent(sourceId)}`}>
          {sourceTitle(sourceId)}
        </Link>
      ))}
    </div>
  );
}

export function ResearchIndexPage() {
  const [activeTab, setActiveTab] = useState<IndexTab>('people');
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const normalizedQuery = query.trim();
  const index = researchDataset.index;

  const filtered = useMemo(
    () => ({
      people: index.people.filter(
        (person) =>
          includesQuery([person.name, person.lifespan, person.role, person.summary, person.movementIds], normalizedQuery) &&
          matchesDateRange(person.lifespan, dateFrom, dateTo),
      ),
      movements: index.movements.filter(
        (movement) =>
          includesQuery([movement.name, movement.period, movement.classification, movement.summary], normalizedQuery) &&
          matchesDateRange(movement.period, dateFrom, dateTo),
      ),
      terms: index.terms.filter((term) =>
        includesQuery([term.term, term.aliases, term.tradition, term.definition, term.caution], normalizedQuery),
      ),
      comparisons: index.comparativeConcepts.filter((concept) =>
        includesQuery(
          [
            concept.concept,
            concept.tradition,
            concept.relationshipToAkashicResearch,
            concept.summary,
            concept.boundaryNote,
          ],
          normalizedQuery,
        ),
      ),
      timeline: index.timeline.filter(
        (event) =>
          includesQuery([event.date, event.title, event.summary, event.entityIds], normalizedQuery) &&
          matchesDateRange(event.date, dateFrom, dateTo),
      ),
      bibliography: index.bibliography.filter(
        (record) =>
          includesQuery(
            [
              record.title,
              record.author,
              record.publicationDate,
              record.editionNotes,
              record.publisher,
              record.rightsStatus,
              record.sourceClassification,
              record.citationStatus,
              record.accessType,
              record.reviewStatus,
              record.stableCitation,
              record.pageReference,
              record.auditNote,
            ],
            normalizedQuery,
          ) && matchesDateRange(record.publicationDate, dateFrom, dateTo),
      ),
    }),
    [dateFrom, dateTo, index, normalizedQuery],
  );

  return (
    <section className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Research hub index</p>
        <h1>Knowledge Index</h1>
        <p>Browse the structured people, movements, terms, comparisons, timeline events, and bibliography behind the corpus.</p>
      </header>

      <section className="filter-panel index-filter-panel">
        <label>
          Search index
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by person, movement, term, date, or source"
          />
        </label>
        <label>
          Date from
          <input
            type="number"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            placeholder="1880"
          />
        </label>
        <label>
          Date to
          <input
            type="number"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            placeholder="1920"
          />
        </label>
      </section>

      <div className="scope-control index-tabs" aria-label="Research index sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              className={activeTab === tab.id ? 'active' : ''}
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'people' && (
        <div className="index-grid">
          {filtered.people.map((person) => (
            <article className="index-card" key={person.id}>
              <span className="tag">{person.lifespan}</span>
              <h2>{person.name}</h2>
              <p className="muted">{person.role}</p>
              <p>{person.summary}</p>
              <SourceLinks sourceIds={person.sourceIds} />
            </article>
          ))}
        </div>
      )}

      {activeTab === 'movements' && (
        <div className="index-grid">
          {filtered.movements.map((movement) => (
            <article className="index-card" key={movement.id}>
              <span className="tag">{movement.classification}</span>
              <h2>{movement.name}</h2>
              <p className="muted">{movement.period}</p>
              <p>{movement.summary}</p>
              <SourceLinks sourceIds={movement.sourceIds} />
            </article>
          ))}
        </div>
      )}

      {activeTab === 'terms' && (
        <div className="index-grid">
          {filtered.terms.map((term) => (
            <article className="index-card" key={term.id}>
              <span className="tag">{term.tradition}</span>
              <h2>{term.term}</h2>
              <p className="muted">Also: {term.aliases.join(', ')}</p>
              <p>{term.definition}</p>
              <p className="notes">{term.caution}</p>
              <SourceLinks sourceIds={term.sourceIds} />
            </article>
          ))}
        </div>
      )}

      {activeTab === 'comparisons' && (
        <div className="source-list">
          {filtered.comparisons.map((concept) => (
            <article className="index-card timeline-record" key={concept.id}>
              <span className="tag">{concept.relationshipToAkashicResearch}</span>
              <h2>{concept.concept}</h2>
              <p className="muted">{concept.tradition}</p>
              <p>{concept.summary}</p>
              <p className="notes">{concept.boundaryNote}</p>
              <SourceLinks sourceIds={concept.sourceIds} />
            </article>
          ))}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="source-list">
          {filtered.timeline.map((event) => (
            <article className="index-card timeline-record" key={event.id}>
              <span className="tag">{event.date}</span>
              <h2>{event.title}</h2>
              <p>{event.summary}</p>
              <p className="muted">Confidence {event.confidenceLevel} - entities {event.entityIds.join(', ')}</p>
              <SourceLinks sourceIds={event.sourceIds} />
            </article>
          ))}
        </div>
      )}

      {activeTab === 'bibliography' && (
        <div className="source-list">
          {filtered.bibliography.map((record) => (
            <article className="index-card timeline-record" key={record.id}>
              <div className="result-meta">
                <span className="tag">{record.rightsStatus}</span>
                <span className="tag">{record.sourceClassification}</span>
                <span className="tag">{record.citationStatus}</span>
                <span className="tag">{record.reviewStatus}</span>
              </div>
              <h2>{record.title}</h2>
              <p className="muted">
                {record.author} - {record.publicationDate}
              </p>
              <p>{record.editionNotes}</p>
              <p className="muted">Publisher: {record.publisher}</p>
              <p className="matched-terms">Access: {record.accessType}</p>
              <p className="notes">{record.stableCitation}</p>
              <p className="muted">{record.pageReference}</p>
              <p className="notes">{record.auditNote}</p>
              <Link to={`/claims?sourceId=${encodeURIComponent(record.sourceId)}`}>View linked claims</Link>
              <a href={record.archiveUrl} target="_blank" rel="noreferrer">
                Open record
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
