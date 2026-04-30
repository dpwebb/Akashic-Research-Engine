import { FormEvent, useState } from 'react';
import { ExternalLink, Import, Plus } from 'lucide-react';
import type { SourceImportPreview } from '../../shared/types.js';

export function SourceImportPage() {
  const [url, setUrl] = useState('https://www.britannica.com/topic/Akashic-record');
  const [preview, setPreview] = useState<SourceImportPreview | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isPreviewing, setIsPreviewing] = useState(false);

  async function previewSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setPreview(null);
    setIsPreviewing(true);

    try {
      const response = await fetch('/api/source-import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Source preview failed.');
      }

      setPreview(data);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : 'Source preview failed.');
    } finally {
      setIsPreviewing(false);
    }
  }

  async function sendToReview() {
    if (!preview) {
      return;
    }

    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/review-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: preview.title,
          url: preview.url,
          domain: preview.domain,
          proposedSourceType: preview.proposedSourceType,
          summary: preview.description,
          confidenceLevel: preview.confidenceLevel,
          citationNotes: preview.citationNotes,
          reviewerNotes: preview.textExcerpt
            ? `Import excerpt captured for review: ${preview.textExcerpt.slice(0, 500)}`
            : 'No text excerpt captured.',
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Could not send source to review.');
      }

      setMessage('Source sent to review queue.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not send source to review.');
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Source ingestion</p>
        <h1>Import Preview</h1>
        <p>Inspect a source URL, extract citation hints, and queue it for review before promotion.</p>
      </header>

      <form className="assistant-form discovery-form" onSubmit={previewSource}>
        <label>
          Source URL
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/source"
          />
        </label>
        <button type="submit" disabled={isPreviewing || url.trim().length < 3}>
          <Import aria-hidden="true" />
          {isPreviewing ? 'Previewing...' : 'Preview Source'}
        </button>
        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-success">{message}</p>}
      </form>

      {preview && (
        <article className="source-card import-preview-card">
          <div>
            <div className="result-meta">
              <span className="tag">{preview.extractionStatus}</span>
              <span className="tag">{preview.proposedSourceType}</span>
              <span className="tag">{preview.confidenceLevel}</span>
            </div>
            <h2>{preview.title}</h2>
            <p className="muted">{preview.domain}</p>
          </div>
          <p>{preview.description}</p>
          <p className="notes">{preview.citationNotes}</p>
          {preview.warnings.length > 0 && (
            <div className="panel compact-panel">
              <h3>Warnings</h3>
              <ul className="rule-list">
                {preview.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
          {preview.textExcerpt && (
            <div className="assistant-output import-excerpt">
              <h3>Text Excerpt</h3>
              <pre>{preview.textExcerpt}</pre>
            </div>
          )}
          <div className="review-actions">
            <button type="button" onClick={sendToReview}>
              <Plus aria-hidden="true" />
              Send to Review
            </button>
            <a href={preview.url} target="_blank" rel="noreferrer">
              Open source <ExternalLink aria-hidden="true" />
            </a>
          </div>
        </article>
      )}
    </section>
  );
}
