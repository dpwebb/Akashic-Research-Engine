import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono, type Context } from 'hono';
import { logger } from 'hono/logger';
import { z } from 'zod';
import { getIntegrationStatus } from './src/server/integrations/status.js';
import { BillingConfigurationError, createStripeCheckoutSession, getBillingPlanOverview } from './src/server/billing/stripeCheckout.js';
import { generateResearchAssistantOutput } from './src/server/openai/researchAssistant.js';
import { discoverRelatedSources } from './src/server/discovery/webDiscovery.js';
import { getOnlineSignals } from './src/server/discovery/onlineSignals.js';
import { scrubAkashicUrl } from './src/server/discovery/akashicScrubber.js';
import { previewSourceImport } from './src/server/importing/sourceImport.js';
import {
  createSourceFingerprint,
  findDuplicateSourceCandidates,
  getSourceDomain,
  normalizeSourceUrl,
} from './src/server/deduplication/sourceDuplicates.js';
import { rateLimit } from './src/server/security/rateLimit.js';
import {
  getRuntimePersistenceMode,
  getRuntimeBackupStatus,
  loadRuntimeState,
  persistRuntimeState,
  startRuntimeStateBackups,
} from './src/server/storage/runtimeStore.js';
import { researchDataset } from './src/shared/researchData.js';
import { seedPacks } from './src/shared/seedData.js';
import { releaseResourceCount, releaseResourceMinimum } from './src/shared/releaseResourceCatalog.js';
import { evidenceGrades, guardrailRules, sourceClassifications, type SourceClassification } from './src/shared/taxonomy.js';
import { promptTemplates } from './src/shared/promptTemplates.js';
import { monetizationPlans } from './src/shared/monetization.js';
import type {
  AccountEntitlement,
  AccountPlanId,
  ExportDeliverable,
  ExportDeliverableType,
  IngestionJob,
  PromotedSource,
  ReviewQueueItem,
  UsageMetric,
} from './src/shared/types.js';

const port = Number.parseInt(process.env.PORT ?? '3500', 10);
const host = process.env.HOST ?? '0.0.0.0';
const app = new Hono();
const runtimeState = await loadRuntimeState();
const reviewQueue = runtimeState.reviewQueue;
const ingestionJobs = runtimeState.ingestionJobs;
const promotedSources = runtimeState.promotedSources;
const accountEntitlements = runtimeState.accountEntitlements;
const exportDeliverables = runtimeState.exportDeliverables;
startRuntimeStateBackups();

app.use('/api/*', logger());
app.use('/api/source-import/preview', rateLimit('source-import-preview', { windowMs: 60_000, maxRequests: 12 }));
app.use('/api/discovery/search', rateLimit('discovery-search', { windowMs: 60_000, maxRequests: 10 }));
app.use('/api/discovery/scrub', rateLimit('discovery-scrub', { windowMs: 60_000, maxRequests: 12 }));
app.use('/api/assistant/generate', rateLimit('assistant-generate', { windowMs: 60_000, maxRequests: 6 }));
app.use('/api/billing/checkout', rateLimit('billing-checkout', { windowMs: 60_000, maxRequests: 8 }));

app.get('/api/health', (c) =>
  c.json({
    ok: true,
    service: 'akashic-research-engine',
    mode: process.env.NODE_ENV ?? 'development',
    persistenceMode: getRuntimePersistenceMode(),
  }),
);

app.get('/api/integrations', (c) => c.json(getIntegrationStatus()));


app.get('/api/admin/config-drilldown', async (c) =>
  c.json({
    fetchedAt: new Date().toISOString(),
    app: {
      name: 'akashic-research-engine',
      mode: process.env.NODE_ENV ?? 'development',
      host,
      port,
      origin: getApplicationOrigin(c),
    },
    runtime: {
      persistenceMode: getRuntimePersistenceMode(),
      backup: await getRuntimeBackupStatus(),
    },
    integrations: getIntegrationStatus(),
    features: {
      discoverySearchRateLimit: { windowMs: 60_000, maxRequests: 10 },
      discoveryScrubRateLimit: { windowMs: 60_000, maxRequests: 12 },
      assistantRateLimit: { windowMs: 60_000, maxRequests: 6 },
      billingRateLimit: { windowMs: 60_000, maxRequests: 8 },
      reviewQueueEnabled: true,
      sourceImportEnabled: true,
      releaseResourceMinimum,
    },
    dataset: {
      sources: researchDataset.sources.length,
      claims: researchDataset.claims.length,
      genealogyNodes: researchDataset.genealogy.nodes.length,
      releaseResources: releaseResourceCount,
      reviewQueue: reviewQueue.length,
      ingestionJobs: ingestionJobs.length,
      promotedSources: promotedSources.length,
    },
  }),
);

