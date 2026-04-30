import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono, type Context } from 'hono';
import { logger } from 'hono/logger';
import { z } from 'zod';
import { getIntegrationStatus } from './src/server/integrations/status.js';
import { BillingConfigurationError, createStripeCheckoutSession, getBillingPlanOverview } from './src/server/billing/stripeCheckout.js';
import { generateResearchAssistantOutput } from './src/server/openai/researchAssistant.js';
import { discoverRelatedSources } from './src/server/discovery/webDiscovery.js';
import { previewSourceImport } from './src/server/importing/sourceImport.js';
import { rateLimit } from './src/server/security/rateLimit.js';
import { loadRuntimeState, persistRuntimeState, startRuntimeStateBackups } from './src/server/storage/runtimeStore.js';
import { researchDataset } from './src/shared/researchData.js';
import { seedPacks } from './src/shared/seedData.js';
import { evidenceGrades, guardrailRules, sourceClassifications, type SourceClassification } from './src/shared/taxonomy.js';
import { promptTemplates } from './src/shared/promptTemplates.js';
import type { IngestionJob, ReviewQueueItem } from './src/shared/types.js';

const port = Number.parseInt(process.env.PORT ?? '3500', 10);
const host = process.env.HOST ?? '0.0.0.0';
const app = new Hono();
const runtimeState = await loadRuntimeState();
const reviewQueue = runtimeState.reviewQueue;
const ingestionJobs = runtimeState.ingestionJobs;
startRuntimeStateBackups();

app.use('/api/*', logger());
app.use('/api/source-import/preview', rateLimit('source-import-preview', { windowMs: 60_000, maxRequests: 12 }));
app.use('/api/discovery/search', rateLimit('discovery-search', { windowMs: 60_000, maxRequests: 10 }));
app.use('/api/assistant/generate', rateLimit('assistant-generate', { windowMs: 60_000, maxRequests: 6 }));
app.use('/api/billing/checkout', rateLimit('billing-checkout', { windowMs: 60_000, maxRequests: 8 }));

app.get('/api/health', (c) =>
  c.json({
    ok: true,
    service: 'akashic-research-engine',
    mode: process.env.NODE_ENV ?? 'development',
  }),
);

app.get('/api/integrations', (c) => c.json(getIntegrationStatus()));

app.get('/api/billing/plans', (c) => c.json(getBillingPlanOverview()));

const billingCheckoutSchema = z.object({
  planId: z.string().min(1).max(80),
  customerEmail: z.string().email().optional(),
});

app.post('/api/billing/checkout', async (c) => {
  try {
    const input = billingCheckoutSchema.parse(await c.req.json());
    const checkoutSession = await createStripeCheckoutSession({
      ...input,
      origin: getApplicationOrigin(c),
    });
    return c.json(checkoutSession);
  } catch (error) {
    console.error('[Billing Checkout]', error);

    if (error instanceof BillingConfigurationError) {
      return c.json({ error: error.message }, 503);
    }

    return c.json({ error: error instanceof Error ? error.message : 'Checkout could not be started.' }, 400);
  }
});

app.get('/api/taxonomy', (c) =>
  c.json({
    evidenceGrades,
    sourceClassifications,
    guardrailRules,
  }),
);

app.get('/api/sources', (c) => c.json(researchDataset.sources));

app.get('/api/sources/:id', (c) => {
  const source = researchDataset.sources.find((item) => item.id === c.req.param('id'));
  if (!source) {
    return c.json({ error: 'Source not found' }, 404);
  }

  const claims = researchDataset.claims.filter((claim) => claim.sourceId === source.id);
  return c.json({ ...source, claims });
});

app.get('/api/claims', (c) => c.json(researchDataset.claims));

app.get('/api/genealogy', (c) => c.json(researchDataset.genealogy));

app.get('/api/research-index', (c) => c.json(researchDataset.index));

app.get('/api/assistant/prompts', (c) => c.json(promptTemplates));

app.get('/api/seed-packs', (c) => c.json(seedPacks));

app.get('/api/review-queue', (c) => c.json(reviewQueue));
app.get('/api/runtime-summary', (c) =>
  c.json({
    reviewQueue: {
      total: reviewQueue.length,
      pending: reviewQueue.filter((item) => item.status === 'pending').length,
      approved: reviewQueue.filter((item) => item.status === 'approved').length,
      rejected: reviewQueue.filter((item) => item.status === 'rejected').length,
      highPriority: reviewQueue.filter((item) => item.reviewPriority === 'high').length,
      mediumPriority: reviewQueue.filter((item) => item.reviewPriority === 'medium').length,
      lowPriority: reviewQueue.filter((item) => item.reviewPriority === 'low').length,
    },
    ingestionJobs: {
      total: ingestionJobs.length,
      queued: ingestionJobs.filter((job) => job.status === 'queued').length,
      running: ingestionJobs.filter((job) => job.status === 'running').length,
      completed: ingestionJobs.filter((job) => job.status === 'completed').length,
      failed: ingestionJobs.filter((job) => job.status === 'failed').length,
    },
  }),
);

