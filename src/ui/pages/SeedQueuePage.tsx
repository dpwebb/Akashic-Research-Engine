import { useEffect, useState } from 'react';
import { Check, ExternalLink, X } from 'lucide-react';
import type { ReviewQueueItem, SeedPack } from '../../shared/types.js';

export function SeedQueuePage() {
  const [seedPacks, setSeedPacks] = useState<SeedPack[]>([]);
  const [queueItems, setQueueItems] = useState<ReviewQueueItem[]>([]);
  const [error, setError] = useState('');

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
                {pack.querySeeds.map((query) => (
                  <li key={query}>{query}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="source-list">
        {queueItems.map((item) => (
          <article className="source-card review-card" key={item.id}>
            <div>
              <div className="result-meta">
                <span className="tag">{item.status}</span>
                <span className="tag">{item.proposedSourceType}</span>
                <span className="tag">{item.provenance}</span>
              </div>
              <h2>{item.title}</h2>
              <p className="muted">
                {item.domain} · confidence {item.confidenceLevel} · discovered{' '}
                {new Date(item.discoveredAt).toLocaleDateString()}
              </p>
            </div>
            <p>{item.summary}</p>
            <p className="notes">{item.citationNotes}</p>
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
