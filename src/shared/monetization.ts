import type { AccountPlanId, UsageLimits, UsageMetric } from './types.js';

export type BillingInterval = 'month' | 'year';
export type CheckoutMode = 'subscription' | 'none';

export type MonetizationPlan = {
  id: AccountPlanId;
  name: string;
  audience: string;
  description: string;
  priceLabel: string;
  unitAmountCents: number | null;
  currency: 'usd';
  checkoutMode: CheckoutMode;
  interval?: BillingInterval;
  featured?: boolean;
  usageLimits: UsageLimits;
  features: string[];
  revenueUse: string;
};

export const monetizationPlans: MonetizationPlan[] = [
  {
    id: 'public-library',
    name: 'Public Library',
    audience: 'Open reference access',
    description: 'Browse the seeded evidence-aware research corpus and public reference views.',
    priceLabel: '$0',
    unitAmountCents: null,
    currency: 'usd',
    checkoutMode: 'none',
    usageLimits: {
      discoverySearches: 5,
      sourceImports: 0,
      assistantGenerations: 0,
      reviewSubmissions: 0,
      exports: 0,
    },
    features: [
      'Dashboard, sources, claims, genealogy, and index access',
      'Evidence grades and source classifications',
      'Public bibliography and research guardrails',
    ],
    revenueUse: 'Open access tier for public education and search discovery.',
  },
  {
    id: 'researcher-seat',
    name: 'Researcher Seat',
    audience: 'Independent researchers',
    description: 'Self-serve research membership for source discovery, import review, and citation workflow support.',
    priceLabel: '$19/mo',
    unitAmountCents: 1900,
    currency: 'usd',
    checkoutMode: 'subscription',
    interval: 'month',
    featured: true,
    usageLimits: {
      discoverySearches: 120,
      sourceImports: 40,
      assistantGenerations: 25,
      reviewSubmissions: 40,
      exports: 10,
    },
    features: [
      'Discovery and import workflow access',
      '120 discovery searches and 40 source imports monthly',
      '10 citation or bibliography exports monthly',
      'Review queue participation for candidate sources',
      'Citation completeness and source quality review workflow',
    ],
    revenueUse: 'Funds source review, citation cleanup, and public-domain corpus expansion.',
  },
  {
    id: 'studio-seat',
    name: 'Studio Seat',
    audience: 'Authors and research teams',
    description: 'Advanced membership for assistant templates, speculative addition drafting, and deeper corpus workflows.',
    priceLabel: '$49/mo',
    unitAmountCents: 4900,
    currency: 'usd',
    checkoutMode: 'subscription',
    interval: 'month',
    usageLimits: {
      discoverySearches: 400,
      sourceImports: 160,
      assistantGenerations: 160,
      reviewSubmissions: 120,
      exports: 60,
    },
    features: [
      'Research assistant and addition builder workflows',
      '400 discovery searches, 160 assistant generations, and 60 exports monthly',
      'Structured contradiction and boundary review process',
      'Priority source ingestion and bibliography expansion queue',
    ],
    revenueUse: 'Funds AI-assisted research tooling, higher review throughput, and archive maintenance.',
  },
  {
    id: 'institution-license',
    name: 'Institution License',
    audience: 'Libraries, groups, and classrooms',
    description: 'Custom licensing for shared research access, training, and corpus stewardship.',
    priceLabel: 'Custom',
    unitAmountCents: null,
    currency: 'usd',
    checkoutMode: 'none',
    usageLimits: {
      discoverySearches: null,
      sourceImports: null,
      assistantGenerations: null,
      reviewSubmissions: null,
      exports: null,
    },
    features: [
      'Shared workspace and review standards',
      'Unlimited team usage with a custom review policy',
      'Curriculum or library-oriented onboarding',
      'Custom corpus import and review policy support',
    ],
    revenueUse: 'Funds curated collections, reviewer time, and long-term source preservation.',
  },
];

export const usageMetricLabels: Record<UsageMetric, string> = {
  discoverySearches: 'Discovery searches',
  sourceImports: 'Source imports',
  assistantGenerations: 'Assistant generations',
  reviewSubmissions: 'Review submissions',
  exports: 'Exports',
};

export function getCheckoutPlan(planId: string): MonetizationPlan | undefined {
  return monetizationPlans.find((plan) => plan.id === planId && plan.checkoutMode !== 'none');
}
