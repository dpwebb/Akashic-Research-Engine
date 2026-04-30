import { promptTemplates } from '../../shared/promptTemplates.js';

export function AssistantPage() {
  return (
    <section className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">AI Research Assistant</p>
        <h1>Prompt Templates</h1>
        <p>Assistant outputs must preserve source boundaries and clearly mark speculation.</p>
      </header>

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
