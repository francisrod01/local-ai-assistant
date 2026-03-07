import React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TrendPoint = {
  time: string;
  timeFull: string;
  backendRequests: number;
  llmRequests: number;
  knowledgeInserts: number;
};

interface Props {
  data: TrendPoint[];
}

export default function MetricsTrendChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-600">Collecting trend data…</p>;
  }

  return (
    <div className="h-[380px] w-full lg:h-[440px]">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 16, right: 24, bottom: 12, left: 18 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" padding={{ left: 12, right: 12 }} minTickGap={24} />
          <YAxis allowDecimals={false} />
          <Tooltip
            labelFormatter={(
              label: string | number,
              payload: Array<{ payload: TrendPoint }>,
            ) => {
              if (payload && payload.length > 0) {
                return payload[0].payload.timeFull;
              }
              return label;
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="backendRequests" name="Backend requests" stroke="#1d4ed8" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="llmRequests" name="LLM requests" stroke="#7c3aed" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="knowledgeInserts" name="Knowledge inserts" stroke="#059669" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
