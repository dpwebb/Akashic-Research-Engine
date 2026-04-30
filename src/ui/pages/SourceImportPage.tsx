import { FormEvent, useEffect, useState } from 'react';
import { ExternalLink, Import, Plus } from 'lucide-react';
import type { IngestionJob, SourceImportPreview } from '../../shared/types.js';

export function SourceImportPage() {
  const [url, setUrl] = useState('https://www.britannica.com/topic/Akashic-record');
  const [preview, setPreview] = useState<SourceImportPreview | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isQueuing, setIsQueuing] = useState(false);
  const [ingestionJobs, setIngestionJobs] = useState<IngestionJob[]>([]);

  useEffect(() => {
    void loadIngestionJobs();
  }, []);

  async function loadIngestionJobs() {
    const response = await fetch('/api/ingestion-jobs');
    if (response.ok) {
      setIngestionJobs(await response.json());
    }
  }

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
          reviewPriority:
            preview.citationStatus === 'needs review' || preview.proposedSourceType === 'commercial' || preview.proposedSourceType === 'low-quality'
              ? 'high'
              : preview.fullTextCandidate
                ? 'medium'
                : 'low',
          citationNotes: preview.citationNotes,
          qualityFlags: preview.qualityFlags,
          requiredActions: [
            'Verify author, date, publisher, and stable URL',
            preview.fullTextCandidate ? 'Queue or complete full-text extraction' : 'Confirm whether full text is available elsewhere',
            'Record claim-level citation boundaries before promotion',
          ],
          reviewerNotes: preview.textExcerpt
            ? [
                `Import metadata: ${preview.wordCount.toLocaleString()} words, ${preview.characterCount.toLocaleString()} characters, citation ${preview.citationStatus}, author ${preview.detectedAuthor || 'pending'}, date ${preview.detectedDate || 'pending'}.`,
                `Quality flags: ${preview.qualityFlags.join(' | ') || 'none'}.`,
                `Import excerpt captured for review: ${preview.textExcerpt.slice(0, 500)}`,
              ].join('\n')
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

  async function queueFullTextExtraction() {
    if (!preview) {
      return;
    }

    setError('');
    setMessage('');
    setIsQueuing(true);

    try {
      const response = await fetch('/api/ingestion-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: preview.url,
          domain: preview.domain,
          title: preview.title,
          sourceType: preview.proposedSourceType,
          citationStatus: preview.citationStatus,
          wordCount: preview.wordCount,
          fullTextCandidate: preview.fullTextCandidate,
          qualityFlags: preview.qualityFlags,
          extractionNotes: [
            `Content type: ${preview.contentType}.`,
            `Detected author: ${preview.detectedAuthor || 'pending review'}.`,
            `Detected date: ${preview.detectedDate || 'pending review'}.`,
            preview.fullTextCandidate ? 'Preview marked as a full-text candidate.' : 'Preview did not meet full-text candidate thresholds.',
          ].join(' '),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Could not queue full-text extraction.');
      }

      setIngestionJobs((current) => {
        const withoutDuplicate = current.filter((job) => job.id !== data.id && job.url !== data.url);
        return [data, ...withoutDuplicate];
      });
      setMessage('Full-text extraction job queued.');
    } catch (queueError) {
      setError(queueError instanceof Error ? queueError.message : 'Could not queue full-text extraction.');
    } finally {
      setIsQueuing(false);
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
              <span className="tag">{preview.citationStatus}</span>
              {preview.fullTextCandidate && <span className="tag">full-text candidate</span>}
            </div>
            <h2>{preview.title}</h2>
            <p className="muted">{preview.domain}</p>
          </div>
          <p>{preview.description}</p>
          <p className="notes">{preview.citationNotes}</p>
          <div className="import-metadata-grid">
            <MetadataItem label="Content type" value={preview.contentType} />
            <MetadataItem label="Detected author" value={preview.detectedAuthor || 'pending review'} />
            <MetadataItem label="Detected date" value={preview.detectedDate || 'pending review'} />
            <MetadataItem label="Words" value={preview.wordCount.toLocaleString()} />
            <MetadataItem label="Characters" value={preview.characterCount.toLocaleString()} />
          </div>
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
          {preview.qualityFlags.length > 0 && (
            <div className="panel compact-panel">
              <h3>Quality Flags</h3>
              <ul className="rule-list">
                {preview.qualityFlags.map((flag) => (
                  <li key={flag}>{flag}</li>
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
            <button type="button" onClick={queueFullTextExtraction} disabled={isQueuing || preview.extractionStatus === 'failed'}>
              <Import aria-hidden="true" />
              {isQueuing ? 'Queueing...' : 'Queue Full Text'}
            </button>
            <a href={preview.url} target="_blank" rel="noreferrer">
              Open source <ExternalLink aria-hidden="true" />
            </a>
          </div>
        </article>
      )}

      <section className="panel import-queue-panel">
        <h2>Full-Text Extraction Queue</h2>
        {ingestionJobs.length === 0 ? (
          <p className="muted">No extraction jobs have been queued in this session.</p>
        ) : (
          <div className="source-list">
            {ingestionJobs.map((job) => (
              <article className="index-card compact-panel" key={job.id}>
                <div className="result-meta">
                  <span className="tag">{job.status}</span>
                  <span className="tag">{job.sourceType}</span>
                  <span className="tag">{job.citationStatus}</span>
                  {job.fullTextCandidate && <span className="tag">full text</span>}
                </div>
                <h3>{job.title}</h3>
                <p className="muted">
                  {job.domain} - {job.wordCount.toLocaleString()} preview words
                </p>
                <p>{job.extractionNotes}</p>
                {job.qualityFlags.length > 0 && <p className="notes">{job.qualityFlags.join(' ')}</p>}
                <a href={job.url} target="_blank" rel="noreferrer">
                  Open source <ExternalLink aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