app.get('/api/operations/command-center', async (c) =>
  c.json({
    persistenceMode: getRuntimePersistenceMode(),
    backup: await getRuntimeBackupStatus(),
    reviewQueue: getReviewOperationsSummary(),
    ingestionJobs: getIngestionOperationsSummary(),
    promotedSources: {
      total: promotedSources.length,
      latest: promotedSources.slice(0, 5),
    },
    revenue: getRevenueOperationsSummary(),
    actionItems: getOperationsActionItems(),
  }),
);

app.get('/api/account/entitlement', (c) => {
  const email = c.req.query('email')?.trim().toLocaleLowerCase();
  return c.json(getEntitlement(email));
});

const entitlementSchema = z.object({
  email: z.string().email(),
  planId: z.enum(['public-library', 'researcher-seat', 'studio-seat', 'institution-license']),
  status: z.enum(['anonymous', 'active', 'trialing', 'past_due', 'cancelled']).default('active'),
});

app.post('/api/account/entitlement', async (c) => {
  const input = entitlementSchema.parse(await c.req.json());
  const entitlement = upsertEntitlement(input.email, input.planId, input.status);
  await persistRuntimeState();
  return c.json(entitlement);
});

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

const discoveryScrubSchema = z.object({
  url: z.string().url(),
});

app.post('/api/discovery/scrub', async (c) => {
  try {
    const input = discoveryScrubSchema.parse(await c.req.json());
    const scrubbed = await scrubAkashicUrl(input.url);
    return c.json(scrubbed);
  } catch (error) {
    console.error('[Discovery Scrub]', error);
    return c.json({ error: error instanceof Error ? error.message : 'Could not scrub URL.' }, 400);
  }
});

app.get('/api/online/signals', async (c) => {
  const topics = [
    c.req.query('q1')?.trim(),
    c.req.query('q2')?.trim(),
    c.req.query('q3')?.trim(),
  ].filter((value): value is string => Boolean(value));

  const defaultTopics = ['Akashic records', 'Theosophy', 'Esotericism'];

  try {
    const signals = await getOnlineSignals(topics.length > 0 ? topics : defaultTopics, 2);
    return c.json({
      fetchedAt: new Date().toISOString(),
      topics: topics.length > 0 ? topics : defaultTopics,
      signals,
    });
  } catch (error) {
    console.error('[Online Signals]', error);
    return c.json({ error: error instanceof Error ? error.message : 'Could not fetch online signals.' }, 502);
  }
});

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
app.get('/api/runtime-summary', async (c) =>
  c.json({
    reviewQueue: {
      total: reviewQueue.length,
      pending: reviewQueue.filter((item) => item.status === 'pending').length,
      reviewed: reviewQueue.filter((item) => item.status === 'reviewed').length,
      approved: reviewQueue.filter((item) => item.status === 'approved').length,
      promoted: reviewQueue.filter((item) => item.status === 'promoted').length,
      rejected: reviewQueue.filter((item) => item.status === 'rejected').length,
      highPriority: reviewQueue.filter((item) => item.reviewPriority === 'high').length,
      mediumPriority: reviewQueue.filter((item) => item.reviewPriority === 'medium').length,
      lowPriority: reviewQueue.filter((item) => item.reviewPriority === 'low').length,
      citationComplete: reviewQueue.filter((item) => item.citationStatus === 'complete').length,
      citationPartial: reviewQueue.filter((item) => item.citationStatus === 'partial').length,
      citationNeedsReview: reviewQueue.filter((item) => item.citationStatus === 'needs review' || !item.citationStatus).length,
      releaseResourceMinimum,
    },
    ingestionJobs: {
      total: ingestionJobs.length,
      queued: ingestionJobs.filter((job) => job.status === 'queued').length,
      running: ingestionJobs.filter((job) => job.status === 'running').length,
      completed: ingestionJobs.filter((job) => job.status === 'completed').length,
      failed: ingestionJobs.filter((job) => job.status === 'failed').length,
    },
    promotedSources: promotedSources.length,
    backups: await getRuntimeBackupStatus(),
  }),
);

