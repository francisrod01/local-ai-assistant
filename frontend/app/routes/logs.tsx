import { useEffect, useState } from "react";

import { createPageTitle } from "../utils/meta";
import PageHeader from "../components/PageHeader";

export function meta() {
  return createPageTitle("Logs");
}

export default function LogsPage() {
  const [lines, setLines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importantOnly, setImportantOnly] = useState(true);

  useEffect(() => {
    setLines([]);
    setError(null);

    const fetchLogs = async () => {
      try {
        const res = await fetch(
          `/api/ollama_logs?important_only=${importantOnly ? "true" : "false"}`,
        );
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
  }, [importantOnly]);

  return (
    <main className="pt-[30px] p-4 container mx-auto">
      <PageHeader
        title="Ollama Logs"
        description="Log view with shared logo/branding, consistent with the other pages."
      />
      <p className="mb-4 text-sm text-gray-600">
        Displays model-relevant lines from the Ollama container's log (via
        <code>docker logs</code>), while suppressing noisy polling entries like
        <code>/api/ps</code>.<br />Helpful when diagnosing model loads, warnings,
        errors, and generation behavior.
      </p>
      {error && <p className="text-red-600">Error: {error}</p>}
      <section className="flex flex-col gap-3 md:flex-row md:items-start">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs text-gray-600">Active mode:</span>
            <span
              aria-live="polite"
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${importantOnly ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-800"}`}
            >
              {importantOnly ? "Important logs" : "All logs"}
            </span>
          </div>
          {lines.length === 0 ? (
            <p className="text-gray-600">
              No logs available – the backend may not have access to the Docker
              daemon. Ensure `/var/run/docker.sock` is mounted into the backend
              container or run the app on the host.
            </p>
          ) : (
            <div className="bg-gray-100 p-4 rounded max-h-[80vh] overflow-auto font-mono text-xs">
              {lines.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          )}
        </div>

        <aside className="md:w-64 md:sticky md:top-20 shrink-0 rounded border p-3 bg-white">
          <h3 className="text-sm font-semibold">Controls</h3>
          <div className="mt-2 inline-flex overflow-hidden rounded border text-sm">
            <button
              type="button"
              aria-pressed={importantOnly}
              className={`px-3 py-1 ${importantOnly ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}
              onClick={() => setImportantOnly(true)}
            >
              Important
            </button>
            <button
              type="button"
              aria-pressed={!importantOnly}
              className={`px-3 py-1 border-l ${!importantOnly ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}
              onClick={() => setImportantOnly(false)}
            >
              All
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-600">
            {importantOnly
              ? "Showing model-relevant warnings, errors, load, and generation logs."
              : "Showing all container log lines, including frequent health/polling entries."}
          </p>
          <p className="mt-2 text-xs text-gray-600">Visible lines: {lines.length}</p>
        </aside>
      </section>
    </main>
  );
}
