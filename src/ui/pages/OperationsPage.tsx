import { AlertTriangle, CalendarDays, CheckCircle2, Database, GitMerge, HardDrive, Inbox, RotateCw, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { IngestionJob, LaunchSchedulePhase, PromotedSource, ReviewQueueItem } from '../../shared/types.js';

type OperationsOverview = {
  persistenceMode: 'postgres' | 'json';
  backup: {
    backupDirectory: string;
    intervalMs: number;
    pendingChanges: boolean;
    latestBackupAt?: string;
  };
  reviewQueue: {
    total: number;
    pending: number;
    reviewed: number;
    approved: number;
    promoted: number;
    rejected: number;
    highPriority: number;
    duplicateConflicts: number;
    stalePending: number;
    needsPromotion: number;
    citationComplete: number;
    citationPartial: number;
    citationNeedsReview: number;
    releaseResourceMinimum: number;
    releaseResourceCount: number;
    seedReviewAutomationEnabled: boolean;
    autoPromotedSeedItems: number;
    nextItems: ReviewQueueItem[];
  };
  ingestionJobs: {
    total: number;
    queued: number;
    running: number;
    completed: number;
    failed: number;
    stalled: number;
    fullTextCandidates: number;
    duplicateConflicts: number;
    nextJobs: IngestionJob[];
  };
  promotedSources: {
    total: number;
    latest: PromotedSource[];
  };
  launchSchedule: {
    updatedAt: string;
    currentPhase?: LaunchSchedulePhase;
    nextPhase?: LaunchSchedulePhase;
    completed: number;
    inProgress: number;
    scheduled: number;
    phases: LaunchSchedulePhase[];
  };
  revenue: {
    accounts: number;
    activeAccounts: number;
    generatedExports: number;
    speculativeAdditionDrafts: number;
    monthlyRecurringRevenueCents: number;
    planMix: Array<{ planId: string; name: string; accounts: number }>;
  };
  actionItems: string[];
};

export function OperationsPage() {
  const [overview, setOverview] = useState<OperationsOverview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOperations() {
      try {
        const response = await fetch('/api/operations/command-center');
        if (!response.ok) {
          throw new Error('Operations command center could not be loaded.');
        }
        setOverview(await response.json());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Operations command center could not be loaded.');
      }
    }

    void loadOperations();
  }, []);

  if (!overview) {
    return (
      <section className="page-stack">
        <header className="page-header compact">
          <p className="eyebrow">Operations</p>
          <h1>Command Center</h1>
          <p>{error || 'Loading operational health, revenue, and workflow queues.'}</p>
        </header>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Operations</p>
        <h1>Command Center</h1>
        <p>Monitor persistence, review throughput, ingestion risk, corpus promotion, and monetization readiness.</p>
      </header>

      <div className="metric-grid">
        <Metric icon={Database} label="Persistence" value={overview.persistenceMode} />
        <Metric icon={Inbox} label="Pending review" value={overview.reviewQueue.pending} />
        <Metric icon={CheckCircle2} label="Promoted sources" value={overview.promotedSources.total} />
        <Metric icon={RotateCw} label="Queued jobs" value={overview.ingestionJobs.queued} />
        <Metric icon={AlertTriangle} label="Failed/stalled jobs" value={overview.ingestionJobs.failed + overview.ingestionJobs.stalled} />
        <Metric icon={TrendingUp} label="Active accounts" value={overview.revenue.activeAccounts} />
        <Metric icon={CalendarDays} label="Launch phases done" value={`${overview.launchSchedule.completed}/${overview.launchSchedule.phases.length}`} />
      </div>

      <section className="panel">
        <h2>Needs Action</h2>
        <ul className="rule-list">
          {overview.actionItems.length === 0 ? <li>No urgent operational actions.</li> : overview.actionItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="panel">
        <div className="export-preview-header">
          <div>
            <h2>Launch Schedule</h2>
            <p className="muted">
              Updated {overview.launchSchedule.updatedAt}. Current focus:{' '}
              {overview.launchSchedule.currentPhase?.phase ?? 'none assigned'}.
            </p>
          </div>
          {overview.launchSchedule.nextPhase && (
            <span className="tag">Next: {overview.launchSchedule.nextPhase.targetWindow}</span>
          )}
        </div>

        <div className="launch-schedule-list">
          {overview.launchSchedule.phases.map((phase) => (
            <article className={`launch-phase-card ${phase.status}`} key={phase.id}>
              <div>
                <span className="tag">{phase.status}</span>
                <small>{phase.targetWindow}</small>
              </div>
              <h3>{phase.phase}</h3>
              <p>{phase.objective}</p>
              <p className="matched-terms">Exit: {phase.exitCriteria}</p>
              <ul>
                {(phase.status === 'complete' ? phase.delivered : phase.nextActions).slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="ops-grid">
        <article className="panel">
          <h2>Review Workflow</h2>
          <div className="health-grid">
            <Health label="Reviewed" value={overview.reviewQueue.reviewed} />
            <Health label="Approved" value={overview.reviewQueue.approved} />
            <Health label="Needs promotion" value={overview.reviewQueue.needsPromotion} />
            <Health label="Duplicate conflicts" value={overview.reviewQueue.duplicateConflicts} />
            <Health label="Complete citations" value={overview.reviewQueue.citationComplete} />
            <Health label="Citation review" value={overview.reviewQueue.citationNeedsReview} />
            <Health label="Release floor" value={`${overview.reviewQueue.total}/${overview.reviewQueue.releaseResourceMinimum}`} />
            <Health label="Auto-promoted seeds" value={overview.reviewQueue.autoPromotedSeedItems} />
          </div>
        </article>

        <article className="panel">
          <h2>Ingestion Workflow</h2>
          <div className="health-grid">
            <Health label="Full-text candidates" value={overview.ingestionJobs.fullTextCandidates} />
            <Health label="Running" value={overview.ingestionJobs.running} />
            <Health label="Completed" value={overview.ingestionJobs.completed} />
            <Health label="Stalled" value={overview.ingestionJobs.stalled} />
          </div>
        </article>

        <article className="panel">
          <h2>Monetization</h2>
          <div className="health-grid">
            <Health label="Accounts" value={overview.revenue.accounts} />
            <Health label="Exports" value={overview.revenue.generatedExports} />
            <Health label="Speculative drafts" value={overview.revenue.speculativeAdditionDrafts} />
            <Health label="MRR" value={`$${(overview.revenue.monthlyRecurringRevenueCents / 100).toLocaleString()}`} />
          </div>
          <div className="distribution-grid">
            {overview.revenue.planMix.map((plan) => (
              <div className="distribution-row" key={plan.planId}>
                <span>{plan.name}</span>
                <div aria-hidden="true">
                  <i style={{ width: `${overview.revenue.accounts ? (plan.accounts / overview.revenue.accounts) * 100 : 0}%` }} />
                </div>
                <strong>{plan.accounts}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Persistence & Backups</h2>
          <div className="ops-status-line">
            <HardDrive aria-hidden="true" />
            <span>{overview.backup.backupDirectory}</span>
          </div>
          <p className="muted">
            Latest backup: {overview.backup.latestBackupAt ? new Date(overview.backup.latestBackupAt).toLocaleString() : 'none yet'}
          </p>
        </article>
      </section>

      <section className="source-list">
        {overview.reviewQueue.nextItems.map((item) => (
          <article className="source-card review-card" key={item.id}>
            <div className="result-meta">
              <span className="tag">{item.status}</span>
              <span className="tag">{item.reviewPriority} priority</span>
              {item.duplicateCandidates?.length ? <span className="tag"><GitMerge aria-hidden="true" /> duplicate</span> : null}
            </div>
            <h2>{item.title}</h2>
            <p className="muted">
              {item.stableCitation ?? item.domain} - {item.requiredActions.join(' | ')}
            </p>
          </article>
        ))}
      </section>
    </section>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Database; label: string; value: string | number }) {
  return (
    <article className="metric">
      <Icon aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Health({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="health-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
