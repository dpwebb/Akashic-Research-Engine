import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import postgres from 'postgres';
import type {
  AccountEntitlement,
  ExportDeliverable,
  IngestionJob,
  PromotedSource,
  ReviewQueueItem,
  RuntimePersistenceMode,
} from '../../shared/types.js';
import { seedReviewQueue } from '../../shared/seedData.js';
import { createSourceFingerprint, normalizeSourceUrl } from '../deduplication/sourceDuplicates.js';

export type RuntimeState = {
  reviewQueue: ReviewQueueItem[];
  ingestionJobs: IngestionJob[];
  promotedSources: PromotedSource[];
  accountEntitlements: AccountEntitlement[];
  exportDeliverables: ExportDeliverable[];
};

const runtimeStatePath = process.env.RUNTIME_STATE_PATH ?? join(process.cwd(), 'runtime-data', 'state.json');
const runtimeBackupDirectory =
  process.env.RUNTIME_BACKUP_DIRECTORY ?? join(dirname(runtimeStatePath), 'backups');
const configuredBackupIntervalMs = Number.parseInt(process.env.RUNTIME_BACKUP_INTERVAL_MS ?? '', 10);
const runtimeBackupIntervalMs =
  Number.isFinite(configuredBackupIntervalMs) && configuredBackupIntervalMs > 0
    ? configuredBackupIntervalMs
    : 3_600_000;
let state: RuntimeState | null = null;
let writeChain = Promise.resolve();
let backupChain = Promise.resolve();
let backupDirty = false;
let backupTimer: NodeJS.Timeout | null = null;
let persistenceMode: RuntimePersistenceMode = 'json';
let sqlClient: postgres.Sql | null = null;

export type RuntimeBackupStatus = {
  backupDirectory: string;
  intervalMs: number;
  pendingChanges: boolean;
  latestBackupAt?: string;
};

export async function loadRuntimeState(): Promise<RuntimeState> {
  if (state) {
    return state;
  }

  try {
    state = await loadStateFromPostgres();
    if (state) {
      persistenceMode = 'postgres';
      return state;
    }

    const rawState = JSON.parse(await readFile(runtimeStatePath, 'utf8')) as Partial<RuntimeState>;
    state = normalizeRuntimeState(rawState);
  } catch {
    state = normalizeRuntimeState({});
    await persistRuntimeState();
  }

  return state;
}

export async function persistRuntimeState(): Promise<void> {
  if (!state) {
    return;
  }

  writeChain = writeChain
    .catch(() => undefined)
    .then(async () => {
      if (persistenceMode === 'postgres') {
        await persistStateToPostgres();
        backupDirty = true;
        return;
      }

      await mkdir(dirname(runtimeStatePath), { recursive: true });
      const temporaryPath = `${runtimeStatePath}.tmp`;
      await writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
      await rename(temporaryPath, runtimeStatePath);
      backupDirty = true;
    });

  await writeChain;
}

export function startRuntimeStateBackups(): void {
  if (backupTimer) {
    return;
  }

  backupTimer = setInterval(() => {
    void backupRuntimeStateIfChanged();
  }, runtimeBackupIntervalMs);
  backupTimer.unref?.();
}

export async function backupRuntimeStateIfChanged(): Promise<void> {
  if (!state || !backupDirty) {
    return;
  }

  backupChain = backupChain
    .catch(() => undefined)
    .then(async () => {
      await writeChain;

      if (!state || !backupDirty) {
        return;
      }

      const snapshot = `${JSON.stringify(state, null, 2)}\n`;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = join(runtimeBackupDirectory, `state-${timestamp}.json`);
      const latestBackupPath = join(runtimeBackupDirectory, 'latest.json');

      await mkdir(runtimeBackupDirectory, { recursive: true });
      await writeAtomically(backupPath, snapshot);
      await writeAtomically(latestBackupPath, snapshot);
      backupDirty = false;
    });

  await backupChain;
}

