import { AlertTriangle, BookOpenCheck, Database, FileSearch, Inbox, ScrollText } from 'lucide-react';
import { researchDataset } from '../../shared/researchData.js';
import { seedReviewQueue } from '../../shared/seedData.js';
import { evidenceGrades, guardrailRules, sourceClassifications } from '../../shared/taxonomy.js';

export function Dashboard() {
  const sourceCount = researchDataset.sources.length;
  const claimCount = researchDataset.claims.length;
  const speculativeCount = researchDataset.claims.filter((claim) => claim.evidenceGrade === 'E').length;
  const primarySourceCount = researchDataset.sources.filter((source) => source.sourceType === 'primary esoteric').length;
  const publicDomainCount = researchDataset.index.bibliography.filter(
    (record) => record.rightsStatus === 'public domain',
  ).length;
  const pendingReviewCount = seedReviewQueue.filter((item) => item.status === 'pending').length;

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
        <Metric icon={ScrollText} label="Index records" value={getIndexRecordCount()} />
        <Metric icon={Inbox} label="Pending review" value={pendingReviewCount} />
        <Metric icon={AlertTriangle} label="Speculative claims" value={speculativeCount} />
      </div>

      <section className="panel">
        <h2>Corpus Health</h2>
        <div className="health-grid">
          <HealthStat label="Primary esoteric sources" value={primarySourceCount} total={sourceCount} />
          <HealthStat label="Public-domain bibliography" value={publicDomainCount} total={researchDataset.index.bibliography.length} />
          <HealthStat label="Claims requiring citation" value={researchDataset.claims.filter((claim) => claim.citationRequired).length} total={claimCount} />
        </div>
      </section>

      <section className="panel">
        <h2>Source Classes</h2>
        <div className="distribution-grid">
          {sourceClassifications.map((classification) => {
            const count = researchDataset.sources.filter((source) => source.sourceType === classification).length;
            return <DistributionBar key={classification} label={classification} value={count} total={sourceCount} />;
          })}
        </div>
      </section>

      <section className="panel">
        <h2>Evidence Grades</h2>
        <div className="grade-grid">
          {evidenceGrades.map((grade) => {
            const count = researchDataset.claims.filter((claim) => claim.evidenceGrade === grade.grade).length;
            return (
              <article key={grade.grade} className="grade-card">
                <strong>{grade.grade}</strong>
                <span>
                  {grade.label} ({count})
                </span>
              </article>
            );
          })}
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

function HealthStat({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <article className="health-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{percentage}%</small>
    </article>
  );
}

function DistributionBar({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <article className="distribution-row">
      <span>{label}</span>
      <div aria-hidden="true">
        <i style={{ width: `${percentage}%` }} />
      </div>
      <strong>{value}</strong>
    </article>
  );
}

function getIndexRecordCount() {
  return (
    researchDataset.index.people.length +
    researchDataset.index.movements.length +
    researchDataset.index.terms.length +
    researchDataset.index.timeline.length +
    researchDataset.index.bibliography.length
  );
}
