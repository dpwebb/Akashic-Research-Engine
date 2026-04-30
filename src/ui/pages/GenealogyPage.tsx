import { useMemo, useState } from 'react';
import { researchDataset } from '../../shared/researchData.js';
import type { GenealogyEdge } from '../../shared/types.js';

type ConfidenceFilter = 'all' | GenealogyEdge['confidence'];
type RelationshipKindFilter = 'all' | GenealogyEdge['relationshipKind'];

const relationshipKinds: GenealogyEdge['relationshipKind'][] = [
  'term inheritance',
  'doctrinal influence',
  'reinterpretation',
  'parallel concept',
  'disputed link',
];

function includesQuery(values: Array<string | string[]>, query: string): boolean {
  return values.flat().join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase());
}

export function GenealogyPage() {
  const [query, setQuery] = useState('');
  const [confidence, setConfidence] = useState<ConfidenceFilter>('all');
  const [category, setCategory] = useState('all');
  const [relationshipKind, setRelationshipKind] = useState<RelationshipKindFilter>('all');
  const normalizedQuery = query.trim();
  const categories = [...new Set(researchDataset.genealogy.nodes.map((node) => node.category))].sort();

  const filteredNodes = useMemo(
    () =>
      researchDataset.genealogy.nodes.filter((node) => {
        if (category !== 'all' && node.category !== category) {
          return false;
        }

        return includesQuery([node.label, node.period, node.category, node.description], normalizedQuery);
      }),
    [category, normalizedQuery],
  );

  const filteredEdges = useMemo(
    () =>
      researchDataset.genealogy.edges.filter((edge) => {
        const fromNode = getNode(edge.from);
        const toNode = getNode(edge.to);

        if (confidence !== 'all' && edge.confidence !== confidence) {
          return false;
        }

        if (relationshipKind !== 'all' && edge.relationshipKind !== relationshipKind) {
          return false;
        }

        if (category !== 'all' && fromNode?.category !== category && toNode?.category !== category) {
          return false;
        }

        return includesQuery(
          [
            edge.label,
            edge.relationshipKind,
            edge.confidence,
            edge.sourceIds,
            edge.auditNote,
            fromNode?.label ?? edge.from,
            toNode?.label ?? edge.to,
          ],
          normalizedQuery,
        );
      }),
    [category, confidence, normalizedQuery, relationshipKind],
  );

  return (
    <section className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Concept evolution</p>
        <h1>Genealogy Map</h1>
        <p>Visualizes cautious relationships across traditions, movements, and later interpretations.</p>
      </header>

      <section className="filter-panel genealogy-filter-panel">
        <label>
          Search genealogy
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by node, relation, source, or audit note"
          />
        </label>
        <label>
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          Relationship
          <select
            value={relationshipKind}
            onChange={(event) => setRelationshipKind(event.target.value as RelationshipKindFilter)}
          >
            <option value="all">All relationships</option>
            {relationshipKinds.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
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
      </section>

      <div className="timeline">
        {filteredNodes.map((node) => (
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
          {filteredEdges.map((edge) => (
            <article key={`${edge.from}-${edge.to}`}>
              <div className="result-meta">
                <span className="tag">{edge.relationshipKind}</span>
                <span className="tag">{edge.confidence}</span>
              </div>
              <strong>
                {labelFor(edge.from)} - {labelFor(edge.to)}
              </strong>
              <span>{edge.label}</span>
              <small>Sources: {edge.sourceIds.join(', ')}</small>
              <p className="notes">{edge.auditNote}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function getNode(id: string) {
  return researchDataset.genealogy.nodes.find((node) => node.id === id);
}

function labelFor(id: string) {
  return getNode(id)?.label ?? id;
}
