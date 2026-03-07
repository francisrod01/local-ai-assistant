import { useEffect, useState } from "react";

export default function LogsPage() {
  const [lines, setLines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/ollama_logs");
        const data = await res.json();
        const newLines: string[] = data.logs || [];
        setLines((old) => {
          if (old.length === 0) {
            return newLines;
          }
          // append only those not already in the history to avoid
          // resetting when the backend returns full tail each time
          const setOld = new Set(old);
          const appended = newLines.filter((l) => !setOld.has(l));
          return old.concat(appended);
        });
      } catch (e: any) {
        setError(String(e));
      }
    };
    fetchLogs();
    const id = setInterval(fetchLogs, 2000); // poll every 2s for snappier updates
    return () => clearInterval(id);
  }, []);

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h2>Ollama Logs</h2>
      <p className="mb-4 text-sm text-gray-600">
        Displays the most recent lines from the Ollama container's log (via
        <code>docker logs</code>).  Helpful when diagnosing startup delays,
        errors, or other runtime messages.
      </p>
      {error && <p className="text-red-600">Error: {error}</p>}
      {lines.length === 0 ? (
        <p className="text-gray-600">
          No logs available – the backend may not have access to the Docker
          daemon.  Ensure `/var/run/docker.sock` is mounted into the backend
          container or run the app on the host.
        </p>
      ) : (
        <div className="bg-gray-100 p-4 rounded max-h-[80vh] overflow-auto font-mono text-xs">
          {lines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}
    </main>
  );
}