const reviewQueueItemSchema = z.object({
  title: z.string().min(2).max(240),
  author: z.string().max(180).optional(),
  publicationDate: z.string().max(80).optional(),
  publisher: z.string().max(180).optional(),
  url: z.string().url(),
  domain: z.string().min(2).max(160),
  proposedSourceType: z.enum(sourceClassifications),
  summary: z.string().min(1).max(1400),
  confidenceLevel: z.enum(['high', 'medium', 'low']).default('low'),
  reviewPriority: z.enum(['high', 'medium', 'low']).optional(),
  citationStatus: z.enum(['complete', 'partial', 'needs review']).optional(),
  accessType: z.enum(['full text', 'catalog/reference', 'movement page']).optional(),
  stableCitation: z.string().max(1200).optional(),
  citationNotes: z.string().min(1).max(1200),
  sourceCollection: z.string().max(180).optional(),
  catalogTags: z.array(z.string().min(1).max(80)).max(16).optional(),
  qualityFlags: z.array(z.string().min(1).max(160)).max(12).optional(),
  requiredActions: z.array(z.string().min(1).max(220)).max(12).optional(),
  reviewerNotes: z.string().max(1200).optional(),
  assignedReviewer: z.string().max(120).optional(),
});

app.post('/api/review-queue', async (c) => {
  try {
    const input = reviewQueueItemSchema.parse(await c.req.json());
    const canonicalUrl = normalizeSourceUrl(input.url);
    const sourceFingerprint = createSourceFingerprint({
      title: input.title,
      author: input.author,
      date: input.publicationDate,
      url: canonicalUrl,
      domain: input.domain,
    });
    const duplicateCandidates = findDuplicateSourceCandidates(
      {
        title: input.title,
        url: input.url,
        domain: input.domain,
        sourceFingerprint,
      },
      { reviewQueue, ingestionJobs },
    );
    const existing = reviewQueue.find((item) => getCanonicalQueueUrl(item) === canonicalUrl);

    if (existing) {
      return c.json(existing);
    }

    const qualityFlags = appendUnique(
      input.qualityFlags ?? inferReviewQualityFlags(input.proposedSourceType, input.citationNotes),
      duplicateCandidates.length > 0 ? ['possible duplicate source'] : [],
      12,
    );
    const requiredActions = appendUnique(
      input.requiredActions ?? inferRequiredActions(input.proposedSourceType),
      duplicateCandidates.length > 0 ? ['Resolve duplicate candidates before source promotion'] : [],
      12,
    );
    const stableCitation =
      input.stableCitation ??
      buildStableCitation({
        author: input.author,
        title: input.title,
        publicationDate: input.publicationDate,
        publisher: input.publisher,
        url: canonicalUrl,
      });

    const item: ReviewQueueItem = {
      id: `discovery-${Date.now()}-${slugify(input.url)}`,
      ...input,
      canonicalUrl,
      sourceFingerprint,
      domain: input.domain || getSourceDomain(input.url),
      reviewPriority: input.reviewPriority ?? inferReviewPriority(input.proposedSourceType, input.confidenceLevel),
      citationStatus: input.citationStatus ?? inferReviewCitationStatus(input),
      accessType: input.accessType ?? inferReviewAccessType(input.url, input.proposedSourceType),
      stableCitation,
      catalogTags: input.catalogTags ?? [],
      qualityFlags,
      requiredActions,
      provenance: 'discovery search',
      status: 'pending',
      duplicateCandidates,
      discoveredAt: new Date().toISOString(),
    };

    reviewQueue.unshift(item);
    incrementUsage(c, 'reviewSubmissions');
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
      status: z.enum(['pending', 'reviewed', 'approved', 'promoted', 'rejected']),
      reviewerNotes: z.string().max(1200).optional(),
      assignedReviewer: z.string().max(120).optional(),
      decisionReason: z.string().max(1200).optional(),
    })
    .parse(await c.req.json());
  item.status = input.status;
  item.reviewedAt = new Date().toISOString();
  item.reviewerNotes = input.reviewerNotes ?? item.reviewerNotes;
  item.assignedReviewer = input.assignedReviewer ?? item.assignedReviewer;
  item.decisionReason = input.decisionReason ?? item.decisionReason;
  await persistRuntimeState();
  return c.json(item);
});

