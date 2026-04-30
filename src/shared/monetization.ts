export type BillingInterval = 'month' | 'year';
export type CheckoutMode = 'subscription' | 'none';

export type MonetizationPlan = {
  id: string;
  name: string;
  audience: string;
  description: string;
  priceLabel: string;
  unitAmountCents: number | null;
  currency: 'usd';
  checkoutMode: CheckoutMode;
  interval?: BillingInterval;
  featured?: boolean;
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
    features: [
      'Discovery and import workflow access',
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
    features: [
      'Research assistant and addition builder workflows',
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
    features: [
      'Shared workspace and review standards',
      'Curriculum or library-oriented onboarding',
      'Custom corpus import and review policy support',
    ],
    revenueUse: 'Funds curated collections, reviewer time, and long-term source preservation.',
  },
];

export function getCheckoutPlan(planId: string): MonetizationPlan | undefined {
  return monetizationPlans.find((plan) => plan.id === planId && plan.checkoutMode !== 'none');
}