export async function getRuntimeBackupStatus(): Promise<RuntimeBackupStatus> {
  return {
    backupDirectory: runtimeBackupDirectory,
    intervalMs: runtimeBackupIntervalMs,
    pendingChanges: backupDirty,
    latestBackupAt: await getLatestBackupTimestamp(),
  };
}

export function getRuntimePersistenceMode(): RuntimePersistenceMode {
  return persistenceMode;
}

function normalizeReviewQueueItems(items: ReviewQueueItem[]): ReviewQueueItem[] {
  return items.map((item) => {
    try {
      const canonicalUrl = item.canonicalUrl ?? normalizeSourceUrl(item.url);
      return {
        ...item,
        status: item.status === 'approved' && item.promotedAt ? 'promoted' : item.status,
        canonicalUrl,
        sourceFingerprint:
          item.sourceFingerprint ??
          createSourceFingerprint({
            title: item.title,
            url: canonicalUrl,
            domain: item.domain,
          }),
      };
    } catch {
      return item;
    }
  });
}

function normalizeIngestionJobs(jobs: IngestionJob[]): IngestionJob[] {
  return jobs.map((job) => {
    try {
      const canonicalUrl = job.canonicalUrl ?? normalizeSourceUrl(job.url);
      return {
        ...job,
        canonicalUrl,
        sourceFingerprint:
          job.sourceFingerprint ??
          createSourceFingerprint({
            title: job.title,
            url: canonicalUrl,
            domain: job.domain,
          }),
      };
    } catch {
      return job;
    }
  });
}

async function writeAtomically(path: string, content: string): Promise<void> {
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, content, 'utf8');
  await rename(temporaryPath, path);
}

function normalizeRuntimeState(rawState: Partial<RuntimeState>): RuntimeState {
  return {
    reviewQueue: normalizeReviewQueueItems(Array.isArray(rawState.reviewQueue) ? rawState.reviewQueue : seedReviewQueue),
    ingestionJobs: normalizeIngestionJobs(Array.isArray(rawState.ingestionJobs) ? rawState.ingestionJobs : []),
    promotedSources: Array.isArray(rawState.promotedSources) ? rawState.promotedSources : [],
    accountEntitlements: Array.isArray(rawState.accountEntitlements) ? rawState.accountEntitlements : [],
    exportDeliverables: Array.isArray(rawState.exportDeliverables) ? rawState.exportDeliverables : [],
  };
}

async function loadStateFromPostgres(): Promise<RuntimeState | null> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return null;
  }

  try {
    const sql = getSqlClient(databaseUrl);
    await sql`
      create table if not exists app_runtime_state (
        id text primary key,
        state jsonb not null,
        updated_at timestamptz not null default now()
      )
    `;
    const rows = await sql<{ state: Partial<RuntimeState> }[]>`
      select state from app_runtime_state where id = 'primary' limit 1
    `;

    if (rows.length === 0) {
      return normalizeRuntimeState({});
    }

    return normalizeRuntimeState(rows[0].state);
  } catch (error) {
    console.error('[Runtime Store] PostgreSQL unavailable, falling back to JSON state.', error);
    return null;
  }
}

async function persistStateToPostgres(): Promise<void> {
  if (!state || !process.env.DATABASE_URL) {
    return;
  }

  const sql = getSqlClient(process.env.DATABASE_URL);
  await sql`
    insert into app_runtime_state (id, state, updated_at)
    values ('primary', ${sql.json(state)}, now())
    on conflict (id) do update set state = excluded.state, updated_at = now()
  `;
}

function getSqlClient(databaseUrl: string): postgres.Sql {
  sqlClient ??= postgres(databaseUrl, { max: 1 });
  return sqlClient;
}

async function getLatestBackupTimestamp(): Promise<string | undefined> {
  try {
    const latestBackup = await stat(join(runtimeBackupDirectory, 'latest.json'));
    return latestBackup.mtime.toISOString();
  } catch {
    return undefined;
  }
}
