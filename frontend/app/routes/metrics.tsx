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
  const [filter, setFilter] = useState("");

  // apply the filter to data (simple substring match on metric name)
  const filteredData = data.filter((m) => m.name.includes(filter));

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h2>Backend Metrics</h2>
      <p className="mb-4 text-sm text-gray-600">
        Prometheus-style telemetry exposed by the backend.  Use the filter to
        narrow down to specific metric names; toggle between a table and a
        simple bar chart for gauges.
      </p>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <ViewToggle view={view} setView={setView} />
        <label className="text-sm">
          Filter:
          <input
            className="ml-2 px-2 py-1 border rounded"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="metric name substring"
          />
        </label>
      </div>

      {error && <p className="text-red-600">Error: {error}</p>}
      {metrics ? (
        view === "table" ? (
          <MetricsTable data={filteredData} />
        ) : (
          <MetricsChart data={filteredData} types={types} />
        )
      ) : (
        <p>Loading...</p>
      )}
    </main>
  );
}
