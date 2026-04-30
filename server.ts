import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { z } from 'zod';
import { getIntegrationStatus } from './src/server/integrations/status.js';
import { generateResearchAssistantOutput } from './src/server/openai/researchAssistant.js';
import { researchDataset } from './src/shared/researchData.js';
import { evidenceGrades, guardrailRules, sourceClassifications } from './src/shared/taxonomy.js';
import { promptTemplates } from './src/shared/promptTemplates.js';

const port = Number.parseInt(process.env.PORT ?? '3500', 10);
const host = process.env.HOST ?? '0.0.0.0';
const app = new Hono();

app.use('/api/*', logger());

app.get('/api/health', (c) =>
  c.json({
    ok: true,
    service: 'akashic-research-engine',
    mode: process.env.NODE_ENV ?? 'development',
  }),
);

app.get('/api/integrations', (c) => c.json(getIntegrationStatus()));

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

app.get('/api/assistant/prompts', (c) => c.json(promptTemplates));

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

app.use('/_assets/*', serveStatic({ root: './dist' }));
app.use('/assets/*', serveStatic({ root: './dist' }));
app.use('/*', serveStatic({ root: './dist', path: 'index.html' }));

serve({ fetch: app.fetch, port, hostname: host }, () => {
  console.log(`Akashic Research Engine listening on http://${host}:${port}`);
});
