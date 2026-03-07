import { useEffect, useState } from "react";
import VariableTable from "../components/environment/VariableTable";

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
    <main className="pt-[30px] p-4 container mx-auto">
      <h2>Ollama Environment</h2>
      <p className="mb-4 text-sm text-gray-600">
        Shows the configuration environment variables used by the Ollama
        service (OLLAMA_*), along with PATH/HOME, currently loaded models
        (`models`), and all pulled models available in Ollama (`all_models`).
        Useful for verifying that tuning variables are set correctly.
      </p>
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
