import { BookOpenCheck, CheckCircle2, LockKeyhole, Map, ShieldCheck, Users } from 'lucide-react';
import { monetizationPlans, usageMetricLabels } from '../../shared/monetization.js';
import type { UsageMetric, UserScope } from '../../shared/types.js';
import { useUserAccess } from '../userAccess.js';

type ManualSection = {
  title: string;
  items: string[];
};

type ScopeManual = {
  scope: UserScope;
  name: string;
  audience: string;
  purpose: string;
  grantedBy: string;
  navigation: string[];
  workflows: ManualSection[];
  responsibilities: string[];
  boundaries: string[];
  upgradePath?: string;
};

type WorkspaceArea = {
  area: string;
  minimumScope: UserScope;
  users: string;
  details: string[];
};

const tierBundles = [
  {
    label: 'Anonymous public visitor',
    scopes: ['public'],
    source: 'Public website or anonymous account session',
    usage: 'Marketing pages, pricing, login/register, and public-safe reference context.',
  },
  {
    label: 'Free / Public Library',
    scopes: ['public', 'free'],
    source: 'Free fallback tier or signed-in Public Library entitlement',
    usage: 'Browse the corpus, run public-library discovery, inspect evidence grades, and review membership options.',
  },
  {
    label: 'Researcher Seat',
    scopes: ['public', 'free', 'paid'],
    source: 'Active or trialing researcher-seat entitlement',
    usage: 'Adds URL scrubber, source import preview, review submission, and paid export workflows.',
  },
  {
    label: 'Studio Seat',
    scopes: ['public', 'free', 'paid', 'studio'],
    source: 'Active or trialing studio-seat entitlement',
    usage: 'Adds assistant generation and disciplined speculative addition drafting.',
  },
  {
    label: 'Institution License',
    scopes: ['public', 'free', 'paid', 'studio', 'enterprise'],
    source: 'Active or trialing institution-license entitlement',
    usage: 'Custom shared access, unlimited plan quotas, and institution-grade review policy support.',
  },
  {
    label: 'Beta Tester / Admin',
    scopes: ['public', 'free', 'paid', 'studio', 'enterprise', 'betaTester', 'admin'],
    source: 'Grandfathered beta tester account or admin-scoped session',
    usage: 'Full workspace access, admin configuration drilldown, and beta fallback scope testing.',
  },
] satisfies Array<{ label: string; scopes: UserScope[]; source: string; usage: string }>;

