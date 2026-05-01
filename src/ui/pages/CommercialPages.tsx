import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  Database,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { monetizationPlans } from '../../shared/monetization.js';
import type { AccountSession } from '../../shared/types.js';
import { useUserAccess } from '../userAccess.js';

export function PublicHomePage() {
  return (
    <main className="public-site">
      <PublicHeader />
      <section className="home-hero">
        <div className="home-hero__image" aria-hidden="true" />
        <div className="home-hero__content">
          <p className="eyebrow">akashicresearch.info</p>
          <h1>Akashic Research Engine</h1>
          <p>
            A commercial research platform for source-aware Akashic studies, citation review, discovery, and curated
            reference work.
          </p>
          <div className="public-actions">
            <Link className="primary-action" to="/register">
              Start Free <ArrowRight aria-hidden="true" />
            </Link>
            <Link className="secondary-action" to="/login">
              Login
            </Link>
          </div>
        </div>
      </section>

      <section className="public-band">
        <div className="public-section-header">
          <p className="eyebrow">Research workflow</p>
          <h2>Built for evidence-aware esoteric research</h2>
        </div>
        <div className="public-feature-grid">
          <Feature icon={BookOpenCheck} title="Source catalogue" text="Browse reviewed sources, claims, genealogy links, and citation records." />
          <Feature icon={Database} title="Discovery pipeline" text="Search the corpus and public web, then send candidate sources into review." />
          <Feature icon={ShieldCheck} title="Citation guardrails" text="Separate historical support, testimony, speculation, and unsupported claims." />
          <Feature icon={Sparkles} title="Paid workflows" text="Unlock import review, assistant workflows, exports, and advanced research tooling." />
        </div>
      </section>

      <section className="public-band muted-band">
        <div className="public-section-header">
          <p className="eyebrow">Access model</p>
          <h2>Free, Paid, and Enterprise paths</h2>
        </div>
        <div className="scope-strip">
          <ScopeItem title="Free" text="Public reference access and limited discovery." />
          <ScopeItem title="Paid" text="Researcher and Studio workflows with quotas." />
          <ScopeItem title="Enterprise" text="Institutional access, shared policy, and support." />
          <ScopeItem title="Beta tester" text="The current tester remains grandfathered during migration." />
        </div>
      </section>
    </main>
  );
}

export function PricingPage() {
  return (
    <main className="public-site">
      <PublicHeader />
      <section className="public-band public-pricing">
        <div className="public-section-header">
          <p className="eyebrow">Memberships</p>
          <h1>Choose the research scope that fits the work</h1>
        </div>
        <div className="pricing-grid">
          {monetizationPlans.map((plan) => (
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
              <Link className="primary-action" to={plan.checkoutMode === 'none' ? '/register' : '/login'}>
                {plan.checkoutMode === 'none' ? 'Start Access' : 'Login to Upgrade'}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate();
  const { accountEmail, setAccountEmail } = useUserAccess();
  const [email, setEmail] = useState(accountEmail);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pageText = useMemo(
    () =>
      mode === 'login'
        ? {
            eyebrow: 'Login access',
            title: 'Return to the research workspace',
            body: 'Use the beta tester account or an existing membership email to enter the app.',
            button: 'Login',
          }
        : {
            eyebrow: 'Free account',
            title: 'Create research access',
            body: 'Create a Free account for public catalogue access and future upgrade paths.',
            button: 'Create Account',
          },
    [mode],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const normalizedEmail = email.trim().toLocaleLowerCase();
      if (!normalizedEmail) {
        throw new Error('Enter an email address.');
      }

      const sessionResponse = await fetch(`/api/account/session?email=${encodeURIComponent(normalizedEmail)}`);
      if (!sessionResponse.ok) {
        throw new Error('Account session could not be prepared.');
      }

      const session = (await sessionResponse.json()) as AccountSession;

      if (mode === 'register' && !session.betaTester) {
        const entitlementResponse = await fetch('/api/account/entitlement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail, planId: 'public-library', status: 'active' }),
        });

        if (!entitlementResponse.ok) {
          const data = await entitlementResponse.json();
          throw new Error(data.error ?? 'Free account could not be created.');
        }
      }

      setAccountEmail(normalizedEmail);
      navigate('/app');
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Access could not be prepared.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="public-site">
      <PublicHeader />
      <section className="auth-layout">
        <div className="auth-copy">
          <p className="eyebrow">{pageText.eyebrow}</p>
          <h1>{pageText.title}</h1>
          <p>{pageText.body}</p>
          <div className="auth-proof">
            <ShieldCheck aria-hidden="true" />
            <span>Beta tester access remains grandfathered through this migration.</span>
          </div>
        </div>
        <form className="auth-panel" onSubmit={submit}>
          <label>
            Account email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="researcher@example.com"
            />
          </label>
          <button type="submit" disabled={isSubmitting}>
            <LockKeyhole aria-hidden="true" />
            {isSubmitting ? 'Preparing...' : pageText.button}
          </button>
          {error && <p className="form-error">{error}</p>}
          <p className="muted">
            {mode === 'login' ? (
              <>
                Need access? <Link to="/register">Create a Free account</Link>.
              </>
            ) : (
              <>
                Already registered? <Link to="/login">Login</Link>.
              </>
            )}
          </p>
        </form>
      </section>
    </main>
  );
}

function PublicHeader() {
  return (
    <header className="public-header">
      <Link className="public-brand" to="/">
        <Database aria-hidden="true" />
        <span>Akashic Research Engine</span>
      </Link>
      <nav aria-label="Public navigation">
        <Link to="/pricing">Pricing</Link>
        <Link to="/login">Login</Link>
        <Link to="/app">Enter App</Link>
      </nav>
    </header>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <article className="public-feature">
      <Icon aria-hidden="true" />
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function ScopeItem({ title, text }: { title: string; text: string }) {
  return (
    <article className="scope-item">
      <Users aria-hidden="true" />
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}
