import { useEffect, useState } from 'react';

type ConfigResponse = {
  fetchedAt: string;
  app: Record<string, string | number>;
  runtime: Record<string, unknown>;
  integrations: Record<string, unknown>;
  features: Record<string, unknown>;
  dataset: Record<string, number>;
};

export function AdminConfigPage() {
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch('/api/admin/config-drilldown');
        if (!response.ok) {
          throw new Error('Could not load admin configuration drilldown.');
        }
        setConfig((await response.json()) as ConfigResponse);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load admin configuration drilldown.');
      }
    }

    void loadConfig();
  }, []);

  return (
    <section className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Admin</p>
        <h1>Configuration Drilldown</h1>
        <p>{error || 'Inspect effective app configuration, runtime posture, integrations, and feature flags.'}</p>
      </header>

      {config ? (
        <>
          <ConfigPanel title="Application" data={config.app} />
          <ConfigPanel title="Runtime" data={config.runtime} />
          <ConfigPanel title="Integrations" data={config.integrations} />
          <ConfigPanel title="Feature Toggles" data={config.features} />
          <ConfigPanel title="Dataset Stats" data={config.dataset} />
        </>
      ) : null}
    </section>
  );
}

function ConfigPanel({ title, data }: { title: string; data: Record<string, unknown> }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <pre className="config-json">{JSON.stringify(data, null, 2)}</pre>
    </section>
  );
}
