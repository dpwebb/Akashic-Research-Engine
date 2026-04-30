import { Sparkles } from 'lucide-react';
import { researchDataset } from '../../shared/researchData.js';

export function AdditionBuilderPage() {
  return (
    <section className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Realistic Addition Builder</p>
        <h1>Disciplined Speculation</h1>
        <p>New interpretations are useful only when boundaries, citations, and uncertainty are explicit.</p>
      </header>

      <div className="framework-grid">
        {researchDataset.additionFrameworks.map((framework) => (
          <article className="framework-card" key={framework.id}>
            <Sparkles aria-hidden="true" />
            <h2>{framework.name}</h2>
            <p>{framework.description}</p>
            <ul>
              {framework.requiredBoundaries.map((boundary) => (
                <li key={boundary}>{boundary}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
