import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { MetricEntry } from "./metricsParser";

interface Props {
  data: MetricEntry[];
  types: Record<string, string>;
}

export default function MetricsChart({ data, types }: Props) {
  const chartData = Object.values(
    data.reduce((acc, m) => {
      if (types[m.name] === "gauge") {
        acc[m.name] = acc[m.name] || { name: m.name, value: m.value };
        acc[m.name].value = m.value;
      }
      return acc;
    }, {} as Record<string, { name: string; value: number }>)
  );

  return (
    <div style={{ width: "100%", height: 400 }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
