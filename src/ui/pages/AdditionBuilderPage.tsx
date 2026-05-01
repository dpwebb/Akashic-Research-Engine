import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clipboard, Download, Loader2, Save, ShieldCheck, Sparkles } from 'lucide-react';
import { researchDataset } from '../../shared/researchData.js';
import type { AdditionFramework, Source, SpeculativeAdditionDraft } from '../../shared/types.js';
import { useUserAccess } from '../userAccess.js';

const guardrailItems = [
  'Speculative status is explicit in the title or first paragraph.',
  'No historical or scientific fact is claimed without citation.',
  'Metaphor, testimony, interpretation, and belief are separated.',
  'Counterarguments or weaker explanations are included.',
  'The brief states what would not be justified to claim.',
] as const;

const uncertaintyOptions = [
  'Low speculation: close textual comparison',
  'Medium speculation: interpretive synthesis',
  'High speculation: philosophical or metaphorical extension',
] as const;

export function AdditionBuilderPage() {
  const { accountEmail, accountHeaders, policy } = useUserAccess();
  const [frameworkId, setFrameworkId] = useState(researchDataset.additionFrameworks[0]?.id ?? '');
  const [title, setTitle] = useState('Akashic Records as disciplined symbolic memory');
  const [proposal, setProposal] = useState('');
  const [uncertainty, setUncertainty] = useState<(typeof uncertaintyOptions)[number]>(uncertaintyOptions[1]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>(
    researchDataset.additionFrameworks[0]?.recommendedSourceIds.slice(0, 2) ?? [],
  );
  const [citationsNeeded, setCitationsNeeded] = useState('');
  const [counterarguments, setCounterarguments] = useState('');
  const [notJustified, setNotJustified] = useState('');
  const [checkedGuardrails, setCheckedGuardrails] = useState<Record<string, boolean>>({});
  const [brief, setBrief] = useState('');
  const [drafts, setDrafts] = useState<SpeculativeAdditionDraft[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const framework = useMemo(
    () =>
      researchDataset.additionFrameworks.find((candidate) => candidate.id === frameworkId) ??
      researchDataset.additionFrameworks[0],
    [frameworkId],
  );
  const linkedSources = useMemo(
    () => researchDataset.sources.filter((source) => selectedSourceIds.includes(source.id)),
    [selectedSourceIds],
  );
  const selectedGuardrails = useMemo(
    () => guardrailItems.filter((item) => checkedGuardrails[item]),
    [checkedGuardrails],
  );
  const allGuardrailsChecked = guardrailItems.every((item) => checkedGuardrails[item]);
  const canGenerate =
    policy.canUseAdditionBuilder &&
    title.trim().length >= 8 &&
    proposal.trim().length >= 30 &&
    selectedSourceIds.length > 0 &&
    counterarguments.trim().length >= 20 &&
    notJustified.trim().length >= 20 &&
    allGuardrailsChecked;
  const downloadHref = brief ? `data:text/markdown;charset=utf-8,${encodeURIComponent(brief)}` : '';

  useEffect(() => {
    if (!policy.canUseAdditionBuilder || !accountEmail.trim()) {
      setDrafts([]);
      return;
    }

    let ignore = false;

    async function loadDrafts() {
      try {
        const response = await fetch('/api/addition-builder/drafts', { headers: accountHeaders });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as SpeculativeAdditionDraft[];
        if (!ignore) {
          setDrafts(data);
        }
      } catch {
        if (!ignore) {
          setDrafts([]);
        }
      }
    }

    void loadDrafts();

    return () => {
      ignore = true;
    };
  }, [accountEmail, accountHeaders, policy.canUseAdditionBuilder]);

  function resetGeneratedOutput() {
    setBrief('');
    setSaveMessage('');
  }

  function changeFramework(nextFrameworkId: string) {
    const nextFramework = researchDataset.additionFrameworks.find((candidate) => candidate.id === nextFrameworkId);
    setFrameworkId(nextFrameworkId);
    setSelectedSourceIds(nextFramework?.recommendedSourceIds.slice(0, 2) ?? []);
    resetGeneratedOutput();
  }

  function toggleSource(sourceId: string) {
    setSelectedSourceIds((current) =>
      current.includes(sourceId) ? current.filter((item) => item !== sourceId) : [...current, sourceId],
    );
    resetGeneratedOutput();
  }

  function toggleGuardrail(item: string) {
    setCheckedGuardrails((current) => ({ ...current, [item]: !current[item] }));
    resetGeneratedOutput();
  }

  function generateBrief(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!framework) {
      setError('Select a speculation framework before generating a brief.');
      return;
    }

    if (!canGenerate) {
      setError('Complete the proposal, sources, counterarguments, limits, and guardrail checklist first.');
      return;
    }

    setBrief(
      renderSpeculativeBrief({
        framework,
        title,
        proposal,
        uncertainty,
        sources: linkedSources,
        citationsNeeded,
        counterarguments,
        notJustified,
      }),
    );
    setSaveMessage('');
  }

  async function copyBrief() {
    if (!brief) {
      return;
    }

    await navigator.clipboard.writeText(brief);
    setSaveMessage('Brief copied.');
  }

  async function copyDraft(draft: SpeculativeAdditionDraft) {
    await navigator.clipboard.writeText(draft.briefMarkdown);
    setSaveMessage(`Copied ${draft.title}.`);
  }

  async function saveDraft() {
    setError('');
    setSaveMessage('');

    if (!framework || !brief || !canGenerate) {
      setError('Generate a complete brief before saving it for review.');
      return;
    }

    if (!accountEmail.trim()) {
      setError('Sign in with a Studio, Enterprise, or Beta Tester account email before saving drafts.');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/addition-builder/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...accountHeaders },
        body: JSON.stringify({
          title,
          frameworkId: framework.id,
          uncertainty,
          proposal,
          sourceIds: selectedSourceIds,
          citationsNeeded,
          counterarguments,
          notJustified,
          guardrails: selectedGuardrails,
          briefMarkdown: brief,
          createdByEmail: accountEmail.trim(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Speculative draft could not be saved.');
      }

      const draft = data as SpeculativeAdditionDraft;
      setDrafts((current) => [draft, ...current.filter((item) => item.id !== draft.id)].slice(0, 50));
      setSaveMessage('Draft saved for review.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Speculative draft could not be saved.');
    } finally {
      setIsSaving(false);
    }
  }

  if (!policy.canUseAdditionBuilder) {
    return (
      <section className="page-stack">
        <header className="page-header compact">
          <p className="eyebrow">Realistic Addition Builder</p>
          <h1>Disciplined Speculation</h1>
          <p>Speculative drafting is available to Studio, Enterprise, and Beta Tester accounts.</p>
        </header>
        <section className="panel paywall-panel">
          <AlertTriangle aria-hidden="true" />
          <div>
            <h2>Studio scope required</h2>
            <p>
              The builder creates speculative briefs, so it is held behind the higher review workflow before additions
              can be drafted or exported.
            </p>
            <Link to="/app/billing">Review membership options</Link>
          </div>
        </section>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Realistic Addition Builder</p>
        <h1>Disciplined Speculation</h1>
        <p>Draft new interpretations only when boundaries, citations, counterarguments, and uncertainty are explicit.</p>
      </header>

      <div className="builder-layout">
        <form className="assistant-form builder-form" onSubmit={generateBrief}>
          <label>
            Brief title
            <input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                resetGeneratedOutput();
              }}
              maxLength={160}
            />
          </label>

          <label>
            Framework
            <select value={framework?.id ?? ''} onChange={(event) => changeFramework(event.target.value)}>
              {researchDataset.additionFrameworks.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </select>
          </label>

          {framework && (
            <section className="builder-framework-summary">
              <Sparkles aria-hidden="true" />
              <div>
                <h2>{framework.name}</h2>
                <p>{framework.description}</p>
                <span className="tag">Grade {framework.evidenceGrade}</span>
                <span className="tag">{framework.reviewPriority} review priority</span>
              </div>
            </section>
          )}

          <label>
            Proposed interpretation
            <textarea
              value={proposal}
              onChange={(event) => {
                setProposal(event.target.value);
                resetGeneratedOutput();
              }}
              rows={6}
              maxLength={1800}
              placeholder="Draft the new interpretation in cautious language."
            />
          </label>

          <label>
            Uncertainty level
            <select
              value={uncertainty}
              onChange={(event) => {
                setUncertainty(event.target.value as typeof uncertainty);
                resetGeneratedOutput();
              }}
            >
              {uncertaintyOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="builder-fieldset">
            <legend>Linked source basis</legend>
            <div className="builder-source-list">
              {researchDataset.sources.map((source) => (
                <label className="check-row" key={source.id}>
                  <input
                    type="checkbox"
                    checked={selectedSourceIds.includes(source.id)}
                    onChange={() => toggleSource(source.id)}
                  />
                  <span>
                    {source.title}
                    <small>{source.sourceType} - {source.confidenceLevel} confidence</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label>
            Citations still needed
            <textarea
              value={citationsNeeded}
              onChange={(event) => {
                setCitationsNeeded(event.target.value);
                resetGeneratedOutput();
              }}
              rows={3}
              maxLength={900}
              placeholder="List missing page references, editions, quotations, or source checks."
            />
          </label>

          <label>
            Counterarguments
            <textarea
              value={counterarguments}
              onChange={(event) => {
                setCounterarguments(event.target.value);
                resetGeneratedOutput();
              }}
              rows={4}
              maxLength={1200}
              placeholder="Name weaker explanations, category errors, or reasons this may fail."
            />
          </label>

          <label>
            Not justified to claim
            <textarea
              value={notJustified}
              onChange={(event) => {
                setNotJustified(event.target.value);
                resetGeneratedOutput();
              }}
              rows={4}
              maxLength={1200}
              placeholder="State claims the brief must not make."
            />
          </label>

          <fieldset className="builder-fieldset">
            <legend>Required guardrails</legend>
            <div className="builder-checklist">
              {guardrailItems.map((item) => (
                <label className="check-row" key={item}>
                  <input type="checkbox" checked={Boolean(checkedGuardrails[item])} onChange={() => toggleGuardrail(item)} />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button type="submit" disabled={!canGenerate}>
            <ShieldCheck aria-hidden="true" />
            Generate Brief
          </button>
          {error && <p className="form-error">{error}</p>}
        </form>

        <aside className="source-list builder-side-panel">
          {researchDataset.additionFrameworks.map((candidate) => (
            <article className="framework-card" key={candidate.id}>
              <Sparkles aria-hidden="true" />
              <h2>{candidate.name}</h2>
              <p>{candidate.description}</p>
              <p className="matched-terms">Output rule: {candidate.outputTemplate}</p>
              <ul>
                {candidate.requiredBoundaries.map((boundary) => (
                  <li key={boundary}>{boundary}</li>
                ))}
              </ul>
            </article>
          ))}
        </aside>
      </div>

      {brief && (
        <section className="assistant-output speculative-output">
          <div className="export-preview-header">
            <div>
              <h2>Speculative Addition Brief</h2>
              <p className="muted">Export this as a draft; do not promote it into the verified corpus without review.</p>
            </div>
            <div className="review-actions">
              <button type="button" onClick={copyBrief}>
                <Clipboard aria-hidden="true" />
                Copy
              </button>
              <button type="button" onClick={saveDraft} disabled={isSaving}>
                {isSaving ? <Loader2 aria-hidden="true" /> : <Save aria-hidden="true" />}
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
              <a href={downloadHref} download={`${slugify(title)}-speculative-brief.md`}>
                <Download aria-hidden="true" />
                Download
              </a>
            </div>
          </div>
          {saveMessage && <p className="form-success">{saveMessage}</p>}
          <pre>{brief}</pre>
        </section>
      )}

      <section className="saved-drafts-panel">
        <div className="export-preview-header">
          <div>
            <h2>Saved Speculative Drafts</h2>
            <p className="muted">Drafts remain outside the verified corpus until citation and category review is complete.</p>
          </div>
          <span className="tag">{drafts.length} saved</span>
        </div>

        {!accountEmail.trim() && (
          <p className="form-error">Sign in with the beta tester or a paid Studio/Enterprise account to load saved drafts.</p>
        )}

        {accountEmail.trim() &&
          (drafts.length === 0 ? (
            <p className="muted">No speculative drafts have been saved for this workspace yet.</p>
          ) : (
            <div className="saved-draft-grid">
              {drafts.map((draft) => (
                <article className="index-card saved-draft-card" key={draft.id}>
                  <Sparkles aria-hidden="true" />
                  <h2>{draft.title}</h2>
                  <p>{draft.frameworkName}</p>
                  <p className="matched-terms">
                    {draft.status} - grade {draft.evidenceGrade} - {draft.sourceIds.length} linked sources
                  </p>
                  <small>Saved {new Date(draft.createdAt).toLocaleString()}</small>
                  <div className="review-actions">
                    <button type="button" onClick={() => copyDraft(draft)}>
                      <Clipboard aria-hidden="true" />
                      Copy
                    </button>
                    <a
                      href={`data:text/markdown;charset=utf-8,${encodeURIComponent(draft.briefMarkdown)}`}
                      download={`${slugify(draft.title)}-saved-speculative-brief.md`}
                    >
                      <Download aria-hidden="true" />
                      Download
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ))}
      </section>
    </section>
  );
}

function renderSpeculativeBrief(input: {
  framework: AdditionFramework;
  title: string;
  proposal: string;
  uncertainty: string;
  sources: Source[];
  citationsNeeded: string;
  counterarguments: string;
  notJustified: string;
}): string {
  const linkedSources = input.sources.length
    ? input.sources.map((source) => `- ${source.title}. ${source.author}. ${source.date}. ${source.url}`).join('\n')
    : '- No linked sources selected.';
  const boundaries = input.framework.requiredBoundaries.map((boundary) => `- ${boundary}`).join('\n');
  const disallowedClaims = input.framework.disallowedClaims.map((claim) => `- ${claim}`).join('\n');

  return [
    `# SPECULATIVE ADDITION BRIEF: ${input.title.trim()}`,
    '',
    'Status: SPECULATIVE DRAFT - not verified corpus fact.',
    `Framework: ${input.framework.name}`,
    `Evidence grade: ${input.framework.evidenceGrade}`,
    `Review priority: ${input.framework.reviewPriority}`,
    `Uncertainty: ${input.uncertainty}`,
    '',
    '## Proposed Interpretation',
    input.proposal.trim(),
    '',
    '## Linked Source Basis',
    linkedSources,
    '',
    '## Required Boundaries',
    boundaries,
    '',
    '## Citations Still Needed',
    input.citationsNeeded.trim() || '- Confirm page references, edition metadata, and quotation boundaries before reuse.',
    '',
    '## Counterarguments',
    input.counterarguments.trim(),
    '',
    '## Not Justified To Claim',
    input.notJustified.trim(),
    '',
    '## Disallowed Claims',
    disallowedClaims,
    '',
    '## Promotion Rule',
    'Do not promote this draft into sources, claims, or public outputs until a reviewer verifies citations, resolves category errors, and records a decision note.',
  ].join('\n');
}

function slugify(value: string): string {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'addition';
}
