import { ExternalLink } from 'lucide-react';
import { researchDataset } from '../../shared/researchData.js';

export function SourcesPage() {
  return (
    <section className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Citation database</p>
        <h1>Sources</h1>
        <p>Each source is classified before claims are extracted or compared.</p>
      </header>

      <div className="source-list">
        {researchDataset.sources.map((source) => (
          <article className="source-card" key={source.id}>
            <div>
              <span className="tag">{source.sourceType}</span>
              <h2>{source.title}</h2>
              <p className="muted">
                {source.author} · {source.date} · confidence {source.confidenceLevel}
              </p>
            </div>
            <p>{source.summary}</p>
            <p className="notes">{source.citationNotes}</p>
            <a href={source.url} target="_blank" rel="noreferrer">
              Open source <ExternalLink aria-hidden="true" />
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