const workspaceAreas: WorkspaceArea[] = [
  {
    area: 'Dashboard',
    minimumScope: 'public',
    users: 'All workspace users',
    details: [
      'Use the metrics to check source count, claim count, genealogy nodes, review queue pressure, and speculative claim volume.',
      'Review corpus health before citing or promoting sources.',
      'Use online signals as leads only; they are not verified source evidence by themselves.',
    ],
  },
  {
    area: 'Operations',
    minimumScope: 'public',
    users: 'Operators and reviewers',
    details: [
      'Monitor persistence mode, backup freshness, review queue throughput, ingestion jobs, revenue mix, and launch phase status.',
      'Treat action items as the operational triage queue before deployment or major corpus changes.',
      'Do not treat operations summaries as a substitute for source-level review.',
    ],
  },
  {
    area: 'Research Index, Sources, Claims, and Genealogy',
    minimumScope: 'free',
    users: 'Readers, researchers, reviewers, and paid seats',
    details: [
      'Use Sources for source metadata, classifications, confidence levels, and citation notes.',
      'Use Claims for evidence grades, citation-required flags, and normalized claim review.',
      'Use Genealogy to inspect concept inheritance, influence, reinterpretation, parallel concepts, and disputed links.',
      'Use the Research Index for people, movements, terms, comparative concepts, timeline entries, and bibliography records.',
    ],
  },
  {
    area: 'Discovery',
    minimumScope: 'free',
    users: 'Free and paid research users',
    details: [
      'Run combined, engine-only, or public-web searches with filters for source type, evidence grade, date range, terms, domain, source id, and minimum relevance.',
      'Save credible results to the review queue only when the title, domain, summary, and citation notes are useful enough for later verification.',
      'The URL scrubber requires paid scope and should be used before importing or reviewing unfamiliar public pages.',
    ],
  },
  {
    area: 'Source Import',
    minimumScope: 'paid',
    users: 'Researcher, Studio, Enterprise, Beta Tester, and Admin users',
    details: [
      'Preview a URL before review so the system can detect canonical URL, source fingerprint, domain, title, description, word count, full-text candidacy, duplicate candidates, and quality flags.',
      'Send only useful previews to the review queue, then queue full-text extraction when the preview marks the source as a candidate.',
      'Resolve duplicate candidates before promotion so the trusted corpus does not split the same source across multiple records.',
    ],
  },
  {
    area: 'Seed Queue',
    minimumScope: 'free',
    users: 'Reviewers and corpus maintainers',
    details: [
      'Filter by seed pack, review status, provenance, source class, priority, citation status, and text query.',
      'Move items through pending, reviewed, approved, promoted, and rejected states with reviewer notes.',
      'Promote only reviewed or approved items, and only after citation completeness, source classification, duplicate checks, and claim/testimony boundaries are acceptable.',
    ],
  },
  {
    area: 'Assistant',
    minimumScope: 'studio',
    users: 'Studio, Enterprise, Beta Tester, and Admin users',
    details: [
      'Choose a prompt template, paste research material, and generate output that preserves source boundaries.',
      'Treat assistant output as draft analysis; verify all claims against source pages before export or publication.',
      'Do not use generated text to convert speculation, testimony, metaphor, or belief into historical fact.',
    ],
  },
  {
    area: 'Addition Builder',
    minimumScope: 'studio',
    users: 'Studio, Enterprise, Beta Tester, and Admin users',
    details: [
      'Select a framework, title, linked source basis, uncertainty level, citations needed, counterarguments, and not-justified claims.',
      'Complete every guardrail before generating a speculative addition brief.',
      'Saved drafts stay outside the verified corpus until citation and category review is complete.',
    ],
  },
  {
    area: 'Exports',
    minimumScope: 'paid',
    users: 'Researcher, Studio, Enterprise, Beta Tester, and Admin users',
    details: [
      'Generate citation packets, contradiction reports, source review dossiers, genealogy summaries, and bibliography exports.',
      'Use a clear title and account email so generated export usage is traceable.',
      'Review exported markdown before using it outside the workspace because exports reflect the current corpus state.',
    ],
  },
  {
    area: 'Memberships',
    minimumScope: 'public',
    users: 'All users and account operators',
    details: [
      'Review plan features, usage limits, checkout readiness, entitlement status, and usage counters.',
      'Checkout depends on server billing configuration; beta tester access bypasses checkout.',
      'Account assignment controls should be used deliberately because they alter access and usage scopes.',
    ],
  },
  {
    area: 'Admin Config',
    minimumScope: 'admin',
    users: 'Admin and Beta Tester accounts only',
    details: [
      'Inspect application mode, host, port, origin, persistence mode, backup status, integration status, feature gates, and dataset counts.',
      'Use config drilldown for diagnostics; do not expose secret values or credential material.',
      'Admin scope is operational authority, not normal enterprise access.',
    ],
  },
];

