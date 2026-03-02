import React from "react";
import type { MetricEntry } from "./metricsParser";

interface Props {
  data: MetricEntry[];
}

export default function MetricsTable({ data }: Props) {
  return (
    <div className="overflow-auto max-h-[80vh]">
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="border px-2 py-1">Metric</th>
            <th className="border px-2 py-1">Value</th>
            <th className="border px-2 py-1">Labels</th>
          </tr>
        </thead>
        <tbody>
          {data.map((m, idx) => (
            <tr key={idx}>
              <td className="border px-2 py-1">{m.name}</td>
              <td className="border px-2 py-1">{m.value}</td>
              <td className="border px-2 py-1">
                {Object.entries(m.labels)
                  .map(([k, v]) => `${k}=${v}`)
                  .join(",")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
