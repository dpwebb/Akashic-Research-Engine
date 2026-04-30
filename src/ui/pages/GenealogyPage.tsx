import { researchDataset } from '../../shared/researchData.js';

export function GenealogyPage() {
  return (
    <section className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Concept evolution</p>
        <h1>Genealogy Map</h1>
        <p>Visualizes cautious relationships across traditions, movements, and later interpretations.</p>
      </header>

      <div className="timeline">
        {researchDataset.genealogy.nodes.map((node) => (
          <article className="timeline-node" key={node.id}>
            <span>{node.period}</span>
            <h2>{node.label}</h2>
            <p>{node.description}</p>
            <small>{node.category}</small>
          </article>
        ))}
      </div>

      <section className="panel">
        <h2>Relationship Notes</h2>
        <div className="edge-list">
          {researchDataset.genealogy.edges.map((edge) => (
            <article key={`${edge.from}-${edge.to}`}>
              <strong>
                {labelFor(edge.from)} → {labelFor(edge.to)}
              </strong>
              <span>{edge.label}</span>
              <small>confidence {edge.confidence}</small>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function labelFor(id: string) {
  return researchDataset.genealogy.nodes.find((node) => node.id === id)?.label ?? id;
}