const scopeManuals: ScopeManual[] = [
  {
    scope: 'public',
    name: 'Public Scope',
    audience: 'Anonymous visitors, public website readers, and every account as the base scope.',
    purpose:
      'Public scope establishes the safe public surface of the product: commercial pages, login/register entry points, pricing, and public-safe reference context.',
    grantedBy:
      'Every account session includes public scope. Anonymous sessions from the server receive public scope even before an email is known.',
    navigation: ['Public home', 'Pricing', 'Login', 'Register', 'Memberships', 'Manual'],
    workflows: [
      {
        title: 'First visit workflow',
        items: [
          'Open the public home page to understand the research product and the evidence-aware positioning.',
          'Review pricing before choosing whether the current task needs free, paid, studio, enterprise, beta, or admin access.',
          'Use login or register to provide an account email when you need account-backed usage tracking or paid scope.',
        ],
      },
      {
        title: 'Reference workflow',
        items: [
          'Treat public information as orientation, not as a reviewed research deliverable.',
          'Move into the workspace when you need corpus views, evidence grades, source classifications, review queues, imports, or exports.',
          'Do not assume public scope alone permits assistant generation, source import, paid exports, admin drilldown, or speculative draft saves.',
        ],
      },
    ],
    responsibilities: [
      'Do not cite public marketing copy as corpus evidence.',
      'Do not enter private credentials, secret values, or restricted source text into public forms.',
      'Use the membership page to confirm what access level is required before starting paid workflows.',
    ],
    boundaries: [
      'No assistant generation.',
      'No source import preview.',
      'No paid exports.',
      'No admin config drilldown.',
      'No saved speculative addition drafts.',
    ],
    upgradePath: 'Sign in for free workspace access, or choose Researcher, Studio, or Institution access for paid workflows.',
  },
  {
    scope: 'free',
    name: 'Free Scope',
    audience: 'Public Library users, signed-in readers, and free fallback users in the workspace.',
    purpose:
      'Free scope supports evidence-aware browsing and light discovery without paid import, export, assistant, or speculative drafting privileges.',
    grantedBy:
      'A signed-in Public Library entitlement, or the local free fallback tier while authentication hardening is in progress.',
    navigation: ['Dashboard', 'Operations', 'Research Index', 'Sources', 'Claims', 'Genealogy', 'Discovery', 'Seed Queue', 'Memberships', 'Manual'],
    workflows: [
      {
        title: 'Corpus reading workflow',
        items: [
          'Start at Dashboard to check current source, claim, index, review, and backup summaries.',
          'Open Sources before Claims when you need to understand source type, confidence, citation notes, and URL context.',
          'Use Claims to separate historical statements, textual claims, testimony, comparative claims, and speculation.',
          'Use Genealogy for relationships between terms, movements, people, and comparative concepts.',
        ],
      },
      {
        title: 'Discovery workflow',
        items: [
          'Use focused search queries and filters rather than broad spirituality searches.',
          'Prefer engine corpus search when you need already classified material.',
          'Use public web search as lead discovery only; save results for review before treating them as source evidence.',
          'When saving a result, write citation notes that explain why the lead belongs in the queue.',
        ],
      },
      {
        title: 'Review queue workflow',
        items: [
          'Filter Seed Queue items by citation status, source class, provenance, and priority before changing statuses.',
          'Mark items reviewed only after the source identity, domain, summary, and citation status are coherent.',
          'Approve only after duplicate candidates and source boundaries have been considered.',
        ],
      },
    ],
    responsibilities: [
      'Keep claim/testimony/speculation boundaries intact when reading or saving leads.',
      'Do not use the review queue to launder low-quality or commercial claims into the corpus.',
      'Record enough notes that a later reviewer can reproduce why the source was saved.',
    ],
    boundaries: [
      'The URL scrubber is not enabled without paid scope.',
      'Source import preview is not enabled without paid scope.',
      'Exports are not generated without paid scope.',
      'Assistant generation and Addition Builder access require Studio or higher.',
    ],
    upgradePath: 'Upgrade to Researcher for paid discovery tools, import preview, review submissions, and exports.',
  },
  {
    scope: 'paid',
    name: 'Paid Scope',
    audience: 'Researcher seats and all higher plans.',
    purpose:
      'Paid scope funds and unlocks the workflows that change the working corpus: scrubber checks, import preview, review submissions, usage-tracked discovery, and exports.',
    grantedBy:
      'An active or trialing Researcher Seat, Studio Seat, Institution License, Beta Tester account, or Admin account.',
    navigation: [
      'Dashboard',
      'Research Index',
      'Sources',
      'Claims',
      'Genealogy',
      'Discovery with URL Scrubber',
      'Source Import',
      'Seed Queue',
      'Exports',
      'Memberships',
      'Manual',
    ],
    workflows: [
      {
        title: 'URL scrubber workflow',
        items: [
          'Paste a public URL into Discovery scrubber before importing the source.',
          'Check relevance, recommendation, matched keywords, and risk flags.',
          'Reject pages that are promotional, low-trust, off-topic, or impossible to cite cleanly.',
        ],
      },
      {
        title: 'Import preview workflow',
        items: [
          'Preview a URL to collect title, domain, content type, author/date hints, word count, canonical URL, and fingerprint.',
          'Inspect duplicate candidates before saving to review or queuing extraction.',
          'Send a preview to review only when the citation notes, quality flags, and required actions are clear.',
          'Queue full-text extraction when the preview is a full-text candidate and the source is worth deeper review.',
        ],
      },
      {
        title: 'Export workflow',
        items: [
          'Choose the deliverable type that matches the research task: citation packet, contradiction report, source review dossier, genealogy summary, or bibliography export.',
          'Use a descriptive title and account email before generating the export.',
          'Read the markdown output before sharing it; exports inherit the current review state and may contain items still requiring citation cleanup.',
        ],
      },
    ],
    responsibilities: [
      'Respect monthly usage limits unless the account has a custom enterprise allowance.',
      'Treat every imported source as untrusted until it survives review.',
      'Keep duplicate, citation, and quality flags visible rather than editing them away prematurely.',
      'Use exports as working documents, not as proof that all included claims are verified.',
    ],
    boundaries: [
      'Paid scope alone does not enable assistant generation.',
      'Paid scope alone does not enable speculative addition drafting.',
      'Paid scope does not grant Admin Config access.',
    ],
    upgradePath: 'Upgrade to Studio for assistant templates and disciplined speculative addition drafts.',
  },
  {
    scope: 'studio',
    name: 'Studio Scope',
    audience: 'Authors, editors, research teams, and users preparing structured research outputs.',
    purpose:
      'Studio scope adds AI-assisted drafting and speculative addition workflows while keeping evidence boundaries explicit.',
    grantedBy: 'An active or trialing Studio Seat, Institution License, Beta Tester account, or Admin account.',
    navigation: [
      'Dashboard',
      'Discovery',
      'Source Import',
      'Seed Queue',
      'Assistant',
      'Addition Builder',
      'Exports',
      'Memberships',
      'Manual',
    ],
    workflows: [
      {
        title: 'Assistant workflow',
        items: [
          'Choose a prompt template that matches the research operation before pasting source notes.',
          'Paste enough material for the template to distinguish direct source evidence from interpretation.',
          'Review generated output for unsupported claims, collapsed categories, missing uncertainty, and missing citations.',
          'Move corrected output into exports or external work only after source verification.',
        ],
      },
      {
        title: 'Addition Builder workflow',
        items: [
          'Select a speculation framework before drafting the proposed interpretation.',
          'Link at least one known source and choose the uncertainty level honestly.',
          'Write citations still needed, counterarguments, and claims that are not justified.',
          'Check every guardrail before generating the brief.',
          'Save drafts for review only when the brief is ready to be inspected by another reviewer.',
        ],
      },
    ],
    responsibilities: [
      'Keep AI output subordinate to source review.',
      'Label speculative content in the title or first paragraph.',
      'Do not promote drafts into verified corpus material without citation and category review.',
      'Include counterarguments and weaker explanations when drafting new interpretations.',
    ],
    boundaries: [
      'Studio scope does not grant enterprise organization controls.',
      'Studio scope does not grant Admin Config access.',
      'Studio scope does not bypass checkout unless the user is also a Beta Tester or Admin.',
    ],
    upgradePath: 'Use Institution License when multiple users need shared policy, custom quotas, or classroom/library onboarding.',
  },
  {
    scope: 'enterprise',
    name: 'Enterprise Scope',
    audience: 'Institutions, libraries, groups, classrooms, and managed research teams.',
    purpose:
      'Enterprise scope represents custom shared access and institution-level usage expectations without granting system administrator authority.',
    grantedBy: 'An active or trialing Institution License, Beta Tester account, or Admin account.',
    navigation: [
      'Dashboard',
      'Operations',
      'Research Index',
      'Sources',
      'Claims',
      'Genealogy',
      'Discovery',
      'Source Import',
      'Seed Queue',
      'Assistant',
      'Addition Builder',
      'Exports',
      'Memberships',
      'Manual',
    ],
    workflows: [
      {
        title: 'Shared review workflow',
        items: [
          'Agree on source classification, citation completeness, duplicate handling, and promotion rules before team review begins.',
          'Use review notes so team members can understand why an item was reviewed, approved, rejected, or promoted.',
          'Track unresolved duplicate candidates and citation-needed items as shared work, not individual memory.',
        ],
      },
      {
        title: 'Institution export workflow',
        items: [
          'Generate exports for curriculum, library review, source review dossiers, and bibliography handoff.',
          'Treat exports as review packages that may require local institutional formatting or policy review.',
          'Confirm rights status before distributing source text or bibliography records beyond permitted use.',
        ],
      },
    ],
    responsibilities: [
      'Define a review policy for the institution before expanding the corpus.',
      'Keep team access separate from admin access.',
      'Use custom quotas responsibly; unlimited usage does not remove citation or source-quality duties.',
      'Protect student, patron, reviewer, or organization-sensitive information.',
    ],
    boundaries: [
      'Enterprise scope is not Admin scope.',
      'Enterprise scope does not expose secret values or deployment credentials.',
      'Enterprise users should not use beta fallback controls unless they also hold Beta Tester or Admin scope.',
    ],
    upgradePath: 'Request Admin scope only for trusted operators who need configuration diagnostics and beta fallback testing.',
  },
  {
    scope: 'betaTester',
    name: 'Beta Tester Scope',
    audience: 'Grandfathered beta users validating the commercial launch path.',
    purpose:
      'Beta Tester scope keeps the original beta user fully operational while billing, authentication, and paid gates are hardened.',
    grantedBy:
      'The configured beta tester email receives institution-license entitlement, paid/studio/enterprise scopes, betaTester scope, and admin scope at runtime.',
    navigation: [
      'All normal workspace pages',
      'Addition Builder',
      'Admin Config',
      'Beta fallback scope switcher',
      'Memberships with billing bypass notice',
    ],
    workflows: [
      {
        title: 'Beta validation workflow',
        items: [
          'Confirm the beta account can enter every paid, studio, enterprise, and admin workflow without checkout.',
          'Use beta access to verify scope gates, usage counters, review queues, exports, and speculative draft saves.',
          'Report differences between intended scope behavior and actual UI/API behavior before launch hardening.',
        ],
      },
      {
        title: 'Billing bypass workflow',
        items: [
          'Use Memberships to confirm beta bypass status and entitlement health.',
          'Do not create duplicate paid subscriptions for the beta tester account.',
          'Keep beta access active until production sign-in and commercial gates are verified.',
        ],
      },
    ],
    responsibilities: [
      'Use full access for testing and launch validation, not to bypass review discipline.',
      'Preserve evidence, citation, and speculation guardrails while exercising elevated workflows.',
      'Avoid changing production configuration unless explicitly performing an admin diagnostic task.',
    ],
    boundaries: [
      'Beta Tester scope is privileged and should not be copied to normal paid users.',
      'Beta bypass is not a general coupon or public access model.',
      'Beta Tester access may include admin scope in this phase, but the two concepts should stay distinct in documentation and future account management.',
    ],
  },
  {
    scope: 'admin',
    name: 'Admin Scope',
    audience: 'Trusted operators responsible for diagnostics, configuration review, and controlled scope testing.',
    purpose:
      'Admin scope exposes operational diagnostics and the beta fallback switcher. It is for system stewardship, not normal research usage.',
    grantedBy: 'The beta tester account currently receives admin scope; future admin grants should be explicit and limited.',
    navigation: ['Admin Config', 'Operations', 'Memberships', 'All research workflow pages', 'Manual'],
    workflows: [
      {
        title: 'Configuration drilldown workflow',
        items: [
          'Open Admin Config to inspect app name, mode, host, port, origin, persistence mode, backup status, integrations, feature limits, and dataset counts.',
          'Use diagnostics to find missing integrations, runtime persistence issues, or launch readiness gaps.',
          'Never print or expose secret values; only confirm whether named secrets or integrations exist.',
        ],
      },
      {
        title: 'Beta fallback testing workflow',
        items: [
          'Use the sidebar fallback scope switcher to simulate Free, Researcher, Studio, Enterprise, and Beta Tester behavior.',
          'Confirm visible navigation, disabled controls, quota messaging, and paywall copy for each tier.',
          'Return to the intended operator scope after testing to avoid confusing manual review or usage records.',
        ],
      },
      {
        title: 'Operational stewardship workflow',
        items: [
          'Run local typecheck/build before publishing changes.',
          'Use source-of-truth checks before manual deployment checks.',
          'Treat GitHub as the production deployment source of truth.',
        ],
      },
    ],
    responsibilities: [
      'Protect secrets, deploy credentials, private keys, and environment values.',
      'Keep enterprise team access separate from administrator access.',
      'Document scope changes and entitlement changes when they affect launch readiness.',
      'Do not use admin access to skip source review, duplicate handling, citation verification, or speculative boundaries.',
    ],
    boundaries: [
      'Admin scope is not required for normal paid research work.',
      'Admin scope should not be given to institution users by default.',
      'Admin access is diagnostic and operational; it does not make unverified claims reliable.',
    ],
  },
];

