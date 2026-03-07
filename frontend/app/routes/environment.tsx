import { useEffect, useState } from "react";
import VariableTable from "../components/environment/VariableTable";

export default function EnvironmentPage() {
  const [env, setEnv] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/environment")
      .then((res) => res.json())
      .then(setEnv)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h2>Ollama Environment</h2>
      <p className="mb-4 text-sm text-gray-600">
        Shows the configuration environment variables used by the Ollama
        service (OLLAMA_*), along with PATH/HOME and a list of models pulled
        from the runner.  Useful for verifying that tuning variables are set
        correctly.
      </p>
      {error && <p className="text-red-600">Error: {error}</p>}
      {env ? (
        <VariableTable env={env} />
      ) : (
        <p>Loading...</p>
      )}
    </main>
  );
}
