const providers = [
  {
    id: 'openai',
    name: 'OpenAI API',
    requiredEnv: ['OPENAI_API_KEY'],
    optionalEnv: ['OPENAI_MODEL'],
    purpose: 'Research summaries, claim comparisons, contradiction reports, and speculative theory drafts.',
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    requiredEnv: ['DATABASE_URL'],
    optionalEnv: [],
    purpose: 'Persistent source, claim, citation, genealogy, ingestion, and assistant-output storage.',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    requiredEnv: ['STRIPE_SECRET_KEY'],
    optionalEnv: ['STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET'],
    purpose: 'Payment and billing workflows for apps that need subscription or checkout features.',
  },
  {
    id: 'google-gemini',
    name: 'Google Gemini',
    requiredEnv: ['GOOGLE_GEMINI_SA_KEY'],
    optionalEnv: [],
    purpose: 'Optional alternate AI provider or extraction fallback when an app explicitly supports it.',
  },
  {
    id: 'docstrange',
    name: 'Docstrange',
    requiredEnv: ['DOCSTRANGE_API_KEY'],
    optionalEnv: [],
    purpose: 'Document extraction for apps that process uploaded reports or source files.',
  },
  {
    id: 'google-cloud-storage',
    name: 'Google Cloud Storage',
    requiredEnv: ['GCS_BUCKET_NAME', 'GCS_SERVICE_ACCOUNT_KEY'],
    optionalEnv: [],
    purpose: 'Shared object storage for app-generated files and uploaded assets.',
  },
  {
    id: 'postgrid',
    name: 'PostGrid',
    requiredEnv: ['POSTGRID_API_KEY'],
    optionalEnv: ['POSTGRID_WEBHOOK_SECRET'],
    purpose: 'Postal mail workflows for apps that generate mailed documents.',
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    requiredEnv: ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL'],
    optionalEnv: [],
    purpose: 'Transactional email for hosted applications.',
  },
  {
    id: 'smtp',
    name: 'SMTP Email',
    requiredEnv: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD'],
    optionalEnv: ['SMTP_PORT'],
    purpose: 'Transactional email for apps that need notifications, receipts, or account workflows.',
  },
] as const;

export function getIntegrationStatus() {
  return providers.map((provider) => ({
    ...provider,
    configured: provider.requiredEnv.every((key) => Boolean(process.env[key])),
    missingRequiredEnv: provider.requiredEnv.filter((key) => !process.env[key]),
  }));
}