export function UserManualPage() {
  const { policy, account, accountEmail } = useUserAccess();
  const activeScopes = new Set(policy.scopes);

  return (
    <section className="page-stack manual-page">
      <header className="page-header compact">
        <p className="eyebrow">User manual</p>
        <h1>Scope-Based User Manual</h1>
        <p>
          Use this manual to understand what each access scope is for, which workspace tools it unlocks, and what
          review duties apply before source material becomes trusted research output.
        </p>
      </header>

      <section className="manual-current-access">
        <article>
          <ShieldCheck aria-hidden="true" />
          <span>Current access</span>
          <strong>{policy.label}</strong>
          <small>{account?.email ?? (accountEmail || 'anonymous')}</small>
        </article>
        <article>
          <Users aria-hidden="true" />
          <span>Active scopes</span>
          <strong>{policy.scopes.length}</strong>
          <small>{policy.scopes.join(', ')}</small>
        </article>
        <article>
          <LockKeyhole aria-hidden="true" />
          <span>Admin tools</span>
          <strong>{policy.canAccessAdmin ? 'Available' : 'Restricted'}</strong>
          <small>{policy.canAccessAdmin ? 'Admin Config is visible' : 'Admin Config is hidden'}</small>
        </article>
      </section>

      <nav className="manual-toc" aria-label="Manual sections">
        <a href="#scope-bundles">Scope bundles</a>
        <a href="#plan-limits">Plan limits</a>
        <a href="#workspace-guide">Workspace guide</a>
        {scopeManuals.map((manual) => (
          <a href={`#${scopeId(manual.scope)}`} key={manual.scope}>
            {manual.name}
          </a>
        ))}
      </nav>

      <section className="panel" id="scope-bundles">
        <div className="export-preview-header">
          <div>
            <h2>Scope Bundles</h2>
            <p className="muted">Scopes are cumulative. Higher access keeps the lower reading and review capabilities.</p>
          </div>
          <span className="tag">current: {policy.label}</span>
        </div>
        <div className="manual-bundle-grid">
          {tierBundles.map((bundle) => (
            <article className="manual-bundle-card" key={bundle.label}>
              <h3>{bundle.label}</h3>
              <p>{bundle.usage}</p>
              <small>{bundle.source}</small>
              <div className="manual-scope-chips">
                {bundle.scopes.map((scope) => (
                  <span className={activeScopes.has(scope) ? 'tag active-scope' : 'tag'} key={scope}>
                    {scope}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel" id="plan-limits">
        <h2>Plan Limits And Entitlement Mapping</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Plan</th>
                <th>Scope bundle</th>
                <th>Usage limits</th>
                <th>Primary use</th>
              </tr>
            </thead>
            <tbody>
              {monetizationPlans.map((plan) => (
                <tr key={plan.id}>
                  <td>
                    <strong>{plan.name}</strong>
                    <span>{plan.priceLabel}</span>
                  </td>
                  <td>{scopeBundleForPlan(plan.id).join(', ')}</td>
                  <td>
                    <ul className="manual-compact-list">
                      {(Object.entries(plan.usageLimits) as Array<[UsageMetric, number | null]>).map(([metric, limit]) => (
                        <li key={metric}>
                          {usageMetricLabels[metric]}: {limit === null ? 'Unlimited' : limit.toLocaleString()}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td>{plan.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel" id="workspace-guide">
        <div className="export-preview-header">
          <div>
            <h2>Workspace Area Guide</h2>
            <p className="muted">Each area has a minimum intended scope and a review responsibility.</p>
          </div>
          <BookOpenCheck aria-hidden="true" className="manual-section-icon" />
        </div>
        <div className="manual-area-grid">
          {workspaceAreas.map((area) => (
            <article className="manual-area-card" key={area.area}>
              <div>
                <span className={activeScopes.has(area.minimumScope) ? 'tag active-scope' : 'tag'}>
                  {area.minimumScope}+ scope
                </span>
                <h3>{area.area}</h3>
                <p className="muted">{area.users}</p>
              </div>
              <ul className="rule-list">
                {area.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="manual-scope-stack" aria-label="Manual by user scope">
        {scopeManuals.map((manual) => {
          const isActive = activeScopes.has(manual.scope);

          return (
            <article className={isActive ? 'manual-scope-panel active' : 'manual-scope-panel'} id={scopeId(manual.scope)} key={manual.scope}>
              <header>
                <div>
                  <span className={isActive ? 'tag active-scope' : 'tag'}>{isActive ? 'active scope' : manual.scope}</span>
                  <h2>{manual.name}</h2>
                  <p>{manual.audience}</p>
                </div>
                <Map aria-hidden="true" />
              </header>

              <div className="manual-scope-summary">
                <article>
                  <span>Purpose</span>
                  <p>{manual.purpose}</p>
                </article>
                <article>
                  <span>Granted by</span>
                  <p>{manual.grantedBy}</p>
                </article>
                {manual.upgradePath && (
                  <article>
                    <span>Next access step</span>
                    <p>{manual.upgradePath}</p>
                  </article>
                )}
              </div>

              <section className="manual-subsection">
                <h3>Navigation Available</h3>
                <div className="manual-scope-chips">
                  {manual.navigation.map((item) => (
                    <span className="tag" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
              </section>

              <div className="manual-two-column">
                <section className="manual-subsection">
                  <h3>Workflow Manual</h3>
                  {manual.workflows.map((section) => (
                    <div className="manual-list-block" key={section.title}>
                      <h4>{section.title}</h4>
                      <ol>
                        {section.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </section>

                <section className="manual-subsection">
                  <h3>Responsibilities</h3>
                  <ul className="manual-check-list">
                    {manual.responsibilities.map((item) => (
                      <li key={item}>
                        <CheckCircle2 aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <h3>Boundaries</h3>
                  <ul className="rule-list">
                    {manual.boundaries.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              </div>
            </article>
          );
        })}
      </section>

      <section className="panel">
        <h2>Launch-Phase Notes</h2>
        <ul className="rule-list">
          <li>Authentication and server-side scope enforcement are still being hardened during the commercial launch phases.</li>
          <li>UI gates are active for imports, assistant workflows, exports, and the addition builder.</li>
          <li>Direct API protection is being standardized, so privileged users should still follow the intended scope model.</li>
          <li>GitHub remains the production source of truth after commits are pushed and deployment workflows complete.</li>
        </ul>
      </section>
    </section>
  );
}

function scopeBundleForPlan(planId: string): UserScope[] {
  if (planId === 'researcher-seat') {
    return ['public', 'free', 'paid'];
  }

  if (planId === 'studio-seat') {
    return ['public', 'free', 'paid', 'studio'];
  }

  if (planId === 'institution-license') {
    return ['public', 'free', 'paid', 'studio', 'enterprise'];
  }

  return ['public', 'free'];
}

function scopeId(scope: UserScope): string {
  return `scope-${scope.replace(/[A-Z]/g, (letter) => `-${letter.toLocaleLowerCase()}`)}`;
}
