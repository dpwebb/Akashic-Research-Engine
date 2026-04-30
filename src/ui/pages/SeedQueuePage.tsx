import { useEffect, useState } from 'react';
import { Check, ExternalLink, X } from 'lucide-react';
import { sourceClassifications, type SourceClassification } from '../../shared/taxonomy.js';
import type { ReviewQueueItem, SeedPack } from '../../shared/types.js';

type StatusFilter = 'all' | ReviewQueueItem['status'];
type ProvenanceFilter = 'all' | ReviewQueueItem['provenance'];
type PriorityFilter = 'all' | ReviewQueueItem['reviewPriority'];

export function SeedQueuePage() {
  const [seedPacks, setSeedPacks] = useState<SeedPack[]>([]);
  const [queueItems, setQueueItems] = useState<ReviewQueueItem[]>([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [provenanceFilter, setProvenanceFilter] = useState<ProvenanceFilter>('all');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<'all' | SourceClassification>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');

  useEffect(() => {
    void loadSeedData();
  }, []);

  async function loadSeedData() {
    try {
      const [packsResponse, queueResponse] = await Promise.all([
        fetch('/api/seed-packs'),
        fetch('/api/review-queue'),
      ]);

      if (!packsResponse.ok || !queueResponse.ok) {
        throw new Error('Seed data could not be loaded.');
      }

      setSeedPacks(await packsResponse.json());
      setQueueItems(await queueResponse.json());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Seed data could not be loaded.');
    }
  }

  async function updateStatus(id: string, status: ReviewQueueItem['status']) {
    const response = await fetch(`/api/review-queue/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      setError('Review status could not be updated.');
      return;
    }

    const updatedItem = await response.json();
    setQueueItems((current) => current.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
  }

  const pendingCount = queueItems.filter((item) => item.status === 'pending').length;
  const approvedCount = queueItems.filter((item) => item.status === 'approved').length;
  const filteredQueueItems = queueItems.filter((item) => {
    const searchableText = [
      item.title,
      item.domain,
      item.summary,
      item.citationNotes,
      item.reviewerNotes,
      item.reviewPriority,
      item.qualityFlags.join(' '),
      item.requiredActions.join(' '),
    ]
      .join(' ')
      .toLocaleLowerCase();

    if (query.trim() && !searchableText.includes(query.trim().toLocaleLowerCase())) {
      return false;
    }

    if (statusFilter !== 'all' && item.status !== statusFilter) {
      return false;
    }

    if (provenanceFilter !== 'all' && item.provenance !== provenanceFilter) {
      return false;
    }

    if (sourceTypeFilter !== 'all' && item.proposedSourceType !== sourceTypeFilter) {
      return false;
    }

    if (priorityFilter !== 'all' && item.reviewPriority !== priorityFilter) {
      return false;
    }

    return true;
  });

  return (
    <section className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Corpus ingestion</p>
        <h1>Seed Queue</h1>
        <p>Review curated leads and discovery saves before treating them as trusted research sources.</p>
      </header>

      {error && <p className="form-error">{error}</p>}

      <div className="search-summary">
        <article>
          <span>Seed packs</span>
          <strong>{seedPacks.length}</strong>
        </article>
        <article>
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </article>
        <article>
          <span>Approved</span>
          <strong>{approvedCount}</strong>
        </article>
      </div>

      <section className="panel">
        <h2>Seed Packs</h2>
        <div className="seed-pack-grid">
          {seedPacks.map((pack) => (
            <article className="seed-pack" key={pack.id}>
              <h3>{pack.name}</h3>
              <p>{pack.description}</p>
              <p className="muted">{pack.sourceIds.length} canonical sources</p>
              <ul>
                {pack.querySeeds.map((seedQuery) => (
                  <li key={seedQuery}>{seedQuery}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="filter-panel">
        <label>
          Search queue
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by title, domain, notes, or summary"
          />
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
            <option value="all">All status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <label>
          Provenance
          <select
            value={provenanceFilter}
            onChange={(event) => setProvenanceFilter(event.target.value as ProvenanceFilter)}
          >
            <option value="all">All provenance</option>
            <option value="curated seed">Curated seed</option>
            <option value="discovery search">Discovery search</option>
          </select>
        </label>
        <label>
          Source class
          <select
            value={sourceTypeFilter}
            onChange={(event) => setSourceTypeFilter(event.target.value as typeof sourceTypeFilter)}
          >
            <option value="all">All classes</option>
            {sourceClassifications.map((sourceType) => (
              <option key={sourceType} value={sourceType}>
                {sourceType}
              </option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as PriorityFilter)}>
            <option value="all">All priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
      </section>

      <section className="source-list">
        {filteredQueueItems.map((item) => (
          <article className="source-card review-card" key={item.id}>
            <div>
              <div className="result-meta">
                <span className="tag">{item.status}</span>
                <span className="tag">{item.proposedSourceType}</span>
                <span className="tag">{item.provenance}</span>
                <span className="tag">{item.reviewPriority} priority</span>
              </div>
              <h2>{item.title}</h2>
              <p className="muted">
                {item.domain} - confidence {item.confidenceLevel} - discovered{' '}
                {new Date(item.discoveredAt).toLocaleDateString()}
                {item.reviewedAt ? ` - reviewed ${new Date(item.reviewedAt).toLocaleDateString()}` : ''}
              </p>
            </div>
            <p>{item.summary}</p>
            <p className="notes">{item.citationNotes}</p>
            {item.qualityFlags.length > 0 && (
              <div className="review-detail-block">
                <h3>Quality Flags</h3>
                <ul>
                  {item.qualityFlags.map((flag) => (
                    <li key={flag}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}
            {item.requiredActions.length > 0 && (
              <div className="review-detail-block">
                <h3>Required Review Actions</h3>
                <ul>
                  {item.requiredActions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
            {item.reviewerNotes && <p className="muted">Reviewer notes: {item.reviewerNotes}</p>}
            <div className="review-actions">
              <button type="button" onClick={() => updateStatus(item.id, 'approved')}>
                <Check aria-hidden="true" />
                Approve
              </button>
              <button type="button" onClick={() => updateStatus(item.id, 'rejected')}>
                <X aria-hidden="true" />
                Reject
              </button>
              <a href={item.url} target="_blank" rel="noreferrer">
                Open source <ExternalLink aria-hidden="true" />
              </a>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
