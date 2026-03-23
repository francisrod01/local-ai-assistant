import { useEffect, useState } from "react";

import { createPageTitle } from "../utils/meta";
import VariableTable from "../components/environment/VariableTable";
import PageHeader from "../components/PageHeader";

export function meta() {
  return createPageTitle("Environment");
}

export default function EnvironmentPage() {
  const [env, setEnv] = useState<any>(null);
  const [runtimeSettings, setRuntimeSettings] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/environment")
      .then((res) => res.json())
      .then(setEnv)
      .catch((e) => setError(String(e)));

    fetch("/api/ollama_runtime_settings")
      .then((res) => res.json())
      .then(setRuntimeSettings)
      .catch(() => setRuntimeSettings(null));
  }, []);

  return (
    <main className="pt-7.5 p-4 container mx-auto">
      <PageHeader
        title="Ollama Environment"
        description="Shows the configuration environment variables used by the Ollama service."
      />
      {runtimeSettings && (
        <section className="mb-4 rounded border p-3">
          <h3 className="mb-2 font-medium">Runtime Settings</h3>
          <div className="grid gap-1 text-sm">
            <p>
              <strong>Request timeout:</strong>{" "}
              {runtimeSettings.request_timeout_seconds}s
            </p>
            <p>
              <strong>Stream connect timeout:</strong>{" "}
              {runtimeSettings.stream_connect_timeout_seconds}s
            </p>
            <p>
              <strong>Stream read timeout:</strong>{" "}
              {runtimeSettings.stream_read_timeout_disabled
                ? "disabled"
                : `${runtimeSettings.stream_read_timeout_seconds}s`}
            </p>
            <p>
              <strong>Warmup timeout:</strong>{" "}
              {runtimeSettings.warmup_timeout_seconds}s
            </p>
            <p>
              <strong>Keep alive:</strong> {runtimeSettings.keep_alive}
            </p>
          </div>
        </section>
      )}
      {error && <p className="text-red-600">Error: {error}</p>}
      {env ? (
        <VariableTable env={env} />
      ) : (
        <p>Loading...</p>
      )}
    </main>
  );
}
