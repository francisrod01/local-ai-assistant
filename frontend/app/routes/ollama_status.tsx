import { useEffect, useState } from "react";

export default function OllamaStatus() {
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ollama_status")
      .then((res) => res.json())
      .then(setStatus)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h2>Ollama Status</h2>
      {error && <p className="text-red-600">Error: {error}</p>}
      {status ? (
        <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded">
          {JSON.stringify(status, null, 2)}
        </pre>
      ) : (
        <p>Loading...</p>
      )}
    </main>
  );
}
