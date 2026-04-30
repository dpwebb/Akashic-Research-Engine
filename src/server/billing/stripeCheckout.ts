import { getCheckoutPlan, monetizationPlans } from '../../shared/monetization.js';

const stripeCheckoutSessionsEndpoint = 'https://api.stripe.com/v1/checkout/sessions';

type CheckoutInput = {
  planId: string;
  origin: string;
  customerEmail?: string;
};

export class BillingConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BillingConfigurationError';
  }
}

export function getBillingPlanOverview() {
  return {
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    plans: monetizationPlans,
  };
}

export async function createStripeCheckoutSession(input: CheckoutInput): Promise<{ id: string; url: string }> {
  const apiKey = process.env.STRIPE_SECRET_KEY;

  if (!apiKey) {
    throw new BillingConfigurationError('Stripe billing is not configured.');
  }

  const plan = getCheckoutPlan(input.planId);
  if (!plan || !plan.unitAmountCents || !plan.interval) {
    throw new Error('Selected plan is not available for checkout.');
  }

  const body = new URLSearchParams();
  body.set('mode', 'subscription');
  body.set('success_url', `${input.origin}/billing?checkout=success&plan=${encodeURIComponent(plan.id)}`);
  body.set('cancel_url', `${input.origin}/billing?checkout=cancelled&plan=${encodeURIComponent(plan.id)}`);
  body.set('allow_promotion_codes', 'true');
  body.set('billing_address_collection', 'auto');
  body.set('line_items[0][quantity]', '1');
  body.set('line_items[0][price_data][currency]', plan.currency);
  body.set('line_items[0][price_data][unit_amount]', String(plan.unitAmountCents));
  body.set('line_items[0][price_data][recurring][interval]', plan.interval);
  body.set('line_items[0][price_data][product_data][name]', plan.name);
  body.set('line_items[0][price_data][product_data][description]', plan.description);
  body.set('metadata[plan_id]', plan.id);

  if (input.customerEmail) {
    body.set('customer_email', input.customerEmail);
  }

  const response = await fetch(stripeCheckoutSessionsEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const data = (await response.json()) as {
    id?: string;
    url?: string;
    error?: {
      message?: string;
    };
  };

  if (!response.ok || !data.id || !data.url) {
    throw new Error(data.error?.message ?? 'Stripe Checkout Session could not be created.');
  }

  return {
    id: data.id,
    url: data.url,
  };
}
