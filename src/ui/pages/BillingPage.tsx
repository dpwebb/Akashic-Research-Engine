import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Check, CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { monetizationPlans, type MonetizationPlan } from '../../shared/monetization.js';

type BillingOverview = {
  stripeConfigured: boolean;
  plans: MonetizationPlan[];
};

export function BillingPage() {
  const location = useLocation();
  const [overview, setOverview] = useState<BillingOverview>({
    stripeConfigured: false,
    plans: monetizationPlans,
  });
  const [customerEmail, setCustomerEmail] = useState('');
  const [activePlanId, setActivePlanId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const checkoutNotice = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('checkout');

    if (status === 'success') {
      return 'Checkout completed. Membership access can be reconciled when account authentication is connected.';
    }

    if (status === 'cancelled') {
      return 'Checkout was cancelled before payment.';
    }

    return '';
  }, [location.search]);

  useEffect(() => {
    async function loadBillingOverview() {
      const response = await fetch('/api/billing/plans');

      if (response.ok) {
        setOverview((await response.json()) as BillingOverview);
      }
    }

    void loadBillingOverview();
  }, []);

  async function startCheckout(event: FormEvent<HTMLFormElement>, planId: string) {
    event.preventDefault();
    setError('');
    setMessage('');
    setActivePlanId(planId);

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          customerEmail: customerEmail.trim() || undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Checkout could not be started.');
      }

      window.location.assign(data.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Checkout could not be started.');
    } finally {
      setActivePlanId('');
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Memberships</p>
        <h1>Support the Research Engine</h1>
        <p>Paid access funds source review, citation cleanup, archive growth, and evidence-aware research tooling.</p>
      </header>

      <section className="billing-status-panel">
        <ShieldCheck aria-hidden="true" />
        <div>
          <h2>{overview.stripeConfigured ? 'Stripe Checkout Active' : 'Billing Setup Pending'}</h2>
          <p>
            {overview.stripeConfigured
              ? 'Membership checkout is available for paid plans.'
              : 'Paid plans are visible, but checkout requires the existing Stripe secret key to be configured on the server.'}
          </p>
        </div>
      </section>

      {checkoutNotice && <p className="form-success">{checkoutNotice}</p>}
      {message && <p className="form-success">{message}</p>}
      {error && <p className="form-error">{error}</p>}

      <section className="billing-email-panel">
        <label>
          Checkout email
          <input
            type="email"
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            placeholder="researcher@example.com"
          />
        </label>
      </section>

      <div className="pricing-grid">
        {overview.plans.map((plan) => {
          const canCheckout = plan.checkoutMode !== 'none' && overview.stripeConfigured;
          const isLoading = activePlanId === plan.id;

          return (
            <article className={plan.featured ? 'pricing-card featured' : 'pricing-card'} key={plan.id}>
              {plan.featured && <span className="plan-badge">Core membership</span>}
              <div>
                <p className="eyebrow">{plan.audience}</p>
                <h2>{plan.name}</h2>
                <strong>{plan.priceLabel}</strong>
              </div>
              <p>{plan.description}</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <p className="notes">{plan.revenueUse}</p>
              <form onSubmit={(event) => startCheckout(event, plan.id)}>
                <button type="submit" disabled={!canCheckout || isLoading}>
                  {isLoading ? <Loader2 aria-hidden="true" /> : <CreditCard aria-hidden="true" />}
                  {plan.checkoutMode === 'none'
                    ? 'No Checkout'
                    : overview.stripeConfigured
                      ? 'Start Checkout'
                      : 'Checkout Pending'}
                </button>
              </form>
            </article>
          );
        })}
      </div>
    </section>
  );
}
