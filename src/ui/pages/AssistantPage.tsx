import { promptTemplates } from '../../shared/promptTemplates.js';
import { FormEvent, useState } from 'react';

export function AssistantPage() {
  const [templateId, setTemplateId] = useState(promptTemplates[0]?.id ?? '');
  const [userInput, setUserInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setOutput('');
    setIsGenerating(true);

    try {
      const response = await fetch('/api/assistant/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, userInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Assistant generation failed.');
      }

      setOutput(data.output ?? '');
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'Assistant generation failed.');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">AI Research Assistant</p>
        <h1>Prompt Templates</h1>
        <p>Assistant outputs must preserve source boundaries and clearly mark speculation.</p>
      </header>

      <form className="assistant-form" onSubmit={generate}>
        <label>
          Template
          <select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
            {promptTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Research material
          <textarea
            value={userInput}
            onChange={(event) => setUserInput(event.target.value)}
            minLength={10}
            maxLength={6000}
            rows={8}
            placeholder="Paste source notes, URLs, claims, or comparison material here."
          />
        </label>
        <button type="submit" disabled={isGenerating || userInput.trim().length < 10}>
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
        {error && <p className="form-error">{error}</p>}
      </form>

      {output && (
        <section className="assistant-output">
          <h2>Assistant Output</h2>
          <pre>{output}</pre>
        </section>
      )}

      <div className="template-grid">
        {promptTemplates.map((template) => (
          <article className="template-card" key={template.id}>
            <h2>{template.name}</h2>
            <p>{template.purpose}</p>
            <pre>{template.template}</pre>
          </article>
        ))}
      </div>
    </section>
  );
}