const reviewQueueItemSchema = z.object({
  title: z.string().min(2).max(240),
  url: z.string().url(),
  domain: z.string().min(2).max(160),
  proposedSourceType: z.enum(sourceClassifications),
  summary: z.string().min(1).max(1400),
  confidenceLevel: z.enum(['high', 'medium', 'low']).default('low'),
  reviewPriority: z.enum(['high', 'medium', 'low']).optional(),
  citationNotes: z.string().min(1).max(1200),
  qualityFlags: z.array(z.string().min(1).max(160)).max(12).optional(),
  requiredActions: z.array(z.string().min(1).max(220)).max(12).optional(),
  reviewerNotes: z.string().max(1200).optional(),
});

app.post('/api/review-queue', async (c) => {
  try {
    const input = reviewQueueItemSchema.parse(await c.req.json());
    const existing = reviewQueue.find((item) => item.url === input.url);

    if (existing) {
      return c.json(existing);
    }

    const item: ReviewQueueItem = {
      id: `discovery-${Date.now()}-${slugify(input.url)}`,
      ...input,
      reviewPriority: input.reviewPriority ?? inferReviewPriority(input.proposedSourceType, input.confidenceLevel),
      qualityFlags: input.qualityFlags ?? inferReviewQualityFlags(input.proposedSourceType, input.citationNotes),
      requiredActions: input.requiredActions ?? inferRequiredActions(input.proposedSourceType),
      provenance: 'discovery search',
      status: 'pending',
      discoveredAt: new Date().toISOString(),
    };

    reviewQueue.unshift(item);
    await persistRuntimeState();
    return c.json(item, 201);
  } catch (error) {
    console.error('[Review Queue Add]', error);
    return c.json({ error: error instanceof Error ? error.message : 'Could not add review item.' }, 400);
  }
});

app.patch('/api/review-queue/:id/status', async (c) => {
  const item = reviewQueue.find((entry) => entry.id === c.req.param('id'));
  if (!item) {
    return c.json({ error: 'Review item not found' }, 404);
  }

  const input = z
    .object({
      status: z.enum(['pending', 'approved', 'rejected']),
      reviewerNotes: z.string().max(1200).optional(),
    })
    .parse(await c.req.json());
  item.status = input.status;
  item.reviewedAt = new Date().toISOString();
  item.reviewerNotes = input.reviewerNotes ?? item.reviewerNotes;
  await persistRuntimeState();
  return c.json(item);
});

const sourceImportPreviewSchema = z.object({
  url: z.string().min(3).max(2000),
});

app.post('/api/source-import/preview', async (c) => {
  try {
    const input = sourceImportPreviewSchema.parse(await c.req.json());
    const preview = await previewSourceImport(input.url);
    return c.json(preview);
  } catch (error) {
    console.error('[Source Import Preview]', error);
    return c.json({ error: error instanceof Error ? error.message : 'Source import preview failed.' }, 400);
  }
});

app.get('/api/ingestion-jobs', (c) => c.json(ingestionJobs));

const ingestionJobSchema = z.object({
  url: z.string().url(),
  domain: z.string().min(2).max(160),
  title: z.string().min(1).max(240),
  sourceType: z.enum(sourceClassifications),
  citationStatus: z.enum(['complete', 'partial', 'needs review']),
  wordCount: z.number().int().min(0).max(5_000_000),
  fullTextCandidate: z.boolean(),
  qualityFlags: z.array(z.string().min(1).max(220)).max(12).default([]),
  extractionNotes: z.string().max(1200).default(''),
});

app.post('/api/ingestion-jobs', async (c) => {
  try {
    const input = ingestionJobSchema.parse(await c.req.json());
    const existing = ingestionJobs.find((job) => job.url === input.url && job.status !== 'failed');

    if (existing) {
      return c.json(existing);
    }

    const job: IngestionJob = {
      id: `ingestion-${Date.now()}-${slugify(input.url)}`,
      ...input,
      status: 'queued',
      createdAt: new Date().toISOString(),
    };

    ingestionJobs.unshift(job);
    await persistRuntimeState();
    return c.json(job, 201);
  } catch (error) {
    console.error('[Ingestion Job Add]', error);
    return c.json({ error: error instanceof Error ? error.message : 'Could not queue ingestion job.' }, 400);
  }
});

