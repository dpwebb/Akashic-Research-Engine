import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { IngestionJob, ReviewQueueItem } from '../../shared/types.js';
import { seedReviewQueue } from '../../shared/seedData.js';

type RuntimeState = {
  reviewQueue: ReviewQueueItem[];
  ingestionJobs: IngestionJob[];
};

const runtimeStatePath = process.env.RUNTIME_STATE_PATH ?? join(process.cwd(), 'runtime-data', 'state.json');
let state: RuntimeState | null = null;
let writeChain = Promise.resolve();

export async function loadRuntimeState(): Promise<RuntimeState> {
  if (state) {
    return state;
  }

  try {
    const rawState = JSON.parse(await readFile(runtimeStatePath, 'utf8')) as Partial<RuntimeState>;
    state = {
      reviewQueue: Array.isArray(rawState.reviewQueue) ? rawState.reviewQueue : [...seedReviewQueue],
      ingestionJobs: Array.isArray(rawState.ingestionJobs) ? rawState.ingestionJobs : [],
    };
  } catch {
    state = {
      reviewQueue: [...seedReviewQueue],
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
    });

  await writeChain;
}