const promotionSchema = z.object({
  promotionNotes: z.string().max(1200).default('Promoted from reviewed source queue.'),
});

app.post('/api/review-queue/:id/promote', async (c) => {
  const item = reviewQueue.find((entry) => entry.id === c.req.param('id'));
  if (!item) {
    return c.json({ error: 'Review item not found' }, 404);
  }

  if (item.status !== 'approved' && item.status !== 'reviewed' && item.status !== 'promoted') {
    return c.json({ error: 'Only reviewed or approved items can be promoted.' }, 400);
  }

  const input = promotionSchema.parse(await c.req.json().catch(() => ({})));
  const existing = promotedSources.find((source) => source.reviewQueueItemId === item.id);
  if (existing) {
    item.status = 'promoted';
    item.promotedAt = existing.promotedAt;
    item.promotedSourceId = existing.id;
    await persistRuntimeState();
    return c.json(existing);
  }

  const promotedSource: PromotedSource = {
    id: `promoted-${Date.now()}-${slugify(item.title)}`,
    title: item.title,
    author: item.author ?? 'Pending review',
    date: item.publicationDate ?? item.discoveredAt.slice(0, 10),
    url: item.url,
    canonicalUrl: item.canonicalUrl,
    sourceFingerprint: item.sourceFingerprint,
    sourceType: item.proposedSourceType,
    summary: item.summary,
    confidenceLevel: item.confidenceLevel,
    citationNotes: item.stableCitation ? `${item.stableCitation} ${item.citationNotes}` : item.citationNotes,
    reviewQueueItemId: item.id,
    promotedAt: new Date().toISOString(),
    promotionNotes: input.promotionNotes,
  };

  promotedSources.unshift(promotedSource);
  item.status = 'promoted';
  item.promotedAt = promotedSource.promotedAt;
  item.promotedSourceId = promotedSource.id;
  await persistRuntimeState();
  return c.json(promotedSource, 201);
});

const sourceImportPreviewSchema = z.object({
  url: z.string().min(3).max(2000),
});