const discoverySearchSchema = z.object({
  query: z.string().min(3).max(240),
  scope: z.enum(['combined', 'engine', 'web']).default('combined'),
  maxResults: z.number().int().min(1).max(20).default(8),
  inspectPages: z.boolean().default(true),
  exactPhrase: z.string().max(160).optional(),
  includeTerms: z.array(z.string().min(1).max(80)).max(12).default([]),
  excludeTerms: z.array(z.string().min(1).max(80)).max(12).default([]),
  domains: z.array(z.string().min(3).max(120)).max(8).default([]),
  sourceTypes: z.array(z.enum(sourceClassifications)).max(8).default([]),
  evidenceGrades: z.array(z.enum(['A', 'B', 'C', 'D', 'E', 'F'])).max(6).default([]),
  sourceIds: z.array(z.string().min(1).max(120)).max(24).default([]),
  dateFrom: z.number().int().min(-5000).max(3000).optional(),
  dateTo: z.number().int().min(-5000).max(3000).optional(),
  minRelevance: z.number().int().min(0).max(100).default(0),
});

app.post('/api/discovery/search', async (c) => {
  try {
    const input = discoverySearchSchema.parse(await c.req.json());
    const output = await discoverRelatedSources(input);
    return c.json(output);
  } catch (error) {
    console.error('[Discovery Search]', error);
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Discovery search failed. Check network access and try a narrower query.',
      },
      500,
    );
  }
});

const assistantRequestSchema = z.object({
  templateId: z.string().min(1),
  userInput: z.string().min(10).max(6000),
});

app.post('/api/assistant/generate', async (c) => {
  try {
    const input = assistantRequestSchema.parse(await c.req.json());
    const output = await generateResearchAssistantOutput(input);
    return c.json(output);
  } catch (error) {
    console.error('[Assistant Generate]', error);
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Assistant generation failed. Check provider configuration and model access.',
      },
      500,
    );
  }
});

app.get('/api/addition-builder/frameworks', (c) => c.json(researchDataset.additionFrameworks));

function slugify(value: string): string {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function inferReviewPriority(sourceType: SourceClassification, confidence: ReviewQueueItem['confidenceLevel']): ReviewQueueItem['reviewPriority'] {
  if (sourceType === 'commercial' || sourceType === 'low-quality' || confidence === 'low') {
    return 'high';
  }

  if (sourceType === 'primary esoteric' || sourceType === 'modern spiritual') {
    return 'medium';
  }

  return 'low';
}

function inferReviewQualityFlags(sourceType: SourceClassification, citationNotes: string): string[] {
  const flags: string[] = [];

  if (sourceType === 'commercial' || sourceType === 'low-quality') {
    flags.push('low-trust source');
  }

  if (sourceType === 'primary esoteric' || sourceType === 'modern spiritual') {
    flags.push('claim/testimony boundary needed');
  }

  if (/page|edition|citation|verify/i.test(citationNotes)) {
    flags.push('citation verification needed');
  }

  return flags.length > 0 ? flags : ['standard source review'];
}

function inferRequiredActions(sourceType: SourceClassification): string[] {
  if (sourceType === 'commercial' || sourceType === 'low-quality') {
    return ['Corroborate claims independently', 'Reject promotional claims without primary support'];
  }

  if (sourceType === 'primary esoteric' || sourceType === 'modern spiritual') {
    return ['Extract claim-level citations', 'Label testimony separately from historical fact'];
  }

  return ['Verify author, publisher, date, and stable URL', 'Record citation-ready page or section reference'];
}

function getApplicationOrigin(c: Context): string {
  if (process.env.PUBLIC_APP_URL) {
    return process.env.PUBLIC_APP_URL.replace(/\/$/, '');
  }

  const requestUrl = new URL(c.req.url);
  const forwardedProto = c.req.header('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = c.req.header('x-forwarded-host')?.split(',')[0]?.trim();
  const protocol = forwardedProto || requestUrl.protocol.replace(':', '');
  const host = forwardedHost || c.req.header('host') || requestUrl.host;
  return `${protocol}://${host}`;
}

app.use('/_assets/*', serveStatic({ root: './dist' }));
app.use('/assets/*', serveStatic({ root: './dist' }));
app.use('/*', serveStatic({ root: './dist', path: 'index.html' }));

serve({ fetch: app.fetch, port, hostname: host }, () => {
  console.log(`Akashic Research Engine listening on http://${host}:${port}`);
});
