import { useEffect, useState } from "react";
import { parseMetrics, type MetricEntry } from "../components/metricsParser";
import MetricsTable from "../components/MetricsTable";
import MetricsChart from "../components/MetricsChart";
import MetricsTrendChart from "../components/MetricsTrendChart";
import ViewToggle from "../components/ViewToggle";

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toFixed(2).replace(/\.00$/, "");
}

export default function MetricsPage() {
  const [data, setData] = useState<MetricEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"table" | "chart">("table");
  const [trendWindow, setTrendWindow] = useState<"5m" | "15m" | "1h">("15m");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [history, setHistory] = useState<
    Array<{
      ts: number;
      backendRequests: number;
      llmRequests: number;
      tokens: number;
      knowledgeInserts: number;
      loadedModels: number;
      avgRequestLatencyMs: number;
      avgChromaQueryLatencyMs: number;
    }>
  >([]);

  const isBusinessMetric = (name: string) => {
    const isBusinessNamespace =
      name.startsWith("backend_") ||
      name.startsWith("ollama_") ||
      name.startsWith("chromadb_");
    const isPromMeta = name.endsWith("_created");
    return isBusinessNamespace && !isPromMeta;
  };

  const buildSnapshot = (entries: MetricEntry[], ts: number) => {
    const businessData = entries.filter((m) => isBusinessMetric(m.name));
    const aggregateByName = businessData.reduce((acc, metric) => {
      acc[metric.name] = (acc[metric.name] ?? 0) + metric.value;
      return acc;
    }, {} as Record<string, number>);

    const avgRequestLatencyMs =
      ((aggregateByName["backend_request_latency_seconds_sum"] ?? 0) /
        Math.max(aggregateByName["backend_request_latency_seconds_count"] ?? 0, 1)) *
      1000;

    const avgChromaQueryLatencyMs =
      ((aggregateByName["chromadb_query_duration_seconds_sum"] ?? 0) /
        Math.max(aggregateByName["chromadb_query_duration_seconds_count"] ?? 0, 1)) *
      1000;

    return {
      ts,
      backendRequests: aggregateByName["backend_requests_total"] ?? 0,
      llmRequests: aggregateByName["ollama_requests_total"] ?? 0,
      tokens: aggregateByName["backend_tokens_total"] ?? 0,
      knowledgeInserts: aggregateByName["chromadb_vector_insertions_total"] ?? 0,
      loadedModels: aggregateByName["ollama_models_loaded"] ?? 0,
      avgRequestLatencyMs: Number.isFinite(avgRequestLatencyMs)
        ? avgRequestLatencyMs
        : 0,
      avgChromaQueryLatencyMs: Number.isFinite(avgChromaQueryLatencyMs)
        ? avgChromaQueryLatencyMs
        : 0,
    };
  };

  useEffect(() => {
    const fetchMetrics = () => {
      fetch("/api/metrics")
        .then(async (res) => {
          const body = await res.text();
          const parsed = parseMetrics(body);
          const headerDate = res.headers.get("date");
          const ts = headerDate ? new Date(headerDate).getTime() : Date.now();
          setLastUpdated(new Date(ts));
          setData(parsed.data);
          const snapshot = buildSnapshot(parsed.data, ts);
          setHistory((prev) => [...prev, snapshot].slice(-720));
        })
        .catch((e) => setError(String(e)));
    };
    fetchMetrics();
    const id = setInterval(fetchMetrics, 5000);
    return () => clearInterval(id);
  }, []);

  const [filter, setFilter] = useState("");
  const businessData = data.filter((m) => isBusinessMetric(m.name));

  const latestSnapshot =
    history.length > 0 ? history[history.length - 1] : buildSnapshot(data, Date.now());

  const kpis = [
    { key: "backend_requests_total", label: "Backend Requests", value: latestSnapshot.backendRequests },
    { key: "ollama_requests_total", label: "LLM Requests", value: latestSnapshot.llmRequests },
    { key: "backend_tokens_total", label: "Tokens Generated", value: latestSnapshot.tokens },
    { key: "chromadb_vector_insertions_total", label: "Knowledge Inserts", value: latestSnapshot.knowledgeInserts },
    { key: "ollama_models_loaded", label: "Loaded Models", value: latestSnapshot.loadedModels },
    { key: "backend_request_latency_avg_ms", label: "Avg Request Latency (ms)", value: latestSnapshot.avgRequestLatencyMs },
    {
      key: "chromadb_query_latency_avg_ms",
      label: "Avg Chroma Latency (ms)",
      value: latestSnapshot.avgChromaQueryLatencyMs,
    },
  ];

  const chartData = kpis.map((kpi) => ({ name: kpi.label, value: kpi.value }));

  const trendWindowPoints: Record<"5m" | "15m" | "1h", number> = {
    "5m": 60,
    "15m": 180,
    "1h": 720,
  };

  const trendData = history
    .map((point, idx) => {
      if (idx === 0) return null;
      const prev = history[idx - 1];
      const timestamp = new Date(point.ts);
      return {
        time: timestamp.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timeFull: timestamp.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        backendRequests: Math.max(0, point.backendRequests - prev.backendRequests),
        llmRequests: Math.max(0, point.llmRequests - prev.llmRequests),
        knowledgeInserts: Math.max(
          0,
          point.knowledgeInserts - prev.knowledgeInserts,
        ),
      };
    })
    .filter((point): point is { time: string; timeFull: string; backendRequests: number; llmRequests: number; knowledgeInserts: number } => point !== null)
    .slice(-trendWindowPoints[trendWindow]);

  // table excludes histogram internals and keeps business metrics with labels
  const filteredData = businessData.filter(
    (m) =>
      !m.name.endsWith("_bucket") &&
      !m.name.endsWith("_sum") &&
      !m.name.endsWith("_count") &&
      m.name.includes(filter),
  );

  return (
    <main className="pt-[30px] p-4 container mx-auto">
      <h2>Backend Metrics</h2>
      <p className="mb-4 text-sm text-gray-600">
        Business-focused telemetry snapshot from backend, LLM usage, and vector
        knowledge operations. Technical Prometheus internals (for example
        <code>_created</code> series) are excluded from this view.
      </p>
      <p className="mb-4 text-sm text-gray-600">
        Last updated: {lastUpdated ? lastUpdated.toLocaleString() : "Loading..."}
      </p>

      <section className="mb-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-3 xl:col-span-2">
          {kpis.map((kpi) => (
            <article key={kpi.key} className="rounded border p-2.5 bg-white">
              <p className="text-xs text-gray-500">{kpi.label}</p>
              <p className="text-base font-semibold">{formatNumber(kpi.value)}</p>
            </article>
          ))}
        </div>
        <section className="rounded border p-3 bg-white lg:col-span-9 xl:col-span-10">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-medium">Recent Activity Trend</h3>
              <p className="text-xs text-gray-600">
                Per-refresh deltas (every ~5s) for business events.
              </p>
            </div>
            <label className="text-sm text-gray-700">
              Window
              <select
                className="ml-2 rounded border px-2 py-1"
                value={trendWindow}
                onChange={(e) =>
                  setTrendWindow(e.target.value as "5m" | "15m" | "1h")
                }
              >
                <option value="5m">Last 5m</option>
                <option value="15m">Last 15m</option>
                <option value="1h">Last 1h</option>
              </select>
            </label>
          </div>
          <MetricsTrendChart data={trendData} />
        </section>
      </section>

      {error && <p className="text-red-600">Error: {error}</p>}
      <section className="rounded border p-3 bg-white">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <label className="text-sm">
            Filter:
            <input
              className="ml-2 px-2 py-1 border rounded"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="metric name substring"
            />
          </label>
          <div className="ml-auto">
            <ViewToggle view={view} setView={setView} />
          </div>
        </div>

        {data.length > 0 ? (
          view === "table" ? (
            <MetricsTable data={filteredData} />
          ) : (
            <MetricsChart data={chartData} />
          )
        ) : (
          <p>Loading...</p>
        )}
      </section>
    </main>
  );
}