app.post('/api/source-import/preview', async (c) => {
  try {
    const input = sourceImportPreviewSchema.parse(await c.req.json());
    assertUsageAllowed(c, 'sourceImports');
    const preview = await previewSourceImport(input.url);
    incrementUsage(c, 'sourceImports');
    await persistRuntimeState();
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
    const canonicalUrl = normalizeSourceUrl(input.url);
    const sourceFingerprint = createSourceFingerprint({
      title: input.title,
      url: canonicalUrl,
      domain: input.domain,
    });
    const duplicateCandidates = findDuplicateSourceCandidates(
      {
        title: input.title,
        url: input.url,
        domain: input.domain,
        sourceFingerprint,
      },
      { reviewQueue, ingestionJobs },
    );
    const existing = ingestionJobs.find((job) => getCanonicalJobUrl(job) === canonicalUrl && job.status !== 'failed');

    if (existing) {
      return c.json(existing);
    }

    const job: IngestionJob = {
      id: `ingestion-${Date.now()}-${slugify(input.url)}`,
      ...input,
      canonicalUrl,
      sourceFingerprint,
      duplicateCandidates,
      qualityFlags: appendUnique(
        input.qualityFlags,
        duplicateCandidates.length > 0 ? ['Possible duplicate candidates need reviewer resolution.'] : [],
        12,
      ),
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
    assertUsageAllowed(c, 'discoverySearches');
    const output = await discoverRelatedSources(input);
    incrementUsage(c, 'discoverySearches');
    await persistRuntimeState();
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
    assertUsageAllowed(c, 'assistantGenerations');
    const output = await generateResearchAssistantOutput(input);
    incrementUsage(c, 'assistantGenerations');
    await persistRuntimeState();
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

app.get('/api/exports', (c) => c.json(exportDeliverables));

const exportSchema = z.object({
  type: z.enum([
    'citation-packet',
    'contradiction-report',
    'source-review-dossier',
    'genealogy-summary',
    'bibliography-export',
  ]),
  title: z.string().min(2).max(180).optional(),
  createdByEmail: z.string().email().optional(),
});

app.post('/api/exports', async (c) => {
  try {
    const input = exportSchema.parse(await c.req.json());
    assertUsageAllowed(c, 'exports', input.createdByEmail);
    const deliverable = createExportDeliverable(input.type, input.title, input.createdByEmail);
    exportDeliverables.unshift(deliverable);
    incrementUsage(c, 'exports', input.createdByEmail);
    await persistRuntimeState();
    return c.json(deliverable, 201);
  } catch (error) {
    console.error('[Export Create]', error);
    return c.json({ error: error instanceof Error ? error.message : 'Export could not be generated.' }, 400);
  }
});

app.get('/api/addition-builder/frameworks', (c) => c.json(researchDataset.additionFrameworks));

function getReviewOperationsSummary() {
  const now = Date.now();
  const dayMs = 86_400_000;
  const pending = reviewQueue.filter((item) => item.status === 'pending');
  const reviewed = reviewQueue.filter((item) => item.status === 'reviewed');
  const approved = reviewQueue.filter((item) => item.status === 'approved');
  const promoted = reviewQueue.filter((item) => item.status === 'promoted');
  const stalePending = pending.filter((item) => now - new Date(item.discoveredAt).getTime() > 7 * dayMs);

  return {
    total: reviewQueue.length,
    pending: pending.length,
    reviewed: reviewed.length,
    approved: approved.length,
    promoted: promoted.length,
    rejected: reviewQueue.filter((item) => item.status === 'rejected').length,
    highPriority: reviewQueue.filter((item) => item.reviewPriority === 'high').length,
    duplicateConflicts: reviewQueue.filter((item) => (item.duplicateCandidates?.length ?? 0) > 0).length,
    stalePending: stalePending.length,
    needsPromotion: [...reviewed, ...approved].filter((item) => !item.promotedSourceId).length,
    citationComplete: reviewQueue.filter((item) => item.citationStatus === 'complete').length,
    citationPartial: reviewQueue.filter((item) => item.citationStatus === 'partial').length,
    citationNeedsReview: reviewQueue.filter((item) => item.citationStatus === 'needs review' || !item.citationStatus).length,
    releaseResourceMinimum,
    releaseResourceCount,
    nextItems: reviewQueue
      .filter((item) => item.status === 'pending' || item.status === 'reviewed' || item.status === 'approved')
      .slice(0, 8),
  };
}

function getIngestionOperationsSummary() {
  const now = Date.now();
  const dayMs = 86_400_000;
  return {
    total: ingestionJobs.length,
    queued: ingestionJobs.filter((job) => job.status === 'queued').length,
    running: ingestionJobs.filter((job) => job.status === 'running').length,
    completed: ingestionJobs.filter((job) => job.status === 'completed').length,
    failed: ingestionJobs.filter((job) => job.status === 'failed').length,
    stalled: ingestionJobs.filter((job) => job.status !== 'completed' && now - new Date(job.createdAt).getTime() > dayMs).length,
    fullTextCandidates: ingestionJobs.filter((job) => job.fullTextCandidate).length,
    duplicateConflicts: ingestionJobs.filter((job) => (job.duplicateCandidates?.length ?? 0) > 0).length,
    nextJobs: ingestionJobs.filter((job) => job.status === 'queued' || job.status === 'failed').slice(0, 8),
  };
}

function getRevenueOperationsSummary() {
  return {
    accounts: accountEntitlements.length,
    activeAccounts: accountEntitlements.filter((account) => account.status === 'active' || account.status === 'trialing').length,
    planMix: monetizationPlans.map((plan) => ({
      planId: plan.id,
      name: plan.name,
      accounts: accountEntitlements.filter((account) => account.planId === plan.id).length,
    })),
    generatedExports: exportDeliverables.length,
    monthlyRecurringRevenueCents: accountEntitlements.reduce((total, account) => {
      const plan = monetizationPlans.find((candidate) => candidate.id === account.planId);
      if (!plan?.unitAmountCents || account.status !== 'active') {
        return total;
      }
      return total + plan.unitAmountCents;
    }, 0),
  };
}

function getOperationsActionItems(): string[] {
  const actions: string[] = [];
  const review = getReviewOperationsSummary();
  const ingestion = getIngestionOperationsSummary();

  if (getRuntimePersistenceMode() === 'json') {
    actions.push('Configure DATABASE_URL to activate PostgreSQL runtime persistence.');
  }
  if (review.total < releaseResourceMinimum) {
    actions.push(`Initial release requires at least ${releaseResourceMinimum} review resources; current queue has ${review.total}.`);
  }
  if (review.highPriority > 0) {
    actions.push(`${review.highPriority} high-priority review items need triage.`);
  }
  if (review.needsPromotion > 0) {
    actions.push(`${review.needsPromotion} reviewed or approved items are ready for source promotion.`);
  }
  if (review.duplicateConflicts > 0 || ingestion.duplicateConflicts > 0) {
    actions.push('Resolve duplicate source conflicts before expanding the trusted corpus.');
  }
  if (ingestion.failed > 0) {
    actions.push(`${ingestion.failed} ingestion jobs failed and need retry or rejection decisions.`);
  }
  if (accountEntitlements.length === 0) {
    actions.push('Create at least one entitlement record to test paid workflow gating.');
  }

  return actions;
}

function getEntitlement(email?: string): AccountEntitlement {
  const normalizedEmail = email?.trim().toLocaleLowerCase();
  const existing = normalizedEmail
    ? accountEntitlements.find((account) => account.email === normalizedEmail)
    : undefined;

  if (existing) {
    return existing;
  }

  return {
    email: normalizedEmail || 'anonymous',
    planId: 'public-library',
    status: normalizedEmail ? 'active' : 'anonymous',
    usage: createEmptyUsage(),
    updatedAt: new Date().toISOString(),
  };
}

function upsertEntitlement(
  email: string,
  planId: AccountPlanId,
  status: AccountEntitlement['status'],
): AccountEntitlement {
  const normalizedEmail = email.trim().toLocaleLowerCase();
  const existing = accountEntitlements.find((account) => account.email === normalizedEmail);
  if (existing) {
    existing.planId = planId;
    existing.status = status;
    existing.updatedAt = new Date().toISOString();
    return existing;
  }

  const entitlement: AccountEntitlement = {
    email: normalizedEmail,
    planId,
    status,
    usage: createEmptyUsage(),
    updatedAt: new Date().toISOString(),
  };
  accountEntitlements.unshift(entitlement);
  return entitlement;
}

function createEmptyUsage(): AccountEntitlement['usage'] {
  return {
    discoverySearches: 0,
    sourceImports: 0,
    assistantGenerations: 0,
    reviewSubmissions: 0,
    exports: 0,
  };
}

function incrementUsage(c: Context, metric: UsageMetric, explicitEmail?: string): void {
  const email = explicitEmail ?? c.req.header('x-account-email') ?? c.req.query('email');
  if (!email) {
    return;
  }

  const entitlement = upsertEntitlement(email, getEntitlement(email).planId, getEntitlement(email).status);
  entitlement.usage[metric] += 1;
  entitlement.updatedAt = new Date().toISOString();
}

function assertUsageAllowed(c: Context, metric: UsageMetric, explicitEmail?: string): void {
  const email = explicitEmail ?? c.req.header('x-account-email') ?? c.req.query('email');
  if (!email) {
    return;
  }

  const entitlement = getEntitlement(email);
  const plan = monetizationPlans.find((candidate) => candidate.id === entitlement.planId);
  const limit = plan?.usageLimits[metric];

  if (limit !== null && limit !== undefined && entitlement.usage[metric] >= limit) {
    throw new Error(`${plan?.name ?? 'Current plan'} has reached its ${metric} limit.`);
  }
}

function createExportDeliverable(
  type: ExportDeliverableType,
  title?: string,
  createdByEmail?: string,
): ExportDeliverable {
  const generatedTitle = title || exportTitleForType(type);
  return {
    id: `export-${Date.now()}-${type}`,
    type,
    title: generatedTitle,
    format: 'markdown',
    content: renderExportMarkdown(type, generatedTitle),
    createdAt: new Date().toISOString(),
    createdByEmail,
  };
}

function exportTitleForType(type: ExportDeliverableType): string {
  const labels: Record<ExportDeliverableType, string> = {
    'citation-packet': 'Citation Packet',
    'contradiction-report': 'Contradiction Report',
    'source-review-dossier': 'Source Review Dossier',
    'genealogy-summary': 'Genealogy Summary',
    'bibliography-export': 'Bibliography Export',
  };
  return labels[type];
}

function renderExportMarkdown(type: ExportDeliverableType, title: string): string {
  if (type === 'bibliography-export') {
    return [
      `# ${title}`,
      '',
      ...researchDataset.index.bibliography.map(
        (record) => `- ${record.stableCitation} ${record.archiveUrl ? `(${record.archiveUrl})` : ''}`,
      ),
    ].join('\n');
  }

  if (type === 'genealogy-summary') {
    return [
      `# ${title}`,
      '',
      '## Nodes',
      ...researchDataset.genealogy.nodes.map((node) => `- ${node.label}: ${node.description}`),
      '',
      '## Edges',
      ...researchDataset.genealogy.edges.map((edge) => `- ${edge.from} -> ${edge.to}: ${edge.label} (${edge.confidence})`),
    ].join('\n');
  }

  if (type === 'source-review-dossier') {
    return [
      `# ${title}`,
      '',
      ...reviewQueue.slice(0, 25).map((item) =>
        [
          `## ${item.title}`,
          `Status: ${item.status}`,
          `Priority: ${item.reviewPriority}`,
          `Citation status: ${item.citationStatus ?? 'needs review'}`,
          item.stableCitation ? `Stable citation: ${item.stableCitation}` : '',
          `URL: ${item.url}`,
          item.citationNotes,
        ].join('\n'),
      ),
    ].join('\n\n');
  }

  if (type === 'contradiction-report') {
    return [
      `# ${title}`,
      '',
      ...researchDataset.claims
        .filter((claim) => claim.evidenceGrade === 'D' || claim.evidenceGrade === 'E' || claim.evidenceGrade === 'F')
        .map((claim) => `- Grade ${claim.evidenceGrade}: ${claim.text} Notes: ${claim.notes}`),
    ].join('\n');
  }

  return [
    `# ${title}`,
    '',
    ...researchDataset.sources.map((source) =>
      [`## ${source.title}`, `Type: ${source.sourceType}`, `URL: ${source.url}`, source.citationNotes].join('\n'),
    ),
  ].join('\n\n');
}

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

function inferReviewCitationStatus(input: {
  title: string;
  author?: string;
  publicationDate?: string;
  publisher?: string;
  stableCitation?: string;
}): NonNullable<ReviewQueueItem['citationStatus']> {
  if (input.stableCitation || (input.title && input.author && input.publicationDate && input.publisher)) {
    return 'complete';
  }

  if (input.title && (input.author || input.publicationDate || input.publisher)) {
    return 'partial';
  }

  return 'needs review';
}

function inferReviewAccessType(url: string, sourceType: SourceClassification): NonNullable<ReviewQueueItem['accessType']> {
  if (url.includes('archive.org') || url.endsWith('.pdf') || url.includes('/Books/')) {
    return 'full text';
  }

  if (sourceType === 'primary esoteric' || sourceType === 'modern spiritual') {
    return 'movement page';
  }

  return 'catalog/reference';
}

function buildStableCitation(input: {
  author?: string;
  title: string;
  publicationDate?: string;
  publisher?: string;
  url: string;
}): string {
  return [
    input.author || 'Unknown author',
    input.title,
    input.publicationDate || 'publication date pending',
    input.publisher || getSourceDomain(input.url),
    input.url,
  ]
    .filter(Boolean)
    .join('. ');
}

function getCanonicalQueueUrl(item: ReviewQueueItem): string {
  return item.canonicalUrl ?? normalizeSourceUrl(item.url);
}

function getCanonicalJobUrl(job: IngestionJob): string {
  return job.canonicalUrl ?? normalizeSourceUrl(job.url);
}

function appendUnique(values: string[], additions: string[], maxItems: number): string[] {
  const normalized = new Set(values.map((value) => value.toLocaleLowerCase()));
  const output = [...values];

  for (const addition of additions) {
    if (!normalized.has(addition.toLocaleLowerCase())) {
      output.push(addition);
      normalized.add(addition.toLocaleLowerCase());
    }
  }

  return output.slice(0, maxItems);
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
