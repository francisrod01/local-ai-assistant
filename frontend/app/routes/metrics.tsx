import { useEffect, useState } from "react";
import { parseMetrics } from "../components/metricsParser";
import MetricsTable from "../components/MetricsTable";
import MetricsChart from "../components/MetricsChart";
import ViewToggle from "../components/ViewToggle";

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"table" | "chart">("table");

  useEffect(() => {
    const fetchMetrics = () => {
      fetch("/api/metrics")
        .then((res) => res.text())
        .then(setMetrics)
        .catch((e) => setError(String(e)));
    };
    fetchMetrics();
    const id = setInterval(fetchMetrics, 5000);
    return () => clearInterval(id);
  }, []);

  const { data, types } = parseMetrics(metrics);

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h2>Backend Metrics</h2>
      <div className="mb-4">
        <ViewToggle view={view} setView={setView} />
      </div>

      {error && <p className="text-red-600">Error: {error}</p>}
      {metrics ? (
        view === "table" ? (
          <MetricsTable data={data} />
        ) : (
          <MetricsChart data={data} types={types} />
        )
      ) : (
        <p>Loading...</p>
      )}
    </main>
  );
}
