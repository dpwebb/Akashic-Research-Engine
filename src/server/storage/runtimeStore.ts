import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { IngestionJob, ReviewQueueItem } from '../../shared/types.js';
import { seedReviewQueue } from '../../shared/seedData.js';
import { createSourceFingerprint, normalizeSourceUrl } from '../deduplication/sourceDuplicates.js';

type RuntimeState = {
  reviewQueue: ReviewQueueItem[];
  ingestionJobs: IngestionJob[];
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

export async function loadRuntimeState(): Promise<RuntimeState> {
  if (state) {
    return state;
  }

  try {
    const rawState = JSON.parse(await readFile(runtimeStatePath, 'utf8')) as Partial<RuntimeState>;
    state = {
      reviewQueue: normalizeReviewQueueItems(Array.isArray(rawState.reviewQueue) ? rawState.reviewQueue : seedReviewQueue),
      ingestionJobs: normalizeIngestionJobs(Array.isArray(rawState.ingestionJobs) ? rawState.ingestionJobs : []),
    };
  } catch {
    state = {
      reviewQueue: normalizeReviewQueueItems(seedReviewQueue),
      ingestionJobs: [],
    };
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

function normalizeReviewQueueItems(items: ReviewQueueItem[]): ReviewQueueItem[] {
  return items.map((item) => {
    try {
      const canonicalUrl = item.canonicalUrl ?? normalizeSourceUrl(item.url);
      return {
        ...item,
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
