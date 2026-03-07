import { useEffect, useState } from "react";

export default function OllamaStatus() {
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = () => {
      fetch("/api/ollama_status")
        .then((res) => res.json())
        .then(setStatus)
        .catch((e) => setError(String(e)));
    };
    fetchStatus();
    const id = setInterval(fetchStatus, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h2>Ollama Status</h2>
      <p className="mb-4 text-sm text-gray-600">
        Displays the current models loaded into the Ollama runner along with a
        timestamp. This page is intended for quick health checks and monitoring
        which model is actively resident in memory.
      </p>
      <div className="mb-4 bg-yellow-100 p-4 rounded">
        <strong>Optimizations in effect:</strong>
        <ul className="list-disc list-inside mt-2">
          <li>Model is kept resident (`OLLAMA_MAX_LOADED_MODELS=1`).</li>
          <li>Context length capped (e.g. 1 024 tokens) to reduce KV cache.</li>
          <li>Batch size tuned for low‑memory environments.</li>
          <li>Startup warm‑up request fires automatically on backend launch.</li>
        </ul>
      </div>

      {error && <p className="text-red-600">Error: {error}</p>}
      {status ? (
        <div className="overflow-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr>
                <th className="border px-2 py-1">Model</th>
                <th className="border px-2 py-1">Details</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(status.models) &&
                status.models.map((m: any, i: number) => {
                  let name = "";
                  let details = "";
                  if (typeof m === "string") {
                    name = m;
                  } else if (m && typeof m === "object") {
                    name = m.name || m.model || JSON.stringify(m);
                    // optionally show size or context_length
                    if (m.context_length) {
                      details = `ctx=${m.context_length}`;
                    } else if (m.size) {
                      details = `size=${m.size}`;
                    }
                  }
                  return (
                    <tr key={i}>
                      <td className="border px-2 py-1">{name}</td>
                      <td className="border px-2 py-1">{details}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          {status.timestamp && (
            <p className="mt-2 text-sm text-gray-600">
              Last updated: {status.timestamp}
            </p>
          )}
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </main>
  );
}
