import { Clipboard, Download, FileText, Loader2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import type { ExportDeliverable, ExportDeliverableType } from '../../shared/types.js';

const exportOptions: Array<{ type: ExportDeliverableType; label: string; description: string }> = [
  {
    type: 'citation-packet',
    label: 'Citation Packet',
    description: 'Citation notes for corpus sources with stable URLs and source classifications.',
  },
  {
    type: 'contradiction-report',
    label: 'Contradiction Report',
    description: 'Claims with weak, speculative, or disputed evidence boundaries.',
  },
  {
    type: 'source-review-dossier',
    label: 'Source Review Dossier',
    description: 'Review queue status, priorities, duplicate flags, and citation notes.',
  },
  {
    type: 'genealogy-summary',
    label: 'Genealogy Summary',
    description: 'Concept lineage nodes and edges with confidence labels.',
  },
  {
    type: 'bibliography-export',
    label: 'Bibliography Export',
    description: 'Bibliographic records formatted as a portable markdown list.',
  },
];

export function ExportsPage() {
  const [deliverables, setDeliverables] = useState<ExportDeliverable[]>([]);
  const [type, setType] = useState<ExportDeliverableType>('citation-packet');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [activeDeliverable, setActiveDeliverable] = useState<ExportDeliverable | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copyMessage, setCopyMessage] = useState('');

  useEffect(() => {
    async function loadExports() {
      const response = await fetch('/api/exports');
      if (response.ok) {
        const data = (await response.json()) as ExportDeliverable[];
        setDeliverables(data);
        setActiveDeliverable(data[0] ?? null);
      }
    }

    void loadExports();
  }, []);

  async function generateExport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsGenerating(true);

    try {
      const response = await fetch('/api/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: title.trim() || undefined,
          createdByEmail: email.trim() || undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Export could not be generated.');
      }

      setDeliverables((current) => [data, ...current]);
      setActiveDeliverable(data);
      setTitle('');
      setCopyMessage('');
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Export could not be generated.');
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyActiveExport() {
    if (!activeDeliverable) {
      return;
    }

    try {
      await navigator.clipboard.writeText(activeDeliverable.content);
      setCopyMessage('Export copied.');
    } catch {
      setCopyMessage('Copy failed; select the preview text manually.');
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Paid deliverables</p>
        <h1>Research Exports</h1>
        <p>Generate citation packets, review dossiers, contradiction reports, genealogy summaries, and bibliography exports.</p>
      </header>

      <form className="assistant-form export-form" onSubmit={generateExport}>
        <label>
          Deliverable
          <select value={type} onChange={(event) => setType(event.target.value as ExportDeliverableType)}>
            {exportOptions.map((option) => (
              <option key={option.type} value={option.type}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Optional custom title" />
        </label>
        <label>
          Account email
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="researcher@example.com" type="email" />
        </label>
        <button type="submit" disabled={isGenerating}>
          {isGenerating ? <Loader2 aria-hidden="true" /> : <Download aria-hidden="true" />}
          {isGenerating ? 'Generating...' : 'Generate Export'}
        </button>
        {error && <p className="form-error">{error}</p>}
      </form>

      <div className="export-layout">
        <section className="source-list">
          {exportOptions.map((option) => (
            <article className="index-card compact-panel" key={option.type}>
              <FileText aria-hidden="true" />
              <h2>{option.label}</h2>
              <p>{option.description}</p>
            </article>
          ))}
          {deliverables.map((deliverable) => (
            <button
              className={activeDeliverable?.id === deliverable.id ? 'export-row active' : 'export-row'}
              key={deliverable.id}
              type="button"
              onClick={() => setActiveDeliverable(deliverable)}
            >
              <span>{deliverable.title}</span>
              <small>{new Date(deliverable.createdAt).toLocaleString()}</small>
            </button>
          ))}
        </section>

        <section className="assistant-output export-preview">
          <div className="export-preview-header">
            <div>
              <h2>{activeDeliverable?.title ?? 'No Export Selected'}</h2>
              {activeDeliverable && (
                <p className="muted">
                  {activeDeliverable.type} - generated {new Date(activeDeliverable.createdAt).toLocaleString()}
                </p>
              )}
            </div>
            {activeDeliverable && (
              <div className="review-actions">
                <button type="button" onClick={copyActiveExport}>
                  <Clipboard aria-hidden="true" />
                  Copy
                </button>
                <a
                  href={`data:text/markdown;charset=utf-8,${encodeURIComponent(activeDeliverable.content)}`}
                  download={`${slugify(activeDeliverable.title)}.md`}
                >
                  <Download aria-hidden="true" />
                  Download
                </a>
              </div>
            )}
          </div>
          {copyMessage && <p className="form-success">{copyMessage}</p>}
          <pre>{activeDeliverable?.content ?? 'Generate an export to preview the markdown deliverable.'}</pre>
        </section>
      </div>
    </section>
  );
}

function slugify(value: string): string {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'research-export';
}
