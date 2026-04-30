import { AlertTriangle, BookOpenCheck, Database, FileSearch } from 'lucide-react';
import { researchDataset } from '../../shared/researchData.js';
import { evidenceGrades, guardrailRules } from '../../shared/taxonomy.js';

export function Dashboard() {
  const sourceCount = researchDataset.sources.length;
  const claimCount = researchDataset.claims.length;
  const speculativeCount = researchDataset.claims.filter((claim) => claim.evidenceGrade === 'E').length;

  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">Third-person research workspace</p>
        <h1>Akashic Research Engine</h1>
        <p>
          Study Akashic Records concepts as historical, esoteric, comparative, psychological, and speculative
          information models without presenting unverifiable claims as fact.
        </p>
      </header>

      <div className="metric-grid">
        <Metric icon={Database} label="Seeded sources" value={sourceCount} />
        <Metric icon={BookOpenCheck} label="Extracted claims" value={claimCount} />
        <Metric icon={FileSearch} label="Genealogy nodes" value={researchDataset.genealogy.nodes.length} />
        <Metric icon={AlertTriangle} label="Speculative claims" value={speculativeCount} />
      </div>

      <section className="panel">
        <h2>Evidence Grades</h2>
        <div className="grade-grid">
          {evidenceGrades.map((grade) => (
            <article key={grade.grade} className="grade-card">
              <strong>{grade.grade}</strong>
              <span>{grade.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Research Guardrails</h2>
        <ul className="rule-list">
          {guardrailRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>
    </section>
  );
}

type MetricProps = {
  icon: typeof Database;
  label: string;
  value: number;
};

function Metric({ icon: Icon, label, value }: MetricProps) {
  return (
    <article className="metric">
      <Icon aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
