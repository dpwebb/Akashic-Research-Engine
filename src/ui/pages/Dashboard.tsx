import { AlertTriangle, BookOpenCheck, Database, ExternalLink, FileSearch, Inbox, ScrollText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { researchDataset } from '../../shared/researchData.js';
import { evidenceGrades, guardrailRules, sourceClassifications } from '../../shared/taxonomy.js';

type RuntimeSummary = {
  reviewQueue: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
  };
  ingestionJobs: {
    total: number;
    queued: number;
    running: number;
    completed: number;
    failed: number;
  };
  backups: {
    backupDirectory: string;
    intervalMs: number;
    pendingChanges: boolean;
    latestBackupAt?: string;
  };
};


type OnlineSignalsResponse = {
  fetchedAt: string;
  topics: string[];
  signals: Array<{
    query: string;
    title: string;
    snippet: string;
    pageUrl: string;
    timestamp: string;
  }>;
};

const emptyRuntimeSummary: RuntimeSummary = {
  reviewQueue: {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
  },
  ingestionJobs: {
    total: 0,
    queued: 0,
    running: 0,
    completed: 0,
    failed: 0,
  },
  backups: {
    backupDirectory: '',
    intervalMs: 3_600_000,
    pendingChanges: false,
  },
};

export function Dashboard() {
  const [runtimeSummary, setRuntimeSummary] = useState<RuntimeSummary>(emptyRuntimeSummary);
  const [onlineSignals, setOnlineSignals] = useState<OnlineSignalsResponse | null>(null);
  const sourceCount = researchDataset.sources.length;
  const claimCount = researchDataset.claims.length;
  const speculativeCount = researchDataset.claims.filter((claim) => claim.evidenceGrade === 'E').length;
  const primarySourceCount = researchDataset.sources.filter((source) => source.sourceType === 'primary esoteric').length;
  const publicDomainCount = researchDataset.index.bibliography.filter(
    (record) => record.rightsStatus === 'public domain',
  ).length;
  const citationReviewCount = researchDataset.index.bibliography.filter(
    (record) => record.citationStatus === 'needs review',
  ).length;

  useEffect(() => {
    async function loadDashboardData() {
      const [summaryResponse, signalsResponse] = await Promise.all([
        fetch('/api/runtime-summary'),
        fetch('/api/online/signals'),
      ]);

      if (summaryResponse.ok) {
        const summary = (await summaryResponse.json()) as RuntimeSummary;
        setRuntimeSummary(summary);
      }

      if (signalsResponse.ok) {
        const signals = (await signalsResponse.json()) as OnlineSignalsResponse;
        setOnlineSignals(signals);
      }
    }

    void loadDashboardData();
  }, []);

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
        <Metric icon={Inbox} label="Pending review" value={runtimeSummary.reviewQueue.pending} />
        <Metric icon={AlertTriangle} label="Speculative claims" value={speculativeCount} />
      </div>

      <section className="panel">
        <h2>Corpus Health</h2>
        <div className="health-grid">
          <HealthStat label="Primary esoteric sources" value={primarySourceCount} total={sourceCount} />
          <HealthStat label="Public-domain bibliography" value={publicDomainCount} total={researchDataset.index.bibliography.length} />
          <HealthStat label="Bibliography needing citation review" value={citationReviewCount} total={researchDataset.index.bibliography.length} />
          <HealthStat label="Claims requiring citation" value={researchDataset.claims.filter((claim) => claim.citationRequired).length} total={claimCount} />
        </div>
      </section>

      <section className="panel">
        <h2>Review Operations</h2>
        <div className="health-grid">
          <HealthStat
            label="High-priority review items"
            value={runtimeSummary.reviewQueue.highPriority}
            total={Math.max(runtimeSummary.reviewQueue.total, 1)}
          />
          <HealthStat
            label="Queued full-text jobs"
            value={runtimeSummary.ingestionJobs.queued}
            total={Math.max(runtimeSummary.ingestionJobs.total, 1)}
          />
          <HealthStat
            label="Approved review items"
            value={runtimeSummary.reviewQueue.approved}
            total={Math.max(runtimeSummary.reviewQueue.total, 1)}
          />
          <HealthStat
            label="Failed ingestion jobs"
            value={runtimeSummary.ingestionJobs.failed}
            total={Math.max(runtimeSummary.ingestionJobs.total, 1)}
          />
        </div>
      </section>

      <section className="panel">
        <h2>Backup Operations</h2>
        <div className="backup-status-grid">
          <article>
            <span>Interval</span>
            <strong>{formatDuration(runtimeSummary.backups.intervalMs)}</strong>
          </article>
          <article>
            <span>Pending changes</span>
            <strong>{runtimeSummary.backups.pendingChanges ? 'Yes' : 'No'}</strong>
          </article>
          <article>
            <span>Latest backup</span>
            <strong>{formatOptionalDate(runtimeSummary.backups.latestBackupAt)}</strong>
          </article>
          <article>
            <span>Backup path</span>
            <strong>{runtimeSummary.backups.backupDirectory || 'runtime-data/backups'}</strong>
          </article>
        </div>
      </section>


      <section className="panel">
        <h2>Online Research Signals</h2>
        <p className="muted-text">Recent Wikipedia entries related to active Akashic research topics.</p>
        <div className="rule-list">
          {(onlineSignals?.signals ?? []).slice(0, 6).map((signal) => (
            <article key={`${signal.query}-${signal.title}`} className="distribution-row">
              <span>
                <strong>{signal.title}</strong> · {signal.query}
                <br />
                <small>{signal.snippet}</small>
              </span>
              <a href={signal.pageUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={16} aria-hidden="true" />
              </a>
            </article>
          ))}
          {onlineSignals?.signals?.length === 0 ? <li>No online signals available right now.</li> : null}
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

function formatDuration(milliseconds: number): string {
  const minutes = Math.round(milliseconds / 60_000);
  if (minutes >= 60 && minutes % 60 === 0) {
    return `${minutes / 60}h`;
  }

  return `${minutes}m`;
}

function formatOptionalDate(value?: string): string {
  return value ? new Date(value).toLocaleString() : 'none yet';
}

function getIndexRecordCount() {
  return (
    researchDataset.index.people.length +
    researchDataset.index.movements.length +
    researchDataset.index.terms.length +
    researchDataset.index.comparativeConcepts.length +
    researchDataset.index.timeline.length +
    researchDataset.index.bibliography.length
  );
}
